import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, RefreshCw, X, CheckCircle, AlertTriangle, Loader2,
  Building2, UserCheck, UserX, ClipboardList, Calendar, Flag,
  Search, Zap, Edit2, Trash2
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const COLORS = ['#4FA3C3', '#5BAD8A', '#E07B54', '#9B72CF', '#D4A843', '#4A90C4', '#58B09C'];

const Avatar = ({ name, photo, size = 40 }) => {
  const [err, setErr] = useState(false);
  const src = resolvePhoto(photo);
  const bg = COLORS[((name || '?').charCodeAt(0) - 65) % COLORS.length] || '#4FA3C3';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.4, fontWeight: 800, color: 'white',
      border: '2px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      {src && !err ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
      ) : (name || '?')[0].toUpperCase()}
    </div>
  );
};

const SubRolePill = ({ role }) => {
  const map = {
    Cashier: { bg: 'rgba(212,168,67,0.15)', color: '#7a5c00', label: '💰 Cashier' },
    Worker:  { bg: 'rgba(79,163,195,0.15)', color: '#1e4d6b', label: '🧑‍⚕️ Worker' },
  };
  const s = map[role] || { bg: 'rgba(100,116,139,0.1)', color: '#475569', label: role || '—' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999, fontSize: 11,
      fontWeight: 800, background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`
    }}>{s.label}</span>
  );
};

const StatusPill = ({ status }) => {
  const map = {
    Completed:   { bg: 'rgba(91,173,138,0.15)', color: '#1e5c3e', label: '✓ Completed' },
    'In Progress': { bg: 'rgba(212,168,67,0.15)', color: '#7a5c00', label: '⏳ In Progress' },
    Pending:     { bg: 'rgba(224,123,84,0.15)', color: '#7a2e00', label: '🔴 Pending' },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>{s.label}</span>
  );
};

const PriorityPill = ({ pri }) => {
  const map = {
    High:   { bg: 'rgba(224,123,84,0.15)', color: '#7a2e00', label: '🔥 High' },
    Medium: { bg: 'rgba(212,168,67,0.15)', color: '#7a5c00', label: '⚡ Medium' },
    Low:    { bg: 'rgba(91,173,138,0.15)', color: '#1e5c3e', label: '↓ Low' },
  };
  const s = map[pri] || map.Low;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>{s.label}</span>
  );
};

// ─── CSS shared styles matching PharmacyOverview ──────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.9)} }
  @keyframes laserSweep { 0%{left:-150%}100%{left:150%} }

  .artistic-3d-title { font-size:2.8rem; font-weight:900; color:#0d3349; letter-spacing:-0.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 #fff,4px 4px 0 #4FA3C3,5px 5px 0 #4FA3C3,6px 6px 0 #2d7da0,7px 7px 0 #2d7da0,8px 8px 15px rgba(0,0,0,0.2);
    margin:0;display:flex;align-items:center;gap:12px;line-height:1.1 }
  .artistic-3d-subtitle { font-size:0.95rem;color:#4A7A9B;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:0.15em;margin:0;text-shadow:1px 1px 0px rgba(255,255,255,0.9) }
  .btn-3d { background:linear-gradient(135deg,#ffffff,#e0eff3);color:#0d3349;border:2px solid #4FA3C3;border-radius:14px;padding:10px 24px;font-weight:900;font-size:14px;cursor:pointer;
    box-shadow:0px 5px 0px #4FA3C3,0px 8px 15px rgba(0,80,120,0.15),inset 0px 2px 0px rgba(255,255,255,1);
    transition:all 0.1s;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:1.5px }
  .btn-3d:active { transform:translateY(6px);box-shadow:0px 0px 0px #4FA3C3,0px 2px 5px rgba(0,80,120,0.15) }
  .btn-3d:hover  { filter:brightness(1.05) }
  .btn-3d-primary { background:linear-gradient(135deg,#4FA3C3,#2d7da0);color:white;border:2px solid #2d7da0;border-radius:14px;padding:10px 24px;font-weight:900;font-size:14px;cursor:pointer;
    box-shadow:0px 5px 0px #1e5a78,0px 8px 15px rgba(0,80,120,0.25),inset 0px 2px 0px rgba(255,255,255,0.2);
    transition:all 0.1s;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:1.5px }
  .btn-3d-primary:active { transform:translateY(6px);box-shadow:0px 0px 0px #1e5a78 }
  .btn-3d-primary:hover  { filter:brightness(1.08) }

  .d-card {
    --hover-color:#4FA3C3;
    position:relative;overflow:hidden;background-color:white;border-radius:0;padding:26px;
    box-shadow:0 2px 14px rgba(0,80,120,0.08);transition:background-size 0.4s cubic-bezier(.4,0,.2,1),box-shadow 0.4s,transform 0.4s;
    animation:fadeUp 0.5s ease both;border:none;cursor:pointer;
    background-image:linear-gradient(to right,var(--hover-color),var(--hover-color)),linear-gradient(to bottom,var(--hover-color),var(--hover-color)),linear-gradient(to left,var(--hover-color),var(--hover-color)),linear-gradient(to top,var(--hover-color),var(--hover-color));
    background-position:0 0,100% 0,100% 100%,0 100%;background-repeat:no-repeat;background-size:0% 4px,4px 0%,0% 4px,4px 0% }
  .d-card::before { content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(0,255,255,0.4),rgba(255,0,255,0.4),transparent);
    transform:skewX(-25deg);pointer-events:none;z-index:1 }
  .d-card:hover { transform:translateY(-4px);box-shadow:0 10px 30px rgba(0,80,120,0.14),0 0 18px var(--hover-color);background-size:100% 4px,4px 100%,100% 4px,4px 100% }
  .d-card:hover::before { animation:laserSweep 0.8s ease-out }

  .d-card-no-hover {
    --hover-color:#4FA3C3;
    position:relative;overflow:hidden;background:white;border-radius:0;padding:26px;
    box-shadow:0 2px 14px rgba(0,80,120,0.08);transition:background-size 0.4s,box-shadow 0.4s;animation:fadeUp 0.5s ease both;
    background-image:linear-gradient(to right,var(--hover-color),var(--hover-color)),linear-gradient(to bottom,var(--hover-color),var(--hover-color)),linear-gradient(to left,var(--hover-color),var(--hover-color)),linear-gradient(to top,var(--hover-color),var(--hover-color));
    background-position:0 0,100% 0,100% 100%,0 100%;background-repeat:no-repeat;background-size:0% 4px,4px 0%,0% 4px,4px 0% }
  .d-card-no-hover::before { content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(0,255,255,0.2),rgba(255,0,255,0.2),transparent);
    transform:skewX(-25deg);pointer-events:none;z-index:1 }
  .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12),0 0 14px var(--hover-color);background-size:100% 4px,4px 100%,100% 4px,4px 100% }
  .d-card-no-hover:hover::before { animation:laserSweep 1s ease-out }

  .staff-row {
    position:relative;overflow:hidden;display:grid;
    grid-template-columns:220px 180px 160px 120px 110px 1fr;
    gap:0;align-items:center;border-bottom:1px solid rgba(79,163,195,0.12);
    transition:background 0.2s,transform 0.2s;cursor:default }
  .staff-row::before { content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(79,163,195,0.15),rgba(91,173,138,0.15),transparent);
    transform:skewX(-25deg);pointer-events:none;z-index:1 }
  .staff-row:hover { background:rgba(224,239,243,0.55);transform:translateX(3px) }
  .staff-row:hover::before { animation:laserSweep 0.7s ease-out }

  .staff-th { padding:12px 16px;background:rgba(224,239,243,0.7);color:#4A7A9B;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;text-align:left;white-space:nowrap;border-bottom:2px solid rgba(79,163,195,0.25) }
  .staff-td { padding:14px 16px;color:#1e4d6b;font-size:13px;vertical-align:middle }

  .action-btn { padding:6px 14px;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;border:none;
    transition:all 0.2s;letter-spacing:0.03em;display:inline-flex;align-items:center;gap:5px }
  .action-btn:hover { transform:translateY(-1px);filter:brightness(1.08) }

  .task-card { position:relative;overflow:hidden;background:rgba(224,239,243,0.4);border-radius:0;padding:16px;
    border-bottom:1px solid rgba(79,163,195,0.12);transition:background 0.2s }
  .task-card::before { content:'';position:absolute;top:0;left:-150%;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(79,163,195,0.2),transparent);
    transform:skewX(-25deg);pointer-events:none;z-index:1 }
  .task-card:hover { background:rgba(255,255,255,0.8) }
  .task-card:hover::before { animation:laserSweep 0.6s ease-out }

  .modal-overlay { position:fixed;inset:0;background:rgba(13,51,73,0.65);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeUp 0.2s ease }
  .modal-box { background:white;border-radius:0;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.35);
    border-top:4px solid #4FA3C3;overflow:hidden }

  .inp-field { width:100%;padding:10px 14px;border-radius:0;border:1.5px solid rgba(79,163,195,0.3);
    font-size:14px;box-sizing:border-box;background:#f7fbfd;color:#0d3349;font-weight:600;outline:none;
    transition:border-color 0.2s,box-shadow 0.2s }
  .inp-field:focus { border-color:#4FA3C3;box-shadow:0 0 0 3px rgba(79,163,195,0.15);background:white }

  .filter-bar { position:relative;overflow:hidden;background:white;padding:16px 20px;
    box-shadow:0 2px 14px rgba(0,80,120,0.06);animation:fadeUp 0.4s ease both;
    background-image:linear-gradient(to right,#4FA3C3,#4FA3C3),linear-gradient(to bottom,#4FA3C3,#4FA3C3),linear-gradient(to left,#4FA3C3,#4FA3C3),linear-gradient(to top,#4FA3C3,#4FA3C3);
    background-position:0 0,100% 0,100% 100%,0 100%;background-repeat:no-repeat;background-size:100% 3px,0% 3px,0% 3px,0% 3px }
`;

// ─── Assign / Edit Modal ──────────────────────────────────────────────────────
const AssignModal = ({ branches, unassigned, preSelectedWorker, onClose, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState(preSelectedWorker ? String(preSelectedWorker.id) : '');
  const [selectedBranchId, setSelectedBranchId] = useState(preSelectedWorker ? String(preSelectedWorker.branch_id || '') : '');
  const [selectedSubRole, setSelectedSubRole] = useState(preSelectedWorker?.sub_role || 'Worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedUser = unassigned.find(u => String(u.id) === String(selectedUserId));

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedUserId) { setError('Please select an employee.'); return; }
    if (!selectedBranchId) { setError('Please select a branch.'); return; }
    setLoading(true);
    try {
      const rolesRes = await apiClient.get('/users/roles');
      const roles = rolesRes?.data?.roles || rolesRes?.data?.data || [];
      const pwRole = roles.find(r => r.name === 'Pharmacy Worker');
      if (!pwRole) throw new Error('Pharmacy Worker role not found.');
      await apiClient.post(`/users/${selectedUserId}/roles`, {
        roleId: pwRole.id, branchId: parseInt(selectedBranchId), subRole: selectedSubRole
      });
      onSuccess(`${selectedUser?.full_name || 'User'} assigned as Pharmacy ${selectedSubRole} successfully.`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Assignment failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 500 }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg,#4FA3C3,#2d7da0)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.01em' }}>
              {preSelectedWorker ? '✏️ Edit Worker Role' : '➕ Assign Pharmacy Worker'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
              Assign the <strong>Pharmacy Worker</strong> role with branch &amp; sub-role
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 28 }}>
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(224,123,84,0.12)', border: '1.5px solid #E07B54', color: '#7a2e00', marginBottom: 20, fontSize: 13, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={16} />{error}
            </div>
          )}
          <form onSubmit={handleAssign}>
            {/* Employee select */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Employee <span style={{ color: '#E07B54' }}>*</span>
              </label>
              <select className="inp-field" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                <option value="">— Select an onboarded employee —</option>
                {unassigned.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email}) — {u.department_name || 'No Dept'}</option>
                ))}
              </select>
              {selectedUser && (
                <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(91,173,138,0.1)', border: '1.5px solid rgba(91,173,138,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={selectedUser.full_name} photo={selectedUser.profile_photo} size={40} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e4d6b', fontSize: 14 }}>{selectedUser.full_name}</div>
                    <div style={{ color: '#4A7A9B', fontSize: 12, marginTop: 2 }}>{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Branch select */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Branch <span style={{ color: '#E07B54' }}>*</span>
              </label>
              <select className="inp-field" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required>
                <option value="">— Select branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Sub-role */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Sub-Role <span style={{ color: '#E07B54' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Worker', 'Cashier'].map(sr => (
                  <button key={sr} type="button" onClick={() => setSelectedSubRole(sr)} style={{
                    flex: 1, padding: '12px', border: `2px solid ${selectedSubRole === sr ? '#4FA3C3' : 'rgba(79,163,195,0.25)'}`,
                    background: selectedSubRole === sr ? 'rgba(79,163,195,0.12)' : 'white',
                    color: selectedSubRole === sr ? '#0d3349' : '#4A7A9B',
                    fontWeight: 800, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s'
                  }}>
                    {sr === 'Worker' ? '🧑‍⚕️ Worker' : '💰 Cashier'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={onClose} className="btn-3d" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={loading || !selectedUserId || !selectedBranchId} className="btn-3d-primary" style={{ flex: 2, opacity: loading || !selectedUserId || !selectedBranchId ? 0.6 : 1 }}>
                {loading ? <SegmentedSpinner size={16} /> : <UserCheck size={16} />}
                {loading ? 'Saving...' : preSelectedWorker ? 'Update Role' : 'Assign Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Task Modal ───────────────────────────────────────────────────────────────
const TaskModal = ({ worker, tasks, onClose, onRefresh }) => {
  const [taskType, setTaskType] = useState('Stock Count');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskError, setTaskError] = useState('');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    setLoading(true);
    try {
      await apiClient.post('/pharmacy/tasks', {
        assigned_to: worker.id, branch_id: worker.branch_id,
        task_type: taskType, priority, deadline, instructions
      });
      setDeadline(''); setInstructions('');
      onRefresh();
    } catch (err) {
      setTaskError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await apiClient.patch(`/pharmacy/tasks/${taskId}/status`, { status });
      onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#2d7da0,#0d3349)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={worker.full_name} photo={worker.profile_photo} size={50} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{worker.full_name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center' }}>
                <SubRolePill role={worker.sub_role} />
                <span style={{ fontSize: 12, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={12} /> {worker.branch_name}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Left: Create Task */}
          <div style={{ padding: 28, borderRight: '1px solid rgba(79,163,195,0.2)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color="#4FA3C3" /> Assign New Task
            </div>
            {taskError && (
              <div style={{ padding: '10px 14px', background: 'rgba(224,123,84,0.1)', border: '1.5px solid #E07B54', color: '#7a2e00', marginBottom: 16, fontSize: 12, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertTriangle size={14} />{taskError}
              </div>
            )}
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Task Type</label>
                <select className="inp-field" value={taskType} onChange={e => setTaskType(e.target.value)}>
                  <option>Stock Count</option>
                  <option>Expiry Check</option>
                  <option>Organize Shelves</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Priority</label>
                  <select className="inp-field" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Deadline</label>
                  <input type="datetime-local" required className="inp-field" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Instructions</label>
                <textarea rows={4} className="inp-field" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Task details..." style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={loading} className="btn-3d-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
                {loading ? <SegmentedSpinner size={16} /> : <Plus size={16} />}
                {loading ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>
          </div>

          {/* Right: Task List */}
          <div style={{ padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#4A7A9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color="#5BAD8A" /> Current Tasks ({tasks.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: '55vh', overflowY: 'auto' }}>
              {tasks.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9DBDCE', background: 'rgba(224,239,243,0.4)' }}>
                  <ClipboardList size={36} style={{ opacity: 0.4, marginBottom: 10 }} /><br />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>No tasks yet</span>
                </div>
              ) : tasks.map(t => (
                <div key={t.id} className="task-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: '#0d3349', fontSize: 13 }}>{t.task_type}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <PriorityPill pri={t.priority} />
                    <span style={{ fontSize: 11, background: 'rgba(79,163,195,0.1)', padding: '3px 8px', color: '#1e4d6b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {new Date(t.deadline).toLocaleString()}
                    </span>
                  </div>
                  {t.instructions && (
                    <div style={{ fontSize: 12, color: '#4A7A9B', marginBottom: 10, background: 'rgba(79,163,195,0.08)', padding: '8px 10px', fontStyle: 'italic' }}>
                      {t.instructions}
                    </div>
                  )}
                  <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 11, border: '1.5px solid rgba(79,163,195,0.3)', background: 'white', color: '#0d3349', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                    <option value="Pending">Mark Pending</option>
                    <option value="In Progress">Mark In Progress</option>
                    <option value="Completed">Mark Completed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PharmacyStaff = () => {
  const [workers, setWorkers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [branches, setBranches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedWorkerForTasks, setSelectedWorkerForTasks] = useState(null);
  const [confirmUnassign, setConfirmUnassign] = useState(null);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterSubRole, setFilterSubRole] = useState('all');
  const [search, setSearch] = useState('');

  const parseData = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const loadAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setRefreshing(true);
    setError('');
    try {
      const [workersRes, unassignedRes, branchesRes] = await Promise.all([
        apiClient.get('/users/pharmacy-workers'),
        apiClient.get('/users/unassigned-employees'),
        pharmacyService.getBranches()
      ]);
      setWorkers(parseData(workersRes));
      setUnassigned(parseData(unassignedRes));
      setBranches(parseData(branchesRes));
    } catch {
      setError('Failed to load staff data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadTasks = async (worker) => {
    setSelectedWorkerForTasks(worker);
    try {
      const res = await apiClient.get('/pharmacy/tasks');
      const data = res?.data?.data || res?.data || res || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSuccess = (msg) => {
    setSuccessMsg(msg);
    loadAll(true);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleUnassignConfirm = async () => {
    if (!confirmUnassign) return;
    setLoading(true);
    try {
      await apiClient.delete('/users/' + confirmUnassign.id + '/roles/20');
      setConfirmUnassign(null);
      handleSuccess(`${confirmUnassign.full_name} unassigned successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign');
      setConfirmUnassign(null);
    } finally { setLoading(false); }
  };

  const filteredWorkers = workers.filter(w => {
    if (filterBranch !== 'all' && String(w.branch_id) !== String(filterBranch)) return false;
    if (filterSubRole !== 'all' && w.sub_role !== filterSubRole) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!w.full_name?.toLowerCase().includes(q) && !w.email?.toLowerCase().includes(q) && !w.branch_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = [
    { label: 'Total Workers',    value: workers.length,   icon: <Users size={22} />,    color: '#4FA3C3', bg: 'rgba(79,163,195,0.12)',  delay: '0.05s' },
    { label: 'Cashiers',         value: workers.filter(w => w.sub_role === 'Cashier').length, icon: <UserCheck size={22} />, color: '#D4A843', bg: 'rgba(212,168,67,0.12)', delay: '0.1s' },
    { label: 'Branches Active',  value: branches.length,  icon: <Building2 size={22} />, color: '#5BAD8A', bg: 'rgba(91,173,138,0.12)', delay: '0.15s' },
    { label: 'Unassigned Staff', value: unassigned.length, icon: <UserX size={22} />,   color: '#E07B54', bg: 'rgba(224,123,84,0.12)', delay: '0.2s' },
  ];

  if (loading && workers.length === 0) {
    return (
      <div style={{ padding: 40, background: '#E0EFF3', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{SHARED_CSS}</style>
        <Zap size={48} style={{ color: '#4FA3C3', marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ fontSize: 20, color: '#0d3349', fontWeight: 800 }}>Loading Staff Data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', minHeight: 'calc(100vh - 64px)', background: '#E0EFF3', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{SHARED_CSS}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Staff HQ. <Users style={{ color: '#4FA3C3', filter: 'drop-shadow(0 0 8px rgba(79,163,195,0.6))' }} size={38} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            Manage employees, assign roles &amp; tasks
          </p>
        </div>
        <div style={{ justifySelf: 'end', display: 'flex', gap: 12 }}>
          <button onClick={() => loadAll(true)} className="btn-3d" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <SegmentedSpinner size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAssignModal(true)} className="btn-3d-primary">
            <Plus size={16} />
            <span>Assign Worker</span>
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      {successMsg && (
        <div style={{ padding: '14px 18px', background: 'rgba(91,173,138,0.15)', border: '1.5px solid #5BAD8A', color: '#1e5c3e', marginBottom: 20, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.3s ease' }}>
          <CheckCircle size={18} color="#5BAD8A" /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(224,123,84,0.12)', border: '1.5px solid #E07B54', color: '#7a2e00', marginBottom: 20, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#E07B54" /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#E07B54' }}><X size={16} /></button>
        </div>
      )}

      {/* ── KPI STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="d-card" style={{ '--hover-color': s.color, animationDelay: s.delay }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
              <div style={{ background: s.bg, padding: 10, color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.03em', margin: '12px 0 6px', lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>
              {i === 0 ? 'Pharmacy staff' : i === 1 ? 'At registers' : i === 2 ? 'Active locations' : 'Need assignment'}
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar" style={{ marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7DA8C0', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search by name, email, branch..." value={search} onChange={e => setSearch(e.target.value)}
            className="inp-field" style={{ paddingLeft: 36 }} />
        </div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="inp-field" style={{ flex: 1, minWidth: 150 }}>
          <option value="all">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterSubRole} onChange={e => setFilterSubRole(e.target.value)} className="inp-field" style={{ flex: 1, minWidth: 140 }}>
          <option value="all">All Sub-Roles</option>
          <option value="Worker">🧑‍⚕️ Worker</option>
          <option value="Cashier">💰 Cashier</option>
        </select>
        {(search || filterBranch !== 'all' || filterSubRole !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterBranch('all'); setFilterSubRole('all'); }}
            style={{ padding: '10px 16px', background: 'rgba(224,123,84,0.1)', border: '1.5px solid rgba(224,123,84,0.4)', color: '#7a2e00', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── STAFF TABLE ── */}
      <div className="d-card-no-hover" style={{ padding: 0, animationDelay: '0.25s', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 180px 160px 120px 110px 1fr' }}>
          {['Staff Member', 'Contact', 'Branch & Role', 'Active Tasks', 'Assigned On', 'Actions'].map(h => (
            <div key={h} className="staff-th">{h}</div>
          ))}
        </div>

        {filteredWorkers.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#9DBDCE', background: 'rgba(224,239,243,0.3)' }}>
            <Users size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4A7A9B', marginBottom: 6 }}>
              {workers.length === 0 ? 'No workers assigned yet' : 'No workers match filters'}
            </div>
            <div style={{ fontSize: 13, color: '#9DBDCE', fontWeight: 600 }}>
              {workers.length === 0 ? 'Click "Assign Worker" to get started.' : 'Try adjusting your search or filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {filteredWorkers.map((w, idx) => {
              const workerTaskCount = tasks.filter(t => t.assigned_to === w.id && t.status !== 'Completed').length;
              const avatarColor = COLORS[idx % COLORS.length];
              return (
                <div key={`${w.id}-${w.branch_id}`} className="staff-row" style={{ animationDelay: `${0.05 * idx}s` }}>
                  {/* Name */}
                  <div className="staff-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white', flexShrink: 0, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {w.profile_photo
                          ? <img src={resolvePhoto(w.profile_photo)} alt={w.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                          : (w.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 800, color: '#0d3349', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.full_name}</div>
                    </div>
                  </div>
                  {/* Contact */}
                  <div className="staff-td">
                    <div style={{ fontSize: 12, color: '#1e4d6b', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.email}</div>
                    <div style={{ fontSize: 11, color: '#7DA8C0', marginTop: 2, fontWeight: 600 }}>{w.phone || '—'}</div>
                  </div>
                  {/* Branch & Role */}
                  <div className="staff-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <Building2 size={12} color="#7DA8C0" />
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#1e4d6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.branch_name || '—'}</span>
                    </div>
                    <SubRolePill role={w.sub_role} />
                  </div>
                  {/* Active Tasks */}
                  <div className="staff-td">
                    {workerTaskCount > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(224,123,84,0.15)', color: '#7a2e00', fontSize: 11, fontWeight: 800 }}>
                        <Flag size={11} /> {workerTaskCount} active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(91,173,138,0.12)', color: '#1e5c3e', fontSize: 11, fontWeight: 800 }}>
                        <CheckCircle size={11} /> All clear
                      </span>
                    )}
                  </div>
                  {/* Assigned On */}
                  <div className="staff-td">
                    <div style={{ fontSize: 11, color: '#7DA8C0', fontWeight: 700 }}>
                      {w.assigned_at ? new Date(w.assigned_at).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="staff-td">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => loadTasks(w)} className="action-btn"
                        style={{ background: 'rgba(79,163,195,0.12)', color: '#1e4d6b' }}>
                        <ClipboardList size={13} /> Tasks
                      </button>
                      <button onClick={() => setEditingWorker(w)} className="action-btn"
                        style={{ background: 'rgba(91,173,138,0.12)', color: '#1e5c3e' }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => setConfirmUnassign(w)} className="action-btn"
                        style={{ background: 'rgba(224,123,84,0.12)', color: '#7a2e00' }}>
                        <Trash2 size={13} /> Unassign
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {filteredWorkers.length > 0 && (
          <div style={{ padding: '12px 18px', background: 'rgba(224,239,243,0.5)', borderTop: '2px solid rgba(79,163,195,0.2)', fontSize: 11, fontWeight: 800, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {filteredWorkers.length} of {workers.length} workers</span>
            <span>{branches.length} active branches</span>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {(showAssignModal || editingWorker) && (
        <AssignModal
          unassigned={editingWorker ? [editingWorker] : unassigned}
          branches={branches}
          preSelectedWorker={editingWorker}
          onClose={() => { setShowAssignModal(false); setEditingWorker(null); }}
          onSuccess={(msg) => handleSuccess(msg || (editingWorker ? 'Worker updated successfully' : 'Worker assigned successfully'))}
        />
      )}

      {/* Confirm Unassign */}
      {confirmUnassign && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,#E07B54,#b85a38)', color: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: '50%' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Confirm Unassign</h3>
                <p style={{ margin: '3px 0 0', fontSize: 13, opacity: 0.9 }}>This will revoke their dashboard access</p>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'rgba(224,123,84,0.08)', border: '1.5px solid rgba(224,123,84,0.25)', marginBottom: 20 }}>
                <Avatar name={confirmUnassign.full_name} photo={confirmUnassign.profile_photo} size={46} />
                <div>
                  <div style={{ fontWeight: 900, color: '#0d3349', fontSize: 15 }}>{confirmUnassign.full_name}</div>
                  <div style={{ color: '#7DA8C0', fontSize: 12, marginTop: 3 }}>{confirmUnassign.email}</div>
                  <div style={{ marginTop: 6 }}><SubRolePill role={confirmUnassign.sub_role} /></div>
                </div>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#4A7A9B', fontWeight: 600, lineHeight: 1.6 }}>
                Are you sure you want to remove <strong style={{ color: '#0d3349' }}>{confirmUnassign.full_name}</strong> from their Pharmacy Worker role?
                They will <strong style={{ color: '#E07B54' }}>lose access</strong> to the dashboard immediately.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setConfirmUnassign(null)} className="btn-3d" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleUnassignConfirm} disabled={loading}
                  style={{ flex: 2, padding: '10px 20px', border: 'none', background: 'linear-gradient(135deg,#E07B54,#b85a38)', color: 'white', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {loading ? <SegmentedSpinner size={16} /> : <UserX size={16} />}
                  {loading ? 'Processing...' : 'Yes, Unassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {selectedWorkerForTasks && (
        <TaskModal
          worker={selectedWorkerForTasks}
          tasks={tasks.filter(t => t.assigned_to === selectedWorkerForTasks.id)}
          onClose={() => setSelectedWorkerForTasks(null)}
          onRefresh={() => loadTasks(selectedWorkerForTasks)}
        />
      )}
    </div>
  );
};

export default PharmacyStaff;
