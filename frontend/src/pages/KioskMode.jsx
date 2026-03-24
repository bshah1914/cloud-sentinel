import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ResponsiveGridLayout } from 'react-grid-layout';
import { Monitor, ChevronDown, Maximize2, RefreshCw } from 'lucide-react';
import { getWidgetById } from '../widgets/registry';
import WidgetWrapper from '../widgets/WidgetWrapper';

export default function KioskMode() {
  const { id: paramId } = useParams();
  const [dashboardId, setDashboardId] = useState(paramId || null);
  const [dashboards, setDashboards] = useState([]);
  const [layouts, setLayouts] = useState({ lg: [] });
  const [widgets, setWidgets] = useState([]);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState('aws');
  const [dashName, setDashName] = useState('');
  const [showSelector, setShowSelector] = useState(!paramId);

  const token = localStorage.getItem('cm_token');
  const headers = { Authorization: `Bearer ${token}` };

  // Load dashboards list
  useEffect(() => {
    fetch('/api/dashboards', { headers })
      .then((r) => r.json())
      .then((data) => {
        const list = data.dashboards || [];
        setDashboards(list);
        // Auto-select first dashboard if none specified
        if (!dashboardId && list.length > 0) {
          setDashboardId(list[0].id);
          setShowSelector(false);
        }
      })
      .catch(() => {});

    // Get account
    fetch('/api/accounts', { headers })
      .then((r) => r.json())
      .then((data) => {
        const accts = data.accounts || [];
        if (accts.length > 0) {
          setAccount(accts[0].name);
          setProvider(accts[0].provider || 'aws');
        }
      })
      .catch(() => {});
  }, []);

  // Load selected dashboard
  useEffect(() => {
    if (!dashboardId) return;
    fetch(`/api/dashboards/${dashboardId}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.layout) {
          setLayouts({ lg: data.layout });
          setWidgets(data.layout.map((l) => l.i));
        }
        setDashName(data.name || 'Dashboard');
      })
      .catch(() => {});
  }, [dashboardId]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => window.location.reload(), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Dashboard selector screen
  if (showSelector || (dashboards.length > 0 && !dashboardId)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <Monitor className="w-12 h-12 text-primary-light mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-text">Kiosk Mode</h1>
            <p className="text-sm text-text-muted mt-1">Select a dashboard to display</p>
          </div>
          <div className="space-y-3">
            {dashboards.map((d) => (
              <button key={d.id} onClick={() => { setDashboardId(d.id); setShowSelector(false); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-light border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                <div>
                  <p className="text-sm font-semibold text-text">{d.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{(d.layout || []).length} widgets</p>
                </div>
                <Monitor className="w-5 h-5 text-text-muted" />
              </button>
            ))}
            {dashboards.length === 0 && (
              <div className="text-center py-12 text-text-muted">
                <p className="text-sm">No dashboards found.</p>
                <p className="text-xs mt-1">Create one from the Dashboard Manager first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Minimal toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-light/50 border-b border-border/20">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-primary-light" />
          <span className="text-sm font-bold text-text">{dashName}</span>
          <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">KIOSK</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dashboard switcher */}
          <select value={dashboardId} onChange={(e) => setDashboardId(e.target.value)}
            className="bg-surface/50 border border-border/30 rounded-lg px-2 py-1 text-xs text-text cursor-pointer focus:outline-none">
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter/50 transition-all" title="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter/50 transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {widgets.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={60}
            isDraggable={false}
            isResizable={false}
            margin={[8, 8]}
          >
            {widgets.map((widgetId) => {
              const widget = getWidgetById(widgetId);
              if (!widget) return null;
              const Component = widget.component;
              return (
                <div key={widgetId}>
                  <WidgetWrapper title={widget.name} icon={widget.icon} isEditing={false}>
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>}>
                      <Component account={account} provider={provider} />
                    </Suspense>
                  </WidgetWrapper>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        ) : (
          <div className="flex items-center justify-center h-[80vh] text-text-muted">
            <p className="text-sm">No widgets in this dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
}
