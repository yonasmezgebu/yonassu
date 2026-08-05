import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Send, CheckCircle, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';
import api from '../../services/apiClient';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .ppc-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: ppcFadeIn 0.25s ease;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 16px;
  }

  @keyframes ppcFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ppc-modal {
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: #1B5E20;
    border-radius: 14px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    animation: ppcSlideUp 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: #A5D6A7 #1B5E20;
  }
  .ppc-modal::-webkit-scrollbar { width: 5px; }
  .ppc-modal::-webkit-scrollbar-thumb { background: #A5D6A7; border-radius: 4px; }
  .ppc-modal::-webkit-scrollbar-track { background: #1B5E20; }

  @keyframes ppcSlideUp {
    from { transform: translateY(20px) scale(0.98); opacity: 0; }
    to   { transform: translateY(0) scale(1);       opacity: 1; }
  }

  /* Left panel — always full green height */
  .ppc-left {
    background: #1B5E20;
    color: #FFFFFF;
    padding: 40px 32px;
    width: 320px;
    min-width: 320px;
    flex-shrink: 0;
    border-radius: 14px 0 0 14px;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
  }

  .ppc-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #A5D6A7;
    padding: 0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 32px;
    width: fit-content;
    transition: color 0.15s ease, transform 0.15s ease;
    font-family: 'Inter', sans-serif;
  }
  .ppc-back-btn:hover {
    color: #FFFFFF;
    transform: translateY(-1px);
  }

  .ppc-brand {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #A5D6A7;
    margin-bottom: 8px;
    background: transparent;
  }

  .ppc-title {
    font-size: 28px;
    font-weight: 900;
    color: #FFFFFF;
    margin: 0 0 12px;
    line-height: 1.15;
  }

  .ppc-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    line-height: 1.6;
    margin: 0 0 32px;
    background: transparent;
  }

  .ppc-divider {
    height: 1px;
    background: rgba(255,255,255,0.15);
    margin-bottom: 32px;
  }

  .ppc-contact-block {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  .ppc-contact-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .ppc-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #A5D6A7;
  }

  .ppc-contact-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #A5D6A7;
    margin: 0 0 2px;
    background: transparent;
  }

  .ppc-contact-value {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
    text-decoration: none;
    transition: color 0.15s ease;
    background: transparent;
  }
  .ppc-contact-value:hover { color: #87CEEB; }

  /* Right panel */
  .ppc-right {
    flex: 1;
    background: #FFFFFF;
    padding: 40px;
    border-radius: 0 14px 14px 0;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
  }

  .ppc-form-title {
    font-size: 22px;
    font-weight: 800;
    color: #1B5E20;
    margin: 0 0 6px;
  }

  .ppc-form-sub {
    font-size: 14px;
    color: #424242;
    margin: 0 0 32px;
    line-height: 1.55;
  }

  .ppc-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    animation: ppcToastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes ppcToastIn {
    from { transform: translateX(100%) scale(0.9); opacity: 0; }
    to { transform: translateX(0) scale(1); opacity: 1; }
  }
  .ppc-toast.success {
    background: #4CAF50;
    color: #fff;
    border: none;
  }
  .ppc-toast.error {
    background: #F44336;
    color: #fff;
    border: none;
  }

  .ppc-field { display: flex; flex-direction: column; gap: 6px; }

  .ppc-label {
    font-size: 13px;
    font-weight: 600;
    color: #424242;
  }

  .ppc-input, .ppc-textarea {
    padding: 11px 14px;
    border: 1px solid #8D6E63;
    border-radius: 6px;
    font-size: 15px;
    color: #424242;
    background: #fff;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    width: 100%;
    box-sizing: border-box;
  }
  .ppc-input:focus, .ppc-textarea:focus {
    border-color: #2E8B57;
    box-shadow: 0 0 0 3px rgba(46,139,87,0.15);
  }
  .ppc-input::placeholder, .ppc-textarea::placeholder {
    color: #bdbdbd;
  }

  .ppc-textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }

  .ppc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .ppc-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 28px;
    background: #2E8B57;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    font-family: 'Inter', sans-serif;
    align-self: flex-start;
  }
  .ppc-submit:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(46,139,87,0.28);
  }
  .ppc-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .ppc-modal {
      flex-direction: column;
      max-width: 100%;
      max-height: 95vh;
      border-radius: 14px;
      overflow-y: auto;
    }
    .ppc-left {
      width: 100%;
      border-radius: 14px 14px 0 0;
      padding: 32px 24px;
      overflow: visible;
    }
    .ppc-right {
      border-radius: 0 0 14px 14px;
      padding: 32px 24px;
      overflow: visible;
    }
    .ppc-row {
      grid-template-columns: 1fr;
    }
    .ppc-submit {
      width: 100%;
      justify-content: center;
    }
  }
`;

const ProcurementContactModal = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    contact_phone1: '',
    contact_phone2: '',
    contact_email: ''
  });

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_email: '',
    sender_phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/procurement-settings');
        if (res.data) setSettings(res.data);
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    };
    fetchSettings();
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBack = () => navigate(-1);

  // Close if clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleBack();
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/procurement-settings/messages', formData);
      setStatus({ type: 'success', message: 'Message sent! Our procurement team will respond shortly.' });
      setFormData({ sender_name: '', sender_email: '', sender_phone: '', message: '' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send. Please try again.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ppc-overlay" onClick={handleBackdropClick}>
        <div className="ppc-modal" role="dialog" aria-modal="true" aria-labelledby="ppc-heading">

          {/* ─── Left Panel: Brand + Contact Info ─── */}
          <div className="ppc-left">
            <button className="ppc-back-btn" onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={15} /> Back
            </button>

            <p className="ppc-brand">SUTANA Procurement</p>
            <h1 className="ppc-title" id="ppc-heading">Contact Our Procurement Team</h1>
            <p className="ppc-subtitle">
              Have a question about our tenders, bidding process, or supplier requirements? We're here to help.
            </p>

            <div className="ppc-divider" />

            <div className="ppc-contact-block">
              {settings.contact_phone1 && (
                <div className="ppc-contact-row">
                  <div className="ppc-icon-wrap">
                    <Phone size={18} color="#A5D6A7" />
                  </div>
                  <div>
                    <p className="ppc-contact-label">Primary Phone</p>
                    <a href={`tel:${settings.contact_phone1}`} className="ppc-contact-value">
                      {settings.contact_phone1}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_phone2 && (
                <div className="ppc-contact-row">
                  <div className="ppc-icon-wrap">
                    <Phone size={18} color="#A5D6A7" />
                  </div>
                  <div>
                    <p className="ppc-contact-label">Secondary Phone</p>
                    <a href={`tel:${settings.contact_phone2}`} className="ppc-contact-value">
                      {settings.contact_phone2}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_email && (
                <div className="ppc-contact-row">
                  <div className="ppc-icon-wrap">
                    <Mail size={18} color="#A5D6A7" />
                  </div>
                  <div>
                    <p className="ppc-contact-label">Email Address</p>
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="ppc-contact-value"
                    >
                      {settings.contact_email}
                    </a>
                  </div>
                </div>
              )}

              <div className="ppc-contact-row">
                <div className="ppc-icon-wrap">
                  <MapPin size={18} color="#A5D6A7" />
                </div>
                <div>
                  <div className="ppc-contact-label">Location</div>
                  <div className="ppc-contact-value" style={{ cursor: 'default', background: 'transparent', color: '#FFFFFF' }}>Injibara, Ethiopia</div>
                </div>
              </div>

              {!settings.contact_phone1 && !settings.contact_phone2 && !settings.contact_email && (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                  Contact details are being updated. Please check back soon.
                </p>
              )}
            </div>
          </div>

            {/* ─── Right Panel: Message Form ─── */}
          <div className="ppc-right">
            <h2 className="ppc-form-title">Send a Message</h2>
            <p className="ppc-form-sub">
              Fill in the details below and we'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="ppc-field">
                <label className="ppc-label" htmlFor="sender_name">Full Name <span style={{ color: '#F44336' }}>*</span></label>
                <input
                  id="sender_name"
                  className="ppc-input"
                  type="text"
                  name="sender_name"
                  required
                  value={formData.sender_name}
                  onChange={handleChange}
                  placeholder="e.g. Yonas Mezgebu"
                />
              </div>

              <div className="ppc-row">
                <div className="ppc-field">
                  <label className="ppc-label" htmlFor="sender_email">Email Address <span style={{ color: '#F44336' }}>*</span></label>
                  <input
                    id="sender_email"
                    className="ppc-input"
                    type="email"
                    name="sender_email"
                    required
                    value={formData.sender_email}
                    onChange={handleChange}
                    placeholder="yonasmezgebu77@gmail.com"
                  />
                </div>
                <div className="ppc-field">
                  <label className="ppc-label" htmlFor="sender_phone">Phone Number</label>
                  <input
                    id="sender_phone"
                    className="ppc-input"
                    type="text"
                    name="sender_phone"
                    value={formData.sender_phone}
                    onChange={handleChange}
                    placeholder="+251 900 000 000"
                  />
                </div>
              </div>

              <div className="ppc-field">
                <label className="ppc-label" htmlFor="message">Your Message <span style={{ color: '#F44336' }}>*</span></label>
                <textarea
                  id="message"
                  className="ppc-textarea"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your inquiry about tenders, bidding, or procurement..."
                  rows={5}
                />
              </div>

              {/* ── Button Row ── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
                paddingTop: '20px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <button
                  type="submit"
                  className="ppc-submit"
                  disabled={loading}
                >
                  <Send size={16} />
                  {loading ? 'Sending…' : 'Send Message'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: 'transparent',
                    border: '1px solid #8D6E63',
                    color: '#6B8E23',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background 0.15s ease, color 0.15s ease, transform 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#6B8E23';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6B8E23';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* ── Disclaimer ── */}
              <p style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: '#bdbdbd',
                lineHeight: 1.6,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                Your message goes directly to our procurement team inbox. We typically respond within 1 business day.
              </p>
            </form>
          </div>

        </div>
      </div>
      
      {/* Toast Notification */}
      {status.message && (
        <div className={`ppc-toast ${status.type}`} role="alert">
          {status.type === 'success'
            ? <CheckCircle size={20} style={{ flexShrink: 0 }} />
            : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          <span>{status.message}</span>
        </div>
      )}
    </>
  );
};

export default ProcurementContactModal;
