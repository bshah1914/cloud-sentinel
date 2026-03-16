import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function Card({ children, className, glow, delay = 0, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -2, scale: 1.002 } : undefined}
      className={clsx(
        'rounded-2xl bg-surface-light border border-border/60 p-6',
        'hover:border-primary/20 transition-all duration-300',
        'backdrop-blur-sm shadow-md shadow-black/10',
        glow && `glow-${glow}`,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
