"""
Kubernetes Security — managed cluster discovery & posture checks.

Uses cloud provider APIs (not in-cluster) to list EKS / AKS / GKE clusters
and compute a security posture score from their configuration.

No kubeconfig or agent required.
"""

import json
from datetime import datetime, timedelta
from typing import Optional


def _k8s_version_eol(version: str) -> dict:
    """Very simple EOL heuristic — k8s minor releases get ~1yr community support."""
    try:
        parts = version.lstrip("v").split(".")
        minor = int(parts[1])
        # 1.24-1.27 are EOL at time of writing (April 2026 context)
        if minor <= 27:
            return {"eol": True, "severity": "critical"}
        if minor == 28:
            return {"eol": False, "severity": "warning", "note": "approaching EOL"}
        return {"eol": False, "severity": "ok"}
    except Exception:
        return {"eol": False, "severity": "unknown"}


# ══════════════════════════════════════════════════════════════════
# AWS EKS
# ══════════════════════════════════════════════════════════════════
def list_eks_clusters(creds: dict) -> list:
    import boto3
    from concurrent.futures import ThreadPoolExecutor, as_completed

    session = boto3.Session(
        aws_access_key_id=creds["access_key"],
        aws_secret_access_key=creds["secret_key"],
        region_name="us-east-1",
    )
    try:
        regions = [r["RegionName"] for r in session.client("ec2").describe_regions(AllRegions=False)["Regions"]]
    except Exception:
        return []

    clusters = []

    def _per_region(region):
        try:
            sess = boto3.Session(
                aws_access_key_id=creds["access_key"],
                aws_secret_access_key=creds["secret_key"],
                region_name=region,
            )
            eks = sess.client("eks")
            names = eks.list_clusters().get("clusters", [])
            out = []
            for name in names:
                try:
                    info = eks.describe_cluster(name=name)["cluster"]
                    out.append(_assess_eks(info, region))
                except Exception:
                    continue
            return out
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=min(32, max(1, len(regions)))) as pool:
        for fut in as_completed([pool.submit(_per_region, r) for r in regions]):
            try:
                clusters.extend(fut.result(timeout=45))
            except Exception:
                continue
    return clusters


def _assess_eks(info: dict, region: str) -> dict:
    findings = []
    score = 100

    version = info.get("version", "")
    eol = _k8s_version_eol(version)
    if eol.get("eol"):
        score -= 25
        findings.append({"severity": "critical", "message": f"Kubernetes version {version} is EOL"})
    elif eol.get("severity") == "warning":
        score -= 10
        findings.append({"severity": "warning", "message": f"Kubernetes version {version} approaching EOL"})

    logging_cfg = (info.get("logging") or {}).get("clusterLogging", [])
    enabled_logs = [l for group in logging_cfg if group.get("enabled") for l in group.get("types", [])]
    required_logs = {"api", "audit", "authenticator"}
    missing_logs = required_logs - set(enabled_logs)
    if missing_logs:
        score -= 15
        findings.append({"severity": "warning",
                         "message": f"Control plane logs not enabled: {', '.join(sorted(missing_logs))}"})

    vpc_cfg = info.get("resourcesVpcConfig", {}) or {}
    if vpc_cfg.get("endpointPublicAccess"):
        if vpc_cfg.get("publicAccessCidrs") == ["0.0.0.0/0"]:
            score -= 20
            findings.append({"severity": "critical",
                             "message": "Public API endpoint exposed to 0.0.0.0/0"})
        else:
            score -= 5
            findings.append({"severity": "info",
                             "message": "Public API endpoint enabled (restricted CIDRs)"})

    if not info.get("encryptionConfig"):
        score -= 10
        findings.append({"severity": "warning", "message": "Secrets envelope encryption (KMS) not configured"})

    identity = info.get("identity", {})
    if not (identity.get("oidc") or {}).get("issuer"):
        score -= 5
        findings.append({"severity": "info", "message": "OIDC issuer not detected (IRSA unavailable)"})

    return {
        "id": info.get("arn", info.get("name")),
        "name": info.get("name"),
        "provider": "aws",
        "region": region,
        "version": version,
        "status": info.get("status"),
        "endpoint_public": vpc_cfg.get("endpointPublicAccess", False),
        "endpoint_private": vpc_cfg.get("endpointPrivateAccess", False),
        "logging_enabled": list(enabled_logs),
        "encryption_at_rest": bool(info.get("encryptionConfig")),
        "created_at": info.get("createdAt").isoformat() if info.get("createdAt") else None,
        "score": max(0, score),
        "findings": findings,
    }


# ══════════════════════════════════════════════════════════════════
# Azure AKS
# ══════════════════════════════════════════════════════════════════
def list_aks_clusters(creds: dict) -> list:
    try:
        from azure.identity import ClientSecretCredential
        from azure.mgmt.containerservice import ContainerServiceClient
        access = creds.get("access_key") or ""
        if ":" not in access:
            return []
        tenant_id, client_id = access.split(":", 1)
        cred = ClientSecretCredential(tenant_id=tenant_id, client_id=client_id,
                                       client_secret=creds.get("secret_key") or "")
        sub = creds.get("account_id")
        client = ContainerServiceClient(cred, sub)
        clusters = []
        for c in client.managed_clusters.list():
            clusters.append(_assess_aks(c))
        return clusters
    except Exception:
        return []


def _assess_aks(c) -> dict:
    findings = []
    score = 100

    version = getattr(c, "kubernetes_version", "") or ""
    eol = _k8s_version_eol(version)
    if eol.get("eol"):
        score -= 25
        findings.append({"severity": "critical", "message": f"Kubernetes version {version} is EOL"})

    api_profile = getattr(c, "api_server_access_profile", None)
    if api_profile and getattr(api_profile, "enable_private_cluster", False):
        private = True
    else:
        private = False
        score -= 15
        findings.append({"severity": "warning", "message": "API server is publicly accessible (not a private cluster)"})

    network_profile = getattr(c, "network_profile", None)
    policy = getattr(network_profile, "network_policy", None) if network_profile else None
    if not policy:
        score -= 10
        findings.append({"severity": "warning", "message": "Network policy not enforced"})

    rbac_enabled = getattr(c, "enable_rbac", False)
    if not rbac_enabled:
        score -= 20
        findings.append({"severity": "critical", "message": "RBAC not enabled"})

    aad = getattr(c, "aad_profile", None)
    if not aad:
        score -= 10
        findings.append({"severity": "info", "message": "Azure AD integration not configured"})

    return {
        "id": c.id,
        "name": c.name,
        "provider": "azure",
        "region": c.location,
        "version": version,
        "status": getattr(c, "power_state", {}).code if getattr(c, "power_state", None) else "unknown",
        "endpoint_public": not private,
        "endpoint_private": private,
        "logging_enabled": [],
        "encryption_at_rest": True,
        "created_at": None,
        "score": max(0, score),
        "findings": findings,
    }


# ══════════════════════════════════════════════════════════════════
# GCP GKE
# ══════════════════════════════════════════════════════════════════
def list_gke_clusters(creds: dict) -> list:
    try:
        from google.oauth2 import service_account
        from google.cloud import container_v1
        sa_json = creds.get("secret_key") or ""
        if not sa_json.startswith("{"):
            return []
        sa_info = json.loads(sa_json)
        credentials = service_account.Credentials.from_service_account_info(sa_info)
        project_id = sa_info.get("project_id") or creds.get("account_id")
        client = container_v1.ClusterManagerClient(credentials=credentials)
        parent = f"projects/{project_id}/locations/-"
        resp = client.list_clusters(parent=parent)
        return [_assess_gke(c) for c in resp.clusters]
    except Exception:
        return []


def _assess_gke(c) -> dict:
    findings = []
    score = 100

    version = getattr(c, "current_master_version", "")
    eol = _k8s_version_eol(version)
    if eol.get("eol"):
        score -= 25
        findings.append({"severity": "critical", "message": f"Kubernetes version {version} is EOL"})

    priv = getattr(c, "private_cluster_config", None)
    if not priv or not getattr(priv, "enable_private_endpoint", False):
        score -= 15
        findings.append({"severity": "warning", "message": "Private endpoint not enabled"})

    np = getattr(c, "network_policy", None)
    if not np or not getattr(np, "enabled", False):
        score -= 10
        findings.append({"severity": "warning", "message": "Network policy disabled"})

    workload_identity = getattr(c, "workload_identity_config", None)
    if not workload_identity or not getattr(workload_identity, "workload_pool", ""):
        score -= 10
        findings.append({"severity": "warning", "message": "Workload Identity not configured"})

    shielded = getattr(c, "shielded_nodes", None)
    if not shielded or not getattr(shielded, "enabled", False):
        score -= 10
        findings.append({"severity": "warning", "message": "Shielded nodes not enabled"})

    lc = getattr(c, "logging_config", None)
    logging_enabled = bool(lc) and bool(getattr(getattr(lc, "component_config", None), "enable_components", None))

    return {
        "id": c.self_link,
        "name": c.name,
        "provider": "gcp",
        "region": c.location,
        "version": version,
        "status": c.status.name if hasattr(c.status, "name") else str(c.status),
        "endpoint_public": not (priv and getattr(priv, "enable_private_endpoint", False)),
        "endpoint_private": bool(priv and getattr(priv, "enable_private_endpoint", False)),
        "logging_enabled": ["cluster"] if logging_enabled else [],
        "encryption_at_rest": True,
        "created_at": getattr(c, "create_time", None),
        "score": max(0, score),
        "findings": findings,
    }


# ══════════════════════════════════════════════════════════════════
# Top-level dispatch
# ══════════════════════════════════════════════════════════════════
def list_clusters_for_account(creds: dict) -> list:
    provider = creds.get("provider")
    if provider == "aws":
        return list_eks_clusters(creds)
    if provider == "azure":
        return list_aks_clusters(creds)
    if provider == "gcp":
        return list_gke_clusters(creds)
    return []
