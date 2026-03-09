"""
AWS Cloud Provider — API Routes
AWS-specific endpoints mounted under /api/aws/
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends

from .parser import AWSParser, _read_json, _get_regions
from .auditor import AWSAuditor
from ..base import BaseRoutes

router = APIRouter(prefix="/api/aws", tags=["AWS"])
_parser = AWSParser()
_auditor = AWSAuditor()


class AWSRoutes(BaseRoutes):

    def register_routes(self, app, get_current_user, data_base_dir: Path):

        @router.get("/resources/{account_name}")
        def get_aws_resources(account_name: str, user: dict = Depends(get_current_user)):
            return _parser.parse_resources(account_name, data_base_dir)

        @router.get("/iam/{account_name}")
        def get_aws_iam(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "aws" / account_name
            regions = _get_regions(acct_dir)
            if not regions:
                raise HTTPException(404, "No data found")
            region_dir = acct_dir / regions[0]
            auth = _read_json(region_dir / "iam-get-account-authorization-details.json")
            summary = _read_json(region_dir / "iam-get-account-summary.json")

            users = []
            for u in auth.get("UserDetailList", []):
                users.append({
                    "name": u.get("UserName"), "arn": u.get("Arn"),
                    "created": u.get("CreateDate"),
                    "policies": [p["PolicyName"] for p in u.get("AttachedManagedPolicies", [])],
                    "inline_policies": list(u.get("UserPolicyList", [])),
                    "groups": u.get("GroupList", []),
                    "mfa_devices": u.get("MFADevices", []),
                })
            roles = []
            for r in auth.get("RoleDetailList", []):
                roles.append({
                    "name": r.get("RoleName"), "arn": r.get("Arn"),
                    "created": r.get("CreateDate"),
                    "policies": [p["PolicyName"] for p in r.get("AttachedManagedPolicies", [])],
                    "trust_policy": r.get("AssumeRolePolicyDocument"),
                })
            policies = []
            for p in auth.get("Policies", []):
                policies.append({
                    "name": p.get("PolicyName"), "arn": p.get("Arn"),
                    "attachment_count": p.get("AttachmentCount"),
                    "is_attachable": p.get("IsAttachable"),
                })

            return {"account": account_name, "provider": "aws",
                    "summary": summary.get("SummaryMap", {}),
                    "users": users, "roles": roles, "policies": policies}

        @router.get("/security-groups/{account_name}")
        def get_aws_security_groups(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "aws" / account_name
            regions = _get_regions(acct_dir)
            results = []
            for region in regions:
                sgs = _read_json(acct_dir / region / "ec2-describe-security-groups.json")
                for sg in sgs.get("SecurityGroups", []):
                    open_to_world = []
                    for rule in sg.get("IpPermissions", []):
                        for ip_range in rule.get("IpRanges", []):
                            if ip_range.get("CidrIp") == "0.0.0.0/0":
                                open_to_world.append({
                                    "protocol": rule.get("IpProtocol"),
                                    "from_port": rule.get("FromPort"),
                                    "to_port": rule.get("ToPort"),
                                })
                        for ip_range in rule.get("Ipv6Ranges", []):
                            if ip_range.get("CidrIpv6") == "::/0":
                                open_to_world.append({
                                    "protocol": rule.get("IpProtocol"),
                                    "from_port": rule.get("FromPort"),
                                    "to_port": rule.get("ToPort"),
                                })
                    if open_to_world:
                        results.append({
                            "region": region, "group_id": sg["GroupId"],
                            "group_name": sg["GroupName"], "vpc_id": sg.get("VpcId"),
                            "open_rules": open_to_world,
                            "severity": "CRITICAL" if any(
                                r.get("from_port") in (22, 3389, 3306, 5432) or r.get("protocol") == "-1"
                                for r in open_to_world
                            ) else "HIGH",
                        })
            return {"account": account_name, "provider": "aws", "risky_groups": results}

        @router.get("/dashboard/{account_name}")
        def get_aws_dashboard(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "aws" / account_name
            if not acct_dir.exists():
                acct_dir = data_base_dir / account_name  # legacy
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            return _parser.parse_dashboard(account_name, data_base_dir)

        @router.post("/audit/{account_name}")
        def run_aws_audit(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "aws" / account_name
            if not acct_dir.exists():
                acct_dir = data_base_dir / account_name  # legacy
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            findings = _auditor.run_audit(account_name, data_base_dir)
            severity_counts = {}
            for f in findings:
                s = f.get("severity", "INFO")
                severity_counts[s] = severity_counts.get(s, 0) + 1
            return {
                "account": account_name, "provider": "aws",
                "total": len(findings), "findings": findings,
                "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]},
            }

        app.include_router(router)
