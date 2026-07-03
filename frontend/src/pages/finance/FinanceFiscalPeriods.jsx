import React, { useState } from 'react';
import { Calendar, Lock, Unlock, Plus } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceFiscalPeriods = () => {
  const [periods, setPeriods] = useState(financeState.fiscalPeriods);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAddPeriod = (e) => {
    e.preventDefault();
    const newPeriod = {
      id: `FY-${Date.now()}`,
      name, startDate, endDate,
      isClosed: false
    };
    financeState.fiscalPeriods.push(newPeriod);
    setPeriods([...financeState.fiscalPeriods]);
    setShowAddForm(false);
    setName(''); setStartDate(''); setEndDate('');
    submitNotification('📅 Fiscal Period Updated', '📅 New Fiscal Period Created - Click to View');
  };

  const toggleLock = (periodId) => {
    const period = financeState.fiscalPeriods.find(p => p.id === periodId);
    if (period) {
      period.isClosed = !period.isClosed;
      setPeriods([...financeState.fiscalPeriods]);
      submitNotification('📅 Fiscal Period Updated', `📅 Period ${period.isClosed ? 'Locked' : 'Unlocked'} - Click to View`);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#4c1d95' }}>
            <Calendar color="#6d28d9" size={28} /> FISCAL PERIODS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage accounting periods and lock them to prevent backdated transactions.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Define New Period
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Define Fiscal Period</h3>
          <form onSubmit={handleAddPeriod} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
               <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Period Name *</label>
               <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q1 2024, FY 2024" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
               <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Start Date *</label>
               <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
               <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>End Date *</label>
               <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '8px 24px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, height: 35 }}>Save Period</button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Period Name', 'Start Date', 'End Date', 'Status', 'Action'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Action' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No fiscal periods defined.</td></tr>
            ) : periods.map(period => (
              <tr key={period.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>{period.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{period.startDate}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{period.endDate}</td>
                <td style={{ padding: '12px 16px' }}>
                  {period.isClosed ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      <Lock size={12} /> Closed / Locked
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      <Unlock size={12} /> Open
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => toggleLock(period.id)} style={{ padding: '6px 12px', background: 'white', border: `1px solid ${period.isClosed ? '#16a34a' : '#dc2626'}`, color: period.isClosed ? '#16a34a' : '#dc2626', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {period.isClosed ? 'Reopen Period' : 'Close Period'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceFiscalPeriods;
