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
  ArrowRight, UserPlus, LogIn, Sparkles, Wallet
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   STYLES (Master Design System)
════════════════════════════════════════════════════════ */
const STYLES = `
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --psp-bg: 0 0% 100%;
  --psp-fg: 222.2 84% 4.9%;
  --psp-primary: 142 70% 28%;
  --psp-primary-fg: 0 0% 100%;
  --psp-primary-dark: 142 75% 18%;
  --psp-accent: 50 100% 50%;
  --psp-muted: 210 40% 96.1%;
  --psp-muted-fg: 215.4 16.3% 46.9%;
  --psp-border: 214.3 31.8% 91.4%;
  --psp-radius: 0.75rem;
  --psp-radius-sm: 0.5rem;
  --psp-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --psp-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --psp-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.psp-root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: hsl(var(--psp-bg));
  min-height: 100vh;
}

.psp-container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* ─────────────── HERO ─────────────── */
.psp-hero {
  position: relative;
  width: 100%;
  height: 500px;
  background-color: hsl(var(--psp-fg));
  display: flex;
  align-items: center;
  justify-content: center;
}
.psp-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6));
  z-index: 1;
}
.psp-hero-grid {
  position: absolute;
  inset: 0;
  z-index: 2;
  background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}
.psp-hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
}
.psp-hero-title {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: hsl(var(--psp-accent));
}
.psp-hero-title span { color: hsl(var(--psp-bg)); }
.psp-hero-sub {
  font-size: 1.125rem;
  line-height: 1.625;
  color: hsl(var(--psp-bg) / 0.85);
  max-width: 600px;
  font-weight: 500;
}

/* ─────────────── BUTTONS ─────────────── */
.psp-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: hsl(var(--psp-primary));
  color: hsl(var(--psp-primary-fg));
  font-weight: 600;
  font-size: 1rem;
  border-radius: var(--psp-radius-sm);
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: none;
  cursor: pointer;
}
.psp-btn-primary:hover:not(:disabled) {
  background-color: hsl(var(--psp-primary-dark));
  transform: translateY(-2px);
}
.psp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.psp-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: hsl(var(--psp-bg));
  color: hsl(var(--psp-fg));
  font-weight: 600;
  font-size: 1rem;
  border-radius: var(--psp-radius-sm);
  border: 1px solid hsl(var(--psp-border));
  transition: background-color 0.2s ease;
  cursor: pointer;
}
.psp-btn-secondary:hover:not(:disabled) {
  background-color: hsl(var(--psp-muted));
}

/* ─────────────── SECTIONS ─────────────── */
.psp-section { padding: 4rem 0; }
.psp-section-bg { background-color: hsl(var(--psp-muted)); }
.psp-section-header {
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.psp-section-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(var(--psp-primary));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
.psp-section-title {
  font-size: 1.875rem;
  font-weight: 800;
  line-height: 1.2;
  color: hsl(var(--psp-fg));
}

/* ─────────────── PRODUCT CARDS ─────────────── */
.psp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
.psp-card {
  background-color: hsl(var(--psp-bg));
  border: 1px solid hsl(var(--psp-border));
  border-radius: var(--psp-radius);
  overflow: hidden;
  box-shadow: var(--psp-shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.psp-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--psp-shadow-lg);
}
.psp-card-img-wrap {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: hsl(var(--psp-muted));
}
.psp-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.psp-card:hover .psp-card-img { transform: scale(1.05); }
.psp-card-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: hsl(var(--psp-bg) / 0.9);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
}
.psp-card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.psp-card-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
  margin-bottom: 0.5rem;
}
.psp-card-desc {
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  line-height: 1.625;
  margin-bottom: 1.5rem;
  flex: 1;
}
.psp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
}
.psp-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: hsl(var(--psp-primary));
}
.psp-price-sub { font-size: 0.75rem; color: hsl(var(--psp-muted-fg)); }

/* ─────────────── HOW TO ORDER STEPS ─────────────── */
.psp-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}
.psp-step {
  background-color: hsl(var(--psp-bg));
  border: 1px solid hsl(var(--psp-border));
  border-radius: var(--psp-radius);
  padding: 2rem;
  text-align: center;
  box-shadow: var(--psp-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.psp-step:hover {
  transform: translateY(-4px);
  box-shadow: var(--psp-shadow-md);
}
.psp-step-num {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: hsl(var(--psp-primary-light));
  color: hsl(var(--psp-primary-dark));
  font-size: 1.25rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}
.psp-step-title {
  font-size: 1rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
  margin-bottom: 0.5rem;
}
.psp-step-desc {
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  line-height: 1.625;
}

/* ─────────────── PRICING TABLE ─────────────── */
.psp-table-wrap {
  background-color: hsl(var(--psp-bg));
  border: 1px solid hsl(var(--psp-border));
  border-radius: var(--psp-radius);
  overflow-x: auto;
  box-shadow: var(--psp-shadow-sm);
}
.psp-table {
  width: 100%;
  border-collapse: collapse;
}
.psp-table th, .psp-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid hsl(var(--psp-border));
}
.psp-table th {
  background-color: hsl(var(--psp-muted));
  font-weight: 600;
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  white-space: nowrap;
}
.psp-table td {
  font-size: 1rem;
  color: hsl(var(--psp-fg));
}
.psp-table tbody tr:last-child td { border-bottom: none; }
.psp-table tbody tr:hover { background-color: hsl(var(--psp-muted) / 0.5); }
.psp-pricing-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  margin-top: 1.5rem;
}

/* ─────────────── FAQ ─────────────── */
.psp-faq-inner {
  max-width: 800px;
  margin: 0 auto;
}
.psp-faq-item {
  border-bottom: 1px solid hsl(var(--psp-border));
}
.psp-faq-item:first-of-type { border-top: 1px solid hsl(var(--psp-border)); }
.psp-faq-q {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 0;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(var(--psp-fg));
  cursor: pointer;
  text-align: left;
}
.psp-faq-q:focus { outline: none; box-shadow: inset 0 0 0 2px hsl(var(--psp-primary) / 0.2); border-radius: var(--psp-radius-sm); }
.psp-faq-a {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  line-height: 1.625;
}
.psp-faq-a.open {
  max-height: 300px;
  padding-bottom: 1.5rem;
}

/* ─────────────── MODALS & FORMS ─────────────── */
.psp-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  overflow-y: auto;
  padding: 90px 1rem 2rem;       /* 90px top = clears the sticky navbar */
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.psp-modal {
  margin: 0 auto;
  background-color: hsl(var(--psp-bg));
  border-radius: var(--psp-radius);
  width: 100%;
  max-width: 620px;
  box-shadow: 0 25px 50px rgb(0 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  /* No overflow:hidden here — lets dropdowns render fully */
}
.psp-modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid hsl(var(--psp-border));
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: hsl(var(--psp-bg));
  z-index: 10;
  border-radius: var(--psp-radius) var(--psp-radius) 0 0;
  /* NOT sticky — removed position:sticky so header is always visible */
}
.psp-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.psp-modal-subtitle {
  font-size: 0.875rem;
  color: hsl(var(--psp-muted-fg));
  margin-top: 0.25rem;
}
.psp-close-btn {
  background: hsl(var(--psp-muted));
  border: none;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--psp-radius-sm);
  cursor: pointer;
  color: hsl(var(--psp-muted-fg));
  transition: background-color 0.2s ease, color 0.2s ease;
}
.psp-close-btn:hover {
  background-color: hsl(var(--psp-border));
  color: hsl(var(--psp-fg));
}
.psp-modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.psp-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.psp-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.psp-form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--psp-fg));
}
.psp-form-label span {
  font-weight: 400;
  color: hsl(var(--psp-muted-fg));
}
.psp-form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid hsl(var(--psp-border));
  border-radius: var(--psp-radius-sm);
  background-color: hsl(var(--psp-bg));
  font-size: 1rem;
  font-family: inherit;
  color: hsl(var(--psp-fg));
  line-height: 1.5;
  min-height: 3rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: auto;
  -webkit-appearance: auto;
  box-sizing: border-box;
}
select.psp-form-input {
  height: 3rem;
  padding-top: 0;
  padding-bottom: 0;
  cursor: pointer;
}
.psp-form-input:focus {
  outline: none;
  border-color: hsl(var(--psp-primary));
  box-shadow: 0 0 0 2px hsl(var(--psp-primary) / 0.2);
}
.psp-form-input:disabled {
  background-color: hsl(var(--psp-muted));
  color: hsl(var(--psp-muted-fg));
  cursor: not-allowed;
}
.psp-file-upload {
  border: 2px dashed hsl(var(--psp-border));
  border-radius: var(--psp-radius-sm);
  padding: 2rem 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: hsl(var(--psp-muted) / 0.5);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.psp-file-upload:hover {
  border-color: hsl(var(--psp-primary));
  background-color: hsl(var(--psp-primary-light) / 0.3);
}
.psp-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid hsl(var(--psp-border));
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background-color: hsl(var(--psp-bg));
  border-radius: 0 0 var(--psp-radius) var(--psp-radius);
}

/* ─────────────── UTILITIES & SMALLER COMPONENTS ─────────────── */
.psp-section-divider {
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
  margin-top: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid hsl(var(--psp-border));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.psp-price-summary {
  background-color: hsl(var(--psp-primary-light) / 0.3);
  border: 1px solid hsl(var(--psp-primary-light));
  border-radius: var(--psp-radius-sm);
  padding: 1.5rem;
}
.psp-price-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: hsl(var(--psp-fg));
  margin-bottom: 0.5rem;
}
.psp-price-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.125rem;
  font-weight: 700;
  color: hsl(var(--psp-primary-dark));
  border-top: 1px solid hsl(var(--psp-border));
  padding-top: 1rem;
  margin-top: 1rem;
}
.psp-check-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: hsl(var(--psp-accent) / 0.1);
  border: 1px solid hsl(var(--psp-accent) / 0.3);
  border-radius: var(--psp-radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--psp-fg));
}
.psp-check-row input[type=checkbox] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}
.psp-login-gate {
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}
.psp-login-gate-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background-color: hsl(var(--psp-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}
.psp-login-gate-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--psp-fg));
}
.psp-login-gate-sub {
  font-size: 1rem;
  color: hsl(var(--psp-muted-fg));
  max-width: 400px;
  line-height: 1.625;
}
.psp-login-gate-btns {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.psp-success-body {
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.psp-success-emoji { font-size: 4rem; }
.psp-success-title { font-size: 1.5rem; font-weight: 700; color: hsl(var(--psp-primary)); }
.psp-success-sub { font-size: 1rem; color: hsl(var(--psp-muted-fg)); line-height: 1.625; }
.psp-error-box {
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: var(--psp-radius-sm);
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ─────────────── RESPONSIVE ─────────────── */
@media (max-width: 768px) {
  .psp-hero-title { font-size: 2.25rem; }
  .psp-form-row { grid-template-columns: 1fr; }
  .psp-section { padding: 3rem 0; }
}
@media (max-width: 640px) {
  .psp-login-gate-btns { flex-direction: column; width: 100%; }
  .psp-login-gate-btns button { width: 100%; }
}

/* ─────────────── CALCULATOR MODAL ─────────────── */
.calc-overlay {
  position: fixed; inset: 0; background-color: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px); display: flex; align-items: flex-start;
  justify-content: center; z-index: 9999;
  padding: 80px 1rem 1rem;          /* 80px top clears the navbar */
  overflow-y: auto;
}
.calc-modal {
  background-color: hsl(var(--psp-bg));
  width: 100%; max-width: 420px;
  border-radius: var(--psp-radius);
  box-shadow: var(--psp-shadow-lg);
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.25rem;
  margin: auto;                      /* vertically centered when it fits */
  max-height: calc(100vh - 100px);  /* never taller than viewport */
  overflow-y: auto;                  /* scroll if content is too tall */
}
.calc-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 1.125rem; font-weight: 700; color: hsl(var(--psp-fg));
}
.calc-close {
  background-color: hsl(var(--psp-muted)); border: none; width: 2rem; height: 2rem;
  border-radius: var(--psp-radius-sm); display: flex; align-items: center; justify-content: center;
  color: hsl(var(--psp-muted-fg)); cursor: pointer; transition: 0.2s; flex-shrink: 0;
}
.calc-close:hover { background-color: hsl(var(--psp-border)); color: hsl(var(--psp-fg)); }

/* ─────────────── LEGACY SUPPORT CLASSES ─────────────── */
/* Spinner */
@keyframes psp-spin { to { transform: rotate(360deg); } }
.psp-spinner {
  width: 1.25rem; height: 1.25rem;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 9999px;
  animation: psp-spin 0.7s linear infinite;
  display: inline-block;
}

/* Gate buttons (login modal) */
.psp-gate-btn-login {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background-color: hsl(var(--psp-primary));
  color: hsl(var(--psp-primary-fg));
  padding: 0.75rem 1.5rem; border: none; border-radius: var(--psp-radius-sm);
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  font-family: inherit;
}
.psp-gate-btn-login:hover {
  background-color: hsl(var(--psp-primary-dark));
  transform: translateY(-2px);
}
.psp-gate-btn-register {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background-color: hsl(var(--psp-bg));
  color: hsl(var(--psp-fg));
  padding: 0.75rem 1.5rem;
  border: 1px solid hsl(var(--psp-border));
  border-radius: var(--psp-radius-sm);
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: inherit;
}
.psp-gate-btn-register:hover { background-color: hsl(var(--psp-muted)); }

/* Print receipt button */
.psp-print-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background-color: hsl(var(--psp-primary));
  color: hsl(var(--psp-primary-fg));
  padding: 0.875rem 2rem; border: none; border-radius: var(--psp-radius-sm);
  font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  font-family: inherit;
}
.psp-print-btn:hover { background-color: hsl(var(--psp-primary-dark)); transform: translateY(-2px); }

/* View orders button */
.psp-orders-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.875rem 2rem;
  background-color: hsl(var(--psp-bg)); color: hsl(var(--psp-fg));
  border: 1px solid hsl(var(--psp-border)); border-radius: var(--psp-radius-sm);
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s ease; font-family: inherit;
}
.psp-orders-btn:hover { background-color: hsl(var(--psp-muted)); }

/* Pricing section container classes */
.psp-pricing { padding: 4rem 1.5rem; }
.psp-pricing-inner { max-width: 900px; margin: 0 auto; }
.psp-pricing-title { font-size: 1.875rem; font-weight: 800; color: hsl(var(--psp-fg)); }
.psp-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.psp-how { padding: 4rem 1.5rem; background-color: hsl(var(--psp-muted)); }
.psp-how-inner { max-width: 1100px; margin: 0 auto; }
.psp-main { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
`;

/* ═══════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════ */
const DEFAULT_PAPER_TYPES = [
  { code: 'A4', name: 'A4 (210×297mm)', base_price: 0.50, color_multiplier: 2.0 },
  { code: 'A5', name: 'A5 (148×210mm)', base_price: 0.75, color_multiplier: 2.0 },
  { code: 'A3', name: 'A3 (297×420mm)', base_price: 1.00, color_multiplier: 2.0 },
];
const DEFAULT_BINDING_TYPES = [
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
const calcPrice = ({ paperType, pagesPerCopy, quantity, colorPrinting, bindingType, vatCtx, paperTypes, bindingTypes }) => {
  const _paperTypes   = paperTypes || DEFAULT_PAPER_TYPES;
  const _bindingTypes = bindingTypes || DEFAULT_BINDING_TYPES;
  const pData         = _paperTypes.find(p => p.code === paperType);
  const basePrice     = parseFloat(pData?.base_price ?? pData?.price ?? 0.50);
  const colorMult     = parseFloat(pData?.color_multiplier ?? 2.0);
  const multiplier    = colorPrinting ? colorMult : 1.0;
  const pricePerUnit  = pagesPerCopy * basePrice * multiplier;
  const bindingCost   = (parseFloat(_bindingTypes.find(b => b.code === bindingType)?.price ?? 0)) * quantity;
  const subtotal      = pricePerUnit * quantity;
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
const LiveCalculator = ({ onClose, paperTypes, bindingTypes }) => {
  const _paperTypes   = paperTypes  || DEFAULT_PAPER_TYPES;
  const _bindingTypes = bindingTypes || DEFAULT_BINDING_TYPES;
  const [paperType, setPaperType] = useState(_paperTypes[0]?.code || 'A4');
  const [pagesPerCopy, setPagesPerCopy] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [colorPrinting, setColorPrinting] = useState(false);
  const [bindingType, setBindingType] = useState(_bindingTypes[0]?.code || 'None');
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  const pricing = calcPrice({ paperType, pagesPerCopy, quantity, colorPrinting, bindingType, vatCtx, paperTypes: _paperTypes, bindingTypes: _bindingTypes });

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
              {_paperTypes.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
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
              {_bindingTypes.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
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

  // Live posts from API (replaces hardcoded PRODUCT_TYPES)
  const [liveProducts, setLiveProducts] = useState(PRODUCT_TYPES); // fallback to hardcoded while loading
  const [paperTypes, setPaperTypes]     = useState(DEFAULT_PAPER_TYPES);
  const [bindingTypes, setBindingTypes] = useState(DEFAULT_BINDING_TYPES);

  // Pricing rows derived from live data — keeps pricing table always in sync
  const pricingRows = [
    {
      name: 'Per Page Rate (B/W)',
      base: paperTypes.map(p => `${p.code}: ${parseFloat(p.base_price || p.price || 0).toFixed(2)} ETB`).join(' | '),
      color: paperTypes.map(p => `${p.code}: ${(parseFloat(p.base_price || p.price || 0) * parseFloat(p.color_multiplier || 2)).toFixed(2)} ETB`).join(' | '),
      bind: '—',
    },
    ...bindingTypes.filter(b => b.code !== 'None').map(b => ({
      name: b.name,
      base: '—',
      color: '—',
      bind: `${parseFloat(b.price).toFixed(0)} ETB / copy`,
    })),
  ];

  useEffect(() => {
    // Posts
    axios.get('/printing/posts')
      .then(res => {
        const raw = res?.data?.data || res?.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          setLiveProducts(raw.map(p => ({
            code: p.code,
            name: p.name,
            img: p.image_url ? `http://localhost:5000/${p.image_url}` : null,
            desc: p.description || '',
            badge: p.badge_label || p.code,
            base_price: p.base_price_per_page,
          })));
        }
      })
      .catch(() => {});

    // Paper types
    axios.get('/printing/public/paper-types')
      .then(res => {
        const pts = res?.data?.data?.paperTypes;
        if (Array.isArray(pts) && pts.length > 0) setPaperTypes(pts);
      })
      .catch(() => {});

    // Binding types
    axios.get('/printing/public/binding-types')
      .then(res => {
        const bts = res?.data?.data?.bindingTypes;
        if (Array.isArray(bts) && bts.length > 0) setBindingTypes(bts);
      })
      .catch(() => {});
  }, []);

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

  // Payment fields
  const [paymentMethod, setPaymentMethod]     = useState('');
  const [paymentReference, setPaymentRef]     = useState('');
  const [paymentScreenshot, setPaymentScreen] = useState(null);
  const [financeAccounts, setFinanceAccounts] = useState([]);

  // Load finance accounts
  const loadFinanceAccounts = async () => {
    try {
      const result = await axios.get('/finance-bank');
      if (result && result.success && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      } else if (Array.isArray(result)) {
        setFinanceAccounts(result);
      } else if (result && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      }
    } catch (e) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const result2 = await axios.get('/finance-bank', { headers: { Authorization: `Bearer ${token}` } });
          if (result2 && Array.isArray(result2.data)) setFinanceAccounts(result2.data);
          else if (Array.isArray(result2)) setFinanceAccounts(result2);
        } catch (e2) {
          console.error('[PrintingPage] Failed to load finance accounts:', e2.message);
        }
      }
    }
  };

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
    loadFinanceAccounts();
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
  const pricing = calcPrice({ paperType, pagesPerCopy: parseInt(pagesPerCopy) || 1, quantity: parseInt(quantity) || 1, colorPrinting, bindingType, vatCtx, paperTypes, bindingTypes });

  // Today + 1 for min due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const filtered = catFilter === 'all'
    ? liveProducts
    : liveProducts.filter(p => p.code === catFilter);

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

    // Payment Validation
    if (paymentMethod) {
      const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
      if (acc && acc.account_type !== 'Cash') {
        if (!paymentReference && !paymentScreenshot) {
          setSubmitError('For Bank or Telebirr payments, you must provide either a Transaction Reference or a Payment Screenshot.');
          setIsSubmitting(false);
          return;
        }
        if (paymentReference && paymentScreenshot) {
          setSubmitError('Please provide either a Transaction Reference OR a Payment Screenshot, but not both.');
          setIsSubmitting(false);
          return;
        }
      }
    } else {
      setSubmitError('Please select a payment method.');
      setIsSubmitting(false);
      return;
    }

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

      // Payment details
      const selectedAcc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
      formData.append('paymentMethod', selectedAcc ? selectedAcc.account_name : paymentMethod);
      formData.append('paymentReference', paymentReference);
      if (paymentScreenshot) formData.append('paymentScreenshot', paymentScreenshot);

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
    const svcName = liveProducts.find(p => p.code === orderResult.productType)?.name ?? orderResult.productType;
    const paperName = paperTypes.find(p => p.code === orderResult.paperType)?.name ?? orderResult.paperType;
    const bindingName = bindingTypes.find(b => b.code === orderResult.bindingType)?.name ?? orderResult.bindingType;
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
<tr><td>Printing (${orderResult.pagesPerCopy} pages × ${(paperTypes.find(p=>p.code===orderResult.paperType)?.base_price||paperTypes.find(p=>p.code===orderResult.paperType)?.price||0.50)} ETB${orderResult.colorPrinting?' × 2 (color)':''})</td><td>${((paperTypes.find(p=>p.code===orderResult.paperType)?.base_price||paperTypes.find(p=>p.code===orderResult.paperType)?.price||0.50) * (orderResult.colorPrinting?2:1))} ETB/page</td><td>${orderResult.quantity}</td><td>${pricing.subtotal.toFixed(2)}</td></tr>
${orderResult.bindingType !== 'None' ? `<tr><td>${bindingName}</td><td>${bindingTypes.find(b=>b.code===orderResult.bindingType)?.price||0} ETB/copy</td><td>${orderResult.quantity}</td><td>${pricing.bindingCost.toFixed(2)}</td></tr>` : ''}
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
          <p className="psp-hero-sub">
            Professional printing solutions for students, academics, and businesses. Fast turnaround, high quality.
          </p>
        </div>
      </div>

      {/* ── Service Cards ── */}
      <div className="psp-section">
        <div className="psp-container">
          <div className="psp-section-header" style={{ textAlign: 'center' }}>
            <div className="psp-section-label">Our Catalog</div>
            <h2 className="psp-section-title">
              {catFilter === 'all' ? 'All Printing Services' : liveProducts.find(p => p.code === catFilter)?.name}
            </h2>
          </div>

          <div className="psp-grid">
            {filtered.map((svc, i) => (
              <div key={svc.code} className="psp-card" style={{ animationDelay: i * 0.07 + 's' }}>
                <div className="psp-card-img-wrap">
                  {svc.img ? (
                    <img src={svc.img} className="psp-card-img" alt={svc.name} />
                  ) : (
                    <div style={{ height: '100%', background: 'hsl(var(--psp-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={60} color="rgba(255,255,255,0.4)" />
                    </div>
                  )}
                  <div className="psp-card-badge">{svc.badge || svc.code}</div>
                </div>
                <div className="psp-card-body">
                  <h3 className="psp-card-name">{svc.name}</h3>
                  <p className="psp-card-desc">{svc.desc}</p>
                  <div className="psp-card-footer">
                    <div>
                      <div className="psp-price">From {parseFloat(svc.base_price || 0.50).toFixed(2)} ETB</div>
                      <div className="psp-price-sub">per page</div>
                    </div>
                    <button className="psp-btn-primary" onClick={() => handleOpenOrder(svc)}>
                      <ShoppingCart size={16} /> Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How to Order ── */}
      <div className="psp-section psp-section-bg">
        <div className="psp-container">
          <div className="psp-section-header">
            <div className="psp-section-label">Simple Process</div>
            <h2 className="psp-section-title">How to Place Your Order</h2>
          </div>
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

      {/* ── Pricing Table ── */}
      <div className="psp-section">
        <div className="psp-container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="psp-section-title" style={{ margin: 0 }}>Pricing Guide</h2>
            <button className="psp-btn-primary" onClick={() => setIsCalcOpen(true)}>
              <Calculator size={16} /> Calculator
            </button>
          </div>
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
                {pricingRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--psp-primary))' }}>{r.name}</td>
                    <td>{r.base}</td>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--psp-accent))' }}>{r.color}</td>
                    <td>{r.bind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="psp-pricing-note">
            <Info size={16} />
            Tax Receipts are priced by approval quantity. Contact us for custom bulk pricing.
          </p>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div className="psp-section psp-section-bg">
        <div className="psp-container psp-faq-inner">
          <div className="psp-section-header">
            <h2 className="psp-section-title">Frequently Asked Questions</h2>
          </div>
          {FAQS.map((f, i) => (
            <div className="psp-faq-item" key={i}>
              <button className="psp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                {openFaq === i
                  ? <ChevronUp size={20} color="hsl(var(--psp-primary))" />
                  : <ChevronDown size={20} color="hsl(var(--psp-muted-fg))" />}
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
                      {liveProducts.map(p => (
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
                        {paperTypes.map(p => (
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
                        {bindingTypes.map(b => (
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

                  {/* Payment Details */}
                  <div className="psp-section-divider">
                    <Wallet size={14} /> Payment details
                  </div>
                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Payment Method *</label>
                      {financeAccounts.length === 0 ? (
                        <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 'var(--psp-radius)', fontSize: '0.875rem', color: '#92400e' }}>
                          ⏳ Loading payment accounts...
                        </div>
                      ) : (
                        <select required className="psp-form-input"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                        >
                          <option value="">- Select Payment Account -</option>
                          {['Bank', 'Mobile Wallet'].map(type => {
                            const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                            if (group.length === 0) return null;
                            return (
                              <optgroup key={type} label={type}>
                                {group.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.account_name}{acc.account_number ? ` - ${acc.account_number}` : ''}{acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                      )}
                    </div>
                    
                    <div className="psp-form-group">
                      <label className="psp-form-label">Transaction Reference</label>
                      <input type="text" className="psp-form-input" placeholder="e.g. TXN-123456"
                        value={paymentReference} onChange={e => setPaymentRef(e.target.value)} />
                    </div>
                  </div>

                  {/* Auto-fill account details panel */}
                  {paymentMethod && (() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                    if (!acc) return null;
                    const isCash = acc.account_type === 'Cash';
                    return (
                      <div style={{ background: 'hsl(var(--psp-primary) / 0.07)', padding: '0.75rem 1rem', borderRadius: 'var(--psp-radius)', border: '1px solid hsl(var(--psp-primary) / 0.2)', fontSize: '0.875rem', color: 'hsl(var(--psp-fg))', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: '1rem' }}>
                        <Wallet size={18} color="hsl(var(--psp-primary))" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'hsl(var(--psp-primary))' }}>{isCash ? 'Pay in Cash at Branch:' : 'Transfer Payment To:'}</div>
                          <div><strong>Account Name:</strong> {acc.account_name}</div>
                          {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                          {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                          {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                          {!isCash && <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--psp-muted-fg))' }}>After payment, enter the transaction reference number above.</div>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screenshot upload */}
                  {paymentMethod && (() => {
                      const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                      if (acc && acc.account_type === 'Cash') return null;
                      return (
                        <div className="psp-form-group" style={{ marginTop: '1rem' }}>
                          <label className="psp-form-label"><UploadCloud size={14} /> Payment Screenshot <span style={{ fontWeight: 400 }}>(Optional if Transaction Reference is provided)</span></label>
                          <label style={{ cursor: 'pointer' }}>
                            <div className={`psp-file-upload${paymentScreenshot ? ' has-file' : ''}`}>
                              <UploadCloud size={24} color={paymentScreenshot ? '#0D7C66' : '#94a3b8'} style={{ marginBottom: 4 }} />
                              <p style={{ margin: 0, fontWeight: 700, color: paymentScreenshot ? '#0D7C66' : '#334155', fontSize: '0.875rem' }}>
                                {paymentScreenshot ? paymentScreenshot.name : 'Click to upload payment screenshot'}
                              </p>
                              {paymentScreenshot && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setPaymentScreen(null); }}
                                  style={{ marginTop: 8, padding: '2px 8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                                >
                                  Remove Screenshot
                                </button>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => setPaymentScreen(e.target.files[0] || null)}
                            />
                          </label>
                        </div>
                      )
                  })()}

                  {/* ── Price Summary ── */}
                  <div className="psp-price-summary" style={{ marginTop: '1.5rem' }}>
                    <div className="psp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Calculator size={14} /> Price Summary
                    </div>
                    <div className="psp-price-row">
                      <span>Printing ({pagesPerCopy} pages × {parseFloat(paperTypes.find(p => p.code === paperType)?.base_price ?? paperTypes.find(p => p.code === paperType)?.price ?? 0.50).toFixed(2)} ETB{colorPrinting ? ' × 2' : ''})</span>
                      <span style={{ fontWeight: 700 }}>{pricing.subtotal.toFixed(2)} ETB</span>
                    </div>
                    {bindingType !== 'None' && (
                      <div className="psp-price-row">
                        <span>{bindingTypes.find(b => b.code === bindingType)?.name} ({quantity} copies)</span>
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
                  <button type="button" className="psp-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" id="psp-submit-order" className="psp-btn-primary" disabled={isSubmitting}>
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

      {isCalcOpen && <LiveCalculator onClose={() => setIsCalcOpen(false)} paperTypes={paperTypes} bindingTypes={bindingTypes} />}
    </div>
  );
}
