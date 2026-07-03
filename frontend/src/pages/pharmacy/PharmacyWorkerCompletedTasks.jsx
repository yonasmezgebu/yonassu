import React, { useState } from 'react';
import { CheckCircle, Download, Printer } from 'lucide-react';
import { mockInventoryState } from '../../utils/storeTransactionService';
import { receiveNotification } from '../../utils/pharmacyNotifications';

const MOCK_COMPLETED = [
  { id: 'TSK-103', name: 'Monthly Expiry Check', completedOn: '2026-06-26', timeTaken: '2h 30m', completedBy: 'Abebe Kebede', status: 'Verified', assignedBy: 'Manager' },
  { id: 'TSK-080', name: 'Restock Shelf A', completedOn: '2026-06-20', timeTaken: '45m', completedBy: 'Abebe Kebede', status: 'Completed', assignedBy: 'Admin' },
  { id: 'TSK-071', name: 'End of Day POS Reconciliation', completedOn: '2026-06-15', timeTaken: '30m', completedBy: 'Martha Yohannes', status: 'Verified', assignedBy: 'Manager' },
];

const PharmacyWorkerCompletedTasks = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignedBy, setAssignedBy] = useState('All');

  React.useEffect(() => {
    receiveNotification('✅ Completed Tasks Summary', 'Task History - Click to View');
  }, []);

  // Merge real completed tasks from shared store with mock history
  const storeCompleted = mockInventoryState.tasks.filter(t => t.status === 'Completed').map(t => ({
    id: t.id, name: t.name, completedOn: t.completedOn || 'N/A', timeTaken: 'N/A', completedBy: 'Abebe Kebede', status: 'Completed', assignedBy: t.assignedBy
  }));
  const allCompleted = [...storeCompleted, ...MOCK_COMPLETED].filter((t, idx, arr) => arr.findIndex(x => x.id === t.id) === idx);

  const filtered = allCompleted.filter(t => {
    const matchFrom = !dateFrom || t.completedOn >= dateFrom;
    const matchTo = !dateTo || t.completedOn <= dateTo;
    const matchAssigned = assignedBy === 'All' || t.assignedBy === assignedBy;
    return matchFrom && matchTo && matchAssigned;
  });

  const uniqueAssigners = ['All', ...new Set(allCompleted.map(t => t.assignedBy))];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#3730a3' }}>
            <CheckCircle color="#7c3aed" size={28} /> COMPLETED TASKS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Task History — Read-only</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Completed', value: filtered.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Verified', value: filtered.filter(t => t.status === 'Verified').length, color: '#059669', bg: '#f0fdf4' },
          { label: 'Pending Verification', value: filtered.filter(t => t.status === 'Completed').length, color: '#d97706', bg: '#fffbeb' },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Assigned By</label>
            <select value={assignedBy} onChange={e => setAssignedBy(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              {uniqueAssigners.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setAssignedBy('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
              {['Task #', 'Task Name', 'Completed On', 'Time Taken', 'Completed By', 'Status'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#4c1d95', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No completed tasks found for the selected filters.</td></tr>
            ) : filtered.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>{task.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{task.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{task.completedOn}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{task.timeTaken}</td>
                <td style={{ padding: '12px 16px' }}>{task.completedBy}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: task.status === 'Verified' ? '#dcfce7' : '#fef3c7',
                    color: task.status === 'Verified' ? '#166534' : '#92400e'
                  }}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerCompletedTasks;
