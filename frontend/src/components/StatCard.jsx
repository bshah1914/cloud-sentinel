import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color = 'primary', delay = 0, trend }) {
  const colors = {
    primary: { bg: 'from-violet-500/20 via-violet-600/10 to-transparent', border: 'border-violet-500/20', icon: 'bg-violet-500/15 text-violet-400', glow: 'shadow-violet-500/10' },
    accent: { bg: 'from-sky-500/20 via-sky-600/10 to-transparent', border: 'border-sky-500/20', icon: 'bg-sky-500/15 text-sky-400', glow: 'shadow-sky-500/10' },
    success: { bg: 'from-emerald-500/20 via-emerald-600/10 to-transparent', border: 'border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-400', glow: 'shadow-emerald-500/10' },
    warning: { bg: 'from-amber-500/20 via-amber-600/10 to-transparent', border: 'border-amber-500/20', icon: 'bg-amber-500/15 text-amber-400', glow: 'shadow-amber-500/10' },
    danger: { bg: 'from-rose-500/20 via-rose-600/10 to-transparent', border: 'border-rose-500/20', icon: 'bg-rose-500/15 text-rose-400', glow: 'shadow-rose-500/10' },
    info: { bg: 'from-blue-500/20 via-blue-600/10 to-transparent', border: 'border-blue-500/20', icon: 'bg-blue-500/15 text-blue-400', glow: 'shadow-blue-500/10' },
  };

  const c = colors[color] || colors.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`stat-shine relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-5 backdrop-blur-sm shadow-lg ${c.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-[10px] font-semibold uppercase tracking-widest">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="text-3xl font-bold text-text mt-2 tabular-nums tracking-tight"
          >
            {value}
          </motion.p>
          {trend && (
            <p className={`text-[10px] mt-1.5 font-medium ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last scan
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.icon} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br ${c.bg} opacity-30 blur-2xl`} />
    </motion.div>
  );
}
