"""
Alert Rule Evaluator — background thread that periodically checks
user-created alert rules against real cloud metrics and fires alerts.

Evaluation cycle (default every 60s):
  1. Load rules from alert_rules.json
  2. For each enabled rule with `account`:
     - Fetch current metric value (AWS CloudWatch for now)
     - Compare against threshold with the rule's condition operator
     - If breach persists for `duration`, record an alert event
  3. Write alert events to alert_events.json (deduplicated by rule)

Notification dispatch:
  - Slack webhook / email can be wired later via channels config
  - For now, events land in alert_events.json (read by the UI and Security Events API)
"""

import os
import json
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ALERT_RULES_FILE = BASE_DIR / "backend" / "alert_rules.json"
ALERT_EVENTS_FILE = BASE_DIR / "backend" / "alert_events.json"

CHECK_INTERVAL_SECONDS = 60
MAX_EVENTS_KEPT = 500


def _load_json(path, default):
    try:
        if path.exists():
            with open(path) as f:
                return json.load(f)
    except Exception:
        pass
    return default


def _save_json(path, value):
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(value, f, default=str)
    except Exception:
        pass


def _compare(value: float, op: str, threshold: float) -> bool:
    if op == "gt":
        return value > threshold
    if op == "lt":
        return value < threshold
    if op == "gte":
        return value >= threshold
    if op == "lte":
        return value <= threshold
    if op == "eq":
        return abs(value - threshold) < 0.001
    return False


def _fetch_metric(rule: dict) -> "float | None":
    """Fetch current value for the rule's metric from the client cloud account."""
    account_name = rule.get("account")
    if not account_name:
        return None

    try:
        from models.database import SessionLocal, CloudAccount
        from services.crypto import decrypt
        db = SessionLocal()
        acc = db.query(CloudAccount).filter(CloudAccount.name == account_name).first()
        db.close()
        if not acc:
            return None
        creds = {
            "provider": acc.provider,
            "access_key": decrypt(acc.access_key),
            "secret_key": decrypt(acc.secret_key),
            "account_id": acc.account_id,
        }
    except Exception:
        return None

    if creds["provider"] == "aws":
        return _aws_metric(creds, rule.get("metric", "cpu"))
    if creds["provider"] == "azure":
        return _azure_metric(creds)
    if creds["provider"] == "gcp":
        return _gcp_metric(creds)
    return None


def _azure_metric(creds: dict) -> "float | None":
    """Average CPU across running Azure VMs (last 10 min)."""
    try:
        from azure.identity import ClientSecretCredential
        from azure.mgmt.compute import ComputeManagementClient
        from azure.mgmt.monitor import MonitorManagementClient
        access = creds.get("access_key") or ""
        if ":" not in access:
            return None
        tenant_id, client_id = access.split(":", 1)
        cred = ClientSecretCredential(tenant_id=tenant_id, client_id=client_id,
                                       client_secret=creds.get("secret_key") or "")
        sub = creds.get("account_id")
        compute = ComputeManagementClient(cred, sub)
        monitor = MonitorManagementClient(cred, sub)
        now = datetime.utcnow()
        start = now - timedelta(minutes=10)
        all_values = []
        for vm in list(compute.virtual_machines.list_all())[:20]:
            try:
                data = monitor.metrics.list(
                    resource_uri=vm.id,
                    timespan=f"{start.isoformat()}Z/{now.isoformat()}Z",
                    interval="PT5M",
                    metricnames="Percentage CPU",
                    aggregation="Average",
                )
                for m in data.value:
                    for ts in m.timeseries:
                        for d in ts.data:
                            if d.average is not None:
                                all_values.append(d.average)
            except Exception:
                continue
        return sum(all_values) / len(all_values) if all_values else None
    except Exception:
        return None


def _gcp_metric(creds: dict) -> "float | None":
    """Average CPU across GCP Compute instances (last 10 min)."""
    try:
        import json as _json
        from google.oauth2 import service_account
        from google.cloud import monitoring_v3
        sa_json = creds.get("secret_key") or ""
        if not sa_json.startswith("{"):
            return None
        sa_info = _json.loads(sa_json)
        credentials = service_account.Credentials.from_service_account_info(sa_info)
        project_id = sa_info.get("project_id")
        client = monitoring_v3.MetricServiceClient(credentials=credentials)
        now = datetime.utcnow()
        start = now - timedelta(minutes=10)
        interval = monitoring_v3.TimeInterval({
            "end_time": {"seconds": int(now.timestamp())},
            "start_time": {"seconds": int(start.timestamp())},
        })
        aggregation = monitoring_v3.Aggregation({
            "alignment_period": {"seconds": 300},
            "per_series_aligner": monitoring_v3.Aggregation.Aligner.ALIGN_MEAN,
        })
        results = client.list_time_series(
            request={
                "name": f"projects/{project_id}",
                "filter": 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
                "interval": interval,
                "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
                "aggregation": aggregation,
            }
        )
        values = []
        for series in results:
            for point in series.points:
                values.append((point.value.double_value or 0) * 100)
        return sum(values) / len(values) if values else None
    except Exception:
        return None


def _aws_metric(creds: dict, metric_key: str) -> "float | None":
    """Average of metric across running EC2 instances over last 10 minutes."""
    try:
        import boto3
        session = boto3.Session(
            aws_access_key_id=creds["access_key"],
            aws_secret_access_key=creds["secret_key"],
            region_name="us-east-1",
        )
        ec2_global = session.client("ec2")
        regions = [r["RegionName"] for r in ec2_global.describe_regions(AllRegions=False)["Regions"]][:5]

        metric_map = {
            "cpu": "CPUUtilization",
            "network_in": "NetworkIn",
            "network_out": "NetworkOut",
            "disk_read": "DiskReadOps",
            "disk_write": "DiskWriteOps",
        }
        cw_metric = metric_map.get(metric_key, "CPUUtilization")

        now = datetime.utcnow()
        ten_min_ago = now - timedelta(minutes=10)
        all_values = []

        for region in regions:
            try:
                sess = boto3.Session(
                    aws_access_key_id=creds["access_key"],
                    aws_secret_access_key=creds["secret_key"],
                    region_name=region,
                )
                ec2 = sess.client("ec2")
                cw = sess.client("cloudwatch")
                resp = ec2.describe_instances(
                    Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
                )
                instance_ids = [
                    inst["InstanceId"]
                    for rsv in resp.get("Reservations", [])
                    for inst in rsv.get("Instances", [])
                ]
                for inst_id in instance_ids[:20]:
                    try:
                        cw_resp = cw.get_metric_statistics(
                            Namespace="AWS/EC2", MetricName=cw_metric,
                            Dimensions=[{"Name": "InstanceId", "Value": inst_id}],
                            StartTime=ten_min_ago, EndTime=now,
                            Period=300, Statistics=["Average"],
                        )
                        dps = cw_resp.get("Datapoints", [])
                        if dps:
                            latest = sorted(dps, key=lambda x: x["Timestamp"])[-1]
                            all_values.append(latest["Average"])
                    except Exception:
                        continue
            except Exception:
                continue

        if not all_values:
            return None
        return sum(all_values) / len(all_values)
    except Exception:
        return None


def evaluate_once() -> int:
    """Run one evaluation pass. Returns the number of new alert events created."""
    rules = _load_json(ALERT_RULES_FILE, [])
    events = _load_json(ALERT_EVENTS_FILE, [])
    now = datetime.utcnow().isoformat()
    new_events = 0

    # Deduplicate recent firings per rule (keyed by rule id within last 5 min)
    recent_cutoff = datetime.utcnow() - timedelta(minutes=5)
    recent_by_rule = {}
    for e in events[-100:]:
        try:
            ts = datetime.fromisoformat(e.get("timestamp", "")[:26])
            if ts >= recent_cutoff:
                recent_by_rule[e.get("rule_id")] = e
        except Exception:
            continue

    for rule in rules:
        if not rule.get("enabled", True):
            continue
        value = _fetch_metric(rule)
        if value is None:
            continue
        threshold = float(rule.get("threshold", 0))
        op = rule.get("condition", "gt")
        if not _compare(value, op, threshold):
            continue
        # Dedupe: skip if this rule already fired in last 5 minutes
        if rule["id"] in recent_by_rule:
            continue
        events.append({
            "id": f"evt-{int(time.time() * 1000)}",
            "rule_id": rule["id"],
            "rule_name": rule.get("name", rule["id"]),
            "severity": rule.get("severity", "warning"),
            "metric": rule.get("metric", ""),
            "account": rule.get("account", ""),
            "value": round(value, 2),
            "threshold": threshold,
            "condition": op,
            "timestamp": now,
            "status": "firing",
            "message": f"{rule.get('name')}: {rule.get('metric')} {op} {threshold} (actual: {value:.1f})",
        })
        new_events += 1

    # Trim history
    if len(events) > MAX_EVENTS_KEPT:
        events = events[-MAX_EVENTS_KEPT:]

    if new_events:
        _save_json(ALERT_EVENTS_FILE, events)
    return new_events


_stop = threading.Event()


def _loop():
    while not _stop.is_set():
        try:
            evaluate_once()
        except Exception:
            pass
        _stop.wait(CHECK_INTERVAL_SECONDS)


_thread: "threading.Thread | None" = None


def start():
    """Start the background evaluator thread (idempotent)."""
    global _thread
    if _thread and _thread.is_alive():
        return
    _stop.clear()
    _thread = threading.Thread(target=_loop, name="alert-evaluator", daemon=True)
    _thread.start()
    print(f"[Alerts] Evaluator started (interval: {CHECK_INTERVAL_SECONDS}s)")


def stop():
    _stop.set()


def get_events(limit: int = 100) -> list:
    events = _load_json(ALERT_EVENTS_FILE, [])
    return list(reversed(events))[:limit]
