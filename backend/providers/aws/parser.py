"""
AWS Cloud Provider — Resource Parser
Parses collected AWS JSON data into normalized structures.
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


def _get_regions(acct_dir: Path) -> list[str]:
    if not acct_dir.exists():
        return []
    return [
        d.name for d in acct_dir.iterdir()
        if d.is_dir() and d.name.startswith(("us-", "eu-", "ap-", "sa-", "ca-", "me-", "af-", "il-"))
    ]


class AWSParser(BaseParser):

    def get_resource_types(self) -> list[str]:
        return ["instances", "security_groups", "vpcs", "subnets", "lambdas", "buckets", "rds", "elbs", "snapshots", "network_interfaces"]

    def get_resource_labels(self) -> dict[str, str]:
        return {
            "instances": "EC2",
            "security_groups": "Security Groups",
            "vpcs": "VPCs",
            "subnets": "Subnets",
            "lambdas": "Lambda",
            "buckets": "S3 Buckets",
            "rds": "RDS",
            "elbs": "ELB/ALB",
            "snapshots": "Snapshots",
            "network_interfaces": "NICs",
        }

    def _resolve_dir(self, account_name: str, data_dir: Path) -> Path:
        """Resolve account dir with legacy fallback."""
        acct_dir = data_dir / "aws" / account_name
        if not acct_dir.exists():
            acct_dir = data_dir / account_name  # legacy path
        return acct_dir

    def parse_resources(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = self._resolve_dir(account_name, data_dir)
        regions = _get_regions(acct_dir)
        resources = {}

        for region in regions:
            rd = acct_dir / region
            region_data = {}

            # EC2
            ec2 = _read_json(rd / "ec2-describe-instances.json")
            instances = []
            for r in ec2.get("Reservations", []):
                for inst in r.get("Instances", []):
                    name_tag = ""
                    for tag in inst.get("Tags", []):
                        if tag.get("Key") == "Name":
                            name_tag = tag.get("Value", "")
                    instances.append({
                        "id": inst.get("InstanceId"),
                        "name": name_tag,
                        "type": inst.get("InstanceType"),
                        "state": inst.get("State", {}).get("Name"),
                        "public_ip": inst.get("PublicIpAddress"),
                        "private_ip": inst.get("PrivateIpAddress"),
                        "vpc": inst.get("VpcId"),
                        "launch_time": inst.get("LaunchTime"),
                    })
            region_data["ec2_instances"] = instances

            # S3
            s3 = _read_json(rd / "s3-list-buckets.json")
            region_data["s3_buckets"] = [
                {"name": b["Name"], "created": b.get("CreationDate")}
                for b in s3.get("Buckets", [])
            ]

            # Security groups
            sgs = _read_json(rd / "ec2-describe-security-groups.json")
            region_data["security_groups"] = [
                {
                    "id": sg["GroupId"], "name": sg["GroupName"],
                    "vpc": sg.get("VpcId"), "description": sg.get("Description"),
                    "inbound_rules": len(sg.get("IpPermissions", [])),
                    "outbound_rules": len(sg.get("IpPermissionsEgress", [])),
                }
                for sg in sgs.get("SecurityGroups", [])
            ]

            # VPCs
            vpcs = _read_json(rd / "ec2-describe-vpcs.json")
            region_data["vpcs"] = [
                {"id": v["VpcId"], "cidr": v.get("CidrBlock"), "default": v.get("IsDefault")}
                for v in vpcs.get("Vpcs", [])
            ]

            # Lambda
            lam = _read_json(rd / "lambda-list-functions.json")
            region_data["lambda_functions"] = [
                {"name": fn["FunctionName"], "runtime": fn.get("Runtime"), "memory": fn.get("MemorySize")}
                for fn in lam.get("Functions", [])
            ]

            # RDS
            rds = _read_json(rd / "rds-describe-db-instances.json")
            region_data["rds_instances"] = [
                {
                    "id": db["DBInstanceIdentifier"], "engine": db.get("Engine"),
                    "class": db.get("DBInstanceClass"), "publicly_accessible": db.get("PubliclyAccessible"),
                }
                for db in rds.get("DBInstances", [])
            ]

            # ELBs (merge classic + v2 into single load_balancers list)
            elb = _read_json(rd / "elb-describe-load-balancers.json")
            classic_lbs = [
                {"name": lb.get("LoadBalancerName"), "dns": lb.get("DNSName"), "scheme": lb.get("Scheme"), "type": "classic"}
                for lb in elb.get("LoadBalancerDescriptions", [])
            ]
            elbv2 = _read_json(rd / "elbv2-describe-load-balancers.json")
            v2_lbs = [
                {"name": lb.get("LoadBalancerName"), "dns": lb.get("DNSName"),
                 "type": lb.get("Type"), "scheme": lb.get("Scheme")}
                for lb in elbv2.get("LoadBalancers", [])
            ]
            region_data["load_balancers"] = classic_lbs + v2_lbs
            region_data["load_balancers_v2"] = v2_lbs

            resources[region] = region_data

        return {"account": account_name, "provider": "aws", "regions": resources}

    def parse_dashboard(self, account_name: str, data_dir: Path) -> dict:
        acct_dir = self._resolve_dir(account_name, data_dir)
        regions = _get_regions(acct_dir)

        totals = {k: 0 for k in self.get_resource_types()}
        public_ips = []
        region_stats = {}

        for region in regions:
            rd = acct_dir / region
            r = {}

            # EC2
            ec2 = _read_json(rd / "ec2-describe-instances.json")
            instances = [i for res in ec2.get("Reservations", []) for i in res.get("Instances", [])]
            r["instances"] = len(instances)
            r["instances_running"] = len([i for i in instances if i.get("State", {}).get("Name") == "running"])
            r["instances_stopped"] = len([i for i in instances if i.get("State", {}).get("Name") == "stopped"])
            totals["instances"] += r["instances"]
            for inst in instances:
                if inst.get("PublicIpAddress"):
                    name_tag = ""
                    for tag in inst.get("Tags", []):
                        if tag.get("Key") == "Name":
                            name_tag = tag.get("Value", "")
                    public_ips.append({
                        "ip": inst["PublicIpAddress"], "resource": inst["InstanceId"],
                        "name": name_tag, "type": "EC2",
                        "instance_type": inst.get("InstanceType"),
                        "state": inst.get("State", {}).get("Name"), "region": region,
                    })

            # SGs
            sgs = _read_json(rd / "ec2-describe-security-groups.json")
            r["security_groups"] = len(sgs.get("SecurityGroups", []))
            totals["security_groups"] += r["security_groups"]

            # VPCs
            vpcs = _read_json(rd / "ec2-describe-vpcs.json")
            r["vpcs"] = len(vpcs.get("Vpcs", []))
            totals["vpcs"] += r["vpcs"]

            # Subnets
            subnets = _read_json(rd / "ec2-describe-subnets.json")
            r["subnets"] = len(subnets.get("Subnets", []))
            totals["subnets"] += r["subnets"]

            # Lambda
            lam = _read_json(rd / "lambda-list-functions.json")
            r["lambdas"] = len(lam.get("Functions", []))
            totals["lambdas"] += r["lambdas"]

            # S3
            s3 = _read_json(rd / "s3-list-buckets.json")
            r["buckets"] = len(s3.get("Buckets", []))
            totals["buckets"] += r["buckets"]

            # RDS
            rds = _read_json(rd / "rds-describe-db-instances.json")
            rds_list = rds.get("DBInstances", [])
            r["rds"] = len(rds_list)
            totals["rds"] += r["rds"]
            for db in rds_list:
                if db.get("PubliclyAccessible") and db.get("Endpoint", {}).get("Address"):
                    public_ips.append({
                        "ip": db["Endpoint"]["Address"], "resource": db["DBInstanceIdentifier"],
                        "name": db.get("Engine", ""), "type": "RDS",
                        "instance_type": db.get("DBInstanceClass"),
                        "state": db.get("DBInstanceStatus"), "region": region,
                    })

            # ELBs
            elb = _read_json(rd / "elb-describe-load-balancers.json")
            elbv2 = _read_json(rd / "elbv2-describe-load-balancers.json")
            elb_list = elb.get("LoadBalancerDescriptions", [])
            elbv2_list = elbv2.get("LoadBalancers", [])
            r["elbs"] = len(elb_list) + len(elbv2_list)
            totals["elbs"] += r["elbs"]
            for lb in elb_list:
                if lb.get("Scheme") == "internet-facing":
                    public_ips.append({
                        "ip": lb.get("DNSName", ""), "resource": lb.get("LoadBalancerName"),
                        "name": "Classic ELB", "type": "ELB",
                        "instance_type": "classic", "state": "active", "region": region,
                    })
            for lb in elbv2_list:
                if lb.get("Scheme") == "internet-facing":
                    public_ips.append({
                        "ip": lb.get("DNSName", ""), "resource": lb.get("LoadBalancerName"),
                        "name": lb.get("Type", "ALB/NLB"), "type": "ELBv2",
                        "instance_type": lb.get("Type"),
                        "state": lb.get("State", {}).get("Code", "active"), "region": region,
                    })

            # Snapshots
            snaps = _read_json(rd / "ec2-describe-snapshots.json")
            r["snapshots"] = len(snaps.get("Snapshots", []))
            totals["snapshots"] += r["snapshots"]

            # NICs
            nics = _read_json(rd / "ec2-describe-network-interfaces.json")
            r["network_interfaces"] = len(nics.get("NetworkInterfaces", []))
            totals["network_interfaces"] += r["network_interfaces"]

            # CloudTrail & GuardDuty
            trails = _read_json(rd / "cloudtrail-describe-trails.json")
            r["cloudtrail_trails"] = len(trails.get("trailList", []))
            gd = _read_json(rd / "guardduty-list-detectors.json")
            r["guardduty_enabled"] = len(gd.get("DetectorIds", [])) > 0

            r["has_resources"] = any(r.get(k, 0) > 0 for k in ["instances", "security_groups", "vpcs", "lambdas", "rds", "elbs"])
            region_stats[region] = r

        # IAM (global — prefer us-east-1 where IAM data lives)
        iam_summary = {}
        iam_users = []
        if regions:
            iam_region = "us-east-1" if "us-east-1" in regions else regions[0]
            for _r in [iam_region] + regions:
                if (acct_dir / _r / "iam-get-account-authorization-details.json").exists():
                    iam_region = _r
                    break
            iam_summary = _read_json(acct_dir / iam_region / "iam-get-account-summary.json").get("SummaryMap", {})
            auth = _read_json(acct_dir / iam_region / "iam-get-account-authorization-details.json")
            for u in auth.get("UserDetailList", []):
                iam_users.append({
                    "name": u.get("UserName"), "arn": u.get("Arn"),
                    "created": u.get("CreateDate"),
                    "has_mfa": len(u.get("MFADevices", [])) > 0,
                    "policies_count": len(u.get("AttachedManagedPolicies", [])) + len(u.get("UserPolicyList", [])),
                    "groups": u.get("GroupList", []),
                })

        # Caller identity
        caller_identity = _read_json(acct_dir / "caller-identity.json")
        if not caller_identity and regions:
            caller_identity = _read_json(acct_dir / regions[0] / "sts-get-caller-identity.json")

        # Security score
        score = 100
        if not iam_summary.get("AccountMFAEnabled"): score -= 20
        if iam_summary.get("AccountAccessKeysPresent"): score -= 15
        ec2_public = len([p for p in public_ips if p["type"] == "EC2"])
        rds_public = len([p for p in public_ips if p["type"] == "RDS"])
        if ec2_public: score -= min(ec2_public * 5, 20)
        if rds_public: score -= min(rds_public * 10, 20)
        users_no_mfa = len([u for u in iam_users if not u["has_mfa"]])
        if users_no_mfa: score -= min(users_no_mfa * 3, 15)
        open_sgs = 0
        for region in regions:
            sgs_data = _read_json(acct_dir / region / "ec2-describe-security-groups.json")
            for sg in sgs_data.get("SecurityGroups", []):
                for rule in sg.get("IpPermissions", []):
                    for ip_range in rule.get("IpRanges", []):
                        if ip_range.get("CidrIp") == "0.0.0.0/0":
                            open_sgs += 1
        if open_sgs: score -= min(open_sgs * 3, 15)

        # Region matrix
        matrix_keys = ["instances", "security_groups", "vpcs", "subnets", "lambdas", "rds", "elbs", "snapshots"]
        region_matrix = {reg: {k: stats.get(k, 0) for k in matrix_keys} for reg, stats in region_stats.items()}

        return {
            "account": account_name,
            "provider": "aws",
            "caller_identity": caller_identity,
            "security_score": max(score, 0),
            "collection_date": datetime.now().isoformat(),
            "regions_scanned": len(regions),
            "totals": totals,
            "regions": region_stats,
            "region_matrix": region_matrix,
            "public_ips": public_ips,
            "public_summary": {
                "ec2": ec2_public, "rds": rds_public,
                "elb": len([p for p in public_ips if p["type"] in ("ELB", "ELBv2")]),
                "total": len(public_ips),
            },
            "iam_summary": iam_summary,
            "iam_users": iam_users,
            "iam_users_no_mfa": users_no_mfa,
            "open_security_groups": open_sgs,
        }
