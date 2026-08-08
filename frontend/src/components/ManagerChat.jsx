import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";
import toast, { Toaster } from 'react-hot-toast';

const G = {
  forest: '#1B5E20', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  olive: '#6B8E23', white: '#FFFFFF', light: '#F5F5F5', gray: '#9E9E9E',
  red: '#F44336', blue: '#3b82f6', darkText: '#1a1a2e'
};

const EMOJIS = [
  '👍','❤️','😂','😮','😢','🔥','👏','🎉','💯','✅','🙏','✨',
  '🙌','😁','😎','🤔','👎','💔','😡','🤢','🚀','🌟','👀','💡',
  '🎈','🎊','🏆','💪','🤝','👋','👌','✌️','🤘','🤙','🖐','🖖',
  '✋','🤚','💅','🤷','🤦','🤸','🏃','💃','🕺','🗣','🧠','🫂','💌','💣'
];

const Styles = () => (
  <style>{`
    @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .mc-card { position:relative; overflow:hidden; border-radius:0; background:#fff;
      box-shadow:0 2px 14px rgba(0,80,40,0.08); transition:box-shadow 0.3s,transform 0.3s;
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
    
    .mc-bubble { animation:msgIn 0.2s ease both; word-break:break-word; position:relative; }
    .mc-msg-actions { opacity:0; transition:opacity 0.2s; display:flex; gap:4px; align-items:center; }
    .mc-bubble-wrap:hover .mc-msg-actions { opacity:1; }
    
    .mc-action-btn { background:rgba(27,94,32,0.12); border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; color:#1B5E20; font-size:14px; font-weight:700; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition: background 0.15s; }
    .mc-action-btn:hover { background:rgba(27,94,32,0.25); }
    .mc-action-btn.delete { color:#F44336; }
    .mc-action-btn.delete:hover { background:rgba(244,67,54,0.15); }

    .mc-bubble-wrap { position: relative; z-index: 1; }
    .mc-bubble-wrap.reacting { z-index: 100; }

    .mc-reaction-picker {
      display:none; position:absolute; top:100%; margin-top:6px;
      background:#fff; border:1px solid #E8F4EC;
      box-shadow:0 6px 20px rgba(0,60,30,0.18); border-radius:14px;
      padding:10px 12px; width:290px; flex-wrap:wrap; gap:6px; z-index:200;
    }
    .mc-bubble-wrap.mine .mc-reaction-picker { right: 0; }
    .mc-bubble-wrap.theirs .mc-reaction-picker { left: 0; }
    .mc-reaction-picker.open { display:flex; }
    .mc-reaction-picker span { cursor:pointer; font-size:20px; transition:transform 0.12s; display:inline-block; }
    .mc-reaction-picker span:hover { transform:scale(1.35); }

    .mc-reaction-tray { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; margin-bottom:2px; }
    .mc-reaction-tray.left { justify-content:flex-start; padding-left:6px; }
    .mc-reaction-tray.right { justify-content:flex-end; padding-right:6px; }
    .mc-reaction-chip { background:#fff; border:1.5px solid #d4edda; border-radius:20px; padding:2px 8px; font-size:12px; display:inline-flex; align-items:center; gap:3px; cursor:pointer; color:#1B5E20; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,0.10); transition: background 0.15s; }
    .mc-reaction-chip:hover { background:#f0faf3; }
    .mc-reaction-chip.active { background:#d4f0db; border-color:#1B5E20; }
    
    .mc-quote { border-left:3px solid #2E8B57; background:rgba(46,139,87,0.08); padding:6px 10px; margin-bottom:8px; font-size:12px; color:inherit; cursor:pointer; }
    
    .mc-input{width:100%;border:none;outline:none;background:transparent;font-size:14px;font-family:inherit;resize:none;padding:0;line-height:1.6;overflow-y:hidden;display:block;color:#1a1a2e;}
    .mc-input::-webkit-scrollbar{display:none;}
    .mc-send-btn{background:#1B5E20;color:#fff;border:none;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s,transform 0.15s;flex-shrink:0;padding:0;}
    .mc-send-btn:hover{background:#2E8B57;transform:scale(1.08);}
    .mc-send-btn:active{transform:scale(0.95);}
    .mc-send-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
    .mc-attach-btn{background:rgba(27,94,32,0.08);color:#1B5E20;border:none;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s;flex-shrink:0;}
    .mc-attach-btn:hover{background:rgba(27,94,32,0.18);}
    .mc-file-bubble{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;margin-top:4px;cursor:pointer;text-decoration:none;}
    .mc-tab{padding:8px 16px;border:none;cursor:pointer;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.07em;transition:all 0.2s;background:transparent;color:#9E9E9E;border-bottom:3px solid transparent;}
    .mc-tab.active{color:#1B5E20;border-bottom:3px solid #1B5E20;}
    .mc-modal-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;animation:fadeUp 0.2s ease;}
    .mc-modal{background:#fff;border-radius:0;padding:28px;width:460px;max-width:94vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);}
    .mc-field{width:100%;border:2px solid #A5D6A7;padding:8px 12px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:10px;}
    .mc-field:focus{border-color:#1B5E20;}
    .mc-btn{padding:9px 18px;border:none;cursor:pointer;font-weight:700;font-size:13px;transition:opacity 0.2s;}
    .mc-btn:hover{opacity:0.85;}
    .mc-btn-green{background:#1B5E20;color:#fff;}
    .mc-btn-red{background:#F44336;color:#fff;}
    .mc-btn-gray{background:#e0e0e0;color:#555;}
    .mc-member-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;}
  `}</style>
);

const ROLE_COLORS = {
  'CEO':'#7C3AED','Admin':'#3b82f6','HR Manager':'#ec4899',
  'Car Rental Manager':'#0ea5e9','Printing Supervisor':'#6B8E23',
  'Printing Manager':'#6B8E23','Pharmacy Manager':'#ef4444',
  'Sales Manager':'#f59e0b','Purchase Manager':'#8b5cf6',
  'Board Member':'#14b8a6','General Store Manager':'#059669',
  'Pharmacy Store Manager':'#dc2626',
};
const roleColor = r => ROLE_COLORS[r] || G.emerald;
const BASE = ((apiClient.defaults?.baseURL || 'http://localhost:5000/api/v1').replace('/api/v1','')).replace(/\/+$/, '');

const Avatar = ({ name, role, size=40, avatar=null }) => {
  if (avatar) {
    const src = avatar.startsWith('http') ? avatar : `${BASE}/${avatar}`;
    return <img src={src} alt={name} style={{width:size,height:size,borderRadius:0,objectFit:'cover',flexShrink:0}} />;
  }
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:0,background:roleColor(role),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:size*0.35,flexShrink:0,userSelect:'none'}}>
      {initials}
    </div>
  );
};

// ─── Render Helpers ────────────────────────────────────────────────────────
function FileBubble({ fileUrl, fileName, fileType, isMine, onImageClick }) {
  const href = fileUrl?.startsWith('http') ? fileUrl : `${BASE}${fileUrl}`;
  const isImage = fileType?.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const icon = isImage ? '🖼️' : isPdf ? '📄' : '📎';
  if (isImage) {
    return (
      <div onClick={() => onImageClick && onImageClick(href)} style={{display:'block',marginTop:4}}>
        <img src={href} alt={fileName} style={{maxWidth:220,maxHeight:180,objectFit:'cover',border:'2px solid rgba(255,255,255,0.3)',cursor:'pointer'}} />
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mc-file-bubble">
      <span style={{fontSize:22}}>{icon}</span>
      <div>
        <div style={{fontWeight:700,fontSize:12,color:isMine?'#fff':'#1B5E20',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fileName}</div>
        <div style={{fontSize:10,opacity:0.7,color:isMine?'#d4edda':'#555'}}>Download</div>
      </div>
    </a>
  );
}

function QuotedMessage({ replyToId, messages, isMine }) {
  if (!replyToId) return null;
  const original = messages.find(m => m.id === replyToId);
  if (!original) return <div className="mc-quote">Replied to deleted message</div>;
  
  let snippet = original.message;
  if (!snippet) snippet = original.file_name ? `📎 ${original.file_name}` : 'Document';
  if (snippet.length > 50) snippet = snippet.slice(0,50) + '…';

  return (
    <div className="mc-quote" style={{borderColor: isMine?'#A5D6A7':'#2E8B57'}}>
      <div style={{fontWeight:800,marginBottom:2}}>{original.sender_name || 'You'}</div>
      <div style={{opacity:0.9}}>{snippet}</div>
    </div>
  );
}

function ReactionTray({ reactionsJson, myId, onToggle, alignLeft }) {
  if (!reactionsJson) return null;
  let parsed = {};
  try { parsed = typeof reactionsJson === 'string' ? JSON.parse(reactionsJson) : reactionsJson; } catch(e){}
  const entries = Object.entries(parsed).filter(([_, arr]) => arr && arr.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className={`mc-reaction-tray ${alignLeft ? 'left' : 'right'}`}>
      {entries.map(([emoji, arr]) => {
        const iReacted = arr.includes(myId);
        return (
          <div key={emoji} className={`mc-reaction-chip ${iReacted ? 'active' : ''}`} onClick={()=>onToggle(emoji)}>
            {emoji} <span style={{fontSize:11}}>{arr.length}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Create Group Modal ──────────────────────────────────────────────────────
function CreateGroupModal({ users, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const submit = async () => {
    if (!name.trim()) { toast.error('Group name required'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', desc);
      formData.append('memberIds', JSON.stringify(selected));
      if (photo) formData.append('profile_photo', photo);

      const r = await apiClient.post('/manager-chat/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Group "${r.data.name || name}" created!`, { style:{background:'#1B5E20',color:'#fff'} });
      onCreate(r.data);
      onClose();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to create group'); }
    setSaving(false);
  };

  return (
    <div className="mc-modal-overlay">
      <div className="mc-modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h2 style={{margin:0,fontSize:18,color:G.forest}}>👥 Create Group</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.gray}}>✕</button>
        </div>
        <input className="mc-field" placeholder="Group name *" value={name} onChange={e=>setName(e.target.value)} />
        <input className="mc-field" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:G.olive,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em'}}>Group Photo (optional)</div>
          <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])} className="mc-field" style={{padding:4,background:'#f5f9f6',border:'1px dashed #A5D6A7'}} />
        </div>
        <div style={{fontSize:12,fontWeight:700,color:G.olive,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Add Members</div>
        <div style={{maxHeight:200,overflowY:'auto',border:'1.5px solid #A5D6A7',padding:8,marginBottom:14}}>
          {users.map(u => (
            <label key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'5px 4px',cursor:'pointer'}}>
              <input type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggle(u.id)} style={{accentColor:G.forest}} />
              <Avatar name={u.name} role={u.role} size={28} avatar={u.avatar} />
              <span style={{fontSize:13,fontWeight:600}}>{u.name}</span>
              <span style={{fontSize:11,color:roleColor(u.role),fontWeight:700}}>{u.role}</span>
            </label>
          ))}
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="mc-btn mc-btn-gray" onClick={onClose}>Cancel</button>
          <button className="mc-btn mc-btn-green" onClick={submit} disabled={saving}>{saving?'Creating…':'Create Group'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Members Panel ─────────────────────────────────────────────────────
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
      const r = await apiClient.patch(`/manager-chat/groups/${group.id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Group photo updated');
      if (onGroupUpdated) {
        onGroupUpdated({ ...group, profile_photo: r.data.profile_photo });
      }
    } catch(err) { toast.error('Failed to update photo'); }
  };

  const fetchMembers = useCallback(async () => {
    try {
      const r = await apiClient.get(`/manager-chat/groups/${group.id}/members`);
      setMembers(r.data || []);
    } catch(_) {}
    setLoading(false);
  },[group.id]);

  useEffect(() => { fetchMembers(); },[fetchMembers]);

  const removeMember = async (userId, name) => {
    try {
      await apiClient.delete(`/manager-chat/groups/${group.id}/members/${userId}`);
      setMembers(p => p.filter(m=>m.id!==userId));
      toast.success(`${name} removed`);
    } catch(e) { toast.error('Failed to remove member'); }
  };

  const banMember = async (userId, name, currentBan) => {
    try {
      await apiClient.patch(`/manager-chat/groups/${group.id}/members/${userId}/ban`, { ban: !currentBan });
      setMembers(p => p.map(m => m.id===userId ? {...m, is_banned: !currentBan} : m));
      toast.success(`${name} ${!currentBan ? 'banned' : 'unbanned'}`);
    } catch(e) { toast.error('Failed'); }
  };

  const addMember = async () => {
    if (!addUserId) return;
    try {
      await apiClient.post(`/manager-chat/groups/${group.id}/members`, { userId: parseInt(addUserId) });
      toast.success('Member added!');
      setAddUserId('');
      setShowAdd(false);
      fetchMembers();
    } catch(e) { toast.error('Failed'); }
  };

  const leaveGroup = async () => {
    try {
      await apiClient.post(`/manager-chat/groups/${group.id}/leave`);
      toast.success('You left the group');
      onLeft();
      onClose();
    } catch(e) { toast.error('Failed'); }
  };

  const memberIds = new Set(members.map(m=>m.id));
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id));

  return (
    <div className="mc-modal-overlay">
      <div className="mc-modal" style={{width:480}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{position:'relative',cursor:(isCeo||group.created_by===myId)?'pointer':'default'}}>
              {group.profile_photo ? (
                <img src={group.profile_photo.startsWith('http') ? group.profile_photo : `${BASE}${group.profile_photo}`} alt={group.name} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}} />
              ) : (
                <div style={{width:40,height:40,background:'rgba(27,94,32,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>👥</div>
              )}
              {(isCeo || group.created_by===myId) && (
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}} title="Change Group Photo" />
              )}
            </div>
            <h2 style={{margin:0,fontSize:16,color:G.forest}}>Members</h2>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.gray}}>✕</button>
        </div>
        {loading ? <div style={{textAlign:'center',padding:20,color:G.gray}}>Loading…</div> : (
          <div style={{maxHeight:300,overflowY:'auto',marginBottom:14}}>
            {members.map(m => (
              <div key={m.id} className="mc-member-row">
                <Avatar name={m.name} role={m.role} size={32} avatar={m.avatar} />
                <div style={{flex:1}}>
                  <span style={{fontWeight:700,fontSize:13}}>{m.name}</span>
                  {m.id===myId && <span style={{fontSize:10,color:G.olive,marginLeft:6}}>(you)</span>}
                  {m.id===group.created_by && <span style={{fontSize:10,color:'#7C3AED',marginLeft:6}}>Creator</span>}
                  {m.is_banned && <span style={{fontSize:10,color:G.red,marginLeft:6,fontWeight:800}}>BANNED</span>}
                </div>
                {m.id !== myId && (
                  <div style={{display:'flex',gap:6}}>
                    {(isCeo || group.created_by === myId) && (
                      <button className="mc-btn mc-btn-red" style={{padding:'3px 8px',fontSize:11}} onClick={()=>removeMember(m.id,m.name)}>Remove</button>
                    )}
                    {isCeo && (
                      <button className="mc-btn" style={{padding:'3px 8px',fontSize:11,background:m.is_banned?'#4CAF50':'#FF5722',color:'#fff'}} onClick={()=>banMember(m.id,m.name,m.is_banned)}>
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
          <div style={{marginBottom:12}}>
            {showAdd ? (
              <div style={{display:'flex',gap:8}}>
                <select className="mc-field" style={{margin:0,flex:1}} value={addUserId} onChange={e=>setAddUserId(e.target.value)}>
                  <option value="">Select a user…</option>
                  {nonMembers.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
                <button className="mc-btn mc-btn-green" onClick={addMember}>Add</button>
                <button className="mc-btn mc-btn-gray" onClick={()=>setShowAdd(false)}>Cancel</button>
              </div>
            ) : (
              <button className="mc-btn mc-btn-green" onClick={()=>setShowAdd(true)} style={{fontSize:12}}>+ Add Member</button>
            )}
          </div>
        )}

        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="mc-btn mc-btn-red" onClick={leaveGroup}>🚪 Leave Group</button>
          <button className="mc-btn mc-btn-gray" onClick={onClose}>Close</button>
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {msgId, msgText}

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
    } catch(e) {
      if (e?.message?.includes('403')) toast.error('You have been banned from this group');
    }
    setLoading(false);
  },[group.id]);

  useEffect(() => {
    setLoading(true); setMessages([]); initialLoadDone.current = false;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  },[fetchMessages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (!initialLoadDone.current && messages.length > 0) {
      endRef.current?.scrollIntoView();
      initialLoadDone.current = true;
    } else if (isNearBottom) {
      endRef.current?.scrollIntoView({behavior:'smooth'});
    }
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if(!el) return;
    el.style.height='auto';
    el.style.height=Math.min(el.scrollHeight,120)+'px';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setFilePreview({ file, name: file.name, type: file.type });
  };

  const send = async () => {
    if((!text.trim() && !filePreview) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if(text.trim()) fd.append('message', text.trim());
      if(filePreview) fd.append('file', filePreview.file);
      if(replyingTo) fd.append('replyToId', replyingTo.id);

      const r = await apiClient.post(`/manager-chat/groups/${group.id}/messages`, fd, {
        headers:{'Content-Type':'multipart/form-data'}
      });
      setMessages(p=>[...p, r.data]);
      setText('');
      setFilePreview(null);
      setReplyingTo(null);
      if(fileRef.current) fileRef.current.value='';
      if(textareaRef.current) textareaRef.current.style.height='auto';
    } catch(e) { toast.error(e?.response?.data?.message||'Failed to send'); }
    setSending(false);
  };

  const react = async (msgId, emoji) => {
    setActiveReactionId(null);
    try {
      const r = await apiClient.post(`/manager-chat/groups/${group.id}/messages/${msgId}/react`, { emoji });
      setMessages(p => p.map(m => m.id === msgId ? {...m, reactions: r.reactions} : m));
    } catch(e) { toast.error('Failed to react'); }
  };

  const deleteMsg = (m) => {
    setDeleteConfirm({ msgId: m.id, msgText: m.message || m.file_name || 'File' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/manager-chat/groups/${group.id}/messages/${deleteConfirm.msgId}`);
      setMessages(p => p.filter(m => m.id !== deleteConfirm.msgId));
      toast.success('Message deleted', { icon: '🗑️', style: { background: '#1B5E20', color: '#fff' } });
    } catch(e) { toast.error('Failed to delete message'); }
    setDeleteConfirm(null);
  };

  const fmt = dt => { if(!dt) return ''; const d=new Date(dt); return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="mc-modal-overlay">
          <div className="mc-modal" style={{width:340,textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:10}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:15,color:G.forest,marginBottom:8}}>Delete Message?</div>
            <div style={{fontSize:12,color:'#9E9E9E',marginBottom:18,background:'#F5F9F6',padding:'8px 12px',borderRadius:4,maxHeight:60,overflow:'hidden',textOverflow:'ellipsis'}}>
              &ldquo;{deleteConfirm.msgText?.slice(0,80)}{deleteConfirm.msgText?.length > 80 ? '…' : ''}&rdquo;
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="mc-btn mc-btn-gray" style={{flex:1}} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="mc-btn mc-btn-red" style={{flex:1}} onClick={confirmDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {showMembers && (
        <GroupMembersPanel
          group={group} myId={myId} isCeo={isCeo} allUsers={allUsers}
          onClose={()=>setShowMembers(false)} onLeft={onLeft}
          onGroupUpdated={onGroupUpdated}
        />
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px',borderBottom:'2px solid #E8F4EC',background:'linear-gradient(135deg,#1B5E20,#2E8B57)',color:'#fff',flexShrink:0}}>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'5px 10px',cursor:'pointer',fontWeight:700,fontSize:13}}>← Back</button>
        {group.profile_photo ? (
          <img src={group.profile_photo.startsWith('http') ? group.profile_photo : `${BASE}${group.profile_photo}`} alt={group.name} style={{width:56,height:56,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'3px solid rgba(255,255,255,0.5)',boxShadow:'0 2px 8px rgba(0,0,0,0.25)'}} />
        ) : (
          <div style={{width:56,height:56,background:'rgba(255,255,255,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>👥</div>
        )}
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15}}>{group.name}</div>
          <div style={{fontSize:11,opacity:0.8}}>
            {group.member_count || 1} members {group.description ? ` • ${group.description}` : ''}
          </div>
        </div>
        <button onClick={()=>setShowMembers(true)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:12,flexShrink:0}}>
          👥 Members
        </button>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} style={{flex:1,minHeight:0,overflowY:'auto',padding:'16px 20px 120px 20px',display:'flex',flexDirection:'column',gap:10,background:'#F5F9F6'}} onClick={() => setActiveReactionId(null)}>
        {loading ? (
          <div style={{textAlign:'center',color:G.olive,marginTop:40}}>⏳ Loading…</div>
        ) : messages.length===0 ? (
          <div style={{textAlign:'center',color:G.gray,marginTop:60}}>
            <div style={{fontSize:36,opacity:0.3}}>💬</div>
            No messages yet. Start the conversation!
          </div>
        ) : messages.map(m => {
          const isMine = m.sender_user_id === myId;
          const canDelete = isMine || isCeo || group.created_by === myId;
          
          return (
            <div key={m.id} className={`mc-bubble-wrap ${isMine ? 'mine' : 'theirs'} ${activeReactionId === m.id ? 'reacting' : ''}`} style={{display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start', marginBottom: m.reactions && Object.keys(typeof m.reactions==='string'?JSON.parse(m.reactions||'{}'):m.reactions||{}).length>0 ? 8 : 2}}>
              {!isMine && <div style={{fontSize:11,fontWeight:700,color:roleColor(m.role||''),marginBottom:2,marginLeft:8}}>{m.sender_name}</div>}
              
              <div style={{display:'flex', gap:6, flexDirection: isMine ? 'row-reverse' : 'row', alignItems:'center'}}>
                {/* Reaction Picker — anchored to bubble-wrap */}
                {activeReactionId === m.id && (
                  <div className="mc-reaction-picker open" onClick={e=>e.stopPropagation()}>
                    {EMOJIS.map(e => <span key={e} onClick={()=>react(m.id, e)}>{e}</span>)}
                  </div>
                )}

                <div className="mc-bubble" style={{maxWidth:'300px',padding:'10px 14px',borderRadius:0,background:isMine?'linear-gradient(135deg,#1B5E20,#2E8B57)':'#fff',color:isMine?'#fff':G.darkText,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                  <QuotedMessage replyToId={m.reply_to_id} messages={messages} isMine={isMine} />
                  {m.message && <div style={{fontSize:14,lineHeight:1.5}}>{m.message}</div>}
                  {m.file_url && <FileBubble fileUrl={m.file_url} fileName={m.file_name} fileType={m.file_type} isMine={isMine} onImageClick={onImageClick} />}
                  <div style={{fontSize:10,opacity:0.65,textAlign:'right',marginTop:4}}>{fmt(m.created_at)}</div>
                </div>
                
                {/* Action buttons — show on hover beside the bubble */}
                <div className="mc-msg-actions" style={{flexDirection:'column'}}>
                  <button className="mc-action-btn" title="Reply" onClick={()=>setReplyingTo(m)}>↩️</button>
                  <button className="mc-action-btn" title="React" onClick={(e)=>{e.stopPropagation(); setActiveReactionId(activeReactionId === m.id ? null : m.id);}}>😊</button>
                  {canDelete && <button className="mc-action-btn delete" title="Delete" onClick={()=>deleteMsg(m)}>✕</button>}
                </div>
              </div>

              <ReactionTray reactionsJson={m.reactions} myId={myId} onToggle={(e)=>react(m.id,e)} alignLeft={!isMine} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div style={{padding:'8px 14px',background:'#E8F4EC',borderLeft:'4px solid #1B5E20',display:'flex',alignItems:'center',gap:8,fontSize:12,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,color:G.forest,marginBottom:2}}>Replying to {replyingTo.sender_name || 'You'}</div>
            <div style={{opacity:0.8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {replyingTo.message || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : 'Document')}
            </div>
          </div>
          <button onClick={()=>setReplyingTo(null)} style={{background:'none',border:'none',cursor:'pointer',color:G.red,fontWeight:700,fontSize:16}}>✕</button>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div style={{padding:'6px 14px',background:'#E8F4EC',display:'flex',alignItems:'center',gap:8,fontSize:12,flexShrink:0}}>
          <span>📎</span>
          <span style={{fontWeight:600,color:G.forest,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{filePreview.name}</span>
          <button onClick={()=>{setFilePreview(null);if(fileRef.current)fileRef.current.value='';}} style={{background:'none',border:'none',cursor:'pointer',color:G.red,fontWeight:700,fontSize:16}}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={{padding:'10px 14px',borderTop:'2px solid #E8F4EC',background:'#fff',display:'flex',gap:10,alignItems:'flex-end',flexShrink:0}}>
        <input type="file" ref={fileRef} style={{display:'none'}} onChange={handleFileSelect} />
        <button className="mc-attach-btn" onClick={()=>fileRef.current?.click()} title="Attach file">📎</button>
        <div style={{flex:1,border:'2px solid #A5D6A7',borderRadius:24,padding:'9px 16px',background:'#F9FFF9',display:'flex',alignItems:'center'}}>
          <textarea ref={textareaRef} className="mc-input" rows={1} placeholder="Write a message…" value={text}
            onChange={e=>{setText(e.target.value);adjustTextarea();}}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} style={{flex:1}}
          />
        </div>
        <button className="mc-send-btn" onClick={send} disabled={sending||(!text.trim()&&!filePreview)}>
          {sending ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 1s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
        </button>
      </div>
    </div>
  );
}

// ─── DM Conversation View ────────────────────────────────────────────────────
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
    } catch(_) {}
    setLoading(false);
  },[partner.id]);

  useEffect(() => {
    setLoading(true); setMessages([]); initialLoadDone.current = false;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  },[fetchMessages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (!initialLoadDone.current && messages.length > 0) {
      endRef.current?.scrollIntoView();
      initialLoadDone.current = true;
    } else if (isNearBottom) {
      endRef.current?.scrollIntoView({behavior:'smooth'});
    }
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if(!el) return;
    el.style.height='auto';
    el.style.height=Math.min(el.scrollHeight,120)+'px';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setFilePreview({ file, name: file.name, type: file.type });
  };

  const send = async () => {
    if((!text.trim() && !filePreview) || sending) return;
    setSending(true);
    try {
      let r;
      if(filePreview) {
        const fd = new FormData();
        fd.append('receiverId', partner.id);
        fd.append('file', filePreview.file);
        if(text.trim()) fd.append('message', text.trim());
        if(replyingTo) fd.append('replyToId', replyingTo.id);
        r = await apiClient.post('/manager-chat/send-file', fd, {headers:{'Content-Type':'multipart/form-data'}});
      } else {
        r = await apiClient.post('/manager-chat/send', { 
          receiverId: partner.id, 
          message: text.trim(),
          replyToId: replyingTo ? replyingTo.id : null
        });
      }
      setMessages(p=>[...p, r.data]);
      setText('');
      setFilePreview(null);
      setReplyingTo(null);
      if(fileRef.current) fileRef.current.value='';
      if(textareaRef.current) textareaRef.current.style.height='auto';
    } catch(e) { toast.error(e?.response?.data?.message||'Failed to send'); }
    setSending(false);
  };

  const react = async (msgId, emoji) => {
    setActiveReactionId(null);
    try {
      const r = await apiClient.post(`/manager-chat/react/${msgId}`, { emoji });
      setMessages(p => p.map(m => m.id === msgId ? {...m, reactions: r.reactions} : m));
    } catch(e) { toast.error('Failed to react'); }
  };

  const confirmDelete = async () => {
    if(!deleteConfirm) return;
    const {id,type} = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await apiClient.delete(`/manager-chat/${id}?type=${type}`);
      setMessages(p=>p.filter(m=>m.id!==id));
      toast.success(type==='everyone'?'Deleted for everyone':'Deleted for you',{duration:2000});
    } catch(_) { toast.error('Could not delete'); }
  };

  const fmt = dt => { if(!dt) return ''; return new Date(dt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Delete modal */}
      {deleteConfirm && (
        <div className="mc-modal-overlay">
          <div className="mc-modal" style={{width:320,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:10}}>{deleteConfirm.type==='everyone'?'🗑️':'✕'}</div>
            <div style={{fontWeight:800,fontSize:15,color:G.forest,marginBottom:8}}>{deleteConfirm.type==='everyone'?'Delete for Everyone?':'Delete for Me?'}</div>
            <div style={{fontSize:12,color:'#9E9E9E',marginBottom:18,background:'#F5F9F6',padding:8}}>&ldquo;{deleteConfirm.msgText?.slice(0,60)}{deleteConfirm.msgText?.length>60?'…':''}&rdquo;</div>
            <div style={{display:'flex',gap:10}}>
              <button className="mc-btn mc-btn-gray" style={{flex:1}} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="mc-btn mc-btn-red" style={{flex:1}} onClick={confirmDelete}>{deleteConfirm.type==='everyone'?'Delete for All':'Delete for Me'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderBottom:'2px solid #E8F4EC',background:'linear-gradient(135deg,#1B5E20,#2E8B57)',color:'#fff',flexShrink:0}}>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'5px 10px',cursor:'pointer',fontWeight:700,fontSize:13}}>← Back</button>
        <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={38} />
        <div>
          <div style={{fontWeight:800,fontSize:15}}>{partner.name}</div>
          <div style={{fontSize:11,opacity:0.8,background:'rgba(255,255,255,0.18)',padding:'1px 8px',display:'inline-block',marginTop:2}}>{partner.role}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} style={{flex:1,minHeight:0,overflowY:'auto',padding:'16px 20px 120px 20px',display:'flex',flexDirection:'column',gap:10,background:'#F5F9F6'}} onClick={() => setActiveReactionId(null)}>
        {loading ? <div style={{textAlign:'center',color:G.olive,marginTop:40}}>⏳ Loading…</div>
        : messages.length===0 ? <div style={{textAlign:'center',color:G.gray,marginTop:60}}><div style={{fontSize:36,opacity:0.3}}>💬</div>No messages yet. Say hello!</div>
        : messages.map(m => {
          const isMine = m.sender_user_id === myId;
          const seen = isMine && m.seen_at;
          m.sender_name = isMine ? 'You' : partner.name; // For QuotedMessage
          return (
            <div key={m.id} className={`mc-bubble-wrap ${isMine ? 'mine' : 'theirs'} ${activeReactionId === m.id ? 'reacting' : ''}`} style={{display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start', marginBottom: m.reactions && Object.keys(typeof m.reactions==='string'?JSON.parse(m.reactions||'{}'):m.reactions||{}).length>0 ? 8 : 2}}>
              {!isMine && <Avatar name={partner.name} role={partner.role} avatar={partner.avatar} size={28} style={{alignSelf:'flex-end'}} />}
              
              <div style={{display:'flex', gap:6, flexDirection: isMine ? 'row-reverse' : 'row', alignItems:'center'}}>
                {/* Reaction Picker — anchored to bubble-wrap */}
                {activeReactionId === m.id && (
                  <div className="mc-reaction-picker open" onClick={e=>e.stopPropagation()}>
                    {EMOJIS.map(e => <span key={e} onClick={()=>react(m.id, e)}>{e}</span>)}
                  </div>
                )}

                <div className="mc-bubble" style={{maxWidth:'300px',padding:'10px 14px',background:isMine?'linear-gradient(135deg,#1B5E20,#2E8B57)':'#fff',color:isMine?'#fff':G.darkText,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                  <QuotedMessage replyToId={m.reply_to_id} messages={messages} isMine={isMine} />
                  {m.message && <div style={{fontSize:14,lineHeight:1.5}}>{m.message}</div>}
                  {m.file_url && <FileBubble fileUrl={m.file_url} fileName={m.file_name} fileType={m.file_type} isMine={isMine} onImageClick={onImageClick} />}
                  <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',marginTop:4}}>
                    <span style={{fontSize:10,opacity:0.65}}>{fmt(m.created_at)}</span>
                    {isMine && <span style={{fontSize:11,opacity:0.8}}>{seen?'✓✓':'✓'}</span>}
                  </div>
                </div>

                {/* Action buttons — vertical stack beside bubble */}
                <div className="mc-msg-actions" style={{flexDirection:'column'}}>
                  <button className="mc-action-btn" title="Reply" onClick={()=>setReplyingTo(m)}>↩️</button>
                  <button className="mc-action-btn" title="React" onClick={(e)=>{e.stopPropagation(); setActiveReactionId(activeReactionId === m.id ? null : m.id);}}>😊</button>
                  {isMine && <button className="mc-action-btn delete" title="Delete for all" onClick={()=>setDeleteConfirm({id:m.id,type:'everyone',msgText:m.message||m.file_name})}>✕</button>}
                  <button className="mc-action-btn delete" title="Delete for me" onClick={()=>setDeleteConfirm({id:m.id,type:'me',msgText:m.message||m.file_name})}>🗑️</button>
                </div>
              </div>

              <ReactionTray reactionsJson={m.reactions} myId={myId} onToggle={(e)=>react(m.id,e)} alignLeft={!isMine} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div style={{padding:'8px 14px',background:'#E8F4EC',borderLeft:'4px solid #1B5E20',display:'flex',alignItems:'center',gap:8,fontSize:12,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,color:G.forest,marginBottom:2}}>Replying to {replyingTo.sender_user_id === myId ? 'You' : partner.name}</div>
            <div style={{opacity:0.8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {replyingTo.message || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : 'Document')}
            </div>
          </div>
          <button onClick={()=>setReplyingTo(null)} style={{background:'none',border:'none',cursor:'pointer',color:G.red,fontWeight:700,fontSize:16}}>✕</button>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div style={{padding:'6px 14px',background:'#E8F4EC',display:'flex',alignItems:'center',gap:8,fontSize:12,flexShrink:0}}>
          <span>📎</span>
          <span style={{fontWeight:600,color:G.forest,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{filePreview.name}</span>
          <button onClick={()=>{setFilePreview(null);if(fileRef.current)fileRef.current.value='';}} style={{background:'none',border:'none',cursor:'pointer',color:G.red,fontWeight:700,fontSize:16}}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={{padding:'10px 14px',borderTop:'2px solid #E8F4EC',background:'#fff',display:'flex',gap:10,alignItems:'flex-end',flexShrink:0}}>
        <input type="file" ref={fileRef} style={{display:'none'}} onChange={handleFileSelect} />
        <button className="mc-attach-btn" onClick={()=>fileRef.current?.click()} title="Attach file">📎</button>
        <div style={{flex:1,border:'2px solid #A5D6A7',borderRadius:24,padding:'9px 16px',background:'#F9FFF9',display:'flex',alignItems:'center'}}>
          <textarea ref={textareaRef} className="mc-input" rows={1} placeholder="Write a message…" value={text}
            onChange={e=>{setText(e.target.value);adjustTextarea();}}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} style={{flex:1}}
          />
        </div>
        <button className="mc-send-btn" onClick={send} disabled={sending||(!text.trim()&&!filePreview)}>
          {sending ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 1s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
        </button>
      </div>
    </div>
  );
}

// ─── Main ManagerChat ────────────────────────────────────────────────────────
export default function ManagerChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null); // {type:'dm'|'group', data}
  const [unreadMap, setUnreadMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('dm'); // 'dm' | 'groups'
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const isCeo = user?.roles?.includes('CEO') || user?.role === 'CEO';
  const myId = user?.id;

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const r = await apiClient.get('/manager-chat/users'); setUsers(r.data||[]); } catch(_) {}
    setLoadingUsers(false);
  },[]);

  const fetchGroups = useCallback(async () => {
    try { const r = await apiClient.get('/manager-chat/groups'); setGroups(r.data || []); } catch(_) {}
  },[]);

  useEffect(() => { fetchUsers(); fetchGroups(); },[fetchUsers,fetchGroups]);

  useEffect(() => {
    if(tab==='groups') fetchGroups();
  },[tab,fetchGroups]);

  // Poll unread counts — stable interval, never restacks on re-render
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await apiClient.get(`/manager-chat/unread-counts`);
        setUnreadMap(r.data || {});
      } catch(_){}
    };
    poll();
    const iv = setInterval(poll, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if(showAdmin) apiClient.get('/manager-chat/admin/users').then(r=>setAdminUsers(r.data||[])).catch(console.error);
  },[showAdmin]);

  const toggleAccess = async (id) => {
    const target = adminUsers.find(u=>u.id===id);
    if(!target) return;
    const prev = target.chat_enabled;
    setAdminUsers(p=>p.map(u=>u.id===id?{...u,chat_enabled:!prev}:u));
    try { await apiClient.patch(`/manager-chat/admin/users/${id}/toggle`); }
    catch(e) { toast.error('Failed'); setAdminUsers(p=>p.map(u=>u.id===id?{...u,chat_enabled:prev}:u)); }
  };

  const filtered = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.role?.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g=>g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{margin:'-24px',background:'#E8F4EC',minHeight:'calc(100vh - 64px)',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <Toaster position="top-right" />
      <Styles />

      {previewImage && (
        <div className="mc-modal-overlay" onClick={() => setPreviewImage(null)} style={{zIndex: 999999, background: 'rgba(0,0,0,0.85)', padding: 40}}>
          <div style={{position: 'relative', maxWidth: '90vw', maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} style={{position: 'absolute', top: -30, right: -30, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
            <img src={previewImage} alt="Preview" style={{maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}} />
          </div>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          onClose={()=>setShowCreateGroup(false)}
          onCreate={(g)=>{ setGroups(p=>[...p,g]); setTab('groups'); }}
        />
      )}

      {showAdmin && (
        <div className="mc-modal-overlay">
          <div className="mc-modal" style={{maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{margin:0,fontSize:18,color:G.forest}}>⚙️ Chat Access Control</h2>
              <button onClick={()=>setShowAdmin(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:G.gray}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {adminUsers.map(u=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <Avatar name={u.name} role={u.role} avatar={u.avatar} size={36} />
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{u.name}</div>
                      <div style={{fontSize:12,color:G.gray}}>{u.role}</div>
                    </div>
                  </div>
                  <button onClick={()=>toggleAccess(u.id)} style={{background:u.chat_enabled?'#4CAF50':'#F44336',color:'#fff',border:'none',padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',width:70}}>
                    {u.chat_enabled?'ON':'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{padding:'2rem 2.5rem',animation:'fadeUp 0.35s ease'}}>
        {/* Title */}
        <div style={{marginBottom:'1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div>
            <h1 style={{fontSize:'2rem',fontWeight:900,color:G.forest,margin:0}}>💬 Manager Chat</h1>
            <p style={{color:G.olive,margin:'4px 0 0',fontSize:13,fontWeight:600}}>Private messages & group chats</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            {isCeo && (
              <button onClick={()=>setShowCreateGroup(true)} style={{background:G.forest,color:'#fff',border:'none',padding:'8px 16px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                👥 New Group
              </button>
            )}
            {isCeo && (
              <button onClick={()=>setShowAdmin(true)} style={{background:'#2E8B57',color:'#fff',border:'none',padding:'8px 16px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                ⚙️ Manage Access
              </button>
            )}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:18,height:'calc(100vh - 200px)'}}>
          {/* Sidebar */}
          <div className="mc-card" style={{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'2px solid #E8F4EC',flexShrink:0}}>
              <button className={`mc-tab${tab==='dm'?' active':''}`} onClick={()=>{setTab('dm');setSelected(null);}}>
                💬 Chats
              </button>
              <button className={`mc-tab${tab==='groups'?' active':''}`} onClick={()=>{setTab('groups');setSelected(null);}}>
                👥 Groups
              </button>
            </div>
            {/* Search */}
            <div style={{padding:'10px 14px',flexShrink:0,borderBottom:'1px solid #E8F4EC'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{width:'100%',border:'1.5px solid #A5D6A7',padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}
              />
            </div>
            {/* List */}
            <div style={{flex:1,minHeight:0,overflowY:'auto'}}>
              {tab==='dm' ? (
                loadingUsers ? <div style={{padding:20,textAlign:'center',color:G.gray,fontSize:13}}>Loading…</div>
                : filtered.length===0 ? <div style={{padding:20,textAlign:'center',color:G.gray,fontSize:13}}>No contacts found</div>
                : filtered.map(u => {
                  const unread = unreadMap[u.id]||0;
                  const isSel = selected?.type==='dm' && selected.data.id===u.id;
                  return (
                    <div key={u.id} className={`mc-contact-row${isSel?' selected':''}`} onClick={()=>setSelected({type:'dm',data:u})}>
                      <Avatar name={u.name} role={u.role} avatar={u.avatar} size={40} />
                      <div style={{flex:1,overflow:'hidden'}}>
                        <div style={{fontWeight:700,fontSize:13,color:G.darkText,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.name}</div>
                        <div style={{fontSize:11,fontWeight:600,color:roleColor(u.role),whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.role}</div>
                      </div>
                      {unread>0 && <div style={{background:G.red,color:'#fff',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{unread>9?'9+':unread}</div>}
                    </div>
                  );
                })
              ) : (
                filteredGroups.length===0 ? (
                  <div style={{padding:20,textAlign:'center',color:G.gray,fontSize:13}}>
                    No groups yet.<br/>
                    {isCeo && <span style={{color:G.forest,fontWeight:700,cursor:'pointer'}} onClick={()=>setShowCreateGroup(true)}>Create one!</span>}
                  </div>
                ) : filteredGroups.map(g => {
                  const isSel = selected?.type==='group' && selected.data.id===g.id;
                  return (
                    <div key={g.id} className={`mc-contact-row${isSel?' selected':''}`} onClick={()=>setSelected({type:'group',data:g})}>
                      {g.profile_photo ? (
                        <img src={g.profile_photo.startsWith('http') ? g.profile_photo : `${BASE}${g.profile_photo}`} alt={g.name} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'2px solid rgba(27,94,32,0.3)'}} />
                      ) : (
                        <div style={{width:40,height:40,background:'linear-gradient(135deg,#1B5E20,#2E8B57)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>👥</div>
                      )}
                      <div style={{flex:1,overflow:'hidden'}}>
                        <div style={{fontWeight:700,fontSize:13,color:G.darkText,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{g.name}</div>
                        <div style={{fontSize:11,color:G.gray,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {g.member_count || 1} members {g.description ? ` • ${g.description}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="mc-card" style={{padding:0,overflow:'hidden'}}>
            {selected ? (
              selected.type==='dm' ? (
                <ConversationView partner={selected.data} myId={myId} onBack={()=>setSelected(null)} onImageClick={setPreviewImage} />
              ) : (
                <GroupConversationView
                  group={selected.data} myId={myId} isCeo={isCeo} allUsers={users}
                  onBack={()=>setSelected(null)}
                  onLeft={()=>{setGroups(p=>p.filter(g=>g.id!==selected.data.id));setSelected(null);}}
                  onImageClick={setPreviewImage}
                  onGroupUpdated={(updatedGroup) => {
                    setSelected({type:'group', data:updatedGroup});
                    setGroups(p=>p.map(g=>g.id===updatedGroup.id ? updatedGroup : g));
                  }}
                />
              )
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:G.gray}}>
                <div style={{fontSize:60,opacity:0.2,marginBottom:16}}>💬</div>
                <div style={{fontSize:16,fontWeight:700}}>Select a chat or group</div>
                <div style={{fontSize:13,marginTop:6,opacity:0.7}}>Choose from the list to start chatting</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
