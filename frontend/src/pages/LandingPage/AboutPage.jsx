import { useNavigate } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import {
  Shield, Zap, Globe, Handshake, Crosshair, Brain, Leaf,
  Lightbulb, Award, Users, ArrowRight
} from 'lucide-react';
import './PublicLayout.css';
import about1 from '../../assets/about1.jpg';
import about2 from '../../assets/about2.jpg';
import about3 from '../../assets/about3.jpg';
import about4 from '../../assets/about4.jpg';

/* ─── Unified Design Tokens ───────────────────────────────────── */
const DARK_GREEN = '#1B5E20';
const FOREST_GREEN = '#228B22';
const EMERALD_GREEN = '#2E8B57';
const OLIVE_GREEN = '#6B8E23';
const DARK_OLIVE = '#55711C';
const EARTH_BROWN = '#8D6E63';
const LIGHT_GRAY = '#F5F5F5';
const DARK_GRAY = '#424242';

const STYLES = `
  .about-page {
    background: #FFFFFF;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* ── Layout & Typography ── */
  .about-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .about-section {
    padding: 80px 24px;
  }
  .about-hero-section {
    padding: 80px 24px 64px;
    text-align: center;
    background: ${LIGHT_GRAY};
  }
  .about-heading {
    font-size: clamp(1.8rem, 3.5vw, 2.5rem);
    font-weight: 900;
    color: ${DARK_GREEN};
    margin: 0 0 16px;
  }
  .about-hero-title {
    font-size: clamp(2.2rem, 4.5vw, 3.5rem);
    font-weight: 900;
    color: ${DARK_GREEN};
    max-width: 800px;
    margin: 0 auto 24px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .about-sub {
    font-size: 1.05rem;
    line-height: 1.7;
    color: ${DARK_GRAY};
    max-width: 720px;
    margin: 0 auto 40px;
    text-align: center;
  }
  .about-section-header {
    text-align: center;
    margin-bottom: 56px;
  }
  .about-section-header h2 {
    display: inline-block;
    padding-bottom: 8px;
    border-bottom: 2px solid #A5D6A7;
  }

  /* ── Grids ── */
  .about-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }
  .about-dna-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }
  .about-leaders {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
  }
  
  /* Buttons */
  .about-btn-primary {
    background: ${EMERALD_GREEN};
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .about-btn-primary:hover {
    background: ${DARK_GREEN};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,94,32,0.3);
  }
  
  .about-btn-secondary {
    background: ${OLIVE_GREEN};
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .about-btn-secondary:hover {
    background: ${DARK_OLIVE};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 142, 35, 0.3);
  }

  /* Cards */
  .about-card {
    background: #FFFFFF;
    border: 1px solid ${EARTH_BROWN};
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .about-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .about-card-title {
    font-weight: 800;
    font-size: 1.1rem;
    color: ${DARK_GREEN};
    margin-bottom: 10px;
  }
  .about-card-desc {
    font-size: 0.9rem;
    line-height: 1.6;
    color: ${DARK_GRAY};
    margin: 0;
  }
  .about-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    flex-shrink: 0;
    background: #A5D6A7;
    color: ${DARK_GREEN};
  }


  .about-leader-item {
    background: #FFFFFF;
    border: 1px solid ${EARTH_BROWN};
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .about-leader-item:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .about-leader-img-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    position: relative;
    border-bottom: 1px solid ${EARTH_BROWN};
  }
  .about-leader-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transition: transform 0.15s ease;
  }
  .about-leader-item:hover .about-leader-img-wrap img {
    transform: scale(1.03);
  }
  .about-leader-overlay {
    position: absolute;
    inset: 0;
    background: rgba(27,94,32,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .about-leader-item:hover .about-leader-overlay {
    opacity: 1;
  }
  .about-leader-quote {
    color: #fff;
    font-size: 0.9rem;
    font-style: italic;
    line-height: 1.6;
    text-align: center;
    margin: 0;
  }
  .about-leader-info {
    padding: 20px;
    text-align: center;
  }
  .about-leader-name {
    font-size: 1.1rem;
    font-weight: 800;
    color: ${DARK_GREEN};
    margin-bottom: 4px;
  }
  .about-leader-role {
    font-size: 0.85rem;
    color: ${DARK_GRAY};
    font-weight: 600;
  }
  
  /* Timeline */
  .timeline-container {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
  }
  .timeline-item {
    position: relative;
    padding-left: 56px;
    padding-bottom: 40px;
  }
  .timeline-item:last-child {
    padding-bottom: 0;
  }
  .timeline-line {
    position: absolute;
    left: 19px;
    top: 32px;
    bottom: 0;
    width: 1px;
    background: ${EARTH_BROWN};
  }
  .timeline-item:last-child .timeline-line {
    display: none;
  }
  .timeline-dot {
    position: absolute;
    left: 12px;
    top: 6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${DARK_GREEN};
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px ${EARTH_BROWN};
  }
  .timeline-year {
    font-size: 0.85rem;
    font-weight: 800;
    color: ${FOREST_GREEN};
    margin-bottom: 4px;
  }
  .timeline-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: ${DARK_GREEN};
    margin: 0 0 8px;
  }
  .timeline-desc {
    font-size: 0.95rem;
    color: ${DARK_GRAY};
    line-height: 1.6;
    margin: 0;
  }

  /* ── Mobile Responsiveness ── */
  @media (max-width: 768px) {
    .about-section { padding: 56px 20px; }
    .about-hero-section { padding: 64px 20px 48px; }
    .about-section-header { margin-bottom: 40px; }
    .about-card-grid { grid-template-columns: 1fr; }
    .about-dna-grid { grid-template-columns: 1fr; }
    .about-leaders { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    
    .about-hero-title { font-size: 2.2rem; margin-bottom: 16px; }
    .about-sub { font-size: 0.95rem; margin-bottom: 32px; }
  }

  @media (max-width: 480px) {
    .about-section { padding: 48px 16px; }
    .about-hero-section { padding: 56px 16px 40px; }
    .about-leaders { grid-template-columns: 1fr; }
    
    .about-hero-photo-strip {
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-top: 48px;
    }
    .about-hero-photo-strip > div:last-child {
      margin-left: 0 !important;
      text-align: center;
    }
  }
`;

const whyData = [
  { icon: Shield,    title: 'Security First',        desc: 'Bank-grade encryption, granular role-based access control, and immutable audit trails protect every action within your system.' },
  { icon: Zap,       title: 'Speed & Reliability',   desc: 'Sub-100 ms API responses backed by a resilient MySQL and Node.js infrastructure, engineered for peak load at any scale.' },
  { icon: Globe,     title: 'Local Expertise',       desc: 'Built specifically for Ethiopian tax regulations, ETB currency, and the realities of a fast-growing African economy.' },
  { icon: Handshake, title: 'Long-Term Partnership', desc: 'We are not just a vendor — every subscription includes dedicated onboarding, training, and a direct line to our product team.' },
];

const dnaData = [
  { icon: Crosshair, title: 'Customer Obsession',   desc: 'Every feature starts with a real problem faced by a real Ethiopian business.' },
  { icon: Brain,     title: 'Continuous Learning',  desc: 'Global best practices, applied with deep local insight and cultural understanding.' },
  { icon: Leaf,      title: 'Sustainable Growth',   desc: 'No shortcuts, no technical debt — every line of code is built to serve you for years.' },
  { icon: Lightbulb, title: 'Bold Innovation',      desc: 'From AI forecasting to pan-African expansion, we dream big and execute carefully.' },
  { icon: Award,     title: 'Excellence in Craft',  desc: 'From pixel-perfect UI to rock-solid infrastructure, we take pride in every detail.' },
  { icon: Users,     title: 'Community Impact',     desc: 'Empowering businesses to grow — contributing to jobs, prosperity, and progress.' },
];

const timelineData = [
  { year: '2020', title: 'Foundation',                desc: 'SUTANA was born to give Ethiopian businesses the unified platform the market desperately needed — one that understood the local context from day one.' },
  { year: '2022', title: 'Core Modules Launched',     desc: 'Finance, Sales, Inventory, and Printing modules go live. Early adopters rapidly improved their operational efficiency overnight.' },
  { year: '2026', title: 'Multi-Department Intelligence', desc: 'Cross-department analytics, CEO dashboards, procurement lifecycle management, and a customer portal roll out enterprise-wide.' },
  { year: '2027 →', title: 'AI-Powered Insights',    desc: 'ML forecasting, automated procurement suggestions, smart inventory optimization, and predictive financial alerts on the roadmap.' },
  { year: '2028 →', title: 'Pan-African Expansion',  desc: 'Multi-currency, multi-language support for East African markets with an open API ecosystem for third-party integrations.' },
];

const leaders = [
  { img: about1, name: 'Daniel Bekele', role: 'Chief Technology Officer',    quote: 'Every line of code is a commitment to the businesses that trust us.' },
  { img: about2, name: 'Amir Haile',    role: 'Chief Executive Officer',     quote: 'We believe great software should be locally understood and built to last.' },
  { img: about3, name: 'Sara Alemu',    role: 'Chief Operating Officer',     quote: "Operational excellence is the engine that powers every client's growth." },
  { img: about4, name: 'Meron Tadesse', role: 'Head of Product Design',      quote: 'Design is not decoration — it is the language our clients use daily.' },
];

/* ─── Main Page ───────────────────────────────────────────────── */
function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="about-hero-section">
        <div className="about-container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: DARK_GREEN, padding: '6px 18px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 24, border: `1px solid ${EARTH_BROWN}` }}>
            <Shield size={14} color={FOREST_GREEN} /> About SUTANA
          </div>
          <h1 className="about-hero-title">
            Building the Future of <span style={{ color: FOREST_GREEN }}>Ethiopian Enterprise</span>
          </h1>
          <p className="about-sub">
            We are on a mission to give every growing Ethiopian business the technology tools previously
            available only to large corporations — locally understood, and built to last.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="about-btn-primary" onClick={() => navigate('/chat')}>
              Talk to Our Team <ArrowRight size={16} />
            </button>
            <button className="about-btn-secondary" onClick={() => navigate('/services')}>
              Explore Services
            </button>
          </div>

          {/* Photo strip */}
          <div className="about-hero-photo-strip" style={{ display: 'flex', justifyContent: 'center', gap: 0, marginTop: 64, position: 'relative' }}>
            <div style={{ display: 'flex' }}>
              {[about1, about2, about3, about4].map((img, i) => (
                <div key={i} style={{
                  width: 68, height: 68, borderRadius: '50%',
                  border: `2px solid ${EARTH_BROWN}`,
                  background: '#fff',
                  overflow: 'hidden',
                  marginLeft: i === 0 ? 0 : -16,
                  zIndex: 5 - i,
                  flexShrink: 0,
                }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 20, display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: DARK_GREEN }}>
              Meet our founding team →
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────── */}
      <section className="about-section" style={{ background: '#FFFFFF' }}>
        <div className="about-container" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 800, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#A5D6A7', color: DARK_GREEN, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 99, marginBottom: 20 }}>OUR MISSION</div>
            <h2 className="about-heading" style={{ textAlign: 'center' }}>Simplifying Operations, <span style={{ color: FOREST_GREEN }}>Empowering Growth</span></h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: DARK_GRAY, marginBottom: 20 }}>
              SUTANA was built from the ground up for the realities of Ethiopian business: manual record-keeping,
              fragmented tools, and the challenge of scaling without the right infrastructure.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: DARK_GRAY, marginBottom: 20 }}>
              Our platform unifies printing production, financial accounting, sales, procurement, and inventory
              into a single intuitive system — giving leadership real-time visibility into every corner of their business.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: DARK_GRAY, marginBottom: 32 }}>
              We measure our success by the success of our clients. When a CEO says he finally feels in control
              of his business — that is exactly why we built SUTANA.
            </p>
            <button className="about-btn-primary" onClick={() => navigate('/chat')}>
              Get in Touch <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Meet Our Leaders ─────────────────────────────────────── */}
      <section className="about-section" style={{ background: LIGHT_GRAY }}>
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">Meet the <span style={{ color: FOREST_GREEN }}>Leaders</span></h2>
            <p className="about-sub">
              A passionate founding team with expertise spanning enterprise software, finance, design, and
              operations — united by one mission: to transform how Ethiopian businesses work.
            </p>
          </div>

          <div className="about-leaders">
            {leaders.map((leader, i) => (
              <div key={i} className="about-leader-item">
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

      {/* ── Why SUTANA ──────────────────────────────────────────── */}
      <section className="about-section" style={{ background: '#FFFFFF' }}>
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">Why <span style={{ color: FOREST_GREEN }}>SUTANA</span></h2>
            <p className="about-sub">Four reasons Ethiopian enterprises trust us with their operations.</p>
          </div>
          <div className="about-card-grid">
            {whyData.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="about-card">
                  <div className="about-icon-box"><Icon size={22} /></div>
                  <div className="about-card-title">{w.title}</div>
                  <p className="about-card-desc">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Roadmap ─────────────────────────────────────────────── */}
      <section className="about-section" style={{ background: LIGHT_GRAY }}>
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">Where We Are <span style={{ color: FOREST_GREEN }}>Headed</span></h2>
            <p className="about-sub">From our founding vision to a pan-African enterprise platform — milestone by milestone.</p>
          </div>
          <div className="timeline-container">
            {timelineData.map((t, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-line" />
                <div className="timeline-dot" />
                <div className="timeline-year">{t.year}</div>
                <h3 className="timeline-title">{t.title}</h3>
                <p className="timeline-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our DNA ─────────────────────────────────────────────── */}
      <section className="about-section" style={{ background: '#FFFFFF' }}>
        <div className="about-container">
          <div className="about-section-header">
            <h2 className="about-heading">Our <span style={{ color: FOREST_GREEN }}>DNA</span></h2>
            <p className="about-sub">The principles that guide everything we do.</p>
          </div>
          <div className="about-dna-grid">
            {dnaData.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="about-card" style={{ padding: '24px 20px' }}>
                  <div className="about-icon-box" style={{ width: 40, height: 40, marginBottom: 16 }}><Icon size={18} /></div>
                  <div className="about-card-title" style={{ fontSize: '1.05rem' }}>{d.title}</div>
                  <p className="about-card-desc" style={{ fontSize: '0.85rem' }}>{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="about-section" style={{ background: LIGHT_GRAY, textAlign: 'center' }}>
        <div className="about-container">
          <div className="about-section-header" style={{ marginBottom: 32 }}>
            <h2 className="about-heading">Join Us on This Journey</h2>
          </div>
          <p className="about-sub" style={{ margin: '0 auto 40px' }}>
            Whether you are a small business taking your first step towards digitization, or a mid-size enterprise
            ready to unify your operations — SUTANA is built for you.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="about-btn-primary" onClick={() => navigate('/login')}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="about-btn-secondary" onClick={() => navigate('/chat')}>
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default AboutPage;
