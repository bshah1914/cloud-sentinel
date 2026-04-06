import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, Type, Save, CheckCircle2, Image } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [branding, setBranding] = useState({
    product_name: '',
    primary_color: '#7c3aed',
    logo: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('cm_token');
    fetch('/api/org/branding', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setBranding({
          product_name: data.product_name || '',
          primary_color: data.primary_color || '#7c3aed',
          logo: data.logo || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('cm_token');
    await fetch('/api/org/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        branding_product_name: branding.product_name,
        branding_logo: branding.logo,
        branding_colors: { primary: branding.primary_color },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Loader text="Loading branding settings..." />;

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
            <Palette className="w-4.5 h-4.5 text-primary-light" />
          </div>
          White-Label Branding
        </h1>
        <p className="text-text-muted text-sm mt-1.5">Customize the platform appearance for your organization</p>
      </motion.div>

      <Card delay={0.05} hover={false}>
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              <Type className="w-3.5 h-3.5" /> Product Name
            </label>
            <input
              type="text"
              value={branding.product_name}
              onChange={(e) => setBranding({ ...branding, product_name: e.target.value })}
              placeholder="CloudSentrix"
              className="w-full bg-surface/60 border border-border/50 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40"
            />
            <p className="text-[10px] text-text-muted mt-1.5">Replaces "CloudSentrix" across the entire platform</p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              <Image className="w-3.5 h-3.5" /> Logo URL
            </label>
            <input
              type="url"
              value={branding.logo}
              onChange={(e) => setBranding({ ...branding, logo: e.target.value })}
              placeholder="https://your-domain.com/logo.png"
              className="w-full bg-surface/60 border border-border/50 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40"
            />
            <p className="text-[10px] text-text-muted mt-1.5">URL to your company logo (PNG/SVG, recommended 200x50px)</p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              <Palette className="w-3.5 h-3.5" /> Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer border border-border/30"
              />
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="w-32 bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text font-mono focus:outline-none focus:border-primary/40"
              />
              {/* Preview */}
              <div className="flex gap-2 ml-4">
                <div className="px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: branding.primary_color }}>
                  Button Preview
                </div>
                <div className="px-4 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: branding.primary_color, color: branding.primary_color }}>
                  Outline Preview
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end pt-4 border-t border-border/30">
            {saved && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                className="text-xs text-emerald-400 flex items-center gap-1 mr-4">
                <CheckCircle2 className="w-3.5 h-3.5" /> Branding saved successfully
              </motion.span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl text-xs font-medium transition-all shadow-sm shadow-primary/15 flex items-center gap-2 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
