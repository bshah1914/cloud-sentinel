import { motion } from 'framer-motion';

/**
 * CloudSentinel Logo — Animated SVG
 * Shield + Cloud + Eye (sentinel) with "Secure Your Cloud" tagline
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   showText: boolean (default: true)
 *   showTagline: boolean (default: false)
 *   animate: boolean (default: true)
 *   collapsed: boolean (default: false) — for sidebar
 */
export default function Logo({ size = 'md', showText = true, showTagline = false, animate = true, collapsed = false }) {
  const sizes = {
    sm: { icon: 28, text: 'text-sm', tag: 'text-[8px]', gap: 'gap-2' },
    md: { icon: 36, text: 'text-base', tag: 'text-[9px]', gap: 'gap-2.5' },
    lg: { icon: 48, text: 'text-xl', tag: 'text-[10px]', gap: 'gap-3' },
    xl: { icon: 64, text: 'text-3xl', tag: 'text-xs', gap: 'gap-4' },
    '2xl': { icon: 80, text: 'text-4xl', tag: 'text-sm', gap: 'gap-5' },
  };
  const s = sizes[size] || sizes.md;
  const iconSize = s.icon;

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  } : {};

  return (
    <Wrapper {...wrapperProps} className={`flex items-center ${s.gap} select-none`}>
      {/* Logo Icon */}
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        <svg viewBox="0 0 100 100" width={iconSize} height={iconSize} className="drop-shadow-lg">
          <defs>
            {/* Main gradient - violet to indigo */}
            <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            {/* Accent gradient - cyan */}
            <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            {/* Inner glow */}
            <radialGradient id="logoGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
            {/* Shield shadow */}
            <filter id="logoShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.3" />
            </filter>
            {/* Eye glow */}
            <filter id="eyeGlow">
              <feGaussianBlur stdDeviation="2" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring - rotating sentinel radar */}
          {animate && (
            <g opacity="0.15">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="8 4">
                <animateTransform attributeName="transform" type="rotate" dur="20s" repeatCount="indefinite" from="0 50 50" to="360 50 50" />
              </circle>
            </g>
          )}

          {/* Shield body */}
          <path d="M50 8 L88 25 L88 52 C88 72 72 88 50 95 C28 88 12 72 12 52 L12 25 Z"
            fill="url(#logoGrad1)" filter="url(#logoShadow)" />

          {/* Shield inner highlight */}
          <path d="M50 14 L82 28 L82 52 C82 68 68 82 50 88 C32 82 18 68 18 52 L18 28 Z"
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

          {/* Inner glow */}
          <ellipse cx="50" cy="42" rx="25" ry="20" fill="url(#logoGlow)" />

          {/* Cloud shape inside shield */}
          <path d="M35 52 C35 46 40 42 46 42 C47 38 51 35 56 35 C62 35 67 39 67 45 C71 45 74 48 74 52 C74 56 71 59 67 59 L35 59 C31 59 28 56 28 52 C28 48 31 45 35 45"
            fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

          {/* Sentinel eye - center */}
          <ellipse cx="50" cy="50" rx="12" ry="8" fill="none" stroke="url(#logoGrad2)" strokeWidth="2" filter="url(#eyeGlow)" />

          {/* Eye pupil */}
          <circle cx="50" cy="50" r="4" fill="#22d3ee">
            {animate && (
              <animate attributeName="r" values="3.5;4.5;3.5" dur="3s" repeatCount="indefinite" />
            )}
          </circle>

          {/* Eye pupil inner */}
          <circle cx="50" cy="50" r="1.5" fill="#ffffff" opacity="0.8" />

          {/* Eye shine */}
          <circle cx="52" cy="48" r="1" fill="#ffffff" opacity="0.6" />

          {/* Scanning line from eye */}
          {animate && (
            <line x1="50" y1="50" x2="50" y2="25" stroke="#22d3ee" strokeWidth="0.8" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite" from="0 50 50" to="360 50 50" />
              <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" />
            </line>
          )}

          {/* Shield top accent */}
          <path d="M50 8 L88 25" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.5" />
          <path d="M50 8 L12 25" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.5" />

          {/* Corner dots - data nodes */}
          <circle cx="20" cy="30" r="2" fill="#22d3ee" opacity="0.6">
            {animate && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />}
          </circle>
          <circle cx="80" cy="30" r="2" fill="#22d3ee" opacity="0.6">
            {animate && <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />}
          </circle>
          <circle cx="50" cy="90" r="2" fill="#a78bfa" opacity="0.5">
            {animate && <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />}
          </circle>
        </svg>
      </div>

      {/* Text */}
      {showText && !collapsed && (
        <div className="flex flex-col">
          <span className={`${s.text} font-black tracking-tight leading-tight`}>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Cloud
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Sentinel
            </span>
          </span>
          {showTagline && (
            <span className={`${s.tag} text-text-muted/60 uppercase tracking-[3px] mt-0.5 font-medium`}>
              Secure Your Cloud
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}


/**
 * Standalone logo mark (icon only) for favicon/loading
 */
export function LogoMark({ size = 40, animate = true }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="lm1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="lm2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M50 8 L88 25 L88 52 C88 72 72 88 50 95 C28 88 12 72 12 52 L12 25 Z" fill="url(#lm1)" />
      <ellipse cx="50" cy="50" rx="12" ry="8" fill="none" stroke="url(#lm2)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="4" fill="#22d3ee">
        {animate && <animate attributeName="r" values="3.5;4.5;3.5" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="50" cy="50" r="1.5" fill="#fff" opacity="0.8" />
    </svg>
  );
}
