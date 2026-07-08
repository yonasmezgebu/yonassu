import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = '/api/pharmacy-sales';
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PharmacyFinanceControls() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [stats, setStats] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [expiredReports, setExpiredReports] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    loadStats();
    loadDailyReports();
  }, []);

  const loadStats = async () => {
    try { const r = await axios.get(`${API}/stats`, { headers }); setStats(r.data.data); } catch { }
  };
  const loadDailyReports = async () => {
    try { const r = await axios.get(`${API}/reports/daily`, { headers }); setDailyReports(r.data.data || []); } catch { }
  };
  const loadHandovers = async () => {
    try { const r = await axios.get(`${API}/handovers`, { headers }); setHandovers(r.data.data || []); } catch { }
  };
  const loadChangeRequests = async () => {
    try { const r = await axios.get(`${API}/change-requests`, { headers }); setChangeRequests(r.data.data || []); } catch { }
  };
  const loadExpiredReports = async () => {
    try { const r = await axios.get(`${API}/expired-drugs`, { headers }); setExpiredReports(r.data.data || []); } catch { }
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === 'reports') loadDailyReports();
    if (t === 'handovers') loadHandovers();
    if (t === 'changes') loadChangeRequests();
    if (t === 'expired') loadExpiredReports();
  };

  const decide = async (endpoint, id, status, reason = '') => {
    try {
      await axios.patch(`${API}/${endpoint}/${id}/decide`, { status, finance_decision_reason: reason || undefined }, { headers });
      alert(`✅ ${status}`);
      if (endpoint === 'change-requests') loadChangeRequests();
      if (endpoint === 'expired-drugs') loadExpiredReports();
      if (endpoint === 'reports/daily') { loadDailyReports(); loadStats(); }
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const settleHandover = async (id) => {
    try {
      await axios.patch(`${API}/handovers/${id}/settle`, {}, { headers });
      loadHandovers();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const tabs = [
    { key: 'overview', label: '📊 Finance Overview' },
    { key: 'reports', label: '📑 Daily Sales Reports' },
    { key: 'handovers', label: '💰 Cash Handovers' },
    { key: 'changes', label: '🔄 Price/Qty Changes' },
    { key: 'expired', label: '⚠️ Expired Drugs' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: 24, background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🏛️</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#38bdf8' }}>Pharmacy Finance & Operations Controls</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            style={{ background: tab === t.key ? 'rgba(56,189,248,0.15)' : 'transparent', border: '1px solid', borderColor: tab === t.key ? '#38bdf8' : '#334155', color: tab === t.key ? '#38bdf8' : '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={statCard}>
            <div style={statLabel}>Today's Revenue</div>
            <div style={{ ...statValue, color: '#38bdf8' }}>{fmt(stats.today?.total_revenue)}</div>
            <div style={statSub}>VAT: {fmt(stats.today?.total_vat)}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Monthly Revenue</div>
            <div style={{ ...statValue, color: '#a78bfa' }}>{fmt(stats.month?.total_revenue)}</div>
            <div style={statSub}>VAT: {fmt(stats.month?.total_vat)}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Pending Daily Reports</div>
            <div style={{ ...statValue, color: stats.pending_reports > 0 ? '#f59e0b' : '#10b981' }}>{stats.pending_reports}</div>
            <div style={statSub}>Awaiting finance approval</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Pending Operations</div>
            <div style={{ ...statValue, color: '#f59e0b' }}>
              {stats.pending_change_requests} Changes, {stats.pending_expired_reports} Expired
            </div>
            <div style={statSub}>Requires CEO/Manager action</div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Daily Sales Reports Review</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Branch</th>
                <th style={thStyle}>Total Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dailyReports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}>{r.report_date}</td>
                  <td style={tdStyle}>{r.branch_name || 'All'}</td>
                  <td style={{ ...tdStyle, color: '#10b981', fontWeight: 600 }}>{fmt(r.total_amount)}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: r.status === 'PENDING_FINANCE' ? '#f59e0b' : r.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {r.status === 'PENDING_FINANCE' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => decide('reports/daily', r.id, 'APPROVED')} style={btnApprove}>Approve</button>
                        <button onClick={() => { const rr = prompt('Reason:'); if (rr) decide('reports/daily', r.id, 'REJECTED', rr); }} style={btnReject}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'handovers' && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Cash Handovers</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Worker</th>
                <th style={thStyle}>Received By</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {handovers.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}>{new Date(h.created_at).toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 600 }}>{fmt(h.amount)}</td>
                  <td style={tdStyle}>{h.worker_name || h.worker_id}</td>
                  <td style={tdStyle}>{h.received_by || h.handed_to}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: h.status === 'SETTLED' ? '#10b981' : '#f59e0b' }}>
                      {h.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {h.status === 'PENDING' && (
                      <button onClick={() => settleHandover(h.id)} style={btnApprove}>Mark Settled</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'changes' && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Price & Quantity Change Requests</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={thStyle}>Drug</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Change</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {changeRequests.map(cr => (
                <tr key={cr.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}>{cr.drug_name}</td>
                  <td style={tdStyle}>{cr.target_type}</td>
                  <td style={tdStyle}>{cr.current_value} → {cr.requested_value}</td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{cr.reason}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cr.status === 'PENDING' ? '#f59e0b' : cr.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>
                      {cr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'expired' && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Expired Drug Reports</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={thStyle}>Drug</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {expiredReports.map(er => (
                <tr key={er.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}>{er.drug_name}</td>
                  <td style={tdStyle}>{er.location}</td>
                  <td style={tdStyle}>{er.quantity}</td>
                  <td style={tdStyle}>{er.requested_action}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: er.status === 'PENDING' ? '#f59e0b' : er.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>
                      {er.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const statCard = { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 };
const statLabel = { fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 };
const statValue = { fontSize: 24, fontWeight: 700 };
const statSub = { fontSize: 11, color: '#64748b', marginTop: 4 };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const thStyle = { textAlign: 'left', padding: '12px 16px', fontWeight: 600 };
const tdStyle = { padding: '12px 16px' };
const btnApprove = { background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
const btnReject = { background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
