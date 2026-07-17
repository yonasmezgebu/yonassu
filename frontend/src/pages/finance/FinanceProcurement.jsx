import React, { useState, useEffect } from 'react';
import { PieChart, Download, CheckCircle, Clock, Wallet, Banknote, FileText, Bell, X } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import api from '../../services/apiClient';
import notificationService from '../../services/notificationService';

const FinanceProcurement = () => {
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('internal'); // 'internal', 'public_funds', 'public_payments'
  const [fundRequests, setFundRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewFundRequest, setViewFundRequest] = useState(null);
  const [toasts, setToasts] = useState([]);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [fundRes, payRes] = await Promise.all([
        api.get('/public-procurement/fund-requests'),
        api.get('/public-procurement/payments')
      ]);
      const fList = fundRes?.data || fundRes || [];
      const pList = payRes?.data || payRes || [];
      setFundRequests(Array.isArray(fList) ? fList : []);
      setPayments(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);


  const handleVerifyBudget = async (id) => {
    try {
      await api.put(`/public-procurement/fund-requests/${id}/verify`);
      fetchPublicData();
    } catch (err) {
      alert('Error verifying budget: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCreatePayment = async (id) => {
    try {
      await api.post(`/public-procurement/payments`, { fundRequestId: id });
      fetchPublicData();
    } catch (err) {
      alert('Error creating payment: ' + (err?.response?.data?.message || err.message));
    }
  };

  const procurements = financeState.procurements;

  const filteredProcurements = procurements.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return p.status.includes('Pending');
    if (filter === 'Approved') return p.status === 'Approved' || p.status === 'Received' || p.status === 'Sent';
    return p.type === filter;
  });

  // Mock Budget Data for Departments
  const budgetData = [
    { department: 'Pharmacy', allocated: 500000, spent: 345000 },
    { department: 'Laboratory', allocated: 300000, spent: 120000 },
    { department: 'Admin', allocated: 150000, spent: 145000 },
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#db2777' }}>
            <PieChart color="#ec4899" size={28} /> PROCUREMENT FINANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Financial oversight of M8-M11 procurement flows.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
          <Download size={16} /> Export Financial Report
        </button>
      </div>

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#fee2e2' : '#dcfce7', color: t.type === 'error' ? '#991b1b' : '#166534', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Budget vs Actual Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {budgetData.map(b => (
          <div key={b.department} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>{b.department} Budget</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#475569' }}>Allocated</span>
              <span style={{ fontWeight: 600 }}>ETB {b.allocated.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: '#475569' }}>Spent (Actual)</span>
              <span style={{ fontWeight: 600, color: '#db2777' }}>ETB {b.spent.toLocaleString()}</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ 
                width: `${Math.min(100, (b.spent / b.allocated) * 100)}%`, 
                height: '100%', 
                background: (b.spent / b.allocated) > 0.9 ? '#ef4444' : '#10b981' 
              }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#94a3b8' }}>Remaining</span>
              <span style={{ fontWeight: 'bold', color: (b.allocated - b.spent) < 10000 ? '#ef4444' : '#10b981' }}>
                ${(b.allocated - b.spent).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'internal', label: 'Internal Procurement', icon: <FileText size={16} /> },
          { id: 'public_funds', label: 'Public Fund Requests', icon: <Wallet size={16} /> },
          { id: 'public_payments', label: 'Public Payments', icon: <Banknote size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab.id ? '#db2777' : 'white',
              color: activeTab === tab.id ? 'white' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(219,39,119,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Internal Procurement */}
      {activeTab === 'internal' && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
          {['All', 'Pending', 'Approved', 'Requisition', 'Fund Request', 'Purchase Order', 'Goods Received Note'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                background: filter === f ? '#fce7f3' : 'transparent',
                color: filter === f ? '#db2777' : '#64748b',
                border: filter === f ? '1px solid #fbcfe8' : '1px solid transparent',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {f}
            </button>
          ))}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Reference ID', 'Type', 'Date', 'Department / Supplier', 'Details', 'Amount', 'Status'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProcurements.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{p.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p.type}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.requestDate || p.poDate || p.grnDate}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{p.department || p.supplier}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>
                  {p.item && <span>Item: {p.item}</span>}
                  {p.poReference && <span>Ref: {p.poReference}</span>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                  {(p.requestedAmount || p.totalAmount) ? `ETB ${(p.requestedAmount || p.totalAmount).toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: p.status.includes('Pending') ? '#fef3c7' : '#dcfce7',
                    color: p.status.includes('Pending') ? '#d97706' : '#16a34a'
                  }}>
                    {p.status.includes('Pending') ? <Clock size={12} /> : <CheckCircle size={12} />}
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredProcurements.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Public Fund Requests */}
      {activeTab === 'public_funds' && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Request No.', 'Total Amount', 'Status', 'Date', 'Action'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>Loading...</td></tr>
              ) : fundRequests.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No fund requests.</td></tr>
              ) : fundRequests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{req.request_code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                    ETB {Number(req.total_amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: req.status === 'APPROVED' ? '#fef3c7' : req.status === 'READY_FOR_PAYMENT' ? '#dcfce7' : '#f1f5f9',
                      color: req.status === 'APPROVED' ? '#d97706' : req.status === 'READY_FOR_PAYMENT' ? '#16a34a' : '#475569'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => setViewFundRequest(req)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Public Payments */}
      {activeTab === 'public_payments' && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Receipt Code', 'Fund Request', 'Amount', 'Status', 'Paid At'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No payments found.</td></tr>
              ) : payments.map(pay => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{pay.receipt_code}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{pay.request_code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                    ETB {Number(pay.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {pay.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(pay.paid_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    {/* ══════════════════════════════════════════════════
        MODAL: Fund Request Details View (Finance)
    ══════════════════════════════════════════════════ */}
    {viewFundRequest && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(4px)', padding: '24px', overflowY: 'auto' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Fund Request Details</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{viewFundRequest.request_code} • {new Date(viewFundRequest.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setViewFundRequest(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#64748b" />
            </button>
          </div>
          
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Total Amount Required:</span>
              <span style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>ETB {Number(viewFundRequest.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
              <span style={{ fontWeight: 700, color: viewFundRequest.status === 'APPROVED' ? '#d97706' : '#166534' }}>{viewFundRequest.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#334155' }}>Included Awarded Tenders</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
            {viewFundRequest.items?.map(item => (
              <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>{item.tender_title}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Supplier: <span style={{ fontWeight: 600, color: '#334155' }}>{item.supplier}</span></div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '15px' }}>
                    ETB {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {item.products && item.products.length > 0 ? (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Item Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Unit Price (ETB)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Total (ETB)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.products.map((prod, idx) => {
                          const totalAmount = prod.total_birr + (prod.total_cent / 100);
                          const unitPrice = prod.price_birr + (prod.price_cent / 100);
                          return (
                            <tr key={idx} style={{ borderBottom: idx !== item.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                              <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 500 }}>{prod.item_name}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{prod.quantity}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{Number(unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>{Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                        <tr>
                          <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>Subtotal:</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {Number(item.products.reduce((acc, p) => acc + p.total_birr + (p.total_cent / 100), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No itemized products found for this tender.</div>
                )}
              </div>
            ))}
          </div>

          {viewFundRequest.status === 'APPROVED' && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button onClick={() => { handleVerifyBudget(viewFundRequest.id); setViewFundRequest(null); }} style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                Verify Budget &amp; Mark Ready for Payment
              </button>
            </div>
          )}
          {viewFundRequest.status === 'READY_FOR_PAYMENT' && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button onClick={() => { handleCreatePayment(viewFundRequest.id); setViewFundRequest(null); }} style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                Create Final Payment
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    </div>
  );
};

export default FinanceProcurement;
