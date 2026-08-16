import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';
import printingHero from '../../assets/hero-section/printing.jpg';
import bookImg from '../../assets/printing/book.jpg';
import moduleImg from '../../assets/printing/module.jpg';
import examImg from '../../assets/printing/exam peper.jpg';
import brochureImg from '../../assets/printing/brocure.jpg';
import {
  BookOpen, Notebook, FileText, Image, Printer, Clock,
  Package, Percent, Calculator, ShoppingCart, ChevronDown,
  ChevronUp, X, CheckCircle, UploadCloud, CreditCard, Truck,
  Phone, Mail, Shield, Info, CheckCircle2, User, Palette,
  Layers, AlignLeft, Calendar, AlertTriangle, Zap, Star,
  ArrowRight, UserPlus, LogIn, Sparkles
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@keyframes psp-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes psp-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes psp-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
@keyframes psp-spin { to{transform:rotate(360deg)} }
@keyframes psp-pop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

.psp-root { font-family:'Inter',-apple-system,sans-serif; background:#f0f2f5; min-height:100vh; }

/* ── HERO ─────────────────────────────────────────── */
.psp-hero {
  width:100%; position:relative; overflow:hidden; height:440px;
  background:linear-gradient(rgba(26,43,75,0.8),rgba(13,124,102,0.72));
  background-size:cover; background-position:center;
}
.psp-hero-grid {
  position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,0.03)1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,0.03)1px,transparent 1px);
  background-size:50px 50px;
}
.psp-hero-content {
  position:relative;z-index:10;height:100%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:20px;padding:0 24px;text-align:center;
}
.psp-hero-badge {
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.25);border-radius:999px;
  padding:8px 20px;color:#fff;font-size:0.85rem;font-weight:700;
  letter-spacing:0.5px;
}
.psp-hero-title {
  font-size:clamp(32px,5vw,56px);font-weight:900;color:#FFD700;
  margin:0;line-height:1.1;letter-spacing:-1px;
  text-shadow:0 0 30px rgba(255,215,0,0.35);
}
.psp-hero-sub {
  font-size:clamp(1rem,2vw,1.25rem);color:rgba(255,255,255,0.85);
  margin:0;font-weight:500;max-width:600px;line-height:1.5;
}
.psp-hero-btns { display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:4px; }
.psp-hero-btn-primary {
  display:inline-flex;align-items:center;gap:8px;
  background:linear-gradient(135deg,#0D7C66,#059669);color:#fff;
  border:none;border-radius:0;padding:14px 32px;
  font-size:1rem;font-weight:800;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
  box-shadow:0 4px 16px rgba(13,124,102,0.4);
}
.psp-hero-btn-primary:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(13,124,102,0.5); }
.psp-hero-btn-outline {
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);
  color:#fff;border:2px solid rgba(255,255,255,0.5);border-radius:0;
  padding:12px 28px;font-size:1rem;font-weight:700;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
}
.psp-hero-btn-outline:hover { background:rgba(255,255,255,0.25); }

/* ── TOOLBAR ─────────────────────────────────────── */
.psp-toolbar {
  background:white;border-bottom:1px solid #e4e6ea;
  padding:14px 0;position:sticky;top:68px;z-index:100;
  box-shadow:0 2px 8px rgba(0,0,0,0.06);
}
.psp-toolbar-inner {
  max-width:1440px;margin:0 auto;padding:0 24px;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
}
.psp-cat-pill {
  padding:8px 20px;border-radius:0;border:1.5px solid #e2e8f0;
  cursor:pointer;font-size:13px;font-weight:700;
  transition:all 0.2s;background:#f8fafc;color:#64748b;font-family:inherit;
}
.psp-cat-pill:hover { background:#e2e8f0;color:#334155; }
.psp-cat-pill.active {
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);
  color:white;border-color:transparent;
  box-shadow:0 4px 12px rgba(13,124,102,0.3);
}

/* ── MAIN GRID ───────────────────────────────────── */
.psp-main { max-width:1440px;margin:0 auto;padding:32px 24px 100px; }
.psp-grid {
  display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;
}
.psp-card {
  background:#FFFFFF;border-radius:12px;overflow:hidden;
  border:1px solid #8D6E63;box-shadow:none;
  display:flex;flex-direction:column;
  animation:psp-fadeUp 0.4s both;
  transition:transform 0.15s ease, box-shadow 0.15s ease;
}
.psp-card:hover { box-shadow:0 8px 24px rgba(0,0,0,0.08);transform:translateY(-1px); }
.psp-card-img {
  width:100%;height:220px;object-fit:cover;
  transition:transform 0.15s ease;
}
.psp-card:hover .psp-card-img { transform:scale(1.03); }
.psp-card-img-wrap { position:relative;overflow:hidden; }
.psp-card-badge {
  position:absolute;top:12px;left:12px;
  background:rgba(255,255,255,0.92);backdrop-filter:blur(6px);
  padding:4px 12px;border-radius:12px;
  font-size:11px;font-weight:800;color:#424242;letter-spacing:0.3px;
  border:1px solid #8D6E63;
}
.psp-card-body { padding:20px;flex:1;display:flex;flex-direction:column; }
.psp-card-name { font-size:16px;font-weight:800;color:#424242;margin:0 0 6px; }
.psp-card-desc { font-size:13px;color:#424242;margin:0 0 16px;line-height:1.6;flex:1; }
.psp-card-footer { display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto; }
.psp-price { font-size:18px;font-weight:800;color:#1B5E20; }
.psp-price-sub { font-size:11px;color:#424242;margin-top:2px; }
.psp-order-btn {
  background:#2E8B57;color:#FFFFFF;
  border:none;padding:10px 18px;border-radius:8px;
  cursor:pointer;display:flex;align-items:center;gap:6px;
  font-weight:800;font-size:13px;transition:all 0.15s ease;font-family:inherit;
  white-space:nowrap;
}
.psp-order-btn:hover { background:#1B5E20;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15); }

/* ── MODAL / OVERLAY ─────────────────────────────── */
.psp-overlay {
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);
  display:flex;align-items:flex-start;justify-content:center;
  z-index:9999;padding:40px 20px;overflow-y:auto;
}
.psp-modal {
  background:white;border-radius:0;width:100%;max-width:620px;
  margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);
  animation:psp-pop 0.3s ease;
}
.psp-modal-header {
  padding:24px 28px;border-bottom:1px solid #e2e8f0;
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);
}
.psp-modal-title { margin:0;font-size:1.1rem;font-weight:800;color:#FFD700;display:flex;align-items:center;gap:10px; }
.psp-modal-subtitle { font-size:0.8rem;color:rgba(255,255,255,0.7);margin:4px 0 0; }
.psp-close-btn {
  background:rgba(255,255,255,0.15);border:none;color:white;
  cursor:pointer;display:flex;align-items:center;
  padding:8px;border-radius:8px;transition:all 0.2s;
}
.psp-close-btn:hover { background:rgba(255,255,255,0.3); }
.psp-modal-body { padding:28px;display:flex;flex-direction:column;gap:18px; }
.psp-form-group { display:flex;flex-direction:column;gap:8px; }
.psp-form-label {
  font-weight:700;font-size:0.85rem;color:#1e293b;
  display:flex;align-items:center;gap:6px;
}
.psp-form-label span { font-weight:400;color:#94a3b8; }
.psp-form-input {
  padding:12px 16px;border:2px solid #e2e8f0;width:100%;box-sizing:border-box;
  border-radius:0;font-size:0.95rem;background:white;
  color:#0f172a;transition:all 0.2s;font-family:inherit;outline:none;
}
.psp-form-input:focus { border-color:#0D7C66;box-shadow:0 0 0 3px rgba(13,124,102,0.1); }
.psp-form-input:disabled { background:#f8fafc;color:#64748b;cursor:not-allowed; }
.psp-form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
@media(max-width:500px){ .psp-form-row { grid-template-columns:1fr; } }

.psp-section-divider {
  font-size:0.75rem;font-weight:800;color:#1a2b4b;letter-spacing:1.5px;
  text-transform:uppercase;padding:8px 0 4px;border-top:2px solid #e2e8f0;
  margin-top:4px;display:flex;align-items:center;gap:8px;
}
.psp-section-divider::after { content:'';flex:1;height:1px;background:#e2e8f0; }

/* File upload */
.psp-file-upload {
  border:2px dashed #cbd5e1;border-radius:0;padding:24px;
  text-align:center;cursor:pointer;transition:all 0.3s;background:#f8fafc;
}
.psp-file-upload:hover { border-color:#0D7C66;background:#f0fdf4; }
.psp-file-upload.has-file { border-color:#0D7C66;background:#f0fdf4;border-style:solid; }

/* Price summary */
.psp-price-summary {
  background:linear-gradient(135deg,#f0fdf4,#dcfce7);
  border:2px solid #86efac;border-radius:0;padding:20px;
}
.psp-price-row { display:flex;justify-content:space-between;align-items:center;font-size:0.9rem;color:#166534;padding:4px 0; }
.psp-price-total { font-size:1.3rem;font-weight:900;color:#15803d;border-top:2px solid #86efac;padding-top:12px;margin-top:8px; }

/* Checkbox row */
.psp-check-row {
  display:flex;align-items:center;gap:10px;
  padding:14px 16px;background:#fffbeb;border:1.5px solid #fbbf24;
  border-radius:0;cursor:pointer;
}
.psp-check-row input[type=checkbox] { width:18px;height:18px;accent-color:#d97706;cursor:pointer; }

/* Modal footer */
.psp-modal-footer {
  padding:20px 28px;border-top:1px solid #e2e8f0;
  display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;
}
.psp-cancel-btn {
  padding:12px 24px;background:white;border:2px solid #e2e8f0;
  border-radius:0;color:#475569;font-weight:700;
  cursor:pointer;transition:all 0.2s;font-family:inherit;
}
.psp-cancel-btn:hover { background:#f1f5f9; }
.psp-submit-btn {
  padding:12px 28px;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);
  border:none;border-radius:0;color:white;
  font-weight:800;cursor:pointer;display:flex;
  align-items:center;gap:8px;transition:all 0.2s;
  font-family:inherit;font-size:1rem;
}
.psp-submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
.psp-submit-btn:disabled { opacity:0.6;cursor:not-allowed; }

/* Login gate inside modal */
.psp-login-gate {
  padding:40px 28px;text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:20px;
}
.psp-login-gate-icon { width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#1a2b4b,#0D7C66);display:flex;align-items:center;justify-content:center; }
.psp-login-gate-title { font-size:1.4rem;font-weight:900;color:#0f172a;margin:0; }
.psp-login-gate-sub { font-size:0.95rem;color:#64748b;margin:0;line-height:1.6;max-width:320px; }
.psp-login-gate-btns { display:flex;gap:12px;flex-wrap:wrap;justify-content:center; }
.psp-gate-btn-login {
  display:inline-flex;align-items:center;gap:8px;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);color:#fff;
  border:none;border-radius:0;padding:12px 28px;
  font-size:0.95rem;font-weight:800;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
}
.psp-gate-btn-login:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
.psp-gate-btn-register {
  display:inline-flex;align-items:center;gap:8px;
  background:white;color:#1a2b4b;
  border:2px solid #1a2b4b;border-radius:0;padding:10px 24px;
  font-size:0.95rem;font-weight:800;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
}
.psp-gate-btn-register:hover { background:#f8fafc; }

/* Success */
.psp-success-body { padding:48px 28px;text-align:center; }
.psp-success-emoji { font-size:72px;display:block;margin-bottom:16px;animation:psp-pop 0.5s; }
.psp-success-title { font-size:1.4rem;font-weight:900;color:#059669;margin:0 0 8px; }
.psp-success-sub { color:#64748b;margin:0 0 24px; }
.psp-print-btn {
  display:inline-flex;align-items:center;gap:8px;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);color:#fff;
  border:none;border-radius:0;padding:14px 32px;
  font-size:1rem;font-weight:800;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
  box-shadow:0 4px 16px rgba(13,124,102,0.3);
}
.psp-print-btn:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(13,124,102,0.45); }

/* Error */
.psp-error-box {
  padding:12px 16px;background:#fef2f2;border:1.5px solid #fca5a5;
  border-radius:0;color:#dc2626;font-size:0.9rem;
  display:flex;align-items:center;gap:8px;
}

/* ── How to Order ─────────────────────────────────── */
.psp-how { background:#F5F5F5;padding:72px 24px; }
.psp-how-inner { max-width:1100px;margin:0 auto; }
.psp-section-label { font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#228B22;margin:0 0 12px; }
.psp-section-title { font-size:clamp(22px,3.5vw,36px);font-weight:900;margin:0 0 48px;color:#1B5E20;line-height:1.2; }
.psp-steps { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px; }
.psp-step {
  background:#FFFFFF;border:1px solid #8D6E63;
  border-radius:12px;padding:28px 20px;text-align:center;
  transition:transform 0.15s ease,box-shadow 0.15s ease;
}
.psp-step:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.08); }
.psp-step-num {
  width:52px;height:52px;border-radius:50%;
  background:#98FF98;color:#424242;font-size:20px;font-weight:900;
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 18px;
}
.psp-step-title { font-size:15px;font-weight:800;color:#1B5E20;margin:0 0 8px; }
.psp-step-desc { font-size:13px;color:#424242;line-height:1.6;margin:0; }

@media (max-width: 768px) {
  .psp-how { padding:40px 20px; }
  .psp-step {
    border:none !important;
    border-radius:0 !important;
    background:transparent !important;
    padding:24px 0 !important;
    box-shadow:none !important;
    border-bottom:1px solid rgba(141,110,99,0.15) !important;
  }
  .psp-step:last-child { border-bottom:none !important; padding-bottom:0 !important; }
}

/* ── Pricing table ───────────────────────────────── */
.psp-pricing { padding:72px 24px;background:#FFFFFF; }
.psp-pricing-inner { max-width:900px;margin:0 auto; }
.psp-pricing-title { font-size:clamp(22px,3.5vw,32px);font-weight:900;color:#1B5E20;margin:0 0 32px;line-height:1.2; }
.psp-table-scroll { overflow-x:auto;-webkit-overflow-scrolling:touch; }
.psp-table-wrap {
  background:#FFFFFF;border-radius:10px;overflow:hidden;
  border:1px solid #8D6E63;box-shadow:0 1px 4px rgba(0,0,0,0.06);
  min-width:480px;
}
.psp-table { width:100%;border-collapse:collapse;font-size:0.92rem; }
.psp-table thead tr { background:#1B5E20; }
.psp-table th { padding:14px 18px;text-align:left;color:#FFFFFF;font-weight:700;font-size:0.85rem;white-space:nowrap; }
.psp-table th:not(:first-child) { text-align:right; }
.psp-table tbody tr:nth-child(odd) { background:#FFFFFF; }
.psp-table tbody tr:nth-child(even) { background:#F5F5F5; }
.psp-table tbody tr { border-bottom:1px solid #F5F5F5;transition:background 0.15s ease; }
.psp-table tbody tr:hover { background:#A5D6A7; }
.psp-table tbody tr:last-child { border-bottom:none; }
.psp-table td { padding:14px 18px;color:#424242;white-space:nowrap; }
.psp-table td:first-child { font-weight:700;color:#1B5E20;text-align:left; }
.psp-table td:not(:first-child) { text-align:right; }
.psp-table .color-val { color:#2E8B57;font-weight:700; }
.psp-pricing-note { font-size:13px;color:#424242;margin-top:16px;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px; }

/* ── FAQ ──────────────────────────────────────── */
.psp-faq { padding:72px 24px;background:#F5F5F5; }
.psp-faq-inner { max-width:780px;margin:0 auto; }
.psp-faq-title { font-size:clamp(22px,3.5vw,32px);font-weight:900;color:#1B5E20;margin:0 0 36px;line-height:1.2; }
.psp-faq-item {
  border-bottom:1px solid #8D6E63;
  background:#FFFFFF;
  border-radius:0;
  transition:background 0.15s ease;
}
.psp-faq-item:first-of-type { border-top:1px solid #8D6E63;border-radius:12px 12px 0 0; }
.psp-faq-item:last-of-type { border-radius:0 0 12px 12px;border-bottom:none; }
.psp-faq-q {
  width:100%;text-align:left;background:none;border:none;
  padding:20px 24px;display:flex;justify-content:space-between;align-items:center;
  font-size:15px;font-weight:700;color:#424242;cursor:pointer;
  gap:16px;font-family:inherit;transition:color 0.15s ease;
}
.psp-faq-q:hover { color:#1B5E20; }
.psp-faq-item:hover { background:#F5F5F5; }
.psp-faq-a {
  overflow:hidden;max-height:0;
  transition:max-height 0.35s ease,padding 0.35s ease;
  font-size:14px;color:#424242;line-height:1.8;padding:0 24px;
}
.psp-faq-a.open { max-height:300px;padding-bottom:20px; }

@media (max-width:768px) {
  .psp-faq { padding:40px 16px; }
  .psp-faq-item { border:none !important;border-radius:0 !important;border-bottom:1px solid rgba(141,110,99,0.2) !important;background:transparent !important; }
  .psp-faq-item:first-of-type { border-top:none !important; }
  .psp-faq-item:last-of-type { border-bottom:none !important; }
  .psp-faq-q { padding:18px 0; }
  .psp-faq-a { padding:0; }
  .psp-faq-a.open { padding-bottom:16px; }
}

/* ── Trust bar ─────────────────────────────────── */
.psp-trust { background:#1B5E20;padding:48px 24px; }
.psp-trust-inner { max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px; }
.psp-trust-item {
  display:flex;align-items:flex-start;gap:14px;
  padding:20px;border-radius:12px;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  transition:background 0.15s ease,transform 0.15s ease;
}
.psp-trust-item:hover { background:rgba(255,255,255,0.12);transform:translateY(-1px); }
.psp-trust-icon {
  width:44px;height:44px;border-radius:10px;
  background:#A5D6A7;border:none;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.psp-trust-title { font-size:14px;font-weight:800;color:#FFFFFF;margin:0 0 4px; }
.psp-trust-desc { font-size:12px;color:rgba(255,255,255,0.75);margin:0;line-height:1.6; }

@media (max-width:768px) {
  .psp-trust { padding:32px 16px; }
  .psp-trust-item {
    border:none !important;
    border-radius:0 !important;
    background:transparent !important;
    padding:16px 0 !important;
    border-bottom:1px solid rgba(255,255,255,0.12) !important;
  }
  .psp-trust-item:last-child { border-bottom:none !important; }
  .psp-trust-item:hover { transform:none; }
}

/* ── Spinner ─────────────────────────────────────── */
.psp-spinner {
  width:20px;height:20px;border:3px solid rgba(255,255,255,0.3);
  border-top-color:white;border-radius:50%;
  animation:psp-spin 0.7s linear infinite;
}
/* ── Calculator Modal ── */
.calc-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}
.calc-modal {
  background: #f8fafc; width: 320px; max-width: 100%; border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.8);
  padding: 20px; display: flex; flex-direction: column; gap: 16px;
  border: 1px solid #e2e8f0;
}
.calc-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; font-weight: 700; color: #1B5E20; margin-bottom: 4px;
}
.calc-close {
  background: rgba(27,94,32,0.1); border: none; width: 28px; height: 28px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #1B5E20; cursor: pointer; transition: 0.2s;
}
.calc-close:hover { background: #1B5E20; color: white; }
.calc-screen {
  background: #d4d8ce; border-radius: 12px; padding: 16px;
  text-align: right; box-shadow: inset 0 4px 8px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; justify-content: flex-end;
  height: 80px; position: relative; border: 2px solid #b7bdae;
}
.calc-equation { font-size: 13px; color: #64748b; min-height: 16px; margin-bottom: 4px; font-family: 'Courier New', monospace; }
.calc-display { font-size: 32px; font-weight: 600; color: #1e293b; letter-spacing: -1px; font-family: 'Courier New', monospace; }
.calc-keys {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.calc-key {
  background: #ffffff; border: none; border-radius: 10px;
  font-size: 20px; font-weight: 600; color: #334155;
  height: 54px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.1s;
  box-shadow: 0 4px 0 #cbd5e1, 0 8px 12px rgba(0,0,0,0.05);
}
.calc-key:active {
  transform: translateY(4px); box-shadow: 0 0 0 #cbd5e1;
}
.calc-func { background: #e2e8f0; color: #0f172a; box-shadow: 0 4px 0 #94a3b8; }
.calc-func:active { box-shadow: 0 0 0 #94a3b8; }
.calc-op { background: #1B5E20; color: #ffffff; box-shadow: 0 4px 0 #0d3811; font-size: 24px; }
.calc-op:active { box-shadow: 0 0 0 #0d3811; }
.calc-zero { grid-column: span 2; justify-content: flex-start; padding-left: 24px; }
.calc-btn-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  background: #2E8B57; color: white; border: none;
  padding: 8px 16px; border-radius: 8px; font-size: 14px;
  font-weight: 700; cursor: pointer; transition: 0.2s;
}
.calc-btn-trigger:hover { background: #1B5E20; transform: translateY(-1px); }
`;

/* ═══════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════ */
const PAPER_TYPES = [
  { code: 'A4', name: 'A4 (210×297mm)', price: 0.50 },
  { code: 'A5', name: 'A5 (148×210mm)', price: 0.75 },
  { code: 'A3', name: 'A3 (297×420mm)', price: 1.00 },
];
const BINDING_TYPES = [
  { code: 'None',    name: 'No Binding',      price: 0 },
  { code: 'Spiral',  name: 'Spiral Binding',  price: 500 },
  { code: 'Thermal', name: 'Thermal Binding', price: 300 },
];
const PRODUCT_TYPES = [
  { code: 'Book',      name: 'Book Printing',     img: bookImg,    desc: 'Academic & professional books, textbooks, manuals' },
  { code: 'Module',    name: 'Module / Notes',    img: moduleImg,  desc: 'Student course modules, handouts, lecture notes' },
  { code: 'Exam',      name: 'Exam Papers',       img: examImg,    desc: 'Exam sheets, question papers, answer booklets' },
  { code: 'Brochure',  name: 'Brochure / Flyer',  img: brochureImg,desc: 'Marketing brochures, company flyers, promotions' },
  { code: 'TaxReceipt',name: 'Tax Receipts',      img: null,       desc: 'Official tax receipts, VAT books, vouchers' },
];

const PRICING_ROWS = [
  { name: 'Per Page Rate', a4: '0.50 ETB', a5: '0.75 ETB', a3: '1.00 ETB', color: '×2 price' },
  { name: 'Spiral Binding', a4: '500 ETB', a5: '500 ETB', a3: '500 ETB', color: 'Per copy' },
  { name: 'Thermal Binding', a4: '300 ETB', a5: '300 ETB', a3: '300 ETB', color: 'Per copy' },
];

const FAQS = [
  { q: 'What file formats do you accept?', a: 'We accept PDF, DOCX, JPG, and PNG. PDF is strongly recommended to ensure formatting is preserved across devices and printers.' },
  { q: 'Is there a minimum order size?', a: 'No — you can print as little as a single page or a single copy.' },
  { q: 'Can I revise my order after submitting?', a: 'Once an order enters the printing queue it cannot be revised. Please double-check your file and configurations before submitting.' },
  { q: 'How long does delivery take?', a: 'Standard A4/A5 documents: 2–4 hours. Bound modules/books: 24 hours. Bulk orders (500+ pages): 48 hours. Large format: 2–3 business days.' },
  { q: 'What payment methods do you accept?', a: 'Cash on pickup, Telebirr, CBE Birr, Visa/Mastercard, and Amole. All payments are processed at pickup or on delivery.' },
];

/* ═══════════════════════════════════════════════════════
   PRICE CALCULATOR
════════════════════════════════════════════════════════ */
const calcPrice = ({ paperType, pagesPerCopy, quantity, colorPrinting, bindingType, vatCtx }) => {
  const basePrice = PAPER_TYPES.find(p => p.code === paperType)?.price ?? 0.50;
  const multiplier = colorPrinting ? 2.0 : 1.0;
  const pricePerUnit = pagesPerCopy * basePrice * multiplier;
  const bindingCost = (BINDING_TYPES.find(b => b.code === bindingType)?.price ?? 0) * quantity;
  const subtotal = pricePerUnit * quantity;
  const r = getVatForItem(vatCtx, 'printing', null, subtotal + bindingCost);
  return {
    pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    bindingCost: parseFloat(bindingCost.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    vat: r.vat,
    rate: r.rate,
    totalPrice: parseFloat((subtotal + bindingCost + r.vat).toFixed(2)),
  };
};

/* ═══════════════════════════════════════════════════════
   LIVE CALCULATOR COMPONENT
════════════════════════════════════════════════════════ */
const LiveCalculator = ({ onClose }) => {
  const [paperType, setPaperType] = useState('A4');
  const [pagesPerCopy, setPagesPerCopy] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [colorPrinting, setColorPrinting] = useState(false);
  const [bindingType, setBindingType] = useState('None');
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  const pricing = calcPrice({ paperType, pagesPerCopy, quantity, colorPrinting, bindingType, vatCtx });

  return (
    <div className="calc-overlay" onClick={onClose}>
      <div className="calc-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
        <div className="calc-header">
          <span>Printing Price Estimator</span>
          <button className="calc-close" onClick={onClose}><X size={16}/></button>
        </div>
        
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
          Adjust the specifications below to instantly estimate the cost of your printing order based on our standard rates.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Paper Size</label>
            <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: 13, minWidth: 160 }} value={paperType} onChange={e => setPaperType(e.target.value)}>
              {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Pages Per Copy</label>
            <input type="number" min="1" value={pagesPerCopy} onChange={e => setPagesPerCopy(parseInt(e.target.value)||1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', width: 160, textAlign: 'right', fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Quantity (Copies)</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value)||1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', width: 160, textAlign: 'right', fontSize: 13 }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Color Mode</label>
            <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: 13, minWidth: 160 }} value={colorPrinting.toString()} onChange={e => setColorPrinting(e.target.value === 'true')}>
              <option value="false">Black & White</option>
              <option value="true">Color Printing</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Binding Type</label>
            <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: 13, minWidth: 160 }} value={bindingType} onChange={e => setBindingType(e.target.value)}>
              {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 24, background: '#1B5E20', padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 10px 25px rgba(27,94,32,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, opacity: 0.85 }}>
            <span>Printing Cost:</span>
            <span>{pricing.subtotal.toFixed(2)} ETB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, opacity: 0.85 }}>
            <span>Binding Cost:</span>
            <span>{pricing.bindingCost.toFixed(2)} ETB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16, opacity: 0.85 }}>
            <span>VAT ({fmtPct(pricing.rate)}):</span>
            <span>{pricing.vat.toFixed(2)} ETB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 16 }}>
            <span>Total Estimate (incl. VAT):</span>
            <span>{pricing.totalPrice.toFixed(2)} ETB</span>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function PrintingServicePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [catFilter, setCatFilter] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoggedIn, setIsLoggedIn]           = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);

  // Form fields
  const [productType, setProductType]         = useState('Book');
  const [paperType, setPaperType]             = useState('A4');
  const [pagesPerCopy, setPagesPerCopy]       = useState(100);
  const [quantity, setQuantity]               = useState(1);
  const [colorPrinting, setColorPrinting]     = useState(false);
  const [bindingType, setBindingType]         = useState('None');
  const [dueDate, setDueDate]                 = useState('');
  const [specialInstructions, setSpecial]     = useState('');
  const [docFile, setDocFile]                 = useState(null);

  // Submission
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [submitSuccess, setSubmitSuccess]     = useState(false);
  const [orderResult, setOrderResult]         = useState(null);
  const [submitError, setSubmitError]         = useState('');
  const [vatCtx, setVatCtx]                   = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  const fileRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    const loggedIn = authService.isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) setCurrentUser(authService.getCurrentUser());
  }, []);

  // Handle return from login page with pending order
  useEffect(() => {
    if (location.state?.openPrintingOrder && authService.isAuthenticated()) {
      const svc = location.state.service;
      if (svc) {
        setSelectedService(svc);
        setProductType(svc.code);
      }
      setCurrentUser(authService.getCurrentUser());
      setIsLoggedIn(true);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Derived price
  const pricing = calcPrice({ paperType, pagesPerCopy: parseInt(pagesPerCopy) || 1, quantity: parseInt(quantity) || 1, colorPrinting, bindingType, vatCtx });

  // Today + 1 for min due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const filtered = catFilter === 'all'
    ? PRODUCT_TYPES
    : PRODUCT_TYPES.filter(p => p.code === catFilter);

  const openOrder = (svc) => {
    setSelectedService(svc);
    setProductType(svc.code);
    setSubmitSuccess(false);
    setSubmitError('');
    setOrderResult(null);
    setDocFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitSuccess(false);
    setSubmitError('');
    setOrderResult(null);
  };

  const handleOpenOrder = (svc) => {
    if (!authService.isAuthenticated()) {
      // redirect to login with state to come back
      navigate('/login', { state: { from: '/services/printing', openPrintingOrder: true, service: svc } });
    } else {
      openOrder(svc);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('productType', productType);
      formData.append('paperType', paperType);
      formData.append('pagesPerCopy', pagesPerCopy);
      formData.append('quantity', quantity);
      formData.append('colorPrinting', colorPrinting);
      formData.append('bindingType', bindingType);
      formData.append('dueDate', dueDate);
      formData.append('specialInstructions', specialInstructions);
      if (docFile) formData.append('document', docFile);

      const res = await axios.post('/printing/customer/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data ?? {};
      setOrderResult({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        totalPrice: data.totalPrice ?? pricing.totalPrice,
        productType,
        paperType,
        pagesPerCopy,
        quantity,
        colorPrinting,
        bindingType,
        dueDate,
        specialInstructions,
        customerName: currentUser?.fullName || currentUser?.full_name || currentUser?.name || 'Customer',
        customerEmail: currentUser?.email || '',
        customerPhone: currentUser?.phone || '',
      });
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!orderResult) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    const svcName = PRODUCT_TYPES.find(p => p.code === orderResult.productType)?.name ?? orderResult.productType;
    const paperName = PAPER_TYPES.find(p => p.code === orderResult.paperType)?.name ?? orderResult.paperType;
    const bindingName = BINDING_TYPES.find(b => b.code === orderResult.bindingType)?.name ?? orderResult.bindingType;
    win.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8"/>
<title>Printing Order Receipt – ${orderResult.orderNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1a1a1a}
.wrap{max-width:720px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12)}
.header{background:linear-gradient(135deg,#1a2b4b,#0D7C66);padding:32px;display:flex;justify-content:space-between;align-items:center}
.header-left h1{color:#FFD700;font-size:22px;font-weight:900;margin-bottom:4px}
.header-left p{color:rgba(255,255,255,0.7);font-size:13px}
.header-right{text-align:right}
.order-no{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);padding:10px 18px;border-radius:6px;color:white;font-size:14px;font-weight:700}
.order-no span{display:block;font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);margin-bottom:4px}
.status-bar{background:#0D7C66;padding:10px 32px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:white}
.body{padding:32px}
.section-title{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}
.info-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px}
.info-item .lbl{font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
.info-item .val{font-size:15px;font-weight:700;color:#0f172a}
.price-table{width:100%;border-collapse:collapse;margin-bottom:28px}
.price-table th{background:#f1f5f9;padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#64748b}
.price-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155}
.price-table .total-row{background:#f0fdf4;font-weight:900;color:#059669;font-size:16px}
.notes-box{background:#fffbeb;border:1.5px solid #fbbf24;border-radius:6px;padding:16px;margin-bottom:28px;font-size:13px;color:#92400e;line-height:1.6}
.footer{background:#0f172a;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-left{color:rgba(255,255,255,0.6);font-size:11px;line-height:1.7}
.footer-right{font-size:12px;color:rgba(255,255,255,0.5)}
.barcode-mock{font-family:monospace;letter-spacing:4px;font-size:28px;color:#1a2b4b;background:#f1f5f9;padding:12px 20px;border-radius:4px;text-align:center;margin-bottom:8px}
@media print{body{background:white;padding:0}.wrap{box-shadow:none}}
</style></head><body>
<div class="wrap">
<div class="header">
<div class="header-left"><h1>🖨️ SUTANA Printing</h1><p>Professional Printing Services — Addis Ababa, Ethiopia</p></div>
<div class="header-right"><div class="order-no"><span>ORDER NUMBER</span>${orderResult.orderNumber || 'N/A'}</div></div>
</div>
<div class="status-bar">✅ ORDER CONFIRMED — RECEIVED FOR PROCESSING</div>
<div class="body">
<p class="section-title">Customer Information</p>
<div class="info-grid">
<div class="info-item"><div class="lbl">Full Name</div><div class="val">${orderResult.customerName}</div></div>
<div class="info-item"><div class="lbl">Email</div><div class="val">${orderResult.customerEmail || '—'}</div></div>
<div class="info-item"><div class="lbl">Phone</div><div class="val">${orderResult.customerPhone || '—'}</div></div>
<div class="info-item"><div class="lbl">Order Date</div><div class="val">${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'})}</div></div>
</div>

<p class="section-title">Order Specifications</p>
<div class="info-grid">
<div class="info-item"><div class="lbl">Service Type</div><div class="val">${svcName}</div></div>
<div class="info-item"><div class="lbl">Paper Size</div><div class="val">${paperName}</div></div>
<div class="info-item"><div class="lbl">Pages Per Copy</div><div class="val">${orderResult.pagesPerCopy} pages</div></div>
<div class="info-item"><div class="lbl">Quantity (Copies)</div><div class="val">${orderResult.quantity} copies</div></div>
<div class="info-item"><div class="lbl">Color Printing</div><div class="val">${orderResult.colorPrinting ? '✅ Yes (Color)' : '⬛ No (Black & White)'}</div></div>
<div class="info-item"><div class="lbl">Binding Type</div><div class="val">${bindingName}</div></div>
<div class="info-item"><div class="lbl">Required By (Due Date)</div><div class="val">${orderResult.dueDate || '—'}</div></div>
<div class="info-item"><div class="lbl">File Uploaded</div><div class="val">${orderResult.docFile ? '📄 ' + orderResult.docFile : '—'}</div></div>
</div>

<p class="section-title">Price Breakdown</p>
<table class="price-table">
<thead><tr><th>Description</th><th>Rate</th><th>Qty</th><th>Amount (ETB)</th></tr></thead>
<tbody>
<tr><td>Printing (${orderResult.pagesPerCopy} pages × ${PAPER_TYPES.find(p=>p.code===orderResult.paperType)?.price||0.50} ETB${orderResult.colorPrinting?' × 2 (color)':''})</td><td>${(PAPER_TYPES.find(p=>p.code===orderResult.paperType)?.price||0.50) * (orderResult.colorPrinting?2:1)} ETB/page</td><td>${orderResult.quantity}</td><td>${pricing.subtotal.toFixed(2)}</td></tr>
${orderResult.bindingType !== 'None' ? `<tr><td>${bindingName}</td><td>${BINDING_TYPES.find(b=>b.code===orderResult.bindingType)?.price||0} ETB/copy</td><td>${orderResult.quantity}</td><td>${pricing.bindingCost.toFixed(2)}</td></tr>` : ''}
<tr class="total-row"><td colspan="3">TOTAL AMOUNT DUE</td><td>${orderResult.totalPrice?.toFixed(2) ?? pricing.totalPrice.toFixed(2)} ETB</td></tr>
</tbody></table>

${orderResult.specialInstructions ? `<div class="notes-box"><strong>📝 Special Instructions:</strong><br/>${orderResult.specialInstructions}</div>` : ''}

<div class="barcode-mock">${orderResult.orderNumber || 'PRT-XXXXXXXX'}</div>
<p style="text-align:center;font-size:11px;color:#94a3b8;margin-bottom:24px">Show this order number at our branch for pickup</p>
</div>
<div class="footer">
<div class="footer-left">
SUTANA Printing Services &nbsp;|&nbsp; Addis Ababa, Ethiopia<br/>
📞 +251 911 000 000 &nbsp;|&nbsp; ✉️ print@sutana.com &nbsp;|&nbsp; Mon–Sat 8AM–6PM
</div>
<div class="footer-right">Printed: ${new Date().toLocaleString()}</div>
</div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
    win.document.close();
  };

  /* ── User info display ──────────────────────────── */
  const userName = currentUser
    ? (currentUser.fullName || currentUser.full_name || currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Guest')
    : '';

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="psp-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ── Hero ── */}
      <div
        className="psp-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(26,43,75,0.8), rgba(13,124,102,0.72)), url(${printingHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="psp-hero-grid" />
        <div className="psp-hero-content">
          <h1 className="psp-hero-title">Printing Services</h1>
        </div>
      </div>

      {/* ── Category Toolbar ── */}

      {/* ── Service Cards ── */}
      <div className="psp-main">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B5E20', margin: 0 }}>
            {catFilter === 'all' ? 'All Printing Services' : PRODUCT_TYPES.find(p => p.code === catFilter)?.name}
          </h2>
        </div>

        <div className="psp-grid">
          {filtered.map((svc, i) => (
            <div key={svc.code} className="psp-card" style={{ animationDelay: i * 0.07 + 's' }}>
              <div className="psp-card-img-wrap">
                {svc.img ? (
                  <img src={svc.img} className="psp-card-img" alt={svc.name} />
                ) : (
                  <div style={{ height: 220, background: 'linear-gradient(135deg,#1B5E20,#2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={60} color="rgba(255,255,255,0.4)" />
                  </div>
                )}
                <div className="psp-card-badge">{svc.code}</div>
              </div>
              <div className="psp-card-body">
                <h3 className="psp-card-name">{svc.name}</h3>
                <p className="psp-card-desc">{svc.desc}</p>
                <div className="psp-card-footer">
                  <div>
                    <div className="psp-price">From 0.50 ETB</div>
                    <div className="psp-price-sub">per page</div>
                  </div>
                  <button className="psp-order-btn" onClick={() => handleOpenOrder(svc)}>
                    <ShoppingCart size={15} /> Order Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How to Order ── */}
      <hr style={{ border: 'none', borderTop: '1px solid rgba(46, 139, 87, 0.3)', margin: 0, width: '100%' }} />
      <div className="psp-how">
        <div className="psp-how-inner">
          <h2 className="psp-section-title">How to Place Your Order</h2>
          <div className="psp-steps">
            {[
              { n:'1', title:'Browse & Select', desc:'Choose your printing service from the catalog above — books, modules, exam papers, or brochures.' },
              { n:'2', title:'Login or Register', desc:'Sign in to your account or register for free in under 2 minutes. New customers get a welcome bonus.' },
              { n:'3', title:'Fill Order Form', desc:'Specify paper size, quantity, binding, color options, and optionally upload your document file.' },
              { n:'4', title:'Submit & Receive Receipt', desc:'Submit your order and immediately print your order receipt. Pick up at our branch or get delivered.' },
            ].map(s => (
              <div className="psp-step" key={s.n}>
                <div className="psp-step-num">{s.n}</div>
                <h3 className="psp-step-title">{s.title}</h3>
                <p className="psp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(46, 139, 87, 0.3)', margin: 0, width: '100%' }} />

      {/* ── Pricing Table ── */}
      <div className="psp-pricing">
        <div className="psp-pricing-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="psp-pricing-title" style={{ margin: 0 }}>Pricing Guide</h2>
            <button className="calc-btn-trigger" onClick={() => setIsCalcOpen(true)}>
              <Calculator size={16} /> Calculator
            </button>
          </div>
          <div className="psp-table-scroll">
            <div className="psp-table-wrap">
              <table className="psp-table">
                <thead>
                  <tr>
                    <th>Service / Product</th>
                    <th>Base Price (B/W)</th>
                    <th>Color Price</th>
                    <th>Binding / Extras</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_ROWS.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.base}</td>
                      <td className="color-val">{r.color}</td>
                      <td>{r.bind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="psp-pricing-note">
            <Info size={14} />
            Tax Receipts are priced by approval quantity. Contact us for custom bulk pricing.
          </p>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div className="psp-faq">
        <div className="psp-faq-inner">
          <h2 className="psp-faq-title">Frequently Asked Questions</h2>
          {FAQS.map((f, i) => (
            <div className="psp-faq-item" key={i}>
              <button className="psp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                {openFaq === i
                  ? <ChevronUp size={18} color="#1B5E20" style={{ flexShrink: 0 }} />
                  : <ChevronDown size={18} color="#8D6E63" style={{ flexShrink: 0 }} />}
              </button>
              <div className={`psp-faq-a${openFaq === i ? ' open' : ''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────── ORDER MODAL ─────────────── */}
      {isModalOpen && (
        <div className="psp-overlay" onClick={closeModal}>
          <div className="psp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="psp-modal-header">
              <div>
                <h3 className="psp-modal-title">
                  <Printer size={22} /> Place Printing Order
                </h3>
                <p className="psp-modal-subtitle">
                  {selectedService?.name ?? 'Printing Service'} — Fill in all details below
                </p>
              </div>
              <button className="psp-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>

            {/* ── NOT LOGGED IN → gate ── */}
            {!isLoggedIn ? (
              <div className="psp-login-gate">
                <div className="psp-login-gate-icon">
                  <User size={36} color="white" />
                </div>
                <h3 className="psp-login-gate-title">Sign In to Continue</h3>
                <p className="psp-login-gate-sub">
                  You need to be logged in to place a printing order. It takes less than 2 minutes to sign in or register for free.
                </p>
                <div className="psp-login-gate-btns">
                  <button
                    className="psp-gate-btn-login"
                    onClick={() => navigate('/login', { state: { from: '/services/printing', openPrintingOrder: true, service: selectedService } })}
                  >
                    <LogIn size={18} /> Sign In
                  </button>
                  <button
                    className="psp-gate-btn-register"
                    onClick={() => navigate('/auth/register', { state: { from: '/services/printing', openPrintingOrder: true, service: selectedService } })}
                  >
                    <UserPlus size={18} /> Register Free
                  </button>
                </div>
              </div>

            /* ── SUCCESS ── */
            ) : submitSuccess && orderResult ? (
              <div className="psp-success-body">
                <span className="psp-success-emoji">✅</span>
                <h3 className="psp-success-title">Order Placed Successfully!</h3>
                <p className="psp-success-sub">
                  Order <strong>{orderResult.orderNumber}</strong> has been received.<br />
                  Click below to print your official order receipt.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                  <button className="psp-print-btn" onClick={handlePrint}>
                    <Printer size={20} /> Print Receipt
                  </button>
                  <button
                    style={{ padding: '12px 24px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}
                    onClick={() => navigate('/customer/printing-orders')}
                  >
                    View My Orders
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
                  You can also track your order anytime from <strong>Customer Portal → Printing Orders</strong>
                </p>
              </div>

            /* ── ORDER FORM ── */
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="psp-modal-body">

                  {/* ── Customer Info (pre-filled, read-only) ── */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 0 }}>
                    <div className="psp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <User size={14} /> Customer Information
                    </div>
                    <div className="psp-form-row">
                      <div className="psp-form-group">
                        <label className="psp-form-label">Full Name</label>
                        <input type="text" className="psp-form-input" value={userName} disabled />
                      </div>
                      <div className="psp-form-group">
                        <label className="psp-form-label">Email</label>
                        <input type="email" className="psp-form-input" value={currentUser?.email || ''} disabled />
                      </div>
                    </div>
                    <div className="psp-form-group" style={{ marginTop: 12 }}>
                      <label className="psp-form-label">Phone Number</label>
                      <input type="text" className="psp-form-input" value={currentUser?.phone || ''} disabled />
                    </div>
                  </div>

                  {/* ── Service Type ── */}
                  <div className="psp-section-divider">
                    <Layers size={14} /> Order Specifications
                  </div>

                  <div className="psp-form-group">
                    <label className="psp-form-label"><BookOpen size={14} /> Service Type</label>
                    <select
                      id="psp-product-type"
                      className="psp-form-input"
                      value={productType}
                      onChange={e => setProductType(e.target.value)}
                      required
                    >
                      {PRODUCT_TYPES.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Paper Size</label>
                      <select
                        id="psp-paper-type"
                        className="psp-form-input"
                        value={paperType}
                        onChange={e => setPaperType(e.target.value)}
                        required
                      >
                        {PAPER_TYPES.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="psp-form-group">
                      <label className="psp-form-label">Binding Type</label>
                      <select
                        id="psp-binding-type"
                        className="psp-form-input"
                        value={bindingType}
                        onChange={e => setBindingType(e.target.value)}
                      >
                        {BINDING_TYPES.map(b => (
                          <option key={b.code} value={b.code}>{b.name}{b.price > 0 ? ` (+${b.price} ETB/copy)` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Pages Per Copy</label>
                      <input
                        id="psp-pages-per-copy"
                        type="number"
                        min="1"
                        className="psp-form-input"
                        value={pagesPerCopy}
                        onChange={e => setPagesPerCopy(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                    <div className="psp-form-group">
                      <label className="psp-form-label">Number of Copies</label>
                      <input
                        id="psp-quantity"
                        type="number"
                        min="1"
                        className="psp-form-input"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                  </div>

                  {/* Color printing checkbox */}
                  <label className="psp-check-row" htmlFor="psp-color-printing">
                    <input
                      id="psp-color-printing"
                      type="checkbox"
                      checked={colorPrinting}
                      onChange={e => setColorPrinting(e.target.checked)}
                    />
                    <Palette size={18} color="#d97706" />
                    <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                      Color Printing <span style={{ fontWeight: 400, color: '#d97706' }}>(adds ×2 price per page)</span>
                    </span>
                  </label>

                  {/* Due date */}
                  <div className="psp-form-group">
                    <label className="psp-form-label"><Calendar size={14} /> Required By Date <span>(When do you need it?)</span></label>
                    <input
                      id="psp-due-date"
                      type="date"
                      className="psp-form-input"
                      min={minDate}
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Special instructions */}
                  <div className="psp-form-group">
                    <label className="psp-form-label"><AlignLeft size={14} /> Special Instructions <span>(Optional)</span></label>
                    <textarea
                      id="psp-special-instructions"
                      className="psp-form-input"
                      rows={3}
                      placeholder="e.g. double-sided, specific margins, insert blank pages, etc."
                      value={specialInstructions}
                      onChange={e => setSpecial(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* File Upload (like prescription in pharmacy) */}
                  <div className="psp-section-divider">
                    <UploadCloud size={14} /> Document Upload
                  </div>
                  <div className="psp-form-group">
                    <label className="psp-form-label">
                      Upload Your Document <span>(Optional — PDF, DOCX, JPG, PNG)</span>
                    </label>
                    <label style={{ cursor: 'pointer' }}>
                      <div className={`psp-file-upload${docFile ? ' has-file' : ''}`}>
                        <UploadCloud size={32} color={docFile ? '#0D7C66' : '#94a3b8'} style={{ marginBottom: 8 }} />
                        <p style={{ margin: 0, fontWeight: 700, color: docFile ? '#0D7C66' : '#334155' }}>
                          {docFile ? docFile.name : 'Click to choose your document file'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                          {docFile ? `${(docFile.size / 1024).toFixed(1)} KB selected` : 'PDF, DOCX, JPG or PNG — Max 20MB'}
                        </p>
                        {docFile && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setDocFile(null); }}
                            style={{ marginTop: 8, padding: '4px 12px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                          >
                            Remove File
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => setDocFile(e.target.files[0] || null)}
                      />
                    </label>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                      💡 You can also bring your file on a USB drive or email it to <strong>print@sutana.com</strong> with your order number.
                    </p>
                  </div>

                  {/* ── Price Summary ── */}
                  <div className="psp-price-summary">
                    <div className="psp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Calculator size={14} /> Price Summary
                    </div>
                    <div className="psp-price-row">
                      <span>Printing ({pagesPerCopy} pages × {PAPER_TYPES.find(p => p.code === paperType)?.price} ETB{colorPrinting ? ' × 2' : ''})</span>
                      <span style={{ fontWeight: 700 }}>{pricing.subtotal.toFixed(2)} ETB</span>
                    </div>
                    {bindingType !== 'None' && (
                      <div className="psp-price-row">
                        <span>{BINDING_TYPES.find(b => b.code === bindingType)?.name} ({quantity} copies)</span>
                        <span style={{ fontWeight: 700 }}>{pricing.bindingCost.toFixed(2)} ETB</span>
                      </div>
                    )}
                    <div className="psp-price-row">
                      <span>VAT ({fmtPct(pricing.rate)})</span>
                      <span style={{ fontWeight: 700 }}>{pricing.vat.toFixed(2)} ETB</span>
                    </div>
                    <div className="psp-price-row psp-price-total">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>💰 Total Amount Due (incl. VAT)</span>
                      <span>{pricing.totalPrice.toFixed(2)} ETB</span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="psp-error-box">
                      <AlertTriangle size={18} /> {submitError}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="psp-modal-footer">
                  <button type="button" className="psp-cancel-btn" onClick={closeModal}>Cancel</button>
                  <button type="submit" id="psp-submit-order" className="psp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting
                      ? <><div className="psp-spinner" /> Submitting…</>
                      : <><ShoppingCart size={18} /> Confirm Order</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isCalcOpen && <LiveCalculator onClose={() => setIsCalcOpen(false)} />}
    </div>
  );
}
