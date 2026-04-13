import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, User, Tag } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const POSTS = [
  {
    title: 'Why Multi-Cloud Security Requires a Unified Approach',
    excerpt: 'Managing security across AWS, Azure, and GCP with separate tools creates blind spots. Learn why unified visibility is critical for modern cloud infrastructure.',
    category: 'Cloud Security',
    author: 'CloudTrio Team',
    date: 'Apr 5, 2026',
    readTime: '8 min read',
    color: '#6366f1',
    featured: true,
  },
  {
    title: 'Top 10 AWS Misconfigurations That Put Your Data at Risk',
    excerpt: 'From open S3 buckets to overly permissive IAM roles, these are the most common AWS security mistakes we see across thousands of scans.',
    category: 'AWS Security',
    author: 'Security Research',
    date: 'Mar 28, 2026',
    readTime: '6 min read',
    color: '#FF9900',
    featured: false,
  },
  {
    title: 'How AI Is Transforming Cloud Security Operations',
    excerpt: 'Anomaly detection, predictive forecasting, and automated root cause analysis — how machine learning is changing the way we secure cloud infrastructure.',
    category: 'AI & ML',
    author: 'CloudTrio Team',
    date: 'Mar 20, 2026',
    readTime: '10 min read',
    color: '#ec4899',
    featured: false,
  },
  {
    title: 'HIPAA Compliance in the Cloud: A Complete Guide',
    excerpt: 'Everything you need to know about meeting HIPAA requirements in AWS, Azure, and GCP. Includes a checklist and common pitfalls to avoid.',
    category: 'Compliance',
    author: 'CloudTrio Team',
    date: 'Mar 12, 2026',
    readTime: '12 min read',
    color: '#10b981',
    featured: false,
  },
  {
    title: 'Implementing Zero Trust in Multi-Cloud Environments',
    excerpt: 'Zero trust is more than a buzzword. Here is a practical guide to implementing least-privilege access and continuous verification across cloud providers.',
    category: 'Cloud Security',
    author: 'Security Research',
    date: 'Mar 5, 2026',
    readTime: '9 min read',
    color: '#6366f1',
    featured: false,
  },
  {
    title: 'App Monitoring vs APM: What Cloud Teams Actually Need',
    excerpt: 'Infrastructure monitoring, log aggregation, distributed tracing — do you need a full APM suite or is focused monitoring enough? We break it down.',
    category: 'Monitoring',
    author: 'CloudTrio Team',
    date: 'Feb 28, 2026',
    readTime: '7 min read',
    color: '#8b5cf6',
    featured: false,
  },
];

export default function Blog() {
  const featured = POSTS.find(p => p.featured);
  const rest = POSTS.filter(p => !p.featured);

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <motion.div {...fadeUp}>
          <h1 className="text-4xl md:text-6xl font-black text-text mb-6">
            Cloud Security{' '}
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Insights, guides, and best practices for cloud security, compliance, and infrastructure monitoring.
          </p>
        </motion.div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-6 pb-16">
          <motion.div {...fadeUp} className="max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${featured.color}15`, color: featured.color }}>{featured.category}</span>
                <span className="text-xs text-text-muted">Featured</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text mb-3">{featured.title}</h2>
              <p className="text-text-muted leading-relaxed mb-6 max-w-3xl">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {featured.author}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {featured.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.readTime}</span>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Post Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, i) => (
              <motion.article
                key={post.title}
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-surface-card border border-border hover:border-primary/20 transition-all cursor-pointer group overflow-hidden"
              >
                <div className="h-2 w-full" style={{ background: post.color }} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${post.color}15`, color: post.color }}>{post.category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-text mb-2 group-hover:text-primary-light transition-colors leading-snug">{post.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-primary-light opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
