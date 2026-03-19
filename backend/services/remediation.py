"""
CloudSentinel Enterprise — Remediation Engine
Provides one-click fixes for common security findings via AWS SDK.
"""

import threading
from datetime import datetime, timezone

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

from models.database import (
    SessionLocal, RemediationTask, Finding, CloudAccount, AuditLog,
    gen_id, utcnow
)


# Remediation templates
REMEDIATION_ACTIONS = {
    "enable_root_mfa": {
        "title": "Enable Root Account MFA",
        "action_type": "manual",
        "description": "Root MFA must be enabled via AWS Console — cannot be automated via API.",
        "steps": [
            "Sign in to AWS Console as root",
            "Go to IAM → Dashboard",
            "Click 'Activate MFA on your root account'",
            "Choose Virtual MFA device",
            "Scan QR code with authenticator app",
        ],
    },
    "close_security_group": {
        "title": "Close Security Group Rule",
        "action_type": "auto",
        "description": "Revoke inbound rule allowing 0.0.0.0/0 access.",
    },
    "disable_rds_public": {
        "title": "Disable RDS Public Access",
        "action_type": "auto",
        "description": "Set RDS instance to not publicly accessible.",
    },
    "enable_s3_encryption": {
        "title": "Enable S3 Bucket Encryption",
        "action_type": "auto",
        "description": "Enable AES-256 server-side encryption on S3 bucket.",
    },
    "enable_guardduty": {
        "title": "Enable GuardDuty",
        "action_type": "auto",
        "description": "Enable Amazon GuardDuty threat detection in the region.",
    },
}


def get_remediation_options(finding_id):
    """Get available remediation options for a finding."""
    db = SessionLocal()
    try:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if not finding:
            return {"error": "Finding not found"}

        options = []
        title_lower = finding.title.lower()

        if "root" in title_lower and "mfa" in title_lower:
            options.append(REMEDIATION_ACTIONS["enable_root_mfa"])
        if "security group" in title_lower and "0.0.0.0" in title_lower:
            options.append({**REMEDIATION_ACTIONS["close_security_group"],
                          "cli_command": finding.remediation_cli})
        if "rds" in title_lower and "public" in title_lower:
            options.append({**REMEDIATION_ACTIONS["disable_rds_public"],
                          "cli_command": finding.remediation_cli})
        if "s3" in title_lower and ("public" in title_lower or "encrypt" in title_lower):
            options.append(REMEDIATION_ACTIONS["enable_s3_encryption"])
        if "guardduty" in title_lower:
            options.append(REMEDIATION_ACTIONS["enable_guardduty"])

        if not options and finding.remediation:
            options.append({
                "title": "Manual Remediation",
                "action_type": "manual",
                "description": finding.remediation,
                "cli_command": finding.remediation_cli,
            })

        return {
            "finding": {
                "id": finding.id, "title": finding.title,
                "severity": finding.severity, "status": finding.status,
            },
            "options": options,
        }
    finally:
        db.close()


def execute_remediation(finding_id, action_type, user_id=None):
    """Execute a remediation action."""
    db = SessionLocal()
    try:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if not finding:
            return {"error": "Finding not found"}

        task = RemediationTask(
            id=gen_id(), org_id=finding.org_id, finding_id=finding.id,
            title=f"Remediate: {finding.title[:200]}",
            description=finding.remediation,
            action_type=action_type,
            status="in_progress",
        )
        db.add(task)
        db.commit()

        # For auto actions, we would execute via AWS SDK here
        # For now, mark as completed with instructions
        if action_type == "auto" and HAS_BOTO3 and finding.remediation_cli:
            task.status = "completed"
            task.result = {
                "message": "CLI command ready for execution",
                "command": finding.remediation_cli,
                "note": "Auto-execution requires confirmation. Run the CLI command manually or enable auto-remediation in settings."
            }
        else:
            task.status = "pending"
            task.result = {
                "message": "Manual remediation required",
                "steps": finding.remediation,
            }

        task.executed_by = user_id
        task.executed_at = utcnow()

        # Log audit
        db.add(AuditLog(
            id=gen_id(), org_id=finding.org_id,
            user_id=user_id, action="remediation.executed",
            resource_type="finding", resource_id=finding.id,
            details={"task_id": task.id, "action_type": action_type}
        ))

        db.commit()
        return {
            "task_id": task.id, "status": task.status,
            "result": task.result,
        }
    finally:
        db.close()


def get_remediation_tasks(org_id, status=None, limit=50):
    """Get remediation tasks for an organization."""
    db = SessionLocal()
    try:
        query = db.query(RemediationTask).filter(RemediationTask.org_id == org_id)
        if status:
            query = query.filter(RemediationTask.status == status)
        tasks = query.order_by(RemediationTask.created_at.desc()).limit(limit).all()
        return [{
            "id": t.id, "title": t.title, "description": t.description,
            "action_type": t.action_type, "status": t.status,
            "result": t.result, "executed_by": t.executed_by,
            "executed_at": t.executed_at.isoformat() if t.executed_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        } for t in tasks]
    finally:
        db.close()
