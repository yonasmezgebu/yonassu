import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PharmacyManagerControls.css';

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

  const statCard = (label, value, colorClass, sub = '') => (
    <div className="pm-card">
      <div className="pm-stat-label">{label}</div>
      <div className="pm-stat-value" style={{ color: `var(--color-${colorClass})` }}>{value}</div>
      {sub && <div className="pm-stat-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="pm-container">
      {/* Header */}
      <div className="pm-header">
        <span style={{ fontSize: 24 }}>🏥</span>
        <h1 className="pm-page-title">Pharmacy Manager — Flow 4 Controls</h1>
      </div>

      {/* Tabs */}
      <div className="pm-tabs">
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`pm-tab-btn ${tab === t.key ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {loading && (
          <div className="pm-spinner-container">
            <div className="pm-spinner"></div>
          </div>
        )}

        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && !loading && (
          <div>
            <h2 className="pm-section-title">Today's Overview — {stats.today?.date}</h2>
            <div className="pm-grid-cards">
              {statCard('Sales Today', stats.today?.total_sales, 'success', 'Completed transactions')}
              {statCard('Revenue Today', fmt(stats.today?.total_revenue), 'primary', `VAT: ${fmt(stats.today?.total_vat)}`)}
              {statCard('Month Revenue', fmt(stats.month?.total_revenue), 'info', `${stats.month?.total_sales} sales`)}
              {statCard('Pending Reports', stats.pending_reports, stats.pending_reports > 0 ? 'warning' : 'success', 'Awaiting finance review')}
              {statCard('Pending Changes', stats.pending_change_requests, stats.pending_change_requests > 0 ? 'warning' : 'success', 'Price/qty change requests')}
              {statCard('Expired Reports', stats.pending_expired_reports, stats.pending_expired_reports > 0 ? 'danger' : 'success', 'Awaiting disposal approval')}
            </div>
            
            <div className="pm-card" style={{ maxWidth: 500 }}>
              <h3 className="pm-section-title">📋 Submit Daily Sales Report</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="pm-input" style={{ width: 'auto' }} />
                <button onClick={submitDailyReport} className="pm-btn pm-btn-primary"><span>Generate & Submit</span></button>
              </div>
            </div>
          </div>
        )}

        {/* CHANGE REQUESTS */}
        {tab === 'change-requests' && (
          <div className="pm-grid-2">
            {/* New request form */}
            <div className="pm-card">
              <h3 className="pm-section-title">New Change Request</h3>
              <form onSubmit={submitCR} className="pm-form">
                <label className="pm-label">Drug
                  <select value={crForm.drug_id} onChange={e => setCrForm(f => ({ ...f, drug_id: e.target.value }))} required className="pm-input">
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label className="pm-label">Change Type
                  <select value={crForm.target_type} onChange={e => setCrForm(f => ({ ...f, target_type: e.target.value }))} className="pm-input">
                    <option value="DRUG_PRICE">Price Change</option>
                    <option value="DRUG_QUANTITY">Quantity Adjustment</option>
                  </select>
                </label>
                <label className="pm-label">Current Value
                  <input type="number" step="0.01" required value={crForm.current_value} onChange={e => setCrForm(f => ({ ...f, current_value: e.target.value }))} className="pm-input" />
                </label>
                <label className="pm-label">Requested Value
                  <input type="number" step="0.01" required value={crForm.requested_value} onChange={e => setCrForm(f => ({ ...f, requested_value: e.target.value }))} className="pm-input" />
                </label>
                <label className="pm-label">Reason *
                  <textarea rows="3" required value={crForm.reason} onChange={e => setCrForm(f => ({ ...f, reason: e.target.value }))} className="pm-input" />
                </label>
                <button type="submit" className="pm-btn pm-btn-primary"><span>Submit Request</span></button>
              </form>
            </div>
            {/* List */}
            <div className="pm-card">
              <h3 className="pm-section-title">All Change Requests</h3>
              {changeRequests.length === 0 ? <p className="pm-empty">No change requests.</p> : (
                <div className="pm-list">
                  {changeRequests.map(cr => (
                    <div key={cr.id} className="pm-list-item">
                      <div className="pm-item-header">
                        <span className="pm-item-title">{cr.drug_name}</span>
                        <span className={`pm-badge ${cr.status === 'PENDING' ? 'pm-badge-pending' : cr.status === 'APPROVED' ? 'pm-badge-approved' : 'pm-badge-rejected'}`}>{cr.status}</span>
                      </div>
                      <div className="pm-item-meta">{cr.target_type}: {cr.current_value} → {cr.requested_value}</div>
                      <div className="pm-item-desc">By: {cr.requested_by_name} · {cr.reason}</div>
                      {cr.status === 'PENDING' && (
                        <div className="pm-actions">
                          <button onClick={() => decide('change-requests', cr.id, 'APPROVED')} className="pm-btn pm-btn-success"><span>✅ Approve</span></button>
                          <button onClick={() => { const r = prompt('Rejection reason:'); if (r) decide('change-requests', cr.id, 'REJECTED', r); }} className="pm-btn pm-btn-danger"><span>❌ Reject</span></button>
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
          <div className="pm-grid-2">
            <div className="pm-card">
              <h3 className="pm-section-title">Report Expired Drug</h3>
              <form onSubmit={submitER} className="pm-form">
                <label className="pm-label">Drug
                  <select required value={erForm.drug_id} onChange={e => setErForm(f => ({ ...f, drug_id: e.target.value }))} className="pm-input">
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label className="pm-label">Location
                  <select value={erForm.location} onChange={e => setErForm(f => ({ ...f, location: e.target.value }))} className="pm-input">
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="STORE">Store</option>
                  </select>
                </label>
                <label className="pm-label">Quantity
                  <input type="number" min="1" required value={erForm.quantity} onChange={e => setErForm(f => ({ ...f, quantity: e.target.value }))} className="pm-input" />
                </label>
                <label className="pm-label">Expiry Date
                  <input type="date" required value={erForm.expiry_date} onChange={e => setErForm(f => ({ ...f, expiry_date: e.target.value }))} className="pm-input" />
                </label>
                <label className="pm-label">Requested Action
                  <select value={erForm.requested_action} onChange={e => setErForm(f => ({ ...f, requested_action: e.target.value }))} className="pm-input">
                    <option value="Dispose">Dispose</option>
                    <option value="Return to supplier">Return to Supplier</option>
                    <option value="Write-off">Write-off</option>
                  </select>
                </label>
                <button type="submit" className="pm-btn pm-btn-primary"><span>Submit Report</span></button>
              </form>
            </div>
            <div className="pm-card">
              <h3 className="pm-section-title">Expired Drug Reports</h3>
              {expiredReports.length === 0 ? <p className="pm-empty">No reports.</p> : (
                <div className="pm-list">
                  {expiredReports.map(r => (
                    <div key={r.id} className="pm-list-item">
                      <div className="pm-item-header">
                        <span className="pm-item-title">{r.drug_name}</span>
                        <span className={`pm-badge ${r.status === 'PENDING' ? 'pm-badge-pending' : r.status === 'APPROVED' ? 'pm-badge-approved' : 'pm-badge-rejected'}`}>
                          {r.status === 'PENDING' ? '⏳ Awaiting CEO' : r.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      </div>
                      <div className="pm-item-meta">
                        {r.location} · Qty: {r.quantity} · Expires: {r.expiry_date}
                      </div>
                      <div className="pm-item-desc">Action: {r.requested_action} · By: {r.reported_by_name}</div>
                      {r.status === 'PENDING' && (
                        <div className="pm-actions">
                          <button onClick={() => decide('expired-drugs', r.id, 'APPROVED')} className="pm-btn pm-btn-success"><span>✅ Approve & Deduct</span></button>
                          <button onClick={() => { const rr = prompt('Rejection reason:'); if (rr) decide('expired-drugs', r.id, 'REJECTED', rr); }} className="pm-btn pm-btn-danger"><span>❌ Reject</span></button>
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
            <div className="pm-header">
              <h2 className="pm-section-title" style={{ marginBottom: 0 }}>Daily Sales Reports</h2>
            </div>
            <div className="pm-table-container pm-card" style={{ padding: '0 0 16px 0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="pm-table">
                  <thead>
                    <tr>
                      {['Date', 'Branch', 'Total Sales', 'Total Amount', 'Submitted By', 'Status', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReports.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.report_date}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{r.branch_name || 'All'}</td>
                        <td>{r.total_sales_count}</td>
                        <td className="num" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{fmt(r.total_amount)}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{r.submitted_by_name}</td>
                        <td>
                          <span className={`pm-badge ${r.status === 'PENDING_FINANCE' ? 'pm-badge-pending' : r.status === 'APPROVED' ? 'pm-badge-approved' : 'pm-badge-rejected'}`}>{r.status}</span>
                        </td>
                        <td>
                          {r.status === 'PENDING_FINANCE' && (
                            <div className="pm-actions">
                              <button onClick={() => decide('reports/daily', r.id, 'APPROVED')} className="pm-btn pm-btn-success"><span>Approve</span></button>
                              <button onClick={() => { const rr = prompt('Reason:'); if (rr) decide('reports/daily', r.id, 'REJECTED', rr); }} className="pm-btn pm-btn-danger"><span>Reject</span></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dailyReports.length === 0 && (
                      <tr><td colSpan="7" className="pm-empty">No daily reports found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS */}
        {tab === 'prescriptions' && (
          <div>
            <h2 className="pm-section-title">💊 Prescription Requests</h2>
            <div className="pm-list">
              {prescriptions.length === 0 ? <p className="pm-empty">No prescriptions found.</p> : prescriptions.map(rx => (
                <div key={rx.id} className="pm-list-item" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div className="pm-item-header" style={{ marginBottom: 6 }}>
                      <span className="pm-item-title" style={{ color: 'var(--color-primary)' }}>{rx.reference_code}</span>
                      <span className={`pm-badge ${rx.status === 'SUBMITTED' ? 'pm-badge-pending' : rx.status === 'READY_FOR_PICKUP' ? 'pm-badge-info' : rx.status === 'FULFILLED' ? 'pm-badge-approved' : 'pm-badge-rejected'}`}>{rx.status}</span>
                    </div>
                    <div className="pm-item-meta">Patient: {rx.customer_name || 'Walk-in'} · {rx.customer_phone} · Branch: {rx.branch_name}</div>
                    {rx.drug_name && <div className="pm-item-meta">Drug: {rx.drug_name}</div>}
                    {rx.drug_name_text && <div className="pm-item-meta">Drug (text): {rx.drug_name_text}</div>}
                    <div className="pm-item-desc">Type: {rx.submission_type} · Qty: {rx.quantity_requested}</div>
                  </div>
                  <div className="pm-actions" style={{ flexDirection: 'column' }}>
                    {['SUBMITTED', 'READY_FOR_PICKUP', 'FULFILLED', 'CANCELLED'].map(s => (
                      <button key={s} onClick={() => updatePxStatus(rx.id, s)} disabled={rx.status === s}
                        className="pm-btn pm-btn-secondary">
                        <span>{s}</span>
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
          <div className="pm-grid-2">
            <div className="pm-card">
              <h3 className="pm-section-title">Hide a Drug</h3>
              <form onSubmit={submitHide} className="pm-form">
                <label className="pm-label">Drug
                  <select required value={hideForm.drug_id} onChange={e => setHideForm(f => ({ ...f, drug_id: e.target.value }))} className="pm-input">
                    <option value="">Select drug</option>
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label className="pm-label">Reason *
                  <input required value={hideForm.reason} onChange={e => setHideForm(f => ({ ...f, reason: e.target.value }))} className="pm-input" />
                </label>
                <label className="pm-label">Mode
                  <select value={hideForm.mode} onChange={e => setHideForm(f => ({ ...f, mode: e.target.value }))} className="pm-input">
                    <option value="TEMPORARY">Temporary</option>
                    <option value="PERMANENT">Permanent</option>
                  </select>
                </label>
                {hideForm.mode === 'TEMPORARY' && (
                  <label className="pm-label">Auto-Restore At
                    <input type="datetime-local" value={hideForm.auto_restore_at} onChange={e => setHideForm(f => ({ ...f, auto_restore_at: e.target.value }))} className="pm-input" />
                  </label>
                )}
                <button type="submit" className="pm-btn pm-btn-danger"><span>Hide Drug</span></button>
              </form>
            </div>
            <div className="pm-card">
              <h3 className="pm-section-title">Currently Hidden Drugs</h3>
              {hiddenDrugs.length === 0 ? <p className="pm-empty">No hidden drugs.</p> : (
                <div className="pm-list">
                  {hiddenDrugs.map(dv => (
                    <div key={dv.id} className="pm-list-item">
                      <div className="pm-item-header">
                        <span className="pm-item-title">{dv.drug_name}</span>
                        <span className={`pm-badge ${dv.mode === 'PERMANENT' ? 'pm-badge-rejected' : 'pm-badge-pending'}`}>{dv.mode}</span>
                      </div>
                      <div className="pm-item-desc">Reason: {dv.reason} · By: {dv.hidden_by_name}</div>
                      <button onClick={() => restoreDrug(dv.drug_id)} className="pm-btn pm-btn-success"><span>♻️ Restore</span></button>
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
