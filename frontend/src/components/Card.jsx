import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function Card({ children, className, glow, delay = 0, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -1 } : undefined}
      className={clsx(
        'rounded-2xl bg-surface-light/80 border border-border/50 p-6',
        'hover:border-primary/15 transition-all duration-300',
        'backdrop-blur-sm',
        glow && `glow-${glow}`,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
