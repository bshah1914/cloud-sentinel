import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Cloud</span>
            <span className="text-text">Sentrix</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                pathname === to
                  ? 'text-primary-light bg-primary/10'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/app/login" className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-all no-underline">
            Sign In
          </a>
          <Link to="/signup" className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all no-underline">
            Start Free Trial
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-text-muted">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-surface-light/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium no-underline ${
                    pathname === to ? 'text-primary-light bg-primary/10' : 'text-text-muted'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3">
                <a href="/app/login" className="block w-full text-center px-5 py-2.5 bg-white/5 border border-border text-text text-sm font-medium rounded-xl no-underline mb-2">
                  Sign In
                </a>
                <Link to="/signup" onClick={() => setOpen(false)} className="block w-full text-center px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold rounded-xl no-underline">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
