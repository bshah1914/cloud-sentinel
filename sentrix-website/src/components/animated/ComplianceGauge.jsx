import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ComplianceGauge({ score = 95, label = 'Compliance Score', size = 240 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const duration = 2000;
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * eased);
      if (progress >= 1) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [isInView, score]);

  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = animatedScore >= 80 ? '#10b981' : animatedScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.1)"
          strokeWidth="14"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
          {Math.round(animatedScore)}
        </span>
        <span className="text-xs text-text-muted uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
}
