import { motion } from 'framer-motion';

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Aurora blobs */}
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)' }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-0 -right-1/4 w-[700px] h-[700px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)' }}
        animate={{
          x: [0, -80, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)' }}
        animate={{
          x: [0, 60, -100, 0],
          y: [0, -80, 50, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")'
      }} />
    </div>
  );
}
