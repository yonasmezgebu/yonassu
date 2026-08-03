import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Search, Hash, CheckCircle, Circle, AlertTriangle,
  HelpCircle, Package, Printer, Sprout, Car, Pill,
  ShoppingCart, X, MapPin, Clock, Calendar, CreditCard,
  Shield, Info, ChevronRight, Zap
} from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

/* ─── Constants ──────────────────────────────────────────────────── */
const MODULE_ICONS = {
  PRINTING:   <Printer size={18} />,
  CAR_RENTAL: <Car size={18} />,
  PHARMACY:   <Pill size={18} />,
  FARMING:    <Sprout size={18} />,
  RETAIL:     <ShoppingCart size={18} />,
};

const FAQS = [
  { q: 'What if I lost my receipt number?',             a: 'Check your email inbox or SMS messages for an order confirmation. If you cannot find it, visit our nearest branch with a valid ID and the approximate order date.' },
  { q: 'How often is the status updated?',              a: 'Order statuses are updated in real-time by our team. However, physical processing steps may take a few minutes to reflect in the system.' },
  { q: 'What should I do if the status seems wrong?',   a: 'There may be a brief delay between physical processing and digital updates. If the issue persists for more than 24 hours, please visit our branch directly.' },
  { q: 'Why do I need both phone number and receipt number?', a: 'Requiring both fields together ensures only you can access your order details. This protects your privacy and prevents others from viewing your orders.' },
];

/* ─── Inline styles ──────────────────────────────────────────────── */
const STYLES = `
  @keyframes trackSpin       { to   { transform: rotate(360deg); } }
  @keyframes trackFadeIn     { from { opacity:0; } to { opacity:1; } }

  .track-page {
    min-height: calc(100vh - 60px);
    background: transparent;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #424242;
    position: relative;
    z-index: 1;
  }
  .track-inner {
    max-width: 1300px;
    margin: 0 auto;
    padding: 48px 24px 80px;
    box-sizing: border-box;
  }

  /* ── Split grid ── */
  .track-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: start;
    margin-bottom: 64px;
  }
  @media (max-width: 860px) {
    .track-split { grid-template-columns: 1fr; gap: 32px; }
    .track-inner { padding: 28px 16px 56px; }
  }

  /* ── Left hero ── */
  .track-hero-title {
    font-size: clamp(26px, 3.5vw, 40px);
    font-weight: 900;
    color: #1B5E20;
    margin: 0 0 16px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .track-hero-sub {
    font-size: clamp(14px, 1.8vw, 16px);
    color: #424242;
    line-height: 1.7;
    margin: 0 0 32px;
  }

  /* ── Info cards ── */
  .track-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 480px) { .track-info-grid { grid-template-columns: 1fr; } }

  .track-info-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    padding: 20px;
    border-left: 4px solid #228B22;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .track-info-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .track-info-card h3 {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 800;
    color: #1B5E20;
    display: flex; align-items: center; gap: 8px;
  }
  .track-info-card p {
    margin: 0;
    color: #424242;
    font-size: 13px;
    line-height: 1.65;
  }

  /* ── Right column (form / result) ── */

  /* ── Form card ── */
  .track-form-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    padding: 36px 32px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .track-form-title {
    margin: 0 0 28px;
    font-size: 22px;
    font-weight: 800;
    color: #1B5E20;
  }

  /* ── Form groups ── */
  .track-form-group { margin-bottom: 24px; }
  .track-form-label {
    display: block;
    font-size: 13px; font-weight: 700; color: #424242;
    margin-bottom: 8px;
  }
  .track-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .track-input-icon {
    position: absolute;
    left: 14px;
    color: #8D6E63;
    pointer-events: none;
    transition: color 0.2s ease;
    display: flex;
  }
  .track-form-group:focus-within .track-input-icon {
    color: #2E8B57;
  }
  .track-form-input {
    width: 100%;
    padding: 14px 16px 14px 42px;
    font-size: 15px;
    font-weight: 600;
    color: #424242;
    background: #F9FAFB;
    border: 1px solid #8D6E63;
    border-radius: 6px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
    font-family: inherit;
  }
  .track-form-input::placeholder { color: #A8A29E; font-weight: 500; }
  .track-form-input:focus {
    background: #FFFFFF;
    border-color: #2E8B57;
    box-shadow: 0 0 0 3px rgba(46,139,87,0.15);
  }

  /* ── Error box ── */
  .track-error {
    background: #fff5f5;
    border: 1px solid #F44336;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 13px; color: #B71C1C; line-height: 1.6;
  }

  /* ── Submit button ── */
  .track-submit-btn {
    width: 100%;
    padding: 13px;
    background: #2E8B57;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: .04em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    position: relative; overflow: hidden;
    margin-top: 8px;
  }
  .track-submit-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: skewX(-20deg);
    transition: left 0.45s ease;
  }
  .track-submit-btn:hover { background: #1B5E20; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(27,94,32,0.3); }
  .track-submit-btn:hover::after { left: 150%; }
  .track-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
  .track-spinner {
    width: 20px; height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: trackSpin 0.8s linear infinite;
  }

  /* ── Result card ── */
  .track-result-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .track-result-header {
    background: #1B5E20;
    color: #fff;
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .track-result-module-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.18);
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .track-result-id {
    font-size: clamp(20px, 3vw, 28px);
    font-weight: 900;
    margin: 0 0 4px;
  }
  .track-result-date { font-size: 13px; color: #A5D6A7; margin: 0; }
  .track-result-close {
    width: 38px; height: 38px;
    border-radius: 8px;
    background: rgba(255,255,255,0.15);
    border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }
  .track-result-close:hover { background: rgba(255,255,255,0.3); }

  /* ── Stages ── */
  .track-stages { padding: 24px 28px; background: #FFFFFF; }
  .track-stages-label {
    font-size: 11px; font-weight: 800; color: #8D6E63;
    text-transform: uppercase; letter-spacing: .1em; margin-bottom: 16px;
  }
  .track-stage {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid #F5F5F5;
    margin-bottom: 10px;
    transition: all 0.25s ease;
    background: #FFFFFF;
  }
  .track-stage.active {
    background: #f1fdf4;
    border-color: #4CAF50;
    border-left: 4px solid #4CAF50;
  }
  .track-stage-icon {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: #F5F5F5;
  }
  .track-stage.active .track-stage-icon { background: #4CAF50; }
  .track-stage-label {
    font-size: 15px; font-weight: 600; color: #8D6E63;
  }
  .track-stage.active .track-stage-label { font-weight: 800; color: #1B5E20; }

  /* ── Detail cards grid ── */
  .track-detail-section {
    background: #F5F5F5;
    border-top: 1px solid #8D6E63;
    padding: 20px 28px 24px;
  }
  .track-detail-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  @media (max-width: 480px) { .track-detail-grid { grid-template-columns: 1fr; } }
  .track-detail-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 10px;
    padding: 14px 16px;
    transition: box-shadow 0.15s ease;
  }
  .track-detail-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .track-detail-label {
    font-size: 11px; font-weight: 700; color: #8D6E63;
    text-transform: uppercase; letter-spacing: .08em;
    display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
  }
  .track-detail-value {
    font-size: 14px; font-weight: 800; color: #424242; word-break: break-word;
  }

  /* ── Bottom section ── */
  .track-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 8px;
  }
  @media (max-width: 720px) {
    .track-bottom { grid-template-columns: 1fr; gap: 32px; }
  }

  /* ── Section heading ── */
  .track-section-title {
    font-size: 18px; font-weight: 800;
    color: #1B5E20;
    margin: 0 0 20px;
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 10px;
    border-bottom: 2px solid #A5D6A7;
  }

  /* ── FAQ cards ── */
  .track-faq-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .track-faq-card:hover {
    box-shadow: 0 6px 18px rgba(0,0,0,0.07);
    transform: translateY(-1px);
  }
  .track-faq-q {
    font-size: 14px; font-weight: 700; color: #1B5E20; margin-bottom: 8px;
  }
  .track-faq-a {
    font-size: 13px; color: #424242; line-height: 1.65;
  }

  /* ── Trust cards ── */
  .track-trust-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    padding: 22px;
    margin-bottom: 14px;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .track-trust-card:hover {
    box-shadow: 0 6px 18px rgba(0,0,0,0.07);
    transform: translateY(-1px);
  }
  .track-trust-card.privacy   { border-left: 4px solid #228B22; }
  .track-trust-card.disclaimer { border-left: 4px solid #FF9800; }
  .track-trust-card h3 { font-size: 15px; font-weight: 800; color: #424242; margin: 0 0 10px; }
  .track-trust-card p  { margin: 0; font-size: 13px; color: #424242; line-height: 1.7; }
`;

/* ─── Detail Card Sub-component ─────────────────────────────────── */
const DetailCard = ({ icon, label, value }) => (
  <div className="track-detail-card">
    <div className="track-detail-label">{icon} {label}</div>
    <div className="track-detail-value">{value || '—'}</div>
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────── */
export default function TrackOrderPage() {
  const [invoice,    setInvoice]    = useState('');
  const [phone,      setPhone]      = useState('');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [focused,    setFocused]    = useState(null);
  const [showResult, setShowResult] = useState(false);

  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  /* ─── 3D Particle Network Canvas (Green & White Theme) ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const COUNT = 100;
    const particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      z:  Math.random() * 1000 + 100,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      vz: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (p.z < 1) p.z = 1000;
        if (p.z > 1000) p.z = 1;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const scale = 800 / p.z;
        const px = (p.x - cx) * scale + cx;
        const py = (p.y - cy) * scale + cy;
        const radius = p.size * scale;
        const alpha = Math.min(1, scale * 0.4);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(27, 94, 32, ${alpha * 0.6})`;
        ctx.fill();

        particles.forEach(q => {
          const qscale = 800 / q.z;
          const qx = (q.x - cx) * qscale + cx;
          const qy = (q.y - cy) * qscale + cy;
          const dist = Math.hypot(px - qx, py - qy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(qx, qy);
            ctx.strokeStyle = `rgba(34, 139, 34, ${(1 - dist / 120) * 0.12 * alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /* ─── Validation ─── */
  const validate = () => {
    if (!invoice.trim()) { setError('Please enter your invoice/receipt number.'); return false; }
    if (!phone.trim())   { setError('Please enter your phone number.'); return false; }
    if (phone.replace(/\D/g, '').length < 9) { setError('Please enter a valid Ethiopian phone number (09XXXXXXXX).'); return false; }
    return true;
  };

  /* ─── Submit ─── */
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null); setResult(null); setShowResult(false);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.get('/public/track', {
        params: { invoice: invoice.trim().replace(/^#/, ''), phone: phone.trim() },
      });
      if (res.status === 'success') {
        setResult(res.data);
        setShowResult(true);
      } else setError(res.message || 'Order not found.');
    } catch (err) {
      if (err.response?.status === 429)
        setError('Too many requests. Please wait a moment before trying again.');
      else if (err.response?.status === 404)
        setError(err.response?.data?.message || 'We could not find an order matching the provided details. Please double-check both fields.');
      else
        setError('Tracking service is temporarily unavailable. Please try again shortly.');
    } finally { setLoading(false); }
  };

  /* ─── Reset ─── */
  const reset = () => {
    setShowResult(false);
    setTimeout(() => { setResult(null); setError(null); }, 400);
  };

  /* ─── Render ─── */
  return (
    <>
      <style>{STYLES}</style>
      <PublicNav />

      {/* 3D Canvas BG */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} />

      <div className="track-page" style={{ position: 'relative', zIndex: 1 }}>
        <div className="track-inner">

          {/* ── Split layout ── */}
          <div className="track-split">

            {/* Left: Hero & info */}
            <div className="track-hero">
              <h1 className="track-hero-title">Track Your Order</h1>
              <p className="track-hero-sub">
                Experience real-time transparency. Enter your receipt and phone number to instantly view the current stage of your request across any Sutana division.
              </p>
              <div className="track-info-grid">
                <div className="track-info-card">
                  <h3><Zap size={16} color="#228B22" /> 1. Enter Details</h3>
                  <p>Input your exact invoice number (e.g. INV-2026...) and the phone number provided at checkout.</p>
                </div>
                <div className="track-info-card">
                  <h3><Search size={16} color="#228B22" /> 2. View Status</h3>
                  <p>Instantly see the real-time stage, estimated completion, and branch details.</p>
                </div>
              </div>
            </div>

            {/* Right: Form or Result */}
            <div className="track-form-col">

              {/* Search Form */}
              {!showResult && (
                <div className="track-form-card">
                  <h2 className="track-form-title">Search Order</h2>

                  <form onSubmit={handleSubmit}>
                    <div className="track-form-group">
                      <label className="track-form-label">Receipt / Invoice Number</label>
                      <div className="track-input-wrapper">
                        <div className="track-input-icon">
                          <Hash size={18} />
                        </div>
                        <input
                          type="text"
                          value={invoice}
                          onChange={e => setInvoice(e.target.value)}
                          placeholder="e.g. INV-20260612-0001"
                          className="track-form-input"
                          onFocus={() => setFocused('invoice')}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                    </div>

                    <div className="track-form-group">
                      <label className="track-form-label">Phone Number</label>
                      <div className="track-input-wrapper">
                        <div className="track-input-icon">
                          <Search size={18} />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="09xxxxxxxxx"
                          className="track-form-input"
                          onFocus={() => setFocused('phone')}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="track-error">
                        <AlertTriangle size={18} color="#F44336" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>{error}</div>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="track-submit-btn">
                      {loading
                        ? <><div className="track-spinner" /> Searching...</>
                        : <><Search size={18} /> Track My Order</>
                      }
                    </button>
                  </form>
                </div>
              )}

              {/* Result View */}
              {showResult && result && (
                <div className="track-result-card">
                  {/* Header */}
                  <div className="track-result-header">
                    <div>
                      <div className="track-result-module-badge">
                        {MODULE_ICONS[result.module] || <Package size={14} />} {result.module}
                      </div>
                      <div className="track-result-id">{result.order_id}</div>
                      <p className="track-result-date">{result.order_date}</p>
                    </div>
                    <button className="track-result-close" onClick={reset} aria-label="Close">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Stages */}
                  <div className="track-stages">
                    <div className="track-stages-label">Current Status</div>
                    {result.stages.map((stage, i) => (
                      <div key={stage.label} className={`track-stage${stage.completed ? ' active' : ''}`}>
                        <div className="track-stage-icon">
                          {stage.completed
                            ? <CheckCircle size={18} color="#fff" />
                            : <Circle size={18} color="#8D6E63" />
                          }
                        </div>
                        <div className="track-stage-label">{stage.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detail cards */}
                  <div className="track-detail-section">
                    <div className="track-detail-grid">
                      <DetailCard icon={<Package size={14} />}    label="Product"       value={result.product} />
                      <DetailCard icon={<CreditCard size={14} />}  label="Total"         value={`ETB ${result.total_amount?.toLocaleString()}`} />
                      <DetailCard icon={<CheckCircle size={14} />} label="Payment"       value={result.payment_status} />
                      {result.estimated_completion && <DetailCard icon={<Calendar size={14} />}  label="Est. Completion" value={result.estimated_completion} />}
                      {result.pickup_location      && <DetailCard icon={<MapPin size={14} />}    label="Branch"          value={result.pickup_location} />}
                      {result.working_hours        && <DetailCard icon={<Clock size={14} />}     label="Working Hours"   value={result.working_hours} />}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Bottom: FAQ + Trust ── */}
          <div className="track-bottom">

            {/* FAQ */}
            <div>
              <h2 className="track-section-title">
                <HelpCircle size={20} color="#228B22" /> Frequently Asked Questions
              </h2>
              {FAQS.map((faq, i) => (
                <div key={i} className="track-faq-card">
                  <div className="track-faq-q">{faq.q}</div>
                  <div className="track-faq-a">{faq.a}</div>
                </div>
              ))}
            </div>

            {/* Trust & Security */}
            <div>
              <h2 className="track-section-title">
                <Shield size={20} color="#228B22" /> Trust &amp; Security
              </h2>
              <div className="track-trust-card privacy">
                <h3>Data Privacy</h3>
                <p>We require both your phone number and receipt number to process a tracking request. This multi-factor check guarantees that your order details cannot be viewed by unauthorized individuals.</p>
              </div>
              <div className="track-trust-card disclaimer">
                <h3>Processing Disclaimer</h3>
                <p>Our real-time system tracks physical progress across all Sutana branches. Please allow a slight buffer for physical handlers to update the digital system. If an order is severely delayed, visit your branch directly.</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}