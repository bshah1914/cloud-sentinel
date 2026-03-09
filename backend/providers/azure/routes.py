"""Azure Cloud Provider — API Routes mounted under /api/azure/"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from .parser import AzureParser, _get_locations
from .auditor import AzureAuditor
from ..base import BaseRoutes

router = APIRouter(prefix="/api/azure", tags=["Azure"])
_parser = AzureParser()
_auditor = AzureAuditor()


class AzureRoutes(BaseRoutes):

    def register_routes(self, app, get_current_user, data_base_dir: Path):

        @router.get("/resources/{account_name}")
        def get_azure_resources(account_name: str, user: dict = Depends(get_current_user)):
            return _parser.parse_resources(account_name, data_base_dir)

        @router.get("/dashboard/{account_name}")
        def get_azure_dashboard(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "azure" / account_name
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            return _parser.parse_dashboard(account_name, data_base_dir)

        @router.post("/audit/{account_name}")
        def run_azure_audit(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "azure" / account_name
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            findings = _auditor.run_audit(account_name, data_base_dir)
            severity_counts = {}
            for f in findings:
                s = f.get("severity", "INFO")
                severity_counts[s] = severity_counts.get(s, 0) + 1
            return {
                "account": account_name, "provider": "azure",
                "total": len(findings), "findings": findings,
                "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]},
            }

        @router.get("/nsgs/{account_name}")
        def get_azure_nsgs(account_name: str, user: dict = Depends(get_current_user)):
            """Analyze NSGs for risky rules (Azure equivalent of security groups)."""
            acct_dir = data_base_dir / "azure" / account_name
            locations = _get_locations(acct_dir)
            results = []
            for loc in locations:
                from .parser import _read_json
                nsgs = _read_json(acct_dir / loc / "network-security-groups.json").get("NetworkSecurityGroups", [])
                for nsg in nsgs:
                    open_rules = []
                    for rule in nsg.get("security_rules", []):
                        if rule.get("access") == "Allow" and rule.get("direction") == "Inbound":
                            src = rule.get("source_address_prefix", "")
                            if src in ("*", "0.0.0.0/0", "Internet"):
                                open_rules.append({
                                    "name": rule.get("name"),
                                    "port": rule.get("destination_port_range"),
                                    "protocol": rule.get("protocol"),
                                    "source": src,
                                })
                    if open_rules:
                        results.append({
                            "region": loc, "nsg_name": nsg.get("name"),
                            "nsg_id": nsg.get("id"), "open_rules": open_rules,
                            "severity": "CRITICAL" if any(
                                r.get("port") in ("22", "3389", "*") for r in open_rules
                            ) else "HIGH",
                        })
            return {"account": account_name, "provider": "azure", "risky_nsgs": results}

        app.include_router(router)
