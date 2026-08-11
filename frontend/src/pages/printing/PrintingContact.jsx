import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall, User, Clock, CheckCircle, XCircle, Inbox, Trash2, Eye, EyeOff, Send, CheckCheck } from 'lucide-react';
import api from '../../services/apiClient';

import styles from './PrintingContact.module.css';

const PrintingContact = () => {
  const [settings, setSettings] = useState({ phone1: '', phone2: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });
  const [repliedIds, setRepliedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('printing_replied_msgs') || '[]')); }
    catch { return new Set(); }
  });

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

  const toggleMessageStatus = async (msg) => {
    const newStatus = msg.is_read ? 'unread' : 'read';
    try {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: !m.is_read } : m));
      await api.put(`/printing-settings/messages/${msg.id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status', err);
      // Revert optimistic update
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: msg.is_read } : m));
    }
  };

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/printing-settings/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      // also clear from replied
      setRepliedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem('printing_replied_msgs', JSON.stringify([...next]));
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
      localStorage.setItem('printing_replied_msgs', JSON.stringify([...next]));
      return next;
    });
  };

  const total   = messages.length;
  const unread  = messages.filter(m => !m.is_read).length;
  const today   = messages.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Printing Administration</span>
          </div>
          <h1 className={styles.pageTitle}>Printing Contact <span>Settings</span></h1>
          <p className={styles.pageSubtitle}>Manage public contact info &amp; customer messages</p>
        </div>
      </div>

      <div className={styles.bodyArea}>

        {/* STATS ROW */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Inbox size={20} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statVal}>{total}</span>
              <span className={styles.statLbl}>Total Messages</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><MessageCircle size={20} color={unread > 0 ? "var(--color-primary)" : undefined} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statVal} style={{ color: unread > 0 ? 'var(--color-primary)' : 'inherit' }}>{unread}</span>
              <span className={styles.statLbl}>Unread</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Clock size={20} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statVal}>{today}</span>
              <span className={styles.statLbl}>Today</span>
            </div>
          </div>
        </div>

        {/* SETTINGS FORM CARD */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <PhoneCall size={16} color="var(--color-text-secondary)" />
            <h2 className={styles.cardTitle}>Public Contact Information</h2>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardDesc}>
              These details appear in the "Printing Team" contact popup on the public Printing page.
              Keep them up to date so customers can reach the Printing team directly.
            </p>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="pc-phone1">Primary Phone</label>
                <div className={styles.inputWrap}>
                  <div className={styles.inputIcon}><Phone size={14} /></div>
                  <input
                    className={styles.input}
                    id="pc-phone1"
                    type="text"
                    name="phone1"
                    value={settings.phone1}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="pc-phone2">Secondary Phone</label>
                <div className={styles.inputWrap}>
                  <div className={styles.inputIcon}><Phone size={14} /></div>
                  <input
                    className={styles.input}
                    id="pc-phone2"
                    type="text"
                    name="phone2"
                    value={settings.phone2}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="pc-email">Printing Email Address</label>
                <div className={styles.inputWrap}>
                  <div className={styles.inputIcon}><Mail size={14} /></div>
                  <input
                    className={styles.input}
                    id="pc-email"
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="printing@sutana.com"
                  />
                </div>
              </div>
            </div>

            <div className={styles.saveRow}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>
              {saveStatus.text && (
                <div className={`${styles.statusMsg} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                  {saveStatus.type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {saveStatus.text.replace('✓ ', '').replace('✗ ', '')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INBOX TABLE CARD */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <MessageCircle size={16} color="var(--color-text-secondary)" />
            <h2 className={styles.cardTitle}>Customer Inquiry Inbox</h2>
            {unread > 0 && <span className={styles.cardBadge}>{unread} UNREAD</span>}
          </div>

          {loadingMessages ? (
            <div className={styles.loading}>
              <span className={styles.segSpinnerLg} />
              <p className={styles.emptyTitle}>Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.empty}>
              <Inbox size={40} />
              <p className={styles.emptyTitle}>No messages yet</p>
              <p className={styles.emptySub}>Customer inquiries from the public Printing Team contact form will appear here.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Sender</th>
                    <th>Message</th>
                    <th style={{ width: '16%' }}>Phone</th>
                    <th style={{ width: '14%' }}>Received</th>
                    <th className={styles.center} style={{ width: '14%' }}>Status</th>
                    <th className={styles.right} style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => {
                    const isReplied = repliedIds.has(msg.id);
                    return (
                      <tr key={msg.id} className={isReplied ? styles.rowReplied : (!msg.is_read ? styles.rowUnread : '')}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            {!msg.is_read && <span className={styles.dot} title="Unread" />}
                            <div>
                              <div className={styles.senderName}>{msg.sender_name}</div>
                              <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.sender_email}&su=${encodeURIComponent('Reply to your inquiry')}&body=${encodeURIComponent(`Dear ${msg.sender_name},\n\n\n\nBest regards,\nPrinting Team\n${settings.email}\n${settings.phone1}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.senderEmail}
                                onClick={() => markReplied(msg.id)}
                              >
                                <Send size={12} /> {msg.sender_email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className={styles.msgText}>{msg.message}</p>
                        </td>
                        <td>
                          <span className={styles.senderPhone}>
                            {msg.sender_phone || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>—</span>}
                          </span>
                        </td>
                        <td>
                          <div className={styles.timeText}>{new Date(msg.created_at).toLocaleDateString()}</div>
                          <div className={styles.timeTextSub}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className={styles.center}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            {isReplied ? (
                              <span className={`${styles.statusPill} ${styles.pillReplied}`}>
                                <CheckCheck size={12} /> REPLIED
                              </span>
                            ) : (
                              <span className={`${styles.statusPill} ${styles.pillPending}`}>
                                PENDING
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.right}>
                          <div className={styles.actionsList}>
                            <button
                              onClick={() => {
                                if (isReplied) {
                                  setRepliedIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(msg.id);
                                    localStorage.setItem('printing_replied_msgs', JSON.stringify([...next]));
                                    return next;
                                  });
                                } else {
                                  markReplied(msg.id);
                                }
                              }}
                              className={`${styles.actionBtn} ${isReplied ? styles.active : ''}`}
                              title={isReplied ? 'Unmark as replied' : 'Mark as replied'}
                            >
                              <CheckCheck size={14} />
                            </button>
                            <button
                              onClick={() => toggleMessageStatus(msg)}
                              className={styles.actionBtn}
                              style={{ color: msg.is_read ? 'var(--color-success)' : 'var(--color-primary)' }}
                              title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                            >
                              {msg.is_read ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className={`${styles.actionBtn} ${styles.actionBtnDel}`}
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
    </div>
  );
};

export default PrintingContact;
