import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import {
  ClipboardList, Plus, Users, CheckCircle2, Clock, AlertCircle,
  Trash2, X, Search, RefreshCw, Calendar
} from 'lucide-react';

/* ── colour helpers ─────────────────────────────────── */
const PRIORITY_STYLE = {
  high:   { bg: '#fef2f2', color: '#dc2626', label: 'High' },
  medium: { bg: '#fefce8', color: '#d97706', label: 'Medium' },
  low:    { bg: '#eff6ff', color: '#2563eb', label: 'Low' },
};
const STATUS_STYLE = {
  pending:     { bg: '#f8fafc', color: '#64748b', label: 'Pending' },
  in_progress: { bg: '#eff6ff', color: '#2563eb', label: 'In Progress' },
  completed:   { bg: '#f0fdf4', color: '#16a34a', label: 'Completed' },
  cancelled:   { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
};

const Badge = ({ val, map }) => {
  const s = map[val] || map.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>{s.label}</span>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}
    <input {...props} style={{
      padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
      fontSize: 14, outline: 'none', background: '#fff', color: '#111827',
      transition: 'border-color 0.15s', ...(props.style || {})
    }} />
  </div>
);

const SelectInput = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}
    <select {...props} style={{
      padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
      fontSize: 14, outline: 'none', background: '#fff', color: '#111827',
      cursor: 'pointer', ...(props.style || {})
    }}>{children}</select>
  </div>
);

/* ────────────────────────────────────────────────────
   ManagerTaskPanel — drop this into any manager dashboard
   Props:
     department: 'pharmacy' | 'sales' | 'printing' | 'car_rental' | 'purchase'
     title?: string
   ──────────────────────────────────────────────────── */
const ManagerTaskPanel = ({ department, title = 'Assign Employee Tasks' }) => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast]         = useState(null);

  const [form, setForm] = useState({
    assigned_to_user_id: '',
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [reports, setReports]     = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, taskRes, reportRes] = await Promise.all([
        api.get(`/employee-tasks/employees?department=${department}`),
        api.get(`/employee-tasks/department/${department}`),
        api.get(`/employee-reports/department/${department}`)
      ]);
      setEmployees(empRes.data?.data || empRes.data || []);
      setTasks(taskRes.data?.data || taskRes.data || []);
      setReports(reportRes.data?.data || reportRes.data || []);
    } catch (e) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assigned_to_user_id || !form.title || !form.due_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/employee-tasks', { ...form, department });
      showToast('Task assigned successfully!');
      setForm({ assigned_to_user_id: '', title: '', description: '', priority: 'medium', due_date: '' });
      setShowForm(false);
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to assign task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/employee-tasks/${id}`);
      showToast('Task deleted');
      loadData();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = search === '' ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredReports = reports.filter(r => {
    return search === '' || 
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.report_text?.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={22} color="#16a34a" /> {title}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Manage employee tasks and review submitted reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
            <RefreshCw size={15} /> Refresh
          </button>
          {activeTab === 'tasks' && (
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} /> {showForm ? 'Cancel' : 'Assign Task'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: activeTab === 'tasks' ? 700 : 500, color: activeTab === 'tasks' ? '#16a34a' : '#64748b', cursor: 'pointer', borderBottom: activeTab === 'tasks' ? '2px solid #16a34a' : '2px solid transparent', marginBottom: -2 }}
        >
          Assigned Tasks ({tasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: activeTab === 'reports' ? 700 : 500, color: activeTab === 'reports' ? '#16a34a' : '#64748b', cursor: 'pointer', borderBottom: activeTab === 'reports' ? '2px solid #16a34a' : '2px solid transparent', marginBottom: -2 }}
        >
          Employee Reports ({reports.length})
        </button>
      </div>

      {/* Content based on Tab */}
      {activeTab === 'tasks' ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Tasks', value: stats.total, icon: <ClipboardList size={18} />, color: '#6366f1' },
              { label: 'Pending', value: stats.pending, icon: <Clock size={18} />, color: '#f59e0b' },
              { label: 'In Progress', value: stats.in_progress, icon: <RefreshCw size={18} />, color: '#2563eb' },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={18} />, color: '#16a34a' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Assign Form */}
          {showForm && (
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#16a34a" /> New Task Assignment
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <SelectInput label="Assign To *" value={form.assigned_to_user_id}
                    onChange={e => setForm(f => ({ ...f, assigned_to_user_id: e.target.value }))}>
                    <option value="">Select Employee...</option>
                    {employees.length === 0 ? (
                      <option disabled value="">No employees registered in HR yet</option>
                    ) : employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                    ))}
                  </SelectInput>
                  <SelectInput label="Priority" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </SelectInput>
                  <Input label="Due Date *" type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
                  <Input label="Task Title *" placeholder="e.g. Stock count — Aisle 3" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Description / Instructions</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detailed instructions for the employee..."
                      rows={3}
                      style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                    <ClipboardList size={16} /> {submitting ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </div>
          )}


      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or employees..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <SelectInput value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 140 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </SelectInput>
        <div style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: '12px 0 0' }}>Loading tasks...</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Task', 'Assigned To', 'Priority', 'Due Date', 'Status', 'Progress', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No tasks found. Assign a new task to get started.</div>
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t.title}</div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{t.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>#{t.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>{t.assigned_to_name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Assigned by {t.assigned_by_name || 'Manager'}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge val={t.priority} map={PRIORITY_STYLE} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                      <Calendar size={13} color="#94a3b8" />
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge val={t.status} map={STATUS_STYLE} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.progress_pct || 0}%`, background: '#16a34a', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{t.progress_pct || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(t.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 6, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Delete task">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      ) : (
        <>
          {/* Reports Tab */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports by employee or content..."
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredReports.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No reports submitted yet.</div>
              </div>
            ) : filteredReports.map(r => (
              <div key={r.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{r.employee_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', flex: 1 }}>
                  {r.report_text}
                </div>
                {r.document_name && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <a href={`http://localhost:5000${r.document_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                      <ClipboardList size={14} /> Download Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManagerTaskPanel;
