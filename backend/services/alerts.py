"""
CloudSentrix Enterprise — Alert Service
Sends notifications via Slack, Email, and Webhooks when security events occur.
"""

import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

from models.database import SessionLocal, AlertRule, AlertHistory, Organization, gen_id, utcnow


def send_slack(webhook_url, title, message, severity="INFO"):
    """Send a Slack notification."""
    if not HAS_REQUESTS or not webhook_url:
        return False
    color_map = {"CRITICAL": "#ef4444", "HIGH": "#f97316", "MEDIUM": "#f59e0b", "LOW": "#eab308", "INFO": "#06b6d4"}
    payload = {
        "attachments": [{
            "color": color_map.get(severity, "#06b6d4"),
            "title": f":shield: CloudSentrix Alert — {title}",
            "text": message,
            "footer": "CloudSentrix Security Platform",
            "ts": int(datetime.now(timezone.utc).timestamp()),
        }]
    }
    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        return resp.status_code == 200
    except Exception:
        return False


def send_webhook(url, event_type, data):
    """Send a generic webhook notification."""
    if not HAS_REQUESTS or not url:
        return False
    payload = {
        "event": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": "CloudSentrix",
        "data": data,
    }
    try:
        resp = requests.post(url, json=payload, timeout=10,
                           headers={"Content-Type": "application/json", "X-CloudSentrix-Event": event_type})
        return resp.status_code < 300
    except Exception:
        return False


def send_email(to_email, subject, body, smtp_host="localhost", smtp_port=25):
    """Send an email alert (basic SMTP)."""
    try:
        msg = MIMEMultipart()
        msg["From"] = "alerts@cloudsentrix.io"
        msg["To"] = to_email
        msg["Subject"] = f"[CloudSentrix] {subject}"
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.send_message(msg)
        return True
    except Exception:
        return False


def evaluate_alerts(org_id, scan_data):
    """Evaluate alert rules after a scan and send notifications."""
    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            return

        rules = db.query(AlertRule).filter(
            AlertRule.org_id == org_id,
            AlertRule.is_active == True
        ).all()

        for rule in rules:
            triggered = False
            title = ""
            message = ""
            severity = "INFO"

            if rule.condition_type == "severity_threshold":
                min_severity = rule.condition_value.get("severity", "CRITICAL")
                min_count = rule.condition_value.get("min_count", 1)
                count = scan_data.get(f"{min_severity.lower()}_count", 0)
                if count >= min_count:
                    triggered = True
                    title = f"{count} {min_severity} findings detected"
                    message = f"Scan found {count} {min_severity} severity findings in your infrastructure."
                    severity = min_severity

            elif rule.condition_type == "score_drop":
                threshold = rule.condition_value.get("threshold", 10)
                prev_score = rule.condition_value.get("prev_score", 100)
                current_score = scan_data.get("security_score", 100)
                drop = prev_score - current_score
                if drop >= threshold:
                    triggered = True
                    title = f"Security score dropped by {drop} points"
                    message = f"Score changed from {prev_score} to {current_score} ({drop} point drop)."
                    severity = "HIGH"

            elif rule.condition_type == "new_finding":
                new_count = scan_data.get("findings_count", 0)
                if new_count > 0:
                    triggered = True
                    title = f"{new_count} new findings detected"
                    message = f"Latest scan found {new_count} findings."
                    severity = "MEDIUM" if new_count < 10 else "HIGH"

            if triggered:
                for channel in rule.channels:
                    sent = False
                    if channel == "slack" and org.slack_webhook:
                        sent = send_slack(org.slack_webhook, title, message, severity)
                    elif channel == "webhook" and org.webhook_url:
                        sent = send_webhook(org.webhook_url, "alert.triggered", {
                            "rule": rule.name, "title": title, "message": message, "severity": severity
                        })
                    elif channel == "email" and org.alert_email:
                        html_body = f"""
                        <div style="font-family:Arial;padding:20px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
                            <h2 style="color:#7c3aed;">CloudSentrix Alert</h2>
                            <h3 style="color:#f59e0b;">{title}</h3>
                            <p>{message}</p>
                            <p style="color:#94a3b8;font-size:12px;">Organization: {org.name}</p>
                        </div>
                        """
                        sent = send_email(org.alert_email, title, html_body)

                    db.add(AlertHistory(
                        id=gen_id(), org_id=org_id, rule_id=rule.id,
                        channel=channel, title=title, message=message,
                        status="sent" if sent else "failed"
                    ))

                rule.last_triggered_at = utcnow()
                rule.trigger_count += 1

        db.commit()
    finally:
        db.close()


def create_default_alert_rules(org_id):
    """Create default alert rules for a new organization."""
    db = SessionLocal()
    try:
        defaults = [
            {
                "name": "Critical Findings Alert",
                "description": "Alert when critical security findings are detected",
                "condition_type": "severity_threshold",
                "condition_value": {"severity": "CRITICAL", "min_count": 1},
                "channels": ["email", "slack"],
            },
            {
                "name": "Security Score Drop",
                "description": "Alert when security score drops significantly",
                "condition_type": "score_drop",
                "condition_value": {"threshold": 10, "prev_score": 100},
                "channels": ["email"],
            },
            {
                "name": "New Findings Detected",
                "description": "Alert when new findings are found in a scan",
                "condition_type": "new_finding",
                "condition_value": {},
                "channels": ["email"],
            },
        ]
        for d in defaults:
            rule = AlertRule(id=gen_id(), org_id=org_id, **d)
            db.add(rule)
        db.commit()
    finally:
        db.close()
