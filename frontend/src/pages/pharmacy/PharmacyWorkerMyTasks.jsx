import React, { useState } from 'react';
import { CheckSquare, Play, MessageSquare } from 'lucide-react';
import { mockInventoryState, updateTaskStatus } from '../../utils/storeTransactionService';
import { receiveNotification } from '../../utils/pharmacyNotifications';

const PRIORITY_COLORS = {
  High: { bg: '#fee2e2', color: '#dc2626' },
  Medium: { bg: '#fef3c7', color: '#d97706' },
  Low: { bg: '#dcfce7', color: '#16a34a' },
};

const STATUS_COLORS = {
  Pending: { bg: '#f1f5f9', color: '#475569' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  Completed: { bg: '#dcfce7', color: '#16a34a' },
  Overdue: { bg: '#fee2e2', color: '#dc2626' },
};

const PharmacyWorkerMyTasks = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Deadline');
  const [tasks, setTasks] = useState(mockInventoryState.tasks);
  const [commentModal, setCommentModal] = useState(null);
  const [comment, setComment] = useState('');

  React.useEffect(() => {
    receiveNotification('📋 New Task Assigned', 'New Task - Click to View');
  }, []);

  const handleAction = (task, action) => {
    const newStatus = action === 'start' ? 'In Progress' : 'Completed';
    updateTaskStatus(task.id, newStatus);
    setTasks([...mockInventoryState.tasks]);
  };

  const filtered = tasks
    .filter(t => statusFilter === 'All' || t.status === statusFilter)
    .filter(t => priorityFilter === 'All' || t.priority === priorityFilter)
    .sort((a, b) => {
      if (sortBy === 'Deadline') return new Date(a.deadline) - new Date(b.deadline);
      const pOrder = { High: 0, Medium: 1, Low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#3730a3' }}>
          <CheckSquare color="#8b5cf6" size={28} /> MY TASKS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Task Log</p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Overdue</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Priority</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option>Deadline</option>
              <option>Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
              {['Task #', 'Task Name', 'Assigned By', 'Priority', 'Deadline', 'Days Rem.', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#4c1d95', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>{task.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{task.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{task.assignedBy}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...PRIORITY_COLORS[task.priority], padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{task.priority}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{task.deadline}</td>
                <td style={{ padding: '12px 16px', color: task.daysRemaining < 0 ? '#dc2626' : task.daysRemaining === 0 ? '#d97706' : '#64748b', fontWeight: task.daysRemaining <= 0 ? 'bold' : 'normal' }}>
                  {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d overdue` : task.daysRemaining === 0 ? 'Today' : `${task.daysRemaining}d`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...STATUS_COLORS[task.status], padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{task.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {task.status === 'Pending' && (
                      <button onClick={() => handleAction(task, 'start')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Play size={11} /> Start
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <button onClick={() => handleAction(task, 'complete')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#dcfce7', color: '#16a34a', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ✓ Complete
                      </button>
                    )}
                    <button onClick={() => { setCommentModal(task); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                      <MessageSquare size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Add Comment/Update</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>{commentModal.name} ({commentModal.id})</p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Enter your update or comment..." style={{ width: '100%', height: 120, padding: 12, border: '1px solid #cbd5e1', borderRadius: 6, resize: 'vertical', fontSize: 14, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setCommentModal(null); setComment(''); }} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { alert(`Comment saved for ${commentModal.id}: "${comment}"`); setCommentModal(null); setComment(''); }} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyWorkerMyTasks;
