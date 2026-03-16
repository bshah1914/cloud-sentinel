import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server, Database, Shield, Layers, CloudLightning,
  HardDrive, Globe, MapPin, Search, Grid3X3, List
} from 'lucide-react';
import { getResources } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const RESOURCE_TABS = [
  { key: 'ec2_instances', label: 'EC2 Instances', icon: Server, color: 'indigo' },
  { key: 's3_buckets', label: 'S3 Buckets', icon: Database, color: 'cyan' },
  { key: 'security_groups', label: 'Security Groups', icon: Shield, color: 'amber' },
  { key: 'vpcs', label: 'VPCs', icon: Layers, color: 'emerald' },
  { key: 'lambda_functions', label: 'Lambda', icon: CloudLightning, color: 'green' },
  { key: 'rds_instances', label: 'RDS', icon: HardDrive, color: 'red' },
  { key: 'load_balancers', label: 'ELBs', icon: Globe, color: 'purple' },
];

export default function Resources() {
  const { account } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ec2_instances');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    getResources(account)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) return <Loader text="Loading resources..." />;
  if (error) return <EmptyState title="Error" description={error} />;
  if (!data) return <EmptyState title="No data" description="Select an account" />;

  const regions = Object.keys(data.regions);

  const getItems = () => {
    const items = [];
    const regionsToShow = selectedRegion === 'all' ? regions : [selectedRegion];
    for (const r of regionsToShow) {
      const regionData = data.regions[r] || {};
      const resourceList = regionData[activeTab] || [];
      resourceList.forEach((item) => items.push({ ...item, _region: r }));
    }
    if (search) {
      const s = search.toLowerCase();
      return items.filter((item) =>
        Object.values(item).some((v) => String(v).toLowerCase().includes(s))
      );
    }
    return items;
  };

  const items = getItems();

  const getColumns = () => {
    switch (activeTab) {
      case 'ec2_instances': return ['id', 'type', 'state', 'public_ip', 'private_ip', 'vpc'];
      case 's3_buckets': return ['name', 'created'];
      case 'security_groups': return ['id', 'name', 'vpc', 'inbound_rules', 'outbound_rules'];
      case 'vpcs': return ['id', 'cidr', 'default'];
      case 'lambda_functions': return ['name', 'runtime', 'memory'];
      case 'rds_instances': return ['id', 'engine', 'class', 'publicly_accessible'];
      case 'load_balancers': return ['name', 'dns', 'scheme'];
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
            <Server className="w-4.5 h-4.5 text-primary-light" />
          </div>
          Resources
        </h1>
        <p className="text-text-muted text-sm mt-1.5">Explore collected cloud resources for <span className="text-accent font-medium">{account}</span></p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {RESOURCE_TABS.map(({ key, label, icon: Icon, color }) => {
          const count = (() => {
            let c = 0;
            const regionsToShow = selectedRegion === 'all' ? regions : [selectedRegion];
            for (const r of regionsToShow) c += (data.regions[r]?.[key] || []).length;
            return c;
          })();
          const isActive = activeTab === key;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                isActive
                  ? `bg-${color}-500/10 text-${color}-400 border-${color}-500/15 shadow-sm`
                  : 'bg-surface-light/50 text-text-muted hover:text-text border-border/30 hover:border-border/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                isActive ? `bg-${color}-500/15` : 'bg-surface-lighter/50'
              }`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full bg-surface-light/50 border border-border/50 rounded-xl pl-10 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="appearance-none bg-surface-light/50 border border-border/50 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-text focus:outline-none focus:border-primary/40 transition-all cursor-pointer"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <Card delay={0.1} hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-left border-b border-border/50">
                <th className="pb-3.5 font-medium text-[10px] uppercase tracking-wider pr-4">Region</th>
                {getColumns().map((col) => (
                  <th key={col} className="pb-3.5 font-medium text-[10px] uppercase tracking-wider pr-4">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                  className="border-b border-border/20 hover:bg-white/[0.015] transition-all"
                >
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-text-muted bg-surface-lighter/30 px-2 py-1 rounded-md w-fit">
                      <MapPin className="w-2.5 h-2.5" />{item._region}
                    </span>
                  </td>
                  {getColumns().map((col) => (
                    <td key={col} className="py-3 pr-4">
                      {col === 'state' ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                          item[col] === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                          item[col] === 'stopped' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item[col] === 'running' ? 'bg-emerald-400 dot-pulse' :
                            item[col] === 'stopped' ? 'bg-red-400' : 'bg-slate-400'
                          }`} />
                          {item[col] ?? '-'}
                        </span>
                      ) : col === 'publicly_accessible' ? (
                        <span className={`text-xs font-medium ${item[col] ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item[col] ? 'Yes' : 'No'}
                        </span>
                      ) : col === 'public_ip' && item[col] ? (
                        <span className="font-mono text-amber-400 text-xs">{item[col]}</span>
                      ) : (
                        <span className={`text-xs ${['id', 'name', 'dns', 'cidr', 'private_ip'].includes(col) ? 'font-mono text-text-muted' : 'text-text'}`}>
                          {item[col] ?? '-'}
                        </span>
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <EmptyState title="No resources found" description="No resources match the current filters" />
          )}
        </div>
      </Card>
    </div>
  );
}
