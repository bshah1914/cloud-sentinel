"""GCP Cloud Provider — API Routes mounted under /api/gcp/"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from .parser import GCPParser, _get_regions, _read_json
from .auditor import GCPAuditor
from ..base import BaseRoutes

router = APIRouter(prefix="/api/gcp", tags=["GCP"])
_parser = GCPParser()
_auditor = GCPAuditor()


class GCPRoutes(BaseRoutes):

    def register_routes(self, app, get_current_user, data_base_dir: Path):

        @router.get("/resources/{account_name}")
        def get_gcp_resources(account_name: str, user: dict = Depends(get_current_user)):
            return _parser.parse_resources(account_name, data_base_dir)

        @router.get("/dashboard/{account_name}")
        def get_gcp_dashboard(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "gcp" / account_name
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            return _parser.parse_dashboard(account_name, data_base_dir)

        @router.post("/audit/{account_name}")
        def run_gcp_audit(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "gcp" / account_name
            if not acct_dir.exists():
                raise HTTPException(404, f"No data for account '{account_name}'")
            findings = _auditor.run_audit(account_name, data_base_dir)
            severity_counts = {}
            for f in findings:
                s = f.get("severity", "INFO")
                severity_counts[s] = severity_counts.get(s, 0) + 1
            return {
                "account": account_name, "provider": "gcp",
                "total": len(findings), "findings": findings,
                "summary": {s: severity_counts.get(s, 0) for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]},
            }

        @router.get("/firewalls/{account_name}")
        def get_gcp_firewalls(account_name: str, user: dict = Depends(get_current_user)):
            acct_dir = data_base_dir / "gcp" / account_name
            regions = _get_regions(acct_dir)
            results = []
            for region in regions:
                fws = _read_json(acct_dir / region / "compute-firewalls.json").get("Firewalls", [])
                for fw in fws:
                    if fw.get("disabled"):
                        continue
                    if "0.0.0.0/0" in fw.get("source_ranges", []):
                        results.append({
                            "region": "global", "name": fw["name"],
                            "network": fw.get("network", ""),
                            "direction": fw.get("direction"),
                            "allowed": fw.get("allowed", []),
                            "source_ranges": fw.get("source_ranges", []),
                            "severity": "CRITICAL" if any(
                                a.get("protocol") == "all" or "22" in a.get("ports", []) or "3389" in a.get("ports", [])
                                for a in fw.get("allowed", [])
                            ) else "HIGH",
                        })
            return {"account": account_name, "provider": "gcp", "risky_firewalls": results}

        app.include_router(router)
