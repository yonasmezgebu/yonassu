const fs = require('fs');
const path = require('path');

const newContactJsx = `import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall, User, Clock, CheckCircle, XCircle, Inbox } from 'lucide-react';
import api from '../../services/apiClient';
import './StockOperations.css';

const PharmacyContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/pharmacy-settings');
        if (res.data) {
          setSettings({
            phone1: res.data.contact_phone1 || '',
            phone2: res.data.contact_phone2 || '',
            email:  res.data.contact_email  || ''
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get('/pharmacy-settings/messages');
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchSettings();
    fetchMessages();
  }, []);

  const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/pharmacy-settings', {
        contactPhone1: settings.phone1,
        contactPhone2: settings.phone2,
        contactEmail:  settings.email
      });
      setSaveStatus({ type: 'success', text: '✓ Contact settings saved successfully' });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', text: '✗ ' + (err?.response?.data?.message || err.message) });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 4500);
    } finally {
      setSaving(false);
    }
  };

  const total   = messages.length;
  const unread  = messages.filter(m => !m.is_read).length;
  const today   = messages.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="pso-root">
      {/* ── Top Bar ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div className="pso-header-icon">
            <PhoneCall size={20} />
          </div>
          <div>
            <h1 className="pso-title">Pharmacy Contact Settings</h1>
            <p className="pso-subtitle">Manage public contact info &amp; customer messages</p>
          </div>
        </div>
      </div>

      <div className="pso-content">

        {/* ════════════════════════════════════════
            SECTION 1 — Contact Settings Form
        ════════════════════════════════════════ */}
        <div className="pso-card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PhoneCall size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Public Contact Information</span>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              These details appear in the <strong>"Pharmacy Team"</strong> contact popup on the public Pharmacy &amp; Health page. Keep them up to date so customers can reach the Pharmacy team directly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              {/* Phone 1 */}
              <div>
                <label htmlFor="pc-phone1" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Primary Phone</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    id="pc-phone1"
                    type="text"
                    name="phone1"
                    className="pso-input"
                    style={{ paddingLeft: 36 }}
                    value={settings.phone1}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Phone 2 */}
              <div>
                <label htmlFor="pc-phone2" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Secondary Phone</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    id="pc-phone2"
                    type="text"
                    name="phone2"
                    className="pso-input"
                    style={{ paddingLeft: 36 }}
                    value={settings.phone2}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="pc-email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pharmacy Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <Mail size={16} />
                  </div>
                  <input
                    id="pc-email"
                    type="email"
                    name="email"
                    className="pso-input"
                    style={{ paddingLeft: 36 }}
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="pharmacy@sutana.com"
                  />
                </div>
              </div>
            </div>

            {/* Save Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              <button
                className="btn-action-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>

              {saveStatus.text && (
                <div style={{ padding: '8px 12px', background: saveStatus.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: saveStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saveStatus.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {saveStatus.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 2 — Stats Bar
        ════════════════════════════════════════ */}
        <div className="kpi-grid">
          <div className="pso-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Inbox size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{total}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginTop: 4 }}>Total Messages</div>
            </div>
          </div>
          <div className="pso-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{unread}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginTop: 4 }}>Unread</div>
            </div>
          </div>
          <div className="pso-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{today}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginTop: 4 }}>Today</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 3 — Inbox Table
        ════════════════════════════════════════ */}
        <div className="pso-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Customer Inquiry Inbox</span>
            </div>
            {unread > 0 && (
              <span className="pso-badge" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                {unread} UNREAD
              </span>
            )}
          </div>

          {loadingMessages ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <MessageCircle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>Loading messages…</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Inbox size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>No messages yet</div>
              <p style={{ fontSize: 14, marginTop: 8 }}>Customer inquiries from the public Pharmacy Team contact form will appear here.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="pso-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Sender</th>
                    <th>Message</th>
                    <th style={{ width: '16%' }}>Phone</th>
                    <th style={{ width: '14%' }}>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} style={{ background: msg.is_read ? 'var(--color-bg-card)' : 'var(--color-bg-page)' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 6, flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 14 }}>{msg.sender_name}</div>
                            <a href={\`mailto:\${msg.sender_email}\`} style={{ fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                              {msg.sender_email}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--color-text-secondary)', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                          {msg.message}
                        </p>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          {msg.sender_phone || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                          {new Date(msg.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PharmacyContact;
`;

fs.writeFileSync(path.join('D:', 'SUTANA', 'frontend', 'src', 'pages', 'pharmacy', 'PharmacyContact.jsx'), newContactJsx, 'utf8');
console.log('PharmacyContact.jsx completely rebuilt and written.');
