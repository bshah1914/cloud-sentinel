"""
Azure Cloud Provider — Security Auditor
"""

import json
from pathlib import Path
from ..base import BaseAuditor


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def _get_locations(acct_dir: Path) -> list[str]:
    if not acct_dir.exists():
        return []
    return [d.name for d in acct_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]


class AzureAuditor(BaseAuditor):

    def get_audit_checks(self) -> list[dict]:
        return [
            {"id": "NSG_OPEN_INBOUND", "title": "NSG allows inbound from Internet", "severity": "HIGH", "category": "Network"},
            {"id": "NSG_SSH_OPEN", "title": "NSG allows SSH from Internet", "severity": "CRITICAL", "category": "Network"},
            {"id": "NSG_RDP_OPEN", "title": "NSG allows RDP from Internet", "severity": "CRITICAL", "category": "Network"},
            {"id": "STORAGE_HTTP", "title": "Storage account allows HTTP", "severity": "HIGH", "category": "Storage"},
            {"id": "SQL_PUBLIC", "title": "SQL Server publicly accessible", "severity": "CRITICAL", "category": "Database"},
            {"id": "VM_PUBLIC_IP", "title": "VM has public IP", "severity": "MEDIUM", "category": "Compute"},
            {"id": "DISK_UNENCRYPTED", "title": "Managed disk not encrypted", "severity": "HIGH", "category": "Storage"},
        ]

    def run_audit(self, account_name: str, data_dir: Path) -> list[dict]:
        acct_dir = data_dir / "azure" / account_name
        locations = _get_locations(acct_dir)
        findings = []

        for loc in locations:
            ld = acct_dir / loc

            # NSG checks
            nsgs = _read_json(ld / "network-security-groups.json").get("NetworkSecurityGroups", [])
            for nsg in nsgs:
                for rule in nsg.get("security_rules", []):
                    if rule.get("access") != "Allow" or rule.get("direction") != "Inbound":
                        continue
                    src = rule.get("source_address_prefix", "")
                    if src not in ("*", "0.0.0.0/0", "Internet"):
                        continue
                    port_range = str(rule.get("destination_port_range", ""))
                    if port_range == "22" or "22" in port_range.split(","):
                        findings.append({
                            "issue": "NSG_SSH_OPEN", "severity": "CRITICAL", "region": loc,
                            "title": f"NSG allows SSH from Internet",
                            "resource": nsg.get("name", ""),
                            "description": f"Rule '{rule.get('name')}' allows SSH from {src}",
                            "group": "network",
                        })
                    elif port_range == "3389" or "3389" in port_range.split(","):
                        findings.append({
                            "issue": "NSG_RDP_OPEN", "severity": "CRITICAL", "region": loc,
                            "title": f"NSG allows RDP from Internet",
                            "resource": nsg.get("name", ""),
                            "description": f"Rule '{rule.get('name')}' allows RDP from {src}",
                            "group": "network",
                        })
                    else:
                        findings.append({
                            "issue": "NSG_OPEN_INBOUND", "severity": "HIGH", "region": loc,
                            "title": f"NSG allows inbound from Internet on port {port_range}",
                            "resource": nsg.get("name", ""),
                            "description": f"Rule '{rule.get('name')}' allows traffic from {src}",
                            "group": "network",
                        })

            # Storage HTTP check
            storage = _read_json(ld / "storage-accounts.json").get("StorageAccounts", [])
            for sa in storage:
                if not sa.get("enable_https_traffic_only"):
                    findings.append({
                        "issue": "STORAGE_HTTP", "severity": "HIGH", "region": loc,
                        "title": "Storage account allows HTTP traffic",
                        "resource": sa.get("name", ""),
                        "description": "Storage account does not enforce HTTPS-only traffic",
                        "group": "storage",
                    })

            # SQL public check
            sql_servers = _read_json(ld / "sql-servers.json").get("SqlServers", [])
            for s in sql_servers:
                if s.get("public_network_access") != "Disabled":
                    findings.append({
                        "issue": "SQL_PUBLIC", "severity": "CRITICAL", "region": loc,
                        "title": "SQL Server allows public network access",
                        "resource": s.get("name", ""),
                        "description": "SQL Server has public network access enabled",
                        "group": "database",
                    })

            # Disk encryption
            disks = _read_json(ld / "compute-disks.json").get("Disks", [])
            for d in disks:
                enc = d.get("encryption", {})
                if not enc.get("type") or enc.get("type") == "EncryptionAtRestWithPlatformKey":
                    pass  # Platform-managed keys are acceptable
                # Only flag if explicitly no encryption
                if d.get("encryption_settings_collection") and not d.get("encryption_settings_collection", {}).get("enabled"):
                    findings.append({
                        "issue": "DISK_UNENCRYPTED", "severity": "HIGH", "region": loc,
                        "title": "Managed disk not encrypted",
                        "resource": d.get("name", ""),
                        "description": "Disk does not have encryption enabled",
                        "group": "storage",
                    })

        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        findings.sort(key=lambda x: severity_order.get(x.get("severity", "INFO"), 5))
        return findings
