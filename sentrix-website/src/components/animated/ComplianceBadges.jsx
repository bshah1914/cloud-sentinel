import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const BADGES = [
  { name: 'SOC 2', sub: 'Type II', color: '#6366f1' },
  { name: 'ISO 27001', sub: 'Certified', color: '#10b981' },
  { name: 'HIPAA', sub: 'Compliant', color: '#06b6d4' },
  { name: 'PCI-DSS', sub: 'Level 1', color: '#f59e0b' },
  { name: 'GDPR', sub: 'Ready', color: '#ec4899' },
  { name: 'NIST', sub: '800-53', color: '#8b5cf6' },
  { name: 'CIS', sub: 'Benchmark', color: '#14b8a6' },
  { name: 'FedRAMP', sub: 'Moderate', color: '#ef4444' },
];

export default function ComplianceBadges() {
  // Duplicate for seamless infinite scroll
  const items = [...BADGES, ...BADGES];

  return (
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
      <motion.div
        className="flex gap-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((badge, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-card border border-border hover:border-primary/30 transition-all"
            style={{ minWidth: 180 }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${badge.color}15` }}
            >
              <Award className="w-5 h-5" style={{ color: badge.color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">{badge.name}</p>
              <p className="text-[10px] text-text-muted">{badge.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
