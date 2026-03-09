"""
AWS Cloud Provider — Data Collector
Collects AWS resource data using boto3.
"""

import json
from pathlib import Path
from ..base import BaseCollector, ProviderInfo, CredentialField


ALL_AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2",
    "eu-north-1", "eu-south-1", "eu-south-2",
    "ap-south-1", "ap-south-2", "ap-southeast-1", "ap-southeast-2",
    "ap-southeast-3", "ap-southeast-4", "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
    "ap-east-1", "sa-east-1", "ca-central-1", "ca-west-1",
    "me-south-1", "me-central-1", "af-south-1", "il-central-1",
]


class AWSCollector(BaseCollector):

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id="aws",
            name="Amazon Web Services",
            short_name="AWS",
            icon="aws",
            color="#FF9900",
            description="Collect and audit AWS cloud resources including EC2, S3, RDS, Lambda, IAM, and more.",
            credential_fields=[
                CredentialField(key="access_key_id", label="Access Key ID", placeholder="AKIAIOSFODNN7EXAMPLE"),
                CredentialField(key="secret_access_key", label="Secret Access Key", placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", secret=True),
            ],
            region_support=True,
        )

    def validate_credentials(self, credentials: dict) -> dict:
        import boto3
        try:
            kwargs = {"region_name": "us-east-1"}
            if credentials.get("access_key_id"):
                kwargs["aws_access_key_id"] = credentials["access_key_id"]
                kwargs["aws_secret_access_key"] = credentials["secret_access_key"]
            sts = boto3.client("sts", **kwargs)
            identity = sts.get_caller_identity()
            return {
                "valid": True,
                "account_id": identity.get("Account"),
                "arn": identity.get("Arn"),
                "error": "",
            }
        except Exception as e:
            return {"valid": False, "account_id": "", "error": str(e)}

    def get_regions(self, credentials: dict) -> list[str]:
        import boto3
        kwargs = {"region_name": "us-east-1"}
        if credentials.get("access_key_id"):
            kwargs["aws_access_key_id"] = credentials["access_key_id"]
            kwargs["aws_secret_access_key"] = credentials["secret_access_key"]
        try:
            ec2 = boto3.client("ec2", **kwargs)
            resp = ec2.describe_regions(AllRegions=False)
            return [r["RegionName"] for r in resp.get("Regions", [])]
        except Exception:
            return ALL_AWS_REGIONS[:15]

    def collect(self, account_name: str, region: str, credentials: dict,
                data_dir: Path, progress_callback=None) -> dict:
        import boto3

        kwargs = {"region_name": region}
        if credentials.get("access_key_id"):
            kwargs["aws_access_key_id"] = credentials["access_key_id"]
            kwargs["aws_secret_access_key"] = credentials["secret_access_key"]

        session = boto3.Session(**kwargs)
        acct_dir = data_dir / "aws" / account_name / region
        acct_dir.mkdir(parents=True, exist_ok=True)

        collected = []
        errors = []

        def _collect_service(filename, client_name, method, **call_kwargs):
            try:
                client = session.client(client_name)
                data = getattr(client, method)(**call_kwargs)
                data.pop("ResponseMetadata", None)
                with open(acct_dir / filename, "w") as f:
                    json.dump(data, f, indent=2, default=str)
                collected.append(filename)
            except Exception as e:
                errors.append(f"{filename}: {str(e)[:100]}")

        services = [
            ("ec2-describe-instances.json", "ec2", "describe_instances", {}),
            ("ec2-describe-security-groups.json", "ec2", "describe_security_groups", {}),
            ("ec2-describe-vpcs.json", "ec2", "describe_vpcs", {}),
            ("ec2-describe-subnets.json", "ec2", "describe_subnets", {}),
            ("s3-list-buckets.json", "s3", "list_buckets", {}),
            ("lambda-list-functions.json", "lambda", "list_functions", {}),
            ("rds-describe-db-instances.json", "rds", "describe_db_instances", {}),
            ("elb-describe-load-balancers.json", "elb", "describe_load_balancers", {}),
            ("elbv2-describe-load-balancers.json", "elbv2", "describe_load_balancers", {}),
            ("iam-get-account-authorization-details.json", "iam", "get_account_authorization_details", {}),
            ("iam-get-account-summary.json", "iam", "get_account_summary", {}),
            ("sts-get-caller-identity.json", "sts", "get_caller_identity", {}),
            ("ec2-describe-snapshots.json", "ec2", "describe_snapshots", {"OwnerIds": ["self"]}),
            ("ec2-describe-network-interfaces.json", "ec2", "describe_network_interfaces", {}),
            ("cloudtrail-describe-trails.json", "cloudtrail", "describe_trails", {}),
            ("guardduty-list-detectors.json", "guardduty", "list_detectors", {}),
        ]

        for i, (filename, client_name, method, call_kwargs) in enumerate(services):
            _collect_service(filename, client_name, method, **call_kwargs)
            if progress_callback:
                progress_callback(int((i + 1) / len(services) * 100))

        return {"resources_collected": len(collected), "errors": errors}
