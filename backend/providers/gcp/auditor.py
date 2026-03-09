"""GCP Cloud Provider — Security Auditor"""

import json
from pathlib import Path
from ..base import BaseAuditor


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def _get_regions(acct_dir: Path) -> list[str]:
    if not acct_dir.exists():
        return []
    return [d.name for d in acct_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]


class GCPAuditor(BaseAuditor):

    def get_audit_checks(self) -> list[dict]:
        return [
            {"id": "FW_OPEN_SSH", "title": "Firewall allows SSH from 0.0.0.0/0", "severity": "CRITICAL", "category": "Network"},
            {"id": "FW_OPEN_RDP", "title": "Firewall allows RDP from 0.0.0.0/0", "severity": "CRITICAL", "category": "Network"},
            {"id": "FW_OPEN_ALL", "title": "Firewall allows all traffic from 0.0.0.0/0", "severity": "CRITICAL", "category": "Network"},
            {"id": "FW_OPEN_INBOUND", "title": "Firewall allows inbound from 0.0.0.0/0", "severity": "HIGH", "category": "Network"},
            {"id": "VM_EXTERNAL_IP", "title": "VM has external IP", "severity": "MEDIUM", "category": "Compute"},
            {"id": "SQL_PUBLIC", "title": "Cloud SQL publicly accessible", "severity": "CRITICAL", "category": "Database"},
            {"id": "SQL_NO_SSL", "title": "Cloud SQL does not require SSL", "severity": "HIGH", "category": "Database"},
        ]

    def run_audit(self, account_name: str, data_dir: Path) -> list[dict]:
        acct_dir = data_dir / "gcp" / account_name
        regions = _get_regions(acct_dir)
        findings = []

        for region in regions:
            rd = acct_dir / region

            # Firewall checks
            fws = _read_json(rd / "compute-firewalls.json").get("Firewalls", [])
            for fw in fws:
                if fw.get("disabled") or fw.get("direction") != "INGRESS":
                    continue
                if "0.0.0.0/0" not in fw.get("source_ranges", []):
                    continue
                for allowed in fw.get("allowed", []):
                    proto = allowed.get("protocol", "")
                    ports = allowed.get("ports", [])
                    if proto == "all":
                        findings.append({
                            "issue": "FW_OPEN_ALL", "severity": "CRITICAL", "region": "global",
                            "title": f"Firewall '{fw['name']}' allows all traffic from 0.0.0.0/0",
                            "resource": fw["name"],
                            "description": "Firewall rule allows all protocols from the internet",
                            "group": "network",
                        })
                    elif "22" in ports:
                        findings.append({
                            "issue": "FW_OPEN_SSH", "severity": "CRITICAL", "region": "global",
                            "title": f"Firewall '{fw['name']}' allows SSH from 0.0.0.0/0",
                            "resource": fw["name"],
                            "description": "Firewall rule allows SSH from the internet",
                            "group": "network",
                        })
                    elif "3389" in ports:
                        findings.append({
                            "issue": "FW_OPEN_RDP", "severity": "CRITICAL", "region": "global",
                            "title": f"Firewall '{fw['name']}' allows RDP from 0.0.0.0/0",
                            "resource": fw["name"],
                            "description": "Firewall rule allows RDP from the internet",
                            "group": "network",
                        })
                    else:
                        findings.append({
                            "issue": "FW_OPEN_INBOUND", "severity": "HIGH", "region": "global",
                            "title": f"Firewall '{fw['name']}' allows {proto} from 0.0.0.0/0",
                            "resource": fw["name"],
                            "description": f"Firewall rule allows {proto} on ports {','.join(ports)} from internet",
                            "group": "network",
                        })

            # VM external IP
            instances = _read_json(rd / "compute-instances.json").get("Instances", [])
            for inst in instances:
                for ni in inst.get("network_interfaces", []):
                    if ni.get("external_ip"):
                        findings.append({
                            "issue": "VM_EXTERNAL_IP", "severity": "MEDIUM", "region": region,
                            "title": f"VM '{inst['name']}' has external IP",
                            "resource": inst["name"],
                            "description": f"VM has external IP {ni['external_ip']}",
                            "group": "compute",
                        })

            # Cloud SQL
            sql_instances = _read_json(rd / "sql-instances.json").get("SqlInstances", [])
            for s in sql_instances:
                ip_config = s.get("settings", {}).get("ip_configuration", {})
                if ip_config.get("ipv4Enabled"):
                    auth_nets = ip_config.get("authorizedNetworks", [])
                    for net in auth_nets:
                        if net.get("value") == "0.0.0.0/0":
                            findings.append({
                                "issue": "SQL_PUBLIC", "severity": "CRITICAL", "region": region,
                                "title": f"Cloud SQL '{s['name']}' allows 0.0.0.0/0",
                                "resource": s["name"],
                                "description": "Cloud SQL instance is accessible from any IP",
                                "group": "database",
                            })
                if not ip_config.get("requireSsl"):
                    findings.append({
                        "issue": "SQL_NO_SSL", "severity": "HIGH", "region": region,
                        "title": f"Cloud SQL '{s['name']}' does not require SSL",
                        "resource": s["name"],
                        "description": "Cloud SQL instance does not enforce SSL connections",
                        "group": "database",
                    })

        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        findings.sort(key=lambda x: severity_order.get(x.get("severity", "INFO"), 5))
        return findings
