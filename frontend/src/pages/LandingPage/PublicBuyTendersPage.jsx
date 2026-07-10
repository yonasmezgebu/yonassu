import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SignatureCanvas from '../../components/SignatureCanvas';
import { PublicNav } from './PublicNavFooter';
import confetti from 'canvas-confetti';
import tenderHero from '../../assets/hero-section/tender2.jpg';
import clumpSound from '../../assets/notification/clump.mp3';
import { 
  FileText, Calendar, Box, Activity, User, Briefcase, Clock, FileCheck, CheckCircle, 
  MessageCircle, Send, X, AlertCircle, Phone, Mail, Award, Check,
  PartyPopper, Trophy, Sparkles, Star, Gift, Rocket, ClipboardList, Smartphone, Sparkle
} from 'lucide-react';
import './PublicLayout.css';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

.tender-hero-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 580px;
}
.tender-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.tender-hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.tender-page-root {
  background: #06091a;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}
.tender-main-layout {
  width: 100%;
  padding: 0 0 80px;
}
@media (max-width: 640px) {
  .tender-hero-wrap { height: 340px; }
}

/* ===== MODAL OVERLAY ===== */
.t-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
  overflow-y: auto;
  padding: 80px 16px 40px;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

/* ===== CONTACT CARD ===== */
.contact-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  animation: popUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popUp { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }

/* ===== CELEBRATION CARD ===== */
.celebrate-card {
  background: white;
  padding: 48px 40px;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
  animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}
.celebrate-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #10b981, #3b82f6, #a855f7);
}

/* ===== LASER BANNER ===== */
@keyframes laserSweep {
  0%   { background-position: -200% 0; }
  100% { background-position: 300% 0; }
}
@keyframes laserBeam1 {
  0%   { transform: rotate(-30deg) translateX(-120%); opacity: 0; }
  20%  { opacity: 0.7; }
  80%  { opacity: 0.7; }
  100% { transform: rotate(-30deg) translateX(220%); opacity: 0; }
}
@keyframes laserBeam2 {
  0%   { transform: rotate(25deg) translateX(120%); opacity: 0; }
  20%  { opacity: 0.5; }
  80%  { opacity: 0.5; }
  100% { transform: rotate(25deg) translateX(-220%); opacity: 0; }
}
@keyframes laserBeam3 {
  0%   { transform: rotate(-15deg) translateX(-180%); opacity: 0; }
  30%  { opacity: 0.4; }
  70%  { opacity: 0.4; }
  100% { transform: rotate(-15deg) translateX(220%); opacity: 0; }
}
@keyframes textFadeIn {
  0%   { opacity: 0; transform: translateY(10px) scale(0.97); }
  20%  { opacity: 1; transform: translateY(0) scale(1); }
  75%  { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-10px) scale(0.97); }
}
.laser-banner {
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 40%, #0a0a1a 100%);
  overflow: hidden;
  padding: 48px 48px;
  border-radius: 0;
  margin-bottom: 0;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.laser-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%, rgba(16,185,129,0.12) 20%,
    rgba(160,0,255,0.18) 35%, rgba(255,0,128,0.12) 50%,
    rgba(20,184,166,0.15) 65%, rgba(0,180,255,0.12) 80%, transparent 100%);
  background-size: 300% 100%;
  animation: laserSweep 4s linear infinite;
}
.laser-beam {
  position: absolute;
  top: 0; left: 50%;
  width: 3px;
  height: 300px;
  border-radius: 3px;
  transform-origin: top center;
  pointer-events: none;
}
.laser-beam-1 {
  background: linear-gradient(to bottom, rgba(16,185,129,0.9), rgba(16,185,129,0));
  animation: laserBeam1 3.5s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(16,185,129,0.8), 0 0 24px rgba(16,185,129,0.4);
}
.laser-beam-2 {
  background: linear-gradient(to bottom, rgba(245,158,11,0.9), rgba(245,158,11,0));
  animation: laserBeam2 4.2s ease-in-out infinite 0.8s;
  box-shadow: 0 0 12px rgba(245,158,11,0.8), 0 0 24px rgba(245,158,11,0.4);
}
.laser-beam-3 {
  background: linear-gradient(to bottom, rgba(20,184,166,0.8), rgba(20,184,166,0));
  animation: laserBeam3 5s ease-in-out infinite 1.6s;
  box-shadow: 0 0 10px rgba(20,184,166,0.7), 0 0 20px rgba(20,184,166,0.3);
}
.laser-beam-4 {
  background: linear-gradient(to bottom, rgba(234,179,8,0.8), rgba(234,179,8,0));
  animation: laserBeam1 4.8s ease-in-out infinite 2.4s;
  box-shadow: 0 0 10px rgba(234,179,8,0.7), 0 0 20px rgba(234,179,8,0.3);
}
.laser-text-wrap {
  position: relative;
  z-index: 2;
  text-align: center;
}
.laser-text {
  font-size: clamp(16px, 2.5vw, 24px);
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1.3;
  background: linear-gradient(90deg, #10b981, #f59e0b, #eab308, #14b8a6, #f59e0b, #10b981);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: textFadeIn 4s ease-in-out, laserSweep 3s linear infinite;
  text-shadow: none;
}
.laser-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin-top: 8px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ===== TENDER CARD (Dark Hero Style) ===== */
.tender-card {
  background: linear-gradient(145deg, #0f1729 0%, #1a2a4a 60%, #0f1729 100%);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  overflow: hidden;
  position: relative;
}
.tender-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #f59e0b, #eab308, #14b8a6, #f59e0b);
  background-size: 300% 100%;
  animation: laserSweep 3s linear infinite;
}
.tender-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,150,255,0.15);
}
.tender-card-inner {
  padding: 24px 26px 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ===== INPUT STYLES ===== */
.t-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
  font-family: inherit;
}
.t-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}

/* ===== BID BUTTON ===== */
.bid-btn {
  background: linear-gradient(135deg, #10b981 0%, #f59e0b 50%, #eab308 100%);
  color: white;
  border: none;
  padding: 13px 22px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 20px rgba(0,150,255,0.4);
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.bid-btn:hover { opacity: 0.9; transform: scale(1.03); box-shadow: 0 8px 30px rgba(0,150,255,0.6); }

.submit-bid-btn {
  padding: 14px 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 15px rgba(16,185,129,0.3);
}
.submit-bid-btn:hover:not(:disabled) { transform: scale(1.03); opacity: 0.9; }
.submit-bid-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Floating emoji animation */
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) scale(1.6); opacity: 0; }
}
.float-emoji {
  display: inline-block;
  animation: floatUp 2s ease-out infinite;
}
`;

// ===========================
// Laser Banner Component
// ===========================
const LASER_PHRASES = [
  "Connect with top suppliers.",
  "Compare competitive bids.",
  "Optimize your procurement lifecycle.",
  "Transparent. Fast. Reliable.",
  "Trusted by suppliers across Ethiopia.",
  "Submit your best bid today.",
];

const LaserBanner = () => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % LASER_PHRASES.length);
        setVisible(true);
      }, 500);
    }, 3500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="laser-banner">
      {/* Laser beams */}
      <div className="laser-beam laser-beam-1" />
      <div className="laser-beam laser-beam-2" />
      <div className="laser-beam laser-beam-3" />
      <div className="laser-beam laser-beam-4" />

      <div className="laser-text-wrap">
        <div className="laser-text" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {LASER_PHRASES[phraseIdx]}
        </div>
        <div className="laser-sub">SUTANA Smart Tenders &amp; Procurement</div>
      </div>
    </div>
  );
};

// ===========================
// Celebration Modal Component
// ===========================
const CelebrationModal = ({ onClose, name }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Burst confetti from left and right
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ef4444', '#ec4899'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        zIndex: 10000
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        zIndex: 10000
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    return () => confetti.reset();
  }, []);

  return (
    <div className="t-overlay" onClick={onClose}>
      <div className="celebrate-card" onClick={e => e.stopPropagation()}>
        {/* Stars row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <PartyPopper size={32} color="#fbbf24" />
          <Trophy size={36} color="#f59e0b" />
          <PartyPopper size={32} color="#fbbf24" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <h2 style={{
          fontSize: '32px', fontWeight: 900, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Congratulations!
        </h2>

        <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
          {name || 'Your bid'} has been submitted!
        </p>

        <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 32px', lineHeight: 1.6 }}>
          Your competitive bid has been received by <strong style={{ color: '#0f172a' }}>SUTANA</strong>.
          Our Purchase team will review and contact you within <strong>3–5 business days</strong>.
        </p>

        {/* Floating emojis */}
        <div style={{ marginBottom: '28px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {[<PartyPopper size={28} color="#ec4899" />, <Sparkles size={28} color="#f59e0b" />, <Star size={28} color="#fbbf24" />, <Sparkle size={28} color="#3b82f6" />, <Gift size={28} color="#10b981" />].map((icon, i) => (
            <span key={i} className="float-emoji" style={{ animationDelay: `${i * 0.4}s` }}>{icon}</span>
          ))}
        </div>

        <button onClick={onClose} style={{
          padding: '14px 48px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white', border: 'none', borderRadius: '50px',
          fontWeight: 700, fontSize: '16px', cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          transition: 'transform 0.15s',
        }}>
          <Rocket size={18} style={{ display: 'inline-block', marginRight: '6px' }} /> Awesome, Close!
        </button>
      </div>
    </div>
  );
};

// ==========================
// Contact Modal Component
// ==========================
const ContactModal = ({ onClose, onContinue, email, setEmail, phone, setPhone }) => (
  <div className="t-overlay">
    <div className="contact-card">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <ClipboardList size={40} color="#3b82f6" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          One Quick Step
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Enter your contact details before submitting your bid.
        </p>
      </div>

      <form onSubmit={e => { e.preventDefault(); onContinue(); }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>
            <Mail size={16} color="#64748b" /> Email Address <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            className="t-input" placeholder="you@company.com"
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>
            <Smartphone size={16} color="#64748b" /> Phone Number <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="tel" required value={phone}
            onChange={e => setPhone(e.target.value)}
            className="t-input" placeholder="+251 911 234 567"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', background: 'transparent', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>
            Cancel
          </button>
          <button type="submit"
            style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
            Continue to Bid →
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ==========================
// Contact Chat Modal Component
// ==========================
const ContactChatModal = ({ onClose, procurementContact, userEmail, api }) => {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState(userEmail || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text: string }

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/procurement-settings/messages', {
        senderName, senderEmail, senderPhone, message
      });
      showToast('success', '✅ Message sent! We will get back to you soon.');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      showToast('error', '❌ Failed to send: ' + (err.message || 'Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="t-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '0',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 36px', borderBottom: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <MessageCircle size={24} color="#3b82f6" /> Contact Procurement Team
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: 600, fontSize: '13px', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>

          {/* Left Side: Direct Contact Info */}
          <div style={{ flex: '0 0 360px', padding: '40px 36px', background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>Reach Us Directly</h4>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Need immediate assistance? Reach out to our procurement officers via phone or email during business hours.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {procurementContact?.phone1 ? (
                <a href={`tel:${procurementContact.phone1}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px', color: 'white', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '16px 18px', borderRadius: '0', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  <div style={{ background: '#3b82f6', padding: '10px', borderRadius: '0', display: 'flex', flexShrink: 0 }}><Phone size={18} color="white" /></div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Primary Phone</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{procurementContact.phone1}</div>
                  </div>
                </a>
              ) : null}

              {procurementContact?.phone2 ? (
                <a href={`tel:${procurementContact.phone2}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px', color: 'white', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '16px 18px', borderRadius: '0', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  <div style={{ background: '#10b981', padding: '10px', borderRadius: '0', display: 'flex', flexShrink: 0 }}><Phone size={18} color="white" /></div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Secondary Phone</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{procurementContact.phone2}</div>
                  </div>
                </a>
              ) : null}

              {procurementContact?.email ? (
                <a href={`mailto:${procurementContact.email}?subject=Tender Inquiry`}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px', color: 'white', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '16px 18px', borderRadius: '0', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  <div style={{ background: '#8b5cf6', padding: '10px', borderRadius: '0', display: 'flex', flexShrink: 0 }}><Mail size={18} color="white" /></div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Email Address</div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{procurementContact.email}</div>
                  </div>
                </a>
              ) : null}

              {!(procurementContact?.phone1 || procurementContact?.phone2 || procurementContact?.email) && (
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '0', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  No direct contact details provided.
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Message Form */}
          <div style={{ flex: 1, padding: '40px 36px', background: 'white', minWidth: '320px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Send us a Message</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>We'll reply to your email as soon as possible.</div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required value={senderName} onChange={e => setSenderName(e.target.value)} className="t-input" placeholder="Yonas Mezgebu"
                    style={{ fontSize: '14px', padding: '13px 14px', background: '#f8fafc', borderRadius: '0', border: '2px solid #e2e8f0', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Phone</label>
                  <input type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} className="t-input" placeholder="+251 911..."
                    style={{ fontSize: '14px', padding: '13px 14px', background: '#f8fafc', borderRadius: '0', border: '2px solid #e2e8f0', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" required value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="t-input" placeholder="you@company.com"
                  style={{ fontSize: '14px', padding: '13px 14px', background: '#f8fafc', borderRadius: '0', border: '2px solid #e2e8f0', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} className="t-input" rows="4"
                  placeholder="How can we help you? Tell us about your inquiry..."
                  style={{ fontSize: '14px', padding: '13px 14px', resize: 'vertical', background: '#f8fafc', borderRadius: '0', border: '2px solid #e2e8f0', transition: 'border-color 0.2s', lineHeight: 1.6 }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                ></textarea>
              </div>

              {/* In-App Notification (Inline) */}
              {toast && (
                <div style={{
                  marginBottom: '20px',
                  background: toast.type === 'success' ? 'linear-gradient(135deg, #065f46, #10b981)' : 'linear-gradient(135deg, #7f1d1d, #ef4444)',
                  color: 'white', padding: '14px 20px', borderRadius: '0',
                  fontSize: '14px', fontWeight: 600, letterSpacing: '0.2px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <span style={{ flex: 1 }}>{toast.text}</span>
                  <button type="button" onClick={() => setToast(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '13px' }}>✕</button>
                </div>
              )}

              <button type="submit" disabled={sending}
                style={{ width: '100%', padding: '16px', background: sending ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', border: 'none', borderRadius: '0', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: sending ? 'not-allowed' : 'pointer', fontSize: '15px', letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: sending ? 'none' : '0 4px 20px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
                onMouseOver={e => { if (!sending) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <Send size={18} /> {sending ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};


// ==========================
// Main Page
// ==========================
const PublicBuyTendersPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [biddingStep, setBiddingStep] = useState(0); // 0: list, 2: bid form, 3: celebration
  const [showContactChat, setShowContactChat] = useState(false);
  
  // Bid form state
  const [bidItems, setBidItems] = useState({});
  const [competitorName, setCompetitorName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [bidError, setBidError] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [handSignature, setHandSignature] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Procurement contact info derived from tenders (first tender with contact data set by Purchase team)
  const [procurementContact, setProcurementContact] = useState({ phone1: '', phone2: '', email: '' });

  useEffect(() => { fetchTenders(); }, []);

  const fetchTenders = async () => {
    try {
      const response = await api.get('/public-tenders/public');
      const fetchedTenders = response.data || [];
      setTenders(fetchedTenders);

      // Auto-open tender if redirected back from login
      if (isAuthenticated && location.state?.tenderId) {
        const target = fetchedTenders.find(t => t.id === location.state.tenderId);
        if (target) {
          setSelectedTender(target);
          setBidItems({});
          setCompetitorName('');
          setDigitalSignature('');
          setHandSignature('');
          setDeliveryTime('');
          setPaymentTerms('');
          setBidderEmail(user?.email || '');
          setBidderPhone(user?.phone || '');
          setBiddingStep(2);
          
          // Clear state so it doesn't reopen on refresh
          window.history.replaceState({}, document.title);
        }
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const settingsRes = await api.get('/procurement-settings');
      if (settingsRes.data) {
        setProcurementContact({
          phone1: settingsRes.data.contact_phone1 || '',
          phone2: settingsRes.data.contact_phone2 || '',
          email: settingsRes.data.contact_email || ''
        });
      }
    } catch (err) { console.error('Failed to load contact settings', err); }

    setLoading(false);
  };

  const handleSelectTender = (tender) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, tenderId: tender.id } });
      return;
    }
    
    setSelectedTender(tender);
    setBidItems({});
    setCompetitorName('');
    setDigitalSignature('');
    setHandSignature('');
    setDeliveryTime('');
    setPaymentTerms('');
    
    // Auto-fill from user context
    setBidderEmail(user?.email || '');
    setBidderPhone(user?.phone || '');
    
    setBidError(null);
    setBiddingStep(2); // Go directly to bid form
  };

  const handleBidItemChange = (itemId, field, value) => {
    setBidItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const calculateTotal = (itemId) => {
    const item = bidItems[itemId] || {};
    const birr = parseInt(item.priceBirr || 0);
    const cent = parseInt(item.priceCent || 0);
    const qty = selectedTender?.items?.find(i => i.id === itemId)?.quantity || 1;
    const totalCents = ((birr * 100) + cent) * qty;
    return { totalB: Math.floor(totalCents / 100), totalC: totalCents % 100 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const itemsPayload = Object.keys(bidItems).map(itemId => {
      const { totalB, totalC } = calculateTotal(parseInt(itemId));
      return {
        tenderItemId: parseInt(itemId),
        priceBirr: bidItems[itemId].priceBirr,
        priceCent: bidItems[itemId].priceCent,
        totalBirr: totalB,
        totalCent: totalC,
        checkup: bidItems[itemId].checkup || ''
      };
    }).filter(i => i.priceBirr !== undefined);

    try {
      const res = await api.post(`/public-tenders/public/${selectedTender.id}/bid`, {
        competitorName,
        email: bidderEmail,
        phone: bidderPhone,
        deliveryTime,
        paymentTerms,
        digitalSignatureText: digitalSignature,
        handSignaturePath: handSignature,
        items: itemsPayload
      });

      // Handle duplicate bid (409)
      if (res && res.status === 'duplicate') {
        setBidError('⚠️ You have already submitted a bid for this tender. To update it, go to: Customer Portal → Tender Bids → Update Bid');
        setSubmitting(false);
        return;
      }

      // Play clump.mp3
      try {
        const audio = new Audio(clumpSound);
        audio.volume = 0.8;
        audio.play();
      } catch (e) { console.warn('Audio blocked:', e); }

      setBiddingStep(3); // show celebration
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setBidError('⚠️ You have already submitted a bid for this tender. To update it, go to: Customer Portal → Tender Bids → Update Bid');
      } else {
        setBidError('⚠️ Error submitting bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleCelebrationClose = () => {
    setBiddingStep(0);
    setSelectedTender(null);
    setBidderEmail('');
    setBidderPhone('');
    setDeliveryTime('');
    setPaymentTerms('');
    fetchTenders(); // Refresh tenders to update bid counts
  };

  return (
    <div className="tender-page-root" style={{ overflowX: 'clip' }}>
      <style>{STYLES}</style>
      <PublicNav />

      {/* ===== Celebration Overlay ===== */}
      {biddingStep === 3 && (
        <CelebrationModal onClose={handleCelebrationClose} name={competitorName} />
      )}

      {/* ===== Contact Chat Modal ===== */}
      {showContactChat && (
        <ContactChatModal 
          onClose={() => setShowContactChat(false)} 
          procurementContact={procurementContact} 
          userEmail={user?.email} 
          api={api} 
        />
      )}

      {/* Hero */}
      <div className="tender-hero-wrap">
        <img className="tender-hero-img" src={tenderHero} alt="Tenders hero" />
        <div className="tender-hero-overlay">
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, color: '#fbbf24', margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.5px', textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }}>
            Compete &amp; Sell Our Product
          </h1>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 22px)', margin: 0, maxWidth: 640, fontWeight: 600, textShadow: '1px 2px 8px rgba(0,0,0,0.9)', letterSpacing: '0.5px' }}>
            Submit your competitive bids and supply products directly to SUTANA
          </p>
        </div>
      </div>

      <div className="tender-main-layout">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '18px' }}>
            ⏳ Loading Tenders...
          </div>
        ) : (
          <div>

            {/* ===== Tender Cards List ===== */}
            {biddingStep !== 2 && (
              <>
                {/* Laser Banner - full width */}
                <LaserBanner />

                {/* Cards Grid - full width with padding */}
                <div style={{ padding: '40px 40px 48px', background: 'linear-gradient(180deg, #06091a 0%, #0d1b3e 50%, #06091a 100%)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '28px' }}>
                  {tenders.map(tender => (
                    <div key={tender.id} className="tender-card">
                      <div className="tender-card-inner">
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(20,184,166,0.15)', color: '#00ff88', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(20,184,166,0.25)' }}>
                            <CheckCircle size={11} /> Open
                          </span>
                          {tender.tender_number && (
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>{tender.tender_number}</span>
                          )}
                        </div>

                        {/* Category */}
                        {tender.category && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <FileText size={10} /> {tender.category}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3 style={{ fontSize: '21px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>{tender.title}</h3>

                        {/* Description - full text, no truncation */}
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '18px', lineHeight: 1.7, flex: 1, fontSize: '14px' }}>
                          {tender.description}
                        </p>

                        {/* Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                          {tender.opening_date && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'rgba(16,185,129,0.9)', marginBottom: '3px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}><Calendar size={11} /> Opens</span>
                              {new Date(tender.opening_date).toLocaleDateString()}
                            </div>
                          )}
                          {tender.closing_date && (
                            <div style={{ fontSize: '12px', background: 'rgba(255,100,0,0.1)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,100,0,0.2)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#ff8040', marginBottom: '3px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}><Clock size={11} /> Closes</span>
                              <strong style={{ color: '#ff8040' }}>{new Date(tender.closing_date).toLocaleDateString()}</strong>
                            </div>
                          )}
                        </div>

                        {/* Footer row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '16px' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><Box size={13} /> {tender.items?.length || 0} items</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={13} /> {tender.bids_count || 0} bids</span>
                        </div>

                        <button
                          className="bid-btn"
                          style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                          onClick={() => handleSelectTender(tender)}
                        >
                          <Award size={18} /> Start Buying
                        </button>
                      </div>
                    </div>
                  ))}
                  {tenders.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', fontSize: '18px', padding: '40px 0' }}>
                      No active tenders currently available.
                    </p>
                  )}
                </div>
              </div>{/* end cards grid padding wrapper */}
              </>
            )}

            {/* ===== INFO SECTIONS (visible only on list view) ===== */}
            {biddingStep !== 2 && (
              <div style={{ background: '#fff' }}>
                {/* How It Works */}
                <div style={{ padding: '64px 40px 48px' }}>
                  <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>How It Works</h2>
                  <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '16px' }}>Four simple steps from tender discovery to award</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                    {[
                      { step: '01', icon: <FileText size={36} color="#3b82f6" />, title: 'Browse Tenders', desc: 'Review all open tenders above. Each listing includes item details, quantities, and the closing deadline.' },
                      { step: '02', icon: <FileCheck size={36} color="#3b82f6" />, title: 'Register & Bid', desc: 'Click "Start Buying", provide your email and phone, then fill in your unit prices for each requested item.' },
                      { step: '03', icon: <Activity size={36} color="#3b82f6" />, title: 'Evaluation', desc: 'Our Purchase team analyses all submitted bids, comparing price, delivery time and payment terms.' },
                      { step: '04', icon: <Award size={36} color="#3b82f6" />, title: 'Award & Contract', desc: 'The best-value supplier is recommended and approved by our CEO. You will be notified within 3–5 business days.' },
                    ].map(s => (
                      <div key={s.step} style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '48px', opacity: 0.06, fontWeight: 900, color: '#0f172a' }}>{s.step}</div>
                        <div style={{ marginBottom: '16px' }}>{s.icon}</div>
                        <h3 style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a', marginBottom: '10px' }}>Step {s.step}: {s.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Bid Section */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderRadius: '0', padding: '64px 40px', marginBottom: '0', color: 'white' }}>
                  <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, marginBottom: '8px' }}>Why Bid with SUTANA?</h2>
                  <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px', fontSize: '15px' }}>Trusted by suppliers across Ethiopia</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '28px' }}>
                    {[
                      { icon: <Activity size={32} color="#fbbf24" />, title: 'Fast Process', desc: 'Digital submission — no paperwork, no queues. Submit your bid in minutes from anywhere.' },
                      { icon: <FileCheck size={32} color="#10b981" />, title: 'Fair & Transparent', desc: 'Every bid is evaluated on merit. Lowest price, delivery, and payment terms are all scored objectively.' },
                      { icon: <Briefcase size={32} color="#3b82f6" />, title: 'Timely Payment', desc: 'SUTANA is committed to paying awarded suppliers on time, as per the agreed payment schedule.' },
                      { icon: <Activity size={32} color="#a855f7" />, title: 'Long-Term Partnerships', desc: 'Top-performing suppliers are prioritized for future tenders and ongoing procurement contracts.' },
                      { icon: <User size={32} color="#ec4899" />, title: 'Open to All', desc: 'Any registered business or individual can participate. No entry fee, no hidden requirements.' },
                      { icon: <Mail size={32} color="#ef4444" />, title: 'Instant Confirmation', desc: 'Receive immediate bid confirmation and status updates directly to your registered email and phone.' },
                    ].map(b => (
                      <div key={b.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ marginBottom: '12px' }}>{b.icon}</div>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: 'white' }}>{b.title}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div style={{ padding: '64px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '0' }}>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileCheck size={20} color="#3b82f6" /> What You Need to Bid</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        'Valid email address and phone number',
                        'Your company or business name',
                        'Unit price per item (in Ethiopian Birr and Cent)',
                        'Estimated delivery time',
                        'Your preferred payment terms',
                        'Digital or hand-drawn signature',
                      ].map(r => (
                        <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#334155' }}>
                          <span style={{ marginTop: '2px' }}><Check size={16} color="#10b981" /></span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} color="#f59e0b" /> Frequently Asked Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { q: 'Can I bid on multiple tenders?', a: 'Yes. You can submit separate bids for as many open tenders as you qualify for.' },
                        { q: 'What happens after I submit?', a: 'Our Purchase team will review, compare, and rank all bids. You will be contacted if your bid is selected.' },
                        { q: 'Is there a cost to bid?', a: 'No. Buying on SUTANA tenders is completely free of charge.' },
                        { q: 'Can I update my bid?', a: 'Once submitted, bids are final. Please review all pricing carefully before submitting.' },
                      ].map(faq => (
                        <div key={faq.q} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px', fontSize: '14px' }}>{faq.q}</p>
                          <p style={{ color: '#64748b', margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '0', padding: '64px 40px', textAlign: 'center', marginBottom: '0' }}>
                  <h3 style={{ fontWeight: 900, fontSize: '28px', color: '#0f172a', margin: '0 0 12px' }}>Have Questions About a Tender?</h3>
                  <p style={{ color: '#78350f', margin: '0 0 24px', fontSize: '16px' }}>Our procurement team is ready to help clarify any requirements.</p>
                  <button onClick={() => setShowContactChat(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 40px', background: '#0f172a', color: 'white', borderRadius: '50px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <MessageCircle size={20} /> Contact Procurement Team
                  </button>
                </div>
              </div>
            )}

            {/* ===== Bid Form Step ===== */}
            {biddingStep === 2 && selectedTender && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setBiddingStep(0)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '24px', fontWeight: 600, fontSize: '15px' }}>
                  ← Back to Tenders
                </button>

                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: '#0f172a' }}>{selectedTender.title}</h2>
                  <p style={{ color: '#64748b' }}>{selectedTender.description}</p>
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '14px', color: '#0369a1' }}>
                    👤 Buyer: <strong>{bidderEmail}</strong> · 📱 {bidderPhone}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {bidError && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
                      padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', fontSize: '15px',
                      display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600,
                      boxShadow: '0 4px 6px rgba(220, 38, 38, 0.1)', animation: 'fadeIn 0.3s ease'
                    }}>
                      <AlertCircle size={24} color="#dc2626" />
                      <span style={{ flex: 1 }}>{bidError}</span>
                      {bidError.includes('Customer Portal') && (
                        <button type="button" onClick={() => navigate('/customer')} style={{
                          background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px',
                          borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                        }}>Go to Portal</button>
                      )}
                    </div>
                  )}

                  {/* Smart Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '32px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>No</th>
                          <th style={{ padding: '14px 12px', color: 'white', fontWeight: 700, fontSize: '13px' }}>Object Type</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Unit</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Qty</th>
                          <th colSpan="2" style={{ padding: '14px 12px', color: '#fbbf24', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>Price / Object</th>
                          <th colSpan="2" style={{ padding: '14px 12px', color: '#34d399', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>Total Value</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Checkup</th>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                          <th colSpan="4" style={{ padding: '8px 12px' }}></th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Birr</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Cent</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #34d399' }}>Birr</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #34d399' }}>Cent</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTender.items?.map((item, index) => {
                          const { totalB, totalC } = calculateTotal(item.id);
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '14px 12px', fontWeight: 700, color: '#94a3b8' }}>{index + 1}</td>
                              <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>{item.object_type}</td>
                              <td style={{ padding: '14px 12px', color: '#64748b' }}>{item.unit}</td>
                              <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.quantity}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="number" min="0" placeholder="0"
                                  onChange={e => handleBidItemChange(item.id, 'priceBirr', e.target.value)}
                                  className="t-input" style={{ minWidth: '80px', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="number" min="0" max="99" placeholder="00"
                                  onChange={e => handleBidItemChange(item.id, 'priceCent', e.target.value)}
                                  className="t-input" style={{ minWidth: '60px', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#059669', background: '#f0fdf4' }}>{totalB}</td>
                              <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#059669', background: '#f0fdf4' }}>{totalC.toString().padStart(2, '0')}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="text" placeholder="Remarks..."
                                  onChange={e => handleBidItemChange(item.id, 'checkup', e.target.value)}
                                  className="t-input"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Terms & Conditions (Delivery & Payment) */}
                  <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>Terms &amp; Conditions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>Estimated Delivery Time <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="text" required value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                          className="t-input" placeholder="e.g., 30 days after order" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>Payment Terms <span style={{ color: '#ef4444' }}>*</span></label>
                        <select required value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="t-input">
                          <option value="">-- Select Payment Terms --</option>
                          <option value="100% upfront">100% upfront</option>
                          <option value="50% upfront, 50% on delivery">50% upfront, 50% on delivery</option>
                          <option value="100% on delivery">100% on delivery</option>
                          <option value="Net 30 days">Net 30 days</option>
                          <option value="Net 60 days">Net 60 days</option>
                          <option value="Letter of Credit">Letter of Credit</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Name, Signature, Date */}
                  <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>Competitor Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Competitor Name (Fill Part) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="text" required value={competitorName}
                          onChange={e => setCompetitorName(e.target.value)}
                          className="t-input" placeholder="Enter company / person name"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Date (Auto from Server)
                        </label>
                        <input type="text" disabled value={new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                          className="t-input" style={{ background: '#e2e8f0', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Digital Signature <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="text" required value={digitalSignature}
                          onChange={e => setDigitalSignature(e.target.value)}
                          className="t-input"
                          style={{ fontFamily: 'cursive', fontSize: '20px', color: '#1e40af' }}
                          placeholder="Type your signature..."
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Signature with Hand
                        </label>
                        <div style={{ border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '8px' }}>
                          <SignatureCanvas onSave={dataUrl => setHandSignature(dataUrl)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button type="submit" className="submit-bid-btn"
                      disabled={submitting || !competitorName || !digitalSignature || Object.keys(bidItems).length === 0}
                    >
                      {submitting ? '⏳ Submitting Bid...' : '🚀 Place Buy Offer to SUTANA'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBuyTendersPage;
