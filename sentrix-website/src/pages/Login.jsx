import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cloud, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Shield, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth';

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.o})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleField />

      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', left: '10%', top: '20%' }}
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', right: '5%', bottom: '10%' }}
          animate={{ x: [0, -60, 30, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to website */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary-light transition-colors mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </Link>

        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 100 100" width="64" height="64">
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <path d="M50 6 L90 24 L90 54 C90 76 72 90 50 97 C28 90 10 76 10 54 L10 24 Z" fill="url(#shieldGrad)" />
                <path d="M38 58 C32 58 28 54 28 49 C28 44 32 40 37 40 C38 34 43 30 50 30 C57 30 62 34 64 39 C64 39 64 39 65 39 C70 39 74 43 74 48 C74 53 70 58 65 58 Z" fill="rgba(255,255,255,0.9)" />
                <path d="M42 48 L48 54 L58 42" fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-4xl font-black">
            <span className="text-text">Cloud</span><span className="text-blue-500">Sentrix</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-text-muted text-sm mt-2 tracking-wide">
            Enterprise Multi-Cloud Security Platform
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex items-center justify-center gap-3 mt-4">
            {[{ icon: Shield, text: 'Security Audit' }, { icon: Zap, text: 'Real-time Scan' }, { icon: Cloud, text: 'Multi-Cloud' }].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-light/80 border border-border text-xs text-text-muted">
                <Icon className="w-3 h-3 text-primary-light" /> {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-2xl p-8 shadow-2xl shadow-black/20 bg-surface-light/50 backdrop-blur-xl border border-border">
          <h2 className="text-lg font-semibold text-center mb-6 text-text">Welcome Back</h2>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Username</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required autoFocus
                  className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required
                  className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-12 py-3.5 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading || !username || !password}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary disabled:opacity-50 rounded-xl py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/50 text-center">
            <p className="text-xs text-text-muted">
              Default: <code className="px-1.5 py-0.5 rounded bg-surface text-primary-light font-mono text-xs">admin</code> / <code className="px-1.5 py-0.5 rounded bg-surface text-primary-light font-mono text-xs">admin123</code>
            </p>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center text-xs text-text-muted/50 mt-6">
          CloudSentrix v3.3 &mdash; by CloudTrio
        </motion.p>
      </motion.div>
    </div>
  );
}
