"""
Notification delivery service.

Supports Slack webhooks and SMTP email. Channel configs live in notifier_channels.json.

Channel shape:
  { "id": "...", "type": "slack"|"email"|"webhook", "name": "...",
    "config": { ... }, "enabled": true }

For Slack: config = { "webhook_url": "https://hooks.slack.com/..." }
For Email: config = { "to": "ops@company.com" } — SMTP creds come from env
For Webhook: config = { "url": "https://...", "headers": {...} (optional) }

SMTP env vars (set once on server):
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
"""

import os
import json
import smtplib
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CHANNELS_FILE = BASE_DIR / "backend" / "notifier_channels.json"
DELIVERY_LOG = BASE_DIR / "backend" / "notifier_log.json"
MAX_LOG_ENTRIES = 500


def _load(path, default):
    try:
        if path.exists():
            with open(path) as f:
                return json.load(f)
    except Exception:
        pass
    return default


def _save(path, value):
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(value, f, default=str)
    except Exception:
        pass


def list_channels() -> list:
    return _load(CHANNELS_FILE, [])


def add_channel(channel: dict) -> dict:
    channels = list_channels()
    channels.append(channel)
    _save(CHANNELS_FILE, channels)
    return channel


def delete_channel(channel_id: str) -> bool:
    channels = [c for c in list_channels() if c.get("id") != channel_id]
    _save(CHANNELS_FILE, channels)
    return True


def update_channel(channel_id: str, updates: dict) -> Optional[dict]:
    channels = list_channels()
    for c in channels:
        if c.get("id") == channel_id:
            c.update(updates)
            _save(CHANNELS_FILE, channels)
            return c
    return None


def _log_delivery(entry: dict):
    log = _load(DELIVERY_LOG, [])
    log.append(entry)
    if len(log) > MAX_LOG_ENTRIES:
        log = log[-MAX_LOG_ENTRIES:]
    _save(DELIVERY_LOG, log)


def get_delivery_log(limit: int = 100) -> list:
    return list(reversed(_load(DELIVERY_LOG, [])))[:limit]


def _send_slack(config: dict, subject: str, body: str, severity: str = "info") -> bool:
    url = config.get("webhook_url")
    if not url or not HAS_HTTPX:
        return False
    color = {"critical": "#ef4444", "warning": "#f59e0b", "info": "#3b82f6"}.get(severity, "#64748b")
    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(url, json={
                "attachments": [{
                    "color": color,
                    "title": subject,
                    "text": body,
                    "footer": "CloudSentrix",
                }]
            })
            return r.status_code == 200
    except Exception:
        return False


def _send_email(config: dict, subject: str, body: str) -> bool:
    to = config.get("to")
    if not to:
        return False
    host = os.environ.get("SMTP_HOST")
    if not host:
        return False
    try:
        port = int(os.environ.get("SMTP_PORT", "587"))
        user = os.environ.get("SMTP_USER", "")
        pw = os.environ.get("SMTP_PASS", "")
        sender = os.environ.get("SMTP_FROM", user or "noreply@cloudsentrix.io")
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo()
            try:
                s.starttls()
                s.ehlo()
            except Exception:
                pass
            if user and pw:
                s.login(user, pw)
            s.sendmail(sender, [to], msg.as_string())
        return True
    except Exception:
        return False


def _send_webhook(config: dict, subject: str, body: str, severity: str, payload: Optional[dict] = None) -> bool:
    url = config.get("url")
    if not url or not HAS_HTTPX:
        return False
    headers = config.get("headers") or {}
    try:
        data = {
            "subject": subject,
            "body": body,
            "severity": severity,
            "payload": payload or {},
        }
        with httpx.Client(timeout=10) as client:
            r = client.post(url, json=data, headers=headers)
            return 200 <= r.status_code < 300
    except Exception:
        return False


def send(subject: str, body: str, severity: str = "info", channel_ids: Optional[list] = None,
         payload: Optional[dict] = None) -> list:
    """Send a message via enabled channels (or a subset specified by channel_ids).

    Returns a list of delivery results [{channel_id, channel_type, ok, error}].
    """
    from datetime import datetime
    channels = list_channels()
    if channel_ids:
        channels = [c for c in channels if c.get("id") in channel_ids]
    channels = [c for c in channels if c.get("enabled", True)]
    results = []
    for c in channels:
        ok = False
        try:
            if c["type"] == "slack":
                ok = _send_slack(c.get("config", {}), subject, body, severity)
            elif c["type"] == "email":
                ok = _send_email(c.get("config", {}), subject, body)
            elif c["type"] == "webhook":
                ok = _send_webhook(c.get("config", {}), subject, body, severity, payload)
        except Exception as e:
            ok = False
            results.append({"channel_id": c["id"], "channel_type": c["type"], "ok": False, "error": str(e)[:200]})
            continue
        results.append({"channel_id": c["id"], "channel_type": c["type"], "ok": ok,
                        "error": None if ok else "send failed"})
    _log_delivery({
        "timestamp": datetime.utcnow().isoformat(),
        "subject": subject[:200], "severity": severity,
        "results": results,
    })
    return results
