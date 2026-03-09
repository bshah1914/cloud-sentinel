"""
CloudLunar Enterprise — Multi-Cloud Security Platform
FastAPI backend with provider plugin architecture for AWS, Azure, and GCP.
"""

import json
import shutil
import threading
import uuid
import yaml
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Paths ────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
ACCOUNT_DATA_DIR = BASE_DIR / "account-data"
CONFIG_FILE = BASE_DIR / "config.json"
CONFIG_DEMO = BASE_DIR / "config.json.demo"
AUDIT_CONFIG = BASE_DIR / "audit_config.yaml"
AUDIT_OVERRIDE = BASE_DIR / "config" / "audit_config_override.yaml"
USERS_FILE = BASE_DIR / "backend" / "users.json"

# ── JWT / Auth Config ────────────────────────────────────────────
SECRET_KEY = "cloudlunar-enterprise-secret-change-in-production-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── User Management ─────────────────────────────────────────────
def _load_users() -> list[dict]:
    if USERS_FILE.exists():
        with open(USERS_FILE) as f:
            return json.load(f)
    return []


def _save_users(users: list[dict]):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def _init_admin():
    users = _load_users()
    if not users:
        users.append({
            "username": "admin",
            "hashed_password": pwd_context.hash("admin123"),
            "role": "admin",
            "created": datetime.now().isoformat(),
        })
        _save_users(users)


def _authenticate_user(username: str, password: str) -> Optional[dict]:
    for user in _load_users():
        if user["username"] == username and pwd_context.verify(password, user["hashed_password"]):
            return user
    return None


def _create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
    for user in _load_users():
        if user["username"] == username:
            return user
    raise HTTPException(401, "User not found")


# ── App Setup ────────────────────────────────────────────────────
app = FastAPI(title="CloudLunar Enterprise API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_init_admin()

# ── Register Provider Plugins ────────────────────────────────────
from providers.registry import registry
from providers.aws.collector import AWSCollector
from providers.aws.parser import AWSParser
from providers.aws.auditor import AWSAuditor
from providers.aws.routes import AWSRoutes

from providers.azure.collector import AzureCollector
from providers.azure.parser import AzureParser
from providers.azure.auditor import AzureAuditor
from providers.azure.routes import AzureRoutes

from providers.gcp.collector import GCPCollector
from providers.gcp.parser import GCPParser
from providers.gcp.auditor import GCPAuditor
from providers.gcp.routes import GCPRoutes

# Register all providers
registry.register("aws", AWSCollector(), AWSParser(), AWSAuditor(), AWSRoutes())
registry.register("azure", AzureCollector(), AzureParser(), AzureAuditor(), AzureRoutes())
registry.register("gcp", GCPCollector(), GCPParser(), GCPAuditor(), GCPRoutes())

# Mount provider-specific routes
for pid in registry.provider_ids:
    plugin = registry.get(pid)
    plugin.routes.register_routes(app, get_current_user, ACCOUNT_DATA_DIR)


# ── In-memory State ─────────────────────────────────────────────
scan_jobs: dict = {}


# ── Pydantic Models ─────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class AccountIn(BaseModel):
    id: str
    name: str
    provider: str = "aws"      # aws, azure, gcp
    default: bool = False


class CIDRIn(BaseModel):
    cidr: str
    name: str


class ScanRequestModel(BaseModel):
    account_name: Optional[str] = None
    provider: str = "aws"
    credentials: Optional[dict] = None
    region: Optional[str] = "all"
    # Legacy AWS fields (backward compat)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = None


class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"       # admin, editor, viewer


# ── Helpers ──────────────────────────────────────────────────────
def _load_config() -> dict:
    cfg_path = CONFIG_FILE if CONFIG_FILE.exists() else CONFIG_DEMO
    with open(cfg_path) as f:
        return json.load(f)


def _save_config(config: dict):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def _get_account_dirs(provider: str = None) -> list[dict]:
    """List accounts that have collected data, optionally filtered by provider."""
    results = []
    if not ACCOUNT_DATA_DIR.exists():
        return results

    if provider:
        pdir = ACCOUNT_DATA_DIR / provider
        if pdir.exists():
            for d in pdir.iterdir():
                if d.is_dir() and not d.name.startswith("."):
                    results.append({"name": d.name, "provider": provider})
    else:
        for pdir in ACCOUNT_DATA_DIR.iterdir():
            if pdir.is_dir() and pdir.name in ("aws", "azure", "gcp"):
                for d in pdir.iterdir():
                    if d.is_dir() and not d.name.startswith("."):
                        results.append({"name": d.name, "provider": pdir.name})
        # Legacy: check for accounts not under a provider folder (old AWS format)
        for d in ACCOUNT_DATA_DIR.iterdir():
            if d.is_dir() and d.name not in ("aws", "azure", "gcp") and not d.name.startswith("."):
                results.append({"name": d.name, "provider": "aws"})
    return results


def _get_regions_for_account(account_name: str, provider: str = "aws") -> list[str]:
    acct_dir = ACCOUNT_DATA_DIR / provider / account_name
    # Fallback to legacy path
    if not acct_dir.exists():
        acct_dir = ACCOUNT_DATA_DIR / account_name
    if not acct_dir.exists():
        return []
    return [d.name for d in acct_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]


# ── AUTH ENDPOINTS ───────────────────────────────────────────────
@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = _authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(401, "Invalid username or password")
    token = _create_token(
        {"sub": user["username"], "role": user["role"]},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"username": user["username"], "role": user["role"]},
    }


@app.get("/api/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"username": user["username"], "role": user["role"], "created": user.get("created")}


# ── USER MANAGEMENT (RBAC) ──────────────────────────────────────
@app.get("/api/users")
def list_users(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return {"users": [
        {"username": u["username"], "role": u["role"], "created": u.get("created")}
        for u in _load_users()
    ]}


@app.post("/api/users")
def create_user(req: UserCreateRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    users = _load_users()
    if any(u["username"] == req.username for u in users):
        raise HTTPException(400, "Username already exists")
    users.append({
        "username": req.username,
        "hashed_password": pwd_context.hash(req.password),
        "role": req.role,
        "created": datetime.now().isoformat(),
    })
    _save_users(users)
    return {"status": "ok", "user": {"username": req.username, "role": req.role}}


@app.delete("/api/users/{username}")
def delete_user(username: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    if username == user["username"]:
        raise HTTPException(400, "Cannot delete yourself")
    users = _load_users()
    users = [u for u in users if u["username"] != username]
    _save_users(users)
    return {"status": "ok"}


# ── PROVIDERS ENDPOINT ───────────────────────────────────────────
@app.get("/api/providers")
def list_providers(user: dict = Depends(get_current_user)):
    """List all registered cloud providers with their metadata."""
    return {"providers": registry.list_providers()}


@app.post("/api/providers/{provider_id}/validate")
def validate_provider_credentials(provider_id: str, credentials: dict, user: dict = Depends(get_current_user)):
    """Validate credentials for a specific provider."""
    plugin = registry.get(provider_id)
    if not plugin:
        raise HTTPException(404, f"Provider '{provider_id}' not found")
    return plugin.collector.validate_credentials(credentials)


@app.get("/api/providers/{provider_id}/regions")
def get_provider_regions(provider_id: str, user: dict = Depends(get_current_user)):
    """Get available regions for a provider (static list, no credentials needed)."""
    plugin = registry.get(provider_id)
    if not plugin:
        raise HTTPException(404, f"Provider '{provider_id}' not found")
    return {"regions": plugin.collector.get_regions({})}


# ── ACCOUNTS (Multi-Cloud) ──────────────────────────────────────
@app.get("/api/accounts")
def list_accounts(user: dict = Depends(get_current_user)):
    config = _load_config()
    accounts = config.get("accounts", [])
    enriched = []
    seen = set()

    for acct in accounts:
        provider = acct.get("provider", "aws")
        name = acct["name"]
        has_data = (ACCOUNT_DATA_DIR / provider / name).exists()
        # Legacy check
        if not has_data and provider == "aws":
            has_data = (ACCOUNT_DATA_DIR / name).exists()
        regions = _get_regions_for_account(name, provider) if has_data else []
        enriched.append({**acct, "provider": provider, "has_data": has_data, "regions": regions})
        seen.add(f"{provider}:{name}")

    # Auto-detect accounts with data not in config
    for item in _get_account_dirs():
        key = f"{item['provider']}:{item['name']}"
        if key not in seen:
            regions = _get_regions_for_account(item["name"], item["provider"])
            enriched.append({
                "id": "auto-detected", "name": item["name"],
                "provider": item["provider"],
                "default": len(enriched) == 0, "has_data": True, "regions": regions,
            })

    return {"accounts": enriched}


@app.post("/api/accounts")
def add_account(account: AccountIn, user: dict = Depends(get_current_user)):
    config = _load_config()
    for existing in config.get("accounts", []):
        if existing["id"] == account.id and existing.get("provider", "aws") == account.provider:
            raise HTTPException(400, "Account with this ID already exists for this provider")
    config.setdefault("accounts", []).append(account.dict())
    _save_config(config)
    return {"status": "ok", "account": account.dict()}


@app.delete("/api/accounts/{account_id}")
def remove_account(account_id: str, provider: str = "aws", user: dict = Depends(get_current_user)):
    config = _load_config()
    removed_name = None
    removed_provider = provider
    for acct in config.get("accounts", []):
        if acct["id"] == account_id:
            removed_name = acct["name"]
            removed_provider = acct.get("provider", "aws")
            break

    config["accounts"] = [a for a in config.get("accounts", []) if a["id"] != account_id]
    _save_config(config)

    data_deleted = False
    if removed_name:
        # New path: account-data/{provider}/{name}
        acct_data_dir = ACCOUNT_DATA_DIR / removed_provider / removed_name
        if acct_data_dir.exists():
            shutil.rmtree(acct_data_dir)
            data_deleted = True
        # Legacy path: account-data/{name}
        legacy_dir = ACCOUNT_DATA_DIR / removed_name
        if legacy_dir.exists():
            shutil.rmtree(legacy_dir)
            data_deleted = True

    return {"status": "ok", "account_removed": removed_name, "provider": removed_provider, "data_deleted": data_deleted}


# ── CIDRs ────────────────────────────────────────────────────────
@app.get("/api/cidrs")
def list_cidrs(user: dict = Depends(get_current_user)):
    config = _load_config()
    cidrs = config.get("cidrs", {})
    return {"cidrs": [{"cidr": k, **v} for k, v in cidrs.items()]}


@app.post("/api/cidrs")
def add_cidr(cidr_in: CIDRIn, user: dict = Depends(get_current_user)):
    config = _load_config()
    config.setdefault("cidrs", {})[cidr_in.cidr] = {"name": cidr_in.name}
    _save_config(config)
    return {"status": "ok"}


@app.delete("/api/cidrs/{cidr}")
def remove_cidr(cidr: str, user: dict = Depends(get_current_user)):
    config = _load_config()
    config.get("cidrs", {}).pop(cidr, None)
    _save_config(config)
    return {"status": "ok"}


# ── UNIFIED SCAN (Multi-Cloud) ──────────────────────────────────
@app.post("/api/scan/start")
def start_scan(req: ScanRequestModel, user: dict = Depends(get_current_user)):
    """Start a background scan for any cloud provider."""
    provider_id = req.provider
    plugin = registry.get(provider_id)
    if not plugin:
        raise HTTPException(400, f"Unknown provider: {provider_id}")

    # Build credentials dict
    credentials = req.credentials or {}
    # Legacy AWS fields
    if provider_id == "aws" and not credentials:
        if req.aws_access_key_id:
            credentials = {
                "access_key_id": req.aws_access_key_id,
                "secret_access_key": req.aws_secret_access_key,
            }

    job_id = str(uuid.uuid4())[:8]
    account_name = req.account_name or "default"
    requested_region = req.region or req.aws_region or "all"

    scan_jobs[job_id] = {
        "id": job_id, "provider": provider_id,
        "status": "running", "account": account_name,
        "started": datetime.now().isoformat(),
        "log": [], "progress": 0,
        "regions_scanned": [], "regions_total": 0,
    }

    def _run():
        job = scan_jobs[job_id]
        try:
            collector = plugin.collector

            # Determine regions
            if requested_region == "all":
                job["log"].append(f"Discovering enabled {plugin.info.short_name} regions...")
                regions_to_scan = collector.get_regions(credentials)
                job["log"].append(f"Found {len(regions_to_scan)} regions")
            else:
                regions_to_scan = [requested_region]

            job["regions_total"] = len(regions_to_scan)

            total_collected = 0
            total_errors = []

            for idx, region in enumerate(regions_to_scan):
                job["progress"] = int(5 + (85 * idx / max(len(regions_to_scan), 1)))
                job["log"].append(f"[{idx+1}/{len(regions_to_scan)}] Scanning {region}...")

                result = collector.collect(
                    account_name, region, credentials,
                    ACCOUNT_DATA_DIR, progress_callback=None,
                )

                total_collected += result.get("resources_collected", 0)
                total_errors.extend(result.get("errors", []))
                job["regions_scanned"].append(region)

                if result.get("resources_collected", 0) > 0:
                    job["log"].append(f"  {region}: {result['resources_collected']} resources collected")
                else:
                    job["log"].append(f"  {region}: no resources (or access denied)")

            if total_errors:
                job["log"].append(f"Warnings: {len(total_errors)} total across all regions")

            # Check for any collected data
            acct_dir = ACCOUNT_DATA_DIR / provider_id / account_name
            has_data = acct_dir.exists() and any(acct_dir.rglob("*.json"))

            if not has_data:
                job["status"] = "failed"
                job["log"].append(f"FAILED: No data files created. Check {plugin.info.short_name} credentials.")
                job["completed"] = datetime.now().isoformat()
                return

            job["progress"] = 100
            job["status"] = "completed"
            job["log"].append(f"Scan completed — {total_collected} resources across {len(job['regions_scanned'])} regions")
            job["completed"] = datetime.now().isoformat()

        except Exception as e:
            job["status"] = "failed"
            job["log"].append(f"Error: {str(e)}")
            job["completed"] = datetime.now().isoformat()

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return {"job_id": job_id, "status": "started", "provider": provider_id}


@app.get("/api/scan/status/{job_id}")
def scan_status(job_id: str, user: dict = Depends(get_current_user)):
    if job_id not in scan_jobs:
        raise HTTPException(404, "Job not found")
    return scan_jobs[job_id]


@app.get("/api/scan/history")
def scan_history(user: dict = Depends(get_current_user)):
    return {"jobs": list(scan_jobs.values())}


# ── UNIFIED DASHBOARD ────────────────────────────────────────────
@app.get("/api/dashboard/{provider}/{account_name}")
def dashboard_by_provider(provider: str, account_name: str, user: dict = Depends(get_current_user)):
    """Get dashboard for a specific provider + account."""
    plugin = registry.get(provider)
    if not plugin:
        raise HTTPException(404, f"Provider '{provider}' not found")

    acct_dir = ACCOUNT_DATA_DIR / provider / account_name
    # Legacy fallback for AWS
    if not acct_dir.exists() and provider == "aws":
        acct_dir = ACCOUNT_DATA_DIR / account_name
    if not acct_dir.exists():
        raise HTTPException(404, f"No data for account '{account_name}'")

    return plugin.parser.parse_dashboard(account_name, ACCOUNT_DATA_DIR)


# Legacy endpoint (backward compat)
@app.get("/api/dashboard/{account_name}")
def dashboard_legacy(account_name: str, user: dict = Depends(get_current_user)):
    """Legacy dashboard endpoint — auto-detects provider."""
    # Check new path first
    for pid in registry.provider_ids:
        acct_dir = ACCOUNT_DATA_DIR / pid / account_name
        if acct_dir.exists():
            return registry.get(pid).parser.parse_dashboard(account_name, ACCOUNT_DATA_DIR)
    # Legacy AWS path
    legacy_dir = ACCOUNT_DATA_DIR / account_name
    if legacy_dir.exists():
        return registry.get("aws").parser.parse_dashboard(account_name, ACCOUNT_DATA_DIR)
    raise HTTPException(404, f"No data for account '{account_name}'")


# ── UNIFIED MULTI-CLOUD OVERVIEW ────────────────────────────────
@app.get("/api/overview")
def multi_cloud_overview(user: dict = Depends(get_current_user)):
    """Aggregated overview across all providers and accounts."""
    overview = {
        "providers": {},
        "total_accounts": 0,
        "total_resources": 0,
        "total_findings": 0,
        "avg_security_score": 0,
    }

    scores = []
    for item in _get_account_dirs():
        pid = item["provider"]
        name = item["name"]
        plugin = registry.get(pid)
        if not plugin:
            continue

        if pid not in overview["providers"]:
            overview["providers"][pid] = {
                "name": plugin.info.name,
                "short_name": plugin.info.short_name,
                "color": plugin.info.color,
                "accounts": [],
                "total_resources": 0,
            }

        try:
            dash = plugin.parser.parse_dashboard(name, ACCOUNT_DATA_DIR)
            total_res = sum(v for v in dash.get("totals", {}).values() if isinstance(v, int))
            findings = plugin.auditor.run_audit(name, ACCOUNT_DATA_DIR)

            acct_info = {
                "name": name, "provider": pid,
                "security_score": dash.get("security_score", 0),
                "total_resources": total_res,
                "total_findings": len(findings),
                "regions_scanned": dash.get("regions_scanned", 0),
            }
            overview["providers"][pid]["accounts"].append(acct_info)
            overview["providers"][pid]["total_resources"] += total_res
            overview["total_accounts"] += 1
            overview["total_resources"] += total_res
            overview["total_findings"] += len(findings)
            scores.append(dash.get("security_score", 0))
        except Exception:
            overview["providers"][pid]["accounts"].append({
                "name": name, "provider": pid, "error": "Failed to load",
            })

    if scores:
        overview["avg_security_score"] = round(sum(scores) / len(scores))

    return overview


# ── LEGACY ENDPOINTS (backward compat for existing frontend) ─────
@app.get("/api/resources/{account_name}")
def get_resources_legacy(account_name: str, user: dict = Depends(get_current_user)):
    for pid in registry.provider_ids:
        acct_dir = ACCOUNT_DATA_DIR / pid / account_name
        if acct_dir.exists():
            return registry.get(pid).parser.parse_resources(account_name, ACCOUNT_DATA_DIR)
    legacy_dir = ACCOUNT_DATA_DIR / account_name
    if legacy_dir.exists():
        return registry.get("aws").parser.parse_resources(account_name, ACCOUNT_DATA_DIR)
    raise HTTPException(404, f"No data for account '{account_name}'")


@app.get("/api/iam/{account_name}")
def get_iam_legacy(account_name: str, user: dict = Depends(get_current_user)):
    """Legacy IAM endpoint — routes to AWS IAM."""
    from providers.aws.parser import AWSParser, _read_json, _get_regions
    acct_dir = ACCOUNT_DATA_DIR / "aws" / account_name
    if not acct_dir.exists():
        acct_dir = ACCOUNT_DATA_DIR / account_name
    regions = _get_regions(acct_dir)
    if not regions:
        raise HTTPException(404, "No data found")
    region_dir = acct_dir / regions[0]
    auth = _read_json(region_dir / "iam-get-account-authorization-details.json")
    summary = _read_json(region_dir / "iam-get-account-summary.json")
    users = [{"name": u.get("UserName"), "arn": u.get("Arn"), "created": u.get("CreateDate"),
              "policies": [p["PolicyName"] for p in u.get("AttachedManagedPolicies", [])],
              "inline_policies": list(u.get("UserPolicyList", [])),
              "groups": u.get("GroupList", []), "mfa_devices": u.get("MFADevices", [])}
             for u in auth.get("UserDetailList", [])]
    roles = [{"name": r.get("RoleName"), "arn": r.get("Arn"), "created": r.get("CreateDate"),
              "policies": [p["PolicyName"] for p in r.get("AttachedManagedPolicies", [])],
              "trust_policy": r.get("AssumeRolePolicyDocument")}
             for r in auth.get("RoleDetailList", [])]
    policies = [{"name": p.get("PolicyName"), "arn": p.get("Arn"),
                 "attachment_count": p.get("AttachmentCount"), "is_attachable": p.get("IsAttachable")}
                for p in auth.get("Policies", [])]
    return {"account": account_name, "summary": summary.get("SummaryMap", {}),
            "users": users, "roles": roles, "policies": policies}


@app.get("/api/security-groups/{account_name}")
def get_security_groups_legacy(account_name: str, user: dict = Depends(get_current_user)):
    """Legacy SG endpoint — routes to AWS."""
    from providers.aws.parser import _read_json, _get_regions
    acct_dir = ACCOUNT_DATA_DIR / "aws" / account_name
    if not acct_dir.exists():
        acct_dir = ACCOUNT_DATA_DIR / account_name
    regions = _get_regions(acct_dir)
    results = []
    for region in regions:
        sgs = _read_json(acct_dir / region / "ec2-describe-security-groups.json")
        for sg in sgs.get("SecurityGroups", []):
            open_rules = []
            for rule in sg.get("IpPermissions", []):
                for ip_range in rule.get("IpRanges", []):
                    if ip_range.get("CidrIp") == "0.0.0.0/0":
                        open_rules.append({"protocol": rule.get("IpProtocol"), "from_port": rule.get("FromPort"), "to_port": rule.get("ToPort")})
                for ip_range in rule.get("Ipv6Ranges", []):
                    if ip_range.get("CidrIpv6") == "::/0":
                        open_rules.append({"protocol": rule.get("IpProtocol"), "from_port": rule.get("FromPort"), "to_port": rule.get("ToPort")})
            if open_rules:
                results.append({"region": region, "group_id": sg["GroupId"], "group_name": sg["GroupName"],
                                "vpc_id": sg.get("VpcId"), "open_rules": open_rules,
                                "severity": "CRITICAL" if any(r.get("from_port") in (22, 3389, 3306, 5432) or r.get("protocol") == "-1" for r in open_rules) else "HIGH"})
    return {"account": account_name, "risky_groups": results}


@app.get("/api/audit/config")
def get_audit_config(user: dict = Depends(get_current_user)):
    try:
        with open(AUDIT_CONFIG) as f:
            cfg = yaml.safe_load(f) or {}
        if AUDIT_OVERRIDE.exists():
            with open(AUDIT_OVERRIDE) as f:
                override = yaml.safe_load(f) or {}
            for k, v in override.items():
                if k not in cfg:
                    cfg[k] = {"title": "Unknown", "severity": "High", "group": "unknown"}
                cfg[k].update(v)
        return {"findings": [{"id": fid, **conf} for fid, conf in cfg.items()]}
    except Exception:
        return {"findings": []}


@app.post("/api/audit/run/{account_name}")
def run_audit_legacy(account_name: str, user: dict = Depends(get_current_user)):
    """Legacy audit — auto-detects provider."""
    for pid in registry.provider_ids:
        acct_dir = ACCOUNT_DATA_DIR / pid / account_name
        if acct_dir.exists():
            plugin = registry.get(pid)
            findings = plugin.auditor.run_audit(account_name, ACCOUNT_DATA_DIR)
            severity_counts = {}
            for f in findings:
                s = f.get("severity", "INFO")
                severity_counts[s] = severity_counts.get(s, 0) + 1
            return {"account": account_name, "provider": pid,
                    "total": len(findings), "findings": findings,
                    "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]}}
    # Legacy AWS
    legacy_dir = ACCOUNT_DATA_DIR / account_name
    if legacy_dir.exists():
        findings = registry.get("aws").auditor.run_audit(account_name, ACCOUNT_DATA_DIR)
        severity_counts = {}
        for f in findings:
            s = f.get("severity", "INFO")
            severity_counts[s] = severity_counts.get(s, 0) + 1
        return {"account": account_name, "provider": "aws",
                "total": len(findings), "findings": findings,
                "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]}}
    raise HTTPException(404, f"No data for account '{account_name}'")


# ── REPORT EXPORT ────────────────────────────────────────────────
from fastapi.responses import Response
from report_generator import (
    generate_dashboard_pdf, generate_dashboard_csv,
    generate_audit_pdf, generate_audit_csv,
)


@app.get("/api/export/dashboard/{provider}/{account_name}")
def export_dashboard(provider: str, account_name: str, format: str = "pdf",
                     user: dict = Depends(get_current_user)):
    """Export dashboard report as PDF or CSV."""
    plugin = registry.get(provider)
    if not plugin:
        raise HTTPException(400, f"Unknown provider '{provider}'")
    data = plugin.parser.parse_dashboard(account_name, ACCOUNT_DATA_DIR)
    if not data or not data.get("region_matrix"):
        raise HTTPException(404, f"No data for account '{account_name}'")

    if format == "csv":
        content = generate_dashboard_csv(data, account_name, provider)
        return Response(content=content, media_type="text/csv",
                        headers={"Content-Disposition": f'attachment; filename="dashboard-{account_name}-{provider}.csv"'})
    else:
        content = generate_dashboard_pdf(data, account_name, provider)
        return Response(content=content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="dashboard-{account_name}-{provider}.pdf"'})


@app.get("/api/export/audit/{account_name}")
def export_audit(account_name: str, format: str = "pdf",
                 user: dict = Depends(get_current_user)):
    """Export audit report as PDF or CSV."""
    # Auto-detect provider
    detected_provider = "aws"
    for pid in registry.provider_ids:
        if (ACCOUNT_DATA_DIR / pid / account_name).exists():
            detected_provider = pid
            break

    plugin = registry.get(detected_provider)
    acct_dir = ACCOUNT_DATA_DIR / detected_provider / account_name
    if not acct_dir.exists():
        acct_dir = ACCOUNT_DATA_DIR / account_name
    if not acct_dir.exists():
        raise HTTPException(404, f"No data for account '{account_name}'")

    findings = plugin.auditor.run_audit(account_name, ACCOUNT_DATA_DIR)
    severity_counts = {}
    for f in findings:
        s = f.get("severity", "INFO")
        severity_counts[s] = severity_counts.get(s, 0) + 1
    audit_data = {
        "account": account_name, "provider": detected_provider,
        "total": len(findings), "findings": findings,
        "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]},
    }

    if format == "csv":
        content = generate_audit_csv(audit_data, account_name, detected_provider)
        return Response(content=content, media_type="text/csv",
                        headers={"Content-Disposition": f'attachment; filename="audit-{account_name}.csv"'})
    else:
        content = generate_audit_pdf(audit_data, account_name, detected_provider)
        return Response(content=content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="audit-{account_name}.pdf"'})


# ── HEALTH ───────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    accounts_with_data = _get_account_dirs()
    return {
        "status": "ok",
        "version": "3.0.0",
        "platform": "CloudLunar Enterprise",
        "providers": registry.provider_ids,
        "accounts_with_data": accounts_with_data,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8088)
