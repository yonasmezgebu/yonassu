import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import {
  MessageSquare, Mail, Phone, MapPin, ExternalLink,
  Send, ArrowLeft, CheckCircle
} from 'lucide-react';

/* ── Design tokens ── */
const C = {
  darkGreen:   '#1B5E20',
  forestGreen: '#228B22',
  emerald:     '#2E8B57',
  olive:       '#6B8E23',
  skyBlue:     '#87CEEB',
  earthBrown:  '#8D6E63',
  white:       '#FFFFFF',
  lightGray:   '#F5F5F5',
  sageGreen:   '#A5D6A7',
  mintGreen:   '#98FF98',
  darkGray:    '#424242',
};

/* ── Input shared style ── */
const inp = {
  width: '100%',
  padding: '10px 14px',
  border: `1px solid ${C.earthBrown}`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  background: C.white,
  color: C.darkGray,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

/* ── Contact info card ── */
function InfoCard({ icon: Icon, label, value, href }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: C.white, borderRadius: 12, padding: '18px 20px',
      border: `1px solid ${C.earthBrown}`,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      cursor: 'default',
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
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: C.sageGreen, color: C.forestGreen,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.olive, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          {label}
        </div>
        {href ? (
          <a href={href} style={{
            fontSize: 14, fontWeight: 700, color: C.skyBlue,
            textDecoration: 'none', transition: 'color 0.15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = C.emerald; e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.skyBlue; e.currentTarget.style.textDecoration = 'none'; }}
          >
            {value}
          </a>
        ) : (
          <span style={{ fontSize: 14, fontWeight: 700, color: C.darkGray }}>{value}</span>
        )}
      </div>
    </div>
  );
}

export default function GlobalChatPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const focusIn  = e => { e.target.style.borderColor = C.emerald; e.target.style.boxShadow = '0 0 0 3px rgba(46,139,87,0.15)'; };
  const focusOut = e => { e.target.style.borderColor = C.earthBrown; e.target.style.boxShadow = 'none'; };

  return (
    /* Single page — everything scrolls together */
    <div style={{ minHeight: '100vh', background: C.lightGray, fontFamily: 'inherit' }}>
      <style>{`
        .gc-container { padding: 60px 40px 80px; }
        .gc-layout { flex-direction: row; }
        .gc-left { flex: 0 0 42%; padding: 48px 40px; border-right: 1px solid ${C.earthBrown}; border-bottom: none; }
        .gc-right { padding: 48px 44px; }
        .gc-form-row { grid-template-columns: 1fr 1fr; }
        
        @media (max-width: 768px) {
          .gc-container { padding: 30px 20px 60px; }
          .gc-layout { flex-direction: column; }
          .gc-left { padding: 32px 24px; border-right: none; border-bottom: 1px solid ${C.earthBrown}; }
          .gc-right { padding: 32px 24px; }
          .gc-form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Public Navbar ── */}
      <PublicNav />

      {/* ── Page Content ── */}
      <div className="gc-container" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 48 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: `1px solid ${C.earthBrown}`,
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: C.olive,
              transition: 'all 0.15s ease', marginBottom: 28,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.olive; e.currentTarget.style.color = C.white; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.olive; e.currentTarget.style.transform = 'none'; }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: C.sageGreen, border: `1px solid ${C.earthBrown}`,
            borderRadius: 8, padding: '5px 14px',
            fontSize: 11, fontWeight: 800, color: C.darkGray,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 14, marginLeft: 16,
          }}>
            <MessageSquare size={12} color={C.forestGreen} /> Let's Talk
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900,
            color: C.darkGreen, marginBottom: 10, letterSpacing: '-0.02em',
          }}>
            We're Here to Help
          </h1>
          <p style={{ fontSize: '1.05rem', color: C.darkGray, maxWidth: 520 }}>
            Reach out through any channel below. Our team typically responds within 24 hours.
          </p>
        </div>

        {/* ── Two-column layout with vertical divider ── */}
        <div className="gc-layout" style={{
          display: 'flex', gap: 0,
          background: C.white,
          border: `1px solid ${C.earthBrown}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>

          {/* ── LEFT column: Contact Info ── */}
          <div className="gc-left" style={{
            background: C.lightGray,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: C.darkGreen, marginBottom: 4 }}>
              Contact Details
            </h2>
            <p style={{ fontSize: '0.9rem', color: C.darkGray, marginBottom: 8 }}>
              Multiple ways to reach us — pick the one that's most convenient for you.
            </p>

            <InfoCard icon={Mail}  label="Email"    value="info@sutana.com"      href="mailto:info@sutana.com" />
            <InfoCard icon={Phone} label="Phone"    value="+251 911 234 567"      href="tel:+251911234567" />
            <InfoCard icon={MapPin} label="Location" value="Injibara, Awi Zone, Amhara Region" />

            {/* Map embedded */}
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${C.earthBrown}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <iframe
                title="Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.5!2d36.9300!3d10.9547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU3JzE2LjkiTiAzNsKwNTUnNDguMCJF!5e0!3m2!1sen!2set!4v1"
                width="100%"
                height="220"
                style={{ border: 0, display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* WhatsApp — secondary Olive style */}
            <button
              onClick={() => window.open('https://wa.me/251911234567', '_blank')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 8,
                border: `1px solid ${C.olive}`,
                background: 'transparent', color: C.olive,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.olive;
                e.currentTarget.style.color = C.white;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,142,35,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = C.olive;
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <MessageSquare size={16} /> WhatsApp Chat <ExternalLink size={13} />
            </button>
          </div>

          {/* ── RIGHT column: Form ── */}
          <div className="gc-right" style={{ flex: 1 }}>
            {submitted ? (
              /* Success state */
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', height: '100%', gap: 16, padding: '40px 0',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: C.sageGreen,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.forestGreen}`,
                }}>
                  <CheckCircle size={36} color={C.darkGreen} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: C.darkGreen, margin: 0 }}>Message Sent!</h3>
                <p style={{ fontSize: 14, color: C.darkGray, maxWidth: 360, margin: 0 }}>
                  Thank you for reaching out. We'll review your message and respond within 24 hours.
                </p>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 28px', borderRadius: 8,
                    border: `1px solid ${C.emerald}`,
                    background: C.emerald, color: C.white,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.darkGreen; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(46,139,87,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.emerald; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: C.darkGreen, marginBottom: 4 }}>
                  Send a Message
                </h2>
                <p style={{ fontSize: 13, color: C.olive, marginBottom: 28, fontWeight: 600 }}>
                  Fill out the form and we'll get back to you.
                </p>

                <form
                  onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 18,
                    border: `1px solid ${C.earthBrown}`,
                    borderRadius: 12, padding: '28px',
                    background: C.lightGray,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Name + Email row */}
                  <div className="gc-form-row" style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Full Name *
                      </label>
                      <input required style={inp} placeholder="Your name"
                        onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Email *
                      </label>
                      <input type="email" required style={inp} placeholder="you@example.com"
                        onFocus={focusIn} onBlur={focusOut} />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Subject
                    </label>
                    <input style={inp} placeholder="How can we help?"
                      onFocus={focusIn} onBlur={focusOut} />
                  </div>

                  {/* Message */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Message *
                    </label>
                    <textarea
                      required rows={6}
                      style={{ ...inp, resize: 'vertical', minHeight: 120 }}
                      placeholder="Tell us more about your inquiry..."
                      onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>

                  {/* Submit — Emerald primary button */}
                  <button
                    type="submit"
                    style={{
                      alignSelf: 'flex-end',
                      padding: '11px 28px', borderRadius: 8,
                      border: `1px solid ${C.emerald}`,
                      background: C.emerald, color: C.white,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = C.darkGreen;
                      e.currentTarget.style.borderColor = C.darkGreen;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(46,139,87,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = C.emerald;
                      e.currentTarget.style.borderColor = C.emerald;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Send size={15} /> Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}