import { clsx } from 'clsx';

const styles = {
  CRITICAL: 'bg-red-500/12 text-red-400 border-red-500/20 shadow-red-500/5',
  HIGH: 'bg-orange-500/12 text-orange-400 border-orange-500/20 shadow-orange-500/5',
  MEDIUM: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20 shadow-yellow-500/5',
  LOW: 'bg-blue-500/12 text-blue-400 border-blue-500/20 shadow-blue-500/5',
  INFO: 'bg-slate-500/12 text-slate-400 border-slate-500/20 shadow-slate-500/5',
  running: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/20 shadow-cyan-500/5',
  completed: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
  failed: 'bg-red-500/12 text-red-400 border-red-500/20 shadow-red-500/5',
};

const dots = {
  CRITICAL: 'bg-red-400',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-blue-400',
  INFO: 'bg-slate-400',
  running: 'bg-cyan-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border shadow-sm uppercase tracking-wider',
      styles[status] || styles.INFO,
      className
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        dots[status] || dots.INFO,
        status === 'running' && 'dot-pulse'
      )} />
      {status}
    </span>
  );
}
