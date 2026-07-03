import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { MessageCircle, Send, Trash2, Eye, CheckCheck, Bell, AlertTriangle, Megaphone, BookOpen } from 'lucide-react';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

const importanceBadge = (importance) => {
  const map = { normal: { bg: '#f1f5f9', color: '#475569' }, important: { bg: '#fffbeb', color: '#d97706' }, urgent: { bg: '#fef2f2', color: '#ef4444' } };
  return map[importance] || map.normal;
};

// ─── 14. Messages ───────────────────────────────────────────────────────────
export const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipient_id: 'MGR-001', subject: '', body: '', thread_id: null });

  const fetch = () => setMessages(employeePortalState.getMessages(SESSION_EMPLOYEE_ID));
  useEffect(() => {
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleSelect = (msg) => {
    setSelected(msg);
    setCompose(false);
    if (msg.recipient_id === SESSION_EMPLOYEE_ID && !msg.is_read) {
      employeePortalState.markMessageRead(SESSION_EMPLOYEE_ID, msg.id);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    try {
      employeePortalState.sendMessage(SESSION_EMPLOYEE_ID, composeForm);
      setCompose(false);
      setComposeForm({ recipient_id: 'MGR-001', subject: '', body: '', thread_id: null });
    } catch (err) { alert(err.message); }
  };

  const handleDelete = (id) => {
    employeePortalState.deleteMessage(SESSION_EMPLOYEE_ID, id);
    if (selected?.id === id) setSelected(null);
  };

  const handleReply = (msg) => {
    setComposeForm({ recipient_id: msg.sender_id.startsWith('MGR-') ? msg.sender_id : 'MGR-001', subject: `Re: ${msg.subject}`, body: '', thread_id: msg.thread_id });
    setCompose(true);
    setSelected(null);
  };

  const inbox = messages.filter(m => m.recipient_id === SESSION_EMPLOYEE_ID);
  const sent = messages.filter(m => m.sender_id === SESSION_EMPLOYEE_ID);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <PageHeader title="Messages" description="Communicate with your supervisor or manager." />
        <button onClick={() => { setCompose(true); setSelected(null); }} style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={16} /> Compose
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Message List */}
        <div style={{ width: '340px', flexShrink: 0 }}>
          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inbox ({inbox.filter(m => !m.is_read).length} unread)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {inbox.map(m => (
              <div key={m.id} onClick={() => handleSelect(m)} style={{ backgroundColor: 'white', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${selected?.id === m.id ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', borderLeft: m.is_read ? undefined : '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>From: {m.sender_id}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(m.sent_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: m.is_read ? '500' : '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
              </div>
            ))}
            {inbox.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>No messages received.</p>}
          </div>

          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sent.map(m => (
              <div key={m.id} onClick={() => handleSelect(m)} style={{ backgroundColor: 'white', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${selected?.id === m.id ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>To: {m.recipient_id}</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Trash2 size={14} /></button>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Viewer / Compose */}
        <div style={{ flex: 1 }}>
          {compose ? (
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: '800' }}>New Message</h3>
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>To</label>
                  <select value={composeForm.recipient_id} onChange={e => setComposeForm({ ...composeForm, recipient_id: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="MGR-001">Manager (MGR-001)</option>
                    <option value="MGR-002">Supervisor (MGR-002)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Subject</label>
                  <input required value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Message</label>
                  <textarea required rows="6" value={composeForm.body} onChange={e => setComposeForm({ ...composeForm, body: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setCompose(false)} style={{ padding: '10px 20px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={16} /> Send
                  </button>
                </div>
              </form>
            </div>
          ) : selected ? (
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{selected.subject}</h2>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  From: <strong>{selected.sender_id}</strong> · {new Date(selected.sent_at).toLocaleString()}
                </div>
              </div>
              <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px' }}>{selected.body}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => handleReply(selected)} style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Reply</button>
                <button onClick={() => handleDelete(selected.id)} style={{ padding: '10px 20px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
              <MessageCircle size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>Select a message or compose a new one</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 15. Supervisor Notes ────────────────────────────────────────────────────
export const SupervisorNotes = () => {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetch = () => setNotes(employeePortalState.getSupervisorNotes(SESSION_EMPLOYEE_ID));
  useEffect(() => { fetch(); return employeePortalState.subscribe(fetch); }, []);

  const handleSelect = (note) => {
    setSelected(note);
    if (!note.is_read) employeePortalState.markSupervisorNoteRead(SESSION_EMPLOYEE_ID, note.id);
  };

  const handleAcknowledge = (noteId) => {
    employeePortalState.acknowledgeSupervisorNote(SESSION_EMPLOYEE_ID, noteId);
  };

  const priorityStyle = { normal: { color: '#64748b', bg: '#f1f5f9' }, important: { color: '#d97706', bg: '#fffbeb' }, urgent: { color: '#ef4444', bg: '#fef2f2' } };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Supervisor Notes" description="Notes and feedback from your supervisor." />

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '340px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map(n => {
              const ps = priorityStyle[n.priority] || priorityStyle.normal;
              return (
                <div key={n.id} onClick={() => handleSelect(n)} style={{ backgroundColor: 'white', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${selected?.id === n.id ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', borderLeft: n.is_read ? undefined : '4px solid #3b82f6', position: 'relative' }}>
                  {n.priority !== 'normal' && (
                    <span style={{ float: 'right', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: ps.bg, color: ps.color }}>
                      {n.priority}
                    </span>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: n.is_read ? '500' : '700', color: '#0f172a', marginBottom: '4px', paddingRight: '60px' }}>{n.subject}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                  {n.action_required && <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', marginTop: '4px' }}>⚡ Action Required</div>}
                </div>
              );
            })}
            {notes.length === 0 && <p style={{ color: '#94a3b8' }}>No supervisor notes.</p>}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{selected.subject}</h2>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>From: {selected.authored_by} · {new Date(selected.created_at).toLocaleString()}</div>
                </div>
                {selected.priority !== 'normal' && (
                  <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: importanceBadge(selected.priority).bg, color: importanceBadge(selected.priority).color }}>
                    {selected.priority}
                  </span>
                )}
              </div>

              {selected.action_required && !selected.acknowledged_at && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ color: '#dc2626', fontWeight: '600' }}>⚡ This note requires your acknowledgment</span>
                  <button onClick={() => handleAcknowledge(selected.id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Acknowledge</button>
                </div>
              )}

              {selected.acknowledged_at && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#065f46' }}>
                  ✓ Acknowledged on {new Date(selected.acknowledged_at).toLocaleString()}
                </div>
              )}

              <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px' }}>{selected.content}</p>

              {!selected.acknowledged_at && (
                <button onClick={() => handleAcknowledge(selected.id)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCheck size={16} /> Acknowledge
                </button>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
              <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>Select a note to read it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 16. Announcements ──────────────────────────────────────────────────────
export const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetch = () => setAnnouncements(employeePortalState.getAnnouncements(SESSION_EMPLOYEE_ID));
  useEffect(() => { fetch(); return employeePortalState.subscribe(fetch); }, []);

  const handleSelect = (a) => setSelected(a);

  const handleMarkRead = (id) => {
    employeePortalState.markAnnouncementRead(SESSION_EMPLOYEE_ID, id);
  };

  const ib = (importance) => importanceBadge(importance);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Announcements" description="Company-wide and department-level broadcasts." />

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '360px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {announcements.map(a => (
              <div key={a.id} onClick={() => handleSelect(a)} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '10px', border: `1px solid ${selected?.id === a.id ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', borderLeft: a.is_read ? undefined : '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: ib(a.importance).bg, color: ib(a.importance).color }}>{a.importance}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{a.scope === 'department' ? '🏢 Dept' : '🌐 Company'}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: a.is_read ? '600' : '800', color: '#0f172a', marginBottom: '4px' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{a.publish_date}</div>
              </div>
            ))}
            {announcements.length === 0 && <p style={{ color: '#94a3b8' }}>No active announcements.</p>}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{selected.title}</h2>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Posted by {selected.posted_by} · {selected.publish_date}
                    {selected.expiry_date && ` · Expires: ${selected.expiry_date}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: ib(selected.importance).bg, color: ib(selected.importance).color }}>{selected.importance}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569' }}>{selected.scope === 'department' ? '🏢 Department' : '🌐 Company-Wide'}</span>
                </div>
              </div>

              <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '15px', marginBottom: '28px' }}>{selected.content}</p>

              {!selected.is_read ? (
                <button onClick={() => { handleMarkRead(selected.id); setSelected({ ...selected, is_read: true }); }} style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={16} /> Mark as Read
                </button>
              ) : (
                <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCheck size={16} /> Marked as read
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
              <Megaphone size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>Select an announcement to read it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Notifications Inbox ────────────────────────────────────────────────────
export const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState([]);

  const fetch = () => setNotifications(employeePortalState.getNotifications(SESSION_EMPLOYEE_ID));
  useEffect(() => { fetch(); return employeePortalState.subscribe(fetch); }, []);

  const handleMarkRead = (id) => employeePortalState.markNotificationRead(SESSION_EMPLOYEE_ID, id);
  const handleMarkAll = () => employeePortalState.markAllNotificationsRead(SESSION_EMPLOYEE_ID);
  const handleClear = () => employeePortalState.clearNotifications(SESSION_EMPLOYEE_ID);

  const typeIcon = { task_assigned: '📋', deadline_approaching: '⏰', task_approved: '✅', task_rejected: '❌', attendance_verified: '🕐', submission_approved: '✅', submission_rejected: '❌', material_requested: '📝', material_returned: '🔄' };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Notifications
            {unreadCount > 0 && <span style={{ backgroundColor: '#3b82f6', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '14px', fontWeight: '700' }}>{unreadCount}</span>}
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Your activity and event inbox.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleMarkAll} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#475569' }}>Mark All Read</button>
          <button onClick={handleClear} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#ef4444' }}>Clear All</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map(n => (
          <div key={n.id} onClick={() => handleMarkRead(n.id)} style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: n.is_read ? '1px solid #e2e8f0' : '4px solid #3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background 0.1s' }}>
            <div style={{ fontSize: '22px', flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? '600' : '800', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{n.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{n.body}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{new Date(n.created_at).toLocaleString()}</div>
            {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }} />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div>You are all caught up!</div>
          </div>
        )}
      </div>
    </div>
  );
};
