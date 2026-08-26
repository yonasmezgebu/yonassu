import { useNavigate } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import {
  Shield, Zap, Globe, Handshake, Crosshair, Brain, Leaf,
  Lightbulb, Award, Users, ArrowRight,
} from 'lucide-react';
import './LandingRedesign.css';
import './AboutPage.css';
import about1 from '../../assets/about1.jpg';
import about2 from '../../assets/about2.jpg';
import about3 from '../../assets/about3.jpg';
import about4 from '../../assets/about4.jpg';

/* ─── Static Data ─── */
const whyData = [
  { icon: Shield,    title: 'Security First',        desc: 'Bank-grade encryption, granular role-based access control, and immutable audit trails protect every action within your system.' },
  { icon: Zap,       title: 'Speed & Reliability',   desc: 'Sub-100 ms API responses backed by a resilient MySQL and Node.js infrastructure, engineered for peak load at any scale.' },
  { icon: Globe,     title: 'Local Expertise',       desc: 'Built specifically for Ethiopian tax regulations, ETB currency, and the realities of a fast-growing African economy.' },
  { icon: Handshake, title: 'Long-Term Partnership', desc: 'We are not just a vendor — every subscription includes dedicated onboarding, training, and a direct line to our product team.' },
];

const dnaData = [
  { icon: Crosshair, title: 'Customer Obsession',  desc: 'Every feature starts with a real problem faced by a real Ethiopian business.' },
  { icon: Brain,     title: 'Continuous Learning', desc: 'Global best practices, applied with deep local insight and cultural understanding.' },
  { icon: Leaf,      title: 'Sustainable Growth',  desc: 'No shortcuts, no technical debt — every line of code is built to serve you for years.' },
  { icon: Lightbulb, title: 'Bold Innovation',     desc: 'From AI forecasting to pan-African expansion, we dream big and execute carefully.' },
  { icon: Award,     title: 'Excellence in Craft', desc: 'From pixel-perfect UI to rock-solid infrastructure, we take pride in every detail.' },
  { icon: Users,     title: 'Community Impact',    desc: 'Empowering businesses to grow — contributing to jobs, prosperity, and progress.' },
];

const timelineData = [
  { year: '2020',    title: 'Foundation',                    desc: 'SUTANA was born to give Ethiopian businesses the unified platform the market desperately needed — one that understood the local context from day one.' },
  { year: '2022',    title: 'Core Modules Launched',         desc: 'Finance, Sales, Inventory, and Printing modules go live. Early adopters rapidly improved their operational efficiency overnight.' },
  { year: '2026',    title: 'Multi-Department Intelligence', desc: 'Cross-department analytics, CEO dashboards, procurement lifecycle management, and a customer portal roll out enterprise-wide.' },
  { year: '2027 →',  title: 'AI-Powered Insights',          desc: 'ML forecasting, automated procurement suggestions, smart inventory optimization, and predictive financial alerts on the roadmap.' },
  { year: '2028 →',  title: 'Pan-African Expansion',        desc: 'Multi-currency, multi-language support for East African markets with an open API ecosystem for third-party integrations.' },
];

const leaders = [
  { img: about1, name: 'Daniel Bekele', role: 'Chief Technology Officer', quote: 'Every line of code is a commitment to the businesses that trust us.' },
  { img: about2, name: 'Amir Haile',    role: 'Chief Executive Officer',  quote: 'We believe great software should be locally understood and built to last.' },
  { img: about3, name: 'Sara Alemu',    role: 'Chief Operating Officer',  quote: "Operational excellence is the engine that powers every client's growth." },
  { img: about4, name: 'Meron Tadesse', role: 'Head of Product Design',   quote: 'Design is not decoration — it is the language our clients use daily.' },
];

/* ─── Page ─── */
function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <PublicNav />

      {/* ── 1. Hero ── */}
      <section className="about-hero-section">
        <div className="about-container">

          <div className="about-badge">
            <Shield size={13} /> About SUTANA
          </div>

          <h1 className="about-hero-title">
            Building the Future of{' '}
            <span className="about-accent">Ethiopian Enterprise</span>
          </h1>

          <p className="about-sub">
            We are on a mission to give every growing Ethiopian business the technology tools
            previously available only to large corporations — locally understood, and built to last.
          </p>

          {/* CTA buttons */}
          <div className="about-hero-actions">
            <button
              type="button"
              className="about-btn-primary"
              onClick={() => navigate('/chat')}
            >
              Talk to Our Team <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="about-btn-secondary"
              onClick={() => navigate('/services')}
            >
              Explore Services
            </button>
          </div>

          {/* Overlapping team photo strip */}
          <div className="about-photo-strip">
            <div className="about-photo-stack">
              {[about1, about2, about3, about4].map((img, i) => (
                <div key={i} className="about-photo-avatar">
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
            <span className="about-photo-label">Meet our founding team →</span>
          </div>

        </div>
      </section>

      {/* ── 2. Mission ── */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-mission-inner">
            <div className="about-badge">Our Mission</div>
            <h2 className="about-heading">
              Simplifying Operations,{' '}
              <span className="about-accent">Empowering Growth</span>
            </h2>
            <p>
              SUTANA was built from the ground up for the realities of Ethiopian business:
              manual record-keeping, fragmented tools, and the challenge of scaling without
              the right infrastructure.
            </p>
            <p>
              Our platform unifies printing production, financial accounting, sales, procurement,
              and inventory into a single intuitive system — giving leadership real-time visibility
              into every corner of their business.
            </p>
            <p>
              We measure our success by the success of our clients. When a CEO says he finally
              feels in control of his business — that is exactly why we built SUTANA.
            </p>
            <button
              type="button"
              className="about-btn-primary"
              onClick={() => navigate('/chat')}
            >
              Get in Touch <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. Meet Our Leaders ── */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">
              Meet the <span className="about-accent">Leaders</span>
            </h2>
            <p className="about-sub">
              A passionate founding team with expertise spanning enterprise software, finance,
              design, and operations — united by one mission: to transform how Ethiopian
              businesses work.
            </p>
          </div>

          <div className="about-leaders-grid">
            {leaders.map((leader, i) => (
              <div key={i} className="about-leader-card">
                <div className="about-leader-img-wrap">
                  <img src={leader.img} alt={leader.name} />
                  <div className="about-leader-overlay">
                    <p className="about-leader-quote">&ldquo;{leader.quote}&rdquo;</p>
                  </div>
                </div>
                <div className="about-leader-info">
                  <div className="about-leader-name">{leader.name}</div>
                  <div className="about-leader-role">{leader.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Why SUTANA ── */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">
              Why <span className="about-accent">SUTANA</span>
            </h2>
            <p className="about-sub">
              Four reasons Ethiopian enterprises trust us with their operations.
            </p>
          </div>

          <div className="about-card-grid">
            {whyData.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="about-card">
                  <div className="about-icon-box">
                    <Icon size={22} />
                  </div>
                  <div className="about-card-title">{w.title}</div>
                  <p className="about-card-desc">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Roadmap / Timeline ── */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">
              Where We Are <span className="about-accent">Headed</span>
            </h2>
            <p className="about-sub">
              From our founding vision to a pan-African enterprise platform — milestone by milestone.
            </p>
          </div>

          <div className="about-timeline">
            {timelineData.map((t, i) => (
              <div key={i} className="about-timeline-item">
                <div className="about-timeline-line" />
                <div className="about-timeline-dot" />
                <div className="about-timeline-year">{t.year}</div>
                <h3 className="about-timeline-title">{t.title}</h3>
                <p className="about-timeline-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Our DNA ── */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">
              Our <span className="about-accent">DNA</span>
            </h2>
            <p className="about-sub">The principles that guide everything we do.</p>
          </div>

          <div className="about-dna-grid">
            {dnaData.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="about-card">
                  <div className="about-dna-icon">
                    <Icon size={18} />
                  </div>
                  <div className="about-card-title">{d.title}</div>
                  <p className="about-card-desc">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="about-cta-section">
        <div className="about-container">
          <div className="about-cta-inner">
            <h2 className="about-heading">Join Us on This Journey</h2>
            <p className="about-sub">
              Whether you are a small business taking your first step towards digitization,
              or a mid-size enterprise ready to unify your operations — SUTANA is built for you.
            </p>
            <div className="about-cta-actions">
              <button
                type="button"
                className="about-btn-primary"
                onClick={() => navigate('/login')}
              >
                Get Started <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="about-btn-secondary"
                onClick={() => navigate('/chat')}
              >
                Talk to Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default AboutPage;
