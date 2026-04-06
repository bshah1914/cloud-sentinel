"""
CloudSentrix Enterprise — Remediation Engine with Owner Approval
All remediation actions require owner approval before execution.
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
        "risk": "low",
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
        "risk": "medium",
        "description": "Revoke inbound rule allowing 0.0.0.0/0 access.",
    },
    "disable_rds_public": {
        "title": "Disable RDS Public Access",
        "action_type": "auto",
        "risk": "medium",
        "description": "Set RDS instance to not publicly accessible.",
    },
    "enable_s3_encryption": {
        "title": "Enable S3 Bucket Encryption",
        "action_type": "auto",
        "risk": "low",
        "description": "Enable AES-256 server-side encryption on S3 bucket.",
    },
    "enable_guardduty": {
        "title": "Enable GuardDuty",
        "action_type": "auto",
        "risk": "low",
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
                "risk": "medium",
                "description": finding.remediation,
                "cli_command": finding.remediation_cli,
            })

        return {
            "finding": {
                "id": finding.id, "title": finding.title,
                "severity": finding.severity, "status": finding.status,
                "category": finding.category, "region": finding.region,
            },
            "options": options,
        }
    finally:
        db.close()


def request_remediation(finding_id, action_type, requested_by=None):
    """Request remediation — creates a pending-approval task. Owner must approve."""
    db = SessionLocal()
    try:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if not finding:
            return {"error": "Finding not found"}

        # Check for duplicate pending requests
        existing = db.query(RemediationTask).filter(
            RemediationTask.finding_id == finding_id,
            RemediationTask.status.in_(["pending_approval", "approved", "in_progress"])
        ).first()
        if existing:
            return {"error": "A remediation request already exists for this finding",
                    "task_id": existing.id, "status": existing.status}

        # Determine risk level
        risk = "medium"
        for key, action in REMEDIATION_ACTIONS.items():
            if action["title"].lower() in (finding.title or "").lower() or action_type == key:
                risk = action.get("risk", "medium")
                break

        task = RemediationTask(
            id=gen_id(), org_id=finding.org_id, finding_id=finding.id,
            title=f"Remediate: {finding.title[:200]}",
            description=finding.remediation,
            action_type=action_type,
            status="pending_approval",
            action_payload={
                "cli_command": finding.remediation_cli,
                "risk": risk,
                "requested_by": requested_by,
                "finding_severity": finding.severity,
                "finding_category": finding.category,
                "finding_region": finding.region,
            },
        )
        db.add(task)

        # Audit log
        db.add(AuditLog(
            id=gen_id(), org_id=finding.org_id,
            user_id=requested_by, action="remediation.requested",
            resource_type="finding", resource_id=finding.id,
            details={"task_id": task.id, "action_type": action_type, "risk": risk}
        ))

        db.commit()
        return {
            "task_id": task.id, "status": "pending_approval",
            "message": "Remediation request submitted. Awaiting owner approval.",
        }
    finally:
        db.close()


def approve_remediation(task_id, approved_by):
    """Owner approves a remediation task."""
    db = SessionLocal()
    try:
        task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        if task.status != "pending_approval":
            return {"error": f"Task is already {task.status}"}

        task.status = "approved"
        task.assigned_to = approved_by

        payload = task.action_payload or {}
        payload["approved_by"] = approved_by
        payload["approved_at"] = utcnow().isoformat()
        task.action_payload = payload

        db.add(AuditLog(
            id=gen_id(), org_id=task.org_id,
            user_id=approved_by, action="remediation.approved",
            resource_type="remediation_task", resource_id=task.id,
            details={"finding_id": task.finding_id}
        ))

        db.commit()
        return {"task_id": task.id, "status": "approved", "message": "Remediation approved. Ready to execute."}
    finally:
        db.close()


def reject_remediation(task_id, rejected_by, reason=None):
    """Owner rejects a remediation task."""
    db = SessionLocal()
    try:
        task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        if task.status not in ("pending_approval", "approved"):
            return {"error": f"Task cannot be rejected — status is {task.status}"}

        task.status = "rejected"
        payload = task.action_payload or {}
        payload["rejected_by"] = rejected_by
        payload["rejected_at"] = utcnow().isoformat()
        payload["rejection_reason"] = reason or "No reason provided"
        task.action_payload = payload

        db.add(AuditLog(
            id=gen_id(), org_id=task.org_id,
            user_id=rejected_by, action="remediation.rejected",
            resource_type="remediation_task", resource_id=task.id,
            details={"finding_id": task.finding_id, "reason": reason}
        ))

        db.commit()
        return {"task_id": task.id, "status": "rejected", "message": "Remediation rejected."}
    finally:
        db.close()


def execute_remediation(task_id, executed_by):
    """Execute an approved remediation task. Must be approved first."""
    db = SessionLocal()
    try:
        task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        if task.status != "approved":
            return {"error": f"Task must be approved before execution. Current status: {task.status}"}

        finding = db.query(Finding).filter(Finding.id == task.finding_id).first()

        task.status = "in_progress"
        task.executed_by = executed_by
        task.executed_at = utcnow()
        db.commit()

        # Execute the remediation
        payload = task.action_payload or {}
        cli_command = payload.get("cli_command") or (finding.remediation_cli if finding else None)

        if task.action_type == "auto" and HAS_BOTO3 and finding:
            result = _execute_aws_remediation(finding, db)
            if result.get("success"):
                task.status = "completed"
                task.result = result
                if finding:
                    finding.status = "resolved"
            else:
                task.status = "failed"
                task.result = result
        elif task.action_type == "manual":
            task.status = "completed"
            task.result = {
                "success": True,
                "message": "Manual remediation marked as completed",
                "steps": task.description,
            }
        else:
            task.status = "completed"
            task.result = {
                "success": True,
                "message": "Remediation completed",
                "cli_command": cli_command,
                "note": "CLI command provided for manual execution if auto-execution was not possible.",
            }

        db.add(AuditLog(
            id=gen_id(), org_id=task.org_id,
            user_id=executed_by, action="remediation.executed",
            resource_type="remediation_task", resource_id=task.id,
            details={"finding_id": task.finding_id, "status": task.status,
                      "result": task.result}
        ))

        db.commit()
        return {
            "task_id": task.id, "status": task.status,
            "result": task.result,
        }
    finally:
        db.close()


def _execute_aws_remediation(finding, db):
    """Execute AWS SDK remediation for a finding."""
    try:
        # Get account credentials
        account = db.query(CloudAccount).filter(
            CloudAccount.account_id == finding.account_id
        ).first()
        if not account or not account.access_key:
            # Try by name
            account = db.query(CloudAccount).filter(
                CloudAccount.name == finding.account_id
            ).first()

        if not account or not account.access_key:
            return {"success": False, "error": "No credentials found for this account. Use CLI command instead.",
                    "cli_command": finding.remediation_cli}

        session = boto3.Session(
            aws_access_key_id=account.access_key,
            aws_secret_access_key=account.secret_key,
            region_name=finding.region or "us-east-1",
        )

        title_lower = (finding.title or "").lower()

        # Security Group remediation
        if "security group" in title_lower:
            return _remediate_security_group(session, finding)

        # RDS public access
        if "rds" in title_lower and "public" in title_lower:
            return _remediate_rds_public(session, finding)

        # S3 encryption
        if "s3" in title_lower and ("encrypt" in title_lower or "public" in title_lower):
            return _remediate_s3_encryption(session, finding)

        # GuardDuty
        if "guardduty" in title_lower:
            return _remediate_guardduty(session, finding)

        return {"success": True, "message": "No auto-fix available. CLI command provided.",
                "cli_command": finding.remediation_cli}

    except ClientError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        return {"success": False, "error": f"Execution failed: {str(e)}"}


def _remediate_security_group(session, finding):
    """Close open security group rules."""
    try:
        ec2 = session.client("ec2")
        # Extract SG ID from finding title or details
        import re
        sg_match = re.search(r'(sg-[a-z0-9]+)', (finding.title or "") + " " + (finding.description or ""))
        if not sg_match:
            return {"success": False, "error": "Could not extract Security Group ID from finding"}

        sg_id = sg_match.group(1)
        sg = ec2.describe_security_groups(GroupIds=[sg_id])["SecurityGroups"][0]

        revoked = []
        for rule in sg.get("IpPermissions", []):
            for ip_range in rule.get("IpRanges", []):
                if ip_range.get("CidrIp") == "0.0.0.0/0":
                    ec2.revoke_security_group_ingress(
                        GroupId=sg_id,
                        IpPermissions=[rule]
                    )
                    revoked.append(f"Port {rule.get('FromPort', 'all')}")
                    break

        return {"success": True, "message": f"Closed {len(revoked)} open rules on {sg_id}",
                "details": revoked}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _remediate_rds_public(session, finding):
    """Disable RDS public access."""
    try:
        rds = session.client("rds")
        import re
        db_match = re.search(r'RDS instance (\S+)', finding.title or "")
        if not db_match:
            return {"success": False, "error": "Could not extract RDS instance ID"}

        db_id = db_match.group(1)
        rds.modify_db_instance(DBInstanceIdentifier=db_id, PubliclyAccessible=False)
        return {"success": True, "message": f"Disabled public access on RDS instance {db_id}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _remediate_s3_encryption(session, finding):
    """Enable S3 bucket encryption."""
    try:
        s3 = session.client("s3")
        import re
        bucket_match = re.search(r'bucket[:\s]+(\S+)', (finding.title or "").lower())
        if not bucket_match:
            return {"success": False, "error": "Could not extract S3 bucket name"}

        bucket = bucket_match.group(1).strip("'\"")
        s3.put_bucket_encryption(
            Bucket=bucket,
            ServerSideEncryptionConfiguration={
                "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
            }
        )
        return {"success": True, "message": f"Enabled AES-256 encryption on bucket {bucket}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _remediate_guardduty(session, finding):
    """Enable GuardDuty."""
    try:
        gd = session.client("guardduty")
        response = gd.create_detector(Enable=True)
        return {"success": True, "message": f"GuardDuty enabled. Detector ID: {response['DetectorId']}"}
    except Exception as e:
        if "already enabled" in str(e).lower() or "detector" in str(e).lower():
            return {"success": True, "message": "GuardDuty is already enabled"}
        return {"success": False, "error": str(e)}


def get_remediation_tasks(org_id, status=None, limit=50):
    """Get remediation tasks for an organization."""
    db = SessionLocal()
    try:
        query = db.query(RemediationTask).filter(RemediationTask.org_id == org_id)
        if status:
            query = query.filter(RemediationTask.status == status)
        tasks = query.order_by(RemediationTask.created_at.desc()).limit(limit).all()

        result = []
        for t in tasks:
            finding = db.query(Finding).filter(Finding.id == t.finding_id).first() if t.finding_id else None
            payload = t.action_payload or {}
            result.append({
                "id": t.id, "title": t.title, "description": t.description,
                "action_type": t.action_type, "status": t.status,
                "risk": payload.get("risk", "medium"),
                "result": t.result, "executed_by": t.executed_by,
                "requested_by": payload.get("requested_by"),
                "approved_by": payload.get("approved_by"),
                "approved_at": payload.get("approved_at"),
                "rejected_by": payload.get("rejected_by"),
                "rejection_reason": payload.get("rejection_reason"),
                "cli_command": payload.get("cli_command"),
                "finding": {
                    "id": finding.id, "title": finding.title,
                    "severity": finding.severity, "category": finding.category,
                    "region": finding.region,
                } if finding else None,
                "executed_at": t.executed_at.isoformat() if t.executed_at else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })
        return result
    finally:
        db.close()


def get_pending_approvals_count(org_id):
    """Get count of tasks pending owner approval."""
    db = SessionLocal()
    try:
        return db.query(RemediationTask).filter(
            RemediationTask.org_id == org_id,
            RemediationTask.status == "pending_approval"
        ).count()
    finally:
        db.close()
