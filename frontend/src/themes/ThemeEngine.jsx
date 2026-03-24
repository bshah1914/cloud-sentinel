import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import THEMES, { getThemeById } from './presets';

const ThemeContext = createContext(null);

function applyThemeColors(theme) {
  const root = document.documentElement;
  // Apply all CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  // Set light/dark class for any remaining hardcoded checks
  if (theme.category === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
  root.setAttribute('data-theme', theme.id);
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('cl_theme') || 'dark');
  const [customColors, setCustomColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cl_custom_colors')) || null;
    } catch { return null; }
  });

  // Apply theme on mount and when themeId/customColors change
  useEffect(() => {
    const preset = getThemeById(themeId);
    if (customColors && themeId === 'custom') {
      applyThemeColors({ ...preset, colors: { ...preset.colors, ...customColors }, category: customColors['--color-surface']?.startsWith('#f') ? 'light' : 'dark' });
    } else {
      applyThemeColors(preset);
    }
    localStorage.setItem('cl_theme', themeId);
  }, [themeId, customColors]);

  // Save user preference to API (fire-and-forget)
  useEffect(() => {
    const token = localStorage.getItem('cm_token');
    if (!token) return;
    const base = '/api';
    fetch(`${base}/user/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ theme_id: themeId, custom_theme: customColors }),
    }).catch(() => {}); // Silent fail — localStorage is the fallback
  }, [themeId, customColors]);

  const setTheme = useCallback((id) => {
    if (id === 'custom') return; // Use setCustomThemeColors for custom
    setThemeId(id);
    setCustomColors(null);
    localStorage.removeItem('cl_custom_colors');
  }, []);

  const setCustomThemeColors = useCallback((colors) => {
    setCustomColors(colors);
    setThemeId('custom');
    localStorage.setItem('cl_custom_colors', JSON.stringify(colors));
  }, []);

  // Backward-compatible toggle (dark ↔ light)
  const toggle = useCallback(() => {
    const current = getThemeById(themeId);
    if (current.category === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, [themeId, setTheme]);

  // Preview a theme temporarily without saving
  const previewTheme = useCallback((id) => {
    const preset = getThemeById(id);
    applyThemeColors(preset);
  }, []);

  // Revert preview to current saved theme
  const revertPreview = useCallback(() => {
    const preset = getThemeById(themeId);
    if (customColors && themeId === 'custom') {
      applyThemeColors({ ...preset, colors: { ...preset.colors, ...customColors }, category: 'dark' });
    } else {
      applyThemeColors(preset);
    }
  }, [themeId, customColors]);

  const value = {
    theme: getThemeById(themeId).category, // 'dark' or 'light' — backward compat
    themeId,
    presets: THEMES,
    currentTheme: getThemeById(themeId),
    customColors,
    setTheme,
    setCustomThemeColors,
    toggle,
    previewTheme,
    revertPreview,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
