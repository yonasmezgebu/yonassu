import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Download, Printer, Filter } from 'lucide-react';
import { storeSuccess, storeInfo } from '../../utils/storeNotifications';

const initialTasks = [
  { id: 'TSK-001', staff: 'Selamawit Tadesse', type: 'Stock Count', priority: 'High', deadline: new Date(Date.now() - 3600000).toISOString().slice(0,16), status: 'Pending', desc: 'Count all items in Rack A' },
  { id: 'TSK-002', staff: 'Abebe Kebede', type: 'Goods Receiving', priority: 'Medium', deadline: new Date(Date.now() + 86400000).toISOString().slice(0,16), status: 'In Progress', desc: 'Process M12 delivery from ABC Pharma' },
];

const StoreAssignTasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [notifiedOverdue, setNotifiedOverdue] = useState(new Set());
  
  const [formData, setFormData] = useState({ staff: '', type: 'Stock Count', priority: 'Medium', deadline: '', desc: '' });

  // Background Job: Overdue Detection
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(t => {
        if (t.status !== 'Completed' && new Date(t.deadline) < now && !notifiedOverdue.has(t.id)) {
          storeInfo(`⏰ Task Overdue - ${t.type}`, '⏰ Overdue Task', `${t.staff} has an overdue task: ${t.type}`);
          setNotifiedOverdue(prev => new Set(prev).add(t.id));
        }
      });
    }, 10000); // Check every 10 seconds for demo purposes
    return () => clearInterval(interval);
  }, [tasks, notifiedOverdue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTask = { ...formData, id: `TSK-00${tasks.length + 1}`, status: 'Pending' };
    setTasks([newTask, ...tasks]);
    storeSuccess(`📋 Task Assigned to ${formData.staff}`, '📋 New Task', `Task ${formData.type} assigned.`);
    setShowForm(false);
    setFormData({ staff: '', type: 'Stock Count', priority: 'Medium', deadline: '', desc: '' });
  };

  const statusColors = {
    'Pending': { bg: '#fef3c7', c: '#92400e' },
    'In Progress': { bg: '#eff6ff', c: '#1d4ed8' },
    'Completed': { bg: '#dcfce7', c: '#166534' },
    'Overdue': { bg: '#fee2e2', c: '#991b1b' },
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9' }}>
            <CheckSquare color="#8b5cf6" size={28} /> ASSIGN TASKS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Task Log</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #c4b5fd', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#6d28d9' }}>Assign New Task</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Staff Member *</label>
                <select required value={formData.staff} onChange={e => setFormData({ ...formData, staff: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option value="" disabled>Select Staff...</option>
                  <option>Abebe Kebede</option>
                  <option>Selamawit Tadesse</option>
                  <option>Dawit Mekonnen</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Task Type *</label>
                <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option>Stock Count</option>
                  <option>Goods Receiving</option>
                  <option>Goods Issue</option>
                  <option>Stock Transfer</option>
                  <option>Stock Adjustment</option>
                  <option>Shelf Restocking</option>
                  <option>Cleaning & Organization</option>
                  <option>Expiry Check</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Priority *</label>
                <select required value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Deadline *</label>
                <input required type="datetime-local" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Instructions</label>
                <textarea required value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box', minHeight: 60 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Assign Task</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f3ff' }}>
              {['Task #', 'Staff Member', 'Task Type', 'Priority', 'Deadline', 'Instructions', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#6d28d9', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const isOverdue = t.status !== 'Completed' && new Date(t.deadline) < new Date();
              const displayStatus = isOverdue ? 'Overdue' : t.status;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 700 }}>{t.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{t.staff}</td>
                  <td style={{ padding: '12px 14px' }}>{t.type}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: t.priority === 'High' ? '#b91c1c' : t.priority === 'Medium' ? '#b45309' : '#15803d' }}>{t.priority}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{new Date(t.deadline).toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', color: '#475569', maxWidth: 200 }}>{t.desc}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusColors[displayStatus].bg, color: statusColors[displayStatus].c }}>{displayStatus}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreAssignTasks;
