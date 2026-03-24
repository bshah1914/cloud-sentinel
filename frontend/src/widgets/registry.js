import { lazy } from 'react';
import {
  Shield, Server, Globe, AlertTriangle, Users, Activity,
  PieChart, BarChart3, Target, Network, Zap, FileText,
  Clock, Bell, CheckCircle2, Map, TrendingUp, GitCompare
} from 'lucide-react';

// Lazy-load all widgets for code splitting
const SecurityScoreRing = lazy(() => import('./security/SecurityScoreRing'));
const SeverityPieChart = lazy(() => import('./security/SeverityPieChart'));
const FindingsRadar = lazy(() => import('./security/FindingsRadar'));
const TopFindings = lazy(() => import('./security/TopFindings'));
const RiskGauge = lazy(() => import('./security/RiskGauge'));
const ResourceStatGrid = lazy(() => import('./resources/ResourceStatGrid'));
const ResourceBarChart = lazy(() => import('./resources/ResourceBarChart'));
const PublicIPTable = lazy(() => import('./resources/PublicIPTable'));
const MultiCloudSummary = lazy(() => import('./overview/MultiCloudSummary'));
const WAFRadar = lazy(() => import('./overview/WAFRadar'));
const AccountList = lazy(() => import('./overview/AccountList'));
const BigStat = lazy(() => import('./executive/BigStat'));
const TrendAreaChart = lazy(() => import('./executive/TrendAreaChart'));
const RecentScans = lazy(() => import('./operations/RecentScans'));
const QuickScanButton = lazy(() => import('./operations/QuickScanButton'));
const AuditLogFeed = lazy(() => import('./operations/AuditLogFeed'));
const ComplianceFrameworkCard = lazy(() => import('./compliance/ComplianceFrameworkCard'));
const ThreatFeed = lazy(() => import('./threats/ThreatFeed'));
const FindingsTrend = lazy(() => import('./threats/FindingsTrend'));
const NetworkTopology = lazy(() => import('./advanced/NetworkTopology'));
const RegionWorldMap = lazy(() => import('./advanced/RegionWorldMap'));
const ScoreTimeline = lazy(() => import('./advanced/ScoreTimeline'));
const ScanComparison = lazy(() => import('./advanced/ScanComparison'));

const WIDGET_REGISTRY = [
  // Security
  { id: 'security-score', name: 'Security Score', icon: Shield, category: 'Security', component: SecurityScoreRing, defaultSize: { w: 4, h: 4 }, description: 'Overall security score ring' },
  { id: 'severity-pie', name: 'Severity Distribution', icon: PieChart, category: 'Security', component: SeverityPieChart, defaultSize: { w: 4, h: 4 }, description: 'Findings by severity level' },
  { id: 'findings-radar', name: 'Security Posture', icon: Target, category: 'Security', component: FindingsRadar, defaultSize: { w: 4, h: 4 }, description: 'Security posture radar chart' },
  { id: 'top-findings', name: 'Top Findings', icon: AlertTriangle, category: 'Security', component: TopFindings, defaultSize: { w: 6, h: 5 }, description: 'Critical security findings' },
  { id: 'risk-gauge', name: 'Risk Gauge', icon: Activity, category: 'Security', component: RiskGauge, defaultSize: { w: 3, h: 3 }, description: 'Overall risk level indicator' },

  // Resources
  { id: 'resource-stats', name: 'Resource Stats', icon: Server, category: 'Resources', component: ResourceStatGrid, defaultSize: { w: 12, h: 2 }, description: 'Resource count grid' },
  { id: 'resource-bar', name: 'Resources by Region', icon: BarChart3, category: 'Resources', component: ResourceBarChart, defaultSize: { w: 8, h: 4 }, description: 'Resource distribution by region' },
  { id: 'public-ips', name: 'Public IPs', icon: Globe, category: 'Resources', component: PublicIPTable, defaultSize: { w: 8, h: 5 }, description: 'Public IP exposure list' },

  // Overview
  { id: 'multi-cloud', name: 'Cloud Providers', icon: Globe, category: 'Overview', component: MultiCloudSummary, defaultSize: { w: 12, h: 3 }, description: 'Multi-cloud account summary' },
  { id: 'waf-radar', name: 'WAF Radar', icon: Shield, category: 'Overview', component: WAFRadar, defaultSize: { w: 4, h: 4 }, description: 'Well-Architected Framework radar' },
  { id: 'account-list', name: 'Account List', icon: Users, category: 'Overview', component: AccountList, defaultSize: { w: 6, h: 4 }, description: 'Cloud accounts with scores' },

  // Executive
  { id: 'big-stat', name: 'KPI Card', icon: TrendingUp, category: 'Executive', component: BigStat, defaultSize: { w: 3, h: 2 }, description: 'Large metric card' },
  { id: 'trend-chart', name: 'Score Trend', icon: TrendingUp, category: 'Executive', component: TrendAreaChart, defaultSize: { w: 6, h: 3 }, description: 'Security score over time' },

  // Operations
  { id: 'recent-scans', name: 'Recent Scans', icon: Clock, category: 'Operations', component: RecentScans, defaultSize: { w: 6, h: 4 }, description: 'Latest scan results' },
  { id: 'quick-scan', name: 'Quick Scan', icon: Zap, category: 'Operations', component: QuickScanButton, defaultSize: { w: 3, h: 2 }, description: 'Start a scan' },
  { id: 'audit-log', name: 'Audit Log', icon: FileText, category: 'Operations', component: AuditLogFeed, defaultSize: { w: 6, h: 4 }, description: 'Recent audit events' },

  // Compliance
  { id: 'compliance-card', name: 'Compliance', icon: CheckCircle2, category: 'Compliance', component: ComplianceFrameworkCard, defaultSize: { w: 6, h: 4 }, description: 'Compliance framework scores' },

  // Threats
  { id: 'threat-feed', name: 'Threat Feed', icon: AlertTriangle, category: 'Threats', component: ThreatFeed, defaultSize: { w: 6, h: 5 }, description: 'Detected threats' },
  { id: 'findings-trend', name: 'Findings Trend', icon: TrendingUp, category: 'Threats', component: FindingsTrend, defaultSize: { w: 6, h: 3 }, description: 'Finding count over time' },

  // Advanced
  { id: 'network-topology', name: 'Network Topology', icon: Network, category: 'Advanced', component: NetworkTopology, defaultSize: { w: 8, h: 6 }, description: 'VPC/subnet topology graph' },
  { id: 'region-map', name: 'Region Map', icon: Map, category: 'Advanced', component: RegionWorldMap, defaultSize: { w: 8, h: 5 }, description: 'Resources on world map' },
  { id: 'score-timeline', name: 'Score Timeline', icon: TrendingUp, category: 'Advanced', component: ScoreTimeline, defaultSize: { w: 6, h: 3 }, description: 'Score history chart' },
  { id: 'scan-compare', name: 'Scan Comparison', icon: GitCompare, category: 'Advanced', component: ScanComparison, defaultSize: { w: 12, h: 5 }, description: 'Compare two scans' },
];

export default WIDGET_REGISTRY;

export function getWidgetById(id) {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function getWidgetsByCategory(category) {
  return WIDGET_REGISTRY.filter((w) => w.category === category);
}

export function getCategories() {
  return [...new Set(WIDGET_REGISTRY.map((w) => w.category))];
}
