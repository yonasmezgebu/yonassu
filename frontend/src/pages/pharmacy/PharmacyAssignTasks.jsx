import React, { useState } from 'react';
import { ClipboardList, Plus, Edit2, CheckCircle2 } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyAssignTasks = () => {
  const [tasks, setTasks] = useState([
    { id: 'TSK-101', type: 'Stock count', staff: 'Abebe Kebede', branch: 'Branch A', priority: 'High', deadline: '2026-07-02T17:00', status: 'Pending', createdAt: '2026-07-01' },
    { id: 'TSK-102', type: 'Expiry check', staff: 'Helen Tadesse', branch: 'Branch B', priority: 'Medium', deadline: '2026-07-03T10:00', status: 'In Progress', createdAt: '2026-07-01' },
  ]);

  const [filters, setFilters] = useState({ status: 'All', staff: 'All', priority: 'All' });
  const [showForm, setShowForm] = useState(false);
  
  const [newTask, setNewTask] = useState({ staff: '', type: '', priority: '', deadline: '', instructions: '' });

  const handleCreateTask = () => {
    if (!newTask.staff || !newTask.type || !newTask.priority || !newTask.deadline) {
      triggerNotification('Validation Error', 'Please fill all required fields.', 'info');
      return;
    }
    const created = {
      id: `TSK-${Math.floor(Math.random() * 900) + 100}`,
      staff: newTask.staff,
      type: newTask.type,
      priority: newTask.priority,
      deadline: newTask.deadline,
      status: 'Pending',
      branch: 'Branch A',
      createdAt: '2026-07-01'
    };
    setTasks([created, ...tasks]);
    setShowForm(false);
    setNewTask({ staff: '', type: '', priority: '', deadline: '', instructions: '' });
    submitNotification('Task Assigned', `New task assigned to ${created.staff}`);
  };

  const handleStatusUpdate = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    // No sound for status updates — just UI change
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={24} color="#0284c7" /> ASSIGN TASKS
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Assign & Track Staff Tasks</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> New Task
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Create New Task</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Assign To *</label>
              <select value={newTask.staff} onChange={e => setNewTask({...newTask, staff: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <option value="">Select Staff...</option><option>Abebe Kebede</option><option>Helen Tadesse</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Task Type *</label>
              <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <option value="">Select Type...</option>
                <option>Stock count</option><option>Goods receiving</option><option>Sales shift</option>
                <option>Inventory transfer</option><option>Expiry check</option><option>Prescription processing</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Priority *</label>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <option value="">Select Priority...</option><option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Deadline *</label>
              <input type="datetime-local" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Instructions</label>
              <input type="text" placeholder="Optional details..." value={newTask.instructions} onChange={e => setNewTask({...newTask, instructions: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <button onClick={handleCreateTask} style={{ background: '#0284c7', color: 'white', padding: '10px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Assign Task
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Staff</label>
          <select value={filters.staff} onChange={e => setFilters({...filters, staff: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Abebe Kebede</option><option>Helen Tadesse</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Priority</label>
          <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Task Type</th>
              <th style={{ padding: 12, color: '#475569' }}>Assigned To</th>
              <th style={{ padding: 12, color: '#475569' }}>Priority</th>
              <th style={{ padding: 12, color: '#475569' }}>Deadline</th>
              <th style={{ padding: 12, color: '#475569' }}>Status</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Manager Override</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{t.type} <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>{t.id}</div></td>
                <td style={{ padding: 12 }}>{t.staff} <div style={{ fontSize: 12, color: '#64748b' }}>{t.branch}</div></td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: t.priority === 'High' ? '#fee2e2' : t.priority === 'Medium' ? '#fef3c7' : '#e0e7ff', color: t.priority === 'High' ? '#991b1b' : t.priority === 'Medium' ? '#92400e' : '#3730a3', fontWeight: 'bold' }}>
                    {t.priority}
                  </span>
                </td>
                <td style={{ padding: 12 }}>{new Date(t.deadline).toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: t.status === 'Completed' ? '#dcfce7' : t.status === 'In Progress' ? '#dbeafe' : '#f1f5f9', color: t.status === 'Completed' ? '#166534' : t.status === 'In Progress' ? '#1e40af' : '#475569', fontWeight: 'bold' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <select 
                    value={t.status} 
                    onChange={e => handleStatusUpdate(t.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyAssignTasks;
