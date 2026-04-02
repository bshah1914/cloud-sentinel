"""
CloudSentinel Enterprise — Database Models (SQLAlchemy + PostgreSQL + Redis)
Covers: Users, Organizations, CloudAccounts, Scans, Findings, AuditLog, Alerts, Schedules
"""

import os
import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, DateTime,
    Text, JSON, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.pool import QueuePool, StaticPool

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Database connection — PostgreSQL if available, SQLite fallback
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    # Try PostgreSQL first
    PG_HOST = os.environ.get("PG_HOST", "localhost")
    PG_PORT = os.environ.get("PG_PORT", "5432")
    PG_USER = os.environ.get("PG_USER", "brijesh")
    PG_PASS = os.environ.get("PG_PASS", "sentinel123")
    PG_DB = os.environ.get("PG_DB", "cloudsentinel")
    pg_url = f"postgresql://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{PG_DB}"
    try:
        import psycopg2
        conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASS, dbname=PG_DB, connect_timeout=3)
        conn.close()
        DATABASE_URL = pg_url
    except Exception:
        DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'cloudsentinel.db')}"

USE_POSTGRES = "postgresql" in DATABASE_URL

if USE_POSTGRES:
    engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20, pool_pre_ping=True, echo=False)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis connection
try:
    import redis
    REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False


class RedisCache:
    """Redis caching layer for dashboard data, scan status, and sessions."""

    @staticmethod
    def set(key: str, value, ttl: int = 300):
        """Set cache with TTL in seconds (default 5 min)."""
        if not REDIS_AVAILABLE:
            return
        try:
            redis_client.setex(f"cs:{key}", ttl, json.dumps(value, default=str))
        except Exception:
            pass

    @staticmethod
    def get(key: str):
        """Get cached value."""
        if not REDIS_AVAILABLE:
            return None
        try:
            val = redis_client.get(f"cs:{key}")
            return json.loads(val) if val else None
        except Exception:
            return None

    @staticmethod
    def delete(key: str):
        """Delete cache key."""
        if not REDIS_AVAILABLE:
            return
        try:
            redis_client.delete(f"cs:{key}")
        except Exception:
            pass

    @staticmethod
    def invalidate_account(account_name: str):
        """Invalidate all caches for an account."""
        if not REDIS_AVAILABLE:
            return
        try:
            for key in redis_client.scan_iter(f"cs:*{account_name}*"):
                redis_client.delete(key)
        except Exception:
            pass

    @staticmethod
    def set_scan_status(scan_id: str, status: dict, ttl: int = 60):
        """Cache scan progress for real-time updates."""
        if not REDIS_AVAILABLE:
            return
        try:
            redis_client.setex(f"cs:scan:{scan_id}", ttl, json.dumps(status, default=str))
        except Exception:
            pass

    @staticmethod
    def get_scan_status(scan_id: str):
        """Get cached scan progress."""
        if not REDIS_AVAILABLE:
            return None
        try:
            val = redis_client.get(f"cs:scan:{scan_id}")
            return json.loads(val) if val else None
        except Exception:
            return None


cache = RedisCache()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def gen_id():
    return uuid.uuid4().hex[:12]


def utcnow():
    return datetime.now(timezone.utc)


# ─── Organizations ───
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(50), primary_key=True, default=gen_id)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    plan = Column(String(50), default="free")  # free, pro, enterprise
    status = Column(String(20), default="active")  # active, suspended, trial
    max_accounts = Column(Integer, default=1)
    max_scans_month = Column(Integer, default=10)
    max_users = Column(Integer, default=3)
    branding_logo = Column(Text, nullable=True)
    branding_color = Column(String(20), default="#7c3aed")
    branding_colors = Column(JSON, nullable=True)
    branding_product_name = Column(String(200), nullable=True)
    default_dashboards = Column(JSON, nullable=True)
    webhook_url = Column(Text, nullable=True)
    webhook_events = Column(JSON, default=list)
    slack_webhook = Column(Text, nullable=True)
    email_alerts = Column(Boolean, default=True)
    alert_email = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    cloud_accounts = relationship("CloudAccount", back_populates="organization", cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="organization", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")


# ─── Users ───
class User(Base):
    __tablename__ = "users"
    id = Column(String(50), primary_key=True, default=gen_id)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), nullable=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(30), default="viewer")  # owner, admin, client_admin, editor, viewer, auditor
    user_type = Column(String(20), default="client")  # owner, client
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(100), nullable=True)
    api_key = Column(String(64), nullable=True, unique=True, index=True)
    theme_id = Column(String(50), default="dark")
    custom_theme = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="users")


# ─── Dashboard Layouts ───
class DashboardLayout(Base):
    __tablename__ = "dashboard_layouts"
    id = Column(String(50), primary_key=True, default=gen_id)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(200), nullable=False, default="My Dashboard")
    is_default = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    template_type = Column(String(50), nullable=True)
    layout = Column(JSON, nullable=False, default=list)
    shared_with = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


# ─── Scheduled Exports ───
class ScheduledExport(Base):
    __tablename__ = "scheduled_exports"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    dashboard_id = Column(String(50), ForeignKey("dashboard_layouts.id"), nullable=True)
    schedule = Column(String(50), default="daily")
    format = Column(String(20), default="pdf")
    recipients = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    last_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# ─── Embed Tokens ───
class EmbedToken(Base):
    __tablename__ = "embed_tokens"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    dashboard_id = Column(String(50), ForeignKey("dashboard_layouts.id"), nullable=False)
    token = Column(String(100), unique=True, index=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)


# ─── Cloud Accounts ───
class CloudAccount(Base):
    __tablename__ = "cloud_accounts"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    provider = Column(String(20), nullable=False)  # aws, azure, gcp
    account_id = Column(String(100), nullable=True)  # AWS Account ID, Azure Sub ID
    access_key = Column(String(200), nullable=True)
    secret_key = Column(String(200), nullable=True)
    role_arn = Column(String(300), nullable=True)
    region = Column(String(50), default="us-east-1")
    status = Column(String(20), default="active")  # active, inactive, error
    last_scan_at = Column(DateTime, nullable=True)
    last_scan_status = Column(String(20), nullable=True)
    total_resources = Column(Integer, default=0)
    security_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="cloud_accounts")
    scans = relationship("Scan", back_populates="cloud_account", cascade="all, delete-orphan")

    __table_args__ = (Index("idx_cloud_accounts_org", "org_id"),)


# ─── Scans ───
class Scan(Base):
    __tablename__ = "scans"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False, index=True)
    account_id = Column(String(50), ForeignKey("cloud_accounts.id"), nullable=False, index=True)
    scan_type = Column(String(30), default="full")  # full, quick, compliance, threat
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    triggered_by = Column(String(100), nullable=True)  # user_id or "scheduler"
    regions_scanned = Column(Integer, default=0)
    resources_found = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    security_score = Column(Integer, default=0)
    compliance_score = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    results = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="scans")
    cloud_account = relationship("CloudAccount", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")

    __table_args__ = (Index("idx_scans_org_account", "org_id", "account_id"),)


# ─── Findings ───
class Finding(Base):
    __tablename__ = "findings"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False, index=True)
    scan_id = Column(String(50), ForeignKey("scans.id"), nullable=False, index=True)
    account_name = Column(String(200), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category = Column(String(100), nullable=True)  # iam, network, storage, compute, encryption
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(300), nullable=True)
    region = Column(String(50), nullable=True)
    compliance_framework = Column(String(100), nullable=True)
    compliance_control = Column(String(100), nullable=True)
    remediation = Column(Text, nullable=True)
    remediation_cli = Column(Text, nullable=True)
    status = Column(String(20), default="open")  # open, resolved, suppressed, accepted
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    mitre_tactic = Column(String(100), nullable=True)
    mitre_technique = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="findings")
    scan = relationship("Scan", back_populates="findings")

    __table_args__ = (
        Index("idx_findings_severity", "severity"),
        Index("idx_findings_org_status", "org_id", "status"),
    )


# ─── Audit Log ───
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=True, index=True)
    user_id = Column(String(50), nullable=True)
    username = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)  # login, scan.start, scan.complete, export, account.add, etc.
    resource_type = Column(String(50), nullable=True)  # scan, account, user, finding, report
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="audit_logs")

    __table_args__ = (Index("idx_audit_org_action", "org_id", "action"),)


# ─── Scheduled Scans ───
class ScanSchedule(Base):
    __tablename__ = "scan_schedules"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    account_id = Column(String(50), ForeignKey("cloud_accounts.id"), nullable=False)
    schedule_type = Column(String(20), default="daily")  # hourly, daily, weekly, monthly
    cron_expression = Column(String(50), nullable=True)  # e.g., "0 2 * * *"
    scan_type = Column(String(30), default="full")
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# ─── Alert Rules ───
class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    condition_type = Column(String(50), nullable=False)  # severity_threshold, score_drop, new_finding, compliance_drift
    condition_value = Column(JSON, default=dict)  # e.g., {"severity": "CRITICAL", "min_count": 1}
    channels = Column(JSON, default=list)  # ["email", "slack", "webhook"]
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)


# ─── Alert History ───
class AlertHistory(Base):
    __tablename__ = "alert_history"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    rule_id = Column(String(50), ForeignKey("alert_rules.id"), nullable=True)
    channel = Column(String(30), nullable=False)  # email, slack, webhook
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="sent")  # sent, failed, acknowledged
    sent_at = Column(DateTime, default=utcnow)


# ─── Remediation Tasks ───
class RemediationTask(Base):
    __tablename__ = "remediation_tasks"
    id = Column(String(50), primary_key=True, default=gen_id)
    org_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)
    finding_id = Column(String(50), ForeignKey("findings.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    action_type = Column(String(50), nullable=False)  # auto, manual, cli_command
    action_payload = Column(JSON, default=dict)  # CLI command or API call details
    status = Column(String(20), default="pending")  # pending, in_progress, completed, failed
    assigned_to = Column(String(100), nullable=True)
    executed_by = Column(String(100), nullable=True)
    executed_at = Column(DateTime, nullable=True)
    result = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utcnow)


# ─── Create all tables ───
def _migrate_columns():
    """Add new columns to existing tables if missing (safe for repeated runs)."""
    if "sqlite" not in DATABASE_URL:
        return
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    migrations = [
        ("users", "theme_id TEXT DEFAULT 'dark'"),
        ("users", "custom_theme TEXT"),
        ("organizations", "branding_colors TEXT"),
        ("organizations", "branding_product_name TEXT"),
        ("organizations", "default_dashboards TEXT"),
    ]
    for table, col_def in migrations:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
        except Exception:
            pass
    conn.commit()
    conn.close()


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    _migrate_columns()
    db_type = "PostgreSQL" if "postgresql" in DATABASE_URL else "SQLite"
    redis_status = "connected" if REDIS_AVAILABLE else "unavailable"
    print(f"[DB] {db_type} initialized — {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print(f"[Cache] Redis {redis_status}")
    return True


def drop_db():
    """Drop all tables."""
    Base.metadata.drop_all(bind=engine)
    print("[DB] All tables dropped")
