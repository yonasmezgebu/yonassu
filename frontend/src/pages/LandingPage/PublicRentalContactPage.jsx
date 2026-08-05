import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Send, CheckCircle, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';
import api from '../../services/apiClient';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .prc-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: prcFadeIn 0.25s ease;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 16px;
  }

  @keyframes prcFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .prc-modal {
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
    animation: prcSlideUp 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: #A5D6A7 #1B5E20;
  }
  .prc-modal::-webkit-scrollbar { width: 5px; }
  .prc-modal::-webkit-scrollbar-thumb { background: #A5D6A7; border-radius: 4px; }
  .prc-modal::-webkit-scrollbar-track { background: #1B5E20; }

  @keyframes prcSlideUp {
    from { transform: translateY(20px) scale(0.98); opacity: 0; }
    to   { transform: translateY(0) scale(1);       opacity: 1; }
  }

  /* Left panel — solid dark green, always fills full height */
  .prc-left {
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

  .prc-back-btn {
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
  .prc-back-btn:hover {
    color: #FFFFFF;
    transform: translateY(-1px);
  }

  .prc-brand {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #A5D6A7;
    margin-bottom: 8px;
  }

  .prc-title {
    font-size: 28px;
    font-weight: 900;
    color: #FFFFFF;
    margin: 0 0 12px;
    line-height: 1.15;
  }

  .prc-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    line-height: 1.6;
    margin: 0 0 32px;
  }

  .prc-divider {
    height: 1px;
    background: rgba(255,255,255,0.15);
    margin-bottom: 32px;
  }

  .prc-contact-block {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  .prc-contact-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .prc-icon-wrap {
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

  .prc-contact-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #A5D6A7;
    margin: 0 0 2px;
  }

  .prc-contact-value {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .prc-contact-value:hover { color: #87CEEB; }

  /* Right panel — white form area */
  .prc-right {
    flex: 1;
    background: #FFFFFF;
    padding: 40px;
    border-radius: 0 14px 14px 0;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
  }

  .prc-form-title {
    font-size: 22px;
    font-weight: 800;
    color: #1B5E20;
    margin: 0 0 8px;
  }

  .prc-form-sub {
    font-size: 14px;
    color: #424242;
    margin: 0 0 28px;
    line-height: 1.5;
  }

  /* Form Elements */
  .prc-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .prc-field { display: flex; flex-direction: column; gap: 6px; }

  .prc-label {
    font-size: 13px;
    font-weight: 600;
    color: #424242;
  }

  .prc-input, .prc-textarea {
    padding: 12px 14px;
    border: 1px solid #8D6E63;
    border-radius: 6px;
    font-size: 14px;
    color: #424242;
    background: #FFFFFF;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    width: 100%;
    box-sizing: border-box;
  }
  .prc-input:focus, .prc-textarea:focus {
    border-color: #2E8B57;
    box-shadow: 0 0 0 3px rgba(46,139,87,0.15);
  }
  .prc-input::placeholder, .prc-textarea::placeholder {
    color: #9e9e9e;
  }

  .prc-textarea {
    resize: vertical;
    min-height: 110px;
    line-height: 1.5;
  }

  .prc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .prc-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  .prc-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 24px;
    background: #2E8B57;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'Inter', sans-serif;
  }
  .prc-submit:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .prc-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .prc-cancel {
    background: transparent;
    border: 1px solid #8D6E63;
    color: #6B8E23;
    padding: 9px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s ease;
  }
  .prc-cancel:hover {
    background: #6B8E23;
    color: #FFFFFF;
    border-color: #6B8E23;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  /* Toasts */
  .prc-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    animation: prcToastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes prcToastIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .prc-toast.success { background: #4CAF50; color: #FFFFFF; }
  .prc-toast.error { background: #F44336; color: #FFFFFF; }

  /* Responsive */
  @media (max-width: 768px) {
    .prc-modal {
      flex-direction: column;
      max-width: 100%;
      border-radius: 14px;
    }
    .prc-left {
      width: 100%;
      border-radius: 14px 14px 0 0;
      padding: 32px 24px;
    }
    .prc-right {
      border-radius: 0 0 14px 14px;
      padding: 32px 24px;
    }
    .prc-row { grid-template-columns: 1fr; }
    .prc-actions { flex-direction: column; width: 100%; }
    .prc-submit, .prc-cancel { width: 100%; justify-content: center; }
  }
`;

const RentalContactModal = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    contact_phone1: '',
    contact_phone2: '',
    contact_email: ''
  });

  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/rental-settings');
        if (res.data) setSettings(res.data);
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    };
    fetchSettings();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBack = () => navigate(-1);

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
      await api.post('/rental-settings/messages', formData);
      setStatus({ type: 'success', message: 'Message sent! Our Rental Team will respond shortly.' });
      setFormData({ senderName: '', senderEmail: '', senderPhone: '', message: '' });
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
      <div className="prc-overlay" onClick={handleBackdropClick}>
        <div className="prc-modal" role="dialog" aria-modal="true" aria-labelledby="prc-heading">

          {/* ─── Left Panel: Brand + Contact Info ─── */}
          <div className="prc-left">
            <button className="prc-back-btn" onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={16} /> Back
            </button>

            <div className="prc-brand">SUTANA Rental</div>
            <h1 className="prc-title" id="prc-heading">Contact Our Rental Team</h1>
            <div className="prc-subtitle">
              Have questions about renting cars, fleet services, or agricultural equipment? We're here to help.
            </div>

            <div className="prc-divider" />

            <div className="prc-contact-block">
              {settings.contact_phone1 && (
                <div className="prc-contact-row">
                  <div className="prc-icon-wrap"><Phone size={18} /></div>
                  <div>
                    <div className="prc-contact-label" style={{background:'transparent'}}>Primary Phone</div>
                    <a href={`tel:${settings.contact_phone1}`} className="prc-contact-value" style={{background:'transparent', color:'#FFFFFF'}}>
                      {settings.contact_phone1}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_phone2 && (
                <div className="prc-contact-row">
                  <div className="prc-icon-wrap"><Phone size={18} /></div>
                  <div>
                    <div className="prc-contact-label" style={{background:'transparent'}}>Secondary Phone</div>
                    <a href={`tel:${settings.contact_phone2}`} className="prc-contact-value" style={{background:'transparent', color:'#FFFFFF'}}>
                      {settings.contact_phone2}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_email && (
                <div className="prc-contact-row">
                  <div className="prc-icon-wrap"><Mail size={18} /></div>
                  <div>
                    <div className="prc-contact-label" style={{background:'transparent'}}>Email Address</div>
                    <a href={`mailto:${settings.contact_email}`} className="prc-contact-value" style={{background:'transparent', color:'#FFFFFF'}}>
                      {settings.contact_email}
                    </a>
                  </div>
                </div>
              )}

              <div className="prc-contact-row">
                <div className="prc-icon-wrap"><MapPin size={18} /></div>
                <div>
                  <div className="prc-contact-label" style={{background:'transparent'}}>Location</div>
                  <div className="prc-contact-value" style={{ cursor: 'default', background: 'transparent', color: '#FFFFFF' }}>Injibara, Ethiopia</div>
                </div>
              </div>

              {!settings.contact_phone1 && !settings.contact_phone2 && !settings.contact_email && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: '10px', background: 'transparent' }}>
                  Contact details are being updated. Please check back soon.
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Panel: Message Form ─── */}
          <div className="prc-right">
            <h2 className="prc-form-title">Send a Message</h2>
            <p className="prc-form-sub">
              Fill in the details below and our team will get back to you as soon as possible.
            </p>

            <form className="prc-form" onSubmit={handleSubmit}>
              <div className="prc-field">
                <label className="prc-label" htmlFor="senderName">Full Name <span style={{ color: '#F44336' }}>*</span></label>
                <input
                  id="senderName"
                  className="prc-input"
                  type="text"
                  name="senderName"
                  required
                  value={formData.senderName}
                  onChange={handleChange}
                  placeholder="e.g. Yonas Mezgebu"
                />
              </div>

              <div className="prc-row">
                <div className="prc-field">
                  <label className="prc-label" htmlFor="senderEmail">Email Address <span style={{ color: '#F44336' }}>*</span></label>
                  <input
                    id="senderEmail"
                    className="prc-input"
                    type="email"
                    name="senderEmail"
                    required
                    value={formData.senderEmail}
                    onChange={handleChange}
                    placeholder="yonas@example.com"
                  />
                </div>
                <div className="prc-field">
                  <label className="prc-label" htmlFor="senderPhone">Phone Number</label>
                  <input
                    id="senderPhone"
                    className="prc-input"
                    type="text"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    placeholder="+251 900 000 000"
                  />
                </div>
              </div>

              <div className="prc-field">
                <label className="prc-label" htmlFor="message">Your Message <span style={{ color: '#F44336' }}>*</span></label>
                <textarea
                  id="message"
                  className="prc-textarea"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your inquiry about car rentals, machinery, or fleet services..."
                />
              </div>

              {/* ── Button Row ── */}
              <div className="prc-actions">
                <button type="submit" className="prc-submit" disabled={loading}>
                  <Send size={16} />
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
                <button type="button" className="prc-cancel" onClick={handleBack}>
                  Cancel
                </button>
              </div>

              {/* ── Disclaimer ── */}
              <p style={{
                margin: '8px 0 0',
                fontSize: '12px',
                color: '#9e9e9e',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                Your message goes directly to our secure inbox.
              </p>
            </form>
          </div>

        </div>
      </div>
      
      {/* Toast Notification */}
      {status.message && (
        <div className={`prc-toast ${status.type}`} role="alert">
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}
    </>
  );
};

export default RentalContactModal;
