import { motion } from 'framer-motion';

export default function SecurityScore({ score, size = 'default' }) {
  const isSmall = size === 'small';
  const radius = isSmall ? 50 : 80;
  const svgSize = isSmall ? 130 : 200;
  const viewBox = isSmall ? '0 0 130 130' : '0 0 200 200';
  const center = isSmall ? 65 : 100;
  const strokeWidth = isSmall ? 8 : 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Fair' : 'Critical';
  const bgRing = score >= 80 ? 'rgba(16, 185, 129, 0.08)' : score >= 50 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        {/* Glow behind */}
        <div
          className="absolute inset-4 rounded-full blur-xl opacity-30"
          style={{ background: color }}
        />
        <svg className="transform -rotate-90 relative z-10" width={svgSize} height={svgSize} viewBox={viewBox}>
          {/* Background ring */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke={bgRing} strokeWidth={strokeWidth + 4} />
          {/* Track */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
          {/* Progress */}
          <motion.circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-bold tabular-nums`}
            style={{ color }}
          >
            {score}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className={`text-text-muted ${isSmall ? 'text-[10px]' : 'text-xs'} mt-0.5 font-medium`}
          >
            {label}
          </motion.span>
        </div>
      </div>
      <p className={`text-text-muted ${isSmall ? 'text-[10px]' : 'text-xs'} mt-2 font-medium uppercase tracking-wider`}>Security Score</p>
    </motion.div>
  );
}
