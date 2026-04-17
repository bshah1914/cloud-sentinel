"""
Availability Monitoring — background thread that periodically HTTP-pings
client-registered URLs and records real uptime / response time data.

Configurations are stored in availability_monitors.json.
Results (real) are stored in availability_checks.json (keeps last N per monitor).

What we check per monitor:
  - HTTP status code
  - Response time
  - SSL certificate expiry (for https URLs)
  - Optional body content check (expected substring)

Reframed as security-adjacent: availability drops, SSL expiry, and content
changes often indicate attacks (DDoS, certificate MITM attempts, defacement).
"""

import os
import json
import time
import socket
import ssl
import threading
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    import urllib.request
    import urllib.error

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MONITORS_FILE = BASE_DIR / "backend" / "availability_monitors.json"
CHECKS_FILE = BASE_DIR / "backend" / "availability_checks.json"

CHECK_INTERVAL_SECONDS = 60
REQUEST_TIMEOUT_SECONDS = 15
MAX_CHECKS_PER_MONITOR = 200


def _load_json(path, default):
    try:
        if path.exists():
            with open(path) as f:
                return json.load(f)
    except Exception:
        pass
    return default


def _save_json(path, value):
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(value, f, default=str)
    except Exception:
        pass


def list_monitors() -> list:
    return _load_json(MONITORS_FILE, [])


def create_monitor(monitor: dict) -> dict:
    monitors = list_monitors()
    monitors.append(monitor)
    _save_json(MONITORS_FILE, monitors)
    return monitor


def delete_monitor(monitor_id: str) -> bool:
    monitors = [m for m in list_monitors() if m.get("id") != monitor_id]
    _save_json(MONITORS_FILE, monitors)
    return True


def get_recent_checks(monitor_id: str, limit: int = 100) -> list:
    all_checks = _load_json(CHECKS_FILE, {})
    checks = all_checks.get(monitor_id, [])
    return list(reversed(checks))[:limit]


def get_all_check_summaries() -> dict:
    """Return the most recent check per monitor."""
    all_checks = _load_json(CHECKS_FILE, {})
    out = {}
    for mid, checks in all_checks.items():
        if checks:
            out[mid] = checks[-1]
    return out


def _check_ssl(host: str, port: int = 443, timeout: int = 5) -> dict:
    """Return SSL cert info. Real socket/SSL call."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
                not_after = cert.get("notAfter")
                issuer_parts = dict(x[0] for x in cert.get("issuer", []))
                issuer = issuer_parts.get("organizationName") or issuer_parts.get("commonName") or ""
                if not_after:
                    try:
                        exp = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                        days_left = (exp - datetime.utcnow()).days
                        return {"valid": True, "expires": exp.isoformat(),
                                "days_left": days_left, "issuer": issuer}
                    except Exception:
                        return {"valid": True, "expires": not_after, "days_left": None, "issuer": issuer}
                return {"valid": True, "expires": None, "days_left": None, "issuer": issuer}
    except Exception as e:
        return {"valid": False, "error": str(e)[:200]}


def _perform_check(monitor: dict) -> dict:
    url = monitor.get("url", "")
    method = (monitor.get("method") or "GET").upper()
    expected_status = int(monitor.get("expected_status", 200))
    expected_body = monitor.get("expected_body", "")
    start = time.time()
    result = {
        "monitor_id": monitor["id"],
        "timestamp": datetime.utcnow().isoformat(),
        "url": url,
        "status": None,
        "response_time_ms": None,
        "ok": False,
        "error": None,
        "content_match": None,
        "ssl": None,
    }
    try:
        if HAS_HTTPX:
            with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
                resp = client.request(method, url)
                result["status"] = resp.status_code
                result["response_time_ms"] = int((time.time() - start) * 1000)
                body = resp.text[:4096]
        else:
            req = urllib.request.Request(url, method=method)
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
                body = resp.read(4096).decode("utf-8", errors="ignore")
                result["status"] = resp.status
                result["response_time_ms"] = int((time.time() - start) * 1000)
        # Status check
        status_ok = result["status"] == expected_status
        # Content check
        if expected_body:
            result["content_match"] = expected_body in body
        else:
            result["content_match"] = True
        result["ok"] = status_ok and result["content_match"]
    except Exception as e:
        result["response_time_ms"] = int((time.time() - start) * 1000)
        result["error"] = str(e)[:200]

    # SSL check (only for https)
    try:
        parsed = urlparse(url)
        if parsed.scheme == "https":
            host = parsed.hostname
            port = parsed.port or 443
            if host:
                result["ssl"] = _check_ssl(host, port)
    except Exception:
        pass

    return result


def _append_check(result: dict):
    all_checks = _load_json(CHECKS_FILE, {})
    mid = result["monitor_id"]
    checks = all_checks.get(mid, [])
    checks.append(result)
    if len(checks) > MAX_CHECKS_PER_MONITOR:
        checks = checks[-MAX_CHECKS_PER_MONITOR:]
    all_checks[mid] = checks
    _save_json(CHECKS_FILE, all_checks)


def run_once() -> int:
    monitors = [m for m in list_monitors() if m.get("enabled", True)]
    ran = 0
    for m in monitors:
        try:
            result = _perform_check(m)
            _append_check(result)
            ran += 1
        except Exception:
            continue
    return ran


_stop = threading.Event()
_thread: "threading.Thread | None" = None


def _loop():
    while not _stop.is_set():
        try:
            run_once()
        except Exception:
            pass
        _stop.wait(CHECK_INTERVAL_SECONDS)


def start():
    global _thread
    if _thread and _thread.is_alive():
        return
    _stop.clear()
    _thread = threading.Thread(target=_loop, name="availability-monitor", daemon=True)
    _thread.start()
    print(f"[Availability] Monitor started (interval: {CHECK_INTERVAL_SECONDS}s)")


def stop():
    _stop.set()


def uptime_stats(monitor_id: str, hours: int = 24) -> dict:
    """Compute real uptime % and avg response time over the given window."""
    all_checks = _load_json(CHECKS_FILE, {})
    checks = all_checks.get(monitor_id, [])
    if not checks:
        return {"total": 0, "up": 0, "down": 0, "uptime_pct": None, "avg_response_ms": None}
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    recent = []
    for c in checks:
        try:
            ts = datetime.fromisoformat(c["timestamp"][:26])
            if ts >= cutoff:
                recent.append(c)
        except Exception:
            continue
    total = len(recent)
    if total == 0:
        return {"total": 0, "up": 0, "down": 0, "uptime_pct": None, "avg_response_ms": None}
    up = sum(1 for c in recent if c["ok"])
    avg_rt = [c["response_time_ms"] for c in recent if c["response_time_ms"] is not None]
    return {
        "total": total,
        "up": up,
        "down": total - up,
        "uptime_pct": round((up / total) * 100, 2),
        "avg_response_ms": int(sum(avg_rt) / len(avg_rt)) if avg_rt else None,
    }
