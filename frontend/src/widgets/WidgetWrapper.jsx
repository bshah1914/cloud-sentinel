import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, Maximize2 } from 'lucide-react';

export default function WidgetWrapper({ title, icon: Icon, children, onRemove, isEditing }) {
  return (
    <div className="h-full flex flex-col bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
        <div className="flex items-center gap-2">
          {isEditing && (
            <GripVertical className="w-3.5 h-3.5 text-text-muted cursor-grab active:cursor-grabbing drag-handle" />
          )}
          {Icon && <Icon className="w-3.5 h-3.5 text-primary-light" />}
          <span className="text-xs font-semibold text-text uppercase tracking-wider">{title}</span>
        </div>
        {isEditing && onRemove && (
          <button onClick={onRemove} className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
