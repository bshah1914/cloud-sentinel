import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color = 'primary', delay = 0, trend }) {
  const colors = {
    primary: 'from-indigo-500/15 to-indigo-600/5 text-indigo-400 border-indigo-500/15',
    accent: 'from-cyan-500/15 to-cyan-600/5 text-cyan-400 border-cyan-500/15',
    success: 'from-emerald-500/15 to-emerald-600/5 text-emerald-400 border-emerald-500/15',
    warning: 'from-amber-500/15 to-amber-600/5 text-amber-400 border-amber-500/15',
    danger: 'from-red-500/15 to-red-600/5 text-red-400 border-red-500/15',
    info: 'from-blue-500/15 to-blue-600/5 text-blue-400 border-blue-500/15',
  };

  const iconBg = {
    primary: 'bg-indigo-500/10 text-indigo-400',
    accent: 'bg-cyan-500/10 text-cyan-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -3 }}
      className={`stat-shine relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[color]} border p-5 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="text-3xl font-bold text-text mt-2 tabular-nums"
          >
            {value}
          </motion.p>
          {trend && (
            <p className={`text-[10px] mt-1 font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last scan
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-br ${colors[color]} opacity-20 blur-2xl`} />
    </motion.div>
  );
}
