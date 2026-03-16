"""
CloudLunar Compliance Module — Framework Definitions
Full compliance rule libraries for CIS, NIST, SOC2, ISO27001, PCI-DSS, HIPAA, GDPR, WAF.
Each framework contains controls → policies → resource checks → risk levels → remediation.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARN = "WARN"
    ERROR = "ERROR"
    NOT_APPLICABLE = "N/A"


class ResourceType(str, Enum):
    EC2 = "ec2"
    S3 = "s3"
    IAM = "iam"
    RDS = "rds"
    VPC = "vpc"
    SECURITY_GROUP = "security_group"
    LAMBDA = "lambda"
    ELB = "elb"
    CLOUDTRAIL = "cloudtrail"
    GUARDDUTY = "guardduty"
    KMS = "kms"
    SNS = "sns"
    CLOUDWATCH = "cloudwatch"
    CONFIG = "config"
    NETWORK = "network"
    SNAPSHOT = "snapshot"
    ACCOUNT = "account"


@dataclass
class ComplianceCheck:
    """Individual compliance check that evaluates a resource configuration."""
    check_id: str
    title: str
    description: str
    resource_type: str
    severity: str
    check_function: str  # Name of the function in the engine
    remediation: str
    cloud_providers: List[str] = field(default_factory=lambda: ["aws", "azure", "gcp"])


@dataclass
class ComplianceControl:
    """A control within a compliance framework (e.g., CIS 1.1)."""
    control_id: str
    title: str
    description: str
    section: str
    severity: str
    checks: List[ComplianceCheck] = field(default_factory=list)


@dataclass
class ComplianceFramework:
    """A compliance framework (e.g., CIS AWS Foundations)."""
    framework_id: str
    name: str
    version: str
    description: str
    category: str  # "benchmark", "regulation", "standard", "best_practice"
    icon: str
    color: str
    controls: List[ComplianceControl] = field(default_factory=list)

    @property
    def total_checks(self):
        return sum(len(c.checks) for c in self.controls)


# ═══════════════════════════════════════════════════════════════════
# COMPLIANCE CHECK DEFINITIONS
# Each check maps to a function name in compliance_engine.py
# ═══════════════════════════════════════════════════════════════════

# ── IAM Checks ──
IAM_CHECKS = {
    "iam_root_mfa": ComplianceCheck(
        check_id="iam_root_mfa", title="Root account MFA enabled",
        description="Ensure the root account has MFA (multi-factor authentication) enabled",
        resource_type="iam", severity="CRITICAL", check_function="check_root_mfa",
        remediation="Enable MFA on the root account: AWS Console → IAM → Dashboard → Activate MFA on root account. Use a hardware MFA device for maximum security."),
    "iam_root_access_keys": ComplianceCheck(
        check_id="iam_root_access_keys", title="No root account access keys",
        description="Ensure no access keys exist for the root account",
        resource_type="iam", severity="CRITICAL", check_function="check_root_access_keys",
        remediation="Delete root account access keys: AWS Console → IAM → Security Credentials → Delete access keys. Use IAM users or roles instead."),
    "iam_user_mfa": ComplianceCheck(
        check_id="iam_user_mfa", title="IAM users have MFA enabled",
        description="Ensure all IAM users with console access have MFA enabled",
        resource_type="iam", severity="HIGH", check_function="check_user_mfa",
        remediation="Enable MFA for all IAM users: AWS Console → IAM → Users → Select user → Security Credentials → Assign MFA device."),
    "iam_unused_credentials": ComplianceCheck(
        check_id="iam_unused_credentials", title="No unused IAM credentials",
        description="Ensure IAM credentials unused for 90+ days are disabled",
        resource_type="iam", severity="MEDIUM", check_function="check_unused_credentials",
        remediation="Disable or remove unused IAM credentials. Run: aws iam generate-credential-report and review users with no recent activity."),
    "iam_password_policy": ComplianceCheck(
        check_id="iam_password_policy", title="Strong password policy",
        description="Ensure IAM password policy requires minimum length, complexity, and rotation",
        resource_type="iam", severity="MEDIUM", check_function="check_password_policy",
        remediation="Set strong password policy: AWS Console → IAM → Account Settings → Password Policy. Require 14+ chars, uppercase, lowercase, numbers, symbols."),
    "iam_no_inline_policies": ComplianceCheck(
        check_id="iam_no_inline_policies", title="No inline IAM policies",
        description="Ensure IAM users do not have inline policies attached",
        resource_type="iam", severity="LOW", check_function="check_no_inline_policies",
        remediation="Move inline policies to managed policies. Use aws iam put-user-policy to create managed policies and attach them."),
    "iam_no_star_policies": ComplianceCheck(
        check_id="iam_no_star_policies", title="No overly permissive policies",
        description="Ensure no IAM policies allow full * (star) administrative privileges",
        resource_type="iam", severity="HIGH", check_function="check_no_star_policies",
        remediation="Review and restrict IAM policies with Action: '*' and Resource: '*'. Apply least privilege principle."),
}

# ── S3 Checks ──
S3_CHECKS = {
    "s3_public_access": ComplianceCheck(
        check_id="s3_public_access", title="S3 buckets not publicly accessible",
        description="Ensure S3 buckets do not allow public read or write access",
        resource_type="s3", severity="CRITICAL", check_function="check_s3_public_access",
        remediation="Block public access: AWS Console → S3 → Select bucket → Permissions → Block Public Access → Enable all settings."),
    "s3_encryption": ComplianceCheck(
        check_id="s3_encryption", title="S3 bucket encryption enabled",
        description="Ensure all S3 buckets have default encryption enabled (SSE-S3 or SSE-KMS)",
        resource_type="s3", severity="HIGH", check_function="check_s3_encryption",
        remediation="Enable default encryption: AWS Console → S3 → Bucket → Properties → Default Encryption → Enable with AES-256 or AWS KMS."),
    "s3_logging": ComplianceCheck(
        check_id="s3_logging", title="S3 bucket logging enabled",
        description="Ensure S3 bucket access logging is enabled for audit purposes",
        resource_type="s3", severity="MEDIUM", check_function="check_s3_logging",
        remediation="Enable access logging: AWS Console → S3 → Bucket → Properties → Server Access Logging → Enable with target bucket."),
    "s3_versioning": ComplianceCheck(
        check_id="s3_versioning", title="S3 bucket versioning enabled",
        description="Ensure S3 bucket versioning is enabled for data protection",
        resource_type="s3", severity="MEDIUM", check_function="check_s3_versioning",
        remediation="Enable versioning: AWS Console → S3 → Bucket → Properties → Bucket Versioning → Enable."),
    "s3_ssl_requests": ComplianceCheck(
        check_id="s3_ssl_requests", title="S3 bucket enforces SSL",
        description="Ensure S3 bucket policy denies non-SSL (HTTP) requests",
        resource_type="s3", severity="MEDIUM", check_function="check_s3_ssl",
        remediation="Add bucket policy condition: 'aws:SecureTransport': 'false' → Effect: Deny to enforce HTTPS."),
}

# ── EC2 / Compute Checks ──
EC2_CHECKS = {
    "ec2_public_ip": ComplianceCheck(
        check_id="ec2_public_ip", title="EC2 instances without public IPs",
        description="Ensure EC2 instances do not have unnecessary public IP addresses",
        resource_type="ec2", severity="HIGH", check_function="check_ec2_public_ip",
        remediation="Remove public IPs from instances that don't need internet access. Use NAT Gateway or VPC endpoints for outbound traffic."),
    "ec2_imdsv2": ComplianceCheck(
        check_id="ec2_imdsv2", title="EC2 uses IMDSv2",
        description="Ensure EC2 instances use Instance Metadata Service Version 2 (IMDSv2)",
        resource_type="ec2", severity="MEDIUM", check_function="check_ec2_imdsv2",
        remediation="Enable IMDSv2: aws ec2 modify-instance-metadata-options --instance-id <id> --http-tokens required."),
    "ec2_ebs_encryption": ComplianceCheck(
        check_id="ec2_ebs_encryption", title="EBS volumes encrypted",
        description="Ensure all EBS volumes are encrypted at rest",
        resource_type="ec2", severity="HIGH", check_function="check_ebs_encryption",
        remediation="Enable EBS encryption by default: AWS Console → EC2 → Settings → EBS Encryption → Always encrypt new EBS volumes."),
}

# ── Network / Security Group Checks ──
NETWORK_CHECKS = {
    "sg_no_unrestricted_ssh": ComplianceCheck(
        check_id="sg_no_unrestricted_ssh", title="No unrestricted SSH access",
        description="Ensure security groups do not allow unrestricted ingress on port 22 (SSH)",
        resource_type="security_group", severity="CRITICAL", check_function="check_sg_ssh",
        remediation="Restrict SSH access to specific IPs: AWS Console → EC2 → Security Groups → Edit Inbound Rules → Change 0.0.0.0/0 to specific CIDR."),
    "sg_no_unrestricted_rdp": ComplianceCheck(
        check_id="sg_no_unrestricted_rdp", title="No unrestricted RDP access",
        description="Ensure security groups do not allow unrestricted ingress on port 3389 (RDP)",
        resource_type="security_group", severity="CRITICAL", check_function="check_sg_rdp",
        remediation="Restrict RDP access to specific IPs. Consider using AWS Systems Manager Session Manager instead of direct RDP."),
    "sg_no_unrestricted_ingress": ComplianceCheck(
        check_id="sg_no_unrestricted_ingress", title="No unrestricted ingress on sensitive ports",
        description="Ensure security groups do not allow 0.0.0.0/0 on database ports (3306, 5432, 1433, 27017)",
        resource_type="security_group", severity="CRITICAL", check_function="check_sg_sensitive_ports",
        remediation="Restrict database port access to application security groups only. Never expose databases to the internet."),
    "sg_default_restrict": ComplianceCheck(
        check_id="sg_default_restrict", title="Default security group restricts all traffic",
        description="Ensure the default security group of every VPC restricts all inbound and outbound traffic",
        resource_type="security_group", severity="MEDIUM", check_function="check_sg_default",
        remediation="Remove all inbound and outbound rules from the default security group. Create custom security groups instead."),
    "vpc_flow_logs": ComplianceCheck(
        check_id="vpc_flow_logs", title="VPC flow logs enabled",
        description="Ensure VPC flow logging is enabled for network monitoring",
        resource_type="vpc", severity="MEDIUM", check_function="check_vpc_flow_logs",
        remediation="Enable VPC Flow Logs: AWS Console → VPC → Select VPC → Flow Logs → Create flow log with CloudWatch or S3 destination."),
}

# ── RDS Checks ──
RDS_CHECKS = {
    "rds_public_access": ComplianceCheck(
        check_id="rds_public_access", title="RDS instances not publicly accessible",
        description="Ensure RDS instances are not publicly accessible from the internet",
        resource_type="rds", severity="CRITICAL", check_function="check_rds_public",
        remediation="Disable public access: AWS Console → RDS → Modify Instance → Connectivity → Public Access → No."),
    "rds_encryption": ComplianceCheck(
        check_id="rds_encryption", title="RDS encryption at rest enabled",
        description="Ensure RDS instances have encryption at rest enabled",
        resource_type="rds", severity="HIGH", check_function="check_rds_encryption",
        remediation="Enable encryption at rest. Note: Existing unencrypted instances must be migrated (snapshot → encrypt → restore)."),
    "rds_multi_az": ComplianceCheck(
        check_id="rds_multi_az", title="RDS Multi-AZ deployment",
        description="Ensure RDS instances use Multi-AZ deployment for high availability",
        resource_type="rds", severity="MEDIUM", check_function="check_rds_multi_az",
        remediation="Enable Multi-AZ: AWS Console → RDS → Modify Instance → Multi-AZ deployment → Yes."),
}

# ── Logging & Monitoring Checks ──
LOGGING_CHECKS = {
    "cloudtrail_enabled": ComplianceCheck(
        check_id="cloudtrail_enabled", title="CloudTrail enabled in all regions",
        description="Ensure CloudTrail is enabled and configured for all regions",
        resource_type="cloudtrail", severity="HIGH", check_function="check_cloudtrail_enabled",
        remediation="Create a multi-region trail: AWS Console → CloudTrail → Create Trail → Apply to all regions → Enable."),
    "cloudtrail_log_validation": ComplianceCheck(
        check_id="cloudtrail_log_validation", title="CloudTrail log file validation",
        description="Ensure CloudTrail log file integrity validation is enabled",
        resource_type="cloudtrail", severity="MEDIUM", check_function="check_cloudtrail_validation",
        remediation="Enable log file validation: AWS Console → CloudTrail → Trail → Edit → Enable log file validation."),
    "guardduty_enabled": ComplianceCheck(
        check_id="guardduty_enabled", title="GuardDuty enabled",
        description="Ensure Amazon GuardDuty is enabled for threat detection",
        resource_type="guardduty", severity="HIGH", check_function="check_guardduty_enabled",
        remediation="Enable GuardDuty: AWS Console → GuardDuty → Get Started → Enable GuardDuty."),
}

# ── Lambda Checks ──
LAMBDA_CHECKS = {
    "lambda_public_access": ComplianceCheck(
        check_id="lambda_public_access", title="Lambda functions not publicly accessible",
        description="Ensure Lambda functions do not have resource-based policies allowing public access",
        resource_type="lambda", severity="HIGH", check_function="check_lambda_public",
        remediation="Review Lambda resource policies and remove any statements allowing public access (Principal: '*')."),
}

# ── Snapshot / Backup Checks ──
BACKUP_CHECKS = {
    "snapshot_encryption": ComplianceCheck(
        check_id="snapshot_encryption", title="EBS snapshots encrypted",
        description="Ensure EBS snapshots are encrypted",
        resource_type="snapshot", severity="MEDIUM", check_function="check_snapshot_encryption",
        remediation="Enable encryption for new snapshots. Copy unencrypted snapshots with encryption enabled."),
    "snapshot_not_public": ComplianceCheck(
        check_id="snapshot_not_public", title="EBS snapshots not public",
        description="Ensure EBS snapshots are not publicly shared",
        resource_type="snapshot", severity="HIGH", check_function="check_snapshot_public",
        remediation="Modify snapshot permissions: AWS Console → EC2 → Snapshots → Modify Permissions → Make Private."),
}

ALL_CHECKS = {
    **IAM_CHECKS, **S3_CHECKS, **EC2_CHECKS, **NETWORK_CHECKS,
    **RDS_CHECKS, **LOGGING_CHECKS, **LAMBDA_CHECKS, **BACKUP_CHECKS,
}


# ═══════════════════════════════════════════════════════════════════
# FRAMEWORK DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

def _build_cis_aws() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="cis_aws", name="CIS AWS Foundations Benchmark",
        version="1.5.0", description="Center for Internet Security (CIS) benchmark for AWS foundational security best practices.",
        category="benchmark", icon="Shield", color="#ef4444",
        controls=[
            ComplianceControl("1", "Identity and Access Management", "IAM configuration controls", "1 - IAM", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_root_access_keys"], IAM_CHECKS["iam_user_mfa"],
                IAM_CHECKS["iam_unused_credentials"], IAM_CHECKS["iam_password_policy"],
                IAM_CHECKS["iam_no_inline_policies"], IAM_CHECKS["iam_no_star_policies"],
            ]),
            ComplianceControl("2", "Storage", "S3 and data storage controls", "2 - Storage", "HIGH", [
                S3_CHECKS["s3_public_access"], S3_CHECKS["s3_encryption"], S3_CHECKS["s3_logging"],
                S3_CHECKS["s3_versioning"], S3_CHECKS["s3_ssl_requests"],
            ]),
            ComplianceControl("3", "Logging", "CloudTrail and monitoring controls", "3 - Logging", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["cloudtrail_log_validation"],
                LOGGING_CHECKS["guardduty_enabled"],
            ]),
            ComplianceControl("4", "Networking", "VPC and security group controls", "4 - Networking", "CRITICAL", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_no_unrestricted_ingress"], NETWORK_CHECKS["sg_default_restrict"],
                NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("5", "Compute", "EC2 and compute controls", "5 - Compute", "HIGH", [
                EC2_CHECKS["ec2_public_ip"], EC2_CHECKS["ec2_imdsv2"], EC2_CHECKS["ec2_ebs_encryption"],
            ]),
        ],
    )


def _build_nist_800_53() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="nist_800_53", name="NIST 800-53",
        version="Rev 5", description="National Institute of Standards and Technology Special Publication 800-53 — Security and Privacy Controls.",
        category="standard", icon="BookOpen", color="#3b82f6",
        controls=[
            ComplianceControl("AC", "Access Control", "Controls for managing access to systems and data", "AC - Access Control", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
                IAM_CHECKS["iam_password_policy"], IAM_CHECKS["iam_unused_credentials"],
            ]),
            ComplianceControl("AU", "Audit and Accountability", "Controls for audit logging and monitoring", "AU - Audit", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["cloudtrail_log_validation"],
                S3_CHECKS["s3_logging"], LOGGING_CHECKS["guardduty_enabled"],
            ]),
            ComplianceControl("SC", "System and Communications Protection", "Controls for data protection and encryption", "SC - System Protection", "HIGH", [
                S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"], EC2_CHECKS["ec2_ebs_encryption"],
                S3_CHECKS["s3_ssl_requests"], NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("CM", "Configuration Management", "Controls for secure system configuration", "CM - Config Management", "MEDIUM", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_default_restrict"], EC2_CHECKS["ec2_imdsv2"],
            ]),
            ComplianceControl("CP", "Contingency Planning", "Controls for backup and recovery", "CP - Contingency", "MEDIUM", [
                RDS_CHECKS["rds_multi_az"], S3_CHECKS["s3_versioning"], BACKUP_CHECKS["snapshot_encryption"],
            ]),
        ],
    )


def _build_soc2() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="soc2", name="SOC 2",
        version="Type II", description="Service Organization Control 2 — Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.",
        category="standard", icon="Award", color="#8b5cf6",
        controls=[
            ComplianceControl("CC6", "Logical and Physical Access Controls", "Controls for system access management", "CC6 - Access", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
                IAM_CHECKS["iam_root_access_keys"], IAM_CHECKS["iam_password_policy"],
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
            ]),
            ComplianceControl("CC7", "System Operations", "Controls for monitoring and incident response", "CC7 - Operations", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["guardduty_enabled"],
                NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("CC8", "Change Management", "Controls for change control processes", "CC8 - Change Mgmt", "MEDIUM", [
                NETWORK_CHECKS["sg_default_restrict"], EC2_CHECKS["ec2_imdsv2"],
            ]),
            ComplianceControl("A1", "Availability", "Controls for system availability and resilience", "A1 - Availability", "MEDIUM", [
                RDS_CHECKS["rds_multi_az"], S3_CHECKS["s3_versioning"],
            ]),
            ComplianceControl("C1", "Confidentiality", "Controls for data confidentiality", "C1 - Confidentiality", "HIGH", [
                S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"], EC2_CHECKS["ec2_ebs_encryption"],
                S3_CHECKS["s3_public_access"], RDS_CHECKS["rds_public_access"],
                BACKUP_CHECKS["snapshot_encryption"], BACKUP_CHECKS["snapshot_not_public"],
            ]),
        ],
    )


def _build_iso27001() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="iso27001", name="ISO 27001",
        version="2022", description="International standard for information security management systems (ISMS).",
        category="standard", icon="Globe", color="#06b6d4",
        controls=[
            ComplianceControl("A.5", "Information Security Policies", "Organizational security controls", "A.5 - Policies", "MEDIUM", [
                IAM_CHECKS["iam_password_policy"],
            ]),
            ComplianceControl("A.8", "Asset Management", "Controls for asset identification and classification", "A.8 - Assets", "MEDIUM", [
                S3_CHECKS["s3_versioning"], S3_CHECKS["s3_logging"],
            ]),
            ComplianceControl("A.9", "Access Control", "Controls for access management", "A.9 - Access", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
                IAM_CHECKS["iam_root_access_keys"], IAM_CHECKS["iam_unused_credentials"],
            ]),
            ComplianceControl("A.10", "Cryptography", "Controls for encryption and key management", "A.10 - Crypto", "HIGH", [
                S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"], EC2_CHECKS["ec2_ebs_encryption"],
                S3_CHECKS["s3_ssl_requests"], BACKUP_CHECKS["snapshot_encryption"],
            ]),
            ComplianceControl("A.13", "Communications Security", "Network security controls", "A.13 - Network", "HIGH", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_no_unrestricted_ingress"], NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("A.12", "Operations Security", "Monitoring and logging controls", "A.12 - Operations", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["guardduty_enabled"],
                LOGGING_CHECKS["cloudtrail_log_validation"],
            ]),
        ],
    )


def _build_pci_dss() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="pci_dss", name="PCI-DSS",
        version="4.0", description="Payment Card Industry Data Security Standard — Requirements for organizations that handle credit card data.",
        category="regulation", icon="CreditCard", color="#f59e0b",
        controls=[
            ComplianceControl("1", "Network Security Controls", "Install and maintain network security controls", "Req 1 - Network", "CRITICAL", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_no_unrestricted_ingress"], NETWORK_CHECKS["sg_default_restrict"],
                NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("2", "Secure Configurations", "Apply secure configurations to all system components", "Req 2 - Config", "HIGH", [
                EC2_CHECKS["ec2_imdsv2"], NETWORK_CHECKS["sg_default_restrict"],
            ]),
            ComplianceControl("3", "Protect Stored Account Data", "Protect stored cardholder data with encryption", "Req 3 - Data Protection", "CRITICAL", [
                S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"], EC2_CHECKS["ec2_ebs_encryption"],
                BACKUP_CHECKS["snapshot_encryption"],
            ]),
            ComplianceControl("4", "Protect Data in Transit", "Encrypt data transmitted over open networks", "Req 4 - Transit", "HIGH", [
                S3_CHECKS["s3_ssl_requests"],
            ]),
            ComplianceControl("7", "Restrict Access", "Restrict access to system components by business need", "Req 7 - Access", "HIGH", [
                IAM_CHECKS["iam_no_star_policies"], IAM_CHECKS["iam_root_access_keys"],
                IAM_CHECKS["iam_unused_credentials"],
            ]),
            ComplianceControl("8", "Identify Users and Authenticate", "Identify users and authenticate access", "Req 8 - Auth", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_password_policy"],
            ]),
            ComplianceControl("10", "Log and Monitor", "Log and monitor all access to system components", "Req 10 - Logging", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["cloudtrail_log_validation"],
                LOGGING_CHECKS["guardduty_enabled"], S3_CHECKS["s3_logging"],
            ]),
        ],
    )


def _build_hipaa() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="hipaa", name="HIPAA",
        version="2024", description="Health Insurance Portability and Accountability Act — Security and privacy rules for protected health information (PHI).",
        category="regulation", icon="Heart", color="#ec4899",
        controls=[
            ComplianceControl("164.312(a)", "Access Control", "Technical safeguards for access control", "Access Control", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
                IAM_CHECKS["iam_root_access_keys"],
            ]),
            ComplianceControl("164.312(c)", "Integrity", "Protect ePHI from alteration or destruction", "Integrity", "HIGH", [
                S3_CHECKS["s3_versioning"], LOGGING_CHECKS["cloudtrail_log_validation"],
                BACKUP_CHECKS["snapshot_encryption"],
            ]),
            ComplianceControl("164.312(d)", "Authentication", "Verify identity of persons seeking access to ePHI", "Authentication", "HIGH", [
                IAM_CHECKS["iam_password_policy"], IAM_CHECKS["iam_user_mfa"],
            ]),
            ComplianceControl("164.312(e)", "Transmission Security", "Protect ePHI during electronic transmission", "Transmission", "HIGH", [
                S3_CHECKS["s3_ssl_requests"], S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"],
            ]),
            ComplianceControl("164.312(b)", "Audit Controls", "Record and examine system activity", "Audit", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["guardduty_enabled"],
                S3_CHECKS["s3_logging"], NETWORK_CHECKS["vpc_flow_logs"],
            ]),
        ],
    )


def _build_gdpr() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="gdpr", name="GDPR",
        version="2018", description="General Data Protection Regulation — EU regulation for data protection and privacy.",
        category="regulation", icon="Lock", color="#10b981",
        controls=[
            ComplianceControl("Art.5", "Data Protection Principles", "Personal data must be processed securely", "Art.5 - Principles", "HIGH", [
                S3_CHECKS["s3_encryption"], RDS_CHECKS["rds_encryption"], EC2_CHECKS["ec2_ebs_encryption"],
                S3_CHECKS["s3_public_access"], RDS_CHECKS["rds_public_access"],
            ]),
            ComplianceControl("Art.25", "Data Protection by Design", "Implement appropriate technical measures", "Art.25 - By Design", "HIGH", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_default_restrict"], EC2_CHECKS["ec2_imdsv2"],
            ]),
            ComplianceControl("Art.30", "Records of Processing", "Maintain records of processing activities", "Art.30 - Records", "MEDIUM", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["cloudtrail_log_validation"],
                S3_CHECKS["s3_logging"],
            ]),
            ComplianceControl("Art.32", "Security of Processing", "Implement appropriate security measures", "Art.32 - Security", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
                S3_CHECKS["s3_ssl_requests"], BACKUP_CHECKS["snapshot_not_public"],
            ]),
            ComplianceControl("Art.33", "Breach Notification", "Detect and respond to data breaches", "Art.33 - Breach", "HIGH", [
                LOGGING_CHECKS["guardduty_enabled"], NETWORK_CHECKS["vpc_flow_logs"],
            ]),
        ],
    )


def _build_waf() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="aws_waf", name="AWS Well-Architected Security Pillar",
        version="2024", description="AWS Well-Architected Framework — Security pillar best practices for cloud workloads.",
        category="best_practice", icon="Layers", color="#f97316",
        controls=[
            ComplianceControl("SEC1", "Identity and Access Management", "Securely control access to AWS services and resources", "SEC1 - IAM", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_root_access_keys"], IAM_CHECKS["iam_user_mfa"],
                IAM_CHECKS["iam_no_star_policies"], IAM_CHECKS["iam_password_policy"],
            ]),
            ComplianceControl("SEC2", "Detection", "Detect security events with monitoring and logging", "SEC2 - Detection", "HIGH", [
                LOGGING_CHECKS["cloudtrail_enabled"], LOGGING_CHECKS["guardduty_enabled"],
                NETWORK_CHECKS["vpc_flow_logs"], LOGGING_CHECKS["cloudtrail_log_validation"],
            ]),
            ComplianceControl("SEC3", "Infrastructure Protection", "Protect network and compute resources", "SEC3 - Infra", "HIGH", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_no_unrestricted_ingress"], NETWORK_CHECKS["sg_default_restrict"],
                EC2_CHECKS["ec2_public_ip"], EC2_CHECKS["ec2_imdsv2"],
            ]),
            ComplianceControl("SEC4", "Data Protection", "Protect data at rest and in transit", "SEC4 - Data", "HIGH", [
                S3_CHECKS["s3_encryption"], S3_CHECKS["s3_public_access"], S3_CHECKS["s3_ssl_requests"],
                RDS_CHECKS["rds_encryption"], RDS_CHECKS["rds_public_access"],
                EC2_CHECKS["ec2_ebs_encryption"], BACKUP_CHECKS["snapshot_encryption"],
                BACKUP_CHECKS["snapshot_not_public"],
            ]),
            ComplianceControl("SEC5", "Incident Response", "Prepare for and respond to security incidents", "SEC5 - IR", "MEDIUM", [
                LOGGING_CHECKS["guardduty_enabled"], LOGGING_CHECKS["cloudtrail_enabled"],
            ]),
        ],
    )


def _build_cis_azure() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="cis_azure", name="CIS Azure Benchmark",
        version="2.0.0", description="Center for Internet Security benchmark for Microsoft Azure security best practices.",
        category="benchmark", icon="Shield", color="#0078D4",
        controls=[
            ComplianceControl("1", "Identity and Access Management", "Azure AD and IAM controls", "1 - IAM", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_password_policy"],
            ]),
            ComplianceControl("4", "Networking", "Azure network security controls", "4 - Networking", "CRITICAL", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["sg_no_unrestricted_ingress"],
            ]),
            ComplianceControl("7", "Storage", "Azure storage security controls", "7 - Storage", "HIGH", [
                S3_CHECKS["s3_encryption"], S3_CHECKS["s3_public_access"],
            ]),
        ],
    )


def _build_cis_gcp() -> ComplianceFramework:
    return ComplianceFramework(
        framework_id="cis_gcp", name="CIS GCP Benchmark",
        version="2.0.0", description="Center for Internet Security benchmark for Google Cloud Platform security best practices.",
        category="benchmark", icon="Shield", color="#4285F4",
        controls=[
            ComplianceControl("1", "Identity and Access Management", "GCP IAM controls", "1 - IAM", "HIGH", [
                IAM_CHECKS["iam_root_mfa"], IAM_CHECKS["iam_user_mfa"], IAM_CHECKS["iam_no_star_policies"],
            ]),
            ComplianceControl("3", "Networking", "GCP networking controls", "3 - Networking", "CRITICAL", [
                NETWORK_CHECKS["sg_no_unrestricted_ssh"], NETWORK_CHECKS["sg_no_unrestricted_rdp"],
                NETWORK_CHECKS["vpc_flow_logs"],
            ]),
            ComplianceControl("5", "Storage", "GCP storage controls", "5 - Storage", "HIGH", [
                S3_CHECKS["s3_encryption"], S3_CHECKS["s3_public_access"],
            ]),
        ],
    )


# ═══════════════════════════════════════════════════════════════════
# FRAMEWORK REGISTRY
# ═══════════════════════════════════════════════════════════════════

FRAMEWORKS: Dict[str, ComplianceFramework] = {}


def get_all_frameworks() -> Dict[str, ComplianceFramework]:
    global FRAMEWORKS
    if not FRAMEWORKS:
        FRAMEWORKS = {
            "cis_aws": _build_cis_aws(),
            "cis_azure": _build_cis_azure(),
            "cis_gcp": _build_cis_gcp(),
            "nist_800_53": _build_nist_800_53(),
            "soc2": _build_soc2(),
            "iso27001": _build_iso27001(),
            "pci_dss": _build_pci_dss(),
            "hipaa": _build_hipaa(),
            "gdpr": _build_gdpr(),
            "aws_waf": _build_waf(),
        }
    return FRAMEWORKS


def get_framework(framework_id: str) -> Optional[ComplianceFramework]:
    return get_all_frameworks().get(framework_id)
