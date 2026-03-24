import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsiveGridLayout } from 'react-grid-layout';
import {
  Plus, Save, Layout, Edit3, Eye, Maximize2, ChevronDown,
  LayoutGrid, Sparkles
} from 'lucide-react';
import { getWidgetById } from '../widgets/registry';
import WidgetWrapper from '../widgets/WidgetWrapper';
import WidgetLibraryPanel from '../widgets/WidgetLibraryPanel';


const DEFAULT_LAYOUT = [
  { i: 'security-score', x: 0, y: 0, w: 4, h: 4 },
  { i: 'severity-pie', x: 4, y: 0, w: 4, h: 4 },
  { i: 'risk-gauge', x: 8, y: 0, w: 4, h: 3 },
  { i: 'resource-stats', x: 0, y: 4, w: 12, h: 2 },
  { i: 'top-findings', x: 0, y: 6, w: 6, h: 5 },
  { i: 'resource-bar', x: 6, y: 6, w: 6, h: 5 },
];

export default function CustomDashboard() {
  const { id: dashboardId } = useParams();
  const { account, provider } = useOutletContext();
  const [layouts, setLayouts] = useState({ lg: DEFAULT_LAYOUT });
  const [widgets, setWidgets] = useState(DEFAULT_LAYOUT.map((l) => l.i));
  const [isEditing, setIsEditing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dashboardName, setDashboardName] = useState('My Dashboard');
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load dashboard from API
  useEffect(() => {
    if (!dashboardId) return;
    const token = localStorage.getItem('cm_token');
    fetch(`/api/dashboards/${dashboardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.layout) {
          setLayouts({ lg: data.layout });
          setWidgets(data.layout.map((l) => l.i));
        }
        if (data.name) setDashboardName(data.name);
      })
      .catch(() => {});
  }, [dashboardId]);

  const handleLayoutChange = useCallback((layout) => {
    setLayouts((prev) => ({ ...prev, lg: layout }));
  }, []);

  const handleAddWidget = useCallback((widget) => {
    if (widgets.includes(widget.id)) return;
    setWidgets((prev) => [...prev, widget.id]);
    setLayouts((prev) => ({
      ...prev,
      lg: [
        ...(prev.lg || []),
        { i: widget.id, x: 0, y: Infinity, ...widget.defaultSize },
      ],
    }));
  }, [widgets]);

  const handleRemoveWidget = useCallback((widgetId) => {
    setWidgets((prev) => prev.filter((id) => id !== widgetId));
    setLayouts((prev) => ({
      ...prev,
      lg: (prev.lg || []).filter((l) => l.i !== widgetId),
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('cm_token');
    const body = { name: dashboardName, layout: layouts.lg };
    const url = dashboardId ? `/api/dashboards/${dashboardId}` : '/api/dashboards';
    const method = dashboardId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id && !dashboardId) {
        window.history.replaceState(null, '', `/custom-dashboard/${data.id}`);
      }
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
            <LayoutGrid className="w-4.5 h-4.5 text-primary-light" />
          </div>
          {isEditing ? (
            <input type="text" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-primary/40 outline-none text-text px-1" />
          ) : (
            <h1 className="text-xl font-bold text-text">{dashboardName}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 rounded-xl text-xs font-medium transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Widget
          </button>
          <button onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              isEditing ? 'bg-accent/15 text-accent border-accent/20' : 'bg-surface-lighter/50 text-text-muted border-border/30 hover:border-border/50'
            }`}>
            {isEditing ? <><Eye className="w-3.5 h-3.5" /> Preview</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-medium transition-all disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={toggleFullscreen}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter/50 transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        margin={[12, 12]}
      >
        {widgets.map((widgetId) => {
          const widget = getWidgetById(widgetId);
          if (!widget) return null;
          const Component = widget.component;
          return (
            <div key={widgetId}>
              <WidgetWrapper
                title={widget.name}
                icon={widget.icon}
                isEditing={isEditing}
                onRemove={() => handleRemoveWidget(widgetId)}
              >
                <Suspense fallback={<div className="flex items-center justify-center h-full text-text-muted text-xs">Loading widget...</div>}>
                  <Component account={account} provider={provider} />
                </Suspense>
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {/* Widget Library Panel */}
      <WidgetLibraryPanel
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onAddWidget={handleAddWidget}
        activeWidgetIds={widgets}
      />

      {/* Empty state */}
      {widgets.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-12 h-12 text-primary/30 mb-4" />
          <h3 className="text-lg font-bold text-text mb-2">Build Your Dashboard</h3>
          <p className="text-sm text-text-muted mb-4">Add widgets to create a custom view of your cloud security</p>
          <button onClick={() => setShowLibrary(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-sm font-medium shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Your First Widget
          </button>
        </motion.div>
      )}
    </div>
  );
}
