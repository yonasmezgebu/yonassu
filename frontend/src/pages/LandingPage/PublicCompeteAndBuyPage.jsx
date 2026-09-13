import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar, Clock, Tag, ArrowRight, Flame, Award,
  TrendingUp, Shield, ChevronDown, ChevronUp,
  Phone, FileText, Star, Gavel, Info, Lock, User,
} from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import tenderHero from '../../assets/hero-section/tender_animated_clean.png';
import './PublicLayout.css';
import './PublicCompeteAndBuyPage.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

// =========================================================================
// COUNTDOWN COMPONENT  — logic unchanged
// =========================================================================
const Countdown = ({ deadline }) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) return setRemaining('Expired');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h left` : `${h}h ${m}m left`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{remaining}</span>;
};

// =========================================================================
// TENDER CARD COMPONENT — logic unchanged, only class names changed
// =========================================================================
const TenderCard = ({ t, onClick, index }) => {
  const imgs = (() => { try { return JSON.parse(t.attachments || '[]'); } catch { return []; } })();
  const images = imgs.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const [imgIdx, setImgIdx] = useState(0);
  const isOpen = t.status === 'open';
  const imgSrc = imgIdx < images.length ? `${API_ORIGIN}/uploads/tenders/${images[imgIdx]}` : null;

  let parsedItems = [];
  try { parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []); } catch (_) {}
  const isMultiple = parsedItems.length > 0;

  const statusBadgeClass =
    t.status === 'open'      ? 'pcab-badge-open' :
    t.status === 'awarded'   ? 'pcab-badge-awarded' :
                               'pcab-badge-closed';

  return (
    <div className="pcab-card" style={{ animationDelay: `${index * 0.05}s` }}>
      {!isMultiple && imgSrc && (
        <img
          src={imgSrc}
          alt={t.title}
          loading="lazy"
          onError={() => setImgIdx(i => i + 1)}
          className="pcab-card-img"
        />
      )}

      <div className="pcab-card-body">
        {/* Badges row */}
        <div className="pcab-card-badges">
          <span className="pcab-badge-ref">{t.reference_number}</span>
          <span className={statusBadgeClass}>{t.status}</span>
          {t.category && <span className="pcab-badge">{t.category}</span>}
          {isOpen && (
            <span className="pcab-badge-countdown">
              <Flame size={10} />
              <Countdown deadline={t.deadline} />
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="pcab-card-title">{t.title}</h3>

        {/* Description */}
        {t.description && <p className="pcab-card-desc">{t.description}</p>}

        {/* Meta row */}
        <div className="pcab-card-meta">
          {isMultiple ? (
            <span className="pcab-badge">📦 {parsedItems.length} Items</span>
          ) : t.item_name ? (
            <span className="pcab-meta-item"><Tag size={12} />{t.item_name} × {t.quantity}</span>
          ) : null}
          <span className="pcab-meta-item">
            <Calendar size={12} /> {new Date(t.created_at).toLocaleDateString('en-CA')}
          </span>
          {t.deadline && (
            <span className="pcab-meta-item">
              <Clock size={12} /> {new Date(t.deadline).toLocaleDateString('en-CA')}
            </span>
          )}
          {!isMultiple && (
            <span className="pcab-meta-price">
              {parseFloat(t.starting_bid_price || 0).toLocaleString()} ETB
            </span>
          )}
        </div>

        <button className="pcab-btn-primary" onClick={onClick}>
          View Tender Details <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN PAGE COMPONENT
// =========================================================================
const PublicCompeteAndBuyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [roleWarning, setRoleWarning] = useState(false);

  const FAQS = [
    { q: 'How do I place a bid?', a: 'Log in to your SUTANA account, browse to the desired open tender, and click "Submit Bid". Enter the value you are willing to pay and confirm your offer. You can only submit one bid per tender unless stated otherwise.' },
    { q: 'Is there a minimum bid amount?', a: 'Yes. Each tender has a minimum starting price set by SUTANA. Your bid must be equal to or greater than this minimum value. The starting price is clearly displayed on each tender card.' },
    { q: "Can I see other people's bids?", a: 'No. All bids are completely confidential. No bidder can see another bidder\'s offer amount until the tender officially closes. This ensures a fair and transparent competition.' },
    { q: 'How is the winner decided?', a: 'The winner is the bidder who submits the highest value offer before the tender closing date and time. In case of tied bids, the earliest submitted bid wins.' },
    { q: 'What happens when I win?', a: 'SUTANA will notify you via email and on your dashboard. You will then have a specified window (usually 48 hours) to complete the payment and arrange delivery or pickup of the product.' },
    { q: "What if I don't win?", a: 'If you do not submit the winning bid, your account is not charged in any way. You are free to participate in future tenders without any penalty.' },
    { q: 'Can SUTANA reject a bid or cancel a tender?', a: 'Yes. SUTANA reserves the right to reject any bid or cancel/modify a tender at its sole discretion. Final sale is only confirmed after SUTANA officially awards the tender to the winning bidder.' },
  ];

  const WINNERS = [
    { product: 'Dell Latitude 5540 Laptop (x10 units)', date: 'June 2025', value: '285,000 ETB', category: 'Laptops' },
    { product: 'HP LaserJet Pro M404dn Printer (x5)', date: 'May 2025', value: '62,500 ETB', category: 'Printers' },
    { product: 'Cisco Catalyst 2960-X Switch', date: 'April 2025', value: '48,000 ETB', category: 'Networking' },
    { product: 'Samsung 27" 4K Monitors (x8)', date: 'March 2025', value: '112,000 ETB', category: 'Displays' },
    { product: 'Lenovo ThinkPad X1 Carbon (x4)', date: 'February 2025', value: '196,000 ETB', category: 'Laptops' },
    { product: 'Seagate 4TB External HDD (x20)', date: 'January 2025', value: '38,000 ETB', category: 'Storage' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/tenders/public');
        if (res.status === 'success') setTenders(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = tenders.filter(t => t.status === 'open');

  // Starting a bid on this marketplace requires signing in as a Customer
  // account — staff and other roles must sign out and sign in with a customer
  // account to participate.
  const handleOpenTender = (tenderId) => {
    const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
    if (isAuthenticated && !userRoles.includes('customer')) {
      setRoleWarning(true);
      return;
    }
    navigate(`/tenders/${tenderId}`);
  };

  return (
    <div className="pcab-root">
      <PublicNav />

      {/* ── Hero ── */}
      <div className="pcab-hero-wrap">
        <img className="pcab-hero-img" src={tenderHero} alt="Compete & Buy hero" />
        <div className="pcab-hero-overlay">
          <h1 className="pcab-hero-title">Compete &amp; Buy from SUTANA</h1>
          <p className="pcab-hero-subtitle">
            Browse open tenders, submit your best offer, and win quality products at competitive prices.
          </p>
        </div>
      </div>

      {/* ── Tender List ── */}
      {loading ? (
        <section className="pcab-tenders-section">
          <div className="pcab-container">
            <div className="pcab-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="pcab-shimmer" />)}
            </div>
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <section className="pcab-tenders-section">
          <div className="pcab-container">
            <div className="pcab-empty">
              <div className="pcab-empty-icon">🔔</div>
              <h3 className="pcab-empty-title">No Open Tenders Right Now</h3>
              <p className="pcab-empty-desc">
                New tenders are posted regularly. Check back soon or{' '}
                <a href="/sales-contact" className="pcab-empty-link">contact us</a>{' '}
                to be notified when a new one opens.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="pcab-tenders-section">
            <div className="pcab-container">
              <div className="pcab-section-header">
                <div>
                  <h2 className="pcab-section-title">Open Tenders</h2>
                  <p className="pcab-section-sub">
                    {filtered.length} tender{filtered.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <span className="pcab-live-badge">
                  <Flame size={14} /> Live bidding open
                </span>
              </div>

              <div className="pcab-grid">
                {filtered.map((t, i) => (
                  <TenderCard
                    key={t.id}
                    t={t}
                    index={i}
                    onClick={() => handleOpenTender(t.id)}
                  />
                ))}
              </div>
            </div>
          </section>
          <hr className="pcab-divider" />
        </>
      )}

      {/* ── How It Works ── */}
      <section className="pcab-section pcab-section-bg-muted">
        <div className="pcab-inner">
          <h2 className="pcab-section-heading">How the Tender Process Works</h2>
          <div className="pcab-steps-grid">
            {[
              { n: '1', title: 'SUTANA Posts a Product', desc: 'SUTANA lists a product or batch for competitive bidding with a starting price and closing deadline.' },
              { n: '2', title: 'Buyers Submit Their Offer', desc: "Registered buyers submit their best price offer confidentially. No bidder can see another's offer." },
              { n: '3', title: 'Highest Offer Wins', desc: 'When the tender closes, the buyer with the greatest value offer is declared the winner.' },
              { n: '4', title: 'Winner Completes Purchase', desc: 'The winner is notified, confirms payment within 48 hrs, and arranges delivery or pickup.' },
            ].map(s => (
              <div className="pcab-step-card" key={s.n}>
                <div className="pcab-step-num">{s.n}</div>
                <h3 className="pcab-step-title">{s.title}</h3>
                <p className="pcab-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="pcab-win-rule">
            <Gavel size={22} className="pcab-win-rule-icon" />
            <p className="pcab-win-rule-text">
              <strong>Core Winning Rule:</strong> The tender is won by whoever submits the{' '}
              <strong>greatest value offer</strong> before the closing time. No other bidder can see the
              winning amount until the tender closes. SUTANA reserves the right to reject any bid or cancel
              a tender at its sole discretion. Final sale is not guaranteed until officially confirmed by SUTANA.
            </p>
          </div>
        </div>
      </section>

      <hr className="pcab-divider" />

      {/* ── About SUTANA ── */}
      <section className="pcab-section pcab-section-bg-white">
        <div className="pcab-inner">
          <div className="pcab-about-grid">
            <div className="pcab-about-visual">
              <div className="pcab-about-visual-inner">
                <div className="pcab-about-icon-wrap">
                  <Gavel size={40} />
                </div>
                <div className="pcab-about-visual-label">SUTANA Products Marketplace</div>
                <div className="pcab-about-visual-sub">Trusted Supplier Since 2010</div>
              </div>
            </div>
            <div className="pcab-about-body">
              <h2 className="pcab-section-heading" style={{ marginBottom: '1rem' }}>Who We Are</h2>
              <p>SUTANA is a premier Ethiopian supplier offering a wide range of quality products through a transparent competitive tendering process.</p>
              <p>Our tender marketplace gives businesses and individuals access to certified, quality-checked items at fair, market-driven prices — determined by open competition, not fixed pricing.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="pcab-divider" />

      {/* ── Past Winners ── */}
      <section className="pcab-section pcab-section-bg-muted">
        <div className="pcab-inner">
          <h2 className="pcab-section-heading">Past Winning Tenders</h2>
          <div className="pcab-winners-grid">
            {WINNERS.map(w => (
              <div className="pcab-winner-card" key={w.product}>
                <div className="pcab-winner-icon">
                  <Award size={22} />
                </div>
                <div>
                  <p className="pcab-winner-product">{w.product}</p>
                  <p className="pcab-winner-meta">Category: {w.category} &nbsp;·&nbsp; Closed: {w.date}</p>
                  <div className="pcab-winner-value">
                    <TrendingUp size={13} /> Winning Offer: {w.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="pcab-winners-note">
            * Winner identities are kept private. Only product and winning offer value are displayed.
          </p>
        </div>
      </section>

      <hr className="pcab-divider" />

      {/* ── Trust Strip ── */}
      <section className="pcab-section pcab-section-bg-dark">
        <div className="pcab-inner">
          <div className="pcab-trust-grid">
            {[
              { icon: <Shield size={22} />, title: 'Fair & Transparent', desc: 'All bids are sealed and evaluated impartially after tender close.' },
              { icon: <Star size={22} />, title: 'Quality Verified', desc: 'Every product listed is certified and quality-checked by our team.' },
              { icon: <FileText size={22} />, title: 'Legal & Compliant', desc: 'All tender transactions comply with Ethiopian commercial law.' },
              { icon: <Info size={22} />, title: 'No Hidden Fees', desc: 'Bidding is free. Only winners pay — exactly the amount they bid.' },
            ].map(item => (
              <div className="pcab-trust-item" key={item.title}>
                <div className="pcab-trust-icon">{item.icon}</div>
                <div>
                  <p className="pcab-trust-title">{item.title}</p>
                  <p className="pcab-trust-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="pcab-divider" />

      {/* ── FAQs ── */}
      <section className="pcab-section pcab-section-bg-white">
        <div className="pcab-inner-narrow">
          <h2 className="pcab-section-heading pcab-section-heading-center">
            Frequently Asked Questions
          </h2>
          {FAQS.map((f, i) => (
            <div className="pcab-faq-item" key={i}>
              <button
                className="pcab-faq-btn"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                {openFaq === i
                  ? <ChevronUp size={18} style={{ flexShrink: 0, color: 'hsl(var(--primary))' }} />
                  : <ChevronDown size={18} style={{ flexShrink: 0, color: 'hsl(var(--muted-foreground))' }} />
                }
              </button>
              <div className={`pcab-faq-answer${openFaq === i ? ' open' : ''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer-Only Warning Modal ── */}
      {roleWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }} onClick={() => setRoleWarning(false)}>
          <div style={{ background: 'hsl(var(--background))', borderRadius: '1rem', maxWidth: '28rem', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', border: '1px solid hsl(var(--border))', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, hsl(var(--primary)), #fbbf24, #a855f7)' }} />
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--foreground))', margin: '0 0 0.75rem' }}>Customer Account Required</h2>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 1.75rem', lineHeight: 1.625 }}>
              You're currently signed in as <strong>{user?.fullName || user?.full_name || user?.name || 'a staff account'}</strong>.
              Bidding on this marketplace is available only to <strong>Customer</strong> accounts.
              Please <strong>sign out</strong> and log in as a customer to start bidding.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '16rem', margin: '0 auto' }}>
              <button
                className="pcab-btn-primary"
                onClick={() => { setRoleWarning(false); logout(); navigate('/login', { state: { from: location.pathname } }); }}
              >
                <User size={16} /> Sign Out &amp; Switch to Customer
              </button>
              <button
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setRoleWarning(false)}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCompeteAndBuyPage;
