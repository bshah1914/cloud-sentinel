import { motion } from 'framer-motion';
import { Shield, Cloud, Lock, Eye, Server, Database, Globe, Cpu } from 'lucide-react';

const ORBITALS = [
  { icon: Cloud, label: 'AWS', color: '#FF9900', radius: 140, duration: 30, delay: 0 },
  { icon: Cloud, label: 'Azure', color: '#0078D4', radius: 140, duration: 30, delay: -10 },
  { icon: Cloud, label: 'GCP', color: '#4285F4', radius: 140, duration: 30, delay: -20 },
  { icon: Lock, label: 'Encryption', color: '#10b981', radius: 220, duration: 45, delay: 0 },
  { icon: Eye, label: 'Monitoring', color: '#06b6d4', radius: 220, duration: 45, delay: -15 },
  { icon: Server, label: 'IAM', color: '#8b5cf6', radius: 220, duration: 45, delay: -30 },
  { icon: Database, label: 'Compliance', color: '#ec4899', radius: 220, duration: 45, delay: -8 },
];

export default function ShieldConstellation() {
  return (
    <div className="relative w-full max-w-[600px] aspect-square mx-auto">
      {/* Outer rings */}
      <motion.div
        className="absolute inset-[15%] rounded-full border border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-light shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
      </motion.div>

      <motion.div
        className="absolute inset-[5%] rounded-full border border-accent/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-light shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
      </motion.div>

      {/* Pulse rings emanating from center */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute inset-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/30"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: [0, 3], opacity: [0.6, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: 'easeOut' }}
        />
      ))}

      {/* Orbiting icons */}
      {ORBITALS.map((item, i) => {
        const Icon = item.icon;
        const sizePct = (item.radius / 300) * 100;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: item.duration, repeat: Infinity, ease: 'linear', delay: item.delay }}
          >
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${sizePct}%`, top: 0 }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: item.duration, repeat: Infinity, ease: 'linear', delay: item.delay }}
                className="w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center border"
                style={{
                  background: `${item.color}15`,
                  borderColor: `${item.color}40`,
                  boxShadow: `0 0 20px ${item.color}30`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {/* Center Shield */}
      <motion.div
        className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center"
        style={{
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.5), 0 0 100px rgba(99, 102, 241, 0.3)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 60px rgba(99, 102, 241, 0.5), 0 0 100px rgba(99, 102, 241, 0.3)',
            '0 0 80px rgba(99, 102, 241, 0.7), 0 0 140px rgba(99, 102, 241, 0.4)',
            '0 0 60px rgba(99, 102, 241, 0.5), 0 0 100px rgba(99, 102, 241, 0.3)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Shield className="w-16 h-16 text-white drop-shadow-2xl" strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
