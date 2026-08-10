import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall, User, Clock, CheckCircle, XCircle, Inbox, Trash2, Eye, EyeOff, Send, CheckCheck } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import api from '../../services/apiClient';

/* ─── Enterprise design pass — mirrors HR Contact Settings ──────────────────
   Blue accent (#2563EB), safe-edge, stats row, settings form + message inbox
   with read/unread toggle, replied/pending state, delete, and Gmail-prefilled
   compose. Sales-backend logic: /sales-settings + /sales-settings/messages.
────────────────────────────────────────────────────────────────────────────── */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .sc-root {
    --color-primary:        #2563EB;
    --color-primary-hover:  #1D4ED8;
    --color-bg-page:        #F5F6FA;
    --color-bg-card:        #FFFFFF;
    --color-border:         #E5E7EB;
    --color-text-primary:   #111827;
    --color-text-secondary: #6B7280;
    --color-text-muted:     #9CA3AF;
    --color-success:        #16A34A;
    --color-success-bg:     #DCFCE7;
    --color-danger:         #DC2626;
    --color-danger-bg:      #FEE2E2;
    --color-warning:        #D97706;
    --color-warning-bg:     #FEF3C7;
    --color-info:           #0284C7;
    --color-info-bg:        #E0F2FE;

    background: var(--color-bg-page);
    min-height: 100vh;
    padding: 12px;
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-primary);
    box-sizing: border-box;
  }
  .sc-root * { box-sizing: border-box; }

  @media (min-width: 768px)  { .sc-root { padding: 16px; } }
  @media (min-width: 1024px) { .sc-root { padding: 24px; } }

  /* ══════════════ HEADER CARD ══════════════ */
  .sc-header {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    transition: all 150ms ease;
  }
  .sc-header:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }
  .sc-header-left { flex: 1; min-width: 280px; }
  .sc-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--color-info-bg);
    border: 1px solid #BAE6FD;
    border-radius: 9999px;
    padding: 2px 10px;
    margin-bottom: 8px;
  }
  .sc-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-info);
  }
  .sc-badge-txt {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-info);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .sc-page-title {
    font-size: clamp(24px, 3vw, 28px);
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
    margin: 0 0 4px;
    letter-spacing: -0.01em;
  }
  .sc-page-title span { color: var(--color-primary); }
  .sc-page-subtitle {
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  /* ══════════════ CARD SECTIONS ══════════════ */
  .sc-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
    transition: all 150ms ease;
  }
  .sc-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }
  .sc-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    background: #F9FAFB;
  }
  .sc-card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sc-card-badge {
    margin-left: auto;
    background: var(--color-primary);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
    letter-spacing: 0.03em;
  }
  .sc-card-body { padding: 24px; }
  .sc-card-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 20px;
    line-height: 1.5;
  }

  /* ── Form grid ── */
  .sc-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  .sc-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sc-form-group label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .sc-input-wrap {
    display: flex;
    align-items: center;
    background: var(--color-bg-page);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    height: 36px;
    overflow: hidden;
    transition: all 150ms ease-in-out;
  }
  .sc-input-wrap:focus-within {
    border-color: var(--color-primary);
    background: var(--color-bg-card);
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }
  .sc-input-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 100%;
    color: var(--color-text-muted);
    background: #F9FAFB;
    border-right: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .sc-input-wrap:focus-within .sc-input-icon {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  .sc-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    padding: 0 12px;
    font-size: 14px;
    color: var(--color-text-primary);
    font-family: inherit;
    width: 100%;
    min-width: 0;
  }
  .sc-input::placeholder { color: var(--color-text-muted); }

  /* ── Save row ── */
  .sc-save-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  /* ══════════════ BUTTONS — yellow scatter-from-point hover ══════════════ */
  .sc-save-btn, .sc-action-btn {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .sc-save-btn::after, .sc-action-btn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 180%;
    padding-top: 180%;
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,.12) 70%);
    transition: transform .4s ease, opacity .2s ease;
    pointer-events: none;
    z-index: 0;
  }
  .sc-save-btn > *, .sc-action-btn > * { position: relative; z-index: 1; }

  .sc-save-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 16px;
    background: var(--color-primary);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 150ms ease;
  }
  .sc-save-btn:hover:not(:disabled) {
    background: #F59E0B !important;
    color: #78350F !important;
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
  }
  .sc-save-btn:hover:not(:disabled)::after { transform: translate(-50%, -50%) scale(1); }
  .sc-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sc-status-msg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    animation: scSlideIn 150ms ease-out;
  }
  @keyframes scSlideIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sc-status-success { background: var(--color-success-bg); color: #166534; }
  .sc-status-error   { background: var(--color-danger-bg); color: #991B1B; }

  /* ══════════════ STATS ROW ══════════════ */
  .sc-stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  .sc-stat-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: all 150ms ease;
  }
  .sc-stat-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }
  .sc-stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--color-bg-page);
    border-radius: 8px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
  .sc-stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .sc-stat-val {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.2;
  }
  .sc-stat-lbl {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  @media (max-width: 640px) {
    .sc-stats-row { grid-template-columns: 1fr; }
  }

  /* ══════════════ TABLE ══════════════ */
  .sc-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .sc-table {
    width: 100%;
    min-width: 800px;
    border-collapse: collapse;
  }
  .sc-table thead tr { border-bottom: 1px solid var(--color-border); }
  .sc-table th {
    padding: 12px 16px;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    white-space: nowrap;
  }
  .sc-table th.right  { text-align: right; }
  .sc-table th.center { text-align: center; }
  .sc-table tbody tr {
    border-bottom: 1px solid #F3F4F6;
    transition: background 150ms ease-in-out;
  }
  .sc-table tbody tr:hover { background: #F9FAFB; }
  .sc-table tbody tr:last-child { border-bottom: none; }
  .sc-row-unread { background: #F8FAFC !important; }
  .sc-row-replied { background: var(--color-success-bg) !important; }
  .sc-table td {
    padding: 12px 16px;
    color: var(--color-text-primary);
    font-size: 14px;
    vertical-align: top;
  }
  .sc-table td.right  { text-align: right; }
  .sc-table td.center { text-align: center; }

  .sc-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--color-primary);
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
  }
  .sc-sender-name {
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 14px;
  }
  .sc-sender-email {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-primary);
    text-decoration: none;
    margin-top: 4px;
  }
  .sc-sender-email:hover { text-decoration: underline; color: var(--color-primary-hover); }
  .sc-sender-phone {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .sc-msg-text {
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
    font-size: 13px;
  }
  .sc-time-text {
    font-size: 13px;
    color: var(--color-text-primary);
  }
  .sc-time-text-sub {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .sc-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
  .sc-pill-replied { background: var(--color-success); color: #fff; }
  .sc-pill-pending {
    background: var(--color-bg-page);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  .sc-actions-list {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
  .sc-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 150ms ease;
  }
  .sc-action-btn:hover {
    background: #F59E0B !important;
    color: #78350F !important;
    border-color: #F59E0B !important;
  }
  .sc-action-btn:hover::after { transform: translate(-50%, -50%) scale(1); }
  .sc-action-btn.active {
    background: var(--color-success);
    color: #fff;
    border-color: var(--color-success);
  }
  .sc-action-btn.active:hover {
    background: var(--color-success) !important;
    color: #fff !important;
    border-color: var(--color-success) !important;
  }
  .sc-action-btn-del:hover {
    background: var(--color-danger-bg) !important;
    color: var(--color-danger) !important;
    border-color: var(--color-danger) !important;
  }

  /* ── Loading / Empty ── */
  .sc-loading, .sc-empty {
    padding: 64px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--color-text-muted);
    font-size: 14px;
    text-align: center;
  }
  .sc-empty-title {
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 16px;
    margin: 0;
  }
  .sc-empty-sub { font-size: 13px; margin: 0; }
`;

const SalesContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });
  const [repliedIds, setRepliedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sales_replied_msgs') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/sales-settings');
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
        const res = await api.get('/sales-settings/messages');
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
      await api.put('/sales-settings', {
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
    const newStatus = msg.is_read ? false : true;
    try {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: newStatus } : m));
      await api.patch(`/sales-settings/messages/${msg.id}/status`, { is_read: newStatus });
    } catch (err) {
      console.error('Failed to toggle status', err);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: msg.is_read } : m));
    }
  };

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/sales-settings/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      setRepliedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem('sales_replied_msgs', JSON.stringify([...next]));
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
      localStorage.setItem('sales_replied_msgs', JSON.stringify([...next]));
      return next;
    });
  };

  const total   = messages.length;
  const unread  = messages.filter(m => !m.is_read).length;
  const today   = messages.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="sc-root">
      <style>{STYLES}</style>

      {/* ══════════════ HEADER ══════════════ */}
      <div className="sc-header">
        <div className="sc-header-left">
          <div className="sc-badge">
            <span className="sc-badge-dot" />
            <span className="sc-badge-txt">Sales Administration</span>
          </div>
          <h1 className="sc-page-title">Sales Contact <span>Settings</span></h1>
          <p className="sc-page-subtitle">Manage public contact info &amp; customer messages</p>
        </div>
      </div>

      {/* ══════════════ STATS ROW ══════════════ */}
      <div className="sc-stats-row">
        <div className="sc-stat-card">
          <div className="sc-stat-icon"><Inbox size={20} /></div>
          <div className="sc-stat-info">
            <span className="sc-stat-val">{total}</span>
            <span className="sc-stat-lbl">Total Messages</span>
          </div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-icon"><MessageCircle size={20} color={unread > 0 ? 'var(--color-primary)' : undefined} /></div>
          <div className="sc-stat-info">
            <span className="sc-stat-val" style={{ color: unread > 0 ? 'var(--color-primary)' : 'inherit' }}>{unread}</span>
            <span className="sc-stat-lbl">Unread</span>
          </div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-icon"><Clock size={20} /></div>
          <div className="sc-stat-info">
            <span className="sc-stat-val">{today}</span>
            <span className="sc-stat-lbl">Today</span>
          </div>
        </div>
      </div>

      {/* ══════════════ SETTINGS FORM CARD ══════════════ */}
      <div className="sc-card">
        <div className="sc-card-header">
          <PhoneCall size={16} color="var(--color-text-secondary)" />
          <h2 className="sc-card-title">Public Contact Information</h2>
        </div>
        <div className="sc-card-body">
          <p className="sc-card-desc">
            These details appear in the "Sales Team" contact popup on the public tender buy page.
            Keep them up to date so customers can reach the sales team directly.
          </p>

          <div className="sc-form-grid">
            <div className="sc-form-group">
              <label htmlFor="sc-phone1">Primary Phone</label>
              <div className="sc-input-wrap">
                <div className="sc-input-icon"><Phone size={14} /></div>
                <input
                  className="sc-input"
                  id="sc-phone1"
                  type="text"
                  name="phone1"
                  value={settings.phone1}
                  onChange={handleChange}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
            </div>

            <div className="sc-form-group">
              <label htmlFor="sc-phone2">Secondary Phone</label>
              <div className="sc-input-wrap">
                <div className="sc-input-icon"><Phone size={14} /></div>
                <input
                  className="sc-input"
                  id="sc-phone2"
                  type="text"
                  name="phone2"
                  value={settings.phone2}
                  onChange={handleChange}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
            </div>

            <div className="sc-form-group">
              <label htmlFor="sc-email">Sales Email Address</label>
              <div className="sc-input-wrap">
                <div className="sc-input-icon"><Mail size={14} /></div>
                <input
                  className="sc-input"
                  id="sc-email"
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="sales@sutana.com"
                />
              </div>
            </div>
          </div>

          <div className="sc-save-row">
            <button className="sc-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? <SegmentedSpinner size={16} /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Contact Settings'}
            </button>
            {saveStatus.text && (
              <div className={`sc-status-msg ${saveStatus.type === 'success' ? 'sc-status-success' : 'sc-status-error'}`}>
                {saveStatus.type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                {saveStatus.text.replace('✓ ', '').replace('✗ ', '')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ INBOX TABLE CARD ══════════════ */}
      <div className="sc-card">
        <div className="sc-card-header">
          <MessageCircle size={16} color="var(--color-text-secondary)" />
          <h2 className="sc-card-title">Customer Inquiry Inbox</h2>
          {unread > 0 && <span className="sc-card-badge">{unread} UNREAD</span>}
        </div>

        {loadingMessages ? (
          <div className="sc-loading">
            <SegmentedSpinner size={48} />
            <p className="sc-empty-title">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="sc-empty">
            <Inbox size={40} />
            <p className="sc-empty-title">No messages yet</p>
            <p className="sc-empty-sub">Customer inquiries from the public Sales Team contact form will appear here.</p>
          </div>
        ) : (
          <div className="sc-table-wrapper">
            <table className="sc-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Sender</th>
                  <th>Message</th>
                  <th style={{ width: '16%' }}>Phone</th>
                  <th style={{ width: '14%' }}>Received</th>
                  <th className="center" style={{ width: '14%' }}>Status</th>
                  <th className="right" style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => {
                  const isReplied = repliedIds.has(msg.id);
                  return (
                    <tr key={msg.id} className={isReplied ? 'sc-row-replied' : (!msg.is_read ? 'sc-row-unread' : '')}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          {!msg.is_read && <span className="sc-dot" title="Unread" />}
                          <div>
                            <div className="sc-sender-name">{msg.sender_name}</div>
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.sender_email}&su=${encodeURIComponent('Reply to your inquiry')}&body=${encodeURIComponent(`Dear ${msg.sender_name},\n\n\n\nBest regards,\nSales Team\n${settings.email}\n${settings.phone1}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="sc-sender-email"
                              onClick={() => markReplied(msg.id)}
                            >
                              <Send size={12} /> {msg.sender_email}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="sc-msg-text">{msg.message}</p>
                      </td>
                      <td>
                        <span className="sc-sender-phone">
                          {msg.sender_phone || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <div className="sc-time-text">{new Date(msg.created_at).toLocaleDateString()}</div>
                        <div className="sc-time-text-sub">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="center">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          {isReplied ? (
                            <span className="sc-status-pill sc-pill-replied">
                              <CheckCheck size={12} /> REPLIED
                            </span>
                          ) : (
                            <span className="sc-status-pill sc-pill-pending">
                              PENDING
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="right">
                        <div className="sc-actions-list">
                          <button
                            onClick={() => {
                              if (isReplied) {
                                setRepliedIds(prev => {
                                  const next = new Set(prev);
                                  next.delete(msg.id);
                                  localStorage.setItem('sales_replied_msgs', JSON.stringify([...next]));
                                  return next;
                                });
                              } else {
                                markReplied(msg.id);
                              }
                            }}
                            className={`sc-action-btn ${isReplied ? 'active' : ''}`}
                            title={isReplied ? 'Unmark as replied' : 'Mark as replied'}
                          >
                            <CheckCheck size={14} />
                          </button>
                          <button
                            onClick={() => toggleMessageStatus(msg)}
                            className="sc-action-btn"
                            style={{ color: msg.is_read ? 'var(--color-success)' : 'var(--color-primary)' }}
                            title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {msg.is_read ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="sc-action-btn sc-action-btn-del"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesContact;
