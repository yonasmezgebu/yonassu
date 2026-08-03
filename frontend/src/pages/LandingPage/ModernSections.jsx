import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Wallet, ShoppingCart, Truck,
  Printer, BarChart3, Key, Settings, Upload, Rocket,
  Shield, Globe, Zap, Smartphone, Star, ArrowRight,
  Quote, ChevronRight, Home, Building2, Briefcase,
  FileText, Phone, LogIn, Scale, Triangle, Car, Pill, Sprout,
  MapPin, Mail
} from 'lucide-react';
import useInView from './useInView';
import apiClient from '../../services/apiClient';

import happy1 from '../../assets/event/happy1.jpg';
import './LandingRedesign.css';
import './ResponsiveFixes.css';

/* ── Helpers ── */
const InViewWrap = ({ children, className = '', style: extra = {} }) => {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={`${className}${inView ? ' is-visible' : ''}`} style={extra}>
      {children}
    </div>
  );
};

/* ── 2. Platform Capabilities (Infinite Scroll) ── */
const capabilities = [
  { icon: Package,     title: 'Store',        tag: 'Store',        color: '#4F46E5', para: 'Real-time stock tracking with full movement history, automated reorder alerts, and multi-location warehouse support.' },
  { icon: Wallet,      title: 'Finance',      tag: 'Finance',      color: '#0EA5E9', para: 'From daily expense recording to full ledger management with instant profit and loss reports and audit-ready records.' },
  { icon: Printer,     title: 'Production',   tag: 'Production',   color: '#8B5CF6', para: 'Manage the complete production lifecycle from client order intake through quality control and tax-compliant receipt generation.' },
  { icon: BarChart3,   title: 'Analytics',    tag: 'Analytics',    color: '#F59E0B', para: 'Purpose-built CEO dashboards delivering real-time KPIs, trend analysis, and cross-department performance insights.' },
  { icon: ShoppingCart,title: 'Sales',        tag: 'Sales',        color: '#10B981', para: 'Fast, intuitive POS system with customer accounts, layered discounts, daily sales targets, and auto-synced inventory.' },
  { icon: Truck,       title: 'Purchase',     tag: 'Purchase',     color: '#EF4444', para: 'Streamline procurement from purchase orders and supplier deliveries to goods receipt and vendor performance monitoring.' },
  { icon: Car,         title: 'Car Rental',   tag: 'Car Rental',   color: '#3B82F6', para: 'Vehicle fleet management with real-time booking, driver assignment, maintenance scheduling, and trip tracking for rental businesses.' },
  { icon: Pill,        title: 'Pharmacy',     tag: 'Pharmacy',     color: '#EC4899', para: 'Complete pharmacy management with medicine inventory, expiry date tracking, sales records, and supplier purchase orders.' },
  { icon: Sprout,      title: 'Farming',      tag: 'Farming',      color: '#059669', para: 'End-to-end farming management covering crop planning, harvest tracking, fertilizer application, tool inventory, and yield monitoring.' },
  { icon: Briefcase,   title: 'Consultancy',  tag: 'Consultancy',  color: '#D97706', para: 'Professional business advisory platform with client management, project tracking, strategy development, and growth planning tools.' },
];

function CapabilityCard({ c }) {
  const Icon = c.icon;
  return (
    <div 
      className="cap-card" 
      style={{ 
        cursor: 'default', flexShrink: 0, marginRight: 28, width: '280px',
        background: '#FFFFFF', border: '1px solid #8D6E63', 
        borderRadius: 12, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'flex-start', 
        padding: '28px 20px', textAlign: 'center', 
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div 
        style={{ 
          width: 42, height: 42, borderRadius: 12, 
          background: 'rgba(34, 139, 34, 0.1)', 
          color: '#228B22', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          marginBottom: 12, flexShrink: 0 
        }}
      >
        <Icon size={20} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1B5E20', marginBottom: 8, flexShrink: 0 }}>{c.title}</span>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: '#424242', margin: 0, fontWeight: 500, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
        {c.para}
      </p>
    </div>
  );
}

export function CapabilitiesSection() {
  const topRow = capabilities.slice(0, 5);
  const bottomRow = capabilities.slice(5);
  return (
    <section style={{ background: '#FFFFFF', padding: '80px 0', width: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#1B5E20', marginBottom: 12, letterSpacing: '-0.02em' }}>Platform Capabilities</h2>
          <p style={{ fontSize: '1.1rem', color: '#424242' }}>Ten powerful modules purpose-built for Ethiopian enterprises — integrated under one roof.</p>
        </div>
        {/* Top row — moving RIGHT */}
        <div className="scroll-track-wrap" style={{ marginBottom: 28 }}>
          <div className="scroll-track scroll-right">
            {[...topRow, ...topRow].map((c, i) => <CapabilityCard key={i} c={c} />)}
          </div>
        </div>
        {/* Bottom row — moving LEFT */}
        <div className="scroll-track-wrap">
          <div className="scroll-track scroll-left">
            {[...bottomRow, ...bottomRow].map((c, i) => <CapabilityCard key={i} c={c} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 3. Getting Started ── */
const steps = [
  { icon: Key,     title: 'Request Access',      desc: 'Contact us or sign in. Your admin sets up your account and assigns role‑based permissions.' },
  { icon: Settings,title: 'Configure Modules',    desc: 'Enable only what you need today — Sales, Inventory, Finance — and activate more as you grow.' },
  { icon: Upload,  title: 'Import Your Data',     desc: 'Migrate existing records with guided tools. Our team supports you every step of the way.' },
  { icon: Rocket,  title: 'Go Live & Grow',       desc: 'Start working from day one. Dashboards, alerts, and reports give you full visibility.' },
];

export function GettingStartedSection() {
  return (
    <section style={{ background: '#F5F5F5', padding: '80px 0', width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .gs-card {
            border-top: none !important;
            border-right: none !important;
            border-bottom: none !important;
            border-radius: 0 !important;
            border-left: 2px solid #8D6E63 !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#1B5E20', marginBottom: 12, letterSpacing: '-0.02em' }}>Getting Started</h2>
          <p style={{ fontSize: '1.1rem', color: '#424242' }}>Up and running in 4 simple steps. Most businesses are fully operational within their first week.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 28 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div 
                key={i} 
                className="gs-card"
                style={{ 
                  background: '#FFFFFF', padding: '36px 28px', textAlign: 'center', cursor: 'default',
                  border: '1px solid #8D6E63', borderRadius: 12,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', background: '#98FF98', color: '#424242', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: '1.1rem' 
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ marginBottom: 14, color: '#228B22' }}>
                  <Icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#424242', margin: 0 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 4. Why SUTANA ── */
const benefits = [
  { icon: Shield,     title: 'Secure & Role‑Based Access',     desc: 'Granular, military‑grade access ensures every user sees only what is relevant. Full audit trails give complete accountability.' },
  { icon: Globe,      title: 'Locally Tailored for Ethiopia',  desc: 'ETB currency, Ethiopian tax compliance, and an interface built around the day‑to‑day realities of your business.' },
  { icon: Zap,        title: 'Fast & Always Reliable',         desc: 'Sub‑100ms API responses backed by MySQL & Node.js, with 99.9% uptime SLA — even at peak hour.' },
  { icon: Smartphone, title: 'Works on Every Device',          desc: 'Fully responsive across desktop, tablet, and mobile — wherever your team is working, the experience is seamless.' },
];

export function WhySutanaSection() {
  return (
    <section style={{ background: '#FFFFFF', padding: '80px 0', width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .ws-card {
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            padding: 24px 0 !important;
          }
          .ws-card:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

        {/* Section Header — plain bg + colored text only, no banner box */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#1B5E20', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Why SUTANA
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#424242', maxWidth: 600, margin: '0 auto' }}>
            Trusted by growing Ethiopian enterprises — simplifying operations, empowering growth.
          </p>
        </div>

        {/* Two-column layout: Benefits left, Image right */}
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Left — Benefits list */}
          <div style={{ flex: '1 1 440px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="ws-card"
                  style={{
                    display: 'flex', gap: 18, padding: '22px 20px',
                    background: '#FFFFFF', border: '1px solid #8D6E63', borderRadius: 12,
                    cursor: 'default', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Icon box — Sage Green background, Forest Green icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: '#A5D6A7', color: '#228B22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1B5E20', marginBottom: 4 }}>{b.title}</h4>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#424242', margin: 0 }}>{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — Image with hover zoom, 10px radius, Earth Brown border */}
          <div style={{ flex: '1 1 380px' }}>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #8D6E63', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <img
                src={happy1}
                alt="SUTANA Enterprise Team"
                style={{
                  width: '100%', height: 'auto', display: 'block',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


/* ── 5. Success Stories ── */
const testimonials = [
  { quote: "Before SUTANA, we were running three different spreadsheets for inventory, finance, and sales. Now everything is connected. Our month‑end close time dropped from 5 days to just a few hours.", name: 'Tigist Alemu', role: 'Finance Director, Addis Trading PLC', initials: 'TA', color: '#4F46E5' },
  { quote: "The CEO dashboard is exactly what I needed. I can see revenue, inventory status, and production output at a glance — anytime, from anywhere. This is what modern business management looks like.", name: 'Habtamu Bekele', role: 'CEO, Bekele Printing & Publishing', initials: 'HB', color: '#0EA5E9' },
  { quote: "Our purchase department used to chase down paper orders. Now every order is tracked, every supplier is rated, and we get automatic alerts when deliveries are delayed.", name: 'Meseret Girma', role: 'Operations Manager, Girma Enterprises', initials: 'MG', color: '#10B981' },
];

export function TestimonialsSection() {
  return (
    <section style={{ background: '#F5F5F5', padding: '80px 0', width: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

        {/* Section Header — plain bg + colored text only, no banner box */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#1B5E20', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Success Stories
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#424242', maxWidth: 580, margin: '0 auto' }}>
            Businesses that transformed with SUTANA — real results from real Ethiopian enterprises.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 28 }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: '1px solid #8D6E63',
                borderRadius: 12,
                padding: '32px 28px',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 5 Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={15} fill="#228B22" color="#228B22" strokeWidth={1.5} />
                ))}
              </div>

              {/* Quote icon — Forest Green, subtle */}
              <Quote size={28} color="#A5D6A7" style={{ marginBottom: 10 }} />

              {/* Quote text */}
              <p style={{
                fontSize: '0.92rem', lineHeight: 1.75, color: '#424242',
                flex: 1, marginBottom: 24, fontStyle: 'italic'
              }}>
                "{t.quote}"
              </p>

              {/* Divider + Author */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                borderTop: '1px solid #8D6E63', paddingTop: 18
              }}>
                {/* Avatar — 50% radius as per rules */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#1B5E20', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                  border: '2px solid #A5D6A7'
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B5E20' }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B8E23', fontWeight: 500 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


export function SmartFooter() {
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await apiClient.get('/public/social-links');
        setSocialLinks(response?.data || []);
      } catch (_) {
        // Server unavailable — footer renders without social icons
      }
    };
    fetchSocials();
  }, []);

  const FacebookIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
  );
  const TelegramIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  );
  const TikTokIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
  );
  const YoutubeIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
  );
  const LinkedinIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
  );

  const getSocialIcon = (platform, color) => {
    const props = { size: 18, color };
    switch(platform.toLowerCase()) {
      case 'facebook': return <FacebookIcon {...props} />;
      case 'telegram': return <TelegramIcon {...props} />;
      case 'tiktok': return <TikTokIcon {...props} />;
      case 'youtube': return <YoutubeIcon {...props} />;
      case 'linkedin': return <LinkedinIcon {...props} />;
      default: return null;
    }
  };

  const handleLinkHover = (e) => {
    e.currentTarget.style.color = '#8BC34A';
    e.currentTarget.style.textDecoration = 'underline';
  };
  const handleLinkLeave = (e) => {
    e.currentTarget.style.color = '#87CEEB';
    e.currentTarget.style.textDecoration = 'none';
  };

  return (
    <footer className="smart-footer-wrapper" style={{ background: '#1B5E20', color: '#FFFFFF', width: '100%' }}>
      <style>{`
        .sf-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .sf-socials { display: flex; gap: 12px; flex-wrap: wrap; }
        .sf-contact-list { display: flex; flex-direction: column; gap: 16px; font-size: 0.95rem; color: #FFFFFF; }
        .sf-contact-item { display: flex; gap: 12px; align-items: flex-start; }
        
        @media (min-width: 769px) {
          .sf-col {
            padding: 0 32px;
            border-right: 1px solid rgba(255,255,255,0.15);
          }
          .sf-col:first-child { padding-left: 0; }
          .sf-col:last-child { padding-right: 0; border-right: none; }
        }

        @media (max-width: 768px) {
          .sf-container {
            padding: 40px 20px;
            gap: 28px;
            text-align: center;
          }
          .sf-col {
            padding-bottom: 28px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          .sf-col:last-child { border-bottom: none; padding-bottom: 0; }
          .sf-socials { justify-content: center; }
          .sf-contact-list { align-items: center; }
          .sf-contact-item { justify-content: center; text-align: center; flex-direction: column; align-items: center; gap: 6px; }
        }
      `}</style>
      
      {/* 4 Columns Container */}
      <div className="sf-container">
        
        {/* Column 1: Brand & Social */}
        <div className="sf-col">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px', color: '#FFFFFF' }}>SUTANA</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', color: '#FFFFFF' }}>
            Modern Enterprise Management for Ethiopia's growing businesses. Built locally. Trusted widely.
          </p>
          {socialLinks.length > 0 && (
            <div className="sf-socials">
              {socialLinks.filter(l => l.is_active).map(link => (
                <a
                  key={link.platform}
                  href={link.url || '#'}
                  target={link.url ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'transparent',
                    color: '#FFFFFF',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2E8B57'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {getSocialIcon(link.platform, '#FFFFFF')}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Quick Links */}
        <div className="sf-col">
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: '#FFFFFF' }}>Quick Links</h4>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['About', 'Admissions', 'Academics', 'Contact Us'].map((label, i) => (
              <a 
                key={i} href="#" 
                style={{ color: '#87CEEB', textDecoration: 'none', transition: 'color 0.15s ease', fontSize: '0.95rem' }} 
                onMouseEnter={handleLinkHover} 
                onMouseLeave={handleLinkLeave}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Column 3: Contact Info */}
        <div className="sf-col">
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: '#FFFFFF' }}>Contact Info</h4>
          <div className="sf-contact-list">
            <div className="sf-contact-item">
              <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: 1.5 }}>Injibara, Awi Zone<br />Amhara Region, Ethiopia</span>
            </div>
            <div className="sf-contact-item">
              <Phone size={18} style={{ flexShrink: 0 }} />
              <span>+251 911 234 567</span>
            </div>
            <div className="sf-contact-item">
              <Mail size={18} style={{ flexShrink: 0 }} />
              <span>info@sutana.com</span>
            </div>
          </div>
        </div>

        {/* Column 4: Newsletter */}
        <div className="sf-col">
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: '#FFFFFF' }}>Newsletter</h4>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: '#FFFFFF', lineHeight: 1.5 }}>
            Subscribe to get the latest updates and news.
          </p>
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="email" 
              placeholder="Your email address" 
              required
              style={{
                width: '100%', padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid #8D6E63',
                borderRadius: '6px',
                color: '#424242',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#047454';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4,116,84,0.2)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#8D6E63';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button 
              type="submit"
              style={{
                width: '100%', padding: '10px',
                background: '#2E8B57', color: '#FFFFFF',
                border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.background = '#1B5E20';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = '#2E8B57';
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Links */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '24px 40px',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '24px',
          fontSize: '0.85rem'
        }}>
          <span style={{ color: '#FFFFFF', textAlign: 'center' }}>
            &copy; 2026 SUTANA Enterprise Management System. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/privacy" style={{ color: '#87CEEB', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={handleLinkHover} onMouseLeave={handleLinkLeave}>Privacy Policy</Link>
              <Link to="/terms"   style={{ color: '#87CEEB', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={handleLinkHover} onMouseLeave={handleLinkLeave}>Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}

export function CTASection() {
  return (
    <section className="cta-wrapper" style={{ background: '#FFFFFF', padding: '80px 0', width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .cta-wrapper { padding: 40px 0 !important; }
          .cta-container { padding: 0 16px !important; }
          .cta-card {
            border: none !important;
            border-radius: 12px !important;
            padding: 48px 24px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          }
        }
      `}</style>
      <div className="cta-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

        {/* Inner card — White with Earth Brown border, 12px radius */}
        <div className="cta-card" style={{
          background: '#F5F5F5',
          border: '1px solid #8D6E63',
          borderRadius: 12,
          padding: '64px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Subtle Forest Green top accent bar — not a full banner, just a thin decorative line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 4, background: '#228B22', borderRadius: '12px 12px 0 0'
          }} />

          {/* Small label badge using Sage Green — informational widget */}
          <div style={{
            display: 'inline-block',
            padding: '5px 16px',
            background: '#A5D6A7',
            border: '1px solid #8D6E63',
            borderRadius: 8,
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#424242',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 24
          }}>
            Ready to transform?
          </div>

          {/* Main heading — Dark Green, no banner, plain bg */}
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 900,
            color: '#1B5E20',
            marginBottom: 16,
            lineHeight: 1.15,
            letterSpacing: '-0.02em'
          }}>
            Stop managing chaos.<br />Start managing growth.
          </h2>

          {/* Body text — Dark Gray on Light Gray bg */}
          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.75,
            color: '#424242',
            maxWidth: 620,
            margin: '0 auto 40px'
          }}>
            Join forward-thinking Ethiopian businesses using SUTANA EMS to eliminate manual work,
            break data silos, and gain real-time visibility into every corner of your operations.
          </p>

          {/* Buttons row — moderate size, 8px radius, hover lift */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* Primary — Emerald Green */}
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                padding: '12px 28px', borderRadius: 8,
                border: '1px solid #2E8B57',
                background: '#2E8B57', color: '#FFFFFF',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1B5E20';
                e.currentTarget.style.borderColor = '#1B5E20';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(46,139,87,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#2E8B57';
                e.currentTarget.style.borderColor = '#2E8B57';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Sign In Now <ArrowRight size={16} />
            </button>

            {/* Secondary — Olive Green */}
            <button
              onClick={() => window.location.href = '/chat'}
              style={{
                padding: '12px 28px', borderRadius: 8,
                border: '1px solid #6B8E23',
                background: 'transparent', color: '#6B8E23',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#6B8E23';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,142,35,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6B8E23';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Talk to Our Team <ChevronRight size={16} />
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}

