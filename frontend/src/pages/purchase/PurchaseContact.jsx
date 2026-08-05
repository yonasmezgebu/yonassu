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

  .sc-root {
    width: 100%;
    min-height: 100%;
    background: #F5F5F5;
    font-family: 'Inter', system-ui, sans-serif;
    color: #424242;
    box-sizing: border-box;
  }

  /* ── Top bar — Forest Green strip ── */
  .sc-topbar {
    width: 100%;
    background: #1B5E20;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 3px solid #228B22;
    box-sizing: border-box;
  }
  .sc-topbar-icon {
    background: #228B22;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sc-topbar-title {
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .sc-topbar-sub {
    font-size: 13px;
    color: #A5D6A7;
    margin: 0;
    font-weight: 500;
  }

  /* ── Body area ── */
  .sc-body {
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section wrapper ── */
  .sc-section {
    width: 100%;
    background: #FFFFFF;
    border-bottom: 1px solid #8D6E63;
    box-sizing: border-box;
  }

  /* ── Section inner content ── */
  .sc-section-inner {
    padding: 28px;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section label strip ── */
  .sc-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 28px;
    background: #228B22;
    border-bottom: 1px solid #1B5E20;
    border-top: 1px solid #1B5E20;
  }
  .sc-section-label span {
    font-size: 12px;
    font-weight: 800;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* ── Form grid ── */
  .sc-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 900px) {
    .sc-form-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .sc-form-grid { grid-template-columns: 1fr; }
    .sc-topbar { padding: 14px 16px; }
    .sc-section-inner { padding: 20px 16px; }
    .sc-section-label { padding: 10px 16px; }
  }

  /* ── Field ── */
  .sc-field label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sc-field-wrap {
    display: flex;
    align-items: center;
    border: 2px solid #228B22;
    background: #FFFFFF;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sc-field-wrap:focus-within {
    border-color: #1B5E20;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .sc-field-icon {
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
  .sc-field input {
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
  .sc-field input::placeholder { color: #A5D6A7; font-weight: 400; }

  /* ── Save button row ── */
  .sc-save-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .sc-btn-save {
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
  .sc-btn-save:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
  }
  .sc-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Inline status badge ── */
  .sc-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 700;
    animation: scSlide 0.25s ease;
    border-left: 4px solid;
  }
  .sc-status.success {
    background: #f0fdf4;
    color: #166534;
    border-left-color: #4CAF50;
  }
  .sc-status.error {
    background: #fef2f2;
    color: #991b1b;
    border-left-color: #F44336;
  }
  @keyframes scSlide {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Inbox table ── */
  .sc-table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  .sc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .sc-table thead tr {
    background: #1B5E20;
  }
  .sc-table thead th {
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 12px 16px;
    text-align: left;
    border-right: 1px solid #228B22;
  }
  .sc-table thead th:last-child { border-right: none; }
  .sc-table tbody tr {
    border-bottom: 1px solid #E8F5E9;
    transition: background 0.15s;
  }
  .sc-table tbody tr:hover { background: #F1F8E9; }
  .sc-table tbody tr:nth-child(even) { background: #FAFFF9; }
  .sc-table tbody tr:nth-child(even):hover { background: #F1F8E9; }
  .sc-table td {
    padding: 13px 16px;
    color: #424242;
    vertical-align: top;
    border-right: 1px solid #E8F5E9;
  }
  .sc-table td:last-child { border-right: none; }

  /* ── Name cell ── */
  .sc-sender-name {
    font-weight: 700;
    color: #1B5E20;
    font-size: 14px;
  }
  .sc-sender-email {
    font-size: 12px;
    color: #2E8B57;
    text-decoration: none;
    display: block;
    margin-top: 2px;
  }
  .sc-sender-email:hover { color: #1B5E20; text-decoration: underline; }
  .sc-sender-phone {
    font-size: 12px;
    color: #6B8E23;
    display: block;
    margin-top: 2px;
  }

  /* ── Message cell ── */
  .sc-msg-text {
    color: #424242;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  /* ── Time cell ── */
  .sc-time {
    font-size: 12px;
    color: #8D6E63;
    white-space: nowrap;
  }

  /* ── Unread badge ── */
  .sc-unread-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #8BC34A;
    margin-right: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }

  /* ── Empty / loading states ── */
  .sc-empty {
    text-align: center;
    padding: 60px 20px;
    color: #8D6E63;
    background: #FAFFF9;
    border-top: 1px solid #E8F5E9;
  }
  .sc-empty-icon {
    margin-bottom: 12px;
    opacity: 0.4;
  }
  .sc-empty p { margin: 4px 0; }
  .sc-empty .sc-empty-title { font-weight: 700; font-size: 16px; color: #424242; }
  .sc-empty .sc-empty-sub { font-size: 13px; }

  /* ── Stats bar ── */
  .sc-stats-bar {
    display: flex;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid #E8F5E9;
    background: #FAFFF9;
  }
  .sc-stat-cell {
    flex: 1;
    padding: 14px 20px;
    border-right: 1px solid #E8F5E9;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sc-stat-cell:last-child { border-right: none; }
  .sc-stat-num {
    font-size: 22px;
    font-weight: 800;
    color: #228B22;
    line-height: 1;
  }
  .sc-stat-lbl {
    font-size: 11px;
    font-weight: 600;
    color: #8D6E63;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sc-stat-icon {
    background: #E8F5E9;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .sc-stats-bar { flex-wrap: wrap; }
    .sc-stat-cell { min-width: 50%; border-bottom: 1px solid #E8F5E9; }
    .sc-table { font-size: 12px; }
    .sc-table td, .sc-table thead th { padding: 10px 10px; }
  }
`;

const PurchaseContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/procurement-settings');
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
        const res = await api.get('/procurement-settings/messages');
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
      await api.put('/procurement-settings', {
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
    <div className="sc-root">
      <style>{STYLES}</style>

      {/* ── Top Bar ── */}
      <div className="sc-topbar">
        <div className="sc-topbar-icon">
          <PhoneCall size={20} color="#FFFFFF" />
        </div>
        <div>
          <p className="sc-topbar-title">Procurement Contact Settings</p>
          <p className="sc-topbar-sub">Manage public contact info &amp; supplier messages</p>
        </div>
      </div>

      <div className="sc-body">

        {/* ════════════════════════════════════════
            SECTION 1 — Contact Settings Form
        ════════════════════════════════════════ */}
        <div className="sc-section">
          <div className="sc-section-label">
            <PhoneCall size={14} color="#FFFFFF" />
            <span>Public Contact Information</span>
          </div>
          <div className="sc-section-inner">
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B8E23', fontWeight: 500, lineHeight: 1.6 }}>
              These details appear in the <strong style={{ color: '#228B22' }}>"Procurement Team"</strong> contact popup on the public tender buy page.
              Keep them up to date so suppliers can reach the right team.
            </p>

            <div className="sc-form-grid">

              {/* Phone 1 */}
              <div className="sc-field">
                <label htmlFor="sc-phone1">Primary Phone</label>
                <div className="sc-field-wrap">
                  <div className="sc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="sc-phone1"
                    type="text"
                    name="phone1"
                    value={settings.phone1}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Phone 2 */}
              <div className="sc-field">
                <label htmlFor="sc-phone2">Secondary Phone</label>
                <div className="sc-field-wrap">
                  <div className="sc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="sc-phone2"
                    type="text"
                    name="phone2"
                    value={settings.phone2}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sc-field">
                <label htmlFor="sc-email">Procurement Email Address</label>
                <div className="sc-field-wrap">
                  <div className="sc-field-icon">
                    <Mail size={15} color="#228B22" />
                  </div>
                  <input
                    id="sc-email"
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="procurement@sutana.com"
                  />
                </div>
              </div>

            </div>

            {/* Save Row */}
            <div className="sc-save-row">
              <button
                className="sc-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>

              {saveStatus.text && (
                <div className={`sc-status ${saveStatus.type}`}>
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
        <div className="sc-stats-bar">
          <div className="sc-stat-cell">
            <div className="sc-stat-icon"><Inbox size={16} color="#228B22" /></div>
            <div>
              <div className="sc-stat-num">{total}</div>
              <div className="sc-stat-lbl">Total Messages</div>
            </div>
          </div>
          <div className="sc-stat-cell">
            <div className="sc-stat-icon"><MessageCircle size={16} color="#8BC34A" /></div>
            <div>
              <div className="sc-stat-num" style={{ color: unread > 0 ? '#8BC34A' : '#228B22' }}>{unread}</div>
              <div className="sc-stat-lbl">Unread</div>
            </div>
          </div>
          <div className="sc-stat-cell">
            <div className="sc-stat-icon"><Clock size={16} color="#6B8E23" /></div>
            <div>
              <div className="sc-stat-num">{today}</div>
              <div className="sc-stat-lbl">Today</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 3 — Inbox Table
        ════════════════════════════════════════ */}
        <div className="sc-section">
          <div className="sc-section-label">
            <MessageCircle size={14} color="#FFFFFF" />
            <span>Supplier Inquiry Inbox</span>
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
            <div className="sc-empty">
              <div className="sc-empty-icon"><MessageCircle size={40} color="#A5D6A7" /></div>
              <p className="sc-empty-title">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="sc-empty">
              <div className="sc-empty-icon"><Inbox size={48} color="#A5D6A7" /></div>
              <p className="sc-empty-title">No messages yet</p>
              <p className="sc-empty-sub">Supplier inquiries from the public Procurement contact form will appear here.</p>
            </div>
          ) : (
            <div className="sc-table-wrap">
              <table className="sc-table">
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
                          {!msg.is_read && <span className="sc-unread-dot" title="Unread" />}
                          <div>
                            <div className="sc-sender-name">{msg.sender_name}</div>
                            <a href={`mailto:${msg.sender_email}`} className="sc-sender-email">
                              {msg.sender_email}
                            </a>
                          </div>
                        </div>
                      </td>
                      {/* Message */}
                      <td>
                        <p className="sc-msg-text">{msg.message}</p>
                      </td>
                      {/* Phone */}
                      <td>
                        <span className="sc-sender-phone">
                          {msg.sender_phone || <span style={{ color: '#A5D6A7', fontStyle: 'italic' }}>—</span>}
                        </span>
                      </td>
                      {/* Time */}
                      <td>
                        <span className="sc-time">
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

export default PurchaseContact;
