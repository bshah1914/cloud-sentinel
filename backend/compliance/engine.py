"""
CloudLunar Compliance Engine
Pulls cloud resource configurations, evaluates rules, maps to frameworks,
calculates compliance scores, stores results, and generates AI recommendations.
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from .frameworks import (
    get_all_frameworks, get_framework, ComplianceFramework,
    ComplianceCheck, CheckStatus, ALL_CHECKS,
)


# ═══════════════════════════════════════════════════════════════════
# DATA LOADER — reads collected cloud data from account-data/
# ═══════════════════════════════════════════════════════════════════

class CloudDataLoader:
    """Loads raw cloud resource data from the file system."""

    def __init__(self, account_data_dir: Path, account_name: str):
        self.account_name = account_name
        # Try aws/ subdir first, then direct
        self.acct_dir = account_data_dir / "aws" / account_name
        if not self.acct_dir.exists():
            self.acct_dir = account_data_dir / account_name
        self.regions = self._get_regions()

    def _get_regions(self) -> List[str]:
        if not self.acct_dir.exists():
            return []
        return [d.name for d in self.acct_dir.iterdir()
                if d.is_dir() and not d.name.startswith('.')]

    def _read_json(self, path: Path) -> dict:
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            return {}

    def get_iam_data(self) -> dict:
        for region in self.regions:
            auth = self._read_json(self.acct_dir / region / "iam-get-account-authorization-details.json")
            summary = self._read_json(self.acct_dir / region / "iam-get-account-summary.json")
            if auth or summary:
                return {"auth": auth, "summary": summary.get("SummaryMap", {})}
        return {"auth": {}, "summary": {}}

    def get_s3_data(self) -> List[dict]:
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "s3-list-buckets.json")
            if data.get("Buckets"):
                return data["Buckets"]
        return []

    def get_ec2_data(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "ec2-describe-instances.json")
            instances = []
            for res in data.get("Reservations", []):
                instances.extend(res.get("Instances", []))
            if instances:
                result[region] = instances
        return result

    def get_security_groups(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "ec2-describe-security-groups.json")
            sgs = data.get("SecurityGroups", [])
            if sgs:
                result[region] = sgs
        return result

    def get_rds_data(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "rds-describe-db-instances.json")
            instances = data.get("DBInstances", [])
            if instances:
                result[region] = instances
        return result

    def get_vpcs(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "ec2-describe-vpcs.json")
            vpcs = data.get("Vpcs", [])
            if vpcs:
                result[region] = vpcs
        return result

    def get_cloudtrail(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "cloudtrail-describe-trails.json")
            trails = data.get("trailList", [])
            if trails:
                result[region] = trails
        return result

    def get_guardduty(self) -> Dict[str, List[str]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "guardduty-list-detectors.json")
            detectors = data.get("DetectorIds", [])
            result[region] = detectors
        return result

    def get_lambda_functions(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "lambda-list-functions.json")
            fns = data.get("Functions", [])
            if fns:
                result[region] = fns
        return result

    def get_snapshots(self) -> Dict[str, List[dict]]:
        result = {}
        for region in self.regions:
            data = self._read_json(self.acct_dir / region / "ec2-describe-snapshots.json")
            snaps = data.get("Snapshots", [])
            if snaps:
                result[region] = snaps
        return result


# ═══════════════════════════════════════════════════════════════════
# CHECK EVALUATORS — functions that evaluate each compliance check
# ═══════════════════════════════════════════════════════════════════

class CheckEvaluator:
    """Evaluates individual compliance checks against cloud data."""

    def __init__(self, loader: CloudDataLoader):
        self.loader = loader
        self._iam = None
        self._s3 = None
        self._ec2 = None
        self._sgs = None
        self._rds = None
        self._ct = None
        self._gd = None
        self._lambdas = None
        self._snapshots = None

    @property
    def iam(self):
        if self._iam is None:
            self._iam = self.loader.get_iam_data()
        return self._iam

    @property
    def s3(self):
        if self._s3 is None:
            self._s3 = self.loader.get_s3_data()
        return self._s3

    @property
    def ec2(self):
        if self._ec2 is None:
            self._ec2 = self.loader.get_ec2_data()
        return self._ec2

    @property
    def sgs(self):
        if self._sgs is None:
            self._sgs = self.loader.get_security_groups()
        return self._sgs

    @property
    def rds(self):
        if self._rds is None:
            self._rds = self.loader.get_rds_data()
        return self._rds

    @property
    def cloudtrail(self):
        if self._ct is None:
            self._ct = self.loader.get_cloudtrail()
        return self._ct

    @property
    def guardduty(self):
        if self._gd is None:
            self._gd = self.loader.get_guardduty()
        return self._gd

    @property
    def lambdas(self):
        if self._lambdas is None:
            self._lambdas = self.loader.get_lambda_functions()
        return self._lambdas

    @property
    def snapshots(self):
        if self._snapshots is None:
            self._snapshots = self.loader.get_snapshots()
        return self._snapshots

    def evaluate(self, check: ComplianceCheck) -> dict:
        """Evaluate a single compliance check. Returns result dict."""
        fn_name = check.check_function
        evaluator = getattr(self, fn_name, None)
        if not evaluator:
            return self._result(check, "N/A", "Check not implemented", [])
        try:
            return evaluator(check)
        except Exception as e:
            return self._result(check, "ERROR", f"Evaluation error: {str(e)}", [])

    def _result(self, check, status, reason, resources, details=None):
        return {
            "check_id": check.check_id,
            "title": check.title,
            "status": status,
            "severity": check.severity,
            "reason": reason,
            "resource_type": check.resource_type,
            "affected_resources": resources[:50],  # cap at 50
            "affected_count": len(resources),
            "remediation": check.remediation,
            "details": details or {},
        }

    # ── IAM Checks ──
    def check_root_mfa(self, check):
        s = self.iam.get("summary", {})
        if s.get("AccountMFAEnabled", 0) >= 1:
            return self._result(check, "PASS", "Root account MFA is enabled", [])
        return self._result(check, "FAIL", "Root account MFA is NOT enabled", ["root-account"])

    def check_root_access_keys(self, check):
        s = self.iam.get("summary", {})
        if s.get("AccountAccessKeysPresent", 0) == 0:
            return self._result(check, "PASS", "No root account access keys", [])
        return self._result(check, "FAIL", "Root account has active access keys", ["root-account"])

    def check_user_mfa(self, check):
        users = self.iam.get("auth", {}).get("UserDetailList", [])
        no_mfa = [u["UserName"] for u in users if not u.get("MFADevices")]
        if not no_mfa:
            return self._result(check, "PASS", f"All {len(users)} IAM users have MFA", [])
        return self._result(check, "FAIL", f"{len(no_mfa)} user(s) without MFA", no_mfa)

    def check_unused_credentials(self, check):
        # Simplified: check if users exist (full check needs credential report)
        users = self.iam.get("auth", {}).get("UserDetailList", [])
        return self._result(check, "WARN", f"{len(users)} users to review for unused credentials", [u["UserName"] for u in users])

    def check_password_policy(self, check):
        s = self.iam.get("summary", {})
        if s.get("AccountPasswordPolicy"):
            return self._result(check, "PASS", "Password policy is configured", [])
        # If summary doesn't have it, warn
        return self._result(check, "WARN", "Password policy configuration could not be verified", [])

    def check_no_inline_policies(self, check):
        users = self.iam.get("auth", {}).get("UserDetailList", [])
        with_inline = [u["UserName"] for u in users if u.get("UserPolicyList")]
        if not with_inline:
            return self._result(check, "PASS", "No users have inline policies", [])
        return self._result(check, "FAIL", f"{len(with_inline)} user(s) have inline policies", with_inline)

    def check_no_star_policies(self, check):
        policies = self.iam.get("auth", {}).get("Policies", [])
        overly_permissive = []
        for p in policies:
            for v in p.get("PolicyVersionList", []):
                doc = v.get("Document", {})
                if isinstance(doc, str):
                    try:
                        doc = json.loads(doc)
                    except Exception:
                        continue
                for stmt in doc.get("Statement", []):
                    action = stmt.get("Action", "")
                    resource = stmt.get("Resource", "")
                    if action == "*" and resource == "*" and stmt.get("Effect") == "Allow":
                        overly_permissive.append(p.get("PolicyName", "Unknown"))
        if not overly_permissive:
            return self._result(check, "PASS", "No overly permissive policies found", [])
        return self._result(check, "FAIL", f"{len(overly_permissive)} policy(ies) with full admin access", list(set(overly_permissive)))

    # ── S3 Checks ──
    def check_s3_public_access(self, check):
        buckets = self.s3
        # Without per-bucket ACL data, report count
        return self._result(check, "WARN", f"{len(buckets)} buckets to review for public access", [b.get("Name", "") for b in buckets[:20]])

    def check_s3_encryption(self, check):
        buckets = self.s3
        return self._result(check, "WARN", f"{len(buckets)} buckets to verify encryption settings", [b.get("Name", "") for b in buckets[:20]])

    def check_s3_logging(self, check):
        buckets = self.s3
        return self._result(check, "WARN", f"{len(buckets)} buckets to verify access logging", [b.get("Name", "") for b in buckets[:20]])

    def check_s3_versioning(self, check):
        buckets = self.s3
        return self._result(check, "WARN", f"{len(buckets)} buckets to verify versioning", [b.get("Name", "") for b in buckets[:20]])

    def check_s3_ssl(self, check):
        buckets = self.s3
        return self._result(check, "WARN", f"{len(buckets)} buckets to verify SSL enforcement", [b.get("Name", "") for b in buckets[:20]])

    # ── EC2 Checks ──
    def check_ec2_public_ip(self, check):
        public = []
        for region, instances in self.ec2.items():
            for inst in instances:
                if inst.get("PublicIpAddress"):
                    public.append(f"{inst.get('InstanceId', '')} ({region})")
        if not public:
            return self._result(check, "PASS", "No EC2 instances with public IPs", [])
        return self._result(check, "FAIL", f"{len(public)} instance(s) with public IPs", public)

    def check_ec2_imdsv2(self, check):
        non_v2 = []
        for region, instances in self.ec2.items():
            for inst in instances:
                meta = inst.get("MetadataOptions", {})
                if meta.get("HttpTokens") != "required":
                    non_v2.append(f"{inst.get('InstanceId', '')} ({region})")
        if not non_v2:
            return self._result(check, "PASS", "All instances use IMDSv2", [])
        return self._result(check, "FAIL", f"{len(non_v2)} instance(s) not enforcing IMDSv2", non_v2)

    def check_ebs_encryption(self, check):
        unencrypted = []
        for region, instances in self.ec2.items():
            for inst in instances:
                for bdm in inst.get("BlockDeviceMappings", []):
                    ebs = bdm.get("Ebs", {})
                    if not ebs.get("Encrypted", True):  # default True if not present
                        unencrypted.append(f"{ebs.get('VolumeId', '')} on {inst.get('InstanceId', '')} ({region})")
        if not unencrypted:
            return self._result(check, "PASS", "All EBS volumes appear encrypted", [])
        return self._result(check, "FAIL", f"{len(unencrypted)} unencrypted EBS volume(s)", unencrypted)

    # ── Security Group Checks ──
    def _check_sg_port(self, check, ports, label):
        open_sgs = []
        for region, sgs in self.sgs.items():
            for sg in sgs:
                for rule in sg.get("IpPermissions", []):
                    from_port = rule.get("FromPort")
                    to_port = rule.get("ToPort")
                    protocol = rule.get("IpProtocol", "")
                    for ipr in rule.get("IpRanges", []) + rule.get("Ipv6Ranges", []):
                        cidr = ipr.get("CidrIp", ipr.get("CidrIpv6", ""))
                        if cidr in ("0.0.0.0/0", "::/0"):
                            if protocol == "-1" or (from_port is not None and any(from_port <= p <= (to_port or from_port) for p in ports)):
                                open_sgs.append(f"{sg.get('GroupId', '')} ({sg.get('GroupName', '')}) - {region}")
        open_sgs = list(set(open_sgs))
        if not open_sgs:
            return self._result(check, "PASS", f"No security groups allow unrestricted {label} access", [])
        return self._result(check, "FAIL", f"{len(open_sgs)} security group(s) allow unrestricted {label} access", open_sgs)

    def check_sg_ssh(self, check):
        return self._check_sg_port(check, [22], "SSH")

    def check_sg_rdp(self, check):
        return self._check_sg_port(check, [3389], "RDP")

    def check_sg_sensitive_ports(self, check):
        return self._check_sg_port(check, [3306, 5432, 1433, 27017, 6379], "database")

    def check_sg_default(self, check):
        non_restrictive = []
        for region, sgs in self.sgs.items():
            for sg in sgs:
                if sg.get("GroupName") == "default" and sg.get("IpPermissions"):
                    non_restrictive.append(f"{sg.get('GroupId', '')} ({region})")
        if not non_restrictive:
            return self._result(check, "PASS", "All default security groups restrict traffic", [])
        return self._result(check, "FAIL", f"{len(non_restrictive)} default SG(s) have rules", non_restrictive)

    def check_vpc_flow_logs(self, check):
        # VPC flow logs need separate API call data
        vpcs = self.loader.get_vpcs()
        total = sum(len(v) for v in vpcs.values())
        return self._result(check, "WARN", f"{total} VPC(s) to verify flow log configuration", [])

    # ── RDS Checks ──
    def check_rds_public(self, check):
        public = []
        for region, instances in self.rds.items():
            for db in instances:
                if db.get("PubliclyAccessible"):
                    public.append(f"{db.get('DBInstanceIdentifier', '')} ({region})")
        if not public:
            return self._result(check, "PASS", "No RDS instances are publicly accessible", [])
        return self._result(check, "FAIL", f"{len(public)} RDS instance(s) publicly accessible", public)

    def check_rds_encryption(self, check):
        unencrypted = []
        for region, instances in self.rds.items():
            for db in instances:
                if not db.get("StorageEncrypted"):
                    unencrypted.append(f"{db.get('DBInstanceIdentifier', '')} ({region})")
        if not unencrypted:
            return self._result(check, "PASS", "All RDS instances have encryption enabled", [])
        return self._result(check, "FAIL", f"{len(unencrypted)} RDS instance(s) without encryption", unencrypted)

    def check_rds_multi_az(self, check):
        single_az = []
        for region, instances in self.rds.items():
            for db in instances:
                if not db.get("MultiAZ"):
                    single_az.append(f"{db.get('DBInstanceIdentifier', '')} ({region})")
        if not single_az:
            return self._result(check, "PASS", "All RDS instances use Multi-AZ", [])
        return self._result(check, "FAIL", f"{len(single_az)} RDS instance(s) without Multi-AZ", single_az)

    # ── Logging Checks ──
    def check_cloudtrail_enabled(self, check):
        has_trail = any(bool(trails) for trails in self.cloudtrail.values())
        if has_trail:
            return self._result(check, "PASS", "CloudTrail is enabled", [])
        return self._result(check, "FAIL", "No CloudTrail trails found", ["account"])

    def check_cloudtrail_validation(self, check):
        for region, trails in self.cloudtrail.items():
            for trail in trails:
                if trail.get("LogFileValidationEnabled"):
                    return self._result(check, "PASS", "CloudTrail log validation is enabled", [])
        if any(self.cloudtrail.values()):
            return self._result(check, "FAIL", "CloudTrail log validation is not enabled", ["cloudtrail"])
        return self._result(check, "N/A", "No CloudTrail trails to check", [])

    def check_guardduty_enabled(self, check):
        has_gd = any(bool(dets) for dets in self.guardduty.values())
        if has_gd:
            return self._result(check, "PASS", "GuardDuty is enabled", [])
        return self._result(check, "FAIL", "GuardDuty is not enabled in any region", ["account"])

    # ── Lambda Checks ──
    def check_lambda_public(self, check):
        # Would need resource-based policy data
        total = sum(len(fns) for fns in self.lambdas.values())
        return self._result(check, "WARN", f"{total} Lambda function(s) to verify access policies", [])

    # ── Snapshot Checks ──
    def check_snapshot_encryption(self, check):
        unencrypted = []
        for region, snaps in self.snapshots.items():
            for snap in snaps:
                if not snap.get("Encrypted"):
                    unencrypted.append(f"{snap.get('SnapshotId', '')} ({region})")
        if not unencrypted:
            return self._result(check, "PASS", "All snapshots are encrypted", [])
        return self._result(check, "FAIL", f"{len(unencrypted)} unencrypted snapshot(s)", unencrypted)

    def check_snapshot_public(self, check):
        # Would need snapshot permissions data
        total = sum(len(s) for s in self.snapshots.values())
        return self._result(check, "WARN", f"{total} snapshot(s) to verify sharing permissions", [])


# ═══════════════════════════════════════════════════════════════════
# COMPLIANCE SCANNER — runs all checks for all frameworks
# ═══════════════════════════════════════════════════════════════════

class ComplianceScanner:
    """Main compliance scanning engine."""

    def __init__(self, account_data_dir: Path):
        self.account_data_dir = account_data_dir

    def scan(self, account_name: str, framework_ids: Optional[List[str]] = None) -> dict:
        """Run compliance scan for an account against specified frameworks."""
        loader = CloudDataLoader(self.account_data_dir, account_name)
        if not loader.regions:
            return {"error": f"No data found for account '{account_name}'"}

        evaluator = CheckEvaluator(loader)
        frameworks = get_all_frameworks()

        if framework_ids:
            frameworks = {k: v for k, v in frameworks.items() if k in framework_ids}

        scan_id = hashlib.md5(f"{account_name}-{datetime.now().isoformat()}".encode()).hexdigest()[:12]
        scan_time = datetime.now().isoformat()

        results = {
            "scan_id": scan_id,
            "account": account_name,
            "scanned_at": scan_time,
            "frameworks": {},
            "summary": {
                "total_checks": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0,
                "errors": 0,
                "not_applicable": 0,
                "overall_score": 0,
                "severity_counts": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0},
            },
            "all_findings": [],
        }

        total_score_sum = 0

        for fw_id, fw in frameworks.items():
            fw_result = {
                "framework_id": fw_id,
                "name": fw.name,
                "version": fw.version,
                "category": fw.category,
                "icon": fw.icon,
                "color": fw.color,
                "controls": [],
                "total_checks": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0,
                "score": 0,
            }

            for control in fw.controls:
                ctrl_result = {
                    "control_id": control.control_id,
                    "title": control.title,
                    "section": control.section,
                    "severity": control.severity,
                    "checks": [],
                    "passed": 0,
                    "failed": 0,
                    "total": len(control.checks),
                }

                for check in control.checks:
                    check_result = evaluator.evaluate(check)
                    check_result["framework_id"] = fw_id
                    check_result["control_id"] = control.control_id
                    ctrl_result["checks"].append(check_result)

                    status = check_result["status"]
                    if status == "PASS":
                        ctrl_result["passed"] += 1
                        fw_result["passed"] += 1
                        results["summary"]["passed"] += 1
                    elif status == "FAIL":
                        ctrl_result["failed"] += 1
                        fw_result["failed"] += 1
                        results["summary"]["failed"] += 1
                        results["summary"]["severity_counts"][check.severity] = \
                            results["summary"]["severity_counts"].get(check.severity, 0) + 1
                        results["all_findings"].append(check_result)
                    elif status == "WARN":
                        fw_result["warnings"] += 1
                        results["summary"]["warnings"] += 1
                    elif status == "ERROR":
                        results["summary"]["errors"] += 1
                    else:
                        results["summary"]["not_applicable"] += 1

                    fw_result["total_checks"] += 1
                    results["summary"]["total_checks"] += 1

                fw_result["controls"].append(ctrl_result)

            # Calculate framework score
            evaluable = fw_result["passed"] + fw_result["failed"]
            fw_result["score"] = round(fw_result["passed"] / evaluable * 100) if evaluable > 0 else 0
            total_score_sum += fw_result["score"]

            results["frameworks"][fw_id] = fw_result

        # Overall score
        fw_count = len(results["frameworks"])
        results["summary"]["overall_score"] = round(total_score_sum / fw_count) if fw_count > 0 else 0

        # Sort findings by severity
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        results["all_findings"].sort(key=lambda f: sev_order.get(f.get("severity", "INFO"), 5))

        # Generate AI recommendations
        results["ai_recommendations"] = self._generate_recommendations(results)

        return results

    def _generate_recommendations(self, results: dict) -> List[dict]:
        """Generate AI-powered recommendations based on scan results."""
        recs = []
        findings = results["all_findings"]

        # Critical findings
        critical = [f for f in findings if f["severity"] == "CRITICAL"]
        if critical:
            recs.append({
                "priority": "CRITICAL",
                "title": "Address Critical Security Issues Immediately",
                "description": f"Found {len(critical)} critical compliance violation(s) that require immediate attention.",
                "items": [f"{f['title']} — {f['reason']}" for f in critical[:5]],
                "impact": "These issues expose your infrastructure to significant security risks including unauthorized access and data breaches.",
            })

        # High findings
        high = [f for f in findings if f["severity"] == "HIGH"]
        if high:
            recs.append({
                "priority": "HIGH",
                "title": "Resolve High-Severity Findings",
                "description": f"Found {len(high)} high-severity violation(s) across compliance frameworks.",
                "items": [f"{f['title']} — {f['reason']}" for f in high[:5]],
                "impact": "These issues may lead to data exposure, compliance audit failures, or security incidents.",
            })

        # Framework-specific recommendations
        for fw_id, fw in results["frameworks"].items():
            if fw["score"] < 50:
                failed_controls = [c for c in fw["controls"] if c["failed"] > 0]
                recs.append({
                    "priority": "HIGH",
                    "title": f"Improve {fw['name']} Compliance ({fw['score']}%)",
                    "description": f"{fw['name']} compliance score is below 50%. Focus on failed controls.",
                    "items": [f"{c['section']} — {c['failed']}/{c['total']} checks failed" for c in failed_controls[:5]],
                    "impact": f"Low {fw['name']} compliance may result in audit failures or regulatory penalties.",
                })

        # Best practice recommendations
        score = results["summary"]["overall_score"]
        if score < 80:
            recs.append({
                "priority": "MEDIUM",
                "title": "General Security Hardening",
                "description": "Implement security best practices to improve overall compliance posture.",
                "items": [
                    "Enable encryption at rest for all data stores (S3, RDS, EBS)",
                    "Enforce MFA for all IAM users with console access",
                    "Restrict security group rules to specific CIDRs",
                    "Enable CloudTrail and GuardDuty in all regions",
                    "Implement least-privilege IAM policies",
                    "Enable VPC Flow Logs for network monitoring",
                ],
                "impact": "These measures significantly reduce your attack surface and improve compliance scores.",
            })

        return recs


# ═══════════════════════════════════════════════════════════════════
# RESULTS STORAGE — saves scan results to JSON files
# ═══════════════════════════════════════════════════════════════════

class ComplianceStore:
    """Stores and retrieves compliance scan results."""

    def __init__(self, storage_dir: Path):
        self.storage_dir = storage_dir / "compliance_results"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def save(self, account: str, results: dict):
        """Save scan results."""
        acct_dir = self.storage_dir / account
        acct_dir.mkdir(exist_ok=True)
        # Save latest
        with open(acct_dir / "latest.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        # Save historical
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(acct_dir / f"scan_{ts}.json", "w") as f:
            json.dump(results, f, indent=2, default=str)

    def get_latest(self, account: str) -> Optional[dict]:
        """Get latest scan results."""
        path = self.storage_dir / account / "latest.json"
        if path.exists():
            with open(path) as f:
                return json.load(f)
        return None

    def get_history(self, account: str) -> List[dict]:
        """Get scan history summaries."""
        acct_dir = self.storage_dir / account
        if not acct_dir.exists():
            return []
        history = []
        for f in sorted(acct_dir.glob("scan_*.json"), reverse=True)[:20]:
            try:
                with open(f) as fh:
                    data = json.load(fh)
                history.append({
                    "scan_id": data.get("scan_id"),
                    "scanned_at": data.get("scanned_at"),
                    "overall_score": data.get("summary", {}).get("overall_score", 0),
                    "total_checks": data.get("summary", {}).get("total_checks", 0),
                    "passed": data.get("summary", {}).get("passed", 0),
                    "failed": data.get("summary", {}).get("failed", 0),
                    "frameworks_count": len(data.get("frameworks", {})),
                })
            except Exception:
                continue
        return history
