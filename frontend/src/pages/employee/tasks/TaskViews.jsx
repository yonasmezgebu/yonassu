import React, { useState, useEffect, useCallback } from 'react';
import { Clock, PlayCircle, CheckCircle, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../services/apiClient';
import { playSound } from '../../../services/notificationManager';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6'
};

// --- Shared Task Card Component ---
const TaskCard = ({ task, onUpdate }) => {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>
            TASK-{task.id} • {task.department?.replace('_', ' ').toUpperCase()} • FROM: {task.assigned_by_name}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>{task.title}</h3>
          <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>
            {task.description || 'No description provided.'}
          </p>
          {task.notes && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#475569', borderLeft: '3px solid #cbd5e1' }}>
              <strong>Latest Note:</strong> {task.notes}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
            {task.priority} Priority
          </span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: task.status === 'overdue' ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Status: <strong style={{ color: task.status === 'cancelled' ? '#ef4444' : '#0f172a' }}>{task.status.replace('_', ' ')}</strong>
          </span>
          {task.status === 'in_progress' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
              <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${task.progress_pct || 0}%`, backgroundColor: '#3b82f6' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{task.progress_pct || 0}%</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.status === 'pending' && (
            <button onClick={() => onUpdate(task, 'in_progress')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <PlayCircle size={16} /> Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <>
              <button onClick={() => onUpdate(task, 'update')} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <PlusCircle size={16} /> Update Progress
              </button>
              <button onClick={() => onUpdate(task, 'completed')} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <CheckCircle size={16} /> Complete Task
              </button>
            </>
          )}
          {task.status === 'completed' && (
             <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <CheckCircle size={16} /> Completed on {new Date(task.completed_at || task.updated_at).toLocaleDateString()}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Shared Layout ---
const PageHeader = ({ title, description, count, onRefresh }) => (
  <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {title} {count !== undefined && <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 10px', borderRadius: '20px', fontSize: '14px' }}>{count}</span>}
      </h1>
      <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
    </div>
    {onRefresh && (
      <button onClick={onRefresh} style={{ padding: '8px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <RefreshCw size={16} /> Refresh
      </button>
    )}
  </div>
);

// --- Task Update Modal ---
const ProgressModal = ({ task, onClose, onSave, completing }) => {
  const [pct, setPct] = useState(completing ? 100 : (task.progress_pct || 0));
  const [note, setNote] = useState(task.notes || '');
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await onSave(task.id, completing ? 'completed' : 'in_progress', pct, note);
    setSaving(false);
  };
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
          {completing ? 'Complete Task' : 'Update Progress'}: TASK-{task.id}
        </h3>
        
        {!completing && (
          <>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Progress (%)</label>
            <input type="number" min="0" max="100" value={pct} onChange={e => setPct(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box' }} />
          </>
        )}
        
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Note (optional)</label>
        <textarea rows="3" value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '24px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', backgroundColor: completing ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Saving...' : (completing ? 'Mark Complete' : 'Save Update')}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Generic Task List Component ---
const TaskList = ({ title, description, filterStatus }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, task: null, completing: false });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employee-tasks', { params: { status: filterStatus } });
      setTasks(data?.data || data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAction = async (task, action) => {
    if (action === 'in_progress') {
      // Start task immediately
      try {
        await api.patch(`/employee-tasks/${task.id}/status`, { status: 'in_progress' });
        playSound('info');
        fetchTasks();
      } catch (e) {
        playSound('error');
        console.error('Failed to start task', e);
      }
    } else if (action === 'update') {
      setModalState({ open: true, task, completing: false });
    } else if (action === 'completed') {
      setModalState({ open: true, task, completing: true });
    }
  };

  const handleSaveModal = async (taskId, status, progress_pct, notes) => {
    try {
      await api.patch(`/employee-tasks/${taskId}/status`, { status, progress_pct, notes });
      playSound(status === 'completed' ? 'success' : 'info');
      setModalState({ open: false, task: null, completing: false });
      fetchTasks();
    } catch (e) {
      playSound('error');
      console.error('Failed to save task update', e);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title={title} description={description} count={tasks.length} onRefresh={fetchTasks} />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', fontWeight: '500' }}>No tasks found for this view.</p>
        </div>
      ) : (
        tasks.map(t => (
          <TaskCard key={t.id} task={t} onUpdate={handleAction} />
        ))
      )}

      {modalState.open && (
        <ProgressModal 
          task={modalState.task} 
          completing={modalState.completing}
          onClose={() => setModalState({ open: false, task: null, completing: false })} 
          onSave={handleSaveModal} 
        />
      )}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// --- The 4 Task Views ---

export const TodayTasks = () => <TaskList title="Today's Tasks" description="Tasks currently pending or in progress." filterStatus="all" />;
export const MyTasks = () => <TaskList title="My Active Tasks" description="All pending and active tasks assigned to you." filterStatus="all" />;
export const InProgressTasks = () => <TaskList title="In Progress" description="Tasks you are actively working on." filterStatus="in_progress" />;
export const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employee-tasks', { params: { status: 'completed' } });
      setTasks(data?.data || data || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Completed Tasks" description="Read-only history of completed assignments." count={tasks.length} onRefresh={fetchTasks} />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Task #</th>
              <th>Title</th>
              <th>Department</th>
              <th>Assigned By</th>
              <th>Completed Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>TASK-{t.id}</td>
                <td style={{ color: '#475569', fontSize: '14px' }}>{t.title}</td>
                <td style={{ color: '#64748b', fontSize: '13px', textTransform: 'capitalize' }}>{t.department?.replace('_', ' ')}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{t.assigned_by_name}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {tasks.length === 0 && !loading && (
              <tr><td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No completed tasks yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
