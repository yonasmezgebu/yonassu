import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, Clock, Tag, Search, Filter, ArrowRight, Flame, Award, AlertTriangle, CheckCircle, TrendingUp, Shield, ChevronDown, ChevronUp, Phone, Mail, FileText, Users, Star, Gavel, Info, Eye, EyeOff } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import tenderHero from '../../assets/hero-section/tender_animated_clean.png';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

@keyframes heroBreath {
  0% { transform: scale(1.05); opacity: 0.85; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1.05); opacity: 0.85; }
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
  padding: 48px 24px;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-top: -32px;
}
.laser-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%, rgba(0,220,255,0.12) 20%,
    rgba(160,0,255,0.18) 35%, rgba(255,0,128,0.12) 50%,
    rgba(0,255,128,0.15) 65%, rgba(0,180,255,0.12) 80%, transparent 100%);
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
  background: linear-gradient(to bottom, rgba(0,220,255,0.9), rgba(0,220,255,0));
  animation: laserBeam1 3.5s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(0,220,255,0.8), 0 0 24px rgba(0,220,255,0.4);
}
.laser-beam-2 {
  background: linear-gradient(to bottom, rgba(200,0,255,0.9), rgba(200,0,255,0));
  animation: laserBeam2 4.2s ease-in-out infinite 0.8s;
  box-shadow: 0 0 12px rgba(200,0,255,0.8), 0 0 24px rgba(200,0,255,0.4);
}
.laser-beam-3 {
  background: linear-gradient(to bottom, rgba(0,255,128,0.8), rgba(0,255,128,0));
  animation: laserBeam3 5s ease-in-out infinite 1.6s;
  box-shadow: 0 0 10px rgba(0,255,128,0.7), 0 0 20px rgba(0,255,128,0.3);
}
.laser-beam-4 {
  background: linear-gradient(to bottom, rgba(255,200,0,0.8), rgba(255,200,0,0));
  animation: laserBeam1 4.8s ease-in-out infinite 2.4s;
  box-shadow: 0 0 10px rgba(255,200,0,0.7), 0 0 20px rgba(255,200,0,0.3);
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
  background: linear-gradient(90deg, #00dcff, #c800ff, #ff0080, #00ff80, #ffc800, #00dcff);
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


.tender-hero-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 420px;
}
.tender-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  animation: heroBreath 18s ease-in-out infinite;
  will-change: transform, opacity;
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
  background: #f0f2f5;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}

.tender-filters-bar {
  background: white;
  border-bottom: 1px solid #e4e6ea;
  padding: 14px 0;
  position: sticky;
  top: 68px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tender-filters-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-pill {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1.5px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #64748b;
  font-family: inherit;
}
.status-pill:hover { background: #e2e8f0; color: #334155; }
.status-pill.active { background: linear-gradient(135deg, #059669, #10b981); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-bar:focus-within {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
  background: white;
}
.search-bar input { border: none; outline: none; flex: 1; font-size: 13px; color: #0f172a; background: transparent; font-family: inherit; }

.tender-main-layout {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.tender-card-h {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  border: 1px solid #e4e6ea;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  animation: fadeUp 0.4s both;
  text-decoration: none;
  color: inherit;
  margin-bottom: 14px;
}
.tender-card-h:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #c7e7dc;
}

.tender-card-thumb {
  width: 240px;
  min-width: 240px;
  height: 160px;
  object-fit: cover;
  flex-shrink: 0;
}
.tender-card-thumb-placeholder {
  width: 240px;
  min-width: 240px;
  height: 160px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tender-card-body {
  padding: 18px 22px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.tender-card-toprow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tender-ref {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  font-family: 'Courier New', monospace;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}
.status-badge.open { background: #d1fae5; color: #065f46; }
.status-badge.closed { background: #fef3c7; color: #92400e; }
.status-badge.awarded { background: #dbeafe; color: #1e40af; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }

.tender-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tender-card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
}

.tender-card-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}
.meta-price {
  font-size: 15px;
  font-weight: 800;
  color: #059669;
  margin-left: auto;
}

.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  animation: pulse 2s infinite;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: #94a3b8;
}
.empty-icon { font-size: 64px; margin-bottom: 16px; }

.card-shimmer {
  height: 160px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 400px;
  animation: shimmer 1.5s infinite;
  border-radius: 14px;
  margin-bottom: 14px;
}

.tender-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

@media (max-width: 640px) {
  .tender-hero-wrap { height: 280px; }
  .tender-card-h { flex-direction: column; }
  .tender-card-thumb, .tender-card-thumb-placeholder { width: 100%; min-width: unset; height: 200px; }
  .meta-price { margin-left: 0; }
}

/* ═══════ HOW TENDER WORKS ═══════ */
.btd-section { padding: 72px 24px; }
.btd-inner { max-width: 1100px; margin: 0 auto; }
.btd-label { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #059669; margin: 0 0 12px; }
.btd-title { font-size: clamp(22px, 3.5vw, 36px); font-weight: 900; margin: 0 0 48px; line-height: 1.2; }
.btd-title.dark { color: #0f172a; }
.btd-title.light { color: #fff; }

.btd-how-wrap { background: linear-gradient(135deg, #0f172a, #1e293b); }
.btd-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0; position: relative; }
.btd-steps::before { content:''; position:absolute; top:40px; left:0; right:0; height:2px; background:linear-gradient(90deg,#059669,#10b981,#34d399); opacity:0.35; }
.btd-step {
  padding: 32px 24px; text-align: center; position: relative;
  border-right: 1px solid rgba(255,255,255,0.06);
}
.btd-step:last-child { border-right: none; }
.btd-step-num {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white; font-size: 20px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 0 0 8px rgba(5,150,105,0.15);
  position: relative; z-index: 1;
}
.btd-step-title { font-size: 14px; font-weight: 800; color: white; margin: 0 0 8px; }
.btd-step-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; }

.btd-win-rule {
  margin-top: 40px; padding: 20px 28px;
  background: rgba(251,191,36,0.08); border: 1.5px solid rgba(251,191,36,0.3);
  border-radius: 12px; display: flex; align-items: flex-start; gap: 14px;
}
.btd-win-rule p { margin: 0; font-size: 14px; color: #fde68a; line-height: 1.7; }
.btd-win-rule strong { color: #fbbf24; }

/* ═══════ ABOUT SUTANA ═══════ */
.btd-about-wrap { background: #fff; }
.btd-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
@media(max-width:768px){ .btd-about-grid { grid-template-columns: 1fr; } }
.btd-about-visual {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 20px; min-height: 280px;
  display: flex; align-items: center; justify-content: center;
  padding: 40px; position: relative; overflow: hidden;
}
.btd-about-visual::before {
  content:''; position:absolute; inset:0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.06'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-9.5zm-2-9.5v.5h-4V10H9V5H0V0h5v5h5V0h10v10h-2zm10 0v5h-5v-5h5zM20 0v5h5V0h-5zm10 5v5h-5V5h5zM30 0v5h5V0h-5z'/%3E%3C/g%3E%3C/svg%3E") center/40px;
}
.btd-stat-row { display: flex; gap: 28px; margin-top: 32px; flex-wrap: wrap; }
.btd-stat { text-align: center; }
.btd-stat-n { font-size: 28px; font-weight: 900; color: #059669; line-height: 1; }
.btd-stat-l { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.btd-about-text p { color: #64748b; line-height: 1.8; font-size: 15px; margin: 0 0 16px; }

/* ═══════ PAST WINNERS ═══════ */
.btd-winners-wrap { background: #f8fafc; }
.btd-winners-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.btd-winner-card {
  background: white; border-radius: 12px; padding: 24px;
  border: 1px solid #e4e6ea; display: flex; align-items: flex-start; gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btd-winner-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.btd-winner-icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex; align-items: center; justify-content: center;
}
.btd-winner-product { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.btd-winner-meta { font-size: 12px; color: #64748b; margin: 0 0 4px; }
.btd-winner-value {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 800; color: #059669;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  padding: 3px 10px; border-radius: 6px; margin-top: 8px;
}

/* ═══════ FAQ ═══════ */
.btd-faq-wrap { background: white; }
.btd-faq-inner { max-width: 820px; margin: 0 auto; }
.btd-faq-item { border-bottom: 1px solid #e4e6ea; }
.btd-faq-q {
  width: 100%; text-align: left; background: none; border: none;
  padding: 20px 0; display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; font-weight: 700; color: #0f172a; cursor: pointer;
  gap: 16px; font-family: inherit; transition: color 0.2s;
}
.btd-faq-q:hover { color: #059669; }
.btd-faq-a {
  overflow: hidden; max-height: 0;
  transition: max-height 0.35s ease, padding 0.35s ease;
  font-size: 14px; color: #64748b; line-height: 1.8; padding: 0;
}
.btd-faq-a.open { max-height: 400px; padding-bottom: 20px; }

/* ═══════ TRUST & LEGAL ═══════ */
.btd-trust-wrap { background: linear-gradient(135deg, #0f172a, #1e293b); }
.btd-trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px; }
.btd-trust-item { display: flex; align-items: flex-start; gap: 14px; }
.btd-trust-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(5,150,105,0.15); border: 1px solid rgba(5,150,105,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btd-trust-title { font-size: 14px; font-weight: 700; color: white; margin: 0 0 4px; }
.btd-trust-desc { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; }

/* ═══════ CONTACT ═══════ */
.btd-contact-wrap { background: #f0fdf4; border-top: 3px solid #10b981; }
.btd-contact-inner { max-width: 900px; margin: 0 auto; text-align: center; }
.btd-contact-cards { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 32px; }
.btd-contact-card {
  background: white; border-radius: 14px; padding: 28px 36px;
  border: 1.5px solid #bbf7d0; text-align: center;
  box-shadow: 0 4px 16px rgba(5,150,105,0.08);
  min-width: 220px; transition: transform 0.2s;
}
.btd-contact-card:hover { transform: translateY(-3px); }
.btd-contact-card a { color: #059669; font-weight: 800; font-size: 16px; text-decoration: none; }
.btd-contact-card a:hover { text-decoration: underline; }
.btd-contact-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin: 0 0 8px; }

/* ═══════ DISCLAIMER ═══════ */
.btd-disclaimer {
  background: #fffbeb; border-top: 3px solid #fbbf24;
  padding: 20px 24px;
}
.btd-disclaimer p { max-width: 1000px; margin: 0 auto; font-size: 12px; color: #92400e; line-height: 1.7; text-align: center; }
.btd-disclaimer strong { color: #78350f; }
`;

// ===========================
// Laser Banner Component
// ===========================
const LASER_PHRASES = [
  "Find the best tenders.",
  "Submit competitive offers.",
  "Expand your business.",
  "Transparent. Fast. Reliable.",
  "Trusted by buyers across Ethiopia.",
  "Bid on open tenders today.",
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
        <div className="laser-sub">SUTANA Smart Tenders & Procurement</div>
      </div>
    </div>
  );
};

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
    tick(); const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{remaining}</span>;
};

const TenderCard = ({ t, onClick, index }) => {
  const imgs = (() => { try { return JSON.parse(t.attachments || '[]'); } catch { return []; } })();
  const images = imgs.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const [imgIdx, setImgIdx] = useState(0);
  const isOpen = t.status === 'open';
  const imgSrc = imgIdx < images.length ? `${API_ORIGIN}/uploads/tenders/${images[imgIdx]}` : null;
  
  let parsedItems = [];
  try { parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []); } catch(_){}
  const isMultiple = parsedItems.length > 0;

  return (
    <div
      className="tender-card-h"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {!isMultiple && (
        imgSrc
          ? <img className="tender-card-thumb" src={imgSrc} alt={t.title} loading="lazy" onError={() => setImgIdx(i => i + 1)} />
          : <div className="tender-card-thumb-placeholder">
              <TrendingUp size={40} color="#cbd5e1" />
            </div>
      )}
      <div className="tender-card-body">
        <div className="tender-card-toprow">
          <span className="tender-ref">{t.reference_number}</span>
          <span className={`status-badge ${t.status}`}>{t.status.replace('_', ' ')}</span>
          {t.category && <span style={{ fontSize: 11, color: '#64748b', padding: '2px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>{t.category}</span>}
          {isOpen && <span className="countdown-badge"><Flame size={10} /><Countdown deadline={t.deadline} /></span>}
        </div>

        <h3 className="tender-card-title">{t.title}</h3>
        {t.description && <p className="tender-card-desc">{t.description}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
          <div className="tender-card-meta" style={{ marginTop: 0, flex: 1 }}>
            {(() => {
              let parsedItems = [];
              try { parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []); } catch(_){}
              if (parsedItems.length > 0) {
                return (
                  <span className="meta-item" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: 'white', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                    📦 {parsedItems.length} Items (Smart Table)
                  </span>
                );
              }
              if (t.item_name) {
                return <span className="meta-item"><Tag size={12} />{t.item_name} × {t.quantity}</span>;
              }
              return null;
            })()}
            <span className="meta-item"><Calendar size={12} />{new Date(t.created_at).toLocaleDateString('en-CA')}</span>
            {t.deadline && (
              <span className="meta-item"><Clock size={12} />{new Date(t.deadline).toLocaleDateString('en-CA')}</span>
            )}
            {(() => {
              let parsedItems = [];
              try { parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []); } catch(_){}
              if (parsedItems.length > 0) return null; // no price for multi-item tenders
              return (
                <span className="meta-price">
                  {parseFloat(t.starting_bid_price || 0).toLocaleString()} ETB
                </span>
              );
            })()}
          </div>
          <button style={{ 
            background: '#059669', color: 'white', border: 'none', borderRadius: '8px', 
            padding: '8px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap', marginLeft: 12
          }}>
            View Details <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const FAQS = [
    { q: 'How do I place a bid?', a: 'Log in to your Sutana account, browse to the desired open tender, and click "Submit Bid". Enter the value you are willing to pay and confirm your offer. You can only submit one bid per tender unless stated otherwise.' },
    { q: 'Is there a minimum bid amount?', a: 'Yes. Each tender has a minimum starting price set by Sutana. Your bid must be equal to or greater than this minimum value. The starting price is clearly displayed on each tender card.' },
    { q: 'Can I see other people\'s bids?', a: 'No. All bids are completely confidential. No bidder can see another bidder\'s offer amount until the tender officially closes. This ensures a fair and transparent competition.' },
    { q: 'How is the winner decided?', a: 'The winner is the bidder who submits the highest value offer before the tender closing date and time. In case of tied bids, the earliest submitted bid wins.' },
    { q: 'What happens when I win?', a: 'Sutana will notify you via email and on your dashboard. You will then have a specified window (usually 48 hours) to complete the payment and arrange delivery or pickup of the product.' },
    { q: 'What if I don\'t win?', a: 'If you do not submit the winning bid, your account is not charged in any way. You are free to participate in future tenders without any penalty.' },
    { q: 'Can Sutana reject a bid or cancel a tender?', a: 'Yes. Sutana reserves the right to reject any bid or cancel/modify a tender at its sole discretion. Final sale is only confirmed after Sutana officially awards the tender to the winning bidder.' },
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


  return (
    <div className="tender-page-root" style={{ overflowX: 'hidden' }}>
      <style>{STYLES}</style>
      <PublicNav />

      {/* ─── Hero ─── */}
      <div className="tender-hero-wrap">
        <img className="tender-hero-img" src={tenderHero} alt="Tenders hero" />
        <div className="tender-hero-overlay">
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fbbf24', margin: 0, lineHeight: 1.1, textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }}>
            Compete &amp; Buy from Sutana
          </h1>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      {loading ? (
        <div className="tender-main-layout">
          {[1, 2, 3, 4].map(i => <div key={i} className="card-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          maxWidth: 560, margin: '48px auto', padding: '32px 28px',
          background: 'white', borderRadius: 16, textAlign: 'center',
          border: '1.5px dashed #d1fae5', boxShadow: '0 4px 24px rgba(5,150,105,0.07)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            No Open Tenders Right Now
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.7 }}>
            New tenders are posted regularly. Check back soon or{' '}
            <a href="/contact" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
              contact us
            </a>{' '}to be notified when a new one opens.
          </p>
        </div>
      ) : (
        <div className="tender-main-layout">
          <LaserBanner />
          <div className="tender-results-header" style={{ marginTop: '32px' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Open Tenders
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} tender{filtered.length !== 1 ? 's' : ''} available</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 600 }}>
              <Flame size={14} /> Live bidding open
            </div>
          </div>
          {filtered.map((t, i) => (
            <TenderCard
              key={t.id}
              t={t}
              index={i}
              onClick={() => navigate(`/tenders/${t.id}`)}
            />
          ))}
        </div>
      )}

      {/* ─── How Tender Works ─── */}
      <div className="btd-how-wrap btd-section">
        <div className="btd-inner">
          <p className="btd-label">Simple & Transparent</p>
          <h2 className="btd-title light">How the Tender Process Works</h2>
          <div className="btd-steps">
            {[
              { n:'1', title:'Sutana Posts a Product', desc:'Sutana lists a product or batch for competitive bidding with a starting price and closing deadline.' },
              { n:'2', title:'Buyers Submit Their Offer', desc:'Registered buyers submit their best price offer confidentially. No bidder can see another\'s offer.' },
              { n:'3', title:'Highest Offer Wins', desc:'When the tender closes, the buyer with the greatest value offer is declared the winner.' },
              { n:'4', title:'Winner Completes Purchase', desc:'The winner is notified, confirms payment within 48 hrs, and arranges delivery or pickup.' },
            ].map(s => (
              <div className="btd-step" key={s.n}>
                <div className="btd-step-num">{s.n}</div>
                <h3 className="btd-step-title">{s.title}</h3>
                <p className="btd-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="btd-win-rule">
            <Gavel size={22} color="#fbbf24" style={{flexShrink:0, marginTop:2}} />
            <p><strong>Core Winning Rule:</strong> The tender is won by whoever submits the <strong>greatest value offer</strong> before the closing time. No other bidder can see the winning amount until the tender closes. Sutana reserves the right to reject any bid or cancel a tender at its sole discretion. Final sale is not guaranteed until officially confirmed by Sutana.</p>
          </div>
        </div>
      </div>

      {/* ─── About Sutana ─── */}
      <div className="btd-about-wrap btd-section">
        <div className="btd-inner">
          <div className="btd-about-grid">
            <div className="btd-about-visual">
              <div style={{textAlign:'center', position:'relative', zIndex:1}}>
                <div style={{width:100,height:100,borderRadius:'50%',background:'linear-gradient(135deg,#059669,#10b981)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 16px 40px rgba(5,150,105,0.35)'}}>
                  <Gavel size={44} color="white" />
                </div>
                <div style={{fontSize:16,fontWeight:800,color:'#065f46'}}>Sutana Products Marketplace</div>
                <div style={{fontSize:12,color:'#059669',marginTop:4}}>Trusted Supplier Since 2010</div>
              </div>
            </div>
            <div className="btd-about-text">
              <p className="btd-label">Who We Are</p>
              <h2 className="btd-title dark" style={{marginBottom:16}}>Ethiopia's Leading Product Bidding Platform</h2>
              <p>Sutana is a premier Ethiopian supplier offering a wide range of quality products through a transparent competitive tendering process.</p>
              <p>Our tender marketplace gives businesses and individuals access to certified, quality-checked items at fair, market-driven prices — determined by open competition, not fixed pricing.</p>
              <div className="btd-stat-row">
                {[{n:'200+',l:'Tenders Completed'},{n:'50+',l:'Product Categories'},{n:'1,000+',l:'Registered Buyers'},{n:'100%',l:'Transparent Process'}].map(s=>(
                  <div className="btd-stat" key={s.l}>
                    <div className="btd-stat-n">{s.n}</div>
                    <div className="btd-stat-l">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Past Winners / Success Stories ─── */}
      <div className="btd-winners-wrap btd-section">
        <div className="btd-inner">
          <p className="btd-label">Success Stories</p>
          <h2 className="btd-title dark">Past Winning Tenders</h2>
          <div className="btd-winners-grid">
            {WINNERS.map(w => (
              <div className="btd-winner-card" key={w.product}>
                <div className="btd-winner-icon"><Award size={22} color="white" /></div>
                <div>
                  <p className="btd-winner-product">{w.product}</p>
                  <p className="btd-winner-meta">Category: {w.category} &nbsp;·&nbsp; Closed: {w.date}</p>
                  <div className="btd-winner-value"><TrendingUp size={13} /> Winning Offer: {w.value}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:20,textAlign:'center'}}>* Winner identities are kept private. Only product and winning offer value are displayed.</p>
        </div>
      </div>

      {/* ─── FAQs ─── */}
      <div className="btd-faq-wrap btd-section">
        <div className="btd-faq-inner">
          <p className="btd-label">Got Questions?</p>
          <h2 className="btd-title dark">Frequently Asked Questions</h2>
          {FAQS.map((f,i) => (
            <div className="btd-faq-item" key={i}>
              <button className="btd-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                {openFaq === i
                  ? <ChevronUp size={18} color="#059669" style={{flexShrink:0}} />
                  : <ChevronDown size={18} color="#64748b" style={{flexShrink:0}} />}
              </button>
              <div className={`btd-faq-a ${openFaq === i ? 'open' : ''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Trust & Legal ─── */}
      <div className="btd-trust-wrap btd-section">
        <div className="btd-inner">
          <p className="btd-label">Trust & Legal</p>
          <h2 className="btd-title light">Your Bid, Protected by Policy</h2>
          <div className="btd-trust-grid">
            {[
              { Icon: Shield, title: 'Terms & Conditions', desc: 'All bids are legally binding once submitted. By bidding, you agree to Sutana\'s tender terms including payment obligations upon winning.' },
              { Icon: FileText, title: 'Payment & Delivery Policy', desc: 'Winners must complete payment within 48 hours of notification. Products are delivered or available for pickup within 5 business days.' },
              { Icon: Eye, title: 'Privacy Policy', desc: 'Bidder identities and offer amounts are kept strictly confidential. Only the winning offer value is disclosed after tender closure.' },
              { Icon: Info, title: 'Disclaimer', desc: 'Sutana reserves the right to reject any bid or cancel any tender at its sole discretion. Final sale is confirmed only upon official award notification.' },
            ].map(({Icon, ...t}) => (
              <div className="btd-trust-item" key={t.title}>
                <div className="btd-trust-icon"><Icon size={20} color="#10b981" /></div>
                <div>
                  <p className="btd-trust-title">{t.title}</p>
                  <p className="btd-trust-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Contact for Tender Support ─── */}
      <div className="btd-contact-wrap btd-section">
        <div className="btd-contact-inner">
          <p className="btd-label">Need Help?</p>
          <h2 className="btd-title dark" style={{textAlign:'center',marginBottom:8}}>Tender Support Contact</h2>
          <p style={{color:'#64748b',fontSize:15,textAlign:'center',margin:0}}>Have a question about a tender, bid submission, or payment? Our team is ready to help.</p>
          <div className="btd-contact-cards">
            <div className="btd-contact-card">
              <div className="btd-contact-label">📞 Call Us</div>
              <a href="tel:+251911000000"><Phone size={16} style={{marginRight:6,verticalAlign:'middle'}} />+251 911 000 000</a>
              <p style={{fontSize:12,color:'#94a3b8',margin:'8px 0 0'}}>Mon–Sat, 8AM–6PM</p>
            </div>
            <div className="btd-contact-card">
              <div className="btd-contact-label">✉️ Email Us</div>
              <a href="mailto:tenders@sutana.com"><Mail size={16} style={{marginRight:6,verticalAlign:'middle'}} />tenders@sutana.com</a>
              <p style={{fontSize:12,color:'#94a3b8',margin:'8px 0 0'}}>Reply within 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Disclaimer ─── */}
      <div className="btd-disclaimer">
        <p><strong>⚖️ Legal Disclaimer:</strong> Participation in Sutana tenders constitutes acceptance of all Terms & Conditions. All bids are confidential and legally binding upon submission. Sutana reserves the right to reject, modify, or cancel any tender at its sole discretion without obligation. Final sale is confirmed only upon official award. Winning amounts will only be disclosed after tender closure. | <strong>Terms of Use</strong> | <strong>Privacy Policy</strong> | <strong>Tender Policy</strong></p>
      </div>

    </div>
  );
};
