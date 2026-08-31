import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import pharmacyService from '../../services/pharmacyService';
import axios from '../../services/apiClient';
import {
  Search, Pill, Package, UploadCloud, X, ShoppingCart,
  ChevronDown, ChevronUp, Phone, Clock, MapPin, Star,
  Shield, Award, Truck, CreditCard, Heart, AlertCircle, Wallet
} from 'lucide-react';
import pharmacyHero from '../../assets/hero-section/pharmacy.jpg';
import licFikerte from '../../assets/license_fikerte.jpg';
import licAbebe from '../../assets/license_abebe.jpg';
import licMeron from '../../assets/license_meron.jpg';
import licDawit from '../../assets/license_dawit.jpg';

/* ─────────────────────────────────────────────────────────────
   Design tokens — inline <style> using the master design system
───────────────────────────────────────────────────────────── */
const STYLES = `
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --ph-bg:            0 0% 100%;
  --ph-fg:            222 47% 11%;
  --ph-primary:       152 69% 31%;
  --ph-primary-dark:  152 69% 22%;
  --ph-primary-light: 152 60% 95%;
  --ph-accent:        47 100% 50%;
  --ph-muted:         210 40% 96%;
  --ph-muted-fg:      215 16% 47%;
  --ph-border:        214 32% 91%;
  --ph-radius:        0.75rem;
  --ph-radius-sm:     0.5rem;
  --ph-shadow-sm:     0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --ph-shadow-md:     0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --ph-shadow-lg:     0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* ── Base ── */
.ph-root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: hsl(var(--ph-muted));
  color: hsl(var(--ph-fg));
  min-height: 100vh;
  line-height: 1.625;
}

/* ── Container ── */
.ph-container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* ── Section spacing ── */
.ph-section { padding: 4rem 0; }
.ph-section-sm { padding: 2.5rem 0; }

/* ── Section labels & titles ── */
.ph-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: hsl(var(--ph-primary));
  background: hsl(var(--ph-primary-light));
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 0.75rem;
}
.ph-section-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: hsl(var(--ph-fg));
  margin-bottom: 1rem;
}
.ph-section-sub {
  font-size: 1rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.625;
  max-width: 600px;
}

/* ─────────────── HERO ─────────────── */
.ph-hero {
  position: relative;
  height: 480px;
  background-image:
    linear-gradient(to bottom, rgba(15,30,20,0.68) 0%, rgba(10,60,38,0.72) 100%),
    url(${pharmacyHero});
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 1.5rem;
}
.ph-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  color: hsl(var(--ph-accent));
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  backdrop-filter: blur(8px);
  margin-bottom: 1.25rem;
}
.ph-hero-title {
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
}
.ph-hero-title span { color: hsl(var(--ph-accent)); }
.ph-hero-sub {
  font-size: 1.0625rem;
  color: rgba(255,255,255,0.8);
  max-width: 520px;
  margin-bottom: 2rem;
  line-height: 1.6;
}
.ph-hero-search {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 540px;
  background: hsl(var(--ph-bg));
  border-radius: var(--ph-radius);
  overflow: hidden;
  box-shadow: var(--ph-shadow-lg);
}
.ph-hero-search input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.875rem 1.25rem;
  font-size: 0.9375rem;
  font-family: inherit;
  color: hsl(var(--ph-fg));
  background: transparent;
}
.ph-hero-search button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: hsl(var(--ph-primary));
  color: #fff;
  border: none;
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ph-hero-search button:hover { background: hsl(var(--ph-primary-dark)); }
.ph-hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}
.ph-hero-stat {
  text-align: center;
}
.ph-hero-stat-num {
  display: block;
  font-size: 1.375rem;
  font-weight: 800;
  color: hsl(var(--ph-accent));
  line-height: 1;
}
.ph-hero-stat-lbl {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
  margin-top: 0.25rem;
}

/* ─────────────── ADVISORY BANNER ─────────────── */
.ph-advisory {
  background: hsl(var(--ph-primary-light));
  border-bottom: 1px solid hsl(var(--ph-border));
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.ph-advisory p {
  font-size: 0.875rem;
  color: hsl(var(--ph-primary-dark));
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.ph-advisory button {
  background: none;
  border: none;
  cursor: pointer;
  color: hsl(var(--ph-muted-fg));
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.25rem;
  border-radius: var(--ph-radius-sm);
  transition: color 0.2s;
}
.ph-advisory button:hover { color: hsl(var(--ph-fg)); }

/* ─────────────── TOOLBAR / FILTER ─────────────── */
.ph-toolbar {
  background: hsl(var(--ph-bg));
  border-bottom: 1px solid hsl(var(--ph-border));
  position: sticky;
  top: 68px;
  z-index: 40;
  box-shadow: var(--ph-shadow-sm);
}
.ph-toolbar-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  flex-wrap: wrap;
  max-width: 1280px;
  margin: auto;
}
.ph-filter-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.4375rem 1rem;
  border: 1.5px solid hsl(var(--ph-border));
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  background: hsl(var(--ph-bg));
  color: hsl(var(--ph-muted-fg));
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}
.ph-filter-pill:hover {
  border-color: hsl(var(--ph-primary));
  color: hsl(var(--ph-primary));
  background: hsl(var(--ph-primary-light));
}
.ph-filter-pill.active {
  background: hsl(var(--ph-primary));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px hsl(var(--ph-primary) / 0.3);
}
.ph-toolbar-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: hsl(var(--ph-muted));
  border: 1.5px solid hsl(var(--ph-border));
  border-radius: 9999px;
  flex: 1;
  max-width: 340px;
  margin-left: auto;
  transition: all 0.2s;
}
.ph-toolbar-search:focus-within {
  border-color: hsl(var(--ph-primary));
  background: hsl(var(--ph-bg));
  box-shadow: 0 0 0 3px hsl(var(--ph-primary) / 0.15);
}
.ph-toolbar-search input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  font-family: inherit;
  color: hsl(var(--ph-fg));
  flex: 1;
  min-width: 0;
}

/* ─────────────── PRODUCT GRID ─────────────── */
.ph-products { padding: 2.5rem 0 4rem; }
.ph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
.ph-card {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  overflow: hidden;
  box-shadow: var(--ph-shadow-sm);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ph-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ph-shadow-lg);
}
.ph-card-img-wrap {
  aspect-ratio: 4 / 3;
  background: hsl(var(--ph-primary-light));
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ph-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.2s ease;
}
.ph-card:hover .ph-card-img { transform: scale(1.04); }
.ph-card-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(6px);
  color: hsl(var(--ph-primary-dark));
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid hsl(var(--ph-primary-light));
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.ph-card-img-wrap { position: relative; }
.ph-card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.ph-card-cat {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: hsl(var(--ph-primary));
}
.ph-card-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  line-height: 1.35;
}
.ph-card-desc {
  font-size: 0.8125rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.ph-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.875rem;
  border-top: 1px solid hsl(var(--ph-border));
}
.ph-card-price {
  font-size: 1.0625rem;
  font-weight: 800;
  color: hsl(var(--ph-primary));
  line-height: 1;
}
.ph-card-price span {
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--ph-muted-fg));
  margin-left: 2px;
}
.ph-order-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: hsl(var(--ph-primary));
  color: #fff;
  border: none;
  border-radius: var(--ph-radius-sm);
  padding: 0.4375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}
.ph-order-btn:hover { background: hsl(var(--ph-primary-dark)); }
.ph-rx-tag {
  font-size: 0.625rem;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid #fde68a;
}

/* shimmer */
@keyframes ph-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.ph-shimmer {
  border-radius: var(--ph-radius);
  background: linear-gradient(90deg, hsl(var(--ph-muted)) 25%, hsl(var(--ph-border)) 50%, hsl(var(--ph-muted)) 75%);
  background-size: 600px 100%;
  animation: ph-shimmer 1.4s infinite linear;
  aspect-ratio: 4/3;
}
.ph-shimmer-card {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  overflow: hidden;
}
.ph-shimmer-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.ph-shimmer-line {
  border-radius: 9999px;
  background: linear-gradient(90deg, hsl(var(--ph-muted)) 25%, hsl(var(--ph-border)) 50%, hsl(var(--ph-muted)) 75%);
  background-size: 600px 100%;
  animation: ph-shimmer 1.4s infinite linear;
}

/* ─────────────── LOCATIONS ─────────────── */
.ph-locations { background: hsl(var(--ph-bg)); }
.ph-loc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.ph-loc-card {
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  overflow: hidden;
  box-shadow: var(--ph-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: hsl(var(--ph-bg));
}
.ph-loc-card:hover { transform: translateY(-4px); box-shadow: var(--ph-shadow-lg); }
.ph-loc-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}
.ph-loc-body { padding: 1.25rem; }
.ph-loc-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  margin-bottom: 0.875rem;
}
.ph-loc-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: hsl(var(--ph-muted-fg));
  margin-bottom: 0.5rem;
  line-height: 1.5;
}
.ph-loc-row strong { color: hsl(var(--ph-fg)); font-weight: 600; }

/* ─────────────── HOW TO ORDER ─────────────── */
.ph-how { background: hsl(var(--ph-muted)); }
.ph-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.ph-step {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: var(--ph-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ph-step:hover { transform: translateY(-4px); box-shadow: var(--ph-shadow-lg); }
.ph-step-num {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: hsl(var(--ph-primary));
  color: #fff;
  font-size: 1.25rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 4px 12px hsl(var(--ph-primary) / 0.35);
}
.ph-step-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  margin-bottom: 0.5rem;
}
.ph-step-desc {
  font-size: 0.8125rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.6;
}
.ph-delivery-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1.75rem;
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  box-shadow: var(--ph-shadow-sm);
}
.ph-delivery-info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
}
.ph-delivery-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--ph-radius-sm);
  background: hsl(var(--ph-primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ph-delivery-info-item strong {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  margin-bottom: 0.25rem;
}
.ph-delivery-info-item p {
  font-size: 0.8125rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.6;
  margin: 0;
}

/* ─────────────── ABOUT ─────────────── */
.ph-about { background: hsl(var(--ph-bg)); }
.ph-about-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}
.ph-about-visual {
  background: hsl(var(--ph-primary-light));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  padding: 3rem 2rem;
  text-align: center;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.ph-about-icon {
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  background: hsl(var(--ph-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px hsl(var(--ph-primary) / 0.3);
}
.ph-about-stat {
  font-size: 1.5rem;
  font-weight: 800;
  color: hsl(var(--ph-primary-dark));
}
.ph-about-stat-lbl {
  font-size: 0.875rem;
  color: hsl(var(--ph-primary));
  font-weight: 600;
}
.ph-about-text { display: flex; flex-direction: column; gap: 1rem; }
.ph-about-text p { font-size: 0.9375rem; color: hsl(var(--ph-muted-fg)); line-height: 1.75; }

/* ─────────────── TEAM ─────────────── */
.ph-team { background: hsl(var(--ph-muted)); }
.ph-team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2.5rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
.ph-team-card {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  overflow: hidden;
  box-shadow: var(--ph-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ph-team-card:hover { transform: translateY(-4px); box-shadow: var(--ph-shadow-lg); }
.ph-team-license-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.ph-team-license-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}
.ph-team-card:hover .ph-team-license-img { transform: scale(1.03); }
.ph-team-license-badge {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background: hsl(var(--ph-primary) / 0.9);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  backdrop-filter: blur(4px);
}
.ph-team-body { padding: 1.25rem; }
.ph-team-name {
  font-size: 1rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  margin-bottom: 0.25rem;
}
.ph-team-role {
  font-size: 0.8125rem;
  color: hsl(var(--ph-primary));
  font-weight: 600;
  margin-bottom: 0.625rem;
}
.ph-team-bio {
  font-size: 0.875rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.6;
}

/* ─────────────── PARTNERS ─────────────── */
.ph-partners { background: hsl(var(--ph-bg)); }
.ph-partners-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-top: 2rem;
}
.ph-partners-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.ph-partners-sub {
  font-size: 0.9375rem;
  color: hsl(var(--ph-muted-fg));
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.ph-partners-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.ph-partner-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1.5px solid hsl(var(--ph-border));
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--ph-fg));
  background: hsl(var(--ph-bg));
  box-shadow: var(--ph-shadow-sm);
  transition: all 0.15s ease;
}
.ph-partner-chip:hover {
  border-color: hsl(var(--ph-primary));
  color: hsl(var(--ph-primary));
  background: hsl(var(--ph-primary-light));
}
.ph-suppliers-label {
  font-size: 1.125rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
}

/* ─────────────── FAQ ─────────────── */
.ph-faq { background: hsl(var(--ph-muted)); }
.ph-faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}
.ph-faq-item {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  overflow: hidden;
  box-shadow: var(--ph-shadow-sm);
}
.ph-faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 600;
  color: hsl(var(--ph-fg));
  gap: 1rem;
  font-family: inherit;
  text-align: left;
  transition: color 0.15s;
}
.ph-faq-q:hover { color: hsl(var(--ph-primary)); }
.ph-faq-q:focus { outline: none; box-shadow: inset 0 0 0 2px hsl(var(--ph-primary) / 0.3); border-radius: var(--ph-radius); }
.ph-faq-a {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.35s ease;
  font-size: 0.9375rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.75;
  padding: 0 1.5rem;
  border-top: 0px solid hsl(var(--ph-border));
}
.ph-faq-a.open {
  max-height: 400px;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid hsl(var(--ph-border));
}

/* ─────────────── REVIEWS ─────────────── */
.ph-reviews { background: hsl(var(--ph-bg)); }
.ph-reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.ph-review-card {
  background: hsl(var(--ph-bg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius);
  padding: 1.5rem;
  box-shadow: var(--ph-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.ph-stars { display: flex; gap: 0.25rem; }
.ph-review-text {
  font-size: 0.875rem;
  color: hsl(var(--ph-muted-fg));
  line-height: 1.75;
  flex: 1;
  font-style: italic;
}
.ph-reviewer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.ph-reviewer-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: hsl(var(--ph-primary));
  color: #fff;
  font-size: 0.875rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ph-reviewer-name { font-size: 0.875rem; font-weight: 700; color: hsl(var(--ph-fg)); }
.ph-reviewer-date { font-size: 0.75rem; color: hsl(var(--ph-muted-fg)); }

/* ─────────────── MODAL ─────────────── */
.ph-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 400; /* above sticky nav (z-index 300) */
  overflow-y: auto;
  padding: 1.5rem 1rem;
  padding-top: calc(70px + 1.5rem); /* clear fixed navbar height */
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
@media (min-width: 640px) {
  .ph-overlay { align-items: flex-start; }
}
.ph-modal {
  margin: auto;
  background: hsl(var(--ph-bg));
  border-radius: var(--ph-radius);
  box-shadow: 0 25px 50px rgb(0 0 0 / 0.25);
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
}
.ph-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid hsl(var(--ph-border));
  position: sticky;
  top: 0;
  background: hsl(var(--ph-bg));
  z-index: 10;
  border-radius: var(--ph-radius) var(--ph-radius) 0 0;
}
.ph-modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: hsl(var(--ph-fg));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ph-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: hsl(var(--ph-muted));
  border: none;
  border-radius: var(--ph-radius-sm);
  cursor: pointer;
  color: hsl(var(--ph-muted-fg));
  transition: all 0.2s;
}
.ph-modal-close:hover { background: hsl(var(--ph-border)); color: hsl(var(--ph-fg)); }
.ph-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; }
.ph-modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid hsl(var(--ph-border));
  background: hsl(var(--ph-bg));
  border-radius: 0 0 var(--ph-radius) var(--ph-radius);
}
.ph-form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.ph-form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: hsl(var(--ph-fg));
}
.ph-form-input {
  width: 100%;
  padding: 0.5625rem 0.875rem;
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius-sm);
  font-size: 0.9375rem;
  font-family: inherit;
  color: hsl(var(--ph-fg));
  background: hsl(var(--ph-bg));
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ph-form-input:focus {
  outline: none;
  border-color: hsl(var(--ph-primary));
  box-shadow: 0 0 0 3px hsl(var(--ph-primary) / 0.15);
}
.ph-form-input:disabled {
  background: hsl(var(--ph-muted));
  color: hsl(var(--ph-muted-fg));
  cursor: not-allowed;
}
.ph-file-upload {
  border: 2px dashed hsl(var(--ph-border));
  border-radius: var(--ph-radius-sm);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.ph-file-upload:hover {
  border-color: hsl(var(--ph-primary));
  background: hsl(var(--ph-primary-light));
}
.ph-file-upload p { font-size: 0.875rem; font-weight: 600; color: hsl(var(--ph-fg)); margin: 0; }
.ph-file-upload small { font-size: 0.75rem; color: hsl(var(--ph-muted-fg)); }
.ph-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: hsl(var(--ph-primary-light));
  border: 1px solid hsl(var(--ph-primary) / 0.2);
  border-radius: var(--ph-radius-sm);
  font-weight: 700;
  color: hsl(var(--ph-primary-dark));
}
.ph-total-row span:last-child { font-size: 1.125rem; font-weight: 800; }
.ph-error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: var(--ph-radius-sm);
  font-size: 0.875rem;
  color: #dc2626;
}
.ph-btn-primary {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: hsl(var(--ph-primary));
  color: #fff;
  border: none;
  border-radius: var(--ph-radius-sm);
  padding: 0.6875rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ph-btn-primary:hover { background: hsl(var(--ph-primary-dark)); }
.ph-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.ph-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--ph-bg));
  color: hsl(var(--ph-muted-fg));
  border: 1px solid hsl(var(--ph-border));
  border-radius: var(--ph-radius-sm);
  padding: 0.6875rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ph-btn-secondary:hover {
  background: hsl(var(--ph-muted));
  color: hsl(var(--ph-fg));
}

/* ─────────────── IMAGE PREVIEW ─────────────── */
.ph-img-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1.5rem;
}
.ph-img-preview-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.ph-img-preview-close:hover { background: rgba(255,255,255,0.3); }

/* ─────────────── RESPONSIVE ─────────────── */
@media (max-width: 768px) {
  .ph-about-inner { grid-template-columns: 1fr; gap: 2rem; }
  .ph-partners-inner { grid-template-columns: 1fr; gap: 2rem; }
  .ph-team-grid { grid-template-columns: 1fr; }
  .ph-hero { height: 420px; }
  .ph-hero-title { font-size: 2rem; }
  .ph-section { padding: 3rem 0; }
}
@media (max-width: 640px) {
  .ph-toolbar-inner { gap: 0.5rem; padding: 0.75rem 1rem; }
  .ph-toolbar-search { max-width: 100%; margin-left: 0; }
  .ph-hero-stats { gap: 1.25rem; }
}
`;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const imgSrc = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : 'http://localhost:5000' + url;
};

const FAQS = [
  { q: 'Do I need a prescription for all medications?', a: 'No. Many over-the-counter medications can be ordered without a prescription. However, some controlled or prescription-only drugs require a valid prescription uploaded during checkout or presented at pickup.' },
  { q: 'What are your delivery areas and fees?', a: 'We currently deliver within Addis Ababa and surrounding areas. Delivery fee is 50 ETB flat within city limits. Free delivery for orders above 500 ETB. Rural deliveries may take 2–3 extra days.' },
  { q: 'How long does it take to process my order?', a: 'Standard orders are processed within 2–4 hours during business hours. Home delivery takes 3–6 hours. Pickup orders are usually ready within 1 hour.' },
  { q: 'Can I return or exchange a medication?', a: 'For safety reasons, medications cannot be returned once dispensed. If you received a wrong item, contact us within 24 hours and we will resolve the issue immediately.' },
  { q: 'What happens if my prescribed drug is out of stock?', a: 'Our pharmacist will contact you to suggest a suitable alternative or notify you when the item is back in stock. You will not be charged until the order is fulfilled.' },
  { q: 'Do you accept health insurance?', a: 'Yes. We work with several insurance providers including CBHI, Nyala Insurance, and Awash Insurance. Bring your insurance card to our branch or upload a photo during checkout.' },
];

const TEAM = [
  { name: 'Dr. Fikerte Haile', role: 'Chief Pharmacist', bio: 'B.Pharm, MSc. 12 years of clinical experience in pharmaceutical care and patient safety.', license: licFikerte, licNo: 'ETH-EFDA-2024-0012' },
  { name: 'Abebe Girma', role: 'Senior Pharmacist', bio: 'B.Pharm. Specialist in chronic disease medication management and patient counselling.', license: licAbebe, licNo: 'ETH-EFDA-2024-0047' },
  { name: 'Meron Tesfaye', role: 'Pharmacist', bio: 'B.Pharm. Focused on paediatric medications and women\'s health pharmaceutical care.', license: licMeron, licNo: 'ETH-EFDA-2024-0091' },
  { name: 'Dawit Bekele', role: 'Pharmacy Technician', bio: 'Experienced in dispensing, inventory management, and compounding medications.', license: licDawit, licNo: 'ETH-EFDA-2024-0138' },
];

const REVIEWS = [
  { text: 'Fast delivery and the staff was very professional. My prescription was handled with care and they even called to confirm the dosage.', name: 'Selamawit T.', date: 'June 2025', rating: 5, initial: 'S' },
  { text: 'I love that I can order refills online. No more waiting in long queues. The app notifies me when my order is ready!', name: 'Bereket M.', date: 'May 2025', rating: 5, initial: 'B' },
  { text: 'Very affordable prices compared to other pharmacies. The MOH licensed badge gives me full confidence in the quality.', name: 'Hana G.', date: 'July 2025', rating: 4, initial: 'H' },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
const PharmacyHealthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advisoryOpen, setAdvisoryOpen] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  /* Modal */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentRef] = useState('');
  const [paymentScreenshot, setPaymentScreen] = useState(null);
  const [financeAccounts, setFinanceAccounts] = useState([]);

  const loadFinanceAccounts = async () => {
    try {
      const result = await axios.get('/finance-bank');
      if (result && result.success && Array.isArray(result.data)) setFinanceAccounts(result.data);
      else if (Array.isArray(result)) setFinanceAccounts(result);
      else if (result && Array.isArray(result.data)) setFinanceAccounts(result.data);
    } catch (e) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const r2 = await axios.get('/finance-bank', { headers: { Authorization: `Bearer ${token}` } });
          if (r2 && Array.isArray(r2.data)) setFinanceAccounts(r2.data);
          else if (Array.isArray(r2)) setFinanceAccounts(r2);
        } catch (e2) { console.error('[PharmacyPage] Finance accounts load failed:', e2.message); }
      }
    }
  };

  /* Data fetch */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes, branchRes] = await Promise.all([
          pharmacyService.getCategories(),
          pharmacyService.getProducts(),
          pharmacyService.getBranches(),
        ]);
        if (catRes.status === 'success') setCategories(catRes.data.filter(c => c.is_active));
        if (prodRes.status === 'success') setAllProducts(prodRes.data.filter(p => p.is_active));
        if (branchRes.status === 'success') setBranches(branchRes.data.filter(b => b.is_active));
      } catch (e) {
        console.error('Failed to fetch pharmacy data', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    loadFinanceAccounts();
  }, []);

  /* Auto-open refill from location state */
  useEffect(() => {
    if (location.state?.refillMedicine && authService.isAuthenticated()) {
      setSelectedMedicine(location.state.refillMedicine);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /* Filter */
  const filtered = allProducts.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || String(p.category_id) === String(catFilter);
    return matchSearch && matchCat;
  });

  /* Actions */
  const handleRequestRefill = (med) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/pharmacy', refillMedicine: med } });
    } else {
      setSelectedMedicine(med);
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
    setPaymentMethod('');
    setPaymentRef('');
    setPaymentScreen(null);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    // Payment validation
    if (paymentMethod) {
      const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
      if (acc && acc.account_type !== 'Cash') {
        if (!paymentReference && !paymentScreenshot) {
          setSubmitError('For Bank or Telebirr payments, please provide either a Transaction ID or a Payment Screenshot.');
          setIsSubmitting(false);
          return;
        }
        if (paymentReference && paymentScreenshot) {
          setSubmitError('Please provide either a Transaction ID OR a Payment Screenshot, but not both.');
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
      const fd = new FormData();
      fd.append('medication_id', selectedMedicine.id);
      fd.append('quantity', refillQuantity);
      fd.append('delivery_option', deliveryOption);
      if (deliveryOption === 'delivery') fd.append('delivery_address', deliveryAddress);
      if (prescriptionFile) fd.append('prescription_image', prescriptionFile);

      // Payment
      const selectedAcc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
      fd.append('paymentMethod', selectedAcc ? selectedAcc.account_name : paymentMethod);
      fd.append('paymentReference', paymentReference);
      if (paymentScreenshot) fd.append('paymentScreenshot', paymentScreenshot);

      await axios.post('/pharmacy/requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitSuccess(true);
      setTimeout(() => closeModal(), 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUser = authService.getCurrentUser();

  /* ── Render ── */
  return (
    <div className="ph-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="ph-hero">
        <div className="ph-hero-badge">
          <Shield size={12} />
          MOH Licensed · EFDA Approved
        </div>
        <h1 className="ph-hero-title">
          Your Health,<br /><span>Our Priority</span>
        </h1>
        <p className="ph-hero-sub">
          Browse our full catalog of quality medications. Order online and pick up at your nearest branch or get home delivery.
        </p>

        <div className="ph-hero-stats">
          <div className="ph-hero-stat">
            <span className="ph-hero-stat-num">{allProducts.length || '500+'}</span>
            <div className="ph-hero-stat-lbl">Medications</div>
          </div>
          <div className="ph-hero-stat">
            <span className="ph-hero-stat-num">{branches.length || '4'}</span>
            <div className="ph-hero-stat-lbl">Branches</div>
          </div>
          <div className="ph-hero-stat">
            <span className="ph-hero-stat-num">4.9 ★</span>
            <div className="ph-hero-stat-lbl">Avg Rating</div>
          </div>
          <div className="ph-hero-stat">
            <span className="ph-hero-stat-num">24/7</span>
            <div className="ph-hero-stat-lbl">On-Call</div>
          </div>
        </div>
      </section>

      {/* ══ ADVISORY BANNER ═══════════════════════════════════ */}
      {advisoryOpen && (
        <div className="ph-advisory">
          <p>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <strong>Medical Advisory:</strong>&nbsp;This catalog is for informational purposes. Always consult a licensed pharmacist or physician before using any medication. Prescription-only drugs require a valid prescription.
          </p>
          <button onClick={() => setAdvisoryOpen(false)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ══ FILTER TOOLBAR ════════════════════════════════════ */}
      <div className="ph-toolbar">
        <div className="ph-toolbar-inner">
          <button
            className={`ph-filter-pill ${catFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCatFilter('all')}
          >
            All
          </button>
          {categories.slice(0, 8).map(c => (
            <button
              key={c.id}
              className={`ph-filter-pill ${String(catFilter) === String(c.id) ? 'active' : ''}`}
              onClick={() => setCatFilter(c.id)}
            >
              {c.name}
            </button>
          ))}
          <div className="ph-toolbar-search">
            <Search size={14} color="hsl(215 16% 47%)" />
            <input
              type="text"
              placeholder="Filter results…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ══ PRODUCT GRID ══════════════════════════════════════ */}
      <section className="ph-products">
        <div className="ph-container">
          {loading ? (
            <div className="ph-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="ph-shimmer-card">
                  <div className="ph-shimmer" />
                  <div className="ph-shimmer-body">
                    <div className="ph-shimmer-line" style={{ height: '0.625rem', width: '40%' }} />
                    <div className="ph-shimmer-line" style={{ height: '0.875rem', width: '75%' }} />
                    <div className="ph-shimmer-line" style={{ height: '0.75rem', width: '90%' }} />
                    <div className="ph-shimmer-line" style={{ height: '0.75rem', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1.5rem', background: 'hsl(var(--ph-bg))', borderRadius: 'var(--ph-radius)', border: '1px solid hsl(var(--ph-border))' }}>
              <Package size={48} color="hsl(var(--ph-muted-fg))" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No medications found</h3>
              <p style={{ color: 'hsl(var(--ph-muted-fg))', fontSize: '0.9375rem' }}>Try a different search term or select another category.</p>
            </div>
          ) : (
            <div className="ph-grid">
              {filtered.map(p => (
                <div key={p.id} className="ph-card">
                  <div className="ph-card-img-wrap">
                    {imgSrc(p.drug_image) ? (
                      <img
                        src={imgSrc(p.drug_image)}
                        className="ph-card-img"
                        alt={p.name}
                        onClick={() => setPreviewImage(imgSrc(p.drug_image))}
                      />
                    ) : (
                      <Pill size={40} color="hsl(var(--ph-primary))" style={{ opacity: 0.4 }} />
                    )}
                    {p.is_prescription_required && (
                      <div className="ph-card-badge">
                        <Shield size={9} />
                        Rx Only
                      </div>
                    )}
                  </div>
                  <div className="ph-card-body">
                    {p.category_name && <div className="ph-card-cat">{p.category_name}</div>}
                    <h3 className="ph-card-name">{p.name}</h3>
                    {p.description && <p className="ph-card-desc">{p.description}</p>}
                    <div className="ph-card-footer">
                      <div>
                        <div className="ph-card-price">
                          {parseFloat(p.selling_price || p.price || 0).toLocaleString()}
                          <span>ETB</span>
                        </div>
                      </div>
                      <button
                        className="ph-order-btn"
                        onClick={(e) => { e.stopPropagation(); handleRequestRefill(p); }}
                      >
                        <ShoppingCart size={13} />
                        Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ BRANCH LOCATIONS ══════════════════════════════════ */}
      {branches.length > 0 && (
        <section className="ph-section ph-locations">
          <div className="ph-container">
            <div className="ph-label">Find Us</div>
            <h2 className="ph-section-title">Our Pharmacy Locations</h2>
            <p className="ph-section-sub">Visit your nearest branch or call ahead for faster service.</p>
            <div className="ph-loc-grid">
              {branches.map(branch => (
                <div className="ph-loc-card" key={branch.id}>
                  {branch.cover_image && (
                    <img src={imgSrc(branch.cover_image)} alt={branch.name} className="ph-loc-img" />
                  )}
                  <div className="ph-loc-body">
                    <div className="ph-loc-name">
                      <MapPin size={16} color="hsl(var(--ph-primary))" />
                      {branch.name}
                    </div>
                    {branch.address && (
                      <div className="ph-loc-row">
                        <MapPin size={13} color="hsl(var(--ph-muted-fg))" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{branch.address}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="ph-loc-row">
                        <Phone size={13} color="hsl(var(--ph-muted-fg))" style={{ flexShrink: 0 }} />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.working_hours && (
                      <div className="ph-loc-row">
                        <Clock size={13} color="hsl(var(--ph-muted-fg))" style={{ flexShrink: 0 }} />
                        <span>{branch.working_hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ HOW TO ORDER ══════════════════════════════════════ */}
      <section className="ph-section ph-how">
        <div className="ph-container">
          <div className="ph-label">Simple Process</div>
          <h2 className="ph-section-title">How to Order &amp; Delivery Policy</h2>
          <div className="ph-steps">
            {[
              { n: '1', title: 'Browse & Search', desc: 'Find your medication by name or category from our live catalog.' },
              { n: '2', title: 'Place Your Order', desc: 'Choose quantity, pickup or delivery, and upload your prescription if required.' },
              { n: '3', title: 'Pharmacist Verifies', desc: 'Our licensed pharmacist verifies your order and prepares it safely.' },
              { n: '4', title: 'Pickup or Delivery', desc: 'Collect from your nearest branch or receive it at your doorstep.' },
            ].map(s => (
              <div className="ph-step" key={s.n}>
                <div className="ph-step-num">{s.n}</div>
                <h3 className="ph-step-title">{s.title}</h3>
                <p className="ph-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="ph-delivery-info">
            <div className="ph-delivery-info-item">
              <div className="ph-delivery-icon"><Truck size={20} color="hsl(var(--ph-primary))" /></div>
              <div>
                <strong>Delivery Areas</strong>
                <p>Addis Ababa &amp; surrounding regions. 3–6 hrs standard delivery. Rural: 2–3 extra days.</p>
              </div>
            </div>
            <div className="ph-delivery-info-item">
              <div className="ph-delivery-icon"><CreditCard size={20} color="hsl(var(--ph-primary))" /></div>
              <div>
                <strong>Delivery Fee</strong>
                <p>Flat 50 ETB within city limits. Free delivery on orders above 500 ETB.</p>
              </div>
            </div>
            <div className="ph-delivery-info-item">
              <div className="ph-delivery-icon"><Clock size={20} color="hsl(var(--ph-primary))" /></div>
              <div>
                <strong>Operating Hours</strong>
                <p>Mon–Sat: 7:00 AM – 9:00 PM. Sunday: 9:00 AM – 5:00 PM. 24/7 On-Call available.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══════════════════════════════════════════════ */}
      <section className="ph-section ph-about">
        <div className="ph-container">
          <div className="ph-about-inner">
            <div className="ph-about-visual">
              <div className="ph-about-icon">
                <Heart size={48} color="#fff" />
              </div>
              <div className="ph-about-stat">Trusted Since 2010</div>
              <div className="ph-about-stat-lbl">MOH Licensed Pharmacy</div>
            </div>
            <div className="ph-about-text">
              <div>
                <div className="ph-label">Who We Are</div>
                <h2 className="ph-section-title" style={{ marginTop: '0.5rem' }}>Ethiopia's Trusted Pharmaceutical Partner</h2>
              </div>
              <p>Sutana Pharmacy &amp; Health has been serving communities across Ethiopia since 2010. Our mission is to make quality, affordable healthcare accessible to everyone — from essential everyday medications to specialized pharmaceutical care.</p>
              <p>We operate under the direct supervision of licensed pharmacists and comply fully with the Ethiopian Food and Drug Authority (EFDA) standards and Ministry of Health (MOH) regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TEAM ══════════════════════════════════════════════ */}
      <section className="ph-section ph-team">
        <div className="ph-container">
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <div className="ph-label">Licensed Professionals</div>
          </div>
          <h2 className="ph-section-title" style={{ textAlign: 'center' }}>Meet Our Pharmacists</h2>
          <p className="ph-section-sub" style={{ margin: '0 auto 0', textAlign: 'center' }}>All practitioners hold valid EFDA / MOH licenses.</p>
          <div className="ph-team-grid">
            {TEAM.map(m => (
              <div className="ph-team-card" key={m.name}>
                <div className="ph-team-license-wrap">
                  <img src={m.license} alt={`${m.name} license`} className="ph-team-license-img" />
                  <div className="ph-team-license-badge">
                    <Shield size={9} />
                    {m.licNo}
                  </div>
                </div>
                <div className="ph-team-body">
                  <div className="ph-team-name">{m.name}</div>
                  <div className="ph-team-role">{m.role}</div>
                  <div className="ph-team-bio">{m.bio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ═══════════════════════════════════════════ */}
      <section className="ph-section ph-reviews">
        <div className="ph-container">
          <div className="ph-label">What Customers Say</div>
          <h2 className="ph-section-title">Patient Reviews</h2>
          <div className="ph-reviews-grid">
            {REVIEWS.map((r, i) => (
              <div className="ph-review-card" key={i}>
                <div className="ph-stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} color={s < r.rating ? '#f59e0b' : '#e2e8f0'} fill={s < r.rating ? '#f59e0b' : '#e2e8f0'} />
                  ))}
                </div>
                <p className="ph-review-text">"{r.text}"</p>
                <div className="ph-reviewer">
                  <div className="ph-reviewer-avatar">{r.initial}</div>
                  <div>
                    <div className="ph-reviewer-name">{r.name}</div>
                    <div className="ph-reviewer-date">{r.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARTNERS ══════════════════════════════════════════ */}
      <section className="ph-section ph-partners">
        <div className="ph-container">
          <div className="ph-label">Our Partners</div>
          <h2 className="ph-section-title">Quality &amp; Affordability</h2>
          
          <div className="ph-partners-inner">
            <div className="ph-partners-section">
              <h3 className="ph-suppliers-label">Insurance Providers</h3>
              <p className="ph-partners-sub">We work with leading insurance providers to guarantee affordability.</p>
              <div className="ph-partners-grid">
                {['CBHI Insurance', 'Nyala Insurance', 'Awash Insurance', 'Lucy Insurance', 'Abbay Insurance'].map(p => (
                  <div className="ph-partner-chip" key={p}><Shield size={15} color="hsl(var(--ph-primary))" />{p}</div>
                ))}
              </div>
            </div>

            <div className="ph-partners-section">
              <h3 className="ph-suppliers-label">EFDA-Approved Brands</h3>
              <p className="ph-partners-sub">We only source from trusted pharmaceutical suppliers.</p>
              <div className="ph-partners-grid">
                {['Almiral Pharma', 'Ethiopian Pharmaceuticals', 'Cadila Healthcare', 'Africa Pharma', 'BioTech Supply'].map(b => (
                  <div className="ph-partner-chip" key={b}><Award size={15} color="hsl(var(--ph-primary))" />{b}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════ */}
      <section className="ph-section ph-faq">
        <div className="ph-container" style={{ maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="ph-label">FAQ</div>
            <h2 className="ph-section-title">Frequently Asked Questions</h2>
          </div>
          <div className="ph-faq-list">
            {FAQS.map((f, i) => (
              <div className="ph-faq-item" key={i}>
                <button
                  className="ph-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={18} color="hsl(var(--ph-primary))" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={18} color="hsl(var(--ph-muted-fg))" style={{ flexShrink: 0 }} />}
                </button>
                <div className={`ph-faq-a ${openFaq === i ? 'open' : ''}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ORDER MODAL ═══════════════════════════════════════ */}
      {isModalOpen && selectedMedicine && (
        <div className="ph-overlay" onClick={closeModal}>
          <div className="ph-modal" onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title">
                <Pill size={18} color="hsl(var(--ph-primary))" />
                Place Order
              </div>
              <button className="ph-modal-close" onClick={closeModal} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'hsl(var(--ph-primary))', marginBottom: '0.5rem' }}>Order Submitted!</h3>
                <p style={{ color: 'hsl(var(--ph-muted-fg))', fontSize: '0.9375rem' }}>
                  Please pay and pick up your order. Track it in <strong>My Account → Orders</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRefillSubmit}>
                <div className="ph-modal-body">
                  {/* Pre-filled user */}
                  {currentUser && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'hsl(var(--ph-muted))', borderRadius: 'var(--ph-radius-sm)', border: '1px solid hsl(var(--ph-border))' }}>
                      <div className="ph-form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="ph-form-label">Customer Name</label>
                        <input className="ph-form-input" type="text" disabled
                          value={currentUser.fullName || currentUser.full_name || currentUser.name ||
                            `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Guest'} />
                      </div>
                      <div className="ph-form-group">
                        <label className="ph-form-label">Email</label>
                        <input className="ph-form-input" type="email" disabled value={currentUser.email || ''} />
                      </div>
                      <div className="ph-form-group">
                        <label className="ph-form-label">Phone</label>
                        <input className="ph-form-input" type="text" disabled value={currentUser.phone || ''} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ph-form-group">
                      <label className="ph-form-label">Medication</label>
                      <input className="ph-form-input" type="text" disabled value={selectedMedicine.name} />
                    </div>
                    <div className="ph-form-group">
                      <label className="ph-form-label">Quantity</label>
                      <input className="ph-form-input" type="number" min="1" required
                        value={refillQuantity} onChange={e => setRefillQuantity(e.target.value)} />
                    </div>
                  </div>

                  <div className="ph-form-group">
                    <label className="ph-form-label">Delivery Option</label>
                    <select className="ph-form-input" value={deliveryOption} onChange={e => setDeliveryOption(e.target.value)}>
                      <option value="pickup">Branch Pickup</option>
                      <option value="delivery">Home Delivery</option>
                    </select>
                  </div>

                  {deliveryOption === 'delivery' && (
                    <div className="ph-form-group">
                      <label className="ph-form-label">Delivery Address</label>
                      <input className="ph-form-input" type="text" required placeholder="Enter your full address"
                        value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                    </div>
                  )}

                  <div className="ph-form-group">
                    <label className="ph-form-label">Upload Prescription <span style={{ color: 'hsl(var(--ph-muted-fg))', fontWeight: 400 }}>(Optional)</span></label>
                    <label style={{ cursor: 'pointer' }}>
                      <div className="ph-file-upload">
                        <UploadCloud size={24} color="hsl(var(--ph-primary))" />
                        <p>{prescriptionFile ? prescriptionFile.name : 'Click to choose a file'}</p>
                        <small>JPEG, PNG, or PDF accepted</small>
                      </div>
                      <input type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }}
                        onChange={e => setPrescriptionFile(e.target.files[0] || null)} />
                    </label>
                  </div>

                  {/* ── Payment Details ── */}
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', borderBottom: '1px solid hsl(var(--ph-border))', paddingBottom: '0.5rem', marginTop: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wallet size={14} /> Payment Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ph-form-group">
                      <label className="ph-form-label">Payment Method *</label>
                      {financeAccounts.length === 0 ? (
                        <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 'var(--ph-radius)', fontSize: '0.875rem', color: '#92400e' }}>
                          Loading payment accounts...
                        </div>
                      ) : (
                        <select required className="ph-form-input"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                        >
                          <option value="">- Select Payment Method -</option>
                          {['Bank', 'Mobile Wallet', 'Cash'].map(type => {
                            const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                            if (!group.length) return null;
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
                    <div className="ph-form-group">
                      <label className="ph-form-label">Transaction Reference / ID</label>
                      <input className="ph-form-input" type="text" placeholder="e.g. TXN-12345"
                        value={paymentReference} onChange={e => setPaymentRef(e.target.value)} />
                    </div>
                  </div>

                  {/* Account details panel */}
                  {paymentMethod && (() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                    if (!acc) return null;
                    const isCash = acc.account_type === 'Cash';
                    return (
                      <div style={{ background: 'hsl(var(--ph-primary) / 0.07)', padding: '0.75rem', borderRadius: 'var(--ph-radius)', border: '1px solid hsl(var(--ph-primary) / 0.2)', fontSize: '0.8125rem', marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Wallet size={16} color="hsl(var(--ph-primary))" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'hsl(var(--ph-primary))', marginBottom: '0.35rem' }}>{isCash ? 'Pay in Cash at Branch:' : 'Transfer Payment To:'}</div>
                          <div><strong>Account Name:</strong> {acc.account_name}</div>
                          {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                          {acc.bank_provider && <div><strong>Provider:</strong> {acc.bank_provider}</div>}
                          {!isCash && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--ph-muted-fg))', marginTop: '0.35rem' }}>After payment, enter the Transaction ID above or upload a screenshot below.</div>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screenshot upload — only for Bank / Mobile Wallet */}
                  {paymentMethod && (() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                    if (acc && acc.account_type === 'Cash') return null;
                    return (
                      <div className="ph-form-group" style={{ marginTop: '0.75rem' }}>
                        <label className="ph-form-label"><UploadCloud size={13} /> Payment Screenshot <span style={{ fontWeight: 400 }}>(Optional if Transaction Reference is provided)</span></label>
                        <label style={{ cursor: 'pointer' }}>
                          <div className="ph-file-upload">
                            <UploadCloud size={22} color={paymentScreenshot ? 'hsl(var(--ph-primary))' : 'hsl(var(--ph-muted-fg))'} />
                            <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '0.875rem', color: paymentScreenshot ? 'hsl(var(--ph-primary))' : 'hsl(var(--ph-fg))' }}>
                              {paymentScreenshot ? paymentScreenshot.name : 'Click to upload screenshot'}
                            </p>
                            <small>PNG, JPG accepted</small>
                            {paymentScreenshot && (
                              <button type="button" onClick={e => { e.preventDefault(); setPaymentScreen(null); }}
                                style={{ marginTop: 6, padding: '2px 8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                                Remove
                              </button>
                            )}
                          </div>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPaymentScreen(e.target.files[0] || null)} />
                        </label>
                      </div>
                    );
                  })()}

                  <div className="ph-total-row">
                    <span>Total Amount</span>
                    <span>{(parseFloat(selectedMedicine.selling_price || selectedMedicine.price || 0) * refillQuantity).toFixed(2)} ETB</span>
                  </div>

                  {submitError && (
                    <div className="ph-error-msg">
                      <AlertCircle size={16} />
                      {submitError}
                    </div>
                  )}
                </div>

                <div className="ph-modal-footer">
                  <button type="button" className="ph-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="ph-btn-primary" disabled={isSubmitting}>
                    <ShoppingCart size={16} />
                    {isSubmitting ? 'Submitting…' : 'Place Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══ IMAGE PREVIEW ═════════════════════════════════════ */}
      {previewImage && (
        <div className="ph-img-preview-overlay" onClick={() => setPreviewImage(null)}>
          <button className="ph-img-preview-close" onClick={() => setPreviewImage(null)} aria-label="Close preview">
            <X size={18} />
          </button>
          <img
            src={previewImage}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--ph-radius)', objectFit: 'contain', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            alt="Preview"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default PharmacyHealthPage;
