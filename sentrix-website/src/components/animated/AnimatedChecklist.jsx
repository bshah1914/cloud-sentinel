import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

const CHECKS = [
  'Encryption at rest enabled',
  'TLS 1.3 enforced for all endpoints',
  'MFA required for all admin users',
  'Audit logs streaming to SIEM',
  'Network segmentation configured',
  'Backups verified daily',
  'Vulnerability scans automated',
  'Access reviews scheduled',
];

export default function AnimatedChecklist() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (!isInView) return;
    CHECKS.forEach((_, i) => {
      setTimeout(() => {
        setChecked(prev => [...prev, i]);
      }, 400 + i * 350);
    });
  }, [isInView]);

  return (
    <div ref={ref} className="space-y-3">
      {CHECKS.map((check, i) => {
        const isChecked = checked.includes(i);
        return (
          <motion.div
            key={check}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={isChecked ? { scale: 1 } : { scale: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="absolute"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <motion.div
              animate={{ opacity: isChecked ? 0 : 1 }}
            >
              <Circle className="w-5 h-5 text-text-muted/40" />
            </motion.div>
            <motion.span
              animate={{
                color: isChecked ? '#94a3b8' : '#94a3b8',
                opacity: isChecked ? 0.7 : 1,
              }}
              className="text-sm flex-1"
            >
              {check}
            </motion.span>
            {isChecked && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400"
              >
                PASSED
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
