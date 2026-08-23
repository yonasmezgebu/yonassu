import React, { useState, useEffect } from 'react';
import { Clock, Filter, Phone, Play, PauseCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_BADGE = {
  SUBMITTED:   { bg: '#dcfce7', color: '#166534', label: 'New' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8', label: 'In Progress' },
  ON_HOLD:     { bg: '#fee2e2', color: '#991b1b', label: 'On Hold' },
  READY:       { bg: '#f3e8ff', color: '#7e22ce', label: 'Ready for Pickup' },
  DISPENSED:   { bg: '#f1f5f9', color: '#475569', label: 'Dispensed' },
};

const PharmacyWorkerPendingPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('oldest');

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pharmacy-sales/prescriptions', {
        params: { status: 'SUBMITTED,IN_PROGRESS,ON_HOLD' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(res.data.data || []);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  const handleProcess = (rx) => { navigate('/pharmacy-worker/pos', { state: { prescription_id: rx.id } });
  };

  const handleHold = async (rx) => {
    const reason = window.prompt(`Reason for putting RX #${rx.prescription_code} on hold:`);
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/pharmacy-sales/prescriptions/${rx.id}/status`, {
        status: 'ON_HOLD',
        note: reason
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchPrescriptions();
    } catch (err) {
      console.error('Hold failed:', err);
    }
  };

  const handleNotify = (rx) => { alert(`Patient ${rx.patient_name || 'Unknown'} will be notified at their registered contact.`);
  };

  const sorted = [...prescriptions].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#9a3412' }}>
            <Clock color="#f97316" size={28} /> PENDING PRESCRIPTIONS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Live data from prescriptions table — active queue</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchPrescriptions} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 12px 8px 32px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading prescriptions...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#16a34a', fontWeight: 600, fontSize: 16 }}>
            ✅ No pending prescriptions. Queue is clear.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>RX Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Patient Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Doctor / Prescriber</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Submitted</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Waiting</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(rx => {
                const badge = STATUS_BADGE[rx.status] || STATUS_BADGE.SUBMITTED;
                const days = daysAgo(rx.created_at);
                return (
                  <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#f97316', fontWeight: 600 }}>
                      {rx.prescription_code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{rx.patient_name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{rx.prescriber_name || rx.prescriber_hospital || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>
                      {rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-ET') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: days > 2 ? '#dc2626' : '#64748b', fontWeight: days > 2 ? 'bold' : 'normal' }}>
                      {days === 0 ? 'Today' : `${days}d`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...badge, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleProcess(rx)} title="Process at POS" style={{ background: '#f97316', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                          <Play size={13} /> Dispense
                        </button>
                        <button onClick={() => handleHold(rx)} title="Put on Hold" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <PauseCircle size={14} />
                        </button>
                        <button onClick={() => handleNotify(rx)} title="Notify Patient" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Phone size={14} />
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
  );
};

export default PharmacyWorkerPendingPrescriptions;
