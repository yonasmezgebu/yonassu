import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { BarChart, Download, RefreshCw, Package, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

export default function ProcurementReports() {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, p, rc, t, f] = await Promise.all([
        apiClient.get('/procurement/requests'),
        apiClient.get('/procurement/payments'),
        apiClient.get('/procurement/receipts'),
        apiClient.get('/procurement/tenders'),
        apiClient.get('/procurement/fund-requests'),
      ]);
      if (r.status === 'success') setRequests(r.data || []);
      if (p.status === 'success') setPayments(p.data || []);
      if (rc.status === 'success') setReceipts(rc.data || []);
      if (t.status === 'success') setTenders(t.data || []);
      if (f.status === 'success') setFunds(f.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const statusCounts = {};
  requests.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const totalAmount = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalFundsRequested = funds.reduce((s, f) => s + parseFloat(f.total_amount || 0), 0);
  const approvedFunds = funds.filter(f => f.status === 'APPROVED');
  const totalApprovedFunds = approvedFunds.reduce((s, f) => s + parseFloat(f.total_amount || 0), 0);

  const statusOrder = ['DRAFT','PENDING_CEO_REVIEW','CEO_APPROVED','CEO_REJECTED','IN_MARKET','TENDER_CREATED','FUND_REQUESTED','FUND_APPROVED','PAYMENT_MADE','SHIPPED','RECEIVED','CANCELLED'];
  const statusLabels = { DRAFT:'Draft', PENDING_CEO_REVIEW:'Pending CEO', CEO_APPROVED:'CEO Approved', CEO_REJECTED:'CEO Rejected', IN_MARKET:'In Market', TENDER_CREATED:'Tender Created', FUND_REQUESTED:'Fund Requested', FUND_APPROVED:'Fund Approved', PAYMENT_MADE:'Payment Made', SHIPPED:'Shipped', RECEIVED:'Received', CANCELLED:'Cancelled' };

  const exportCSV = () => {
    const headers = ['PR No','Drug','Qty','Status','CEO Decision','Created'];
    const rows = requests.map(r => [r.pr_no, r.drug_name, r.quantity_requested, r.status, r.ceo_decision, (r.created_at || '').slice(0,10)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'procurement_report.csv'; a.click();
    showToast('Report exported', 'success');
  };

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart size={22} color="#224f94" /> Procurement Reports
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Overview of all procurement activities</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{ background: '#224f94', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={loadAll} disabled={loading} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '16px', border: '1px solid #BFDBFE' }}>
          <Package size={20} color="#3B82F6" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1E40AF' }}>{requests.length}</div>
          <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>Total PRs</div>
        </div>
        <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '16px', border: '1px solid #A7F3D0' }}>
          <CheckCircle size={20} color="#059669" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{statusCounts['RECEIVED'] || 0}</div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Completed (Received)</div>
        </div>
        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '16px', border: '1px solid #FDE68A' }}>
          <Clock size={20} color="#D97706" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color:'#92400E' }}>{(statusCounts['PENDING_CEO_REVIEW'] || 0) + (statusCounts['IN_MARKET'] || 0) + (statusCounts['FUND_REQUESTED'] || 0)}</div>
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Pending Actions</div>
        </div>
        <div style={{ background: '#F3E8FF', borderRadius: 10, padding: '16px', border: '1px solid #E9D5FF' }}>
          <DollarSign size={20} color="#7C3AED" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6B21A8' }}>{parseFloat(totalAmount).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#6B21A8', fontWeight: 600 }}>Total Payments (ETB)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            PR Status Distribution
          </h3>
          {statusOrder.filter(s => statusCounts[s]).length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: '1rem' }}>No data</div>
          ) : (
            statusOrder.filter(s => statusCounts[s]).map(s => (
              <div key={s} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', marginBottom: 2 }}>
                  <span>{statusLabels[s] || s}</span>
                  <span style={{ fontWeight: 700 }}>{statusCounts[s]}</span>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${(statusCounts[s] / maxCount) * 100}%`, background: s === 'RECEIVED' ? '#059669' : s.includes('REJECT') || s === 'CANCELLED' ? '#EF4444' : s.includes('PENDING') ? '#F59E0B' : '#3B82F6' }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Financial Summary
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Total Funds Requested</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{parseFloat(totalFundsRequested).toLocaleString()} ETB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Total Funds Approved</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{parseFloat(totalApprovedFunds).toLocaleString()} ETB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Total Payments Made</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{parseFloat(totalAmount).toLocaleString()} ETB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Total Tenders</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{tenders.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Awarded Tenders</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{tenders.filter(t => t.status === 'AWARDED').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Receipts Confirmed</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{receipts.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="#475569" />
          <h3 style={{ margin: 0, fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>All Procurement Requests</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E2E8F0' }}>
              <th style={thStyle}>PR No.</th>
              <th style={thStyle}>Drug</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>CEO Decision</th>
              <th style={thStyle}>Created</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No procurement requests yet</td></tr>
            ) : requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={tdStyle}><strong>{r.pr_no}</strong></td>
                <td style={tdStyle}>{r.drug_name}</td>
                <td style={tdStyle}>{r.quantity_requested}</td>
                <td style={tdStyle}><StatusBadge status={r.status} /></td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 11, color: r.ceo_decision === 'APPROVED' ? '#059669' : r.ceo_decision === 'REJECTED' ? '#DC2626' : '#94A3B8' }}>
                    {r.ceo_decision || '—'}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    DRAFT: { bg: '#F1F5F9', color: '#475569' },
    PENDING_CEO_REVIEW: { bg: '#FEF3C7', color: '#92400E' },
    CEO_APPROVED: { bg: '#DBEAFE', color: '#1E40AF' },
    CEO_REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
    IN_MARKET: { bg: '#E0E7FF', color: '#3730A3' },
    TENDER_CREATED: { bg: '#F3E8FF', color: '#6B21A8' },
    FUND_REQUESTED: { bg: '#FCE7F3', color: '#9D174D' },
    FUND_APPROVED: { bg: '#D1FAE5', color: '#065F46' },
    PAYMENT_MADE: { bg: '#E0F2FE', color: '#075985' },
    SHIPPED: { bg: '#F3E8FF', color: '#7C3AED' },
    RECEIVED: { bg: '#D1FAE5', color: '#065F46' },
    CANCELLED: { bg: '#F1F5F9', color: '#475569' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#475569' };
  return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{status?.replace(/_/g, ' ')}</span>;
}

const thStyle = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' };
const tdStyle = { padding: '10px 14px', fontSize: 12, color: '#1E293B' };
