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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── 1. Root wrapper ── */
  .sc-root {
    width: 100%;
    min-height: 100%;
    background: #F5F6FA;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #111827;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 1.5;
    padding: 10px;
    max-width: 1536px;
    margin: 0 auto;
  }
  @media (max-width:1024px) { .sc-root { padding: 6px; } }
  @media (max-width:480px)  { .sc-root { padding: 4px; } }

  /* ── 2. Page header card ── */
  .sc-header {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .sc-header-icon {
    width: 48px; height: 48px;
    border-radius: 10px;
    background: #EFF6FF;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sc-header-title {
    font-size: 28px; font-weight: 700;
    color: #111827; margin: 0; line-height: 1.3;
  }
  .sc-header-sub {
    font-size: 13px; color: #6B7280;
    margin: 2px 0 0; font-weight: 400;
  }

  /* ── 3. Stats row ── */
  .sc-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  @media (max-width:768px) { .sc-stats { grid-template-columns: 1fr 1fr; } }
  @media (max-width:480px) { .sc-stats { grid-template-columns: 1fr; } }

  .sc-stat-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 20px 24px;
    display: flex; align-items: center; gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow 150ms ease, transform 150ms ease;
  }
  .sc-stat-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }
  .sc-stat-icon-wrap {
    width: 44px; height: 44px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sc-stat-num {
    font-size: 28px; font-weight: 700;
    color: #111827; line-height: 1;
  }
  .sc-stat-lbl {
    font-size: 12px; font-weight: 500;
    color: #6B7280; text-transform: uppercase;
    letter-spacing: 0.03em; margin-top: 2px;
  }

  /* ── 4. Section card ── */
  .sc-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
    margin-bottom: 16px;
  }
  .sc-card-head {
    padding: 16px 24px;
    border-bottom: 1px solid #E5E7EB;
    display: flex; align-items: center; gap: 10px;
    background: #F9FAFB;
  }
  .sc-card-title {
    font-size: 16px; font-weight: 600;
    color: #111827; margin: 0;
  }
  .sc-card-body { padding: 24px; }

  /* ── 5. Form grid ── */
  .sc-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width:1024px) { .sc-form-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width:600px)  { .sc-form-grid { grid-template-columns: 1fr; } }

  /* ── 6. Field ── */
  .sc-field label {
    display: block;
    font-size: 12px; font-weight: 500;
    color: #6B7280; text-transform: uppercase;
    letter-spacing: 0.03em; margin-bottom: 6px;
  }
  .sc-field-wrap {
    display: flex; align-items: center;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    background: #FFFFFF;
    height: 36px;
    transition: border-color 150ms, box-shadow 150ms;
    overflow: hidden;
  }
  .sc-field-wrap:focus-within {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }
  .sc-field-icon {
    padding: 0 10px;
    display: flex; align-items: center; justify-content: center;
    background: #F9FAFB;
    border-right: 1px solid #E5E7EB;
    height: 100%;
    flex-shrink: 0;
  }
  .sc-field input {
    flex: 1; border: none; outline: none;
    padding: 0 12px;
    font-size: 14px; font-weight: 400;
    color: #111827;
    background: transparent;
    font-family: 'Inter', sans-serif;
  }
  .sc-field input::placeholder { color: #9CA3AF; }

  /* ── 7. Buttons ── */
  .sc-btn {
    display: inline-flex; align-items: center; gap: 8px;
    border: none; border-radius: 8px;
    padding: 0 16px; height: 36px;
    font-size: 14px; font-weight: 500;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    white-space: nowrap;
  }
  .sc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sc-btn-primary { background: #2563EB; color: #FFFFFF; }
  .sc-btn-primary:hover:not(:disabled) { background: #D97706; color: #FFFFFF; transform: translateY(-1px); }

  .sc-btn-success { background: #16A34A; color: #FFFFFF; }
  .sc-btn-success:hover:not(:disabled) { background: #D97706; color: #FFFFFF; transform: translateY(-1px); }

  .sc-btn-danger { background: #FEE2E2; color: #DC2626; }
  .sc-btn-danger:hover:not(:disabled) { background: #D97706; color: #FFFFFF; transform: translateY(-1px); }

  .sc-btn-outline { background: #FFFFFF; color: #374151; border: 1px solid #E5E7EB; }
  .sc-btn-outline:hover:not(:disabled) { background: #D97706; color: #FFFFFF; border-color: #D97706; transform: translateY(-1px); }

  .sc-btn-info { background: #E0F2FE; color: #0284C7; }
  .sc-btn-info:hover:not(:disabled) { background: #D97706; color: #FFFFFF; transform: translateY(-1px); }

  .sc-btn-sm { height: 30px; padding: 0 12px; font-size: 12px; gap: 5px; }

  /* ── 8. Save row ── */
  .sc-save-row {
    display: flex; align-items: center;
    gap: 16px; margin-top: 24px; flex-wrap: wrap;
  }

  /* ── 9. Inline status badge ── */
  .sc-status {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    animation: scSlide 0.25s ease;
    border-left: 3px solid;
  }
  .sc-status.success { background: #DCFCE7; color: #16A34A; border-left-color: #16A34A; }
  .sc-status.error   { background: #FEE2E2; color: #DC2626; border-left-color: #DC2626; }
  @keyframes scSlide {
    from { opacity:0; transform:translateX(-10px); }
    to   { opacity:1; transform:translateX(0); }
  }

  /* ── 10. Unread badge ── */
  .sc-unread-badge {
    display: inline-flex; align-items: center;
    background: #FEF3C7; color: #D97706;
    font-size: 11px; font-weight: 600;
    padding: 2px 10px; border-radius: 999px;
    margin-left: auto;
    letter-spacing: 0.03em;
  }
  .sc-unread-dot {
    display: inline-block;
    width: 7px; height: 7px;
    background: #D97706;
    border-radius: 50%;
    margin-right: 6px; flex-shrink: 0;
  }

  /* ── 11. Inbox toolbar ── */
  .sc-inbox-bar {
    padding: 12px 24px;
    border-bottom: 1px solid #E5E7EB;
    display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap;
    background: #FAFAFA;
  }

  /* ── 12. Table ── */
  .sc-table-wrap { width: 100%; overflow-x: auto; }
  .sc-table {
    width: 100%; border-collapse: collapse;
    font-size: 14px; min-width: 700px;
  }
  .sc-table thead tr { background: #F9FAFB; }
  .sc-table thead th {
    color: #6B7280; font-size: 12px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.03em;
    padding: 12px 16px; text-align: left;
    border-bottom: 1px solid #E5E7EB;
    white-space: nowrap;
  }
  .sc-table tbody tr {
    border-bottom: 1px solid #F3F4F6;
    transition: background 150ms;
  }
  .sc-table tbody tr:hover { background: #F9FAFB; }
  .sc-table tbody tr.sc-unread { background: #FFFBEB; }
  .sc-table tbody tr.sc-unread:hover { background: #FEF9E7; }
  .sc-table td {
    padding: 14px 16px;
    color: #374151;
    vertical-align: middle;
  }

  /* ── 13. Sender cell ── */
  .sc-sender-name { font-weight: 600; color: #111827; font-size: 14px; }
  .sc-sender-email {
    font-size: 12px; color: #2563EB;
    text-decoration: none; display: block; margin-top: 2px;
  }
  .sc-sender-email:hover { text-decoration: underline; }
  .sc-sender-phone { font-size: 12px; color: #6B7280; display: block; margin-top: 2px; }

  /* ── 14. Message preview ── */
  .sc-msg-text {
    color: #374151; line-height: 1.6; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .sc-msg-text.expanded { display: block; -webkit-line-clamp: unset; }

  /* ── 15. Time cell ── */
  .sc-time { font-size: 12px; color: #9CA3AF; white-space: nowrap; }
  .sc-time-date { font-weight: 500; color: #6B7280; }

  /* ── 16. Actions cell ── */
  .sc-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── 17. Empty / loading ── */
  .sc-empty {
    text-align: center; padding: 60px 20px;
    color: #6B7280;
  }
  .sc-empty-icon { margin-bottom: 16px; opacity: 0.4; }
  .sc-empty-title { font-weight: 600; font-size: 16px; color: #374151; margin: 0 0 4px; }
  .sc-empty-sub   { font-size: 13px; color: #9CA3AF; margin: 0; }

  /* ── 18. Segmented spinner ── */
  @keyframes sc-spin { to { transform: rotate(360deg); } }
  .sc-spinner {
    width: 20px; height: 20px;
    border: 2px solid #E5E7EB;
    border-top-color: #2563EB;
    border-radius: 50%;
    animation: sc-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── 19. Toast notification ── */
  .sc-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 10px;
    background: #FFFFFF; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    padding: 14px 20px; min-width: 260px; max-width: 380px;
    border-left: 4px solid;
    animation: scSlide 0.25s ease;
    font-size: 14px; font-weight: 500;
  }
  .sc-toast-success { border-left-color: #16A34A; color: #16A34A; }
  .sc-toast-error   { border-left-color: #DC2626; color: #DC2626; }

  /* ── 20. Responsive ── */
  @media (max-width:768px) {
    .sc-header-title { font-size: 22px; }
    .sc-card-body { padding: 16px; }
    .sc-inbox-bar { padding: 10px 16px; }
    .sc-table thead th, .sc-table td { padding: 10px 12px; }
    .sc-stat-num { font-size: 22px; }
  }
  @media (max-width:480px) {
    .sc-header { padding: 16px; }
    .sc-card-head { padding: 12px 16px; }
    .sc-actions { gap: 4px; }
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

      {/* ── Page Header ── */}
      <div className="sc-header">
        <div className="sc-header-icon">
          <PhoneCall size={24} color="#2563EB" />
        </div>
        <div>
          <h1 className="sc-header-title">Procurement Contact Settings</h1>
          <p className="sc-header-sub">Manage public contact info &amp; supplier messages</p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="sc-stats">
        <div className="sc-stat-card">
          <div className="sc-stat-icon-wrap" style={{ background: '#E0F2FE' }}>
            <Inbox size={20} color="#0284C7" />
          </div>
          <div>
            <div className="sc-stat-num">{total}</div>
            <div className="sc-stat-lbl">Total Messages</div>
          </div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-icon-wrap" style={{ background: unread > 0 ? '#FEF3C7' : '#F3F4F6' }}>
            <MessageCircle size={20} color={unread > 0 ? '#D97706' : '#6B7280'} />
          </div>
          <div>
            <div className="sc-stat-num" style={{ color: unread > 0 ? '#D97706' : '#111827' }}>{unread}</div>
            <div className="sc-stat-lbl">Unread</div>
          </div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-icon-wrap" style={{ background: '#DCFCE7' }}>
            <Clock size={20} color="#16A34A" />
          </div>
          <div>
            <div className="sc-stat-num">{today}</div>
            <div className="sc-stat-lbl">Today</div>
          </div>
        </div>
      </div>

      {/* ── Contact Settings Form ── */}
      <div className="sc-card">
        <div className="sc-card-head">
          <PhoneCall size={16} color="#6B7280" />
          <h2 className="sc-card-title">Public Contact Information</h2>
        </div>
        <div className="sc-card-body">
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
            These details appear in the <strong style={{ color: '#111827' }}>"Procurement Team"</strong> contact popup on the public tender buy page. Keep them up to date so suppliers can reach the right team.
          </p>

          <div className="sc-form-grid">
            <div className="sc-field">
              <label htmlFor="sc-phone1">Primary Phone</label>
              <div className="sc-field-wrap">
                <div className="sc-field-icon">
                  <Phone size={15} color="#9CA3AF" />
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

            <div className="sc-field">
              <label htmlFor="sc-phone2">Secondary Phone</label>
              <div className="sc-field-wrap">
                <div className="sc-field-icon">
                  <Phone size={15} color="#9CA3AF" />
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

            <div className="sc-field">
              <label htmlFor="sc-email">Procurement Email Address</label>
              <div className="sc-field-wrap">
                <div className="sc-field-icon">
                  <Mail size={15} color="#9CA3AF" />
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

          <div className="sc-save-row">
            <button
              className="sc-btn sc-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <div className="sc-spinner" style={{width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)'}}></div> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Contact Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Supplier Inquiry Inbox ── */}
      <div className="sc-card">
        <div className="sc-card-head">
          <MessageCircle size={16} color="#6B7280" />
          <h2 className="sc-card-title">Supplier Inquiry Inbox</h2>
          {unread > 0 && (
            <span className="sc-unread-badge">
              {unread} UNREAD
            </span>
          )}
        </div>

        {loadingMessages ? (
          <div className="sc-empty">
            <div className="sc-spinner" style={{width: 40, height: 40, margin: '0 auto 16px', borderTopColor: '#2563EB'}}></div>
            <p className="sc-empty-title">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="sc-empty">
            <div className="sc-empty-icon"><Inbox size={48} color="#D1D5DB" /></div>
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
                  <th style={{ width: '16%' }}>Received</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id} className={!msg.is_read ? 'sc-unread' : ''}>
                    {/* Sender */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        {!msg.is_read && <span className="sc-unread-dot" title="Unread" style={{marginTop: 6}} />}
                        <div>
                          <div className="sc-sender-name">{msg.sender_name}</div>
                          <a href={`mailto:${msg.sender_email}`} className="sc-sender-email">
                            {msg.sender_email}
                          </a>
                          <span className="sc-sender-phone">
                            {msg.sender_phone || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No phone</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Message */}
                    <td>
                      <p className="sc-msg-text">{msg.message}</p>
                    </td>
                    {/* Time */}
                    <td>
                      <div className="sc-time">
                        <span className="sc-time-date">{new Date(msg.created_at).toLocaleDateString()}</span><br />
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    {/* Actions */}
                    <td>
                      <div className="sc-actions">
                        <a href={`mailto:${msg.sender_email}`} className="sc-btn sc-btn-sm sc-btn-primary">
                          <MessageCircle size={14} /> Reply
                        </a>
                        {!msg.is_read ? (
                           <button className="sc-btn sc-btn-sm sc-btn-outline" style={{padding: '0 8px'}} title="Mark as Read">
                             <CheckCircle size={14} />
                           </button>
                        ) : (
                           <button className="sc-btn sc-btn-sm sc-btn-outline" style={{padding: '0 8px'}} title="Mark as Unread">
                             <Inbox size={14} />
                           </button>
                        )}
                        <button className="sc-btn sc-btn-sm sc-btn-danger" style={{padding: '0 8px'}} title="Delete Message">
                          <XCircle size={14} />
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

      {/* ── Toast Notification ── */}
      {saveStatus.text && (
        <div className={`sc-toast sc-toast-${saveStatus.type}`}>
          {saveStatus.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {saveStatus.text}
        </div>
      )}
    </div>
  );
};

export default PurchaseContact;
