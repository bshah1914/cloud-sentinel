import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { useTheme } from '../theme';

const CATEGORY_ICONS = { dark: Moon, light: Sun };

function ThemeSwatch({ theme, isActive, onSelect, onHover, onLeave }) {
  const { preview } = theme;
  const Icon = CATEGORY_ICONS[theme.category] || Monitor;

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(theme.id)}
      onMouseEnter={() => onHover(theme.id)}
      onMouseLeave={onLeave}
      className={`relative rounded-2xl p-4 text-left transition-all border-2 ${
        isActive
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border/30 hover:border-border/60'
      }`}
      style={{ background: preview.bg }}
    >
      {/* Active check */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: preview.primary }}
        >
          <Check className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}

      {/* Mini dashboard preview */}
      <div className="space-y-2.5 mb-3">
        {/* Header bar */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md" style={{ background: preview.primary }} />
          <div className="h-1.5 rounded-full flex-1" style={{ background: preview.accent, opacity: 0.4 }} />
        </div>
        {/* Stat cards */}
        <div className="flex gap-1.5">
          {[preview.primary, preview.accent, preview.primary + '80'].map((c, i) => (
            <div key={i} className="h-6 rounded-lg flex-1" style={{ background: c, opacity: 0.25 }} />
          ))}
        </div>
        {/* Chart area */}
        <div className="h-8 rounded-lg" style={{ background: preview.accent, opacity: 0.12 }}>
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <polyline
              points="0,25 15,18 30,22 50,10 70,15 85,8 100,12"
              fill="none"
              stroke={preview.accent}
              strokeWidth="2"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: theme.category === 'light' ? '#1a1a1a' : '#f8fafc' }}>
            {theme.name}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: theme.category === 'light' ? '#6b7280' : '#94a3b8' }}>
            {theme.description}
          </p>
        </div>
        <Icon className="w-3.5 h-3.5" style={{ color: preview.primary }} />
      </div>

      {/* Color dots */}
      <div className="flex gap-1 mt-2">
        <span className="w-3 h-3 rounded-full border border-white/10" style={{ background: preview.primary }} />
        <span className="w-3 h-3 rounded-full border border-white/10" style={{ background: preview.accent }} />
        <span className="w-3 h-3 rounded-full border border-white/10" style={{ background: preview.bg }} />
      </div>
    </motion.button>
  );
}

function CustomColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg cursor-pointer border border-border/30"
      />
      <div>
        <p className="text-xs font-medium text-text">{label}</p>
        <p className="text-[10px] text-text-muted font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function ThemePreviewModal({ isOpen, onClose }) {
  const { themeId, presets, setTheme, previewTheme, revertPreview, currentTheme } = useTheme();
  const [showCustom, setShowCustom] = useState(false);
  const [customPrimary, setCustomPrimary] = useState(currentTheme.colors['--color-primary']);
  const [customAccent, setCustomAccent] = useState(currentTheme.colors['--color-accent']);
  const [customSurface, setCustomSurface] = useState(currentTheme.colors['--color-surface']);

  const handleSelect = (id) => {
    setTheme(id);
  };

  const handleHover = (id) => {
    previewTheme(id);
  };

  const handleLeave = () => {
    revertPreview();
  };

  const handleClose = () => {
    revertPreview();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-surface-light border border-border/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Palette className="w-4.5 h-4.5 text-primary-light" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">Theme Settings</h2>
                    <p className="text-xs text-text-muted">Choose a theme or customize your own</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-surface-lighter/50 transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                {/* Theme Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {presets.map((theme) => (
                    <ThemeSwatch
                      key={theme.id}
                      theme={theme}
                      isActive={themeId === theme.id}
                      onSelect={handleSelect}
                      onHover={handleHover}
                      onLeave={handleLeave}
                    />
                  ))}
                </div>

                {/* Custom Colors Section */}
                <div className="mt-6 pt-5 border-t border-border/30">
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center gap-2 text-sm font-medium text-text hover:text-primary-light transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Custom Brand Colors
                    <motion.span animate={{ rotate: showCustom ? 180 : 0 }} className="text-text-muted">
                      ▾
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {showCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <CustomColorPicker
                            label="Primary Color"
                            value={customPrimary}
                            onChange={setCustomPrimary}
                          />
                          <CustomColorPicker
                            label="Accent Color"
                            value={customAccent}
                            onChange={setCustomAccent}
                          />
                          <CustomColorPicker
                            label="Background"
                            value={customSurface}
                            onChange={setCustomSurface}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted mt-3">
                          Custom colors override the selected theme. These are saved per-organization for white-labeling.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
