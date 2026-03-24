import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Plus, Copy, Trash2, Clock, Star, Share2,
  Monitor, Shield, Server, AlertTriangle
} from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';

const TEMPLATE_ICONS = {
  executive: Shield,
  devops: Server,
  compliance: Star,
  soc: AlertTriangle,
};

export default function DashboardManager() {
  const [dashboards, setDashboards] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('cm_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    try {
      const [dashRes, tmplRes] = await Promise.all([
        fetch('/api/dashboards', { headers }).then((r) => r.json()),
        fetch('/api/dashboards/templates', { headers }).then((r) => r.json()),
      ]);
      setDashboards(dashRes.dashboards || []);
      setTemplates(tmplRes.templates || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch('/api/dashboards', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'New Dashboard', layout: [] }),
    });
    load();
  };

  const handleClone = async (id) => {
    await fetch(`/api/dashboards/${id}/clone`, { method: 'POST', headers });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dashboard?')) return;
    await fetch(`/api/dashboards/${id}`, { method: 'DELETE', headers });
    load();
  };

  if (loading) return <Loader text="Loading dashboards..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
              <LayoutGrid className="w-4.5 h-4.5 text-primary-light" />
            </div>
            Dashboard Manager
          </h1>
          <p className="text-text-muted text-sm mt-1.5">Create, customize, and manage your dashboards</p>
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl text-xs font-medium transition-all shadow-sm shadow-primary/15">
          <Plus className="w-3.5 h-3.5" /> New Dashboard
        </button>
      </motion.div>

      {/* My Dashboards */}
      <div>
        <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-accent" /> My Dashboards
          <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">
            {dashboards.filter((d) => !d.is_template).length}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.filter((d) => !d.is_template).map((dash, i) => (
            <Card key={dash.id} delay={i * 0.04}>
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/custom-dashboard/${dash.id}`}
                    className="text-sm font-semibold text-text hover:text-primary-light transition-colors">
                    {dash.name}
                  </Link>
                  <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dash.created_at ? new Date(dash.created_at).toLocaleDateString() : 'Just now'}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {(dash.layout || []).length} widgets
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleClone(dash.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Clone">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(dash.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {dashboards.filter((d) => !d.is_template).length === 0 && (
            <div className="col-span-full text-center py-8 text-text-muted text-sm">
              No custom dashboards yet. Click "New Dashboard" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" /> Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((tmpl, i) => {
              const Icon = TEMPLATE_ICONS[tmpl.template_type] || LayoutGrid;
              return (
                <Card key={tmpl.id} delay={i * 0.04}>
                  <div className="text-center py-2">
                    <Icon className="w-8 h-8 text-primary-light mx-auto mb-2" />
                    <p className="text-sm font-semibold text-text">{tmpl.name}</p>
                    <p className="text-[10px] text-text-muted mt-1">{(tmpl.layout || []).length} widgets</p>
                    <button onClick={() => handleClone(tmpl.id)}
                      className="mt-3 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 rounded-xl text-xs font-medium transition-all">
                      Use Template
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
