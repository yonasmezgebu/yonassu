import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    <div className="cap-card">
      <div className="cap-card__icon">
        <Icon size={20} />
      </div>
      <span className="cap-card__title">{c.title}</span>
      <p className="cap-card__para">
        {c.para}
      </p>
    </div>
  );
}

export function CapabilitiesSection() {
  const topRow = capabilities.slice(0, 5);
  const bottomRow = capabilities.slice(5);
  return (
    <section className="ld-section">
      <div className="ld-container" style={{ overflow: 'hidden' }}>
        <div className="ld-section-header">
          <h2>Platform Capabilities</h2>
          <p>Ten powerful modules purpose-built for Ethiopian enterprises — integrated under one roof.</p>
        </div>
        {/* Top row — moving RIGHT */}
        <div className="scroll-track-wrap" style={{ marginBottom: '1.75rem' }}>
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
    <section className="ld-section ld-section--alt">
      <div className="container">
        <div className="ld-section-header">
          <h2>Getting Started</h2>
          <p>Up and running in 4 simple steps. Most businesses are fully operational within their first week.</p>
        </div>
        <div className="grid-container">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div className="gs-card__step">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="gs-card__icon">
                  <Icon size={28} />
                </div>
                <h3 className="gs-card__title">{s.title}</h3>
                <p className="gs-card__desc">{s.desc}</p>
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
    <section className="ld-section">
      <div className="container">
        <div className="ld-section-header">
          <h2>Why SUTANA</h2>
          <p>Trusted by growing Ethiopian enterprises — simplifying operations, empowering growth.</p>
        </div>

        <div className="ld-grid-2col">
          <div className="ld-grid-2col__main">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="card" style={{ display: 'flex', gap: '1.25rem', padding: '1.5rem' }}>
                  <div className="ws-card__icon">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 className="ws-card__title">{b.title}</h4>
                    <p className="ws-card__desc">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ld-grid-2col__aside">
            <div className="image-container">
              <img src={happy1} alt="SUTANA Enterprise Team" />
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
    <section className="ld-section ld-section--alt">
      <div className="container">
        <div className="ld-section-header">
          <h2>Success Stories</h2>
          <p>Businesses that transformed with SUTANA — real results from real Ethiopian enterprises.</p>
        </div>

        <div className="grid-container">
          {testimonials.map((t, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ts-card__stars">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={15} fill="hsl(var(--primary))" color="hsl(var(--primary))" strokeWidth={1.5} />
                ))}
              </div>

              <Quote size={28} className="ts-card__quote-icon" />

              <p className="ts-card__text">
                "{t.quote}"
              </p>

              <div className="ts-card__author" style={{ marginTop: 'auto' }}>
                <div className="ts-card__avatar">
                  {t.initials}
                </div>
                <div>
                  <div className="ts-card__name">{t.name}</div>
                  <div className="ts-card__role">{t.role}</div>
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
  const location = useLocation();
  const isBuyPage = location.pathname.startsWith('/tenders/buy') || location.pathname.startsWith('/services/retail');
  const isRentalPage = location.pathname.startsWith('/fleet-gallery') || location.pathname.startsWith('/services/farming');
  const isPharmacyPage = location.pathname.startsWith('/services/pharmacy');
  const isPrintingPage = location.pathname.startsWith('/services/printing');
  const isGeneralPage = location.pathname === '/' || 
    location.pathname.startsWith('/gallery') || 
    location.pathname.startsWith('/news') || 
    location.pathname.startsWith('/track-order') || 
    location.pathname.startsWith('/about');

  const [socialLinks, setSocialLinks] = useState([]);
  const [procContact, setProcContact] = useState({ contact_phone1: '', contact_email: '' });
  const [salesContact, setSalesContact] = useState({ contact_phone1: '', contact_email: '' });
  const [rentalContact, setRentalContact] = useState({ contact_phone1: '', contact_email: '' });
  const [pharmacyContact, setPharmacyContact] = useState({ contact_phone1: '', contact_email: '' });
  const [printingContact, setPrintingContact] = useState({ contact_phone1: '', contact_email: '' });
  const [hrContact, setHrContact] = useState({ contact_phone1: '', contact_email: '' });
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState('');

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await apiClient.get('/public/social-links');
        setSocialLinks(response?.data || []);
      } catch (_) {
        // Server unavailable — footer renders without social icons
      }
    };
    const fetchProcContact = async () => {
      try {
        const res = await apiClient.get('/procurement-settings');
        if (res.data) setProcContact(res.data);
      } catch (_) {
        // ignore — footer renders without contact details
      }
    };
    const fetchSalesContact = async () => {
      try {
        const res = await apiClient.get('/sales-settings');
        if (res.data) setSalesContact(res.data);
      } catch (_) {}
    };
    const fetchRentalContact = async () => {
      try {
        const res = await apiClient.get('/rental-settings');
        if (res.data) setRentalContact(res.data);
      } catch (_) {}
    };
    const fetchPharmacyContact = async () => {
      try {
        const res = await apiClient.get('/pharmacy-settings');
        if (res.data) setPharmacyContact(res.data);
      } catch (_) {}
    };
    const fetchPrintingContact = async () => {
      try {
        const res = await apiClient.get('/printing-settings');
        if (res.data) setPrintingContact(res.data);
      } catch (_) {}
    };
    const fetchHrContact = async () => {
      try {
        const res = await apiClient.get('/hr-settings');
        if (res.data) setHrContact(res.data);
      } catch (_) {}
    };
    fetchSocials();
    fetchProcContact();
    fetchSalesContact();
    fetchRentalContact();
    fetchPharmacyContact();
    fetchPrintingContact();
    fetchHrContact();
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

  return (
    <footer className="smart-footer-wrapper">
      {/* 4 Columns Container */}
      <div className="sf-container">
        
        {/* Column 1: Brand & Social */}
        <div className="sf-col">
          <h3>SUTANA</h3>
          <p>
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
                  className="sf-social-btn"
                >
                  {getSocialIcon(link.platform, 'currentColor')}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Quick Links */}
        <div className="sf-col">
          <h4>Quick Links</h4>
          <nav className="sf-nav">
            {['About', 'Admissions', 'Academics'].map((label, i) => (
              <a key={i} href="#" className="sf-link">
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Column 3: Contact Info */}
        <div className="sf-col">
          <h4>Contact Info</h4>
          <div className="sf-contact-list">
            {(isGeneralPage ? hrContact.contact_phone1 : isPrintingPage ? printingContact.contact_phone1 : isPharmacyPage ? pharmacyContact.contact_phone1 : isRentalPage ? rentalContact.contact_phone1 : isBuyPage ? salesContact.contact_phone1 : procContact.contact_phone1) && (
              <div className="sf-contact-item">
                <Phone size={18} style={{ flexShrink: 0 }} />
                <span>{isGeneralPage ? hrContact.contact_phone1 : isPrintingPage ? printingContact.contact_phone1 : isPharmacyPage ? pharmacyContact.contact_phone1 : isRentalPage ? rentalContact.contact_phone1 : isBuyPage ? salesContact.contact_phone1 : procContact.contact_phone1}</span>
              </div>
            )}
            {(isGeneralPage ? hrContact.contact_email : isPrintingPage ? printingContact.contact_email : isPharmacyPage ? pharmacyContact.contact_email : isRentalPage ? rentalContact.contact_email : isBuyPage ? salesContact.contact_email : procContact.contact_email) && (
              <div className="sf-contact-item">
                <Mail size={18} style={{ flexShrink: 0 }} />
                <span>{isGeneralPage ? hrContact.contact_email : isPrintingPage ? printingContact.contact_email : isPharmacyPage ? pharmacyContact.contact_email : isRentalPage ? rentalContact.contact_email : isBuyPage ? salesContact.contact_email : procContact.contact_email}</span>
              </div>
            )}
            <div className="sf-contact-item" style={{ marginTop: '0.5rem' }}>
              <Link
                to={isGeneralPage ? "/hr-contact" : isPrintingPage ? "/printing-contact" : isPharmacyPage ? "/pharmacy-contact" : isRentalPage ? "/rental-contact" : isBuyPage ? "/sales-contact" : "/procurement-contact"}
                className="sf-contact-cta"
              >
                <Phone size={14} /> {isGeneralPage ? "Contact SUTANA" : isPrintingPage ? "Printing Team" : isPharmacyPage ? "Pharmacy Team" : isRentalPage ? "Rental Team" : isBuyPage ? "Sales Team" : "Procurement Team"}
              </Link>
            </div>
          </div>
        </div>

        {/* Column 4: Newsletter */}
        <div className="sf-col">
          <h4>Newsletter</h4>
          <p>Subscribe to get the latest updates and news.</p>
          {nlStatus ? (
            <div style={{ fontSize: '0.85rem', color: '#86efac', fontWeight: 600, padding: '0.5rem 0' }}>
              {nlStatus}
            </div>
          ) : (
            <form className="sf-newsletter-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!nlEmail.trim()) return;
              try {
                const res = await apiClient.post('/email-subscribers/subscribe', { email: nlEmail, source: 'landing_page' });
                setNlStatus(res?.message || 'Thank you for subscribing!');
                setNlEmail('');
              } catch (err) {
                setNlStatus(err?.message || 'Subscription failed. Please try again.');
              }
              setTimeout(() => setNlStatus(''), 5000);
            }}>
              <input 
                type="email" 
                placeholder="Your email address" 
                required
                className="sf-newsletter-input"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
              />
              <button type="submit" className="sf-newsletter-btn">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar: Copyright & Links */}
      <div className="sf-bottom-bar">
        <div className="sf-bottom-inner">
          <span style={{ fontWeight: 800 }}>INJIBARA ETHIOPIA</span>
          <span>&copy; 2026 SUTANA Enterprise Management System. All rights reserved.</span>
          <div className="sf-bottom-links">
            <Link to="/privacy" className="sf-bottom-link">Privacy Policy</Link>
            <Link to="/terms" className="sf-bottom-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function CTASection() {
  return (
    <section className="cta-wrapper">
      <div className="container">
        <div className="cta-card">
          <div className="cta-card__accent" />
          <div className="cta-card__badge">Ready to transform?</div>
          <h2 className="cta-card__title">
            Stop managing chaos.<br />Start managing growth.
          </h2>
          <p className="cta-card__body">
            Join forward-thinking Ethiopian businesses using SUTANA EMS to eliminate manual work,
            break data silos, and gain real-time visibility into every corner of your operations.
          </p>
          <div className="cta-card__actions">
            <button onClick={() => window.location.href = '/login'} className="btn-primary">
              Sign In Now <ArrowRight size={16} />
            </button>
            <button onClick={() => window.location.href = '/chat'} className="btn-outline">
              Talk to Our Team <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

