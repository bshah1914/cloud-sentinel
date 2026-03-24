import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ResponsiveGridLayout } from 'react-grid-layout';
import { getWidgetById } from '../widgets/registry';
import WidgetWrapper from '../widgets/WidgetWrapper';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function KioskMode() {
  const { id } = useParams();
  const [layouts, setLayouts] = useState({ lg: [] });
  const [widgets, setWidgets] = useState([]);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState('aws');

  useEffect(() => {
    const token = localStorage.getItem('cm_token');
    // Load dashboard
    fetch(`/api/dashboards/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.layout) {
          setLayouts({ lg: data.layout });
          setWidgets(data.layout.map((l) => l.i));
        }
      });
    // Get account
    fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const accts = data.accounts || [];
        if (accts.length > 0) {
          setAccount(accts[0].name);
          setProvider(accts[0].provider || 'aws');
        }
      });

    // Auto-refresh every 60s
    const interval = setInterval(() => window.location.reload(), 60000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="min-h-screen bg-surface p-4">
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
                <Suspense fallback={<div className="text-text-muted text-xs">Loading...</div>}>
                  <Component account={account} provider={provider} />
                </Suspense>
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
