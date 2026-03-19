"""
CloudSentinel Enterprise — Audit Log Service
Tracks every user action for compliance and security.
"""

from models.database import SessionLocal, AuditLog, gen_id, utcnow


def log_action(org_id=None, user_id=None, username=None, action="unknown",
               resource_type=None, resource_id=None, details=None,
               ip_address=None, user_agent=None):
    """Log an audit event."""
    db = SessionLocal()
    try:
        entry = AuditLog(
            id=gen_id(),
            org_id=org_id,
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(entry)
        db.commit()
        return entry.id
    except Exception:
        db.rollback()
        return None
    finally:
        db.close()


def get_audit_logs(org_id=None, action=None, limit=100, offset=0):
    """Retrieve audit logs with optional filters."""
    db = SessionLocal()
    try:
        query = db.query(AuditLog)
        if org_id:
            query = query.filter(AuditLog.org_id == org_id)
        if action:
            query = query.filter(AuditLog.action == action)
        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        return {
            "total": total,
            "logs": [{
                "id": log.id,
                "org_id": log.org_id,
                "user_id": log.user_id,
                "username": log.username,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            } for log in logs]
        }
    finally:
        db.close()
