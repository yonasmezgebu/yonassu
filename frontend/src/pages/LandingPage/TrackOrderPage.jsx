import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { mediaUrl } from '../../services/apiClient';
import {
  Search, Hash, CheckCircle, Circle, AlertTriangle,
  HelpCircle, Package, Printer, Sprout, Car, Pill,
  ShoppingCart, X, MapPin, Clock, Calendar, CreditCard,
  Shield, Zap, FileText, Download, Tractor
} from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import FileViewer from '../../components/ui/FileViewer';
import './LandingRedesign.css';
import './TrackOrderPage.css';

/* ─── Constants ──────────────────────────────────────────────────── */
const MODULE_ICONS = {
  PRINTING:   <Printer size={18} />,
  CAR_RENTAL: <Car size={18} />,
  PHARMACY:   <Pill size={18} />,
  FARMING:    <Sprout size={18} />,
  RETAIL:     <ShoppingCart size={18} />,
  AGRI_RENT:  <Tractor size={18} />,
};

const FAQS = [
  { q: 'What if I lost my receipt number?',             a: 'Check your email inbox or SMS messages for an order confirmation. If you cannot find it, visit our nearest branch with a valid ID and the approximate order date.' },
  { q: 'How often is the status updated?',              a: 'Order statuses are updated in real-time by our team. However, physical processing steps may take a few minutes to reflect in the system.' },
  { q: 'What should I do if the status seems wrong?',   a: 'There may be a brief delay between physical processing and digital updates. If the issue persists for more than 24 hours, please visit our branch directly.' },
  { q: 'Why do I need both phone number and receipt number?', a: 'Requiring both fields together ensures only you can access your order details. This protects your privacy and prevents others from viewing your orders.' },
];

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
  const [viewFile,   setViewFile]   = useState(null);

  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  const stagesArr = result?.stages || [];
  const doneCount = stagesArr.filter(s => s.completed || s.current).length;
  const progressPct = result?.cancelled ? 0 : stagesArr.length ? Math.round((doneCount / stagesArr.length) * 100) : 0;

  /* ─── 3D Particle Network Canvas (Preserved Animation) ─── */
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
      const status = err.response?.status ?? err.status;
      const serverMsg = err.response?.data?.message ?? err.data?.message;
      if (status === 429)
        setError('Too many requests. Please wait a moment before trying again.');
      else if (status === 404)
        setError(serverMsg || 'We could not find an order matching the provided details. Please double-check both fields.');
      else if (status === 400)
        setError(serverMsg || 'Please check the invoice number and phone number and try again.');
      else
        setError(serverMsg || 'Tracking service is temporarily unavailable. Please try again shortly.');
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
      <PublicNav />

      {/* 3D Canvas BG */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} />

      <div className="track-page">
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
                  <h3><Zap size={16} /> 1. Enter Details</h3>
                  <p>Input your exact invoice number (e.g. AGR-…, INV-…, PRT-…, RET-…) and the phone number provided at checkout.</p>
                </div>
                <div className="track-info-card">
                  <h3><Search size={16} /> 2. View Status</h3>
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
                          placeholder="e.g. AGR-MV277UDZ-947G"
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
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
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

                  {/* Status banner */}
                  {result.status_label && (
                    <div className={`track-result-status${result.cancelled ? ' cancelled' : ''}`}>
                      <span className="track-result-status-dot" />
                      <span>{result.status_label}</span>
                    </div>
                  )}

                  {/* Progress */}
                  {result.stages && (
                    <div className="track-progress">
                      <div className={`track-progress-track${result.cancelled ? ' cancelled' : ''}`}>
                        <div className="track-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="track-progress-label">{result.cancelled ? 'Cancelled' : `${progressPct}% Complete`}</span>
                    </div>
                  )}

                  {/* Stages */}
                  {result.stages && (
                    <div className="track-stages">
                      <div className="track-stages-label">Order Journey Timeline</div>
                      {result.stages.map(stage => (
                        <div key={stage.label} className={`track-stage${stage.completed ? ' active' : ''}${stage.current ? ' current' : ''}`}>
                          <div className="track-stage-icon">
                            {stage.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                          </div>
                          <div className="track-stage-label">{stage.label}</div>
                          {stage.current && <span className="track-stage-now">Current</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded work files */}
                  {result.module === 'PRINTING' && result.works?.length > 0 && (
                    <div className="track-works">
                      <div className="track-works-title">Your Uploaded Files</div>
                      {result.works.map(w => (
                        <div key={w.id} className="track-work" role="button" tabIndex={0} onClick={() => setViewFile({ originalName: w.original_name, url: mediaUrl(w.url) })}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewFile({ originalName: w.original_name, url: mediaUrl(w.url) }); } }}>
                          <FileText size={16} className="track-work-icon" />
                          <span className="track-work-main">
                            <span className="track-work-name">{w.original_name}</span>
                            {w.message && <span className="track-work-msg">{w.message}</span>}
                          </span>
                          {w.size ? <span className="track-work-size">{(w.size / 1024 / 1024).toFixed(2)} MB</span> : null}
                          <Download size={15} className="track-work-open" />
                        </div>
                      ))}
                    </div>
                  )}

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
                <HelpCircle size={20} className="track-title-icon" style={{ color: 'hsl(var(--primary))' }} /> 
                Frequently Asked Questions
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
                <Shield size={20} className="track-title-icon" style={{ color: 'hsl(var(--primary))' }} /> 
                Trust &amp; Security
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

      <FileViewer file={viewFile} onClose={() => setViewFile(null)} />
    </>
  );
}