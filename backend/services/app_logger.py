"""
CloudSentinel Enterprise — Application Logger
File-based rotating logs + structured audit trail.
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)


def _setup_logger(name, filename, level=logging.INFO):
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(level)
    handler = RotatingFileHandler(
        os.path.join(LOG_DIR, filename),
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5,
    )
    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(fmt)
    logger.addHandler(handler)

    # Also log to console
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    console.setLevel(logging.WARNING)
    logger.addHandler(console)
    return logger


# Application log — errors, startup, general events
app_log = _setup_logger("cloudsentinel.app", "app.log")

# Access log — all API requests
access_log = _setup_logger("cloudsentinel.access", "access.log")

# Auth log — login, logout, failed attempts, token issues
auth_log = _setup_logger("cloudsentinel.auth", "auth.log")

# Scan log — scan start, progress, complete, fail
scan_log = _setup_logger("cloudsentinel.scan", "scan.log")

# Security log — critical findings, threat alerts, compliance drift
security_log = _setup_logger("cloudsentinel.security", "security.log", logging.WARNING)

# Export log — report generation
export_log = _setup_logger("cloudsentinel.export", "export.log")


def log_startup():
    app_log.info("=" * 60)
    app_log.info("CloudSentinel Enterprise starting up")
    app_log.info(f"Log directory: {LOG_DIR}")
    app_log.info("=" * 60)
