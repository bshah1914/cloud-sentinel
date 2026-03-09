"""
AWS Cloud Provider — Security Auditor
Runs security audit checks against collected AWS data.
"""

import json
from pathlib import Path
from ..base import BaseAuditor, AuditFinding, Severity


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


class AWSAuditor(BaseAuditor):

    def get_audit_checks(self) -> list[dict]:
        return [
            {"id": "SG_OPEN_TO_WORLD", "title": "Security Group open to 0.0.0.0/0", "severity": "HIGH", "category": "Network"},
            {"id": "EC2_PUBLIC_IP", "title": "EC2 instance has public IP", "severity": "MEDIUM", "category": "Network"},
            {"id": "RDS_PUBLIC", "title": "RDS instance publicly accessible", "severity": "CRITICAL", "category": "Database"},
            {"id": "RDS_UNENCRYPTED", "title": "RDS storage not encrypted", "severity": "HIGH", "category": "Database"},
            {"id": "ELB_HTTP", "title": "ELB using HTTP listener", "severity": "MEDIUM", "category": "Network"},
            {"id": "NO_CLOUDTRAIL", "title": "No CloudTrail configured", "severity": "HIGH", "category": "Logging"},
            {"id": "NO_GUARDDUTY", "title": "GuardDuty not enabled", "severity": "MEDIUM", "category": "Monitoring"},
            {"id": "ROOT_NO_MFA", "title": "Root account MFA not enabled", "severity": "CRITICAL", "category": "IAM"},
            {"id": "ROOT_ACCESS_KEYS", "title": "Root account has access keys", "severity": "CRITICAL", "category": "IAM"},
            {"id": "USER_NO_MFA", "title": "IAM user without MFA", "severity": "HIGH", "category": "IAM"},
        ]

    def run_audit(self, account_name: str, data_dir: Path) -> list[dict]:
        acct_dir = data_dir / "aws" / account_name
        if not acct_dir.exists():
            acct_dir = data_dir / account_name  # legacy path
        regions = _get_regions(acct_dir)
        findings = []

        for region in regions:
            rd = acct_dir / region

            # SG open to world
            sgs = _read_json(rd / "ec2-describe-security-groups.json")
            for sg in sgs.get("SecurityGroups", []):
                for rule in sg.get("IpPermissions", []):
                    for ip_range in rule.get("IpRanges", []):
                        if ip_range.get("CidrIp") == "0.0.0.0/0":
                            port = rule.get("FromPort")
                            proto = rule.get("IpProtocol", "tcp")
                            sev = "CRITICAL" if port in (22, 3389, 3306, 5432, 1433, 27017) or proto == "-1" else "HIGH"
                            findings.append({
                                "issue": "SG_OPEN_TO_WORLD", "severity": sev, "region": region,
                                "title": f"Security Group open to 0.0.0.0/0 on port {port or 'all'}",
                                "resource": f"{sg['GroupId']} ({sg['GroupName']})",
                                "description": f"Inbound rule allows {proto} traffic on port {port or 'all'} from anywhere",
                                "group": "security_groups",
                            })
                    for ip_range in rule.get("Ipv6Ranges", []):
                        if ip_range.get("CidrIpv6") == "::/0":
                            findings.append({
                                "issue": "SG_OPEN_TO_WORLD_IPV6", "severity": "HIGH", "region": region,
                                "title": f"Security Group open to ::/0 on port {rule.get('FromPort') or 'all'}",
                                "resource": f"{sg['GroupId']} ({sg['GroupName']})",
                                "description": "Inbound rule allows IPv6 traffic from anywhere",
                                "group": "security_groups",
                            })

            # EC2 public IPs
            ec2 = _read_json(rd / "ec2-describe-instances.json")
            for res in ec2.get("Reservations", []):
                for inst in res.get("Instances", []):
                    if inst.get("PublicIpAddress"):
                        findings.append({
                            "issue": "EC2_PUBLIC_IP", "severity": "MEDIUM", "region": region,
                            "title": "EC2 instance has public IP",
                            "resource": f"{inst['InstanceId']} ({inst.get('PublicIpAddress')})",
                            "description": "Instance is directly accessible from the internet",
                            "group": "ec2",
                        })

            # RDS
            rds = _read_json(rd / "rds-describe-db-instances.json")
            for db in rds.get("DBInstances", []):
                if db.get("PubliclyAccessible"):
                    findings.append({
                        "issue": "RDS_PUBLIC", "severity": "CRITICAL", "region": region,
                        "title": "RDS instance is publicly accessible",
                        "resource": db.get("DBInstanceIdentifier"),
                        "description": f"Database {db.get('Engine', 'unknown')} is publicly accessible",
                        "group": "rds",
                    })
                if not db.get("StorageEncrypted"):
                    findings.append({
                        "issue": "RDS_UNENCRYPTED", "severity": "HIGH", "region": region,
                        "title": "RDS storage not encrypted",
                        "resource": db.get("DBInstanceIdentifier"),
                        "description": "Database storage is not encrypted at rest",
                        "group": "rds",
                    })

            # ELB HTTP
            elb = _read_json(rd / "elb-describe-load-balancers.json")
            for lb in elb.get("LoadBalancerDescriptions", []):
                for listener in lb.get("ListenerDescriptions", []):
                    l = listener.get("Listener", {})
                    if l.get("Protocol", "").upper() == "HTTP":
                        findings.append({
                            "issue": "ELB_HTTP", "severity": "MEDIUM", "region": region,
                            "title": "ELB using HTTP listener",
                            "resource": lb.get("LoadBalancerName"),
                            "description": "Load balancer accepts unencrypted HTTP traffic",
                            "group": "elb",
                        })

            # CloudTrail
            trails = _read_json(rd / "cloudtrail-describe-trails.json")
            if not trails.get("trailList"):
                findings.append({
                    "issue": "NO_CLOUDTRAIL", "severity": "HIGH", "region": region,
                    "title": "No CloudTrail trails configured",
                    "resource": "CloudTrail",
                    "description": "No audit logging trails found in this region",
                    "group": "logging",
                })

            # GuardDuty
            gd = _read_json(rd / "guardduty-list-detectors.json")
            if not gd.get("DetectorIds"):
                findings.append({
                    "issue": "NO_GUARDDUTY", "severity": "MEDIUM", "region": region,
                    "title": "GuardDuty not enabled",
                    "resource": "GuardDuty",
                    "description": "AWS threat detection service not active in this region",
                    "group": "monitoring",
                })

        # IAM global checks
        if regions:
            iam_summary = _read_json(acct_dir / regions[0] / "iam-get-account-summary.json").get("SummaryMap", {})
            if not iam_summary.get("AccountMFAEnabled"):
                findings.append({
                    "issue": "ROOT_NO_MFA", "severity": "CRITICAL", "region": "global",
                    "title": "Root account MFA not enabled",
                    "resource": "Root Account",
                    "description": "The root account does not have MFA enabled",
                    "group": "iam",
                })
            if iam_summary.get("AccountAccessKeysPresent"):
                findings.append({
                    "issue": "ROOT_ACCESS_KEYS", "severity": "CRITICAL", "region": "global",
                    "title": "Root account has access keys",
                    "resource": "Root Account",
                    "description": "Root account access keys exist — these should be deleted",
                    "group": "iam",
                })
            auth = _read_json(acct_dir / regions[0] / "iam-get-account-authorization-details.json")
            for u in auth.get("UserDetailList", []):
                if not u.get("MFADevices"):
                    findings.append({
                        "issue": "USER_NO_MFA", "severity": "HIGH", "region": "global",
                        "title": f"IAM user '{u.get('UserName')}' has no MFA",
                        "resource": u.get("UserName"),
                        "description": "IAM user does not have MFA enabled",
                        "group": "iam",
                    })

        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        findings.sort(key=lambda x: severity_order.get(x.get("severity", "INFO"), 5))
        return findings
