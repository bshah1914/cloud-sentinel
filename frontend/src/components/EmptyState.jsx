import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-surface-lighter/50 border border-border/50 flex items-center justify-center mb-5"
      >
        <Icon className="w-7 h-7 text-text-muted/60" />
      </motion.div>
      <h3 className="text-base font-semibold mb-2 text-text">{title}</h3>
      {description && <p className="text-text-muted text-sm max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
