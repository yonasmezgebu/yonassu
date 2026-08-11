const fs = require('fs');
const path = require('path');

const newStaffJsx = `import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, RefreshCw, X, CheckCircle, AlertTriangle, Loader2,
  Building2, UserCheck, UserX, ClipboardList, Calendar, Flag,
  Search, Zap, Edit2, Trash2
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return \`\${BACKEND_URL}\${url.startsWith('/') ? url : \`/\${url}\`}\`;
};

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#0284C7', '#7C3AED', '#DC2626'];

const Avatar = ({ name, photo, size = 40 }) => {
  const [err, setErr] = useState(false);
  const src = resolvePhoto(photo);
  const bg = COLORS[((name || '?').charCodeAt(0) - 65) % COLORS.length] || '#2563EB';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.4, fontWeight: 600, color: 'white',
    }}>
      {src && !err ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
      ) : (name || '?')[0].toUpperCase()}
    </div>
  );
};

const SubRolePill = ({ role }) => {
  const map = {
    Cashier: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Cashier' },
    Worker:  { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: 'Worker' },
  };
  const s = map[role] || { bg: 'var(--color-border)', color: 'var(--color-text-secondary)', label: role || '—' };
  return (
    <span className="pso-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
};

const StatusPill = ({ status }) => {
  const map = {
    Completed:   { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Completed' },
    'In Progress': { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'In Progress' },
    Pending:     { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Pending' },
  };
  const s = map[status] || map.Pending;
  return (
    <span className="pso-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
};

const PriorityPill = ({ pri }) => {
  const map = {
    High:   { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'High' },
    Medium: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Medium' },
    Low:    { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Low' },
  };
  const s = map[pri] || map.Low;
  return (
    <span className="pso-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
};

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
      await apiClient.post(\`/users/\${selectedUserId}/roles\`, {
        roleId: pwRole.id, branchId: parseInt(selectedBranchId), subRole: selectedSubRole
      });
      onSuccess(\`\${selectedUser?.full_name || 'User'} assigned as Pharmacy \${selectedSubRole} successfully.\`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Assignment failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="pso-modal-overlay">
      <div className="pso-modal-content card-container" style={{ maxWidth: 500, width: '100%', background: 'var(--color-bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="pso-title" style={{ fontSize: 18, margin: 0 }}>
              {preSelectedWorker ? 'Edit Worker Role' : 'Assign Pharmacy Worker'}
            </h2>
            <p className="pso-subtitle" style={{ margin: 0 }}>Assign the Pharmacy Worker role</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ padding: 12, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleAssign}>
            {/* Employee select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Employee <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select className="pso-input" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                <option value="">— Select an onboarded employee —</option>
                {unassigned.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email}) — {u.department_name || 'No Dept'}</option>
                ))}
              </select>
              {selectedUser && (
                <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-page)' }}>
                  <Avatar name={selectedUser.full_name} photo={selectedUser.profile_photo} size={40} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedUser.full_name}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Branch select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Branch <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select className="pso-input" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required>
                <option value="">— Select branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Sub-role */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Sub-Role <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Worker', 'Cashier'].map(sr => (
                  <button key={sr} type="button" onClick={() => setSelectedSubRole(sr)} className={selectedSubRole === sr ? 'btn-action-primary' : 'btn-action-secondary'} style={{ flex: 1, height: 36 }}>
                    {sr}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={onClose} className="btn-action-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={loading || !selectedUserId || !selectedBranchId} className="btn-action-primary" style={{ flex: 2 }}>
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
      await apiClient.patch(\`/pharmacy/tasks/\${taskId}/status\`, { status });
      onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="pso-modal-overlay">
      <div className="pso-modal-content card-container" style={{ maxWidth: 860, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-bg-card)', borderRadius: 12 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={worker.full_name} photo={worker.profile_photo} size={48} />
            <div>
              <h2 className="pso-title" style={{ fontSize: 18, margin: 0 }}>{worker.full_name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <SubRolePill role={worker.sub_role} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={14} /> {worker.branch_name}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Left: Create Task */}
          <div style={{ padding: 24, borderRight: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color="var(--color-primary)" /> Assign New Task
            </h3>
            {taskError && (
              <div style={{ padding: 12, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <AlertTriangle size={16} /> {taskError}
              </div>
            )}
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Task Type</label>
                <select className="pso-input" value={taskType} onChange={e => setTaskType(e.target.value)}>
                  <option>Stock Count</option>
                  <option>Expiry Check</option>
                  <option>Organize Shelves</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Priority</label>
                  <select className="pso-input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Deadline</label>
                  <input type="datetime-local" required className="pso-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Instructions</label>
                <textarea rows={4} className="pso-input" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Task details..." style={{ height: 'auto', padding: '8px 12px' }} />
              </div>
              <button type="submit" disabled={loading} className="btn-action-primary" style={{ width: '100%' }}>
                {loading ? <SegmentedSpinner size={16} /> : <Plus size={16} />}
                {loading ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>
          </div>

          {/* Right: Task List */}
          <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color="var(--color-primary)" /> Current Tasks ({tasks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '55vh', overflowY: 'auto' }}>
              {tasks.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-page)', borderRadius: 8, border: '1px dashed var(--color-border)' }}>
                  <ClipboardList size={32} style={{ opacity: 0.5, marginBottom: 8 }} /><br />
                  <span style={{ fontSize: 14 }}>No tasks assigned</span>
                </div>
              ) : tasks.map(t => (
                <div key={t.id} className="pso-card" style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{t.task_type}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <PriorityPill pri={t.priority} />
                    <span className="pso-badge" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}>
                      <Calendar size={12} /> {new Date(t.deadline).toLocaleString()}
                    </span>
                  </div>
                  {t.instructions && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, background: 'var(--color-bg-page)', padding: 12, borderRadius: 6 }}>
                      {t.instructions}
                    </div>
                  )}
                  <select className="pso-input" value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
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
      await apiClient.delete(\`/users/\${confirmUnassign.id}/roles/20\`);
      setConfirmUnassign(null);
      handleSuccess(\`\${confirmUnassign.full_name} unassigned successfully\`);
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
    { label: 'Total Workers',    value: workers.length,   icon: <Users size={24} />,    color: 'var(--color-primary)', bg: 'var(--color-info-bg)' },
    { label: 'Cashiers',         value: workers.filter(w => w.sub_role === 'Cashier').length, icon: <UserCheck size={24} />, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Branches Active',  value: branches.length,  icon: <Building2 size={24} />, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { label: 'Unassigned Staff', value: unassigned.length, icon: <UserX size={24} />,   color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  ];

  if (loading && workers.length === 0) {
    return (
      <div className="pso-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SegmentedSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="pso-root">
      {/* ── HEADER ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div className="pso-header-icon"><Users size={24} /></div>
          <div>
            <h1 className="pso-title">Staff Management</h1>
            <p className="pso-subtitle">Manage employees, assign roles &amp; tasks</p>
          </div>
        </div>
        <div className="pso-header-right">
          <button onClick={() => loadAll(true)} className="pso-btn-refresh" disabled={refreshing}>
            {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAssignModal(true)} className="btn-action-primary">
            <Plus size={16} />
            <span>Assign Worker</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="pso-content">
        {/* ── NOTIFICATIONS ── */}
        {successMsg && (
          <div style={{ padding: 16, background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={20} /> {successMsg}
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} /> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><X size={16} /></button>
          </div>
        )}

        {/* ── KPI STAT CARDS ── */}
        <div className="kpi-grid">
          {stats.map((s, i) => (
            <div key={s.label} className="pso-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: s.bg, color: s.color, width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{loading ? '—' : s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="pso-card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="toolbar" style={{ margin: 0 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <input type="search" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pso-input" />
            </div>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="pso-input" style={{ width: 180 }}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={filterSubRole} onChange={e => setFilterSubRole(e.target.value)} className="pso-input" style={{ width: 160 }}>
              <option value="all">All Roles</option>
              <option value="Worker">Worker</option>
              <option value="Cashier">Cashier</option>
            </select>
            {(search || filterBranch !== 'all' || filterSubRole !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterBranch('all'); setFilterSubRole('all'); }} className="btn-action-secondary">
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── STAFF TABLE ── */}
        <div className="pso-card table-wrap">
          {filteredWorkers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Users size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {workers.length === 0 ? 'No workers assigned yet' : 'No workers match filters'}
              </div>
              <div style={{ fontSize: 14, marginTop: 8 }}>
                {workers.length === 0 ? 'Click "Assign Worker" to get started.' : 'Try adjusting your search or filters.'}
              </div>
            </div>
          ) : (
            <table className="pso-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Contact</th>
                  <th>Branch &amp; Role</th>
                  <th>Active Tasks</th>
                  <th>Assigned On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((w, idx) => {
                  const workerTaskCount = tasks.filter(t => t.assigned_to === w.id && t.status !== 'Completed').length;
                  return (
                    <tr key={\`\${w.id}-\${w.branch_id}\`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={w.full_name} photo={w.profile_photo} size={40} />
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{w.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{w.email}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{w.phone || '—'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 13 }}>
                          <Building2 size={14} color="var(--color-text-muted)" /> {w.branch_name || '—'}
                        </div>
                        <SubRolePill role={w.sub_role} />
                      </td>
                      <td>
                        {workerTaskCount > 0 ? (
                          <span className="pso-badge" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                            <Flag size={12} /> {workerTaskCount} active
                          </span>
                        ) : (
                          <span className="pso-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                            <CheckCircle size={12} /> All clear
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          {w.assigned_at ? new Date(w.assigned_at).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => loadTasks(w)} className="btn-action-secondary" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
                            <ClipboardList size={14} /> Tasks
                          </button>
                          <button onClick={() => setEditingWorker(w)} className="btn-action-secondary" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button onClick={() => setConfirmUnassign(w)} className="btn-action-danger" style={{ height: 32, padding: '0 12px', fontSize: 13, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
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
        <div className="pso-modal-overlay">
          <div className="pso-modal-content card-container" style={{ maxWidth: 420, width: '100%', padding: 24, background: 'var(--color-bg-card)', borderRadius: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle color="var(--color-danger)" /> Confirm Unassign
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Are you sure you want to unassign <strong>{confirmUnassign.full_name}</strong> from their current role? They will lose access to the Pharmacy Worker dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmUnassign(null)} className="btn-action-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleUnassignConfirm} disabled={loading} className="btn-action-danger" style={{ flex: 1, background: 'var(--color-danger)', color: 'white', borderColor: 'var(--color-danger)' }}>
                {loading ? <SegmentedSpinner size={16} /> : 'Yes, Unassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Modal */}
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
`;

fs.writeFileSync(path.join('D:', 'SUTANA', 'frontend', 'src', 'pages', 'pharmacy', 'PharmacyStaff.jsx'), newStaffJsx, 'utf8');
console.log('PharmacyStaff.jsx completely rebuilt and written.');
