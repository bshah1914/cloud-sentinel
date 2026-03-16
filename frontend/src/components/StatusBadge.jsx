import { clsx } from 'clsx';

const styles = {
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-rose-500/8',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/25 shadow-orange-500/8',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25 shadow-yellow-500/8',
  LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/25 shadow-blue-500/8',
  INFO: 'bg-slate-500/15 text-slate-400 border-slate-500/25 shadow-slate-500/8',
  running: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-cyan-500/8',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-emerald-500/8',
  failed: 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-rose-500/8',
};

const dots = {
  CRITICAL: 'bg-rose-400', HIGH: 'bg-orange-400', MEDIUM: 'bg-yellow-400',
  LOW: 'bg-blue-400', INFO: 'bg-slate-400',
  running: 'bg-cyan-400', completed: 'bg-emerald-400', failed: 'bg-rose-400',
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-sm uppercase tracking-widest',
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
