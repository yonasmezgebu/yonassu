import React from 'react';
import { Calendar, CheckCircle, ShoppingCart, FileText } from 'lucide-react';
import { mockInventoryState, updateTaskStatus } from '../../utils/storeTransactionService';
import { receiveNotification } from '../../utils/pharmacyNotifications';

// Simulate today's sales and prescriptions totals (same data sources as Items 1-2 and 16-17)
const TODAYS_SALES_TOTAL = 1250.00;
const TODAYS_TRANSACTIONS = 45;
const TOP_SELLING = ['Amoxicillin', 'Paracetamol', 'Ibuprofen'];
const PRESCRIPTIONS_RECEIVED = 18;
const PRESCRIPTIONS_PROCESSED = 12;

const STATUS_COLORS = {
  Pending: { bg: '#f1f5f9', color: '#475569' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  Completed: { bg: '#dcfce7', color: '#16a34a' },
};

const PRIORITY_BADGE = {
  High: { bg: '#fee2e2', color: '#dc2626' },
  Medium: { bg: '#fef3c7', color: '#d97706' },
  Low: { bg: '#dcfce7', color: '#16a34a' },
};

const PharmacyWorkerTodaysWork = () => {
  const today = new Date().toISOString().slice(0, 10);
  // Pull LIVE from same mockInventoryState.tasks used by MyTasks (Item 8)
  const todaysTasks = mockInventoryState.tasks.filter(t => t.deadline === today || t.status === 'In Progress');

  React.useEffect(() => {
    receiveNotification("📅 Today's Work Summary", 'Daily Summary - Click to View');
  }, []);

  const handleMarkComplete = (task) => {
    updateTaskStatus(task.id, 'Completed');
    // Force re-render
    window.location.reload();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#4c1d95' }}>
          <Calendar color="#a855f7" size={28} /> TODAY'S WORK
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>
          Document Model: Task Log (Today) — Live aggregated from Sales, Prescriptions, and Task Log
        </p>
      </div>

      {/* Summary Blocks Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* Today's Sales Summary */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#047857' }}>
            <ShoppingCart size={18} color="#10b981" /> Today's Sales Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#064e3b', marginBottom: 4 }}>TOTAL SALES</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#047857' }}>${TODAYS_SALES_TOTAL.toFixed(2)}</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#064e3b', marginBottom: 4 }}>TRANSACTIONS</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#047857' }}>{TODAYS_TRANSACTIONS}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>TOP SELLING MEDICINES</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TOP_SELLING.map((med, i) => (
                <span key={i} style={{ padding: '4px 10px', background: '#d1fae5', color: '#047857', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  #{i + 1} {med}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Prescriptions Summary */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#9a3412' }}>
            <FileText size={18} color="#f97316" /> Today's Prescriptions Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff7ed', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c2d12', marginBottom: 4 }}>RECEIVED</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#c2410c' }}>{PRESCRIPTIONS_RECEIVED}</div>
              <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Prescriptions logged today</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#064e3b', marginBottom: 4 }}>PROCESSED</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#047857' }}>{PRESCRIPTIONS_PROCESSED}</div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>
                {PRESCRIPTIONS_RECEIVED - PRESCRIPTIONS_PROCESSED} still pending
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Scheduled Tasks */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f5f3ff' }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} color="#8b5cf6" /> Today's Scheduled Tasks
          </h3>
        </div>
        {todaysTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No tasks scheduled for today.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                {['Task #', 'Task Name', 'Priority', 'Assigned By', 'Status', 'Action'].map(col => (
                  <th key={col} style={{ padding: '10px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todaysTasks.map(task => (
                <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8b5cf6' }}>{task.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{task.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...PRIORITY_BADGE[task.priority], padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{task.priority}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{task.assignedBy}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...STATUS_COLORS[task.status], padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{task.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {task.status !== 'Completed' && (
                      <button onClick={() => handleMarkComplete(task)} style={{ padding: '5px 12px', background: '#dcfce7', color: '#16a34a', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ✓ Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PharmacyWorkerTodaysWork;
