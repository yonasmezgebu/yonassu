import React, { useState, useEffect } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { ShoppingCart, CheckCircle, XCircle, Download, User, ArrowRight, Clock, GitBranch, Filter, PauseCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOPurchase = () => {
  const [activeSection, setActiveSection] = useState('Orders');

  // ── Purchase Orders ──
  const [requests, setRequests] = useState([
    { id: 'PR-1001', dept: 'Pharmacy', by: 'Pharm Manager', item: 'Amoxicillin 500mg', qty: 1000, amt: 5000, date: '2026-07-01', status: 'PENDING' },
    { id: 'PR-1002', dept: 'Store', by: 'Store Manager', item: 'Office Supplies', qty: 50, amt: 500, date: '2026-07-01', status: 'PENDING' },
  ]);
  const [orders, setOrders] = useState([
    { id: 'PO-501', dept: 'Pharmacy', supplier: 'PharmaCorp', item: 'Paracetamol', qty: 5000, amt: 2500, status: 'Completed', date: '2026-06-25' },
    { id: 'PO-502', dept: 'Car Rental', supplier: 'AutoParts Ltd', item: 'Tires Set', qty: 40, amt: 12000, status: 'Ordered', date: '2026-06-28' },
  ]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewSupplier, setViewSupplier] = useState(null);

  // ── Purchase Flow (Flow 2/3) ──
  const [flowItems, setFlowItems] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);

  // ── Approvals ──
  const [approvalTab, setApprovalTab] = useState('Pending');
  const [pendingItems, setPendingItems] = useState([
    { id: 'PR-902', type: 'Drug Procurement', dept: 'Store', date: '2026-06-27', days: 3, priority: 'Normal', description: 'Paracetamol batch restock' },
    { id: 'F3-112', type: 'New Drug Request', dept: 'Pharmacy', date: '2026-06-29', days: 1, priority: 'High', description: 'Urgent antibiotic request' },
    { id: 'PO-442', type: 'Purchase Order', dept: 'Purchase', date: '2026-06-29', days: 1, priority: 'Normal', description: 'Printing materials order' },
  ]);
  const [approvedItems] = useState([
    { id: 'PR-800', type: 'Drug Procurement', dept: 'Pharmacy', date: '2026-06-20', description: 'Amoxicillin batch — approved', approvedBy: 'CEO', approvedAt: '2026-06-21' },
    { id: 'PO-410', type: 'Purchase Order', dept: 'Store', date: '2026-06-18', description: 'Stationery order', approvedBy: 'CEO', approvedAt: '2026-06-19' },
  ]);
  const [rejectedItems] = useState([
    { id: 'PR-750', type: 'Drug Procurement', dept: 'Pharmacy', date: '2026-06-10', description: 'Duplicate order rejected', reason: 'Already in stock', rejectedBy: 'CEO', rejectedAt: '2026-06-11' },
  ]);
  const [filterDept, setFilterDept] = useState('All');

  useEffect(() => {
    if (activeSection === 'PurchaseFlow') fetchFlowItems();
  }, [activeSection]);

  const fetchFlowItems = async () => {
    setFlowLoading(true);
    try {
      const res = await apiClient.get('/procurement/approved-for-purchase');
      setFlowItems(Array.isArray(res?.data) ? res.data : (res?.data?.data || []));
    } catch (e) { setFlowItems([]); } finally { setFlowLoading(false); }
  };

  const handleApprovePR = (pr) => {
    setRequests(requests.map(r => r.id === pr.id ? { ...r, status: 'APPROVED' } : r));
    setOrders([{ id: `PO-${Math.floor(Math.random() * 1000) + 600}`, dept: pr.dept, supplier: 'To Be Assigned', item: pr.item, qty: pr.qty, amt: pr.amt, status: 'Approved', date: new Date().toISOString().split('T')[0] }, ...orders]);
    submitNotification('Purchase Request Approved', `PR ${pr.id} approved. PO generated.`);
  };

  const handleRejectPR = () => {
    if (!rejectReason) return alert('Reason is required');
    setRequests(requests.map(r => r.id === rejectId ? { ...r, status: 'REJECTED' } : r));
    receiveNotification('Purchase Request Rejected', `PR ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null); setRejectReason('');
  };

  const handleApprovalAction = (id, action) => {
    if (action === 'APPROVE') {
      submitNotification('Item Approved', `Item ${id} approved.`);
      setPendingItems(prev => prev.filter(i => i.id !== id));
    } else if (action === 'REJECT') {
      receiveNotification('Item Rejected', `Item ${id} rejected.`);
      setPendingItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const filtered = pendingItems.filter(i => filterDept === 'All' || i.dept === filterDept);

  const badge = (s, custom) => {
    const map = {
      PENDING: { bg: '#fef3c7', col: '#b45309' },
      APPROVED: { bg: '#dcfce7', col: '#166534' },
      REJECTED: { bg: '#fee2e2', col: '#991b1b' },
      Completed: { bg: '#dcfce7', col: '#166534' },
      Ordered: { bg: '#e0e7ff', col: '#4338ca' },
    };
    const st = map[s] || { bg: '#f1f5f9', col: '#64748b' };
    return <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: st.bg, color: st.col }}>{custom || s}</span>;
  };

  const sections = [
    { id: 'Orders', label: 'Purchase Orders', icon: <ShoppingCart size={15}/> },
    { id: 'PurchaseFlow', label: 'Purchase Flow (2/3)', icon: <GitBranch size={15}/> },
    { id: 'Approvals', label: 'Approvals', icon: <Clock size={15}/> },
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>🛒 PURCHASE MANAGEMENT</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Orders, Purchase Flow, and Approvals — all in one place</p>
        </div>
        <button onClick={() => triggerNotification('Export', 'Exporting Purchase Report...')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '10px 16px', borderRadius: 6, border: activeSection === s.id ? 'none' : '1px solid #e2e8f0', background: activeSection === s.id ? '#0f172a' : 'white', color: activeSection === s.id ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── Section: Purchase Orders ── */}
      {activeSection === 'Orders' && (<>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} color="#3b82f6"/> Pending Purchase Requests
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['PR Number','Dept','Requested By','Item','Qty','Est. Amount','Date','Status','Actions'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12 }}>{r.dept}</td>
                  <td style={{ padding: 12 }}>{r.by}</td>
                  <td style={{ padding: 12 }}>{r.item}</td>
                  <td style={{ padding: 12 }}>{r.qty}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>ETB {r.amt.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                  <td style={{ padding: 12 }}>{badge(r.status)}</td>
                  <td style={{ padding: 12 }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprovePR(r)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 'bold' }}><CheckCircle size={13}/> Approve</button>
                        <button onClick={() => setRejectId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 'bold' }}><XCircle size={13}/> Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>All Purchase Orders</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['PO Number','Dept','Supplier','Item','Qty','Total','Pipeline','Date','Actions'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{o.id}</td>
                  <td style={{ padding: 12 }}>{o.dept}</td>
                  <td style={{ padding: 12 }}>{o.supplier}</td>
                  <td style={{ padding: 12 }}>{o.item}</td>
                  <td style={{ padding: 12 }}>{o.qty}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>ETB {o.amt.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                      <span style={{ color: '#3b82f6' }}>Appr</span><ArrowRight size={12}/>
                      <span style={{ color: ['Ordered','Received','Completed'].includes(o.status) ? '#3b82f6' : '#94a3b8' }}>Ord</span><ArrowRight size={12}/>
                      <span style={{ color: ['Received','Completed'].includes(o.status) ? '#3b82f6' : '#94a3b8' }}>Recv</span><ArrowRight size={12}/>
                      <span style={{ color: o.status === 'Completed' ? '#22c55e' : '#94a3b8', fontWeight: o.status === 'Completed' ? 'bold' : 'normal' }}>Done</span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>{o.date}</td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => setViewSupplier(o.supplier)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><User size={13}/> Supplier</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── Section: Purchase Flow (2/3) ── */}
      {activeSection === 'PurchaseFlow' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={18} color="#059669"/> Purchase / New Drug Flow (Flow 2/3)
          </h3>
          {flowLoading ? <p style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading flow items...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['PR No.','Drug / Item','Qty','Urgency','Dept','Status','Date'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {flowItems.length === 0
                  ? <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No active purchase flow items.</td></tr>
                  : flowItems.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{f.pr_no}</td>
                    <td style={{ padding: 12 }}>{f.drug_name}</td>
                    <td style={{ padding: 12 }}>{f.quantity_requested} {f.unit_of_measure}</td>
                    <td style={{ padding: 12 }}>{f.urgency}</td>
                    <td style={{ padding: 12 }}>{f.requesting_dept}</td>
                    <td style={{ padding: 12 }}>{badge(f.status)}</td>
                    <td style={{ padding: 12 }}>{f.created_at ? new Date(f.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section: Approvals (Pending / Approved / Rejected) ── */}
      {activeSection === 'Approvals' && (<>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Pending','Approved','Rejected'].map(t => (
            <button key={t} onClick={() => setApprovalTab(t)} style={{ padding: '8px 18px', borderRadius: 6, border: approvalTab === t ? 'none' : '1px solid #e2e8f0', background: approvalTab === t ? (t === 'Pending' ? '#b45309' : t === 'Approved' ? '#166534' : '#991b1b') : 'white', color: approvalTab === t ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
              {t}
            </button>
          ))}
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ marginLeft: 'auto', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option value="All">All Depts</option>
            {['Pharmacy','Store','Purchase','Finance','HR'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {approvalTab === 'Pending' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>{['ID','Type','Dept','Description','Date','Days','Priority','Actions'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No pending approvals.</td></tr>
                  : filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{item.id}</td>
                    <td style={{ padding: 12 }}>{item.type}</td>
                    <td style={{ padding: 12 }}>{item.dept}</td>
                    <td style={{ padding: 12, color: '#475569', fontSize: 13 }}>{item.description}</td>
                    <td style={{ padding: 12 }}>{item.date}</td>
                    <td style={{ padding: 12 }}><span style={{ color: item.days > 5 ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{item.days}d</span></td>
                    <td style={{ padding: 12 }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: item.priority === 'High' ? '#fee2e2' : '#f1f5f9', color: item.priority === 'High' ? '#ef4444' : '#64748b' }}>{item.priority}</span></td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleApprovalAction(item.id, 'APPROVE')} style={{ padding: '6px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Approve"><CheckCircle size={16}/></button>
                        <button style={{ padding: '6px', background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Hold"><PauseCircle size={16}/></button>
                        <button onClick={() => handleApprovalAction(item.id, 'REJECT')} style={{ padding: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Reject"><XCircle size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {approvalTab === 'Approved' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>{['ID','Type','Dept','Description','Approved By','Approved At'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {approvedItems.length === 0
                  ? <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No approved items.</td></tr>
                  : approvedItems.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{a.id}</td>
                    <td style={{ padding: 12 }}>{a.type}</td>
                    <td style={{ padding: 12 }}>{a.dept}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.description}</td>
                    <td style={{ padding: 12, fontWeight: 'bold', color: '#166534' }}>{a.approvedBy}</td>
                    <td style={{ padding: 12 }}>{a.approvedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {approvalTab === 'Rejected' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>{['ID','Type','Dept','Description','Rejection Reason','Rejected By','Date'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rejectedItems.length === 0
                  ? <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No rejected items.</td></tr>
                  : rejectedItems.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff7f7' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                    <td style={{ padding: 12 }}>{r.type}</td>
                    <td style={{ padding: 12 }}>{r.dept}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{r.description}</td>
                    <td style={{ padding: 12, color: '#ef4444' }}>{r.reason}</td>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{r.rejectedBy}</td>
                    <td style={{ padding: 12 }}>{r.rejectedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>)}

      {/* Reject PR Modal */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject PR {rejectId}</h3>
            <textarea placeholder="Reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}/>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectPR} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {viewSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Supplier Details</h3>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
              <p><strong>Name:</strong> {viewSupplier}</p>
              <p><strong>Contact:</strong> +251 900 112233</p>
              <p><strong>Bank:</strong> CBE 1000123456789</p>
              <p><strong>Past POs:</strong> 4</p>
            </div>
            <button onClick={() => setViewSupplier(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPurchase;
