import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import pharmacyService from '../../services/pharmacyService';
import axios from '../../services/apiClient';
import { Search, Pill, XCircle, AlertTriangle, CheckCircle2, MapPin, Package, UploadCloud, X, ShoppingCart, Zap, ChevronDown, ChevronUp, Phone, Clock, Star, Shield, Award, Truck, CreditCard, FileText, Users, HelpCircle, AlertCircle, Heart } from 'lucide-react';
import pharmacyHero from '../../assets/hero-section/pharmacy.jpg';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmerAnim { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

.php-root {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

/* Hero */
.php-hero {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 420px;
  background: linear-gradient(rgba(26,43,75,0.75), rgba(13,124,102,0.7));
  background-size: cover;
  background-position: center;
}
.php-hero-orbs { position: absolute; inset: 0; overflow: hidden; }
.php-hero-orb1 {
  position: absolute; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%);
  top: -150px; right: -100px;
}
.php-hero-orb2 {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 70%);
  bottom: -100px; left: -50px;
}
.php-hero-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
.php-hero-content {
  position: relative; z-index: 10;
  width: 100%; padding: 0 24px;
  height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  box-sizing: border-box;
}
.php-hero-title {
  font-size: clamp(36px, 5vw, 58px); font-weight: 900; color: #FFD700;
  margin: 0 0 32px; line-height: 1.1; letter-spacing: -1px;
  text-shadow: 0 0 30px rgba(255,215,0,0.35);
  text-align: center;
}
/* Hero search bar */
.php-hero-search {
  display: flex; align-items: center; gap: 0;
  border: 1.5px solid rgba(255,255,255,0.5);
  border-radius: 0;
  overflow: hidden;
  max-width: 560px;
  width: 100%;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
}
.php-hero-search input {
  flex: 1; border: none; outline: none;
  background: transparent; color: white;
  font-size: 15px; padding: 14px 20px;
  font-family: inherit;
}
.php-hero-search input::placeholder { color: rgba(255,255,255,0.6); }
.php-hero-search button {
  background: rgba(255,255,255,0.15); color: white;
  border: none; border-left: 1.5px solid rgba(255,255,255,0.4);
  padding: 14px 24px; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit; border-radius: 0;
  transition: background 0.2s;
}
.php-hero-search button:hover { background: rgba(255,255,255,0.28); }

/* Toolbar */
.php-toolbar {
  background: white; border-bottom: 1px solid #e4e6ea;
  padding: 14px 0; position: sticky; top: 68px;
  z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.php-toolbar-inner {
  width: 100%; padding: 0 24px;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  box-sizing: border-box;
}
.php-search {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px; background: #f8fafc;
  border: 1.5px solid #e2e8f0; border-radius: 0;
  flex: 1; max-width: 380px; transition: all 0.2s;
  margin-left: auto;
}
.php-search:focus-within { border-color: #10b981; background: white; }
.php-search input { border: none; outline: none; flex: 1; font-size: 13px; color: #0f172a; background: transparent; font-family: inherit; }
.php-cat-pill {
  padding: 7px 18px; border-radius: 0; border: 1.5px solid #e2e8f0;
  cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all 0.2s; background: #f8fafc; color: #64748b; font-family: inherit;
}
.php-cat-pill:hover { background: #e2e8f0; color: #334155; }
.php-cat-pill.active { background: linear-gradient(135deg,#10b981,#059669); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

/* Main */
.php-main { max-width: 1440px; margin: 0 auto; padding: 32px 24px 100px; }

/* Grid */
.php-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.php-card {
  background: white; border-radius: 0; overflow: hidden;
  border: 1px solid #e4e6ea; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column;
  animation: fadeUp 0.4s both;
}
.php-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #bbf7d0; }
.php-card-img-wrap {
  position: relative; overflow: hidden; aspect-ratio: 4/3;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  display: flex; align-items: stretch; justify-content: center;
}
.php-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; cursor: pointer; }
.php-card:hover .php-card-img { transform: scale(1.06); }
.php-card-badge {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(6px);
  padding: 4px 12px; border-radius: 0;
  font-size: 11px; font-weight: 700; color: #0f172a; letter-spacing: 0.3px;
}
.php-card-oos {
  position: absolute; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: white; letter-spacing: 1px;
}
.php-card-rx {
  position: absolute; top: 12px; right: 12px;
  background: rgba(239,68,68,0.9); color: white;
  padding: 3px 10px; border-radius: 0;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
}
.php-card-body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
.php-card-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 4px; line-height: 1.4; }
.php-card-generic { font-size: 12px; color: #64748b; margin: 0 0 8px; font-style: italic; }
.php-card-desc { font-size: 12px; color: #64748b; margin: 0 0 8px; line-height: 1.5; flex: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.php-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.php-price { font-size: 18px; font-weight: 800; color: #059669; }
.php-price-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.php-stock-in { color: #059669; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
.php-stock-low { color: #d97706; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
.php-stock-out { color: #dc2626; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
.php-order-btn {
  background: linear-gradient(135deg,#0f172a,#1e293b); color: white;
  border: none; padding: 10px 14px; border-radius: 0;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  font-weight: 700; font-size: 13px; transition: all 0.2s; font-family: inherit;
  white-space: nowrap;
}
.php-order-btn:hover:not(:disabled) { background: linear-gradient(135deg,#10b981,#059669); transform: scale(1.03); }
.php-order-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Shimmer */
.php-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 600px 100%; animation: shimmerAnim 1.5s infinite;
  border-radius: 0; height: 320px;
}

/* Locations */
.php-locations { max-width: 1440px; margin: 0 auto; padding: 0 24px 60px; }
.php-locations-title {
  font-size: 18px; font-weight: 700; color: #0f172a;
  margin: 0 0 20px; display: flex; align-items: center; gap: 8px;
}
.php-loc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.php-loc-card {
  background: white; border-radius: 0; overflow: hidden;
  border: 1px solid #e4e6ea; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.25s;
}
.php-loc-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(16,185,129,0.12); }
.php-loc-img { width: 100%; height: 160px; object-fit: cover; }
.php-loc-body { padding: 16px 20px; }
.php-loc-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 8px; display: flex; align-items: center; gap: 6px; }
.php-loc-detail { font-size: 13px; color: #64748b; line-height: 1.7; }

/* Modal */
.php-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15,23,42,0.6); display: flex;
  align-items: flex-start; justify-content: center;
  z-index: 9999; padding: 60px 20px; overflow-y: auto;
}
.php-modal {
  background: white; border-radius: 0; width: 100%;
  max-width: 500px; margin: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
}
.php-modal-header {
  padding: 24px; border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between;
  background: #f8fafc; border-radius: 0;
}
.php-modal-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #0f172a; }
.php-close-btn {
  background: transparent; border: none; color: #64748b;
  cursor: pointer; display: flex; align-items: center;
  padding: 8px; border-radius: 0; transition: all 0.2s;
}
.php-close-btn:hover { background: #e2e8f0; color: #0f172a; }
.php-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.php-form-group { display: flex; flex-direction: column; gap: 8px; }
.php-form-group label { font-weight: 700; font-size: 0.9rem; color: #1e293b; }
.php-form-input {
  padding: 12px 16px; border: 2px solid #e2e8f0; width: 100%; box-sizing: border-box;
  border-radius: 0; font-size: 1rem; background: white;
  color: #0f172a; transition: all 0.2s; font-family: inherit; outline: none;
}
.php-form-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
.php-form-input:disabled { background: #f8fafc; color: #64748b; cursor: not-allowed; }
.php-file-upload {
  border: 2px dashed #cbd5e1; border-radius: 0; padding: 24px;
  text-align: center; cursor: pointer; transition: all 0.3s; background: #f8fafc;
}
.php-file-upload:hover { border-color: #10b981; background: #f0fdf4; }
.php-modal-footer {
  padding: 20px 24px; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 12px;
  background: #f8fafc; border-radius: 0;
}
.php-cancel-btn {
  padding: 12px 24px; background: white; border: 2px solid #e2e8f0;
  border-radius: 0; color: #475569; font-weight: 700;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.php-cancel-btn:hover { background: #f1f5f9; }
.php-submit-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none; border-radius: 0; color: white;
  font-weight: 700; cursor: pointer; display: flex;
  align-items: center; gap: 8px; transition: all 0.2s;
  font-family: inherit;
}
.php-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
.php-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ═══════ ADVISORY BANNER ═══════ */
.php-advisory {
  background: linear-gradient(90deg, #065f46, #047857);
  color: white; padding: 12px 24px;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  font-size: 13px; font-weight: 600; position: relative;
}
.php-advisory-close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.15); border: none; color: white;
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  transition: background 0.2s;
}
.php-advisory-close:hover { background: rgba(255,255,255,0.3); }

/* ═══════ HOW TO ORDER ═══════ */
.php-how { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 72px 24px; }
.php-how-inner { max-width: 1100px; margin: 0 auto; }
.php-section-label { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #10b981; margin: 0 0 12px; }
.php-section-title { font-size: clamp(24px, 4vw, 40px); font-weight: 900; margin: 0 0 48px; color: white; line-height: 1.2; }
.php-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; }
.php-step {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 32px 24px; text-align: center; position: relative;
  transition: transform 0.25s, border-color 0.25s;
}
.php-step:hover { transform: translateY(-6px); border-color: rgba(16,185,129,0.4); }
.php-step-num {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white; font-size: 22px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(16,185,129,0.35);
}
.php-step-title { font-size: 15px; font-weight: 700; color: white; margin: 0 0 10px; }
.php-step-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; }
.php-delivery-info {
  margin-top: 48px; padding: 24px 32px;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
  border-radius: 12px; display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap;
}
.php-delivery-info-item { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 200px; }
.php-delivery-info-item p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6; }
.php-delivery-info-item strong { display: block; font-size: 14px; color: white; margin-bottom: 4px; }

/* ═══════ ABOUT ═══════ */
.php-about { padding: 80px 24px; background: #fff; }
.php-about-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
@media(max-width:768px){ .php-about-inner { grid-template-columns: 1fr; } }
.php-about-visual {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 20px; padding: 48px; display: flex; align-items: center; justify-content: center;
  min-height: 300px; position: relative; overflow: hidden;
}
.php-about-visual::before {
  content: ''; position: absolute; width: 250px; height: 250px;
  background: radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%);
  top: -50px; right: -50px;
}
.php-about-text .php-section-title { color: #0f172a; }
.php-about-text p { color: #64748b; line-height: 1.8; margin: 0 0 20px; font-size: 15px; }
.php-about-stat-row { display: flex; gap: 32px; margin-top: 32px; flex-wrap: wrap; }
.php-about-stat { text-align: center; }
.php-about-stat-num { font-size: 32px; font-weight: 900; color: #059669; line-height: 1; }
.php-about-stat-lbl { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

/* ═══════ TEAM ═══════ */
.php-team { padding: 72px 24px; background: #f8fafc; }
.php-team-inner { max-width: 1100px; margin: 0 auto; }
.php-team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
.php-team-card {
  background: white; border-radius: 16px; overflow: hidden;
  border: 1px solid #e4e6ea; text-align: center; padding-bottom: 24px;
  transition: transform 0.25s, box-shadow 0.25s;
}
.php-team-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
.php-team-avatar {
  width: 100%; height: 180px;
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.php-team-avatar img { width: 100%; height: 100%; object-fit: cover; }
.php-team-name { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
.php-team-role { font-size: 12px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; }
.php-team-bio { font-size: 12px; color: #64748b; padding: 0 16px; line-height: 1.6; margin: 0; }

/* ═══════ TESTIMONIALS ═══════ */
.php-reviews { padding: 72px 24px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); }
.php-reviews-inner { max-width: 1100px; margin: 0 auto; }
.php-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.php-review-card {
  background: white; border-radius: 16px; padding: 28px;
  border: 1px solid #d1fae5; box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transition: transform 0.25s;
}
.php-review-card:hover { transform: translateY(-4px); }
.php-stars { display: flex; gap: 3px; margin-bottom: 16px; }
.php-review-text { font-size: 14px; color: #334155; line-height: 1.7; margin: 0 0 20px; font-style: italic; }
.php-reviewer { display: flex; align-items: center; gap: 12px; }
.php-reviewer-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 800; font-size: 16px; flex-shrink: 0;
}
.php-reviewer-name { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.php-reviewer-date { font-size: 11px; color: #94a3b8; margin: 0; }

/* ═══════ EMERGENCY ═══════ */
.php-emergency {
  background: linear-gradient(135deg, #7f1d1d, #991b1b);
  padding: 48px 24px; text-align: center;
}
.php-emergency-inner { max-width: 900px; margin: 0 auto; }
.php-emergency h2 { font-size: clamp(20px, 3.5vw, 32px); font-weight: 900; color: white; margin: 0 0 12px; }
.php-emergency p { color: rgba(255,255,255,0.8); font-size: 15px; margin: 0 0 28px; }
.php-emergency-contacts { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
.php-emergency-btn {
  display: flex; align-items: center; gap: 10px;
  background: white; color: #991b1b;
  border: none; border-radius: 8px;
  padding: 14px 28px; font-size: 16px; font-weight: 800;
  cursor: pointer; text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.php-emergency-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.php-emergency-btn.secondary {
  background: rgba(255,255,255,0.1); color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

/* ═══════ PAYMENTS ═══════ */
.php-payments { background: white; padding: 56px 24px; border-top: 1px solid #e4e6ea; }
.php-payments-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
.php-payments h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.php-payments-sub { font-size: 14px; color: #64748b; margin: 0 0 36px; }
.php-payments-grid { display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; }
.php-pay-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 24px; border-radius: 8px;
  border: 2px solid #e4e6ea; background: #f8fafc;
  font-size: 14px; font-weight: 700; color: #334155;
  transition: border-color 0.2s, background 0.2s;
}
.php-pay-chip:hover { border-color: #10b981; background: #f0fdf4; }
.php-pay-chip-icon { font-size: 20px; }

/* ═══════ PARTNERS ═══════ */
.php-partners { background: #f8fafc; padding: 56px 24px; border-top: 1px solid #e4e6ea; }
.php-partners-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
.php-partners h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.php-partners-sub { font-size: 14px; color: #64748b; margin: 0 0 36px; }
.php-partners-grid { display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; }
.php-partner-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 28px; border-radius: 10px;
  border: 2px solid #e4e6ea; background: white;
  font-size: 14px; font-weight: 700; color: #334155;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.php-partner-chip:hover { border-color: #10b981; box-shadow: 0 4px 16px rgba(16,185,129,0.15); }

/* ═══════ FAQ ═══════ */
.php-faq { padding: 72px 24px; background: white; }
.php-faq-inner { max-width: 800px; margin: 0 auto; }
.php-faq-item { border-bottom: 1px solid #e4e6ea; }
.php-faq-q {
  width: 100%; text-align: left; background: none; border: none;
  padding: 20px 0; display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; font-weight: 700; color: #0f172a; cursor: pointer;
  gap: 16px; font-family: inherit; transition: color 0.2s;
}
.php-faq-q:hover { color: #059669; }
.php-faq-a {
  overflow: hidden; max-height: 0;
  transition: max-height 0.35s ease, padding 0.35s ease;
  font-size: 14px; color: #64748b; line-height: 1.8;
  padding: 0;
}
.php-faq-a.open { max-height: 300px; padding-bottom: 20px; }

/* ═══════ TRUST BAR ═══════ */
.php-trust { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 24px; }
.php-trust-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
.php-trust-item { display: flex; align-items: flex-start; gap: 14px; }
.php-trust-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.php-trust-title { font-size: 14px; font-weight: 700; color: white; margin: 0 0 4px; }
.php-trust-desc { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; }

/* ═══════ DISCLAIMER ═══════ */
.php-disclaimer {
  background: #fefce8; border-top: 3px solid #fbbf24;
  padding: 20px 24px; text-align: center;
}
.php-disclaimer p { max-width: 900px; margin: 0 auto; font-size: 12px; color: #92400e; line-height: 1.7; }
.php-disclaimer strong { color: #78350f; }
`;

const imgSrc = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : 'http://localhost:5000' + url;
};

const PharmacyHealthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Description & Image Modal state
  const [advisoryOpen, setAdvisoryOpen] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes, branchRes] = await Promise.all([
          pharmacyService.getCategories(),
          pharmacyService.getProducts(),
          pharmacyService.getBranches()
        ]);
        if (catRes.status === 'success') setCategories(catRes.data.filter(c => c.is_active));
        if (prodRes.status === 'success') setAllProducts(prodRes.data.filter(p => p.is_active));
        if (branchRes.status === 'success') setBranches(branchRes.data.filter(b => b.is_active));
      } catch (error) {
        console.error('Failed to fetch public pharmacy data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    if (location.state?.refillMedicine && authService.isAuthenticated()) {
      setSelectedMedicine(location.state.refillMedicine);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const filtered = allProducts.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || String(p.category_id) === String(catFilter);
    return matchSearch && matchCat;
  });

  const handleRequestRefill = (medicine) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/pharmacy', refillMedicine: medicine } });
    } else {
      setSelectedMedicine(medicine);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitSuccess(false);
    setSubmitError('');
    setRefillQuantity(1);
    setDeliveryOption('pickup');
    setDeliveryAddress('');
    setPrescriptionFile(null);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('medication_id', selectedMedicine.id);
      formData.append('quantity', refillQuantity);
      formData.append('delivery_option', deliveryOption);
      if (deliveryOption === 'delivery') formData.append('delivery_address', deliveryAddress);
      if (prescriptionFile) formData.append('prescription_image', prescriptionFile);
      await axios.post('/pharmacy/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitSuccess(true);
      setTimeout(() => closeModal(), 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed renderStock function as per user request to hide internal stock text

  const FAQS = [
    { q: 'Do I need a prescription for all medications?', a: 'No. Many over-the-counter medications can be ordered without a prescription. However, some controlled or prescription-only drugs require a valid prescription uploaded during checkout or presented at pickup.' },
    { q: 'What are your delivery areas and fees?', a: 'We currently deliver within Addis Ababa and surrounding areas. Delivery fee is 50 ETB flat within city limits. Free delivery for orders above 500 ETB. Rural deliveries may take 2–3 extra days.' },
    { q: 'How long does it take to process my order?', a: 'Standard orders are processed within 2–4 hours during business hours. Home delivery takes 3–6 hours. Pickup orders are usually ready within 1 hour.' },
    { q: 'Can I return or exchange a medication?', a: 'For safety reasons, medications cannot be returned once dispensed. If you received a wrong item, contact us within 24 hours and we will resolve the issue immediately.' },
    { q: 'What happens if my prescribed drug is out of stock?', a: 'Our pharmacist will contact you to suggest a suitable alternative or notify you when the item is back in stock. You will not be charged until the order is fulfilled.' },
    { q: 'Do you accept health insurance?', a: 'Yes. We work with several insurance providers including CBHI, Nyala Insurance, and Awash Insurance. Bring your insurance card to our branch or upload a photo during checkout.' },
  ];

  const TEAM = [
    { name: 'Dr. Fikerte Haile', role: 'Chief Pharmacist', bio: 'B.Pharm, MSc. 12 years of clinical experience in pharmaceutical care and patient safety.', initials: 'FH', color: '#059669' },
    { name: 'Abebe Girma', role: 'Senior Pharmacist', bio: 'B.Pharm. Specialist in chronic disease medication management and patient counselling.', initials: 'AG', color: '#0891b2' },
    { name: 'Meron Tesfaye', role: 'Pharmacist', bio: 'B.Pharm. Focused on paediatric medications and women\'s health pharmaceutical care.', initials: 'MT', color: '#7c3aed' },
    { name: 'Dawit Bekele', role: 'Pharmacy Technician', bio: 'Experienced in dispensing, inventory management, and compounding medications.', initials: 'DB', color: '#d97706' },
  ];

  const REVIEWS = [
    { text: 'Fast delivery and the staff was very professional. My prescription was handled with care and they even called to confirm the dosage.', name: 'Selamawit T.', date: 'June 2025', rating: 5, initial: 'S' },
    { text: 'I love that I can order refills online. No more waiting in long queues. The app notifies me when my order is ready!', name: 'Bereket M.', date: 'May 2025', rating: 5, initial: 'B' },
    { text: 'Very affordable prices compared to other pharmacies. The MOH licensed badge gives me full confidence in the quality.', name: 'Hana G.', date: 'July 2025', rating: 4, initial: 'H' },
  ];

  return (
    <div className="php-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ── Health Advisory Banner ── */}
      {advisoryOpen && (
        <div className="php-advisory">
          <AlertCircle size={16} />
          <span>⚕️ <strong>Health Advisory:</strong> Flu season is here — consult our pharmacists for vaccinations and preventive care.</span>
          <button className="php-advisory-close" onClick={() => setAdvisoryOpen(false)}>×</button>
        </div>
      )}

      {/* Hero */}
      <div className="php-hero" style={{ backgroundImage: `linear-gradient(rgba(26,43,75,0.75), rgba(13,124,102,0.7)), url(${pharmacyHero})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="php-hero-orbs">
          <div className="php-hero-orb1" />
          <div className="php-hero-orb2" />
        </div>
        <div className="php-hero-grid" />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', padding: '0 24px' }}>
          <h1 className="php-hero-title">Sutana Pharmacy &amp; Health</h1>
          <div className="php-hero-search">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(search)}
              placeholder="Search medications by name or category..."
            />
            <button type="button" onClick={() => setSearch(search)}>Search</button>
          </div>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <div className="php-toolbar">
        <div className="php-toolbar-inner">
          <button className={'php-cat-pill' + (catFilter === 'all' ? ' active' : '')} onClick={() => setCatFilter('all')}>All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={'php-cat-pill' + (String(catFilter) === String(c.id) ? ' active' : '')}
              onClick={() => setCatFilter(String(catFilter) === String(c.id) ? 'all' : String(c.id))}
            >
              {c.name}
            </button>
          ))}

        </div>
      </div>

      {/* Product Grid */}
      <div className="php-main">
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {catFilter === 'all' ? 'All Medications' : categories.find(c => String(c.id) === catFilter)?.name || 'Medications'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
            <Pill size={15} /> Sutana Pharmacy
          </div>
        </div>

        {loading ? (
          <div className="php-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="php-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <Package size={56} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>No medications found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Try a different search term or category.</p>
          </div>
        ) : (
          <div className="php-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className="php-card" style={{ animationDelay: i * 0.05 + 's' }}>
                <div className="php-card-img-wrap" style={{ display: 'flex' }}>
                  {p.drug_image && p.cover_image ? (
                    <>
                      <img src={imgSrc(p.drug_image)} className="php-card-img" style={{ width: '50%' }} alt={p.name} onClick={(e) => { e.stopPropagation(); setPreviewImage(imgSrc(p.drug_image)); }} />
                      <img src={imgSrc(p.cover_image)} className="php-card-img" style={{ width: '50%', borderLeft: '1px solid white' }} alt={p.name} onClick={(e) => { e.stopPropagation(); setPreviewImage(imgSrc(p.cover_image)); }} />
                    </>
                  ) : imgSrc(p.drug_image || p.cover_image) ? (
                    <img src={imgSrc(p.drug_image || p.cover_image)} className="php-card-img" style={{ width: '100%' }} alt={p.name} onClick={(e) => { e.stopPropagation(); setPreviewImage(imgSrc(p.drug_image || p.cover_image)); }} />
                  ) : (
                    <Package size={44} color="#cbd5e1" style={{ alignSelf: 'center' }} />
                  )}
                </div>
                <div className="php-card-body">
                  <h3 className="php-card-name">{p.name}</h3>
                  {p.description && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p className="php-card-desc">{p.description}</p>
                    </div>
                  )}
                  <div className="php-card-footer">
                    <div>
                      <div className="php-price">{parseFloat(p.price || 0).toLocaleString()} ETB</div>
                    </div>
                    <button
                      className="php-order-btn"
                      onClick={(e) => { e.stopPropagation(); handleRequestRefill(p); }}
                    >
                      <ShoppingCart size={15} /> Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pharmacy Locations */}
      {branches.length > 0 && (
        <div className="php-locations">
          <h2 className="php-locations-title"><MapPin size={20} color="#10b981" /> Our Pharmacy Locations</h2>
          <div className="php-loc-grid">
            {branches.map(branch => (
              <div className="php-loc-card" key={branch.id}>
                {branch.cover_image && <img src={`http://localhost:5000${branch.cover_image}`} alt={branch.name} className="php-loc-img" />}
                <div className="php-loc-body">
                  <h3 className="php-loc-name"><MapPin size={16} color="#10b981" /> {branch.name}</h3>
                  <div className="php-loc-detail">
                    <strong>Address:</strong> {branch.address}<br />
                    <strong>Phone:</strong> {branch.phone}<br />
                    <strong>Hours:</strong> {branch.working_hours}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Emergency / On-Call ── */}
      <div className="php-emergency">
        <div className="php-emergency-inner">
          <h2>🚨 24/7 Emergency Pharmacist On-Call</h2>
          <p>Our pharmacists are available around the clock for urgent consultations, emergency medication needs, and after-hours advice.</p>
          <div className="php-emergency-contacts">
            <a href="tel:+251911000000" className="php-emergency-btn">
              <Phone size={20} /> +251 911 000 000
            </a>
            <a href="tel:+251922000000" className="php-emergency-btn secondary">
              <Phone size={20} /> +251 922 000 000
            </a>
          </div>
        </div>
      </div>

      {/* ── How to Order ── */}
      <div className="php-how">
        <div className="php-how-inner">
          <p className="php-section-label">Simple Process</p>
          <h2 className="php-section-title">How to Order &amp; Delivery Policy</h2>
          <div className="php-steps">
            {[
              { n: '1', title: 'Browse & Search', desc: 'Find your medication by name or category from our live catalog.' },
              { n: '2', title: 'Place Your Order', desc: 'Add quantity, choose pickup or delivery, and optionally upload your prescription.' },
              { n: '3', title: 'We Prepare & Verify', desc: 'Our licensed pharmacist verifies your order and prepares it safely.' },
              { n: '4', title: 'Pickup or Delivery', desc: 'Collect from your nearest branch or receive it at your doorstep.' },
            ].map(s => (
              <div className="php-step" key={s.n}>
                <div className="php-step-num">{s.n}</div>
                <h3 className="php-step-title">{s.title}</h3>
                <p className="php-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="php-delivery-info">
            <div className="php-delivery-info-item"><Truck size={24} color="#10b981" style={{flexShrink:0}} /><div><strong>Delivery Areas</strong><p>Addis Ababa & surrounding regions. 3–6 hrs standard delivery. Rural: 2–3 extra days.</p></div></div>
            <div className="php-delivery-info-item"><CreditCard size={24} color="#10b981" style={{flexShrink:0}} /><div><strong>Delivery Fee</strong><p>Flat 50 ETB within city limits. Free delivery on orders above 500 ETB.</p></div></div>
            <div className="php-delivery-info-item"><Clock size={24} color="#10b981" style={{flexShrink:0}} /><div><strong>Operating Hours</strong><p>Mon – Sat: 7:00 AM – 9:00 PM. Sunday: 9:00 AM – 5:00 PM. 24/7 On-Call available.</p></div></div>
          </div>
        </div>
      </div>

      {/* ── About Us ── */}
      <div className="php-about">
        <div className="php-about-inner">
          <div className="php-about-visual">
            <div style={{textAlign:'center',position:'relative',zIndex:1}}>
              <div style={{width:120,height:120,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 16px 40px rgba(16,185,129,0.35)'}}>
                <Heart size={52} color="white" />
              </div>
              <div style={{fontSize:18,fontWeight:800,color:'#065f46'}}>Trusted Since 2010</div>
              <div style={{fontSize:13,color:'#059669',marginTop:4}}>MOH Licensed Pharmacy</div>
            </div>
          </div>
          <div className="php-about-text">
            <p className="php-section-label">Who We Are</p>
            <h2 className="php-section-title" style={{color:'#0f172a'}}>Ethiopia's Trusted Pharmaceutical Partner</h2>
            <p>Sutana Pharmacy & Health has been serving communities across Ethiopia since 2010. Our mission is to make quality, affordable healthcare accessible to everyone — from essential everyday medications to specialized pharmaceutical care.</p>
            <p>We operate under the direct supervision of licensed pharmacists and comply fully with the Ethiopian Food and Drug Authority (EFDA) standards and Ministry of Health (MOH) regulations.</p>
            <div className="php-about-stat-row">
              {[{n:'15+',l:'Years of Service'},{n:'5',l:'Branch Locations'},{n:'50,000+',l:'Patients Served'},{n:'24/7',l:'On-Call Support'}].map(s=>(
                <div className="php-about-stat" key={s.l}>
                  <div className="php-about-stat-num">{s.n}</div>
                  <div className="php-about-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Our Pharmacists ── */}
      <div className="php-team">
        <div className="php-team-inner">
          <p className="php-section-label" style={{color:'#10b981'}}>Our Experts</p>
          <h2 className="php-section-title" style={{color:'#0f172a',marginBottom:32}}>Meet Our Licensed Pharmacists</h2>
          <div className="php-team-grid">
            {TEAM.map(m => (
              <div className="php-team-card" key={m.name}>
                <div className="php-team-avatar" style={{background:`linear-gradient(135deg,${m.color}22,${m.color}44)`}}>
                  <div style={{width:80,height:80,borderRadius:'50%',background:m.color,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:28,fontWeight:900}}>{m.initials}</div>
                </div>
                <p className="php-team-name">{m.name}</p>
                <p className="php-team-role">{m.role}</p>
                <p className="php-team-bio">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Patient Reviews ── */}
      <div className="php-reviews">
        <div className="php-reviews-inner">
          <p className="php-section-label">Testimonials</p>
          <h2 className="php-section-title" style={{color:'#0f172a',marginBottom:32}}>What Our Patients Say</h2>
          <div className="php-reviews-grid">
            {REVIEWS.map(r => (
              <div className="php-review-card" key={r.name}>
                <div className="php-stars">{[...Array(5)].map((_,i)=><Star key={i} size={16} fill={i<r.rating?'#fbbf24':'none'} color={i<r.rating?'#fbbf24':'#cbd5e1'} />)}</div>
                <p className="php-review-text">"{r.text}"</p>
                <div className="php-reviewer">
                  <div className="php-reviewer-avatar">{r.initial}</div>
                  <div><p className="php-reviewer-name">{r.name}</p><p className="php-reviewer-date">{r.date}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Insurance & Partners ── */}
      <div className="php-partners">
        <div className="php-partners-inner">
          <h2>Insurance Partners &amp; Trusted Suppliers</h2>
          <p className="php-partners-sub">We work with leading insurance providers and pharmaceutical suppliers to guarantee quality and affordability.</p>
          <div className="php-partners-grid">
            {['CBHI Insurance','Nyala Insurance','Awash Insurance','Lucy Insurance','Abbay Insurance'].map(p=>(
              <div className="php-partner-chip" key={p}><Shield size={18} color="#10b981"/>{p}</div>
            ))}
          </div>
          <div style={{marginTop:24,borderTop:'1px solid #e4e6ea',paddingTop:24}}>
            <p style={{fontSize:13,color:'#64748b',textAlign:'center',marginBottom:16,fontWeight:600}}>EFDA-Approved Supplier Brands</p>
            <div className="php-partners-grid">
              {['Almiral Pharma','Ethiopian Pharmaceuticals','Cadila Healthcare','Africa Pharma','BioTech Supply'].map(b=>(
                <div className="php-partner-chip" key={b}><Award size={18} color="#0891b2"/>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="php-payments">
        <div className="php-payments-inner">
          <h2>Accepted Payment Methods</h2>
          <p className="php-payments-sub">Pay securely using your preferred method at pickup or on delivery.</p>
          <div className="php-payments-grid">
            {[
              {icon:'💵', label:'Cash on Pickup'},
              {icon:'💳', label:'Visa / Mastercard'},
              {icon:'📱', label:'Telebirr'},
              {icon:'🏦', label:'CBE Birr'},
              {icon:'📲', label:'Amole'},
              {icon:'🧾', label:'Insurance Direct Billing'},
            ].map(m=>(
              <div className="php-pay-chip" key={m.label}><span className="php-pay-chip-icon">{m.icon}</span>{m.label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div className="php-faq">
        <div className="php-faq-inner">
          <p className="php-section-label">Got Questions?</p>
          <h2 className="php-section-title" style={{color:'#0f172a',marginBottom:32}}>Frequently Asked Questions</h2>
          {FAQS.map((f,i)=>(
            <div className="php-faq-item" key={i}>
              <button className="php-faq-q" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                <span>{f.q}</span>
                {openFaq===i ? <ChevronUp size={18} color="#059669" style={{flexShrink:0}}/> : <ChevronDown size={18} color="#64748b" style={{flexShrink:0}}/>}
              </button>
              <div className={`php-faq-a ${openFaq===i?'open':''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Bar (License & Certifications) ── */}
      <div className="php-trust">
        <div className="php-trust-inner">
          {[
            {Icon:Shield,title:'MOH Licensed',desc:'License No. ETH/MOH/PH-2024-00451. Fully accredited by the Ethiopian Ministry of Health.'},
            {Icon:Award,title:'EFDA Certified',desc:'All medications sourced from Ethiopian Food & Drug Authority approved suppliers only.'},
            {Icon:FileText,title:'Privacy Protected',desc:'Your health data is confidential and secured in compliance with Ethiopian data privacy laws.'},
            {Icon:CheckCircle2,title:'Verified Pharmacists',desc:'Every dispensing pharmacist holds a valid B.Pharm degree and a current professional license.'},
          ].map(({Icon,...t})=>(
            <div className="php-trust-item" key={t.title}>
              <div className="php-trust-icon"><Icon size={20} color="#10b981"/></div>
              <div><p className="php-trust-title">{t.title}</p><p className="php-trust-desc">{t.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Medical Disclaimer ── */}
      <div className="php-disclaimer">
        <p><strong>⚕️ Medical Disclaimer:</strong> The information provided on this page is for general informational and educational purposes only. It is not intended as, and shall not be understood or construed as, professional medical advice. Always consult a qualified healthcare professional before starting any medication. Sutana Pharmacy & Health is not liable for any decisions made based on the content of this page. | <strong>Terms of Use</strong> | <strong>Privacy Policy</strong> | <strong>MOH License No. ETH/MOH/PH-2024-00451</strong></p>
      </div>

      {/* Order Modal */}
      {isModalOpen && selectedMedicine && (
        <div className="php-overlay" onClick={closeModal}>
          <div className="php-modal" onClick={e => e.stopPropagation()}>
            <div className="php-modal-header">
              <h3 className="php-modal-title">💊 Place Order</h3>
              <button className="php-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>

            {submitSuccess ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px' }}>Order Submitted!</h3>
                <p style={{ color: '#64748b', margin: 0 }}>Please pay and pick up your order. Track it in <strong>My Account → Orders</strong>.</p>
              </div>
            ) : (
              <form onSubmit={handleRefillSubmit}>
                <div className="php-modal-body">
                  {/* Pre-filled User Details */}
                  {authService.getCurrentUser() && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '0', border: '1px solid #e2e8f0' }}>
                      <div className="php-form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Customer Name</label>
                        <input type="text" className="php-form-input" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} value={authService.getCurrentUser().full_name || authService.getCurrentUser().name || `${authService.getCurrentUser().first_name || ''} ${authService.getCurrentUser().last_name || ''}`.trim() || 'Guest'} disabled />
                      </div>
                      <div className="php-form-group">
                        <label>Email</label>
                        <input type="email" className="php-form-input" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} value={authService.getCurrentUser().email || ''} disabled />
                      </div>
                      <div className="php-form-group">
                        <label>Phone</label>
                        <input type="text" className="php-form-input" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} value={authService.getCurrentUser().phone || ''} disabled />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="php-form-group">
                      <label>Medication</label>
                      <input type="text" className="php-form-input" style={{ background: '#f1f5f9', color: '#475569' }} value={selectedMedicine.name} disabled />
                    </div>
                    <div className="php-form-group">
                      <label>Amount (Quantity)</label>
                      <input type="number" className="php-form-input" min="1" value={refillQuantity} onChange={e => setRefillQuantity(e.target.value)} required />
                    </div>
                  </div>

                  <div className="php-form-group">
                    <label>Delivery Option</label>
                    <select className="php-form-input" value={deliveryOption} onChange={e => setDeliveryOption(e.target.value)}>
                      <option value="pickup">Hospital Pickup</option>
                      <option value="delivery">Home Delivery</option>
                    </select>
                  </div>

                  {deliveryOption === 'delivery' && (
                    <div className="php-form-group">
                      <label>Delivery Address</label>
                      <input type="text" className="php-form-input" placeholder="Enter your full address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required />
                    </div>
                  )}

                  <div className="php-form-group" style={{ marginTop: 8 }}>
                    <label>Upload Prescription <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span></label>
                    <label style={{ cursor: 'pointer' }}>
                      <div className="php-file-upload">
                        <UploadCloud size={28} color="#10b981" style={{ marginBottom: 8 }} />
                        <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>{prescriptionFile ? prescriptionFile.name : 'Click to choose a file'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>JPEG, PNG, or PDF</p>
                      </div>
                      <input type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={e => setPrescriptionFile(e.target.files[0] || null)} required={false} />
                    </label>
                  </div>
                  <div style={{ padding: '16px 20px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: '0.95rem', color: '#065f46', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>💰 Total Amount</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{((parseFloat(selectedMedicine.price || 0) * refillQuantity)).toFixed(2)} ETB</span>
                  </div>
                  {submitError && (
                    <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: '0.9rem', marginTop: 8 }}>
                      ❌ {submitError}
                    </div>
                  )}
                </div>
                <div className="php-modal-footer">
                  <button type="button" className="php-cancel-btn" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="php-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : '🚀 Place Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="php-overlay" onClick={() => setPreviewImage(null)} style={{ zIndex: 99999, alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button className="php-close-btn" onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <X size={20} />
            </button>
            <img src={previewImage} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '0', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', objectFit: 'contain' }} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyHealthPage;
