import { Link } from 'react-router-dom';
import { Shield, Mail, MapPin, Phone, Globe, Link2, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', to: '/features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Security', to: '/features' },
    { label: 'Compliance', to: '/features' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/contact' },
    { label: 'Contact', to: '/contact' },
  ],
  Resources: [
    { label: 'Documentation', to: '/features' },
    { label: 'API Reference', to: '/features' },
    { label: 'Status', to: '/contact' },
    { label: 'Support', to: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-light/50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Cloud</span>
                <span className="text-text">Sentrix</span>
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm mb-6">
              Enterprise multi-cloud security platform. Monitor, audit, and protect your cloud infrastructure from a single unified dashboard.
            </p>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@cloudtrio.in</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Ahmedabad, India</div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-text mb-4">{title}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-text-muted hover:text-primary-light transition-colors no-underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} CloudSentrix by CloudTrio. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-text-muted hover:text-primary-light transition-colors"><ExternalLink className="w-4 h-4" /></a>
            <a href="#" className="text-text-muted hover:text-primary-light transition-colors"><Link2 className="w-4 h-4" /></a>
            <a href="#" className="text-text-muted hover:text-primary-light transition-colors"><Globe className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
