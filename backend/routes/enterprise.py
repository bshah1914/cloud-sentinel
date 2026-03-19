"""
CloudSentinel Enterprise — Enterprise API Routes
Adds: DB-backed scans, audit logs, alerts, schedules, remediation, executive dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from models.database import (
    SessionLocal, Scan, Finding, CloudAccount, Organization, User,
    AuditLog, AlertRule, AlertHistory, ScanSchedule, RemediationTask,
    gen_id, utcnow
)
from services.scanner import start_scan_async
from services.audit import log_action, get_audit_logs
from services.alerts import evaluate_alerts, create_default_alert_rules
from services.scheduler import create_schedule, list_schedules
from services.remediation import get_remediation_options, execute_remediation, get_remediation_tasks

router = APIRouter(prefix="/api/v2", tags=["Enterprise"])


# ─── Pydantic Models ───
class ScanRequest(BaseModel):
    account_id: str
    scan_type: str = "full"

class ScheduleRequest(BaseModel):
    account_id: str
    schedule_type: str = "daily"
    scan_type: str = "full"

class AlertRuleRequest(BaseModel):
    name: str
    description: str = ""
    condition_type: str
    condition_value: dict = {}
    channels: list = ["email"]

class CloudAccountRequest(BaseModel):
    name: str
    provider: str = "aws"
    account_id: str = ""
    access_key: str = ""
    secret_key: str = ""
    role_arn: str = ""
    region: str = "us-east-1"

class RemediateRequest(BaseModel):
    finding_id: str
    action_type: str = "manual"


def register_enterprise_routes(app, get_current_user):
    """Register all enterprise routes."""

    # ─── SCANS ───
    @app.post("/api/v2/scans")
    async def start_db_scan(req: ScanRequest, request: Request, user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            account = db.query(CloudAccount).filter(CloudAccount.id == req.account_id).first()
            if not account:
                raise HTTPException(404, "Account not found")

            scan = Scan(
                id=gen_id(), org_id=account.org_id,
                account_id=account.id, scan_type=req.scan_type,
                triggered_by=user.get("user_id", user.get("username")),
            )
            db.add(scan)
            db.commit()

            start_scan_async(scan.id, account.id)

            log_action(
                org_id=account.org_id, username=user.get("username"),
                action="scan.started", resource_type="scan", resource_id=scan.id,
                ip_address=request.client.host if request.client else None,
            )

            return {"scan_id": scan.id, "status": "running", "message": "Scan started"}
        finally:
            db.close()

    @app.get("/api/v2/scans")
    async def list_scans(user: dict = Depends(get_current_user), limit: int = 20):
        db = SessionLocal()
        try:
            query = db.query(Scan)
            if user.get("user_type") == "client":
                org_id = user.get("org_id")
                query = query.filter(Scan.org_id == org_id)
            scans = query.order_by(Scan.created_at.desc()).limit(limit).all()
            return {"scans": [{
                "id": s.id, "account_id": s.account_id, "scan_type": s.scan_type,
                "status": s.status, "triggered_by": s.triggered_by,
                "regions_scanned": s.regions_scanned, "resources_found": s.resources_found,
                "findings_count": s.findings_count, "security_score": s.security_score,
                "critical_count": s.critical_count, "high_count": s.high_count,
                "medium_count": s.medium_count, "low_count": s.low_count,
                "duration_seconds": s.duration_seconds,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "error_message": s.error_message,
            } for s in scans]}
        finally:
            db.close()

    @app.get("/api/v2/scans/{scan_id}")
    async def get_scan(scan_id: str, user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not scan:
                raise HTTPException(404, "Scan not found")
            return {
                "id": scan.id, "status": scan.status, "scan_type": scan.scan_type,
                "regions_scanned": scan.regions_scanned, "resources_found": scan.resources_found,
                "findings_count": scan.findings_count, "security_score": scan.security_score,
                "critical_count": scan.critical_count, "high_count": scan.high_count,
                "duration_seconds": scan.duration_seconds,
                "results": scan.results, "error_message": scan.error_message,
                "started_at": scan.started_at.isoformat() if scan.started_at else None,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            }
        finally:
            db.close()

    # ─── FINDINGS ───
    @app.get("/api/v2/findings")
    async def list_findings(user: dict = Depends(get_current_user),
                           severity: str = None, status: str = None,
                           category: str = None, limit: int = 100):
        db = SessionLocal()
        try:
            query = db.query(Finding)
            if user.get("user_type") == "client":
                query = query.filter(Finding.org_id == user.get("org_id"))
            if severity:
                query = query.filter(Finding.severity == severity.upper())
            if status:
                query = query.filter(Finding.status == status)
            if category:
                query = query.filter(Finding.category == category)

            total = query.count()
            findings = query.order_by(Finding.created_at.desc()).limit(limit).all()

            severity_counts = {}
            for f in db.query(Finding.severity, db.query(Finding).filter().count()).group_by(Finding.severity):
                pass  # Simplified

            return {
                "total": total,
                "findings": [{
                    "id": f.id, "title": f.title, "severity": f.severity,
                    "category": f.category, "resource_type": f.resource_type,
                    "resource_id": f.resource_id, "region": f.region,
                    "status": f.status, "remediation": f.remediation,
                    "remediation_cli": f.remediation_cli,
                    "account_name": f.account_name,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                } for f in findings]
            }
        finally:
            db.close()

    @app.patch("/api/v2/findings/{finding_id}")
    async def update_finding(finding_id: str, status: str, user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            finding = db.query(Finding).filter(Finding.id == finding_id).first()
            if not finding:
                raise HTTPException(404, "Finding not found")
            finding.status = status
            if status == "resolved":
                finding.resolved_at = utcnow()
                finding.resolved_by = user.get("username")
            db.commit()
            return {"id": finding.id, "status": finding.status}
        finally:
            db.close()

    # ─── CLOUD ACCOUNTS (DB) ───
    @app.post("/api/v2/accounts")
    async def create_cloud_account(req: CloudAccountRequest, request: Request,
                                   user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            org_id = user.get("org_id")
            if not org_id:
                raise HTTPException(400, "No organization")

            account = CloudAccount(
                id=gen_id(), org_id=org_id, name=req.name,
                provider=req.provider, account_id=req.account_id,
                access_key=req.access_key, secret_key=req.secret_key,
                role_arn=req.role_arn, region=req.region,
            )
            db.add(account)
            db.commit()

            log_action(org_id=org_id, username=user.get("username"),
                      action="account.created", resource_type="cloud_account",
                      resource_id=account.id,
                      ip_address=request.client.host if request.client else None)

            return {"id": account.id, "name": account.name, "provider": account.provider}
        finally:
            db.close()

    @app.get("/api/v2/accounts")
    async def list_cloud_accounts(user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            query = db.query(CloudAccount)
            if user.get("user_type") == "client":
                query = query.filter(CloudAccount.org_id == user.get("org_id"))
            accounts = query.all()
            return {"accounts": [{
                "id": a.id, "name": a.name, "provider": a.provider,
                "account_id": a.account_id, "region": a.region,
                "status": a.status, "total_resources": a.total_resources,
                "security_score": a.security_score,
                "last_scan_at": a.last_scan_at.isoformat() if a.last_scan_at else None,
                "has_credentials": bool(a.access_key and a.secret_key),
            } for a in accounts]}
        finally:
            db.close()

    # ─── AUDIT LOGS ───
    @app.get("/api/v2/audit-logs")
    async def api_audit_logs(user: dict = Depends(get_current_user),
                            action: str = None, limit: int = 100):
        org_id = user.get("org_id") if user.get("user_type") == "client" else None
        return get_audit_logs(org_id=org_id, action=action, limit=limit)

    # ─── ALERT RULES ───
    @app.get("/api/v2/alert-rules")
    async def list_alert_rules(user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            org_id = user.get("org_id")
            rules = db.query(AlertRule).filter(AlertRule.org_id == org_id).all()
            return {"rules": [{
                "id": r.id, "name": r.name, "description": r.description,
                "condition_type": r.condition_type, "condition_value": r.condition_value,
                "channels": r.channels, "is_active": r.is_active,
                "trigger_count": r.trigger_count,
                "last_triggered_at": r.last_triggered_at.isoformat() if r.last_triggered_at else None,
            } for r in rules]}
        finally:
            db.close()

    @app.post("/api/v2/alert-rules")
    async def create_alert_rule(req: AlertRuleRequest, user: dict = Depends(get_current_user)):
        db = SessionLocal()
        try:
            rule = AlertRule(
                id=gen_id(), org_id=user.get("org_id"),
                name=req.name, description=req.description,
                condition_type=req.condition_type,
                condition_value=req.condition_value,
                channels=req.channels,
            )
            db.add(rule)
            db.commit()
            return {"id": rule.id, "name": rule.name}
        finally:
            db.close()

    @app.get("/api/v2/alert-history")
    async def list_alert_history(user: dict = Depends(get_current_user), limit: int = 50):
        db = SessionLocal()
        try:
            org_id = user.get("org_id")
            alerts = db.query(AlertHistory).filter(
                AlertHistory.org_id == org_id
            ).order_by(AlertHistory.sent_at.desc()).limit(limit).all()
            return {"alerts": [{
                "id": a.id, "channel": a.channel, "title": a.title,
                "message": a.message, "status": a.status,
                "sent_at": a.sent_at.isoformat() if a.sent_at else None,
            } for a in alerts]}
        finally:
            db.close()

    # ─── SCHEDULES ───
    @app.post("/api/v2/schedules")
    async def create_scan_schedule(req: ScheduleRequest, user: dict = Depends(get_current_user)):
        org_id = user.get("org_id")
        if not org_id:
            raise HTTPException(400, "No organization")
        result = create_schedule(org_id, req.account_id, req.schedule_type, req.scan_type)
        log_action(org_id=org_id, username=user.get("username"),
                  action="schedule.created", resource_type="schedule",
                  resource_id=result["id"])
        return result

    @app.get("/api/v2/schedules")
    async def list_scan_schedules(user: dict = Depends(get_current_user)):
        org_id = user.get("org_id")
        return {"schedules": list_schedules(org_id)}

    # ─── REMEDIATION ───
    @app.get("/api/v2/remediation/{finding_id}")
    async def get_remediation(finding_id: str, user: dict = Depends(get_current_user)):
        return get_remediation_options(finding_id)

    @app.post("/api/v2/remediation")
    async def run_remediation(req: RemediateRequest, user: dict = Depends(get_current_user)):
        return execute_remediation(req.finding_id, req.action_type, user.get("user_id"))

    @app.get("/api/v2/remediation-tasks")
    async def list_remediation_tasks(user: dict = Depends(get_current_user), status: str = None):
        org_id = user.get("org_id")
        return {"tasks": get_remediation_tasks(org_id, status)}

    # ─── EXECUTIVE DASHBOARD ───
    @app.get("/api/v2/executive-dashboard")
    async def executive_dashboard(user: dict = Depends(get_current_user)):
        """C-level executive summary — big numbers, trends, risk posture."""
        db = SessionLocal()
        try:
            # Get all orgs or just client's org
            if user.get("user_type") == "owner":
                orgs = db.query(Organization).filter(Organization.id != "cloudsentinel").all()
                accounts = db.query(CloudAccount).all()
                all_findings = db.query(Finding).all()
                all_scans = db.query(Scan).filter(Scan.status == "completed").all()
            else:
                org_id = user.get("org_id")
                orgs = db.query(Organization).filter(Organization.id == org_id).all()
                accounts = db.query(CloudAccount).filter(CloudAccount.org_id == org_id).all()
                all_findings = db.query(Finding).filter(Finding.org_id == org_id).all()
                all_scans = db.query(Scan).filter(Scan.org_id == org_id, Scan.status == "completed").all()

            total_resources = sum(a.total_resources for a in accounts)
            avg_score = sum(a.security_score for a in accounts) / len(accounts) if accounts else 0
            open_findings = [f for f in all_findings if f.status == "open"]
            critical_findings = [f for f in open_findings if f.severity == "CRITICAL"]

            # Severity breakdown
            severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            for f in open_findings:
                severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

            # Category breakdown
            category_counts = {}
            for f in open_findings:
                cat = f.category or "other"
                category_counts[cat] = category_counts.get(cat, 0) + 1

            # Risk level
            risk_level = "CRITICAL" if len(critical_findings) > 5 else \
                        "HIGH" if len(critical_findings) > 0 else \
                        "MEDIUM" if severity_counts.get("HIGH", 0) > 10 else "LOW"

            return {
                "summary": {
                    "total_accounts": len(accounts),
                    "total_resources": total_resources,
                    "avg_security_score": round(avg_score),
                    "total_findings": len(open_findings),
                    "critical_findings": len(critical_findings),
                    "total_scans": len(all_scans),
                    "total_clients": len(orgs),
                    "risk_level": risk_level,
                },
                "severity_breakdown": severity_counts,
                "category_breakdown": category_counts,
                "accounts": [{
                    "name": a.name, "provider": a.provider,
                    "score": a.security_score, "resources": a.total_resources,
                    "last_scan": a.last_scan_at.isoformat() if a.last_scan_at else None,
                } for a in accounts],
                "recent_scans": [{
                    "id": s.id, "score": s.security_score,
                    "findings": s.findings_count,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                } for s in sorted(all_scans, key=lambda x: x.completed_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)[:10]],
            }
        finally:
            db.close()

    # ─── PLATFORM STATS ───
    @app.get("/api/v2/platform-stats")
    async def platform_stats(user: dict = Depends(get_current_user)):
        """Platform-wide statistics for owner."""
        if user.get("user_type") != "owner":
            raise HTTPException(403, "Owner only")
        db = SessionLocal()
        try:
            total_orgs = db.query(Organization).filter(Organization.id != "cloudsentinel").count()
            total_users = db.query(User).count()
            total_accounts = db.query(CloudAccount).count()
            total_scans = db.query(Scan).count()
            total_findings = db.query(Finding).count()
            active_alerts = db.query(AlertRule).filter(AlertRule.is_active == True).count()

            # MRR calculation
            plan_prices = {"free": 0, "pro": 99, "enterprise": 499}
            orgs = db.query(Organization).filter(Organization.id != "cloudsentinel").all()
            mrr = sum(plan_prices.get(o.plan, 0) for o in orgs)

            return {
                "total_clients": total_orgs,
                "total_users": total_users,
                "total_accounts": total_accounts,
                "total_scans": total_scans,
                "total_findings": total_findings,
                "active_alerts": active_alerts,
                "mrr": mrr,
                "arr": mrr * 12,
            }
        finally:
            db.close()

    print("[Enterprise] Routes registered")
