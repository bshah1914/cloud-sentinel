import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search } from 'lucide-react';
import WIDGET_REGISTRY, { getCategories } from './registry';

export default function WidgetLibraryPanel({ isOpen, onClose, onAddWidget, activeWidgetIds = [] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...getCategories()];

  const filtered = WIDGET_REGISTRY.filter((w) => {
    if (activeWidgetIds.includes(w.id)) return false;
    if (activeCategory !== 'All' && w.category !== activeCategory) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-surface-light border-l border-border/30 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold text-text">Widget Library</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-lighter/50 text-text-muted"><X className="w-4 h-4" /></button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search widgets..." className="w-full bg-surface/50 border border-border/40 rounded-xl pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40" />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-1.5 px-4 pb-3 flex-wrap">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${activeCategory === cat ? 'bg-primary/15 text-primary-light border border-primary/20' : 'bg-surface/30 text-text-muted border border-border/20 hover:border-border/40'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Widget List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filtered.map((widget) => {
                const Icon = widget.icon;
                return (
                  <motion.button key={widget.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { onAddWidget(widget); onClose(); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface/40 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text">{widget.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{widget.description}</p>
                    </div>
                    <Plus className="w-4 h-4 text-text-muted flex-shrink-0" />
                  </motion.button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-text-muted text-center py-8">No widgets available</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
