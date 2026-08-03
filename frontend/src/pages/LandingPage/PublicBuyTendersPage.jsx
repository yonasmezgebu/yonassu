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
@keyframes glowBlink {
  0%, 100% { box-shadow: inset 0 0 8px rgba(74, 222, 128, 0.4), 0 0 8px rgba(74, 222, 128, 0.2); border-color: #86efac; }
  50% { box-shadow: inset 0 0 16px rgba(34, 197, 94, 0.8), 0 0 16px rgba(34, 197, 94, 0.6); border-color: #22c55e; }
}

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
  background: rgba(27, 94, 32, 0.9);
  overflow: hidden;
  padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 48px);
  border-radius: 0;
  margin-bottom: 0;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.laser-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%, rgba(16, 185, 129, 0.12) 20%,
    rgba(5, 150, 105, 0.18) 35%, rgba(52, 211, 153, 0.12) 50%,
    rgba(16, 185, 129, 0.15) 65%, rgba(5, 150, 105, 0.12) 80%, transparent 100%);
  background-size: 100% 100%;
}
.laser-beam {
  position: absolute;
  top: -10%; left: 50%;
  width: 3px;
  height: 200%;
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
.laser-beam-5 {
  background: linear-gradient(to bottom, rgba(0,220,255,0.7), rgba(0,220,255,0));
  animation: laserBeam2 3.8s ease-in-out infinite 1.2s;
  box-shadow: 0 0 10px rgba(0,220,255,0.6), 0 0 20px rgba(0,220,255,0.2);
}
.laser-beam-6 {
  background: linear-gradient(to bottom, rgba(255,0,128,0.7), rgba(255,0,128,0));
  animation: laserBeam3 4.5s ease-in-out infinite 0.5s;
  box-shadow: 0 0 10px rgba(255,0,128,0.6), 0 0 20px rgba(255,0,128,0.2);
}
.laser-beam-7 {
  background: linear-gradient(to bottom, rgba(0,255,128,0.6), rgba(0,255,128,0));
  animation: laserBeam1 5.2s ease-in-out infinite 2.0s;
  box-shadow: 0 0 8px rgba(0,255,128,0.5), 0 0 16px rgba(0,255,128,0.2);
}
.laser-beam-8 {
  background: linear-gradient(to bottom, rgba(200,0,255,0.6), rgba(200,0,255,0));
  animation: laserBeam2 4.0s ease-in-out infinite 2.8s;
  box-shadow: 0 0 8px rgba(200,0,255,0.5), 0 0 16px rgba(200,0,255,0.2);
}
.laser-text-wrap {
  position: relative;
  z-index: 2;
  text-align: center;
  width: 100%;
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

/* ===== DARK TENDER CARD (inside laser section) ===== */
.tender-card-dark {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #8D6E63;
  display: flex;
  flex-direction: column;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  overflow: hidden;
  position: relative;
}
.tender-card-dark:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
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
.status-pill:hover { background: #8D6E63; color: #334155; }
.status-pill.active { background: linear-gradient(135deg, #2E8B57, #2E8B57); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1.5px solid #8D6E63;
  border-radius: 20px;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-bar:focus-within {
  border-color: #2E8B57;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
  background: white;
}
.search-bar input { border: none; outline: none; flex: 1; font-size: 13px; color: #424242; background: transparent; font-family: inherit; }

.tender-main-layout {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.tender-card-h {
  background: white;
  border-radius: 12px;
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
  background: linear-gradient(135deg, #f1f5f9 0%, #8D6E63 100%);
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
  border: 1px solid #8D6E63;
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
  color: #424242;
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
  color: #2E8B57;
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
  background: linear-gradient(90deg, #8D6E63 25%, #f1f5f9 50%, #8D6E63 75%);
  background-size: 400px;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
  margin-bottom: 14px;
}

.tender-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #8D6E63;
}

@media (max-width: 768px) {
  .tender-hero-wrap { height: 280px; }
  .tender-card-h { flex-direction: column; }
  .tender-card-thumb, .tender-card-thumb-placeholder { width: 100%; min-width: unset; height: 200px; }
  .meta-price { margin-left: 0; }
  
  .btd-step { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .btd-step:last-child { border-bottom: none; }
  .btd-steps::before { display: none; }
  
  .tender-btn { width: 100%; justify-content: center; }
  .tender-card-actions { flex-direction: column; align-items: stretch !important; gap: 16px !important; }
}

/* ═══════ HOW TENDER WORKS ═══════ */
.btd-section { padding: clamp(48px, 6vw, 80px) clamp(16px, 4vw, 48px); }
.btd-inner { max-width: 1100px; margin: 0 auto; }
.btd-section-title {
  font-size: clamp(20px, 3vw, 30px); font-weight: 900;
  color: #1B5E20; margin: 0 0 40px; line-height: 1.2;
}

/* How it works */
.btd-how-wrap { background: #F5F5F5; }
.btd-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 24px;
}
.btd-step {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid #8D6E63;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex; flex-direction: column; align-items: center;
}
.btd-step:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.btd-step-num {
  width: 52px; height: 52px; border-radius: 50%;
  background: #1B5E20;
  color: white; font-size: 20px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
  flex-shrink: 0;
}
.btd-step-title { font-size: 15px; font-weight: 800; color: #424242; margin: 0 0 10px; }
.btd-step-desc { font-size: 13px; color: #757575; line-height: 1.7; margin: 0; }

.btd-win-rule {
  margin-top: 32px; padding: 18px 24px;
  background: #fff; border: 1px solid #8D6E63;
  border-left: 4px solid #228B22;
  border-radius: 12px; display: flex; align-items: flex-start; gap: 14px;
}
.btd-win-rule p { margin: 0; font-size: 14px; color: #424242; line-height: 1.7; }
.btd-win-rule strong { color: #1B5E20; }

/* About / Who We Are */
.btd-about-wrap { background: #fff; }
.btd-about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}
.btd-about-visual {
  background: #F5F5F5;
  border-radius: 12px;
  border: 1px solid #8D6E63;
  min-height: 260px;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}
.btd-about-text p { color: #757575; line-height: 1.8; font-size: 15px; margin: 0 0 14px; }
.btd-about-text p:last-child { margin-bottom: 0; }

/* Past Winners */
.btd-winners-wrap { background: #F5F5F5; }
.btd-winners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 20px;
}
.btd-winner-card {
  background: #fff;
  border-radius: 12px;
  padding: 22px 20px;
  border: 1px solid #8D6E63;
  display: flex; align-items: flex-start; gap: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btd-winner-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.btd-winner-icon {
  width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0;
  background: #1B5E20;
  display: flex; align-items: center; justify-content: center;
}
.btd-winner-product { font-size: 14px; font-weight: 700; color: #424242; margin: 0 0 5px; }
.btd-winner-meta { font-size: 12px; color: #757575; margin: 0 0 8px; }
.btd-winner-value {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: #2E8B57;
  background: #F5F5F5; border: 1px solid #8D6E63;
  padding: 3px 10px; border-radius: 6px;
}

/* FAQ */
.btd-faq-wrap { background: #fff; }
.btd-faq-inner { max-width: 820px; margin: 0 auto; }
.btd-faq-item { border-bottom: 1px solid #e0e0e0; }
.btd-faq-item:first-of-type { border-top: 1px solid #e0e0e0; }
.btd-faq-q {
  width: 100%; text-align: left; background: none; border: none;
  padding: 18px 0; display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; font-weight: 700; color: #424242; cursor: pointer;
  gap: 16px; font-family: inherit; transition: color 0.15s ease;
}
.btd-faq-q:hover { color: #1B5E20; }
.btd-faq-a {
  overflow: hidden; max-height: 0;
  transition: max-height 0.35s ease, padding 0.35s ease;
  font-size: 14px; color: #757575; line-height: 1.8; padding: 0;
}
.btd-faq-a.open { max-height: 400px; padding-bottom: 18px; }

/* ─── Tablet (≤ 900px) ─── */
@media(max-width: 900px) {
  .btd-about-grid { grid-template-columns: 1fr; gap: 24px; }
  .btd-about-visual { min-height: 160px; padding: 28px; order: -1; }
  .btd-steps { grid-template-columns: repeat(2, 1fr); }
}

/* ─── Mobile (≤ 600px) ─── */
@media(max-width: 600px) {
  .btd-section { padding: 40px 16px; }
  .btd-section-title { font-size: 20px; margin-bottom: 28px; }

  /* Steps → single column stacked, no border on mobile */
  .btd-steps { grid-template-columns: 1fr; gap: 0; }
  .btd-step {
    flex-direction: row;
    text-align: left;
    padding: 16px 4px;
    gap: 16px;
    align-items: flex-start;
    border: none;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 0;
    box-shadow: none;
  }
  .btd-step:last-child { border-bottom: none; }
  .btd-step:hover { transform: none; box-shadow: none; }
  .btd-step-num { margin: 0; flex-shrink: 0; width: 40px; height: 40px; font-size: 16px; }
  .btd-step-title { font-size: 14px; margin-bottom: 6px; }
  .btd-step-desc { font-size: 13px; }

  /* Win rule */
  .btd-win-rule { flex-direction: row; gap: 12px; padding: 14px 16px; }
  .btd-win-rule p { font-size: 13px; }

  /* About visual hidden on very small — just show text */
  .btd-about-visual { display: none; }
  .btd-about-text p { font-size: 14px; }

  /* Winners → single column */
  .btd-winners-grid { grid-template-columns: 1fr; gap: 12px; }
  .btd-winner-card { padding: 16px 14px; gap: 12px; }
  .btd-winner-icon { width: 38px; height: 38px; }
  .btd-winner-product { font-size: 13px; }
  .btd-winner-meta { font-size: 11px; }

  /* FAQ touch targets */
  .btd-faq-q { padding: 16px 0; font-size: 14px; }
  .btd-faq-a { font-size: 13px; }
}

/* ═══════ TRUST & LEGAL ═══════ */
.btd-trust-wrap { background: linear-gradient(135deg, #424242, #1B5E20); }
.btd-trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px; }
.btd-trust-item { display: flex; align-items: flex-start; gap: 14px; }
.btd-trust-icon { width: 44px; height: 44px; border-radius: 8px; background: rgba(5,150,105,0.15); border: 1px solid rgba(5,150,105,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btd-trust-title { font-size: 14px; font-weight: 700; color: white; margin: 0 0 4px; }
.btd-trust-desc { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; }

/* ═══════ CONTACT ═══════ */
.btd-contact-wrap { background: #f0fdf4; border-top: 3px solid #2E8B57; }
.btd-contact-inner { max-width: 900px; margin: 0 auto; text-align: center; }
.btd-contact-cards { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 32px; }
.btd-contact-card {
  background: white; border-radius: 12px; padding: 28px 36px;
  border: 1.5px solid #bbf7d0; text-align: center;
  box-shadow: 0 4px 16px rgba(5,150,105,0.08);
  min-width: 220px; transition: transform 0.2s;
}
.btd-contact-card:hover { transform: translateY(-3px); }
.btd-contact-card a { color: #2E8B57; font-weight: 800; font-size: 16px; text-decoration: none; }
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

const LaserBanner = ({ children }) => {
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
      <div className="laser-beam laser-beam-1" />
      <div className="laser-beam laser-beam-2" />
      <div className="laser-beam laser-beam-3" />
      <div className="laser-beam laser-beam-4" />
      <div className="laser-beam laser-beam-5" />
      <div className="laser-beam laser-beam-6" />
      <div className="laser-beam laser-beam-7" />
      <div className="laser-beam laser-beam-8" />

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

      {children && <div style={{ width: '100%', marginTop: '32px', position: 'relative', zIndex: 2 }}>{children}</div>}
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
      className="tender-card-dark"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {!isMultiple && imgSrc && (
        <img src={imgSrc} alt={t.title} loading="lazy" onError={() => setImgIdx(i => i + 1)}
          style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', borderRadius: '12px 12px 0 0' }} />
      )}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Top row: badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#424242', background: '#F5F5F5', padding: '3px 10px', borderRadius: '6px', border: '1px solid #8D6E63' }}>{t.reference_number}</span>
          <span style={{
            fontSize: '11px', fontWeight: 900,
            background: isOpen ? '#f0fdf4' : '#F5F5F5',
            color: isOpen ? '#15803d' : '#64748b',
            padding: isOpen ? '3px 9px' : '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px',
            border: isOpen ? '2px solid #86efac' : '1px solid #8D6E63',
            boxShadow: isOpen ? 'inset 0 0 8px rgba(74, 222, 128, 0.4), 0 0 8px rgba(74, 222, 128, 0.2)' : 'none',
            animation: isOpen ? 'glowBlink 1.2s ease-in-out infinite' : 'none'
          }}>{t.status}</span>
          {t.category && <span style={{ fontSize: '11px', fontWeight: 700, background: '#F5F5F5', color: '#424242', padding: '3px 10px', borderRadius: '6px', border: '1px solid #8D6E63' }}>{t.category}</span>}
          {isOpen && <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'linear-gradient(135deg,#fef3c7,#fde68a)', color:'#92400e', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}><Flame size={10} /><Countdown deadline={t.deadline} /></span>}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1B5E20', margin: 0, lineHeight: 1.25 }}>{t.title}</h3>

        {/* Description */}
        {t.description && <p style={{ color: '#424242', margin: 0, lineHeight: 1.6, fontSize: '13px', fontWeight: 600 }}>{t.description}</p>}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #8D6E63', marginBottom: '16px' }}>
          {isMultiple ? (
            <span style={{ background: '#F5F5F5', color: '#424242', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>📦 {parsedItems.length} Items</span>
          ) : t.item_name ? (
            <span style={{ color: '#424242', fontSize: 12, display:'flex', alignItems:'center', gap:4 }}><Tag size={12} />{t.item_name} × {t.quantity}</span>
          ) : null}
          <span style={{ color: '#424242', fontSize: 12, display:'flex', alignItems:'center', gap:4 }}><Calendar size={12} />{new Date(t.created_at).toLocaleDateString('en-CA')}</span>
          {t.deadline && <span style={{ color: '#424242', fontSize: 12, display:'flex', alignItems:'center', gap:4 }}><Clock size={12} />{new Date(t.deadline).toLocaleDateString('en-CA')}</span>}
          {!isMultiple && <span style={{ fontSize: '15px', fontWeight: 800, color: '#2E8B57', marginLeft: 'auto' }}>{parseFloat(t.starting_bid_price || 0).toLocaleString()} ETB</span>}
        </div>
        <button className="tender-btn" onClick={onClick} style={{
          background: '#1B5E20', color: '#FFFFFF', border: 'none', borderRadius: '8px',
          padding: '12px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          cursor: 'pointer', transition: 'all 0.25s ease', width: '100%', marginTop: 'auto'
        }}
          onMouseOver={e => { e.currentTarget.style.background='#D4AF37'; e.currentTarget.style.color='#1B1B1B'; e.currentTarget.style.boxShadow='0 4px 14px rgba(212,175,55,0.5)'; e.currentTarget.style.transform='translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.background='#1B5E20'; e.currentTarget.style.color='#FFFFFF'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          View Tender Details <ArrowRight size={16} />
        </button>
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
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#2E8B57', margin: 0, lineHeight: 1.1, textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }}>
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#424242', margin: '0 0 8px' }}>
            No Open Tenders Right Now
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.7 }}>
            New tenders are posted regularly. Check back soon or{' '}
            <a href="/contact" style={{ color: '#2E8B57', fontWeight: 600, textDecoration: 'none' }}>
              contact us
            </a>{' '}to be notified when a new one opens.
          </p>
        </div>
      ) : (
        <>
          <div style={{ padding: '60px 24px', background: '#F5F5F5', minHeight: '100vh' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B5E20', margin: 0 }}>Open Tenders</h2>
                <p style={{ fontSize: 13, color: '#424242', margin: '4px 0 0', fontWeight: 600 }}>{filtered.length} tender{filtered.length !== 1 ? 's' : ''} available</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#228B22', fontSize: 13, fontWeight: 700 }}>
                <Flame size={14} /> Live bidding open
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px', width: '100%' }}>
              {filtered.map((t, i) => (
                <TenderCard
                  key={t.id}
                  t={t}
                  index={i}
                  onClick={() => navigate(`/tenders/${t.id}`)}
                />
              ))}
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #228B22', margin: 0 }} />
        </>
      )}

      {/* ─── How Tender Works ─── */}
      <div className="btd-how-wrap btd-section">
        <div className="btd-inner">
          <h2 className="btd-section-title">How the Tender Process Works</h2>
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
            <Gavel size={22} color="#228B22" style={{flexShrink:0, marginTop:2}} />
            <p><strong>Core Winning Rule:</strong> The tender is won by whoever submits the <strong>greatest value offer</strong> before the closing time. No other bidder can see the winning amount until the tender closes. Sutana reserves the right to reject any bid or cancel a tender at its sole discretion. Final sale is not guaranteed until officially confirmed by Sutana.</p>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: 0 }} />

      {/* ─── About Sutana ─── */}
      <div className="btd-about-wrap btd-section">
        <div className="btd-inner">
          <div className="btd-about-grid">
            <div className="btd-about-visual">
              <div style={{textAlign:'center'}}>
                <div style={{width:88,height:88,borderRadius:'50%',background:'#1B5E20',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 28px rgba(27,94,32,0.25)'}}>
                  <Gavel size={40} color="white" />
                </div>
                <div style={{fontSize:15,fontWeight:800,color:'#424242'}}>Sutana Products Marketplace</div>
                <div style={{fontSize:12,color:'#2E8B57',marginTop:4,fontWeight:600}}>Trusted Supplier Since 2010</div>
              </div>
            </div>
            <div className="btd-about-text">
              <h2 className="btd-section-title" style={{marginBottom:16}}>Who We Are</h2>
              <p>Sutana is a premier Ethiopian supplier offering a wide range of quality products through a transparent competitive tendering process.</p>
              <p>Our tender marketplace gives businesses and individuals access to certified, quality-checked items at fair, market-driven prices — determined by open competition, not fixed pricing.</p>
            </div>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: 0 }} />

      {/* ─── Past Winners ─── */}
      <div className="btd-winners-wrap btd-section">
        <div className="btd-inner">
          <h2 className="btd-section-title">Past Winning Tenders</h2>
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
          <p style={{fontSize:12,color:'#9e9e9e',marginTop:20,textAlign:'center'}}>* Winner identities are kept private. Only product and winning offer value are displayed.</p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: 0 }} />

      {/* ─── FAQs ─── */}
      <div className="btd-faq-wrap btd-section">
        <div className="btd-faq-inner">
          <h2 className="btd-section-title">Frequently Asked Questions</h2>
          {FAQS.map((f,i) => (
            <div className="btd-faq-item" key={i}>
              <button className="btd-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                {openFaq === i
                  ? <ChevronUp size={18} color="#1B5E20" style={{flexShrink:0}} />
                  : <ChevronDown size={18} color="#9e9e9e" style={{flexShrink:0}} />}
              </button>
              <div className={`btd-faq-a ${openFaq === i ? 'open' : ''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>



    </div>
  );
};
