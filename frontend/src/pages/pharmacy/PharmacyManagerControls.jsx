import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = '/api/pharmacy-sales';
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PharmacyManagerControls() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [expiredReports, setExpiredReports] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [hiddenDrugs, setHiddenDrugs] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [crForm, setCrForm] = useState({ drug_id: '', target_type: 'DRUG_PRICE', current_value: '', requested_value: '', reason: '' });
  const [erForm, setErForm] = useState({ drug_id: '', location: 'PHARMACY', quantity: '', expiry_date: '', requested_action: 'Dispose' });
  const [hideForm, setHideForm] = useState({ drug_id: '', reason: '', mode: 'TEMPORARY', auto_restore_at: '' });
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadStats();
    loadDrugs();
    loadBranches();
    loadWorkers();
  }, []);

  const loadStats = async () => {
    try { const r = await axios.get(`${API}/stats`, { headers }); setStats(r.data.data); } catch { }
  };
  const loadDrugs = async () => {
    try { const r = await axios.get(`${API}/drugs`, { headers }); setDrugs(r.data.data || []); } catch { }
  };
  const loadBranches = async () => {
    try { const r = await axios.get(`${API}/branches`, { headers }); setBranches(r.data.data || []); } catch { }
  };
  const loadWorkers = async () => {
    try { const r = await axios.get(`${API}/workers`, { headers }); setWorkers(r.data.data || []); } catch { }
  };
  const loadChangeRequests = async () => {
    try { const r = await axios.get(`${API}/change-requests`, { headers }); setChangeRequests(r.data.data || []); } catch { }
  };
  const loadExpiredReports = async () => {
    try { const r = await axios.get(`${API}/expired-drugs`, { headers }); setExpiredReports(r.data.data || []); } catch { }
  };
  const loadDailyReports = async () => {
    try { const r = await axios.get(`${API}/reports/daily`, { headers }); setDailyReports(r.data.data || []); } catch { }
  };
  const loadPrescriptions = async () => {
    try { const r = await axios.get(`${API}/prescriptions`, { headers }); setPrescriptions(r.data.data || []); } catch { }
  };
  const loadHiddenDrugs = async () => {
    try { const r = await axios.get(`${API}/hidden-drugs`, { headers }); setHiddenDrugs(r.data.data || []); } catch { }
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === 'change-requests') loadChangeRequests();
    if (t === 'expired') loadExpiredReports();
    if (t === 'reports') loadDailyReports();
    if (t === 'prescriptions') loadPrescriptions();
    if (t === 'visibility') loadHiddenDrugs();
  };

  const decide = async (endpoint, id, status, reason = '') => {
    try {
      await axios.patch(`${API}/${endpoint}/${id}/decide`, { status, decision_reason: reason || undefined, finance_decision_reason: reason || undefined }, { headers });
      alert(`✅ ${status}`);
      if (endpoint === 'change-requests') loadChangeRequests();
      if (endpoint === 'expired-drugs') loadExpiredReports();
      if (endpoint === 'reports/daily') { loadDailyReports(); loadStats(); }
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const submitCR = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/change-requests`, crForm, { headers });
      alert('Change request submitted');
      setCrForm({ drug_id: '', target_type: 'DRUG_PRICE', current_value: '', requested_value: '', reason: '' });
      loadChangeRequests();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const submitER = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expired-drugs`, erForm, { headers });
      alert('Expired drug report submitted');
      setErForm({ drug_id: '', location: 'PHARMACY', quantity: '', expiry_date: '', requested_action: 'Dispose' });
      loadExpiredReports();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const submitHide = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/drugs/${hideForm.drug_id}/hide`, hideForm, { headers });
      alert('Drug hidden from catalog');
      setHideForm({ drug_id: '', reason: '', mode: 'TEMPORARY', auto_restore_at: '' });
      loadHiddenDrugs();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const restoreDrug = async (drug_id) => {
    try {
      await axios.patch(`${API}/drugs/${drug_id}/restore`, {}, { headers });
      loadHiddenDrugs();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const updatePxStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/prescriptions/${id}/status`, { status }, { headers });
      loadPrescriptions();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const submitDailyReport = async () => {
    try {
      const res = await axios.post(`${API}/reports/daily`, { report_date: reportDate }, { headers });
      alert(`Report submitted. Sales: ${res.data.data.total_sales_count}, Total: ${fmt(res.data.data.total_amount)}`);
      loadDailyReports();
      loadStats();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'change-requests', label: '🔄 Change Requests' },
    { key: 'expired', label: '⚠️ Expired Drugs' },
    { key: 'reports', label: '📋 Daily Reports' },
    { key: 'prescriptions', label: '💊 Prescriptions' },
    { key: 'visibility', label: '👁 Drug Visibility' },
  ];

  const statCard = (label, value, color, sub = '') => (
    <div style={{ background: '#1e293b', border: `1px solid ${color}40`, borderRadius: 16, padding: 20, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 22 }}>🏥</span>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>Pharmacy Manager — Flow 4 Controls</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 24px', borderBottom: '1px solid #1e293b', overflowX: 'auto', background: '#0f172a' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            style={{ whiteSpace: 'nowrap', background: tab === t.key ? 'rgba(56,189,248,0.15)' : 'transparent', border: '1px solid', borderColor: tab === t.key ? '#38bdf8' : '#334155', color: tab === t.key ? '#38bdf8' : '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", fontWeight: tab === t.key ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>Today's Overview — {stats.today?.date}</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              {statCard('Sales Today', stats.today?.total_sales, '#10b981', 'Completed transactions')}
              {statCard('Revenue Today', fmt(stats.today?.total_revenue), '#38bdf8', `VAT: ${fmt(stats.today?.total_vat)}`)}
              {statCard('Month Revenue', fmt(stats.month?.total_revenue), '#a78bfa', `${stats.month?.total_sales} sales`)}
              {statCard('Pending Reports', stats.pending_reports, stats.pending_reports > 0 ? '#f59e0b' : '#10b981', 'Awaiting finance review')}
              {statCard('Pending Changes', stats.pending_change_requests, stats.pending_change_requests > 0 ? '#f59e0b' : '#10b981', 'Price/qty change requests')}
              {statCard('Expired Reports', stats.pending_expired_reports, stats.pending_expired_reports > 0 ? '#ef4444' : '#10b981', 'Awaiting disposal approval')}
            </div>
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155', maxWidth: 500 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>📋 Submit Daily Sales Report</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
                <button onClick={submitDailyReport} style={btnPrimary}>Generate & Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* CHANGE REQUESTS */}
        {tab === 'change-requests' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* New request form */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>New Change Request</h3>
              <form onSubmit={submitCR} style={formStyle}>
                <label style={labelStyle}>Drug
                  <select value={crForm.drug_id} onChange={e => setCrForm(f => ({ ...f, drug_id: e.target.value }))} required style={inputStyle}>
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>Change Type
                  <select value={crForm.target_type} onChange={e => setCrForm(f => ({ ...f, target_type: e.target.value }))} style={inputStyle}>
                    <option value="DRUG_PRICE">Price Change</option>
                    <option value="DRUG_QUANTITY">Quantity Adjustment</option>
                  </select>
                </label>
                <label style={labelStyle}>Current Value
                  <input type="number" step="0.01" required value={crForm.current_value} onChange={e => setCrForm(f => ({ ...f, current_value: e.target.value }))} style={inputStyle} />
                </label>
                <label style={labelStyle}>Requested Value
                  <input type="number" step="0.01" required value={crForm.requested_value} onChange={e => setCrForm(f => ({ ...f, requested_value: e.target.value }))} style={inputStyle} />
                </label>
                <label style={labelStyle}>Reason *
                  <textarea rows="3" required value={crForm.reason} onChange={e => setCrForm(f => ({ ...f, reason: e.target.value }))} style={inputStyle} />
                </label>
                <button type="submit" style={btnPrimary}>Submit Request</button>
              </form>
            </div>
            {/* List */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>All Change Requests</h3>
              {changeRequests.length === 0 ? <p style={emptyStyle}>No change requests.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {changeRequests.map(cr => (
                    <div key={cr.id} style={itemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{cr.drug_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: cr.status === 'PENDING' ? '#f59e0b' : cr.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>{cr.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{cr.target_type}: {cr.current_value} → {cr.requested_value}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>By: {cr.requested_by_name} · {cr.reason}</div>
                      {cr.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => decide('change-requests', cr.id, 'APPROVED')} style={{ ...btnSmall, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderColor: '#10b981' }}>✅ Approve</button>
                          <button onClick={() => { const r = prompt('Rejection reason:'); if (r) decide('change-requests', cr.id, 'REJECTED', r); }} style={{ ...btnSmall, background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: '#ef4444' }}>❌ Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXPIRED DRUGS */}
        {tab === 'expired' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Report Expired Drug</h3>
              <form onSubmit={submitER} style={formStyle}>
                <label style={labelStyle}>Drug
                  <select required value={erForm.drug_id} onChange={e => setErForm(f => ({ ...f, drug_id: e.target.value }))} style={inputStyle}>
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>Location
                  <select value={erForm.location} onChange={e => setErForm(f => ({ ...f, location: e.target.value }))} style={inputStyle}>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="STORE">Store</option>
                  </select>
                </label>
                <label style={labelStyle}>Quantity
                  <input type="number" min="1" required value={erForm.quantity} onChange={e => setErForm(f => ({ ...f, quantity: e.target.value }))} style={inputStyle} />
                </label>
                <label style={labelStyle}>Expiry Date
                  <input type="date" required value={erForm.expiry_date} onChange={e => setErForm(f => ({ ...f, expiry_date: e.target.value }))} style={inputStyle} />
                </label>
                <label style={labelStyle}>Requested Action
                  <select value={erForm.requested_action} onChange={e => setErForm(f => ({ ...f, requested_action: e.target.value }))} style={inputStyle}>
                    <option value="Dispose">Dispose</option>
                    <option value="Return to supplier">Return to Supplier</option>
                    <option value="Write-off">Write-off</option>
                  </select>
                </label>
                <button type="submit" style={btnPrimary}>Submit Report</button>
              </form>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Expired Drug Reports</h3>
              {expiredReports.length === 0 ? <p style={emptyStyle}>No reports.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {expiredReports.map(r => (
                    <div key={r.id} style={itemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.drug_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: r.status === 'PENDING' ? '#f59e0b' : r.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>{r.status === 'PENDING' ? '⏳ Awaiting CEO' : r.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                        {r.location} · Qty: {r.quantity} · Expires: {r.expiry_date}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Action: {r.requested_action} · By: {r.reported_by_name}</div>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => decide('expired-drugs', r.id, 'APPROVED')} style={{ ...btnSmall, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderColor: '#10b981' }}>✅ Approve & Deduct</button>
                          <button onClick={() => { const rr = prompt('Rejection reason:'); if (rr) decide('expired-drugs', r.id, 'REJECTED', rr); }} style={{ ...btnSmall, background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: '#ef4444' }}>❌ Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DAILY REPORTS */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Daily Sales Reports</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                    {['Date', 'Branch', 'Total Sales', 'Total Amount', 'Submitted By', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyReports.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b', borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.report_date}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.branch_name || 'All'}</td>
                      <td style={{ padding: '12px 16px' }}>{r.total_sales_count}</td>
                      <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 700 }}>{fmt(r.total_amount)}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.submitted_by_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: r.status === 'PENDING_FINANCE' ? '#f59e0b' : r.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.status === 'PENDING_FINANCE' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => decide('reports/daily', r.id, 'APPROVED')} style={{ ...btnSmall, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderColor: '#10b981' }}>Approve</button>
                            <button onClick={() => { const rr = prompt('Reason:'); if (rr) decide('reports/daily', r.id, 'REJECTED', rr); }} style={{ ...btnSmall, background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS */}
        {tab === 'prescriptions' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>💊 Prescription Requests</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {prescriptions.length === 0 ? <p style={emptyStyle}>No prescriptions found.</p> : prescriptions.map(rx => (
                <div key={rx.id} style={{ ...itemStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>{rx.reference_code}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: rx.status === 'SUBMITTED' ? '#f59e0b' : rx.status === 'READY_FOR_PICKUP' ? '#3b82f6' : rx.status === 'FULFILLED' ? '#10b981' : '#ef4444' }}>{rx.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Patient: {rx.customer_name || 'Walk-in'} · {rx.customer_phone} · Branch: {rx.branch_name}</div>
                    {rx.drug_name && <div style={{ fontSize: 12, color: '#64748b' }}>Drug: {rx.drug_name}</div>}
                    {rx.drug_name_text && <div style={{ fontSize: 12, color: '#64748b' }}>Drug (text): {rx.drug_name_text}</div>}
                    <div style={{ fontSize: 11, color: '#475569' }}>Type: {rx.submission_type} · Qty: {rx.quantity_requested}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['SUBMITTED', 'READY_FOR_PICKUP', 'FULFILLED', 'CANCELLED'].map(s => (
                      <button key={s} onClick={() => updatePxStatus(rx.id, s)} disabled={rx.status === s}
                        style={{ ...btnSmall, opacity: rx.status === s ? 0.4 : 1, background: rx.status === s ? '#1e293b' : 'transparent', borderColor: '#334155', color: '#94a3b8', fontSize: 11 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRUG VISIBILITY */}
        {tab === 'visibility' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Hide a Drug</h3>
              <form onSubmit={submitHide} style={formStyle}>
                <label style={labelStyle}>Drug
                  <select required value={hideForm.drug_id} onChange={e => setHideForm(f => ({ ...f, drug_id: e.target.value }))} style={inputStyle}>
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>Reason *
                  <input required value={hideForm.reason} onChange={e => setHideForm(f => ({ ...f, reason: e.target.value }))} style={inputStyle} />
                </label>
                <label style={labelStyle}>Mode
                  <select value={hideForm.mode} onChange={e => setHideForm(f => ({ ...f, mode: e.target.value }))} style={inputStyle}>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="PERMANENT">Permanent</option>
                  </select>
                </label>
                {hideForm.mode === 'TEMPORARY' && (
                  <label style={labelStyle}>Auto-Restore At
                    <input type="datetime-local" value={hideForm.auto_restore_at} onChange={e => setHideForm(f => ({ ...f, auto_restore_at: e.target.value }))} style={inputStyle} />
                  </label>
                )}
                <button type="submit" style={{ ...btnPrimary, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Hide Drug</button>
              </form>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Currently Hidden Drugs</h3>
              {hiddenDrugs.length === 0 ? <p style={emptyStyle}>No hidden drugs.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hiddenDrugs.map(dv => (
                    <div key={dv.id} style={itemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{dv.drug_name}</span>
                        <span style={{ fontSize: 11, color: dv.mode === 'PERMANENT' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{dv.mode}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Reason: {dv.reason} · By: {dv.hidden_by_name}</div>
                      <button onClick={() => restoreDrug(dv.drug_id)} style={{ ...btnSmall, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderColor: '#10b981' }}>♻️ Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: "'Inter',sans-serif", outline: 'none', width: '100%' };
const btnPrimary = { background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter',sans-serif", fontSize: 14 };
const btnSmall = { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: "'Inter',sans-serif" };
const cardStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 24 };
const cardTitle = { fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 };
const formStyle = { display: 'flex', flexDirection: 'column', gap: 14 };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#94a3b8', fontWeight: 500 };
const itemStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14 };
const emptyStyle = { color: '#475569', fontSize: 14, padding: '20px 0' };
