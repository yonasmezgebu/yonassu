import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import {
  MessageSquare, Mail, Phone, MapPin, ExternalLink,
  Send, ArrowLeft, CheckCircle,
} from 'lucide-react';
import './GlobalChatPage.css';
import './LandingRedesign.css';

/* ── Info Card — contact detail row ── */
function InfoCard({ icon: Icon, label, value, href }) {
  return (
    <div className="gcp-info-card">
      <div className="gcp-info-icon">
        <Icon size={20} />
      </div>
      <div>
        <div className="gcp-info-label">{label}</div>
        {href ? (
          <a href={href} className="gcp-info-value">{value}</a>
        ) : (
          <span className="gcp-info-value">{value}</span>
        )}
      </div>
    </div>
  );
}

/* ── Form group wrapper ── */
function FormGroup({ label, children }) {
  return (
    <div className="gcp-form-group">
      <label className="gcp-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Page ── */
export default function GlobalChatPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="gcp-page">

      {/* ── Public Navbar ── */}
      <PublicNav />

      {/* ── Page content ── */}
      <div className="gcp-container">

        {/* Page header */}
        <header className="gcp-header">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="gcp-back-btn"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="gcp-badge">
            <MessageSquare size={12} /> Let's Talk
          </div>

          <h1 className="gcp-title">We're Here to Help</h1>
          <p className="gcp-subtitle">
            Reach out through any channel below. Our team typically responds within 24&nbsp;hours.
          </p>
        </header>

        {/* ── Two-column card ── */}
        <div className="gcp-layout">

          {/* ── LEFT: Contact info ── */}
          <div className="gcp-left">
            <h2 className="gcp-left-title">Contact Details</h2>
            <p className="gcp-left-desc">
              Multiple ways to reach us — pick the one that's most convenient for you.
            </p>

            <InfoCard icon={Mail}   label="Email"    value="info@sutana.com"                    href="mailto:info@sutana.com" />
            <InfoCard icon={Phone}  label="Phone"    value="+251 911 234 567"                   href="tel:+251911234567" />
            <InfoCard icon={MapPin} label="Location" value="Injibara, Awi Zone, Amhara Region" />

            {/* Embedded map */}
            <div className="gcp-map-wrap">
              <iframe
                title="Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.5!2d36.9300!3d10.9547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU3JzE2LjkiTiAzNsKwNTUnNDguMCJF!5e0!3m2!1sen!2set!4v1"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* WhatsApp CTA */}
            <button
              type="button"
              className="gcp-whatsapp-btn"
              onClick={() => window.open('https://wa.me/251911234567', '_blank')}
            >
              <MessageSquare size={16} /> WhatsApp Chat <ExternalLink size={13} />
            </button>
          </div>

          {/* ── RIGHT: Contact form ── */}
          <div className="gcp-right">
            {submitted ? (
              /* Success state */
              <div className="gcp-success">
                <div className="gcp-success__icon">
                  <CheckCircle size={36} />
                </div>
                <h3 className="gcp-success__title">Message Sent!</h3>
                <p className="gcp-success__body">
                  Thank you for reaching out. We'll review your message and respond within 24&nbsp;hours.
                </p>
                <button
                  type="button"
                  className="gcp-success__btn"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <>
                <h2 className="gcp-form-title">Send a Message</h2>
                <p className="gcp-form-subtitle">
                  Fill out the form and we'll get back to you.
                </p>

                <form
                  className="gcp-form-card"
                  onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
                >
                  {/* Name + Email */}
                  <div className="gcp-form-row">
                    <FormGroup label="Full Name *">
                      <input
                        required
                        type="text"
                        className="gcp-input"
                        placeholder="Your name"
                      />
                    </FormGroup>
                    <FormGroup label="Email *">
                      <input
                        required
                        type="email"
                        className="gcp-input"
                        placeholder="you@example.com"
                      />
                    </FormGroup>
                  </div>

                  {/* Subject */}
                  <FormGroup label="Subject">
                    <input
                      type="text"
                      className="gcp-input"
                      placeholder="How can we help?"
                    />
                  </FormGroup>

                  {/* Message */}
                  <FormGroup label="Message *">
                    <textarea
                      required
                      rows={6}
                      className="gcp-textarea"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </FormGroup>

                  {/* Submit */}
                  <button type="submit" className="gcp-submit-btn">
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