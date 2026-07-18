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

const MODULE_ICONS = {
  PRINTING: <Printer size={20} />,
  CAR_RENTAL: <Car size={20} />,
  PHARMACY: <Pill size={20} />,
  FARMING: <Sprout size={20} />,
  RETAIL: <ShoppingCart size={20} />,
};

const FAQS = [
  { q: 'What if I lost my receipt number?', a: 'Check your email inbox or SMS messages for an order confirmation. If you cannot find it, visit our nearest branch with a valid ID and the approximate order date.' },
  { q: 'How often is the status updated?', a: 'Order statuses are updated in real-time by our team. However, physical processing steps may take a few minutes to reflect in the system.' },
  { q: 'What should I do if the status seems wrong?', a: 'There may be a brief delay between physical processing and digital updates. If the issue persists for more than 24 hours, please visit our branch directly.' },
  { q: 'Why do I need both phone number and receipt number?', a: 'Requiring both fields together ensures only you can access your order details. This protects your privacy and prevents others from viewing your orders.' },
];

export default function TrackOrderPage() {
  const [invoice, setInvoice] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  /* ─── 3D Particle Network Canvas (White & Green Theme) ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const COUNT = 100;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 1000 + 100,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      vz: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Light white/gray background
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
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`; // Green dots
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
            ctx.strokeStyle = `rgba(5, 150, 105, ${(1 - dist / 120) * 0.15 * alpha})`; // Green lines
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

  /* ─── Inject keyframes ─── */
  useEffect(() => {
    if (document.getElementById('track-3d-kf')) return;
    const s = document.createElement('style');
    s.id = 'track-3d-kf';
    s.textContent = `
      @keyframes slideInRight { from{opacity:0;transform:translateX(50px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
      .glass-input { transition: all 0.3s; background: rgba(255,255,255,0.9); color: #0f172a; border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 0; outline: none; }
      .glass-input:focus { background: #ffffff; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
      .glass-input::placeholder { color: #94a3b8; }
      .track-btn-3d { background: linear-gradient(135deg, #059669, #10b981); border: none; color: white; transition: all 0.3s; position: relative; overflow: hidden; border-radius: 0; }
      .track-btn-3d:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); }
      .track-btn-3d::after { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); transform:skewX(-20deg); transition:all 0.5s; }
      .track-btn-3d:hover::after { left:150%; }
      .stage-box { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); background: #ffffff; border: 1px solid #e2e8f0; }
      .stage-box.active { background: #f0fdf4; border-color: #10b981; box-shadow: 0 4px 15px rgba(16,185,129,0.1); }
    `;
    document.head.appendChild(s);
  }, []);

  const validate = () => {
    if (!invoice.trim()) { setError('Please enter your invoice/receipt number.'); return false; }
    if (!phone.trim())   { setError('Please enter your phone number.'); return false; }
    if (phone.replace(/\D/g, '').length < 9) { setError('Please enter a valid Ethiopian phone number (09XXXXXXXX).'); return false; }
    return true;
  };

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
      if (err.response?.status === 429) setError('Too many requests. Please wait a moment before trying again.');
      else if (err.response?.status === 404) setError(err.response?.data?.message || 'We could not find an order matching the provided details. Please double-check both fields.');
      else setError('Tracking service is temporarily unavailable. Please try again shortly.');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setShowResult(false);
    setTimeout(() => { setResult(null); setError(null); }, 400);
  };

  return (
    <>
      <PublicNav />

      {/* ── 3D Canvas BG ── */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none'
      }} />

      {/* ── Main Layout Wrapper ── */}
      <div style={{
        position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 60px)',
        fontFamily: "'Inter', sans-serif",
        color: '#0f172a',
        padding: '80px 20px 100px',
        overflowX: 'hidden'
      }}>
        
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          
          {/* Split Screen Layout for Desktop / Full width */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: 60, alignItems: 'start'
          }}>
            
            {/* Left Column: Hero & Info */}
            <div style={{ animation: 'slideInRight 0.8s ease' }}>
              
              <h1 style={{
                fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 900,
                lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.02em',
                color: '#0f172a', whiteSpace: 'nowrap'
              }}>
                Track Your Order
              </h1>
              
              <p style={{
                fontSize: 'clamp(16px, 2vw, 20px)', color: '#475569',
                lineHeight: 1.6, maxWidth: 600, margin: '0 0 40px'
              }}>
                Experience real-time transparency. Enter your receipt and phone number to instantly view the current stage of your request across any Sutana division.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24, borderLeft: '4px solid #10b981' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={20} color="#10b981" /> 1. Enter Details
                  </h3>
                  <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>Input your exact invoice number (e.g. INV-2026...) and the phone number provided at checkout.</p>
                </div>
                <div className="glass-panel" style={{ padding: 24, borderLeft: '4px solid #059669' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={20} color="#059669" /> 2. View Status
                  </h3>
                  <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>Instantly see the real-time stage, estimated completion, and branch details.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Search Form or Result */}
            <div style={{ animation: 'slideInUp 0.8s ease 0.2s both' }}>
              
              {/* SEARCH FORM */}
              {!showResult && (
                <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '50px 40px' }}>
                  <h2 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Search Order</h2>
                  
                  {/* Invoice Input */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'#64748b', marginBottom:12, textTransform:'uppercase', letterSpacing:'.1em' }}>
                      <Hash size={16} color="#10b981" /> Receipt / Invoice Number
                    </label>
                    <input
                      type="text" value={invoice} onChange={e => setInvoice(e.target.value)}
                      placeholder="e.g. INV-20260612-0001"
                      className="glass-input"
                      style={{ width:'100%', padding:'20px', fontSize:16, fontWeight:600 }}
                      onFocus={() => setFocused('invoice')} onBlur={() => setFocused(null)}
                    />
                  </div>

                  {/* Phone Input */}
                  <div style={{ marginBottom: 40 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'#64748b', marginBottom:12, textTransform:'uppercase', letterSpacing:'.1em' }}>
                      <Search size={16} color="#10b981" /> Phone Number
                    </label>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      className="glass-input"
                      style={{ width:'100%', padding:'20px', fontSize:16, fontWeight:600 }}
                      onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                    />
                  </div>

                  {/* Error Box */}
                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 20, marginBottom: 30, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <AlertTriangle size={24} color="#ef4444" style={{ flexShrink:0 }} />
                      <div style={{ color: '#991b1b', fontSize: 14, lineHeight: 1.6 }}>{error}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button type="submit" disabled={loading} className="track-btn-3d" style={{
                    width: '100%', padding: '20px', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                  }}>
                    {loading ? <div style={{ width:24,height:24,border:'3px solid rgba(255,255,255,.3)',borderTop:'3px solid white',borderRadius:'50%',animation:'spin 1s linear infinite' }}/> : <Search size={24} />}
                    {loading ? 'SEARCHING...' : 'TRACK MY ORDER'}
                  </button>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </form>
              )}

              {/* RESULT VIEW */}
              {showResult && result && (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'slideInUp 0.6s ease' }}>
                  {/* Header */}
                  <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'#d1fae5', color:'#047857', fontSize:12, fontWeight:800, marginBottom:16, letterSpacing:'.05em' }}>
                        {MODULE_ICONS[result.module] || <Package size={14}/>} {result.module}
                      </div>
                      <h2 style={{ margin:0, fontSize:36, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>{result.order_id}</h2>
                      <p style={{ margin:'8px 0 0', color:'#475569', fontSize:15 }}>{result.order_date}</p>
                    </div>
                    <button onClick={reset} className="glass-input" style={{ width:48, height:48, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <X size={24} color="#0f172a" />
                    </button>
                  </div>

                  {/* 3D Stages */}
                  <div style={{ padding: '40px', background: '#ffffff' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em' }}>Current Status</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {result.stages.map((stage, i) => (
                        <div key={stage.label} className={`stage-box ${stage.completed ? 'active' : ''}`} style={{
                          padding: '20px', display: 'flex', alignItems: 'center', gap: 20,
                          borderLeft: stage.completed ? '4px solid #10b981' : '1px solid #e2e8f0'
                        }}>
                          <div style={{ width: 40, height: 40, background: stage.completed ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stage.completed ? <CheckCircle size={20} color="#ffffff" /> : <Circle size={20} color="#94a3b8" />}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: stage.completed ? 800 : 500, color: stage.completed ? '#0f172a' : '#64748b' }}>
                            {stage.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ background: '#f8fafc', padding: '40px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                      <DetailCard icon={<Package size={18}/>} label="Product" value={result.product} />
                      <DetailCard icon={<CreditCard size={18}/>} label="Total" value={`ETB ${result.total_amount?.toLocaleString()}`} />
                      <DetailCard icon={<CheckCircle size={18}/>} label="Payment" value={result.payment_status} />
                      {result.estimated_completion && <DetailCard icon={<Calendar size={18}/>} label="Est. Completion" value={result.estimated_completion} />}
                      {result.pickup_location && <DetailCard icon={<MapPin size={18}/>} label="Branch" value={result.pickup_location} />}
                      {result.working_hours && <DetailCard icon={<Clock size={18}/>} label="Working Hours" value={result.working_hours} />}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Grid: FAQs & Privacy */}
          <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 40, animation: 'slideInUp 0.8s ease 0.4s both' }}>
            
            {/* FAQ */}
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
                <HelpCircle size={28} color="#10b981" /> Frequently Asked Questions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {FAQS.map((faq, i) => (
                  <div key={i} className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{faq.q}</div>
                    <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy & Legal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 0', display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
                <Shield size={28} color="#10b981" /> Trust & Security
              </h2>
              
              <div className="glass-panel" style={{ padding: 32, borderLeft: '4px solid #10b981' }}>
                <h3 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 12px' }}>Data Privacy</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.7 }}>
                  We require both your phone number and receipt number to process a tracking request. This multi-factor check guarantees that your order details cannot be viewed by unauthorized individuals.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: 32, borderLeft: '4px solid #f59e0b' }}>
                <h3 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 12px' }}>Processing Disclaimer</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.7 }}>
                  Our real-time system tracks physical progress across all Sutana branches. Please allow a slight buffer for physical handlers to update the digital system. If an order is severely delayed, visit your branch directly.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

const DetailCard = ({ icon, label, value }) => (
  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px' }}>
    <span style={{ color:'#64748b', fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      {icon} {label}
    </span>
    <span style={{ color:'#0f172a', fontWeight:800, fontSize:16, display:'block', wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);