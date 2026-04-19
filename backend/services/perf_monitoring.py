"""
Deep performance monitoring — pulls metrics from cloud load balancers,
databases, and serverless functions. Uses existing cloud credentials,
no client-side agents.

AWS implemented first; Azure/GCP return stubs for now (same pattern
as other endpoints — real data when we wire in later).
"""

import time as _time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed


# ══════════════════════════════════════════════════════════════════
# AWS — Application Load Balancers
# ══════════════════════════════════════════════════════════════════
def list_aws_load_balancers(creds: dict) -> list:
    import boto3
    session = boto3.Session(
        aws_access_key_id=creds["access_key"],
        aws_secret_access_key=creds["secret_key"],
        region_name="us-east-1",
    )
    try:
        regions = [r["RegionName"] for r in session.client("ec2").describe_regions(AllRegions=False)["Regions"]][:10]
    except Exception:
        return []

    now = datetime.utcnow()
    start = now - timedelta(minutes=10)
    lbs = []

    def _region(region):
        try:
            sess = boto3.Session(
                aws_access_key_id=creds["access_key"],
                aws_secret_access_key=creds["secret_key"],
                region_name=region,
            )
            elbv2 = sess.client("elbv2")
            cw = sess.client("cloudwatch")
            out = []
            for lb in elbv2.describe_load_balancers().get("LoadBalancers", []):
                lb_name = lb["LoadBalancerName"]
                lb_arn = lb["LoadBalancerArn"]
                # ALB metric dimension is stripped ARN
                # Format: app/<name>/<hash> — pulled from ARN
                try:
                    dim_value = lb_arn.split(":loadbalancer/")[-1]
                except Exception:
                    dim_value = lb_name
                dims = [{"Name": "LoadBalancer", "Value": dim_value}]

                def _m(metric, stat="Average"):
                    try:
                        r = cw.get_metric_statistics(
                            Namespace="AWS/ApplicationELB", MetricName=metric,
                            Dimensions=dims, StartTime=start, EndTime=now,
                            Period=300, Statistics=[stat],
                        )
                        dps = r.get("Datapoints", [])
                        if dps:
                            return sorted(dps, key=lambda x: x["Timestamp"])[-1][stat]
                    except Exception:
                        pass
                    return None

                req = _m("RequestCount", "Sum") or 0
                p95 = _m("TargetResponseTime", "Average")
                p95 = round(p95 * 1000, 1) if p95 is not None else None  # seconds → ms
                err4xx = _m("HTTPCode_Target_4XX_Count", "Sum") or 0
                err5xx = _m("HTTPCode_Target_5XX_Count", "Sum") or 0
                healthy = _m("HealthyHostCount", "Average")
                unhealthy = _m("UnHealthyHostCount", "Average") or 0
                total_errors = err4xx + err5xx
                error_rate = round((total_errors / req) * 100, 2) if req > 0 else 0
                status = "critical" if err5xx > 5 or error_rate > 5 else ("warning" if error_rate > 1 else "healthy")
                out.append({
                    "id": lb_arn, "name": lb_name, "type": lb.get("Type"),
                    "scheme": lb.get("Scheme"), "region": region,
                    "state": (lb.get("State") or {}).get("Code"),
                    "request_count": int(req),
                    "latency_ms": p95,
                    "error_4xx": int(err4xx),
                    "error_5xx": int(err5xx),
                    "error_rate_pct": error_rate,
                    "healthy_hosts": int(healthy) if healthy is not None else None,
                    "unhealthy_hosts": int(unhealthy),
                    "status": status,
                })
            return out
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=min(8, len(regions))) as pool:
        for fut in as_completed([pool.submit(_region, r) for r in regions]):
            try:
                lbs.extend(fut.result(timeout=30))
            except Exception:
                continue
    return lbs


# ══════════════════════════════════════════════════════════════════
# AWS — RDS Databases
# ══════════════════════════════════════════════════════════════════
def list_aws_databases(creds: dict) -> list:
    import boto3
    session = boto3.Session(
        aws_access_key_id=creds["access_key"],
        aws_secret_access_key=creds["secret_key"],
        region_name="us-east-1",
    )
    try:
        regions = [r["RegionName"] for r in session.client("ec2").describe_regions(AllRegions=False)["Regions"]][:10]
    except Exception:
        return []

    now = datetime.utcnow()
    start = now - timedelta(minutes=10)
    dbs = []

    def _region(region):
        try:
            sess = boto3.Session(
                aws_access_key_id=creds["access_key"],
                aws_secret_access_key=creds["secret_key"],
                region_name=region,
            )
            rds = sess.client("rds")
            cw = sess.client("cloudwatch")
            out = []
            for db in rds.describe_db_instances().get("DBInstances", []):
                db_id = db["DBInstanceIdentifier"]
                dims = [{"Name": "DBInstanceIdentifier", "Value": db_id}]

                def _m(metric, stat="Average"):
                    try:
                        r = cw.get_metric_statistics(
                            Namespace="AWS/RDS", MetricName=metric,
                            Dimensions=dims, StartTime=start, EndTime=now,
                            Period=300, Statistics=[stat],
                        )
                        dps = r.get("Datapoints", [])
                        if dps:
                            return sorted(dps, key=lambda x: x["Timestamp"])[-1][stat]
                    except Exception:
                        pass
                    return None

                cpu = _m("CPUUtilization")
                connections = _m("DatabaseConnections")
                free_storage = _m("FreeStorageSpace")
                read_iops = _m("ReadIOPS") or 0
                write_iops = _m("WriteIOPS") or 0
                replica_lag = _m("ReplicaLag")

                status = "healthy"
                if cpu and cpu > 85:
                    status = "critical"
                elif cpu and cpu > 70:
                    status = "warning"

                out.append({
                    "id": db["DBInstanceArn"], "name": db_id,
                    "engine": db.get("Engine"), "engine_version": db.get("EngineVersion"),
                    "class": db.get("DBInstanceClass"), "region": region,
                    "status": db.get("DBInstanceStatus"),
                    "cpu_pct": round(cpu, 1) if cpu is not None else None,
                    "connections": int(connections) if connections is not None else None,
                    "free_storage_gb": round(free_storage / (1024 ** 3), 2) if free_storage else None,
                    "read_iops": round(read_iops, 1),
                    "write_iops": round(write_iops, 1),
                    "replica_lag_s": replica_lag,
                    "public": db.get("PubliclyAccessible", False),
                    "encrypted": db.get("StorageEncrypted", False),
                    "multi_az": db.get("MultiAZ", False),
                    "perf_status": status,
                })
            return out
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=min(8, len(regions))) as pool:
        for fut in as_completed([pool.submit(_region, r) for r in regions]):
            try:
                dbs.extend(fut.result(timeout=30))
            except Exception:
                continue
    return dbs


# ══════════════════════════════════════════════════════════════════
# AWS — Lambda Functions
# ══════════════════════════════════════════════════════════════════
def list_aws_functions(creds: dict) -> list:
    import boto3
    session = boto3.Session(
        aws_access_key_id=creds["access_key"],
        aws_secret_access_key=creds["secret_key"],
        region_name="us-east-1",
    )
    try:
        regions = [r["RegionName"] for r in session.client("ec2").describe_regions(AllRegions=False)["Regions"]][:10]
    except Exception:
        return []

    now = datetime.utcnow()
    start = now - timedelta(hours=1)
    fns = []

    def _region(region):
        try:
            sess = boto3.Session(
                aws_access_key_id=creds["access_key"],
                aws_secret_access_key=creds["secret_key"],
                region_name=region,
            )
            lam = sess.client("lambda")
            cw = sess.client("cloudwatch")
            out = []
            paginator = lam.get_paginator("list_functions")
            names = []
            for page in paginator.paginate(PaginationConfig={"MaxItems": 200}):
                for fn in page.get("Functions", []):
                    names.append({
                        "name": fn["FunctionName"], "arn": fn["FunctionArn"],
                        "runtime": fn.get("Runtime", ""), "memory": fn.get("MemorySize", 0),
                        "timeout": fn.get("Timeout", 0),
                    })

            # Batch CloudWatch for all functions
            if not names:
                return []
            queries = []
            for idx, fn in enumerate(names[:200]):
                for metric, stat in [("Invocations", "Sum"), ("Errors", "Sum"),
                                      ("Duration", "Average"), ("Throttles", "Sum")]:
                    qid = f"f{idx}_{metric[:3].lower()}"
                    queries.append({
                        "Id": qid,
                        "MetricStat": {
                            "Metric": {"Namespace": "AWS/Lambda", "MetricName": metric,
                                       "Dimensions": [{"Name": "FunctionName", "Value": fn["name"]}]},
                            "Period": 3600, "Stat": stat,
                        },
                        "ReturnData": True,
                    })
            results = {}
            try:
                # 500-query limit per call
                for i in range(0, len(queries), 500):
                    chunk = queries[i:i+500]
                    resp = cw.get_metric_data(MetricDataQueries=chunk, StartTime=start, EndTime=now)
                    for r in resp.get("MetricDataResults", []):
                        vals = r.get("Values", [])
                        results[r["Id"]] = vals[0] if vals else 0
            except Exception:
                pass

            for idx, fn in enumerate(names[:200]):
                inv = results.get(f"f{idx}_inv", 0) or 0
                err = results.get(f"f{idx}_err", 0) or 0
                dur = results.get(f"f{idx}_dur", 0) or 0
                thr = results.get(f"f{idx}_thr", 0) or 0
                error_rate = round((err / inv) * 100, 2) if inv > 0 else 0
                status = "critical" if error_rate > 5 else ("warning" if error_rate > 1 or thr > 0 else "healthy")
                out.append({
                    "id": fn["arn"], "name": fn["name"], "region": region,
                    "runtime": fn["runtime"], "memory_mb": fn["memory"], "timeout_s": fn["timeout"],
                    "invocations": int(inv), "errors": int(err),
                    "avg_duration_ms": round(dur, 1) if dur else 0,
                    "throttles": int(thr), "error_rate_pct": error_rate,
                    "perf_status": status,
                })
            return out
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=min(8, len(regions))) as pool:
        for fut in as_completed([pool.submit(_region, r) for r in regions]):
            try:
                fns.extend(fut.result(timeout=60))
            except Exception:
                continue
    return fns


# ══════════════════════════════════════════════════════════════════
# Top-level dispatch
# ══════════════════════════════════════════════════════════════════
def list_load_balancers(creds: dict) -> list:
    if creds.get("provider") == "aws":
        return list_aws_load_balancers(creds)
    return []


def list_databases(creds: dict) -> list:
    if creds.get("provider") == "aws":
        return list_aws_databases(creds)
    return []


def list_functions(creds: dict) -> list:
    if creds.get("provider") == "aws":
        return list_aws_functions(creds)
    return []
