"""
CloudLunar Provider Base Classes

Abstract base classes that every cloud provider (AWS, Azure, GCP) must implement.
This enforces a consistent interface across all providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path
from enum import Enum


class CloudProvider(str, Enum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class ProviderInfo:
    """Metadata about a cloud provider plugin."""
    id: str                    # e.g. "aws", "azure", "gcp"
    name: str                  # e.g. "Amazon Web Services"
    short_name: str            # e.g. "AWS"
    icon: str                  # e.g. "aws" (frontend icon key)
    color: str                 # e.g. "#FF9900" (brand color)
    description: str
    credential_fields: list    # Fields needed for authentication
    region_support: bool       # Does this provider have regions?


@dataclass
class CredentialField:
    """Definition of a credential field for the provider."""
    key: str                   # e.g. "aws_access_key_id"
    label: str                 # e.g. "Access Key ID"
    placeholder: str           # e.g. "AKIAIOSFODNN7EXAMPLE"
    secret: bool = False       # Should be masked in UI
    required: bool = True


@dataclass
class ScanRequest:
    """Unified scan request across all providers."""
    account_name: str
    provider: str
    credentials: dict          # Provider-specific credentials
    region: str = "all"        # "all" or specific region/location


@dataclass
class ScanJob:
    """Scan job status tracking."""
    id: str
    provider: str
    account: str
    status: str = "running"    # running, completed, failed
    progress: int = 0
    regions_total: int = 0
    regions_scanned: list = field(default_factory=list)
    log: list = field(default_factory=list)
    started: str = ""
    finished: str = ""
    error: str = ""


@dataclass
class AuditFinding:
    """Standardized audit finding across all providers."""
    title: str
    severity: Severity
    resource_type: str         # e.g. "EC2", "VM", "Compute Engine"
    resource_id: str
    region: str
    description: str
    recommendation: str
    provider: str              # "aws", "azure", "gcp"


@dataclass
class ResourceSummary:
    """Standardized resource count per region."""
    region: str
    resource_type: str         # Provider-specific type name
    count: int
    details: dict = field(default_factory=dict)


class BaseCollector(ABC):
    """
    Abstract base for collecting cloud resource data.
    Each provider implements its own SDK calls.
    """

    @abstractmethod
    def get_provider_info(self) -> ProviderInfo:
        """Return metadata about this provider."""
        ...

    @abstractmethod
    def validate_credentials(self, credentials: dict) -> dict:
        """
        Validate provider credentials.
        Returns: {"valid": bool, "account_id": str, "error": str}
        """
        ...

    @abstractmethod
    def get_regions(self, credentials: dict) -> list[str]:
        """Return list of available/enabled regions for this provider."""
        ...

    @abstractmethod
    def collect(self, account_name: str, region: str, credentials: dict,
                data_dir: Path, progress_callback=None) -> dict:
        """
        Collect all resource data for a region.
        Stores JSON files in data_dir.
        Returns: {"resources_collected": int, "errors": [str]}
        """
        ...


class BaseParser(ABC):
    """
    Abstract base for parsing collected data into normalized structures.
    """

    @abstractmethod
    def get_resource_types(self) -> list[str]:
        """Return list of resource type keys this provider supports."""
        ...

    @abstractmethod
    def get_resource_labels(self) -> dict[str, str]:
        """Return {key: "Human Label"} mapping for resource types."""
        ...

    @abstractmethod
    def parse_resources(self, account_name: str, data_dir: Path) -> dict:
        """
        Parse collected data files into structured resource data.
        Returns provider-specific resource structure.
        """
        ...

    @abstractmethod
    def parse_dashboard(self, account_name: str, data_dir: Path) -> dict:
        """
        Parse collected data into dashboard summary.
        Must return a dict with at least:
        {
            "account", "provider", "security_score", "totals",
            "regions", "region_matrix", "public_resources",
            "identity_summary", "findings"
        }
        """
        ...


class BaseAuditor(ABC):
    """
    Abstract base for security auditing.
    """

    @abstractmethod
    def get_audit_checks(self) -> list[dict]:
        """
        Return list of available audit checks.
        Each: {"id": str, "title": str, "severity": Severity, "category": str}
        """
        ...

    @abstractmethod
    def run_audit(self, account_name: str, data_dir: Path) -> list[AuditFinding]:
        """
        Run all security audit checks against collected data.
        Returns list of findings.
        """
        ...


class BaseRoutes(ABC):
    """
    Abstract base for provider-specific API routes.
    """

    @abstractmethod
    def register_routes(self, app, get_current_user, data_base_dir: Path):
        """Register provider-specific FastAPI routes on the app."""
        ...
