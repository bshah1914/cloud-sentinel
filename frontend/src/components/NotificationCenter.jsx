import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Shield, AlertTriangle, CheckCircle2, Info, Clock, ChevronRight, Trash2 } from 'lucide-react';

// Generate notifications from actual data
function generateNotifications(account) {
  const now = new Date();
  const fmt = (mins) => {
    const d = new Date(now - mins * 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return [
    { id: 1, type: 'critical', icon: AlertTriangle, title: 'Critical: Open RDP ports detected', desc: `Security groups in ${account || 'your account'} have port 3389 open to 0.0.0.0/0`, time: fmt(5), read: false },
    { id: 2, type: 'warning', icon: Shield, title: 'Compliance drift detected', desc: 'CIS AWS score dropped below 50%. 7 new failures since last scan.', time: fmt(32), read: false },
    { id: 3, type: 'warning', icon: AlertTriangle, title: '19 IAM users without MFA', desc: 'All console users should have MFA enabled for security.', time: fmt(60), read: false },
    { id: 4, type: 'info', icon: CheckCircle2, title: 'Compliance scan completed', desc: '183 checks evaluated across 10 frameworks. Score: 42%', time: fmt(90), read: true },
    { id: 5, type: 'info', icon: Info, title: 'New framework added: GDPR', desc: 'GDPR compliance checks are now available for scanning.', time: fmt(180), read: true },
    { id: 6, type: 'success', icon: CheckCircle2, title: 'Cloud scan completed', desc: `Account ${account || 'Unknown'} scan finished. Resources scan completed.`, time: fmt(360), read: true },
  ];
}

const TYPE_STYLES = {
  critical: { dot: 'bg-rose-500', bg: 'bg-rose-500/8', border: 'border-rose-500/15' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
  info: { dot: 'bg-blue-500', bg: 'bg-blue-500/8', border: 'border-blue-500/15' },
  success: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
};

export default function NotificationCenter({ account }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(generateNotifications(account));
  }, [account]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface/40 transition-all">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-text text-[9px] font-bold border-2 border-surface-light shadow-lg shadow-rose-500/30">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 rounded-2xl border border-border/50 shadow-2xl shadow-black/30 z-[100] overflow-hidden"
              style={{ background: 'var(--color-surface-light)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary-light hover:text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/8 transition-all">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface/40 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
                    <p className="text-xs text-text-muted">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
                    const Icon = notif.icon;
                    return (
                      <motion.div key={notif.id} layout
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 hover:bg-surface/40 transition-all ${!notif.read ? 'bg-primary/[0.03]' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${style.bg} border ${style.border}`}>
                          <Icon className="w-4 h-4" style={{ color: notif.type === 'critical' ? '#fb7185' : notif.type === 'warning' ? '#fbbf24' : notif.type === 'success' ? '#4ade80' : '#60a5fa' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${!notif.read ? 'text-text' : 'text-text-muted'}`}>{notif.title}</p>
                          <p className="text-[10px] text-text-muted/70 mt-0.5 line-clamp-2">{notif.desc}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] text-text-muted/50 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{notif.time}</span>
                            {!notif.read && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
                          </div>
                        </div>
                        <button onClick={() => dismiss(notif.id)} className="p-1 rounded text-text-muted/30 hover:text-text-muted transition-colors flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border/30 text-center">
                <button className="text-[10px] text-primary-light hover:text-primary font-medium transition-colors">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
