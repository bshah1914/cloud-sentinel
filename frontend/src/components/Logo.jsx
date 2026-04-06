import { motion } from 'framer-motion';
import useOrgBranding from '../hooks/useOrgBranding';

/**
 * CloudSentrix Logo — Clean Corporate Design
 * Shield + Cloud mark with professional typography.
 */
export default function Logo({ size = 'md', showText = true, showTagline = false, animate = true, collapsed = false }) {
  const { logo, productName } = useOrgBranding();
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
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  } : {};

  return (
    <Wrapper {...wrapperProps} className={`flex items-center ${s.gap} select-none`}>
      {/* Logo Icon — Clean Shield + Cloud */}
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        <svg viewBox="0 0 100 100" width={iconSize} height={iconSize}>
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Shield body */}
          <path d="M50 6 L90 24 L90 54 C90 76 72 90 50 97 C28 90 10 76 10 54 L10 24 Z"
            fill="url(#shieldGrad)" />

          {/* Shield inner border */}
          <path d="M50 12 L84 27 L84 54 C84 72 69 84 50 90 C31 84 16 72 16 54 L16 27 Z"
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Cloud icon inside shield */}
          <path d="M38 58 C32 58 28 54 28 49 C28 44 32 40 37 40 C38 34 43 30 50 30 C57 30 62 34 64 39 C64 39 64 39 65 39 C70 39 74 43 74 48 C74 53 70 58 65 58 Z"
            fill="url(#cloudGrad)" />

          {/* Checkmark inside cloud */}
          <path d="M42 48 L48 54 L58 42" fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Text */}
      {showText && !collapsed && (
        <div className="flex flex-col">
          {productName && productName !== 'CloudSentrix' ? (
            <span className={`${s.text} font-bold tracking-tight leading-tight text-text`}>
              {productName}
            </span>
          ) : (
            <span className={`${s.text} font-bold tracking-tight leading-tight text-text`}>
              Cloud<span className="text-blue-500">Sentrix</span>
            </span>
          )}
          {showTagline && (
            <span className={`${s.tag} text-text-muted/60 uppercase tracking-[2px] mt-0.5 font-medium`}>
              Secure Your Cloud
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}


/**
 * Standalone logo mark (icon only)
 */
export function LogoMark({ size = 40 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="lm1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M50 6 L90 24 L90 54 C90 76 72 90 50 97 C28 90 10 76 10 54 L10 24 Z" fill="url(#lm1)" />
      <path d="M38 58 C32 58 28 54 28 49 C28 44 32 40 37 40 C38 34 43 30 50 30 C57 30 62 34 64 39 C64 39 64 39 65 39 C70 39 74 43 74 48 C74 53 70 58 65 58 Z"
        fill="rgba(255,255,255,0.9)" />
      <path d="M42 48 L48 54 L58 42" fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
