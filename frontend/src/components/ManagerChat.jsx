import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";
import toast, { Toaster } from 'react-hot-toast';
import styles from './ManagerChat.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJIS = [
  '👍','❤️','😂','😮','😢','🔥','👏','🎉','💯','✅','🙏','✨',
  '🙌','😁','😎','🤔','👎','💔','😡','🤢','🚀','🌟','👀','💡',
  '🎈','🎊','🏆','💪','🤝','👋','👌','✌️','🤘','🤙','🖐','🖖',
  '✋','🤚','💅','🤷','🤦','🤸','🏃','💃','🕺','🗣','🧠','🫂','💌','💣'
];

const ROLE_COLORS = {
  'CEO':'#7C3AED','Admin':'#2563EB','HR Manager':'#ec4899',
  'Car Rental Manager':'#0ea5e9','Printing Supervisor':'#6B8E23',
  'Printing Manager':'#6B8E23','Pharmacy Manager':'#ef4444',
  'Sales Manager':'#f59e0b','Purchase Manager':'#8b5cf6',
  'Board Member':'#14b8a6','General Store Manager':'#059669',
  'Pharmacy Store Manager':'#dc2626',
};
const roleColor = r => ROLE_COLORS[r] || '#2563EB';

const BASE = ((apiClient.defaults?.baseURL || 'http://localhost:5000/api/v1').replace('/api/v1','')).replace(/\/+$/, '');

// ─── Segmented Spinner ────────────────────────────────────────────────────────
function SegmentedSpinner({ size = 18 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
        WebkitMask: `radial-gradient(circle, transparent ${size*0.35}px, black ${size*0.38}px)`,
        mask: `radial-gradient(circle, transparent ${size*0.35}px, black ${size*0.38}px)`,
        animation: 'spin 1s steps(12,end) infinite',
      }}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, role, size = 40, avatar = null }) => {
  if (avatar) {
    const src = avatar.startsWith('http') ? avatar : `${BASE}/${avatar}`;
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: roleColor(role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0, userSelect: 'none' }}>
      {initials}
    </div>
  );
};

// ─── File Bubble ──────────────────────────────────────────────────────────────
function FileBubble({ fileUrl, fileName, fileType, isMine, onImageClick }) {
  const href = fileUrl?.startsWith('http') ? fileUrl : `${BASE}${fileUrl}`;
  const isImage = fileType?.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const icon = isImage ? '🖼️' : isPdf ? '📄' : '📎';

  if (isImage) {
    return (
      <div onClick={() => onImageClick && onImageClick(href)} style={{ display: 'block', marginTop: 8, cursor: 'pointer' }}>
        <img src={href} alt={fileName} style={{ maxWidth: 220, maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '2px solid rgba(255,255,255,0.25)' }} />
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={styles.fileBubble}>
      <span className={styles.fileIcon}>{icon}</span>
      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{fileName}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Download</div>
      </div>
    </a>
  );
}

// ─── Quoted Message ───────────────────────────────────────────────────────────
function QuotedMessage({ replyToId, messages, isMine }) {
  if (!replyToId) return null;
  const original = messages.find(m => m.id === replyToId);
  if (!original) return <div className={styles.quoteBlock}><div className={styles.quoteSnippet}>Replied to deleted message</div></div>;

  let snippet = original.message;
  if (!snippet) snippet = original.file_name ? `📎 ${original.file_name}` : 'Document';
  if (snippet.length > 50) snippet = snippet.slice(0, 50) + '…';

  return (
    <div className={styles.quoteBlock}>
      <div className={styles.quoteName}>{original.sender_name || 'You'}</div>
      <div className={styles.quoteSnippet}>{snippet}</div>
    </div>
  );
}

// ─── Reaction Tray ────────────────────────────────────────────────────────────
function ReactionTray({ reactionsJson, myId, onToggle }) {
  if (!reactionsJson) return null;
  let parsed = {};
  try { parsed = typeof reactionsJson === 'string' ? JSON.parse(reactionsJson) : reactionsJson; } catch (e) {}
  const entries = Object.entries(parsed).filter(([_, arr]) => arr && arr.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className={styles.reactionTray}>
      {entries.map(([emoji, arr]) => {
        const iReacted = arr.includes(myId);
        return (
          <div key={emoji} className={`${styles.reactionChip} ${iReacted ? styles.active : ''}`} onClick={() => onToggle(emoji)}>
            {emoji} <span style={{ fontSize: 11 }}>{arr.length}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ users, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const submit = async () => {
    if (!name.trim()) { toast.error('Group name required'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', desc);
      formData.append('memberIds', JSON.stringify(selected));
      if (photo) formData.append('profile_photo', photo);
      const r = await apiClient.post('/manager-chat/groups', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Group "${r.data.name || name}" created!`);
      onCreate(r.data);
      onClose();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to create group'); }
    setSaving(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>👥 Create Group</h2>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>
        <div className={styles.formField}>
          <label>Group Name *</label>
          <input className={styles.formInput} placeholder="Enter group name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Description (optional)</label>
          <input className={styles.formInput} placeholder="Short description" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Group Photo (optional)</label>
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className={styles.formInput} style={{ padding: '4px 8px', height: 'auto' }} />
        </div>
        <div className={styles.formField}>
          <label>Add Members</label>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border, #E5E7EB)', borderRadius: 8, padding: 8 }}>
            {users.map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} style={{ accentColor: '#2563EB' }} />
                <Avatar name={u.name} role={u.role} size={28} avatar={u.avatar} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                <span style={{ fontSize: 11, color: roleColor(u.role), fontWeight: 600 }}>{u.role}</span>
              </label>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={submit} disabled={saving}>
            {saving ? <><SegmentedSpinner size={14} /> Creating…</> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Members Panel ──────────────────────────────────────────────────────
function GroupMembersPanel({ group, myId, isCeo, allUsers, onClose, onLeft, onGroupUpdated }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addUserId, setAddUserId] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('profile_photo', file);
      const r = await apiClient.patch(`/manager-chat/groups/${group.id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Group photo updated');
      if (onGroupUpdated) onGroupUpdated({ ...group, profile_photo: r.data.profile_photo });
    } catch (err) { toast.error('Failed to update photo'); }
  };

  const fetchMembers = useCallback(async () => {
    try {
      const r = await apiClient.get(`/manager-chat/groups/${group.id}/members`);
      setMembers(r.data || []);
    } catch (_) {}
    setLoading(false);
  }, [group.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const removeMember = async (userId, name) => {
    try {
      await apiClient.delete(`/manager-chat/groups/${group.id}/members/${userId}`);
      setMembers(p => p.filter(m => m.id !== userId));
      toast.success(`${name} removed`);
    } catch (e) { toast.error('Failed to remove member'); }
  };

  const banMember = async (userId, name, currentBan) => {
    try {
      await apiClient.patch(`/manager-chat/groups/${group.id}/members/${userId}/ban`, { ban: !currentBan });
      setMembers(p => p.map(m => m.id === userId ? { ...m, is_banned: !currentBan } : m));
      toast.success(`${name} ${!currentBan ? 'banned' : 'unbanned'}`);
    } catch (e) { toast.error('Failed'); }
  };

  const addMember = async () => {
    if (!addUserId) return;
    try {
      await apiClient.post(`/manager-chat/groups/${group.id}/members`, { userId: parseInt(addUserId) });
      toast.success('Member added!');
      setAddUserId(''); setShowAdd(false); fetchMembers();
    } catch (e) { toast.error('Failed'); }
  };

  const leaveGroup = async () => {
    try {
      await apiClient.post(`/manager-chat/groups/${group.id}/leave`);
      toast.success('You left the group');
      onLeft(); onClose();
    } catch (e) { toast.error('Failed'); }
  };

  const memberIds = new Set(members.map(m => m.id));
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id));

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ width: 480 }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', cursor: (isCeo || group.created_by === myId) ? 'pointer' : 'default' }}>
              {group.profile_photo ? (
                <img src={group.profile_photo.startsWith('http') ? group.profile_photo : `${BASE}${group.profile_photo}`} alt={group.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
              )}
              {(isCeo || group.created_by === myId) && (
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} title="Change Group Photo" />
              )}
            </div>
            <h2 className={styles.modalTitle}>Members</h2>
          </div>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <SegmentedSpinner size={18} style={{ background: 'conic-gradient(from 0deg, rgba(37,99,235,0) 0%, rgba(37,99,235,1) 100%)' }} /> Loading…
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <Avatar name={m.name} role={m.role} size={32} avatar={m.avatar} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</span>
                  {m.id === myId && <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 6 }}>(you)</span>}
                  {m.id === group.created_by && <span style={{ fontSize: 11, color: '#7C3AED', marginLeft: 6 }}>Creator</span>}
                  {m.is_banned && <span style={{ fontSize: 11, color: '#DC2626', marginLeft: 6, fontWeight: 700 }}>BANNED</span>}
                </div>
                {m.id !== myId && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(isCeo || group.created_by === myId) && (
                      <button className={`${styles.btnPrimary} ${styles.btnDanger}`} style={{ height: 28, padding: '0 10px', fontSize: 12 }} onClick={() => removeMember(m.id, m.name)}>Remove</button>
                    )}
                    {isCeo && (
                      <button className={styles.btnSecondary} style={{ height: 28, padding: '0 10px', fontSize: 12, background: m.is_banned ? '#DCFCE7' : '#FEE2E2', borderColor: m.is_banned ? '#16A34A' : '#DC2626', color: m.is_banned ? '#16A34A' : '#DC2626' }} onClick={() => banMember(m.id, m.name, m.is_banned)}>
                        {m.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(isCeo || group.created_by === myId) && (
          <div style={{ marginBottom: 16 }}>
            {showAdd ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <select className={styles.formInput} style={{ flex: 1, height: 36 }} value={addUserId} onChange={e => setAddUserId(e.target.value)}>
                  <option value="">Select a user…</option>
                  {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
                <button className={styles.btnPrimary} onClick={addMember}>Add</button>
                <button className={styles.btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            ) : (
              <button className={styles.btnSecondary} onClick={() => setShowAdd(true)}>+ Add Member</button>
            )}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={leaveGroup}>🚪 Leave Group</button>
          <button className={styles.btnSecondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Conversation View ──────────────────────────────────────────────────
function GroupConversationView({ group, myId, isCeo, allUsers, onBack, onLeft, onImageClick, onGroupUpdated }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionId, setActiveReactionId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const endRef = useRef(null);
  const chatContainerRef = useRef(null);
  const initialLoadDone = useRef(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await apiClient.get(`/manager-chat/groups/${group.id}/messages`);
      const fresh = r.data || [];
      setMessages(prev => {
        if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
        return fresh;
      });
    } catch (e) {
      if (e?.message?.includes('403')) toast.error('You have been banned from this group');
    }
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    setLoading(true); setMessages([]); initialLoadDone.current = false;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (!initialLoadDone.current && messages.length > 0) {
      endRef.current?.scrollIntoView(); initialLoadDone.current = true;
    } else if (isNearBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilePreview({ file, name: file.name, type: file.type });
  };

  const send = async () => {
    if ((!text.trim() && !filePreview) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('message', text.trim());
      if (filePreview) fd.append('file', filePreview.file);
      if (replyingTo) fd.append('replyToId', replyingTo.id);
      const r = await apiClient.post(`/manager-chat/groups/${group.id}/messages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages(p => [...p, r.data]);
      setText(''); setFilePreview(null); setReplyingTo(null);
      if (fileRef.current) fileRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to send'); }
    setSending(false);
  };

  const react = async (msgId, emoji) => {
    setActiveReactionId(null);
    try {
      const r = await apiClient.post(`/manager-chat/groups/${group.id}/messages/${msgId}/react`, { emoji });
      setMessages(p => p.map(m => m.id === msgId ? { ...m, reactions: r.reactions } : m));
    } catch (e) { toast.error('Failed to react'); }
  };

  const deleteMsg = (m) => setDeleteConfirm({ msgId: m.id, msgText: m.message || m.file_name || 'File' });

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/manager-chat/groups/${group.id}/messages/${deleteConfirm.msgId}`);
      setMessages(p => p.filter(m => m.id !== deleteConfirm.msgId));
      toast.success('Message deleted');
    } catch (e) { toast.error('Failed to delete message'); }
    setDeleteConfirm(null);
  };

  const fmt = dt => { if (!dt) return ''; return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#111827' }}>Delete Message?</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, background: '#F9FAFB', padding: '8px 12px', borderRadius: 6 }}>
              &ldquo;{deleteConfirm.msgText?.slice(0, 80)}{deleteConfirm.msgText?.length > 80 ? '…' : ''}&rdquo;
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} style={{ flex: 1 }} onClick={confirmDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {showMembers && (
        <GroupMembersPanel group={group} myId={myId} isCeo={isCeo} allUsers={allUsers}
          onClose={() => setShowMembers(false)} onLeft={onLeft} onGroupUpdated={onGroupUpdated} />
      )}

      {/* Header */}
      <div className={styles.chatHeader}>
        <button onClick={onBack} className={styles.btnSecondary} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>← Back</button>
        {group.profile_photo ? (
          <img src={group.profile_photo.startsWith('http') ? group.profile_photo : `${BASE}${group.profile_photo}`} alt={group.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB' }} />
        ) : (
          <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
        )}
        <div className={styles.chatHeaderInfo}>
          <div className={styles.chatHeaderName}>{group.name}</div>
          <div className={styles.chatHeaderSub}>{group.member_count || 1} members{group.description ? ` • ${group.description}` : ''}</div>
        </div>
        <button className={styles.btnSecondary} onClick={() => setShowMembers(true)} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
          👥 Members
        </button>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className={styles.messagesArea} onClick={() => setActiveReactionId(null)}>
        {loading ? (
          <div className={styles.emptyChat}>
            <SegmentedSpinner size={32} />
            <span style={{ color: '#6B7280', fontSize: 14 }}>Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptySub}>Start the conversation!</p>
          </div>
        ) : messages.map(m => {
          const isMine = m.sender_user_id === myId;
          const canDelete = isMine || isCeo || group.created_by === myId;
          return (
            <div key={m.id} className={`${styles.bubbleWrap} ${isMine ? styles.mine : styles.theirs}`}
              style={{ position: 'relative' }}>
              {!isMine && <div className={styles.senderLabel}>{m.sender_name}</div>}
              <div className={styles.bubbleRow}>
                <div className={styles.bubble}>
                  <QuotedMessage replyToId={m.reply_to_id} messages={messages} isMine={isMine} />
                  {m.message && <div>{m.message}</div>}
                  {m.file_url && <FileBubble fileUrl={m.file_url} fileName={m.file_name} fileType={m.file_type} isMine={isMine} onImageClick={onImageClick} />}
                  <div className={styles.msgTime}>{fmt(m.created_at)}</div>
                </div>
                <div className={styles.msgActions}>
                  <button className={styles.actionBtn} title="Reply" onClick={() => setReplyingTo(m)}>↩️</button>
                  <button className={styles.actionBtn} title="React" onClick={e => { e.stopPropagation(); setActiveReactionId(activeReactionId === m.id ? null : m.id); }}>😊</button>
                  {canDelete && <button className={`${styles.actionBtn} ${styles.del}`} title="Delete" onClick={() => deleteMsg(m)}>✕</button>}
                </div>
              </div>
              {activeReactionId === m.id && (
                <div className={styles.reactionPicker} onClick={e => e.stopPropagation()}>
                  {EMOJIS.map(e => <button key={e} className={styles.emojiBtn} onClick={() => react(m.id, e)}>{e}</button>)}
                </div>
              )}
              <ReactionTray reactionsJson={m.reactions} myId={myId} onToggle={e => react(m.id, e)} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className={styles.previewRow}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#2563EB', marginBottom: 2 }}>Replying to {replyingTo.sender_name || 'You'}</div>
            <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
              {replyingTo.message || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : 'Document')}
            </div>
          </div>
          <button className={styles.previewClose} onClick={() => setReplyingTo(null)}>✕</button>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className={styles.previewRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📎</span>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{filePreview.name}</span>
          </div>
          <button className={styles.previewClose} onClick={() => { setFilePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
        <button className={styles.attachBtn} onClick={() => fileRef.current?.click()} title="Attach file">📎</button>
        <div className={styles.inputWrapper}>
          <textarea ref={textareaRef} className={styles.msgInput} rows={1} placeholder="Write a message…" value={text}
            onChange={e => { setText(e.target.value); adjustTextarea(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        </div>
        <button className={styles.sendBtn} onClick={send} disabled={sending || (!text.trim() && !filePreview)}>
          {sending ? <SegmentedSpinner size={18} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
        </button>
      </div>
    </div>
  );
}

// ─── DM Conversation View ─────────────────────────────────────────────────────
function ConversationView({ partner, onBack, myId, onImageClick }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionId, setActiveReactionId] = useState(null);

  const endRef = useRef(null);
  const chatContainerRef = useRef(null);
  const initialLoadDone = useRef(false);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await apiClient.get(`/manager-chat/conversation/${partner.id}`);
      const fresh = r.data || [];
      setMessages(prev => {
        if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
        return fresh;
      });
    } catch (_) {}
    setLoading(false);
  }, [partner.id]);

  useEffect(() => {
    setLoading(true); setMessages([]); initialLoadDone.current = false;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (!initialLoadDone.current && messages.length > 0) {
      endRef.current?.scrollIntoView(); initialLoadDone.current = true;
    } else if (isNearBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilePreview({ file, name: file.name, type: file.type });
  };

  const send = async () => {
    if ((!text.trim() && !filePreview) || sending) return;
    setSending(true);
    try {
      let r;
      if (filePreview) {
        const fd = new FormData();
        fd.append('receiverId', partner.id);
        fd.append('file', filePreview.file);
        if (text.trim()) fd.append('message', text.trim());
        if (replyingTo) fd.append('replyToId', replyingTo.id);
        r = await apiClient.post('/manager-chat/send-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        r = await apiClient.post('/manager-chat/send', { receiverId: partner.id, message: text.trim(), replyToId: replyingTo ? replyingTo.id : null });
      }
      setMessages(p => [...p, r.data]);
      setText(''); setFilePreview(null); setReplyingTo(null);
      if (fileRef.current) fileRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to send'); }
    setSending(false);
  };

  const react = async (msgId, emoji) => {
    setActiveReactionId(null);
    try {
      const r = await apiClient.post(`/manager-chat/react/${msgId}`, { emoji });
      setMessages(p => p.map(m => m.id === msgId ? { ...m, reactions: r.reactions } : m));
    } catch (e) { toast.error('Failed to react'); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await apiClient.delete(`/manager-chat/${id}?type=${type}`);
      setMessages(p => p.filter(m => m.id !== id));
      toast.success(type === 'everyone' ? 'Deleted for everyone' : 'Deleted for you', { duration: 2000 });
    } catch (_) { toast.error('Could not delete'); }
  };

  const fmt = dt => { if (!dt) return ''; return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Delete Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{deleteConfirm.type === 'everyone' ? '🗑️' : '✕'}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#111827' }}>{deleteConfirm.type === 'everyone' ? 'Delete for Everyone?' : 'Delete for Me?'}</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, background: '#F9FAFB', padding: '8px 12px', borderRadius: 6 }}>
              &ldquo;{deleteConfirm.msgText?.slice(0, 60)}{deleteConfirm.msgText?.length > 60 ? '…' : ''}&rdquo;
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} style={{ flex: 1 }} onClick={confirmDelete}>
                {deleteConfirm.type === 'everyone' ? 'Delete for All' : 'Delete for Me'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.chatHeader}>
        <button onClick={onBack} className={styles.btnSecondary} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>← Back</button>
        <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={40} />
        <div className={styles.chatHeaderInfo}>
          <div className={styles.chatHeaderName}>{partner.name}</div>
          <div className={styles.chatHeaderSub}>
            <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>{partner.role}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className={styles.messagesArea} onClick={() => setActiveReactionId(null)}>
        {loading ? (
          <div className={styles.emptyChat}>
            <SegmentedSpinner size={32} />
            <span style={{ color: '#6B7280', fontSize: 14 }}>Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptySub}>Say hello!</p>
          </div>
        ) : messages.map(m => {
          const isMine = m.sender_user_id === myId;
          const seen = isMine && m.seen_at;
          m.sender_name = isMine ? 'You' : partner.name;
          return (
            <div key={m.id} className={`${styles.bubbleWrap} ${isMine ? styles.mine : styles.theirs}`} style={{ position: 'relative' }}>
              {!isMine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={24} />
                </div>
              )}
              <div className={styles.bubbleRow}>
                <div className={styles.bubble}>
                  <QuotedMessage replyToId={m.reply_to_id} messages={messages} isMine={isMine} />
                  {m.message && <div>{m.message}</div>}
                  {m.file_url && <FileBubble fileUrl={m.file_url} fileName={m.file_name} fileType={m.file_type} isMine={isMine} onImageClick={onImageClick} />}
                  <div className={styles.msgTime}>
                    <span>{fmt(m.created_at)}</span>
                    {isMine && <span style={{ fontSize: 11 }}>{seen ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
                <div className={styles.msgActions}>
                  <button className={styles.actionBtn} title="Reply" onClick={() => setReplyingTo(m)}>↩️</button>
                  <button className={styles.actionBtn} title="React" onClick={e => { e.stopPropagation(); setActiveReactionId(activeReactionId === m.id ? null : m.id); }}>😊</button>
                  {isMine && <button className={`${styles.actionBtn} ${styles.del}`} title="Delete for all" onClick={() => setDeleteConfirm({ id: m.id, type: 'everyone', msgText: m.message || m.file_name })}>✕</button>}
                  <button className={`${styles.actionBtn} ${styles.del}`} title="Delete for me" onClick={() => setDeleteConfirm({ id: m.id, type: 'me', msgText: m.message || m.file_name })}>🗑️</button>
                </div>
              </div>
              {activeReactionId === m.id && (
                <div className={styles.reactionPicker} onClick={e => e.stopPropagation()}>
                  {EMOJIS.map(e => <button key={e} className={styles.emojiBtn} onClick={() => react(m.id, e)}>{e}</button>)}
                </div>
              )}
              <ReactionTray reactionsJson={m.reactions} myId={myId} onToggle={e => react(m.id, e)} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className={styles.previewRow}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#2563EB', marginBottom: 2 }}>Replying to {replyingTo.sender_user_id === myId ? 'You' : partner.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
              {replyingTo.message || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : 'Document')}
            </div>
          </div>
          <button className={styles.previewClose} onClick={() => setReplyingTo(null)}>✕</button>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className={styles.previewRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📎</span>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{filePreview.name}</span>
          </div>
          <button className={styles.previewClose} onClick={() => { setFilePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
        <button className={styles.attachBtn} onClick={() => fileRef.current?.click()} title="Attach file">📎</button>
        <div className={styles.inputWrapper}>
          <textarea ref={textareaRef} className={styles.msgInput} rows={1} placeholder="Write a message…" value={text}
            onChange={e => { setText(e.target.value); adjustTextarea(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        </div>
        <button className={styles.sendBtn} onClick={send} disabled={sending || (!text.trim() && !filePreview)}>
          {sending ? <SegmentedSpinner size={18} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
        </button>
      </div>
    </div>
  );
}

// ─── Main ManagerChat ─────────────────────────────────────────────────────────
export default function ManagerChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('dm');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const isCeo = user?.roles?.includes('CEO') || user?.role === 'CEO';
  const myId = user?.id;

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const r = await apiClient.get('/manager-chat/users'); setUsers(r.data || []); } catch (_) {}
    setLoadingUsers(false);
  }, []);

  const fetchGroups = useCallback(async () => {
    try { const r = await apiClient.get('/manager-chat/groups'); setGroups(r.data || []); } catch (_) {}
  }, []);

  useEffect(() => { fetchUsers(); fetchGroups(); }, [fetchUsers, fetchGroups]);
  useEffect(() => { if (tab === 'groups') fetchGroups(); }, [tab, fetchGroups]);

  useEffect(() => {
    const poll = async () => {
      try { const r = await apiClient.get('/manager-chat/unread-counts'); setUnreadMap(r.data || {}); } catch (_) {}
    };
    poll();
  }, []);

  useEffect(() => {
    if (showAdmin) apiClient.get('/manager-chat/admin/users').then(r => setAdminUsers(r.data || [])).catch(console.error);
  }, [showAdmin]);

  const toggleAccess = async (id) => {
    const target = adminUsers.find(u => u.id === id);
    if (!target) return;
    const prev = target.chat_enabled;
    setAdminUsers(p => p.map(u => u.id === id ? { ...u, chat_enabled: !prev } : u));
    try { await apiClient.patch(`/manager-chat/admin/users/${id}/toggle`); }
    catch (e) { toast.error('Failed'); setAdminUsers(p => p.map(u => u.id === id ? { ...u, chat_enabled: prev } : u)); }
  };

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.role?.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container}>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 14 } }} />

      {/* Global @keyframes for spinner */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Image Preview */}
      {previewImage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewImage(null)} style={{ background: 'rgba(0,0,0,0.85)', padding: 40 }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: -36, right: -36, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 36, height: 36, border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal users={users}
          onClose={() => setShowCreateGroup(false)}
          onCreate={g => { setGroups(p => [...p, g]); setTab('groups'); }} />
      )}

      {/* Admin Access Control Modal */}
      {showAdmin && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚙️ Chat Access Control</h2>
              <button onClick={() => setShowAdmin(false)} className={styles.modalClose}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {adminUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={u.name} role={u.role} avatar={u.avatar} size={36} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{u.role}</div>
                    </div>
                  </div>
                  <button onClick={() => toggleAccess(u.id)} style={{ background: u.chat_enabled ? '#DCFCE7' : '#FEE2E2', color: u.chat_enabled ? '#16A34A' : '#DC2626', border: `1px solid ${u.chat_enabled ? '#16A34A' : '#DC2626'}`, padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 60 }}>
                    {u.chat_enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1>Manager Chat</h1>
          <p>Private messages &amp; group chats</p>
        </div>
        <div className={styles.headerActions}>
          {isCeo && <button className={styles.btnPrimary} onClick={() => setShowCreateGroup(true)}>👥 New Group</button>}
          {isCeo && <button className={styles.btnSecondary} onClick={() => setShowAdmin(true)}>⚙️ Manage Access</button>}
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.chatGrid}>
        {/* Sidebar */}
        <div className={`${styles.card} ${styles.sidebarCol}`}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tabBtn} ${tab === 'dm' ? styles.active : ''}`} onClick={() => { setTab('dm'); setSelected(null); }}>
              💬 Chats
            </button>
            <button className={`${styles.tabBtn} ${tab === 'groups' ? styles.active : ''}`} onClick={() => { setTab('groups'); setSelected(null); }}>
              👥 Groups
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…" />
          </div>

          {/* Contact / Group List */}
          <div className={styles.contactList}>
            {tab === 'dm' ? (
              loadingUsers ? (
                <div style={{ padding: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6B7280', fontSize: 13 }}>
                  <SegmentedSpinner size={18} /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No contacts found</div>
              ) : filtered.map(u => {
                const unread = unreadMap[u.id] || 0;
                const isSel = selected?.type === 'dm' && selected.data.id === u.id;
                return (
                  <div key={u.id} className={`${styles.contactRow} ${isSel ? styles.selected : ''}`} onClick={() => setSelected({ type: 'dm', data: u })}>
                    <Avatar name={u.name} role={u.role} avatar={u.avatar} size={40} />
                    <div className={styles.contactInfo}>
                      <div className={styles.contactName}>{u.name}</div>
                      <div className={styles.contactRole} style={{ color: roleColor(u.role) }}>{u.role}</div>
                    </div>
                    {unread > 0 && <span className={styles.unreadBadge}>{unread > 9 ? '9+' : unread}</span>}
                  </div>
                );
              })
            ) : (
              filteredGroups.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  No groups yet.{' '}
                  {isCeo && <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowCreateGroup(true)}>Create one!</span>}
                </div>
              ) : filteredGroups.map(g => {
                const isSel = selected?.type === 'group' && selected.data.id === g.id;
                return (
                  <div key={g.id} className={`${styles.contactRow} ${isSel ? styles.selected : ''}`} onClick={() => setSelected({ type: 'group', data: g })}>
                    {g.profile_photo ? (
                      <img src={g.profile_photo.startsWith('http') ? g.profile_photo : `${BASE}${g.profile_photo}`} alt={g.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👥</div>
                    )}
                    <div className={styles.contactInfo}>
                      <div className={styles.contactName}>{g.name}</div>
                      <div className={styles.contactRole}>{g.member_count || 1} members{g.description ? ` • ${g.description}` : ''}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${styles.card} ${styles.chatCol}`}>
          {selected ? (
            selected.type === 'dm' ? (
              <ConversationView partner={selected.data} myId={myId} onBack={() => setSelected(null)} onImageClick={setPreviewImage} />
            ) : (
              <GroupConversationView
                group={selected.data} myId={myId} isCeo={isCeo} allUsers={users}
                onBack={() => setSelected(null)}
                onLeft={() => { setGroups(p => p.filter(g => g.id !== selected.data.id)); setSelected(null); }}
                onImageClick={setPreviewImage}
                onGroupUpdated={updatedGroup => {
                  setSelected({ type: 'group', data: updatedGroup });
                  setGroups(p => p.map(g => g.id === updatedGroup.id ? updatedGroup : g));
                }}
              />
            )
          ) : (
            <div className={styles.emptyChat}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyTitle}>Select a chat or group</p>
              <p className={styles.emptySub}>Choose from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
