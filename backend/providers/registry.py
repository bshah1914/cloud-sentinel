"""
CloudLunar Provider Registry

Auto-discovers and manages cloud provider plugins.
"""

from typing import Optional
from .base import BaseCollector, BaseParser, BaseAuditor, BaseRoutes, ProviderInfo


class ProviderPlugin:
    """Container for a complete provider plugin."""
    def __init__(self, collector: BaseCollector, parser: BaseParser,
                 auditor: BaseAuditor, routes: BaseRoutes):
        self.collector = collector
        self.parser = parser
        self.auditor = auditor
        self.routes = routes
        self.info: ProviderInfo = collector.get_provider_info()


class ProviderRegistry:
    """Central registry for all cloud provider plugins."""

    def __init__(self):
        self._providers: dict[str, ProviderPlugin] = {}

    def register(self, provider_id: str, collector: BaseCollector,
                 parser: BaseParser, auditor: BaseAuditor, routes: BaseRoutes):
        """Register a cloud provider plugin."""
        plugin = ProviderPlugin(collector, parser, auditor, routes)
        self._providers[provider_id] = plugin

    def get(self, provider_id: str) -> Optional[ProviderPlugin]:
        """Get a registered provider by ID."""
        return self._providers.get(provider_id)

    def list_providers(self) -> list[dict]:
        """Return info about all registered providers."""
        return [
            {
                "id": pid,
                "name": p.info.name,
                "short_name": p.info.short_name,
                "icon": p.info.icon,
                "color": p.info.color,
                "description": p.info.description,
                "credential_fields": [
                    {"key": f.key, "label": f.label, "placeholder": f.placeholder,
                     "secret": f.secret, "required": f.required}
                    for f in p.info.credential_fields
                ],
                "region_support": p.info.region_support,
            }
            for pid, p in self._providers.items()
        ]

    def get_collector(self, provider_id: str) -> Optional[BaseCollector]:
        p = self._providers.get(provider_id)
        return p.collector if p else None

    def get_parser(self, provider_id: str) -> Optional[BaseParser]:
        p = self._providers.get(provider_id)
        return p.parser if p else None

    def get_auditor(self, provider_id: str) -> Optional[BaseAuditor]:
        p = self._providers.get(provider_id)
        return p.auditor if p else None

    @property
    def provider_ids(self) -> list[str]:
        return list(self._providers.keys())


# Global registry instance
registry = ProviderRegistry()
