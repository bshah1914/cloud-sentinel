"""GCP Cloud Provider — Resource Parser"""

import json
from pathlib import Path
from datetime import datetime
from ..base import BaseParser


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def _get_regions(acct_dir: Path) -> list[str]:
    if not acct_dir.exists():
        return []
    return [d.name for d in acct_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]


class GCPParser(BaseParser):

    def get_resource_types(self) -> list[str]:
        return ["instances", "firewalls", "networks", "buckets", "sql_instances", "disks"]

    def get_resource_labels(self) -> dict[str, str]:
        return {
            "instances": "Compute Engine",
            "firewalls": "Firewall Rules",
            "networks": "VPC Networks",
            "buckets": "Cloud Storage",
            "sql_instances": "Cloud SQL",
            "disks": "Persistent Disks",
        }

    def parse_resources(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = data_dir / "gcp" / account_name
        regions = _get_regions(acct_dir)
        resources = {}
        for region in regions:
            rd = acct_dir / region
            region_data = {}
            region_data["instances"] = _read_json(rd / "compute-instances.json").get("Instances", [])
            region_data["firewalls"] = _read_json(rd / "compute-firewalls.json").get("Firewalls", [])
            region_data["networks"] = _read_json(rd / "compute-networks.json").get("Networks", [])
            region_data["buckets"] = _read_json(rd / "storage-buckets.json").get("Buckets", [])
            region_data["sql_instances"] = _read_json(rd / "sql-instances.json").get("SqlInstances", [])
            region_data["disks"] = _read_json(rd / "compute-disks.json").get("Disks", [])
            resources[region] = region_data
        return {"account": account_name, "provider": "gcp", "regions": resources}

    def parse_dashboard(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = data_dir / "gcp" / account_name
        regions = _get_regions(acct_dir)

        totals = {k: 0 for k in self.get_resource_types()}
        public_resources = []
        region_stats = {}

        for region in regions:
            rd = acct_dir / region
            r = {}

            instances = _read_json(rd / "compute-instances.json").get("Instances", [])
            r["instances"] = len(instances)
            totals["instances"] += len(instances)
            for inst in instances:
                for ni in inst.get("network_interfaces", []):
                    if ni.get("external_ip"):
                        public_resources.append({
                            "ip": ni["external_ip"], "resource": inst.get("name", ""),
                            "name": inst.get("name", ""), "type": "Compute Engine",
                            "instance_type": inst.get("machine_type", ""),
                            "state": inst.get("status", ""), "region": region,
                        })

            firewalls = _read_json(rd / "compute-firewalls.json").get("Firewalls", [])
            r["firewalls"] = len(firewalls)
            totals["firewalls"] += len(firewalls)

            networks = _read_json(rd / "compute-networks.json").get("Networks", [])
            r["networks"] = len(networks)
            totals["networks"] += len(networks)

            buckets = _read_json(rd / "storage-buckets.json").get("Buckets", [])
            r["buckets"] = len(buckets)
            totals["buckets"] += len(buckets)

            sql = _read_json(rd / "sql-instances.json").get("SqlInstances", [])
            r["sql_instances"] = len(sql)
            totals["sql_instances"] += len(sql)
            for s in sql:
                for ip in s.get("ip_addresses", []):
                    if ip.get("type") == "PRIMARY":
                        public_resources.append({
                            "ip": ip.get("ipAddress", ""), "resource": s.get("name", ""),
                            "name": s.get("database_version", ""), "type": "Cloud SQL",
                            "instance_type": s.get("settings", {}).get("tier", ""),
                            "state": s.get("state", ""), "region": region,
                        })

            disks = _read_json(rd / "compute-disks.json").get("Disks", [])
            r["disks"] = len(disks)
            totals["disks"] += len(disks)

            r["has_resources"] = any(r.get(k, 0) > 0 for k in ["instances", "firewalls", "networks", "buckets", "sql_instances"])
            region_stats[region] = r

        # Security score
        score = 100
        open_fws = 0
        for region in regions:
            fws = _read_json(acct_dir / region / "compute-firewalls.json").get("Firewalls", [])
            for fw in fws:
                if fw.get("disabled"):
                    continue
                if "0.0.0.0/0" in fw.get("source_ranges", []):
                    for allowed in fw.get("allowed", []):
                        if allowed.get("protocol") == "all" or "22" in allowed.get("ports", []) or "3389" in allowed.get("ports", []):
                            open_fws += 1
        if open_fws: score -= min(open_fws * 5, 25)
        if len(public_resources) > 0: score -= min(len(public_resources) * 3, 20)

        matrix_keys = list(self.get_resource_types())
        region_matrix = {reg: {k: stats.get(k, 0) for k in matrix_keys} for reg, stats in region_stats.items()}

        return {
            "account": account_name, "provider": "gcp",
            "security_score": max(score, 0),
            "collection_date": datetime.now().isoformat(),
            "regions_scanned": len(regions),
            "totals": totals, "regions": region_stats,
            "region_matrix": region_matrix,
            "public_ips": public_resources,
            "public_summary": {
                "compute": len([p for p in public_resources if p["type"] == "Compute Engine"]),
                "sql": len([p for p in public_resources if p["type"] == "Cloud SQL"]),
                "total": len(public_resources),
            },
            "iam_summary": {}, "iam_users": [],
            "iam_users_no_mfa": 0, "open_security_groups": open_fws,
        }
