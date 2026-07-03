import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  AlertTriangle, Pill, Calendar, MapPin, FileText, List, RefreshCw,
  CheckCircle, XCircle, Clock, Trash2, RotateCcw, Upload
} from 'lucide-react';

const LOCATIONS = [
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Store', label: 'Store' },
];

const ACTIONS = [
  { value: 'Dispose', label: 'Dispose', icon: <Trash2 size={14} /> },
  { value: 'Return', label: 'Return', icon: <RotateCcw size={14} /> },
  { value: 'Write-off', label: 'Write-off', icon: <FileText size={14} /> },
];

export default function ExpiredDrugReport() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [drugName, setDrugName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('Pharmacy');
  const [actionRequired, setActionRequired] = useState('Dispose');

  useEffect(() => {
    if (tab === 'list') fetchReports();
  }, [tab]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/expired-drugs');
      setReports(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drugName.trim()) { showToast('Drug name is required', 'warning'); return; }
    if (!quantity) { showToast('Quantity is required', 'warning'); return; }
    if (!expiryDate) { showToast('Expiry date is required', 'warning'); return; }

    setLoading(true);
    try {
      const payload = {
        drug_name: drugName,
        quantity: parseInt(quantity),
        expiry_date: expiryDate,
        location,
        action_required: actionRequired,
      };
      const res = await apiClient.post('/pharmacy/expired-drugs', payload);
      if (res.status === 'success') {
        showToast('Expired drug report submitted to CEO', 'success');
        playSound('success');
        setDrugName('');
        setQuantity('');
        setExpiryDate('');
        setLocation('Pharmacy');
        setActionRequired('Dispose');
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={22} color="#EF4444" /> Expired Drug Report (B4)
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Report and manage expired drugs in pharmacy/store</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setTab('report')} style={tabBtn(tab === 'report')}>
          <Upload size={15} /> Submit Report
        </button>
        <button onClick={() => { setTab('list'); fetchReports(); }} style={tabBtn(tab === 'list')}>
          <List size={15} /> Reports ({reports.length})
        </button>
      </div>

      {tab === 'report' && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#224f94', color: 'white', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 8 }}>SUTANA</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Expired Drug Report</h2>
                  <p style={{ margin: 0, fontSize: 10, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Flow 4 — Expired Drug Handling (B4)</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 150, height: 150, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.6 }}></div>
              <div style={{ position: 'absolute', bottom: -8, right: 80, width: 50, height: 50, background: '#1c3d70', borderRadius: '12px' }}></div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}><Pill size={13} /> Drug Name *</label>
                  <input type="text" value={drugName} onChange={e => setDrugName(e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg" style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                    placeholder="e.g. 100" style={inputStyle()} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}><Calendar size={13} /> Expiry Date *</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                  style={inputStyle()} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}><MapPin size={13} /> Location *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {LOCATIONS.map(loc => (
                    <label key={loc.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', flex: 1,
                      border: `2px solid ${location === loc.value ? '#059669' : '#E2E8F0'}`,
                      borderRadius: 8, cursor: 'pointer', background: location === loc.value ? '#ECFDF5' : 'white',
                      fontWeight: 600, fontSize: 13, color: location === loc.value ? '#065F46' : '#475569',
                    }}>
                      <input type="radio" name="location" value={loc.value} checked={location === loc.value}
                        onChange={() => setLocation(loc.value)} style={{ display: 'none' }} />
                      {loc.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Action Required *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {ACTIONS.map(act => (
                    <label key={act.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', flex: 1,
                      border: `2px solid ${actionRequired === act.value ? '#059669' : '#E2E8F0'}`,
                      borderRadius: 8, cursor: 'pointer', background: actionRequired === act.value ? '#ECFDF5' : 'white',
                      fontWeight: 600, fontSize: 13, color: actionRequired === act.value ? '#065F46' : '#475569',
                    }}>
                      <input type="radio" name="action" value={act.value} checked={actionRequired === act.value}
                        onChange={() => setActionRequired(act.value)} style={{ display: 'none' }} />
                      {act.icon} {act.label}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px 24px', background: '#059669', color: 'white', border: 'none',
                  borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}>
                <AlertTriangle size={18} /> {loading ? 'Submitting...' : 'SUBMIT REQUEST TO CEO'}
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <List size={16} color="#EF4444" /> Past Reports
            </h3>
            <button onClick={fetchReports} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {reportsLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No expired drug reports found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Drug</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.drug_name}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.quantity}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#EF4444' }}>
                        {r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{r.location || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {r.action_required || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: r.status === 'PENDING' ? '#FEF3C7' : r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REJECTED' ? '#FEE2E2' : '#F1F5F9',
                        color: r.status === 'PENDING' ? '#92400E' : r.status === 'APPROVED' ? '#065F46' : r.status === 'REJECTED' ? '#991B1B' : '#475569',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
