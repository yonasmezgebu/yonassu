import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";
import toast, { Toaster } from 'react-hot-toast';

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const G = {
  forest: '#1B5E20', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  olive: '#6B8E23', white: '#FFFFFF', light: '#F5F5F5', gray: '#9E9E9E',
  red: '#F44336', blue: '#3b82f6', darkText: '#1a1a2e'
};

/* ─── Animations ────────────────────────────────────────────────────────────  */
const Styles = () => (
  <style>{`
    @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .mc-card { position:relative; overflow:hidden; border-radius:0; background:#fff;
      box-shadow:0 2px 14px rgba(0,80,40,0.08); transition:box-shadow 0.3s, transform 0.3s;
      --hover-color:#2E8B57;
      background-image:linear-gradient(to right,var(--hover-color),var(--hover-color)),linear-gradient(to bottom,var(--hover-color),var(--hover-color)),linear-gradient(to left,var(--hover-color),var(--hover-color)),linear-gradient(to top,var(--hover-color),var(--hover-color));
      background-position:0 0,100% 0,100% 100%,0 100%; background-repeat:no-repeat; background-size:0% 3px,3px 0%,0% 3px,3px 0%; }
    .mc-card::before{content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(0,255,200,0.25),transparent);transform:skewX(-25deg);pointer-events:none;z-index:1;}
    .mc-card:hover{box-shadow:0 8px 24px rgba(0,80,40,0.14),0 0 16px var(--hover-color);background-size:100% 3px,3px 100%,100% 3px,3px 100%;}
    .mc-card:hover::before{animation:laserSweep 0.7s ease-out;}
    .mc-contact-row{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;border-radius:0;transition:background 0.2s,transform 0.15s;position:relative;overflow:hidden;}
    .mc-contact-row::before{content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(0,255,200,0.2),transparent);transform:skewX(-25deg);pointer-events:none;}
    .mc-contact-row:hover{background:rgba(46,139,87,0.07);transform:translateX(3px);}
    .mc-contact-row:hover::before{animation:laserSweep 0.5s ease-out;}
    .mc-contact-row.selected{background:rgba(46,139,87,0.12);border-left:3px solid #2E8B57;}
    .mc-bubble{animation:msgIn 0.2s ease both;word-break:break-word;position:relative;}
    .mc-delete-btn{opacity:0;transition:opacity 0.2s;background:rgba(244,67,54,0.12);border:none;border-radius:4px;padding:2px 6px;cursor:pointer;color:#F44336;font-size:10px;font-weight:700;flex-shrink:0;white-space:nowrap;}
    .mc-delete-btn:hover{background:rgba(244,67,54,0.22);}
    .mc-bubble-wrap:hover .mc-delete-btn{opacity:1;}
    .mc-input{width:100%;border:none;outline:none;background:transparent;font-size:14px;font-family:inherit;resize:none;padding:0;line-height:1.6;overflow-y:hidden;display:block;color:#1a1a2e;}
    .mc-input::-webkit-scrollbar{display:none;}
    .mc-send-btn{background:#1B5E20;color:#fff;border:none;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s,transform 0.15s;flex-shrink:0;padding:0;}
    .mc-send-btn:hover{background:#2E8B57;transform:scale(1.08);}
    .mc-send-btn:active{transform:scale(0.95);}
    .mc-send-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
  `}</style>
);

/* ─── Role badge colours ────────────────────────────────────────────────────  */
const ROLE_COLORS = {
  'CEO': '#7C3AED', 'Admin': '#3b82f6', 'HR Manager': '#ec4899',
  'Car Rental Manager': '#0ea5e9', 'Printing Supervisor': '#6B8E23',
  'Printing Manager': '#6B8E23', 'Pharmacy Manager': '#ef4444',
  'Sales Manager': '#f59e0b', 'Purchase Manager': '#8b5cf6',
  'Board Member': '#14b8a6', 'General Store Manager': '#059669',
  'Pharmacy Store Manager': '#dc2626',
};
const roleColor = r => ROLE_COLORS[r] || G.emerald;

const Avatar = ({ name, role, size = 40, avatar = null }) => {
  if (avatar) {
    return (
      <img 
        src={avatar} 
        alt={name} 
        style={{ width: size, height: size, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} 
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = roleColor(role);
  return (
    <div style={{
      width: size, height: size, borderRadius: 0, background: bg,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0, userSelect: 'none'
    }}>{initials}</div>
  );
};

/* ─── Delete Confirmation Modal ─────────────────────────────────────────────  */
function DeleteConfirmModal({ onConfirm, onCancel, type, msgText }) {
  const isAll = type === 'everyone';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '28px 28px 22px',
        width: 340, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        border: '1px solid #e0e0e0', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{isAll ? '🗑️' : '✕'}</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1B5E20', marginBottom: 8 }}>
          {isAll ? 'Delete for Everyone?' : 'Delete for Me?'}
        </div>
        <div style={{
          fontSize: 12, color: '#6B7280', marginBottom: 6,
          background: '#F5F9F6', borderRadius: 8, padding: '8px 12px',
          maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', fontStyle: 'italic',
        }}>
          "{msgText?.length > 60 ? msgText.slice(0, 60) + '…' : msgText}"
        </div>
        <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 20 }}>
          {isAll
            ? 'This message will be removed for all participants.'
            : 'This message will only be removed from your view.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', border: '2px solid #e0e0e0',
              borderRadius: 8, background: '#fff', color: '#555',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = '#f5f5f5'; }}
            onMouseLeave={e => { e.target.style.background = '#fff'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', border: 'none',
              borderRadius: 8,
              background: isAll
                ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                : 'linear-gradient(135deg,#F44336,#e53935)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.target.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.target.style.opacity = '1'; }}
          >
            {isAll ? 'Delete for All' : 'Delete for Me'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Conversation view ─────────────────────────────────────────────────────  */
function ConversationView({ partner, onBack, myId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type, msgText }
  const endRef = useRef(null);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await apiClient.get(`/manager-chat/conversation/${partner.id}`);
      const newMsgs = r.data || [];
      setMessages(prev => {
        // Show in-app notification for new incoming messages
        const incoming = newMsgs.filter(m => m.receiver_user_id === myId && !m.seen_at);
        if (incoming.length > prev.filter(m => m.receiver_user_id === myId && !m.seen_at).length) {
          const newest = incoming[incoming.length - 1];
          if (newest) {
            toast(`💬 ${partner.name}: ${newest.message.length > 50 ? newest.message.slice(0, 50) + '…' : newest.message}`, {
              style: { background: '#1B5E20', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 8 },
              duration: 3500,
            });
          }
        }
        return newMsgs;
      });
    } catch (_) {}
    setLoading(false);
  }, [partner.id, myId, partner.name]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow textarea
  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await apiClient.post('/manager-chat/send', { receiverId: partner.id, message: text.trim() });
      setMessages(prev => [...prev, r.data]);
      setText('');
      if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send message';
      toast.error(msg, { style: { fontSize: 13 } });
    }
    setSending(false);
  };

  const requestDelete = (id, type, msgText) => {
    setDeleteConfirm({ id, type, msgText });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await apiClient.delete(`/manager-chat/${id}?type=${type}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success(type === 'everyone' ? 'Deleted for everyone' : 'Deleted for you', {
        style: { fontSize: 13 },
        duration: 2000,
      });
    } catch (_) {
      toast.error('Could not delete message', { style: { fontSize: 13 } });
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmt = dt => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          type={deleteConfirm.type}
          msgText={deleteConfirm.msgText}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '2px solid #E8F4EC', background: 'linear-gradient(135deg,#1B5E20,#2E8B57)', color: '#fff', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 0, padding: '5px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>← Back</button>
        <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={38} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{partner.name}</div>
          <div style={{ fontSize: 11, opacity: 0.8, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: '1px 8px', display: 'inline-block', marginTop: 2 }}>{partner.role}</div>
          {partner.phone && (
            <div style={{ fontSize: 11, opacity: 0.8, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: '1px 8px', display: 'inline-block', marginTop: 2, marginLeft: 6 }}>📞 {partner.phone}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F5F9F6' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: G.olive, marginTop: 40, fontSize: 13 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: G.gray, marginTop: 60, fontSize: 13 }}>
            <div style={{ fontSize: 36, opacity: 0.3 }}>💬</div>
            No messages yet. Say hello!
          </div>
        ) : messages.map(m => {
          const isMine = m.sender_user_id === myId;
          const seen = isMine && m.seen_at;
          return (
            <div key={m.id} className="mc-bubble-wrap" style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
              {!isMine && <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={28} />}
              {isMine && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="mc-delete-btn" title="Delete for me" onClick={() => requestDelete(m.id, 'me', m.message)}>✕ Me</button>
                  <button className="mc-delete-btn" title="Delete for everyone" onClick={() => requestDelete(m.id, 'everyone', m.message)}>✕ All</button>
                </div>
              )}
              <div className="mc-bubble" style={{
                maxWidth: '72%', padding: '10px 14px', borderRadius: 0,
                background: isMine ? 'linear-gradient(135deg,#1B5E20,#2E8B57)' : '#fff',
                color: isMine ? '#fff' : G.darkText,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderBottomRightRadius: isMine ? 0 : 12,
                borderBottomLeftRadius: isMine ? 12 : 0,
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.message}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 10, opacity: 0.65 }}>{fmt(m.created_at)}</span>
                  {isMine && (
                    <span style={{ fontSize: 11, opacity: 0.8 }}>
                      {seen ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
              {!isMine && (
                <button className="mc-delete-btn" title="Delete for me" onClick={() => requestDelete(m.id, 'me', m.message)}>✕ Me</button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '2px solid #E8F4EC', background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{ flex: 1, border: '2px solid #A5D6A7', borderRadius: 24, padding: '9px 16px', background: '#F9FFF9', display: 'flex', alignItems: 'center' }}>
          <textarea
            ref={textareaRef}
            className="mc-input"
            rows={1}
            placeholder="Write a message…"
            value={text}
            onChange={e => { setText(e.target.value); adjustTextarea(); }}
            onKeyDown={handleKey}
            style={{ flex: 1 }}
          />
        </div>
        <button className="mc-send-btn" onClick={send} disabled={sending || !text.trim()} title="Send">
          {sending ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Main ManagerChat component ────────────────────────────────────────────  */
export default function ManagerChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const r = await apiClient.get('/manager-chat/users');
      setUsers(r.data || []);
    } catch (_) {}
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Poll unread counts per user
  useEffect(() => {
    const poll = async () => {
      if (!users.length) return;
      const map = {};
      await Promise.all(users.map(async u => {
        try {
          const r = await apiClient.get(`/manager-chat/conversation/${u.id}`);
          const msgs = r.data || [];
          map[u.id] = msgs.filter(m => m.receiver_user_id === user?.id && !m.seen_at).length;
        } catch (_) {}
      }));
      setUnreadMap(map);
    };
    poll();
    const interval = setInterval(poll, 6000);
    return () => clearInterval(interval);
  }, [users, user]);

  useEffect(() => {
    if (showAdmin) {
      apiClient.get('/manager-chat/admin/users').then(r => setAdminUsers(r.data || [])).catch(console.error);
    }
  }, [showAdmin]);

  const toggleAccess = async (id) => {
    const targetUser = adminUsers.find(u => u.id === id);
    if (!targetUser) return;
    const previousState = targetUser.chat_enabled;
    const newState = !previousState;

    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, chat_enabled: newState } : u));
    setUsers(prev => {
      if (!newState) return prev.filter(u => u.id !== id);
      if (!prev.some(u => u.id === id)) return [...prev, { ...targetUser, chat_enabled: newState }];
      return prev;
    });
    if (!newState && selected?.id === id) setSelected(null);

    try {
      await apiClient.patch(`/manager-chat/admin/users/${id}/toggle`);
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to update access');
      setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, chat_enabled: previousState } : u));
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ margin: '-24px', background: '#E8F4EC', minHeight: 'calc(100vh - 64px)', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Toaster position="top-right" />
      <Styles />
      <div style={{ padding: '2rem 2.5rem', animation: 'fadeUp 0.35s ease' }}>
        {/* Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: G.forest, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            💬 Manager Chat
            {user?.roles?.includes('CEO') && (
              <button 
                onClick={() => setShowAdmin(true)}
                style={{ marginLeft: 'auto', background: '#2E8B57', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                ⚙️ Manage Access
              </button>
            )}
          </h1>
          <p style={{ color: G.olive, margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>Private conversations between managers</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, height: 'calc(100vh - 200px)' }}>
          {/* Contact list */}
          <div className="mc-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '2px solid #E8F4EC', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Contacts ({filtered.length})
                </div>
                <button 
                  onClick={fetchUsers} 
                  disabled={loadingUsers}
                  title="Refresh contacts"
                  style={{ background: 'none', border: 'none', cursor: loadingUsers ? 'default' : 'pointer', padding: 4, color: G.forest, borderRadius: 4, display: 'flex', alignItems: 'center', opacity: loadingUsers ? 0.5 : 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loadingUsers ? 'spin 1s linear infinite' : 'none' }}>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                  </svg>
                </button>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or role…"
                style={{ width: '100%', border: '1.5px solid #A5D6A7', borderRadius: 0, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingUsers ? (
                <div style={{ padding: 20, textAlign: 'center', color: G.gray, fontSize: 13 }}>Loading contacts…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: G.gray, fontSize: 13 }}>No contacts found</div>
              ) : filtered.map(u => {
                const unread = unreadMap[u.id] || 0;
                const isSelected = selected?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`mc-contact-row${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelected(u)}
                  >
                    <Avatar name={u.name} role={u.role} avatar={u.avatar} size={40} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: G.darkText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: roleColor(u.role), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.role}</div>
                    </div>
                    {unread > 0 && (
                      <div style={{ background: G.red, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {unread > 9 ? '9+' : unread}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="mc-card" style={{ padding: 0, overflow: 'hidden' }}>
            {selected ? (
              <ConversationView
                partner={selected}
                myId={user?.id}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: G.gray }}>
                <div style={{ fontSize: 60, opacity: 0.2, marginBottom: 16 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Select a contact</div>
                <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>Choose a manager from the list to start chatting</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 500, maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: G.forest }}>Chat Access Control</h2>
              <button onClick={() => setShowAdmin(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: G.gray }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }}>
              {!adminUsers || adminUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: G.gray, padding: 20 }}>Loading users...</div>
              ) : (
                adminUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={u.name} role={u.role} avatar={u.avatar} size={36} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: G.gray }}>{u.role}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleAccess(u.id)}
                      style={{ 
                        background: u.chat_enabled ? '#4CAF50' : '#F44336', 
                        color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, 
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', width: 70, textAlign: 'center'
                      }}>
                      {u.chat_enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
