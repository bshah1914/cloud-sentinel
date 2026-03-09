"""
Azure Cloud Provider — Data Collector
Collects Azure resource data using azure-mgmt SDK.
"""

import json
from pathlib import Path
from ..base import BaseCollector, ProviderInfo, CredentialField


AZURE_LOCATIONS = [
    "eastus", "eastus2", "westus", "westus2", "westus3",
    "centralus", "northcentralus", "southcentralus", "westcentralus",
    "canadacentral", "canadaeast",
    "northeurope", "westeurope", "uksouth", "ukwest",
    "francecentral", "germanywestcentral", "switzerlandnorth", "norwayeast",
    "swedencentral", "polandcentral", "italynorth",
    "eastasia", "southeastasia", "japaneast", "japanwest",
    "australiaeast", "australiasoutheast", "centralindia", "southindia",
    "koreacentral", "koreasouth",
    "brazilsouth", "southafricanorth", "uaenorth", "qatarcentral",
]


class AzureCollector(BaseCollector):

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id="azure",
            name="Microsoft Azure",
            short_name="Azure",
            icon="azure",
            color="#0078D4",
            description="Collect and audit Azure cloud resources including VMs, Storage, SQL, Functions, NSGs, and more.",
            credential_fields=[
                CredentialField(key="tenant_id", label="Tenant ID", placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"),
                CredentialField(key="client_id", label="Client ID (App ID)", placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"),
                CredentialField(key="client_secret", label="Client Secret", placeholder="your-client-secret", secret=True),
                CredentialField(key="subscription_id", label="Subscription ID", placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"),
            ],
            region_support=True,
        )

    def validate_credentials(self, credentials: dict) -> dict:
        try:
            from azure.identity import ClientSecretCredential
            from azure.mgmt.resource import ResourceManagementClient

            credential = ClientSecretCredential(
                tenant_id=credentials["tenant_id"],
                client_id=credentials["client_id"],
                client_secret=credentials["client_secret"],
            )
            client = ResourceManagementClient(credential, credentials["subscription_id"])
            # Test by listing resource groups (limit 1)
            rgs = list(client.resource_groups.list())
            return {
                "valid": True,
                "account_id": credentials["subscription_id"],
                "subscription_id": credentials["subscription_id"],
                "resource_groups": len(rgs),
                "error": "",
            }
        except ImportError:
            return {"valid": False, "account_id": "", "error": "Azure SDK not installed. Run: pip install azure-identity azure-mgmt-resource azure-mgmt-compute azure-mgmt-network azure-mgmt-storage azure-mgmt-sql azure-mgmt-monitor"}
        except Exception as e:
            return {"valid": False, "account_id": "", "error": str(e)}

    def get_regions(self, credentials: dict) -> list[str]:
        try:
            from azure.identity import ClientSecretCredential
            from azure.mgmt.resource import SubscriptionClient

            credential = ClientSecretCredential(
                tenant_id=credentials["tenant_id"],
                client_id=credentials["client_id"],
                client_secret=credentials["client_secret"],
            )
            client = SubscriptionClient(credential)
            locations = client.subscriptions.list_locations(credentials["subscription_id"])
            return [loc.name for loc in locations if loc.name]
        except Exception:
            return AZURE_LOCATIONS

    def collect(self, account_name: str, region: str, credentials: dict,
                data_dir: Path, progress_callback=None) -> dict:
        try:
            from azure.identity import ClientSecretCredential
            from azure.mgmt.compute import ComputeManagementClient
            from azure.mgmt.network import NetworkManagementClient
            from azure.mgmt.storage import StorageManagementClient
            from azure.mgmt.sql import SqlManagementClient
            from azure.mgmt.resource import ResourceManagementClient
            from azure.mgmt.monitor import MonitorManagementClient
        except ImportError:
            return {"resources_collected": 0, "errors": ["Azure SDK not installed"]}

        credential = ClientSecretCredential(
            tenant_id=credentials["tenant_id"],
            client_id=credentials["client_id"],
            client_secret=credentials["client_secret"],
        )
        sub_id = credentials["subscription_id"]
        acct_dir = data_dir / "azure" / account_name / region
        acct_dir.mkdir(parents=True, exist_ok=True)

        collected = []
        errors = []

        def _save(filename, data):
            with open(acct_dir / filename, "w") as f:
                json.dump(data, f, indent=2, default=str)
            collected.append(filename)

        # Virtual Machines
        try:
            compute = ComputeManagementClient(credential, sub_id)
            vms = [vm.as_dict() for vm in compute.virtual_machines.list_all() if not region or region == "all" or vm.location == region]
            _save("compute-virtual-machines.json", {"VirtualMachines": vms})
        except Exception as e:
            errors.append(f"VMs: {str(e)[:100]}")

        if progress_callback: progress_callback(15)

        # Network Security Groups
        try:
            network = NetworkManagementClient(credential, sub_id)
            nsgs = [nsg.as_dict() for nsg in network.network_security_groups.list_all() if not region or region == "all" or nsg.location == region]
            _save("network-security-groups.json", {"NetworkSecurityGroups": nsgs})
        except Exception as e:
            errors.append(f"NSGs: {str(e)[:100]}")

        if progress_callback: progress_callback(30)

        # Virtual Networks
        try:
            vnets = [vn.as_dict() for vn in network.virtual_networks.list_all() if not region or region == "all" or vn.location == region]
            _save("network-virtual-networks.json", {"VirtualNetworks": vnets})
        except Exception as e:
            errors.append(f"VNets: {str(e)[:100]}")

        if progress_callback: progress_callback(40)

        # Public IPs
        try:
            pips = [pip.as_dict() for pip in network.public_ip_addresses.list_all() if not region or region == "all" or pip.location == region]
            _save("network-public-ips.json", {"PublicIPAddresses": pips})
        except Exception as e:
            errors.append(f"Public IPs: {str(e)[:100]}")

        # Load Balancers
        try:
            lbs = [lb.as_dict() for lb in network.load_balancers.list_all() if not region or region == "all" or lb.location == region]
            _save("network-load-balancers.json", {"LoadBalancers": lbs})
        except Exception as e:
            errors.append(f"Load Balancers: {str(e)[:100]}")

        if progress_callback: progress_callback(55)

        # Storage Accounts
        try:
            storage = StorageManagementClient(credential, sub_id)
            accounts = [sa.as_dict() for sa in storage.storage_accounts.list() if not region or region == "all" or sa.location == region]
            _save("storage-accounts.json", {"StorageAccounts": accounts})
        except Exception as e:
            errors.append(f"Storage: {str(e)[:100]}")

        if progress_callback: progress_callback(70)

        # SQL Databases
        try:
            sql = SqlManagementClient(credential, sub_id)
            servers = [s.as_dict() for s in sql.servers.list() if not region or region == "all" or s.location == region]
            _save("sql-servers.json", {"SqlServers": servers})
        except Exception as e:
            errors.append(f"SQL: {str(e)[:100]}")

        if progress_callback: progress_callback(80)

        # Resource Groups
        try:
            resource = ResourceManagementClient(credential, sub_id)
            rgs = [rg.as_dict() for rg in resource.resource_groups.list() if not region or region == "all" or rg.location == region]
            _save("resource-groups.json", {"ResourceGroups": rgs})
        except Exception as e:
            errors.append(f"Resource Groups: {str(e)[:100]}")

        # Disks
        try:
            disks = [d.as_dict() for d in compute.disks.list() if not region or region == "all" or d.location == region]
            _save("compute-disks.json", {"Disks": disks})
        except Exception as e:
            errors.append(f"Disks: {str(e)[:100]}")

        if progress_callback: progress_callback(100)

        return {"resources_collected": len(collected), "errors": errors}
