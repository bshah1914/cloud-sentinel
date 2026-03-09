"""
Azure Cloud Provider — Resource Parser
"""

import json
from pathlib import Path
from datetime import datetime
from ..base import BaseParser


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def _get_locations(acct_dir: Path) -> list[str]:
    if not acct_dir.exists():
        return []
    return [d.name for d in acct_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]


class AzureParser(BaseParser):

    def get_resource_types(self) -> list[str]:
        return ["virtual_machines", "nsgs", "vnets", "public_ips", "load_balancers",
                "storage_accounts", "sql_servers", "resource_groups", "disks"]

    def get_resource_labels(self) -> dict[str, str]:
        return {
            "virtual_machines": "Virtual Machines",
            "nsgs": "Network Security Groups",
            "vnets": "Virtual Networks",
            "public_ips": "Public IPs",
            "load_balancers": "Load Balancers",
            "storage_accounts": "Storage Accounts",
            "sql_servers": "SQL Servers",
            "resource_groups": "Resource Groups",
            "disks": "Managed Disks",
        }

    def parse_resources(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = data_dir / "azure" / account_name
        locations = _get_locations(acct_dir)
        resources = {}

        for loc in locations:
            ld = acct_dir / loc
            region_data = {}

            vms = _read_json(ld / "compute-virtual-machines.json")
            region_data["virtual_machines"] = [
                {
                    "id": vm.get("id"), "name": vm.get("name"),
                    "size": vm.get("hardware_profile", {}).get("vm_size"),
                    "state": vm.get("instance_view", {}).get("statuses", [{}])[-1].get("display_status", "Unknown") if vm.get("instance_view") else "Unknown",
                    "location": vm.get("location"),
                    "os_type": vm.get("storage_profile", {}).get("os_disk", {}).get("os_type"),
                }
                for vm in vms.get("VirtualMachines", [])
            ]

            nsgs = _read_json(ld / "network-security-groups.json")
            region_data["nsgs"] = [
                {
                    "id": nsg.get("id"), "name": nsg.get("name"),
                    "location": nsg.get("location"),
                    "rules_count": len(nsg.get("security_rules", [])),
                }
                for nsg in nsgs.get("NetworkSecurityGroups", [])
            ]

            vnets = _read_json(ld / "network-virtual-networks.json")
            region_data["vnets"] = [
                {
                    "id": vn.get("id"), "name": vn.get("name"),
                    "address_space": vn.get("address_space", {}).get("address_prefixes", []),
                    "subnets_count": len(vn.get("subnets", [])),
                }
                for vn in vnets.get("VirtualNetworks", [])
            ]

            storage = _read_json(ld / "storage-accounts.json")
            region_data["storage_accounts"] = [
                {"id": sa.get("id"), "name": sa.get("name"), "kind": sa.get("kind"),
                 "https_only": sa.get("enable_https_traffic_only")}
                for sa in storage.get("StorageAccounts", [])
            ]

            sql = _read_json(ld / "sql-servers.json")
            region_data["sql_servers"] = [
                {"id": s.get("id"), "name": s.get("name"), "state": s.get("state"),
                 "admin_login": s.get("administrator_login")}
                for s in sql.get("SqlServers", [])
            ]

            pips = _read_json(ld / "network-public-ips.json")
            region_data["public_ips"] = [
                {"id": p.get("id"), "name": p.get("name"),
                 "ip_address": p.get("ip_address"), "allocation_method": p.get("public_ip_allocation_method")}
                for p in pips.get("PublicIPAddresses", [])
            ]

            lbs = _read_json(ld / "network-load-balancers.json")
            region_data["load_balancers"] = [
                {"id": lb.get("id"), "name": lb.get("name"), "sku": lb.get("sku", {}).get("name")}
                for lb in lbs.get("LoadBalancers", [])
            ]

            resources[loc] = region_data

        return {"account": account_name, "provider": "azure", "regions": resources}

    def parse_dashboard(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = data_dir / "azure" / account_name
        locations = _get_locations(acct_dir)

        totals = {k: 0 for k in self.get_resource_types()}
        public_resources = []
        region_stats = {}

        for loc in locations:
            ld = acct_dir / loc
            r = {}

            vms = _read_json(ld / "compute-virtual-machines.json").get("VirtualMachines", [])
            r["virtual_machines"] = len(vms)
            totals["virtual_machines"] += len(vms)

            nsgs = _read_json(ld / "network-security-groups.json").get("NetworkSecurityGroups", [])
            r["nsgs"] = len(nsgs)
            totals["nsgs"] += len(nsgs)

            vnets = _read_json(ld / "network-virtual-networks.json").get("VirtualNetworks", [])
            r["vnets"] = len(vnets)
            totals["vnets"] += len(vnets)

            pips = _read_json(ld / "network-public-ips.json").get("PublicIPAddresses", [])
            r["public_ips"] = len(pips)
            totals["public_ips"] += len(pips)
            for p in pips:
                if p.get("ip_address"):
                    public_resources.append({
                        "ip": p["ip_address"], "resource": p.get("name", ""),
                        "name": p.get("name", ""), "type": "Public IP",
                        "instance_type": p.get("public_ip_allocation_method", ""),
                        "state": "active", "region": loc,
                    })

            lbs = _read_json(ld / "network-load-balancers.json").get("LoadBalancers", [])
            r["load_balancers"] = len(lbs)
            totals["load_balancers"] += len(lbs)

            storage = _read_json(ld / "storage-accounts.json").get("StorageAccounts", [])
            r["storage_accounts"] = len(storage)
            totals["storage_accounts"] += len(storage)

            sql = _read_json(ld / "sql-servers.json").get("SqlServers", [])
            r["sql_servers"] = len(sql)
            totals["sql_servers"] += len(sql)

            rgs = _read_json(ld / "resource-groups.json").get("ResourceGroups", [])
            r["resource_groups"] = len(rgs)
            totals["resource_groups"] += len(rgs)

            disks = _read_json(ld / "compute-disks.json").get("Disks", [])
            r["disks"] = len(disks)
            totals["disks"] += len(disks)

            r["has_resources"] = any(r.get(k, 0) > 0 for k in ["virtual_machines", "nsgs", "vnets", "storage_accounts", "sql_servers"])
            region_stats[loc] = r

        # Security score
        score = 100
        # NSG rules open to internet
        open_nsgs = 0
        for loc in locations:
            nsgs = _read_json(acct_dir / loc / "network-security-groups.json").get("NetworkSecurityGroups", [])
            for nsg in nsgs:
                for rule in nsg.get("security_rules", []):
                    if rule.get("access") == "Allow" and rule.get("direction") == "Inbound":
                        src = rule.get("source_address_prefix", "")
                        if src in ("*", "0.0.0.0/0", "Internet"):
                            open_nsgs += 1
        if open_nsgs: score -= min(open_nsgs * 3, 20)

        # Storage without HTTPS
        for loc in locations:
            storage = _read_json(acct_dir / loc / "storage-accounts.json").get("StorageAccounts", [])
            for sa in storage:
                if not sa.get("enable_https_traffic_only"):
                    score -= 5

        # Public SQL
        for loc in locations:
            sql_servers = _read_json(acct_dir / loc / "sql-servers.json").get("SqlServers", [])
            if sql_servers:
                score -= min(len(sql_servers) * 5, 15)

        matrix_keys = ["virtual_machines", "nsgs", "vnets", "public_ips", "load_balancers", "storage_accounts", "sql_servers", "resource_groups", "disks"]
        region_matrix = {loc: {k: stats.get(k, 0) for k in matrix_keys} for loc, stats in region_stats.items()}

        return {
            "account": account_name,
            "provider": "azure",
            "security_score": max(score, 0),
            "collection_date": datetime.now().isoformat(),
            "regions_scanned": len(locations),
            "totals": totals,
            "regions": region_stats,
            "region_matrix": region_matrix,
            "public_ips": public_resources,
            "public_summary": {
                "vm": len([p for p in public_resources if p["type"] == "VM"]),
                "sql": 0,
                "lb": totals.get("load_balancers", 0),
                "total": len(public_resources),
            },
            "iam_summary": {},
            "iam_users": [],
            "iam_users_no_mfa": 0,
            "open_security_groups": open_nsgs,
        }
