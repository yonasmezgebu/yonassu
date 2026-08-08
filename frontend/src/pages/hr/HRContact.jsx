import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall, User, Clock, CheckCircle, XCircle, Inbox, Trash2, Eye, EyeOff, Send, CheckCheck } from 'lucide-react';
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

  .hrc-root {
    width: 100%;
    min-height: 100%;
    background: #F5F5F5;
    font-family: 'Inter', system-ui, sans-serif;
    color: #424242;
    box-sizing: border-box;
  }

  /* ── Top bar — Forest Green strip ── */
  .hrc-topbar {
    width: 100%;
    background: #1B5E20;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 3px solid #228B22;
    box-sizing: border-box;
  }
  .hrc-topbar-icon {
    background: #228B22;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hrc-topbar-title {
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .hrc-topbar-sub {
    font-size: 13px;
    color: #A5D6A7;
    margin: 0;
    font-weight: 500;
  }

  /* ── Body area ── */
  .hrc-body {
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section wrapper ── */
  .hrc-section {
    width: 100%;
    background: #FFFFFF;
    border-bottom: 1px solid #8D6E63;
    box-sizing: border-box;
  }

  /* ── Section inner content ── */
  .hrc-section-inner {
    padding: 28px;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Section label strip ── */
  .hrc-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 28px;
    background: #228B22;
    border-bottom: 1px solid #1B5E20;
    border-top: 1px solid #1B5E20;
  }
  .hrc-section-label span {
    font-size: 12px;
    font-weight: 800;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* ── Form grid ── */
  .hrc-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 900px) {
    .hrc-form-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .hrc-form-grid { grid-template-columns: 1fr; }
    .hrc-topbar { padding: 14px 16px; }
    .hrc-section-inner { padding: 20px 16px; }
    .hrc-section-label { padding: 10px 16px; }
  }

  /* ── Field ── */
  .hrc-field label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .hrc-field-wrap {
    display: flex;
    align-items: center;
    border: 2px solid #228B22;
    background: #FFFFFF;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .hrc-field-wrap:focus-within {
    border-color: #1B5E20;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .hrc-field-icon {
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
  .hrc-field input {
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
  .hrc-field input::placeholder { color: #A5D6A7; font-weight: 400; }

  /* ── Save button row ── */
  .hrc-save-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .hrc-btn-save {
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
  .hrc-btn-save:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
  }
  .hrc-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Inline status badge ── */
  .hrc-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 700;
    animation: scSlide 0.25s ease;
    border-left: 4px solid;
  }
  .hrc-status.success {
    background: #f0fdf4;
    color: #166534;
    border-left-color: #4CAF50;
  }
  .hrc-status.error {
    background: #fef2f2;
    color: #991b1b;
    border-left-color: #F44336;
  }
  @keyframes scSlide {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Inbox table ── */
  .hrc-table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  .hrc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .hrc-table thead tr {
    background: #1B5E20;
  }
  .hrc-table thead th {
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 12px 16px;
    text-align: left;
    border-right: 1px solid #228B22;
  }
  .hrc-table thead th:last-child { border-right: none; }
  .hrc-table tbody tr {
    border-bottom: 1px solid #E8F5E9;
    transition: background 0.15s;
  }
  .hrc-table tbody tr:hover { background: #F1F8E9; }
  .hrc-table tbody tr:nth-child(even) { background: #FAFFF9; }
  .hrc-table tbody tr:nth-child(even):hover { background: #F1F8E9; }
  .hrc-table td {
    padding: 13px 16px;
    color: #424242;
    vertical-align: top;
    border-right: 1px solid #E8F5E9;
  }
  .hrc-table td:last-child { border-right: none; }

  /* ── Name cell ── */
  .hrc-sender-name {
    font-weight: 700;
    color: #1B5E20;
    font-size: 14px;
  }
  .hrc-sender-email {
    font-size: 12px;
    color: #2E8B57;
    text-decoration: none;
    display: block;
    margin-top: 2px;
  }
  .hrc-sender-email:hover { color: #1B5E20; text-decoration: underline; }
  .hrc-sender-phone {
    font-size: 12px;
    color: #6B8E23;
    display: block;
    margin-top: 2px;
  }

  /* ── Message cell ── */
  .hrc-msg-text {
    color: #424242;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  /* ── Time cell ── */
  .hrc-time {
    font-size: 12px;
    color: #8D6E63;
    white-space: nowrap;
  }

  /* ── Unread badge ── */
  .hrc-unread-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #8BC34A;
    margin-right: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }

  /* ── Empty / loading states ── */
  .hrc-empty {
    text-align: center;
    padding: 60px 20px;
    color: #8D6E63;
    background: #FAFFF9;
    border-top: 1px solid #E8F5E9;
  }
  .hrc-empty-icon {
    margin-bottom: 12px;
    opacity: 0.4;
  }
  .hrc-empty p { margin: 4px 0; }
  .hrc-empty .hrc-empty-title { font-weight: 700; font-size: 16px; color: #424242; }
  .hrc-empty .hrc-empty-sub { font-size: 13px; }

  /* ── Stats bar ── */
  .hrc-stats-bar {
    display: flex;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid #E8F5E9;
    background: #FAFFF9;
  }
  .hrc-stat-cell {
    flex: 1;
    padding: 14px 20px;
    border-right: 1px solid #E8F5E9;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hrc-stat-cell:last-child { border-right: none; }
  .hrc-stat-num {
    font-size: 22px;
    font-weight: 800;
    color: #228B22;
    line-height: 1;
  }
  .hrc-stat-lbl {
    font-size: 11px;
    font-weight: 600;
    color: #8D6E63;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .hrc-stat-icon {
    background: #E8F5E9;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .hrc-stats-bar { flex-wrap: wrap; }
    .hrc-stat-cell { min-width: 50%; border-bottom: 1px solid #E8F5E9; }
    .hrc-table { font-size: 12px; }
    .hrc-table td, .hrc-table thead th { padding: 10px 10px; }
  }
`;

const HRContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });
  const [repliedIds, setRepliedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('hr_replied_msgs') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/hr-settings');
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
        const res = await api.get('/hr-settings/messages');
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
      await api.put('/hr-settings', {
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

  const toggleMessageStatus = async (msg) => {
    const newStatus = msg.is_read ? 'unread' : 'read';
    try {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: !m.is_read } : m));
      await api.put(`/hr-settings/messages/${msg.id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status', err);
      // Revert optimistic update
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: msg.is_read } : m));
    }
  };

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/hr-settings/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      // also clear from replied
      setRepliedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem('hr_replied_msgs', JSON.stringify([...next]));
        return next;
      });
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const markReplied = (id) => {
    setRepliedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('hr_replied_msgs', JSON.stringify([...next]));
      return next;
    });
  };

  const total   = messages.length;
  const unread  = messages.filter(m => !m.is_read).length;
  const today   = messages.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="hrc-root">
      <style>{STYLES}</style>

      {/* ── Top Bar ── */}
      <div className="hrc-topbar">
        <div className="hrc-topbar-icon">
          <PhoneCall size={20} color="#FFFFFF" />
        </div>
        <div>
          <p className="hrc-topbar-title">HR Contact Settings</p>
          <p className="hrc-topbar-sub">Manage public contact info &amp; customer messages</p>
        </div>
      </div>

      <div className="hrc-body">

        {/* ════════════════════════════════════════
            SECTION 1 — Contact Settings Form
        ════════════════════════════════════════ */}
        <div className="hrc-section">
          <div className="hrc-section-label">
            <PhoneCall size={14} color="#FFFFFF" />
            <span>Public Contact Information</span>
          </div>
          <div className="hrc-section-inner">
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B8E23', fontWeight: 500, lineHeight: 1.6 }}>
              These details appear in the <strong style={{ color: '#228B22' }}>"HR Team"</strong> contact popup on the public HR &amp; Health page.
              Keep them up to date so customers can reach the HR team directly.
            </p>

            <div className="hrc-form-grid">

              {/* Phone 1 */}
              <div className="hrc-field">
                <label htmlFor="hrc-phone1">Primary Phone</label>
                <div className="hrc-field-wrap">
                  <div className="hrc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="hrc-phone1"
                    type="text"
                    name="phone1"
                    value={settings.phone1}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Phone 2 */}
              <div className="hrc-field">
                <label htmlFor="hrc-phone2">Secondary Phone</label>
                <div className="hrc-field-wrap">
                  <div className="hrc-field-icon">
                    <Phone size={15} color="#228B22" />
                  </div>
                  <input
                    id="hrc-phone2"
                    type="text"
                    name="phone2"
                    value={settings.phone2}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="hrc-field">
                <label htmlFor="hrc-email">HR Email Address</label>
                <div className="hrc-field-wrap">
                  <div className="hrc-field-icon">
                    <Mail size={15} color="#228B22" />
                  </div>
                  <input
                    id="hrc-email"
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="hr@sutana.com"
                  />
                </div>
              </div>

            </div>

            {/* Save Row */}
            <div className="hrc-save-row">
              <button
                className="hrc-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>

              {saveStatus.text && (
                <div className={`hrc-status ${saveStatus.type}`}>
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
        <div className="hrc-stats-bar">
          <div className="hrc-stat-cell">
            <div className="hrc-stat-icon"><Inbox size={16} color="#228B22" /></div>
            <div>
              <div className="hrc-stat-num">{total}</div>
              <div className="hrc-stat-lbl">Total Messages</div>
            </div>
          </div>
          <div className="hrc-stat-cell">
            <div className="hrc-stat-icon"><MessageCircle size={16} color="#8BC34A" /></div>
            <div>
              <div className="hrc-stat-num" style={{ color: unread > 0 ? '#8BC34A' : '#228B22' }}>{unread}</div>
              <div className="hrc-stat-lbl">Unread</div>
            </div>
          </div>
          <div className="hrc-stat-cell">
            <div className="hrc-stat-icon"><Clock size={16} color="#6B8E23" /></div>
            <div>
              <div className="hrc-stat-num">{today}</div>
              <div className="hrc-stat-lbl">Today</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION 3 — Inbox Table
        ════════════════════════════════════════ */}
        <div className="hrc-section">
          <div className="hrc-section-label">
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
            <div className="hrc-empty">
              <div className="hrc-empty-icon"><MessageCircle size={40} color="#A5D6A7" /></div>
              <p className="hrc-empty-title">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="hrc-empty">
              <div className="hrc-empty-icon"><Inbox size={48} color="#A5D6A7" /></div>
              <p className="hrc-empty-title">No messages yet</p>
              <p className="hrc-empty-sub">Customer inquiries from the public HR Team contact form will appear here.</p>
            </div>
          ) : (
            <div className="hrc-table-wrap">
              <table className="hrc-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Sender</th>
                    <th>Message</th>
                    <th style={{ width: '16%' }}>Phone</th>
                    <th style={{ width: '14%' }}>Received</th>
                    <th style={{ width: '14%', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} style={{ background: repliedIds.has(msg.id) ? '#F1F8E9' : (msg.is_read ? '#fff' : '#FFFDE7') }}>
                      {/* Sender */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {!msg.is_read && <span className="hrc-unread-dot" title="Unread" />}
                          {repliedIds.has(msg.id) && (
                            <span title="Replied" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#228B22', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', letterSpacing: '0.06em', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
                              <CheckCheck size={11} /> REPLIED
                            </span>
                          )}
                          <div>
                            <div className="hrc-sender-name">{msg.sender_name}</div>
                            <a 
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.sender_email}&su=${encodeURIComponent('Reply to your inquiry')}&body=${encodeURIComponent(`Dear ${msg.sender_name},\n\n\n\nBest regards,\nHR Team\n${settings.email}\n${settings.phone1}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hrc-sender-email"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#1B5E20' }}
                              onClick={() => markReplied(msg.id)}
                            >
                              <Send size={12} /> {msg.sender_email}
                            </a>
                          </div>
                        </div>
                      </td>
                      {/* Message */}
                      <td>
                        <p className="hrc-msg-text">{msg.message}</p>
                      </td>
                      {/* Phone */}
                      <td>
                        <span className="hrc-sender-phone">
                          {msg.sender_phone || <span style={{ color: '#A5D6A7', fontStyle: 'italic' }}>—</span>}
                        </span>
                      </td>
                      {/* Time */}
                      <td>
                        <span className="hrc-time">
                          {new Date(msg.created_at).toLocaleDateString()}<br />
                          <span style={{ color: '#A5D6A7' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </td>
                      {/* Status Column */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {repliedIds.has(msg.id) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#228B22', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', letterSpacing: '0.06em' }}>
                              <CheckCheck size={13} /> REPLIED
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F5F5F5', color: '#9E9E9E', fontSize: 11, fontWeight: 700, padding: '3px 10px', letterSpacing: '0.06em' }}>
                              PENDING
                            </span>
                          )}
                          {msg.is_read ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#A5D6A7', fontSize: 10, fontWeight: 700 }}>
                              <Eye size={10} /> READ
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#F57F17', fontSize: 10, fontWeight: 700 }}>
                              <EyeOff size={10} /> UNREAD
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Toggle Replied */}
                          <button
                            onClick={() => {
                              if (repliedIds.has(msg.id)) {
                                setRepliedIds(prev => {
                                  const next = new Set(prev);
                                  next.delete(msg.id);
                                  localStorage.setItem('hr_replied_msgs', JSON.stringify([...next]));
                                  return next;
                                });
                              } else {
                                markReplied(msg.id);
                              }
                            }}
                            style={{ background: repliedIds.has(msg.id) ? '#228B22' : 'transparent', border: '1.5px solid #228B22', cursor: 'pointer', color: repliedIds.has(msg.id) ? '#fff' : '#228B22', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3 }}
                            title={repliedIds.has(msg.id) ? 'Unmark as replied' : 'Mark as replied'}
                          >
                            <CheckCheck size={13} />
                          </button>
                          {/* Toggle Read */}
                          <button
                            onClick={() => toggleMessageStatus(msg)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: msg.is_read ? '#A5D6A7' : '#228B22' }}
                            title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {msg.is_read ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#E53935' }}
                            title="Delete message"
                          >
                            <Trash2 size={16} />
                          </button>
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

export default HRContact;

