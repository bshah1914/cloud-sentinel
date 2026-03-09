"""
GCP Cloud Provider — Data Collector
Collects GCP resource data using google-cloud SDK.
"""

import json
from pathlib import Path
from ..base import BaseCollector, ProviderInfo, CredentialField


GCP_REGIONS = [
    "us-central1", "us-east1", "us-east4", "us-east5", "us-south1", "us-west1", "us-west2", "us-west3", "us-west4",
    "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6", "europe-west8", "europe-west9",
    "europe-north1", "europe-central2", "europe-southwest1",
    "asia-east1", "asia-east2", "asia-northeast1", "asia-northeast2", "asia-northeast3",
    "asia-south1", "asia-south2", "asia-southeast1", "asia-southeast2",
    "australia-southeast1", "australia-southeast2",
    "southamerica-east1", "southamerica-west1",
    "northamerica-northeast1", "northamerica-northeast2",
    "me-west1", "me-central1", "me-central2",
    "africa-south1",
]


class GCPCollector(BaseCollector):

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id="gcp",
            name="Google Cloud Platform",
            short_name="GCP",
            icon="gcp",
            color="#4285F4",
            description="Collect and audit GCP resources including Compute Engine, Cloud Storage, Cloud SQL, Cloud Functions, and more.",
            credential_fields=[
                CredentialField(key="project_id", label="Project ID", placeholder="my-gcp-project-123456"),
                CredentialField(key="service_account_json", label="Service Account Key (JSON)", placeholder="Paste full JSON key content", secret=True),
            ],
            region_support=True,
        )

    def validate_credentials(self, credentials: dict) -> dict:
        try:
            from google.oauth2 import service_account
            from google.cloud import compute_v1

            sa_info = json.loads(credentials["service_account_json"]) if isinstance(credentials["service_account_json"], str) else credentials["service_account_json"]
            creds = service_account.Credentials.from_service_account_info(sa_info)
            project_id = credentials.get("project_id") or sa_info.get("project_id")

            client = compute_v1.ProjectsClient(credentials=creds)
            project = client.get(project=project_id)
            return {
                "valid": True,
                "account_id": project_id,
                "project_name": project.name,
                "error": "",
            }
        except ImportError:
            return {"valid": False, "account_id": "", "error": "GCP SDK not installed. Run: pip install google-cloud-compute google-cloud-storage google-cloud-resource-manager google-auth"}
        except Exception as e:
            return {"valid": False, "account_id": "", "error": str(e)}

    def get_regions(self, credentials: dict) -> list[str]:
        try:
            from google.oauth2 import service_account
            from google.cloud import compute_v1

            sa_info = json.loads(credentials["service_account_json"]) if isinstance(credentials["service_account_json"], str) else credentials["service_account_json"]
            creds = service_account.Credentials.from_service_account_info(sa_info)
            project_id = credentials.get("project_id") or sa_info.get("project_id")

            client = compute_v1.RegionsClient(credentials=creds)
            regions = [r.name for r in client.list(project=project_id) if r.status == "UP"]
            return regions
        except Exception:
            return GCP_REGIONS

    def collect(self, account_name: str, region: str, credentials: dict,
                data_dir: Path, progress_callback=None) -> dict:
        try:
            from google.oauth2 import service_account
            from google.cloud import compute_v1, storage
        except ImportError:
            return {"resources_collected": 0, "errors": ["GCP SDK not installed"]}

        sa_info = json.loads(credentials["service_account_json"]) if isinstance(credentials["service_account_json"], str) else credentials["service_account_json"]
        creds = service_account.Credentials.from_service_account_info(sa_info)
        project_id = credentials.get("project_id") or sa_info.get("project_id")

        acct_dir = data_dir / "gcp" / account_name / region
        acct_dir.mkdir(parents=True, exist_ok=True)

        collected = []
        errors = []

        def _save(filename, data):
            with open(acct_dir / filename, "w") as f:
                json.dump(data, f, indent=2, default=str)
            collected.append(filename)

        # Compute Instances
        try:
            client = compute_v1.InstancesClient(credentials=creds)
            # List instances in all zones of this region
            zones_client = compute_v1.ZonesClient(credentials=creds)
            zones = [z.name for z in zones_client.list(project=project_id) if z.name.startswith(region)]
            instances = []
            for zone in zones:
                for inst in client.list(project=project_id, zone=zone):
                    instances.append({
                        "id": str(inst.id), "name": inst.name, "zone": zone,
                        "machine_type": inst.machine_type.split("/")[-1] if inst.machine_type else "",
                        "status": inst.status,
                        "network_interfaces": [
                            {
                                "network": ni.network.split("/")[-1] if ni.network else "",
                                "internal_ip": ni.network_i_p,
                                "external_ip": ac.nat_i_p if ac else None,
                            }
                            for ni in (inst.network_interfaces or [])
                            for ac in ([ni.access_configs[0]] if ni.access_configs else [None])
                        ],
                    })
            _save("compute-instances.json", {"Instances": instances})
        except Exception as e:
            errors.append(f"Instances: {str(e)[:100]}")

        if progress_callback: progress_callback(20)

        # Firewall Rules (global)
        try:
            fw_client = compute_v1.FirewallsClient(credentials=creds)
            firewalls = [
                {
                    "id": str(fw.id), "name": fw.name,
                    "direction": fw.direction, "priority": fw.priority,
                    "source_ranges": list(fw.source_ranges or []),
                    "allowed": [{"protocol": a.I_p_protocol, "ports": list(a.ports or [])} for a in (fw.allowed or [])],
                    "denied": [{"protocol": d.I_p_protocol, "ports": list(d.ports or [])} for d in (fw.denied or [])],
                    "network": fw.network.split("/")[-1] if fw.network else "",
                    "disabled": fw.disabled,
                }
                for fw in fw_client.list(project=project_id)
            ]
            _save("compute-firewalls.json", {"Firewalls": firewalls})
        except Exception as e:
            errors.append(f"Firewalls: {str(e)[:100]}")

        if progress_callback: progress_callback(40)

        # VPC Networks (global)
        try:
            net_client = compute_v1.NetworksClient(credentials=creds)
            networks = [
                {
                    "id": str(n.id), "name": n.name,
                    "auto_create_subnetworks": n.auto_create_subnetworks,
                    "subnets_count": len(n.subnetworks or []),
                }
                for n in net_client.list(project=project_id)
            ]
            _save("compute-networks.json", {"Networks": networks})
        except Exception as e:
            errors.append(f"Networks: {str(e)[:100]}")

        if progress_callback: progress_callback(55)

        # Cloud Storage Buckets (global)
        try:
            storage_client = storage.Client(credentials=creds, project=project_id)
            buckets = [
                {
                    "name": b.name, "location": b.location,
                    "storage_class": b.storage_class,
                    "uniform_bucket_level_access": b.iam_configuration.get("uniformBucketLevelAccess", {}).get("enabled", False) if hasattr(b, "iam_configuration") and b.iam_configuration else False,
                }
                for b in storage_client.list_buckets()
            ]
            _save("storage-buckets.json", {"Buckets": buckets})
        except Exception as e:
            errors.append(f"Buckets: {str(e)[:100]}")

        if progress_callback: progress_callback(70)

        # Cloud SQL Instances (global)
        try:
            from googleapiclient.discovery import build
            from google.auth.transport.requests import Request
            sqladmin = build("sqladmin", "v1beta4", credentials=creds)
            result = sqladmin.instances().list(project=project_id).execute()
            sql_instances = []
            for inst in result.get("items", []):
                sql_instances.append({
                    "name": inst.get("name"), "region": inst.get("region"),
                    "database_version": inst.get("databaseVersion"),
                    "state": inst.get("state"),
                    "ip_addresses": inst.get("ipAddresses", []),
                    "settings": {
                        "tier": inst.get("settings", {}).get("tier"),
                        "ip_configuration": inst.get("settings", {}).get("ipConfiguration", {}),
                    },
                })
            _save("sql-instances.json", {"SqlInstances": sql_instances})
        except Exception as e:
            errors.append(f"SQL: {str(e)[:100]}")

        if progress_callback: progress_callback(85)

        # Disks
        try:
            disk_client = compute_v1.DisksClient(credentials=creds)
            zones_client = compute_v1.ZonesClient(credentials=creds)
            zones = [z.name for z in zones_client.list(project=project_id) if z.name.startswith(region)]
            disks = []
            for zone in zones:
                for d in disk_client.list(project=project_id, zone=zone):
                    disks.append({
                        "id": str(d.id), "name": d.name, "zone": zone,
                        "size_gb": d.size_gb, "type": d.type_.split("/")[-1] if d.type_ else "",
                        "status": d.status,
                    })
            _save("compute-disks.json", {"Disks": disks})
        except Exception as e:
            errors.append(f"Disks: {str(e)[:100]}")

        if progress_callback: progress_callback(100)

        return {"resources_collected": len(collected), "errors": errors}
