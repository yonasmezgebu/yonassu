import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall, User, Clock, CheckCircle, XCircle, Inbox } from 'lucide-react';
import api from '../../services/apiClient';

/* ─── All 17 rules applied ───────────────────────────────────────────────────
  1.  No plant bg animation. Buttons on setting section only (not inside big table).
  2.  Natural green palette throughout.
  3.  Sharp corners everywhere — zero border-radius.
  4.  Rows and columns properly laid out with grid.
  5.  100% width — no centered container with side margins.
  6.  In-app inline notification only — no alert().
  7.  Responsive mobile breakpoints via CSS.
  8.  NO border-radius on anything.
  9.  White text on green, dark text on light bg.
  10. Form fields: sharp corners, bold 2px Forest-Green border.
  11. White text on all green surfaces.
  12. No gap between page and sidebar/navbar — padding 0 on root.
  13. Content starts below navbar naturally (DashboardLayout handles it).
  14. Bold border on every input — only because form exists here.
  15. Hover effects on rows, buttons, links.
  16. No bold-color "section header container" in the middle.
  17. N/A — this IS the page; form is on the same page.
──────────────────────────────────────────────────────────────────────────── */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .ptc-root {
    width: 100%;
    min-height: 100%;
    background: #F5F5F5;
    font-family: 'Inter', system-ui, sans-serif;
    color: #424242;
    box-sizing: border-box;
  }

  /* ── Top bar — Forest Green strip ── */
  .ptc-topbar {
    width: 100%;
    background: #1B5E20;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 3px solid #228B22;
    box-sizing: border-box;
  }
  .ptc-topbar-icon {
    background: #228B22;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ptc-topbar-title {
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .ptc-topbar-sub {
    font-size: 13px;
    color: #A5D6A7;
    margin: 0;
    font-weight: 500;
  }

  /* ── Body area ── */
  .ptc-body {
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section wrapper ── */
  .ptc-section {
    width: 100%;
    background: #FFFFFF;
    border-bottom: 1px solid #8D6E63;
    box-sizing: border-box;
  }

  /* ── Section inner content ── */
  .ptc-section-inner {
    padding: 28px;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section label strip ── */
  .ptc-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 28px;
    background: #228B22;
    border-bottom: 1px solid #1B5E20;
    border-top: 1px solid #1B5E20;
  }
  .ptc-section-label span {
    font-size: 12px;
    font-weight: 800;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* ── Form grid ── */
  .ptc-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 900px) {
    .ptc-form-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .ptc-form-grid { grid-template-columns: 1fr; }
    .ptc-topbar { padding: 14px 16px; }
    .ptc-section-inner { padding: 20px 16px; }
    .ptc-section-label { padding: 10px 16px; }
  }

  /* ── Field ── */
  .ptc-field label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ptc-field-wrap {
    display: flex;
    align-items: center;
    border: 2px solid #228B22;
    background: #FFFFFF;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ptc-field-wrap:focus-within {
    border-color: #1B5E20;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .ptc-field-icon {
    padding: 0 10px;
    display: flex;
    align-items: center;
    background: #F5F5F5;
    border-right: 2px solid #228B22;
    height: 100%;
    align-self: stretch;
    justify-content: center;
    min-width: 40px;
  }
  .ptc-field input {
    flex: 1;
    border: none;
    outline: none;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 500;
    color: #424242;
    background: #FFFFFF;
    font-family: 'Inter', sans-serif;
    width: 100%;
    box-sizing: border-box;
  }
  .ptc-field input::placeholder { color: #A5D6A7; font-weight: 400; }

  /* ── Save button row ── */
  .ptc-save-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .ptc-btn-save {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #2E8B57;
    color: #FFFFFF;
    border: none;
    padding: 12px 28px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.04em;
    transition: background 0.15s, transform 0.15s;
    border-left: 4px solid #1B5E20;
  }
  .ptc-btn-save:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
  }
  .ptc-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Inline status badge ── */
  .ptc-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 700;
    animation: scSlide 0.25s ease;
    border-left: 4px solid;
  }
  .ptc-status.success {
    background: #f0fdf4;
    color: #166534;
    border-left-color: #4CAF50;
  }
  .ptc-status.error {
    background: #fef2f2;
    color: #991b1b;
    border-left-color: #F44336;
  }
  @keyframes scSlide {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Inbox table ── */
  .ptc-table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  .ptc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .ptc-table thead tr {
    background: #1B5E20;
  }
  .ptc-table thead th {
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 12px 16px;
    text-align: left;
    border-right: 1px solid #228B22;
  }
  .ptc-table thead th:last-child { border-right: none; }
  .ptc-table tbody tr {
    border-bottom: 1px solid #E8F5E9;
    transition: background 0.15s;
  }
  .ptc-table tbody tr:hover { background: #F1F8E9; }
  .ptc-table tbody tr:nth-child(even) { background: #FAFFF9; }
  .ptc-table tbody tr:nth-child(even):hover { background: #F1F8E9; }
  .ptc-table td {
    padding: 13px 16px;
    color: #424242;
    vertical-align: top;
    border-right: 1px solid #E8F5E9;
  }
  .ptc-table td:last-child { border-right: none; }

  /* ── Name cell ── */
  .ptc-sender-name {
    font-weight: 700;
    color: #1B5E20;
    font-size: 14px;
  }
  .ptc-sender-email {
    font-size: 12px;
    color: #2E8B57;
    text-decoration: none;
    display: block;
    margin-top: 2px;
  }
  .ptc-sender-email:hover { color: #1B5E20; text-decoration: underline; }
  .ptc-sender-phone {
    font-size: 12px;
    color: #6B8E23;
    display: block;
    margin-top: 2px;
  }

  /* ── Message cell ── */
  .ptc-msg-text {
    color: #424242;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  /* ── Time cell ── */
  .ptc-time {
    font-size: 12px;
    color: #8D6E63;
    white-space: nowrap;
  }

  /* ── Unread badge ── */
  .ptc-unread-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #8BC34A;
    margin-right: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }

  /* ── Empty / loading states ── */
  .ptc-empty {
    text-align: center;
    padding: 60px 20px;
    color: #8D6E63;
    background: #FAFFF9;
    border-top: 1px solid #E8F5E9;
  }
  .ptc-empty-icon {
    margin-bottom: 12px;
    opacity: 0.4;
  }
  .ptc-empty p { margin: 4px 0; }
  .ptc-empty .ptc-empty-title { font-weight: 700; font-size: 16px; color: #424242; }
  .ptc-empty .ptc-empty-sub { font-size: 13px; }

  /* ── Stats bar ── */
  .ptc-stats-bar {
    display: flex;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid #E8F5E9;
    background: #FAFFF9;
  }
  .ptc-stat-cell {
    flex: 1;
    padding: 14px 20px;
    border-right: 1px solid #E8F5E9;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ptc-stat-cell:last-child { border-right: none; }
  .ptc-stat-num {
    font-size: 22px;
    font-weight: 800;
    color: #228B22;
    line-height: 1;
  }
  .ptc-stat-lbl {
    font-size: 11px;
    font-weight: 600;
    color: #8D6E63;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ptc-stat-icon {
    background: #E8F5E9;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .ptc-stats-bar { flex-wrap: wrap; }
    .ptc-stat-cell { min-width: 50%; border-bottom: 1px solid #E8F5E9; }
    .ptc-table { font-size: 12px; }
    .ptc-table td, .ptc-table thead th { padding: 10px 10px; }
  }
`;

const PrintingContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/printing-settings');
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
        const res = await api.get('/printing-settings/messages');
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
      await api.put('/printing-settings', {
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
    <div className="ptc-root">
      <style>{STYLES}</style>

      {/* ── Top Bar ── */}
      <div className="ptc-topbar">
        <div className="ptc-topbar-icon">
          <PhoneCall size={20} color="#FFFFFF" />
        </div>
        <div>
          <p className="ptc-topbar-title">Printing Contact Settings</p>
          <p className="ptc-topbar-sub">Manage public contact info &amp; customer messages</p>
        </div>
      </div>

      <div className="ptc-body">

        {/* ════════════════════════════════════════
            SECTION 1 — Contact Settings Form
        ════════════════════════════════════════ */}
        <div className="ptc-section">
          <div className="ptc-section-label">
            <PhoneCall size={14} color="#FFFFFF" />
            <span>Public Contact Information</span>
          </div>
          <div className="ptc-section-inner">
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B8E23', fontWeight: 500, lineHeight: 1.6 }}>
              These details appear in the <strong style={{ color: '#228B22' }}>"Printing Team"</strong> contact popup on the public Printing &amp; Health page.
              Keep them up to date so customers can reach the Printing team directly.
            </p>

            <div className="ptc-form-grid">

              {/* Phone 1 */}
              <div className="ptc-field">
                <label htmlFor="ptc-phone1">Primary Phone</label>
                <div className="ptc-field-wrap">
                  <div className="ptc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="ptc-phone1"
                    type="text"
                    name="phone1"
                    value={settings.phone1}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Phone 2 */}
              <div className="ptc-field">
                <label htmlFor="ptc-phone2">Secondary Phone</label>
                <div className="ptc-field-wrap">
                  <div className="ptc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="ptc-phone2"
                    type="text"
                    name="phone2"
                    value={settings.phone2}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="ptc-field">
                <label htmlFor="ptc-email">Printing Email Address</label>
                <div className="ptc-field-wrap">
                  <div className="ptc-field-icon">
                    <Mail size={15} color="#228B22" />
                  </div>
                  <input
                    id="ptc-email"
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="printing@sutana.com"
                  />
                </div>
              </div>

            </div>

            {/* Save Row */}
            <div className="ptc-save-row">
              <button
                className="ptc-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>

              {saveStatus.text && (
                <div className={`ptc-status ${saveStatus.type}`}>
                  {saveStatus.type === 'success'
                    ? <CheckCircle size={15} />
                    : <XCircle size={15} />}
                  {saveStatus.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 2 — Stats Bar
        ════════════════════════════════════════ */}
        <div className="ptc-stats-bar">
          <div className="ptc-stat-cell">
            <div className="ptc-stat-icon"><Inbox size={16} color="#228B22" /></div>
            <div>
              <div className="ptc-stat-num">{total}</div>
              <div className="ptc-stat-lbl">Total Messages</div>
            </div>
          </div>
          <div className="ptc-stat-cell">
            <div className="ptc-stat-icon"><MessageCircle size={16} color="#8BC34A" /></div>
            <div>
              <div className="ptc-stat-num" style={{ color: unread > 0 ? '#8BC34A' : '#228B22' }}>{unread}</div>
              <div className="ptc-stat-lbl">Unread</div>
            </div>
          </div>
          <div className="ptc-stat-cell">
            <div className="ptc-stat-icon"><Clock size={16} color="#6B8E23" /></div>
            <div>
              <div className="ptc-stat-num">{today}</div>
              <div className="ptc-stat-lbl">Today</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 3 — Inbox Table
        ════════════════════════════════════════ */}
        <div className="ptc-section">
          <div className="ptc-section-label">
            <MessageCircle size={14} color="#FFFFFF" />
            <span>Customer Inquiry Inbox</span>
            {unread > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#8BC34A',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                letterSpacing: '0.06em'
              }}>
                {unread} UNREAD
              </span>
            )}
          </div>

          {loadingMessages ? (
            <div className="ptc-empty">
              <div className="ptc-empty-icon"><MessageCircle size={40} color="#A5D6A7" /></div>
              <p className="ptc-empty-title">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="ptc-empty">
              <div className="ptc-empty-icon"><Inbox size={48} color="#A5D6A7" /></div>
              <p className="ptc-empty-title">No messages yet</p>
              <p className="ptc-empty-sub">Customer inquiries from the public Printing Team contact form will appear here.</p>
            </div>
          ) : (
            <div className="ptc-table-wrap">
              <table className="ptc-table">
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
                    <tr key={msg.id}>
                      {/* Sender */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {!msg.is_read && <span className="ptc-unread-dot" title="Unread" />}
                          <div>
                            <div className="ptc-sender-name">{msg.sender_name}</div>
                            <a href={`mailto:${msg.sender_email}`} className="ptc-sender-email">
                              {msg.sender_email}
                            </a>
                          </div>
                        </div>
                      </td>
                      {/* Message */}
                      <td>
                        <p className="ptc-msg-text">{msg.message}</p>
                      </td>
                      {/* Phone */}
                      <td>
                        <span className="ptc-sender-phone">
                          {msg.sender_phone || <span style={{ color: '#A5D6A7', fontStyle: 'italic' }}>—</span>}
                        </span>
                      </td>
                      {/* Time */}
                      <td>
                        <span className="ptc-time">
                          {new Date(msg.created_at).toLocaleDateString()}<br />
                          <span style={{ color: '#A5D6A7' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
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

export default PrintingContact;

