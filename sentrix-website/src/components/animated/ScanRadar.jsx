import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Server } from 'lucide-react';

const FINDINGS = [
  { x: 35, y: 25, severity: 'critical', label: 'Open S3 Bucket' },
  { x: 70, y: 40, severity: 'warning', label: 'Weak IAM Policy' },
  { x: 55, y: 70, severity: 'critical', label: 'Public RDS' },
  { x: 25, y: 60, severity: 'info', label: 'Unencrypted Volume' },
  { x: 80, y: 75, severity: 'warning', label: 'No MFA Enforcement' },
  { x: 45, y: 45, severity: 'info', label: 'Stale Access Key' },
];

const SEV_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export default function ScanRadar() {
  const [discovered, setDiscovered] = useState([]);
  const [angle, setAngle] = useState(0);

  // Sweep angle continuously
  useEffect(() => {
    let raf;
    let start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      setAngle((elapsed * 90) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Reveal findings as the radar passes them
  useEffect(() => {
    const iv = setInterval(() => {
      setDiscovered(prev => {
        if (prev.length >= FINDINGS.length) return [];
        return [...prev, FINDINGS[prev.length]];
      });
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* Radar grid background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 overflow-hidden">
        {/* Concentric rings */}
        {[25, 50, 75].map(r => (
          <div
            key={r}
            className="absolute border border-emerald-500/15 rounded-full"
            style={{ inset: `${r / 2}%` }}
          />
        ))}
        {/* Cross hairs */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/15" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500/15" />

        {/* Sweep beam */}
        <div
          className="absolute top-1/2 left-1/2 origin-left w-1/2 h-1/2"
          style={{
            transform: `rotate(${angle}deg)`,
            background: 'linear-gradient(90deg, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0) 100%)',
            clipPath: 'polygon(0 50%, 100% 30%, 100% 50%)',
          }}
        />
        {/* Sweep line */}
        <div
          className="absolute top-1/2 left-1/2 origin-left h-px w-1/2"
          style={{
            transform: `rotate(${angle}deg)`,
            background: 'linear-gradient(90deg, #10b981, transparent)',
            boxShadow: '0 0 10px #10b981',
          }}
        />

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
        </div>

        {/* Discovered findings */}
        <AnimatePresence>
          {discovered.map((f, i) => (
            <motion.div
              key={`${i}-${f.label}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: SEV_COLORS[f.severity],
                  boxShadow: `0 0 15px ${SEV_COLORS[f.severity]}`,
                }}
              >
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: SEV_COLORS[f.severity] }} />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur"
                style={{
                  background: `${SEV_COLORS[f.severity]}20`,
                  color: SEV_COLORS[f.severity],
                  border: `1px solid ${SEV_COLORS[f.severity]}40`,
                }}
              >
                {f.label}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          SCANNING — {discovered.length} findings
        </div>
      </div>
    </div>
  );
}
