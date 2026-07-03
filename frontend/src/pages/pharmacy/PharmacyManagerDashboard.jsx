import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, FileText, History, BarChart3,
  DollarSign, CheckCircle, XCircle, AlertTriangle, Loader2, ToggleLeft,
  ToggleRight, Search, Clock, Send, Eye, ChevronDown, ShoppingCart, Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import pharmacyService from '../../services/pharmacyService';

const containerStyle = {
  padding: '24px 32px',
  maxWidth: 1400,
  margin: '0 auto',
  fontFamily: "'Inter', sans-serif",
  color: '#1e293b',
  background: '#f8fafc',
};

const tabBarStyle = {
  display: 'flex',
  gap: 4,
  marginBottom: 24,
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  padding: 4,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const tabStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: active ? '#224f94' : 'transparent',
  color: active ? 'white' : '#64748b',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const cardStyle = {
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'white',
};

const cardTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: '1rem',
  fontWeight: 700,
  color: '#224f94',
};

const cardBodyStyle = {
  padding: 24,
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 24,
};

const statCardStyle = (color) => ({
  background: 'white',
  borderRadius: 8,
  padding: '20px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  border: '1px solid #e2e8f0',
  borderLeft: `4px solid ${color}`,
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
};

const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  background: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
  color: '#64748b',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '11px 14px',
  borderBottom: '1px solid #f1f5f9',
  color: '#1e293b',
};

const badgeStyle = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 700,
  background: bg,
  color: color,
});

const toggleBtnStyle = (isActive) => ({
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: 'pointer',
  background: isActive ? '#fee2e2' : '#dcfce7',
  color: isActive ? '#b91c1c' : '#166534',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
});

const btnPrimaryStyle = {
  padding: '12px 28px',
  background: '#224f94',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const btnDisabledStyle = {
  ...btnPrimaryStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
};

const totalRowStyle = {
  ...tdStyle,
  fontWeight: 700,
  background: '#f8fafc',
  borderTop: '2px solid #224f94',
};

// ── Pre-seeded test data ──
const SEED_WORKERS = [
  { id: 1, name: 'Worker 1', branch: 'Branch A', permission: true },
  { id: 2, name: 'Worker 2', branch: 'Branch B', permission: false },
  { id: 3, name: 'Worker 3', branch: 'Branch B', permission: true },
  { id: 4, name: 'Worker 4', branch: 'Branch C', permission: false },
  { id: 5, name: 'Worker 5', branch: 'Branch C', permission: true },
  { id: 6, name: 'Worker 6', branch: 'Branch A', permission: false },
];

const SEED_BRANCHES = [
  { id: 1, name: 'Branch A', active: true },
  { id: 2, name: 'Branch B', active: false },
  { id: 3, name: 'Branch C', active: true },
];

const SEED_SALES = [
  { id: 1, branch: 'Branch A', worker: 'Worker 1', sales_count: 15, total: 450.00 },
  { id: 2, branch: 'Branch A', worker: 'Worker 2', sales_count: 10, total: 300.00 },
  { id: 3, branch: 'Branch B', worker: 'Worker 3', sales_count: 22, total: 660.00 },
  { id: 4, branch: 'Branch B', worker: 'Worker 4', sales_count: 18, total: 540.00 },
  { id: 5, branch: 'Branch C', worker: 'Worker 5', sales_count: 12, total: 360.00 },
  { id: 6, branch: 'Branch C', worker: 'Worker 6', sales_count: 8, total: 240.00 },
];

const CHECKLIST_ITEMS = [
  { key: 'transactions', label: 'All transactions reviewed' },
  { key: 'payments', label: 'All payments verified' },
  { key: 'branch', label: 'Branch-wise data complete' },
  { key: 'worker', label: 'Worker-wise data complete' },
  { key: 'recipient', label: 'Recipient details recorded' },
  { key: 'finance', label: 'Report ready for Finance' },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'permissions', label: 'Worker Permissions', icon: Users },
  { key: 'branches', label: 'Branch Management', icon: Building2 },
  { key: 'reports', label: 'Daily Sales Report', icon: FileText },
  { key: 'history', label: 'Reports History', icon: History },
];

const PharmacyManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Overview
  const [salesData, setSalesData] = useState(SEED_SALES);
  const [todayTotal, setTodayTotal] = useState({ count: 85, revenue: 2550.00 });

  // Workers
  const [workers, setWorkers] = useState(SEED_WORKERS);
  const [togglingWorker, setTogglingWorker] = useState(null);

  // Branches
  const [branches, setBranches] = useState(SEED_BRANCHES);
  const [togglingBranch, setTogglingBranch] = useState(null);

  // Report submission
  const [checklist, setChecklist] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reports history
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sales = await pharmacyService.getAllSales().catch(() => null);
      if (sales) {
        const data = Array.isArray(sales) ? sales : sales?.data || sales?.sales || [];
        if (data.length > 0) {
          setSalesData(data);
          const totalCount = data.reduce((s, r) => s + (r.sales_count || 0), 0);
          const totalRevenue = data.reduce((s, r) => s + parseFloat(r.total || 0), 0);
          setTodayTotal({ count: totalCount, revenue: totalRevenue });
        }
      }

      const rep = await pharmacyService.getReports().catch(() => null);
      if (rep) {
        const data = Array.isArray(rep) ? rep : rep?.data || rep?.reports || [];
        setReports(data);
      }
    } catch (e) {
      // fallback to seed data
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorker = async (id) => {
    setTogglingWorker(id);
    try {
      await pharmacyService.toggleWorkerPermission(id);
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, permission: !w.permission } : w));
    } catch (e) {
      alert('Failed to toggle permission');
    } finally {
      setTogglingWorker(null);
    }
  };

  const handleToggleBranch = async (id) => {
    setTogglingBranch(id);
    try {
      await pharmacyService.toggleBranchStatus(id);
      setBranches(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    } catch (e) {
      alert('Failed to toggle branch');
    } finally {
      setTogglingBranch(null);
    }
  };

  const handleChecklistToggle = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = CHECKLIST_ITEMS.every(item => checklist[item.key]);

  const handleSubmitReport = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    try {
      await pharmacyService.submitReport({ report_date: new Date().toISOString().split('T')[0] });
      setSubmitted(true);
      loadData();
    } catch (e) {
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      const rep = await pharmacyService.getReportById(id);
      const data = rep?.data || rep;
      setSelectedReport(data);
    } catch (e) {
      alert('Failed to load report');
    }
  };

  const uniqueBranches = [...new Set(salesData.map(s => s.branch))];

  // Aggregate by branch + worker for overview table
  const branchWorkerRows = salesData.reduce((acc, s) => {
    const existing = acc.find(r => r.branch === s.branch && r.worker === s.worker);
    if (existing) {
      existing.sales_count += s.sales_count;
      existing.total += s.total;
    } else {
      acc.push({ branch: s.branch, worker: s.worker, sales_count: s.sales_count, total: s.total });
    }
    return acc;
  }, []);

  const grandTotalSales = branchWorkerRows.reduce((s, r) => s + r.sales_count, 0);
  const grandTotalRevenue = branchWorkerRows.reduce((s, r) => s + r.total, 0);

  // Branch breakdown for daily report
  const branchSummary = uniqueBranches.map(b => {
    const branchSales = salesData.filter(s => s.branch === b);
    const totalSales = branchSales.reduce((s, r) => s + r.sales_count, 0);
    const totalMoney = branchSales.reduce((s, r) => s + r.total, 0);
    const uniqueWorkers = [...new Set(branchSales.map(r => r.worker))].length;
    return { branch: b, totalSales, totalMoney, workers: uniqueWorkers };
  });

  const grandTotalMoney = branchSummary.reduce((s, b) => s + b.totalMoney, 0);
  const grandTotalWorkers = branchSummary.reduce((s, b) => s + b.workers, 0);

  // Payment breakdown (seed)
  const paymentBreakdown = [
    { method: 'Cash', count: 35, amount: 1050.00 },
    { method: 'Bank', count: 28, amount: 840.00 },
    { method: 'Telbir', count: 22, amount: 660.00 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div style={statsGridStyle}>
              <div style={statCardStyle('#2563eb')}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TOTAL SALES TODAY</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 8 }}>{loading ? '—' : todayTotal.count}</div>
                </div>
                <div style={{ width: 48, height: 48, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={24} color="#2563eb" />
                </div>
              </div>
              <div style={statCardStyle('#059669')}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TOTAL REVENUE TODAY</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 8 }}>{loading ? '—' : `$${todayTotal.revenue.toFixed(2)}`}</div>
                </div>
                <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={24} color="#059669" />
                </div>
              </div>
              <div style={statCardStyle('#b45309')}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ACTIVE BRANCHES</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 8 }}>{branches.filter(b => b.active).length}</div>
                </div>
                <div style={{ width: 48, height: 48, background: '#ffedd5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} color="#b45309" />
                </div>
              </div>
              <div style={statCardStyle('#dc2626')}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ACTIVE WORKERS</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 8 }}>{workers.filter(w => w.permission).length}</div>
                </div>
                <div style={{ width: 48, height: 48, background: '#fee2e2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color="#dc2626" />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={cardTitleStyle}><Activity size={20} /> Branch-wise Activity Log</div>
              </div>
              <div style={cardBodyStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Branch</th>
                      <th style={thStyle}>Worker</th>
                      <th style={thStyle}>Sales Done</th>
                      <th style={thStyle}>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchWorkerRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}><strong>{row.branch}</strong></td>
                        <td style={tdStyle}>{row.worker}</td>
                        <td style={tdStyle}>{row.sales_count}</td>
                        <td style={tdStyle}>${row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={totalRowStyle}><strong>TOTAL</strong></td>
                      <td style={totalRowStyle}>—</td>
                      <td style={totalRowStyle}><strong>{grandTotalSales}</strong></td>
                      <td style={totalRowStyle}><strong>${grandTotalRevenue.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'permissions':
        return (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}><Users size={20} /> Pharmacy Worker Permission</div>
              <span style={badgeStyle('#dcfce7', '#166534')}>
                <CheckCircle size={14} /> Active: {workers.filter(w => w.permission).length}
              </span>
            </div>
            <div style={cardBodyStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Worker</th>
                    <th style={thStyle}>Branch</th>
                    <th style={thStyle}>Post Permission</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.id}>
                      <td style={tdStyle}>{w.name}</td>
                      <td style={tdStyle}>{w.branch}</td>
                      <td style={tdStyle}>
                        {w.permission
                          ? <span style={badgeStyle('#dcfce7', '#166534')}>ON <CheckCircle size={12} /></span>
                          : <span style={badgeStyle('#fee2e2', '#b91c1c')}>OFF <XCircle size={12} /></span>
                        }
                      </td>
                      <td style={tdStyle}>
                        <button
                          style={toggleBtnStyle(w.permission)}
                          onClick={() => handleToggleWorker(w.id)}
                          disabled={togglingWorker === w.id}
                        >
                          {togglingWorker === w.id
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : w.permission ? <ToggleLeft size={14} /> : <ToggleRight size={14} />
                          }
                          {w.permission ? 'TOGGLE OFF' : 'TOGGLE ON'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'branches':
        return (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}><Building2 size={20} /> Branch Management</div>
            </div>
            <div style={cardBodyStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Branch</th>
                    <th style={thStyle}>Post Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(b => (
                    <tr key={b.id}>
                      <td style={tdStyle}><strong>{b.name}</strong></td>
                      <td style={tdStyle}>
                        {b.active
                          ? <span style={badgeStyle('#dcfce7', '#166534')}><CheckCircle size={12} /> ACTIVE</span>
                          : <span style={badgeStyle('#fee2e2', '#b91c1c')}><XCircle size={12} /> INACTIVE</span>
                        }
                      </td>
                      <td style={tdStyle}>
                        <button
                          style={toggleBtnStyle(b.active)}
                          onClick={() => handleToggleBranch(b.id)}
                          disabled={togglingBranch === b.id}
                        >
                          {togglingBranch === b.id
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : b.active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />
                          }
                          {b.active ? 'TOGGLE OFF' : 'TOGGLE ON'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.8rem', color: '#92400e' }}>
                <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Toggling OFF hides ALL drugs for that branch from public and sends a notification. Toggling ON restores them.
              </div>
            </div>
          </div>
        );

      case 'reports':
        if (submitted) {
          return (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <CheckCircle size={64} color="#10b981" />
              <h2 style={{ color: '#059669', marginTop: 16 }}>Report Submitted to Finance!</h2>
              <p style={{ color: '#64748b' }}>The daily sales report has been sent for review.</p>
              <button style={{ ...btnPrimaryStyle, marginTop: 24 }} onClick={() => { setSubmitted(false); setChecklist({}); }}>
                Submit Another Report
              </button>
            </div>
          );
        }

        return (
          <>
            <div style={cardStyle}>
              <div style={{ ...cardHeaderStyle, background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b45309', fontWeight: 700 }}>
                  <FileText size={20} /> Daily Sales Report - Review Required
                </div>
              </div>
              <div style={cardBodyStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 20px', background: '#f8fafc', borderRadius: 8 }}>
                  <div><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Date</span><br /><strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Sales</span><br /><strong>{grandTotalSales}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Money Collected</span><br /><strong>${grandTotalRevenue.toFixed(2)}</strong></div>
                </div>

                <h4 style={{ color: '#224f94', marginBottom: 12, fontWeight: 700 }}>Branch Breakdown</h4>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Branch</th>
                      <th style={thStyle}>Total Sales</th>
                      <th style={thStyle}>Total Money</th>
                      <th style={thStyle}>Workers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchSummary.map((b, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}><strong>{b.branch}</strong></td>
                        <td style={tdStyle}>{b.totalSales}</td>
                        <td style={tdStyle}>${b.totalMoney.toFixed(2)}</td>
                        <td style={tdStyle}>{b.workers}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={totalRowStyle}><strong>TOTAL</strong></td>
                      <td style={totalRowStyle}><strong>{grandTotalSales}</strong></td>
                      <td style={totalRowStyle}><strong>${grandTotalMoney.toFixed(2)}</strong></td>
                      <td style={totalRowStyle}><strong>{grandTotalWorkers}</strong></td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#224f94', margin: '24px 0 12px', fontWeight: 700 }}>Payment Methods Breakdown</h4>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Payment Method</th>
                      <th style={thStyle}>Count</th>
                      <th style={thStyle}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentBreakdown.map((p, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>{p.method}</td>
                        <td style={tdStyle}>{p.count}</td>
                        <td style={tdStyle}>${p.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={totalRowStyle}><strong>TOTAL</strong></td>
                      <td style={totalRowStyle}>—</td>
                      <td style={totalRowStyle}><strong>${paymentBreakdown.reduce((s, p) => s + p.amount, 0).toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#224f94', margin: '24px 0 12px', fontWeight: 700 }}>Manager Action Checklist</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {CHECKLIST_ITEMS.map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={!!checklist[item.key]}
                        onChange={() => handleChecklistToggle(item.key)}
                        style={{ width: 18, height: 18 }}
                      />
                      <span style={{ color: checklist[item.key] ? '#059669' : '#1e293b', fontWeight: checklist[item.key] ? 600 : 400 }}>
                        {checklist[item.key] ? '✅' : '☐'} {item.label}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  style={allChecked ? btnPrimaryStyle : btnDisabledStyle}
                  disabled={!allChecked || submitting}
                  onClick={handleSubmitReport}
                >
                  {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Send size={16} /> SUBMIT TO FINANCE</>}
                </button>
              </div>
            </div>
          </>
        );

      case 'history':
        return (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}><History size={20} /> Reports History</div>
            </div>
            <div style={cardBodyStyle}>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <FileText size={40} style={{ marginBottom: 12, color: '#cbd5e1' }} />
                  <p>No reports submitted yet.</p>
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Total Sales</th>
                      <th style={thStyle}>Total Money</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, idx) => {
                      const statusColors = {
                        PENDING: { bg: '#fffbeb', color: '#b45309' },
                        APPROVED: { bg: '#dcfce7', color: '#166534' },
                        REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
                      };
                      const sc = statusColors[r.status] || statusColors.PENDING;
                      return (
                        <tr key={r.id || idx}>
                          <td style={tdStyle}>{r.report_date ? new Date(r.report_date).toLocaleDateString() : '—'}</td>
                          <td style={tdStyle}>{r.total_sales ?? '—'}</td>
                          <td style={tdStyle}>{r.total_money ? `$${parseFloat(r.total_money).toFixed(2)}` : '—'}</td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(sc.bg, sc.color)}>{r.status || 'PENDING'}</span>
                          </td>
                          <td style={tdStyle}>
                            <button
                              style={{ background: 'none', border: 'none', color: '#224f94', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              onClick={() => handleViewReport(r.id)}
                            >
                              <Eye size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {selectedReport && (
                <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ color: '#224f94', marginBottom: 12, fontWeight: 700 }}>Report Detail</h4>
                  <pre style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedReport, null, 2)}
                  </pre>
                  <button style={{ ...btnPrimaryStyle, marginTop: 12 }} onClick={() => setSelectedReport(null)}>Close Detail</button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      <div style={tabBarStyle}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            style={tabStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p>Loading data...</p>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default PharmacyManagerDashboard;
