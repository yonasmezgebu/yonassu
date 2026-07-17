import React, { useState, useMemo, useEffect } from 'react';
import { triggerNotification } from '../../utils/ceoNotifications';
import { Package, Download, AlertTriangle, Layers, GitBranch, History, Sliders, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOInventory = () => {
  const [activeSection, setActiveSection] = useState('Stock');
  const [activeStockTab, setActiveStockTab] = useState('Pharmacy');

  // ── Transfers (Flow 1) ──
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [rejectTransferId, setRejectTransferId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Branch Transfer History ──
  const [branchHistory, setBranchHistory] = useState([]);

  // ── Stock Adjustments ──
  const [adjustments, setAdjustments] = useState([]);

  const [inventory] = useState({
    Pharmacy: [
      { id: 1, item: 'Amoxicillin 500mg', qty: 450, unit: 'Capsules', reorder: 500, cost: 2.5 },
      { id: 2, item: 'Paracetamol 500mg', qty: 2000, unit: 'Tablets', reorder: 1000, cost: 0.5 },
    ],
    Store: [
      { id: 3, item: 'A4 Paper', qty: 10, unit: 'Boxes', reorder: 20, cost: 45 },
      { id: 4, item: 'Syringes 5ml', qty: 500, unit: 'Pieces', reorder: 200, cost: 0.1 },
    ],
    Cars: [
      { id: 5, item: 'Toyota Corolla 2022', qty: 1, unit: 'Vehicle', reorder: 0, cost: 25000, status: 'Maintenance Overdue' },
      { id: 6, item: 'Hyundai Elantra 2021', qty: 1, unit: 'Vehicle', reorder: 0, cost: 22000, status: 'OK' },
    ],
    Agri: [
      { id: 7, item: 'John Deere Tractor', qty: 2, unit: 'Machine', reorder: 1, cost: 45000, status: 'OK' },
    ],
    Printing: [
      { id: 8, item: 'Cyan Ink Toner', qty: 5, unit: 'Cartridges', reorder: 10, cost: 120 },
    ]
  });

  const totalValue = useMemo(() => {
    let total = 0;
    Object.values(inventory).forEach(dept => dept.forEach(item => { total += (item.qty * item.cost); }));
    return total;
  }, [inventory]);

  useEffect(() => {
    if (activeSection === 'Transfers') fetchTransfers();
    if (activeSection === 'BranchHistory') fetchBranchHistory();
    if (activeSection === 'Adjustments') fetchAdjustments();
  }, [activeSection]);

  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const res = await apiClient.get('/transfer-requests');
      setTransfers(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { setTransfers([]); } finally { setTransfersLoading(false); }
  };

  const fetchBranchHistory = async () => {
    try {
      const res = await apiClient.get('/transfer-requests?status=COMPLETED');
      setBranchHistory(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { setBranchHistory([]); }
  };

  const fetchAdjustments = async () => {
    try {
      const res = await apiClient.get('/store/adjustments');
      setAdjustments(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { setAdjustments([]); }
  };

  const handleTransferDecision = async (id, decision) => {
    if (decision === 'REJECTED' && !rejectReason) return;
    try {
      await apiClient.patch(`/transfer-requests/${id}/decision`, { decision, reason: rejectReason });
      setRejectTransferId(null);
      setRejectReason('');
      fetchTransfers();
    } catch (e) { alert('Failed: ' + e.message); }
  };

  const sections = [
    { id: 'Stock', label: 'Stock View', icon: <Package size={15}/> },
    { id: 'Transfers', label: 'Transfers Review', icon: <GitBranch size={15}/> },
    { id: 'BranchHistory', label: 'Branch Transfer History', icon: <History size={15}/> },
    { id: 'Adjustments', label: 'Stock Adjustments', icon: <Sliders size={15}/> },
  ];

  const badge = (s) => {
    const map = {
      PENDING_APPROVAL: { bg: '#fef3c7', col: '#b45309' },
      APPROVED: { bg: '#dcfce7', col: '#166534' },
      REJECTED: { bg: '#fee2e2', col: '#991b1b' },
      COMPLETED: { bg: '#e0e7ff', col: '#4338ca' },
      DISCREPANCY: { bg: '#fce7f3', col: '#9d174d' },
    };
    const style = map[s] || { bg: '#f1f5f9', col: '#64748b' };
    return <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: style.bg, color: style.col }}>{s}</span>;
  };

  const renderStockTable = (data) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead style={{ background: '#f8fafc' }}>
        <tr>
          <th style={{ padding: 12 }}>Item Name</th>
          <th style={{ padding: 12 }}>Current Stock</th>
          <th style={{ padding: 12 }}>Unit</th>
          <th style={{ padding: 12 }}>Unit Cost</th>
          <th style={{ padding: 12 }}>Total Value</th>
          <th style={{ padding: 12 }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map(i => {
          const isLow = (activeStockTab === 'Cars' || activeStockTab === 'Agri') ? i.status !== 'OK' : i.qty <= i.reorder;
          return (
            <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: 12 }}>{i.item}</td>
              <td style={{ padding: 12, fontWeight: 'bold' }}>{i.qty}</td>
              <td style={{ padding: 12 }}>{i.unit}</td>
              <td style={{ padding: 12 }}>${i.cost.toFixed(2)}</td>
              <td style={{ padding: 12, fontWeight: 'bold' }}>${(i.qty * i.cost).toLocaleString()}</td>
              <td style={{ padding: 12 }}>
                {isLow
                  ? <span style={{ display:'flex',alignItems:'center',gap:4,color:'#ef4444',fontWeight:'bold',fontSize:13,background:'#fee2e2',padding:'4px 8px',borderRadius:4,width:'fit-content' }}><AlertTriangle size={14}/> {activeStockTab === 'Cars' ? 'Maintenance' : 'Low Stock'}</span>
                  : <span style={{ color:'#166534',fontWeight:'bold',fontSize:13,background:'#dcfce7',padding:'4px 8px',borderRadius:4 }}>OK</span>
                }
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>📦 INVENTORY MANAGEMENT</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Stock, Transfers, Adjustments — all in one place</p>
        </div>
        <button onClick={() => triggerNotification('Export Started', 'Exporting Inventory Report...')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export
        </button>
      </div>

      {/* Total Value Banner */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: 20, borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: '50%' }}><Layers size={28}/></div>
        <div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Aggregated Total Inventory Value</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>${totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '10px 16px', borderRadius: 6, border: activeSection === s.id ? 'none' : '1px solid #e2e8f0', background: activeSection === s.id ? '#0f172a' : 'white', color: activeSection === s.id ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── Section: Stock View ── */}
      {activeSection === 'Stock' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Object.keys(inventory).map(tab => (
              <button key={tab} onClick={() => setActiveStockTab(tab)} style={{ padding: '8px 16px', borderRadius: 6, border: activeStockTab === tab ? 'none' : '1px solid #e2e8f0', background: activeStockTab === tab ? '#f59e0b' : 'white', color: activeStockTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18}/> {activeStockTab} Inventory
            </h3>
            {renderStockTable(inventory[activeStockTab])}
          </div>
        </>
      )}

      {/* ── Section: Transfers Review (Flow 1) ── */}
      {activeSection === 'Transfers' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={18} color="#06b6d4"/> Pharmacy Transfer Requests — CEO Review
          </h3>
          {transfersLoading ? <p style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: 12 }}>Code</th>
                  <th style={{ padding: 12 }}>Drug</th>
                  <th style={{ padding: 12 }}>Req Qty</th>
                  <th style={{ padding: 12 }}>Pharmacy Stock</th>
                  <th style={{ padding: 12 }}>Store Stock</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0
                  ? <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No transfer requests to review.</td></tr>
                  : transfers.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{r.request_code}</td>
                    <td style={{ padding: 12 }}>{r.drug_name}</td>
                    <td style={{ padding: 12, fontWeight: 'bold', color: '#0284c7' }}>{r.requested_qty}</td>
                    <td style={{ padding: 12 }}>{r.pharmacy_qty_at_request}</td>
                    <td style={{ padding: 12 }}>{r.store_qty_at_request}</td>
                    <td style={{ padding: 12 }}>{badge(r.status)}</td>
                    <td style={{ padding: 12 }}>
                      {(r.status === 'PENDING_APPROVAL' || r.status === 'DISCREPANCY') && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleTransferDecision(r.id, 'APPROVED')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
                            <CheckCircle size={13} style={{ marginRight: 4 }}/>Approve
                          </button>
                          <button onClick={() => setRejectTransferId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
                            <XCircle size={13} style={{ marginRight: 4 }}/>Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section: Branch Transfer History ── */}
      {activeSection === 'BranchHistory' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#059669"/> Branch Transfer History
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Code</th>
                <th style={{ padding: 12 }}>Drug</th>
                <th style={{ padding: 12 }}>Qty Transferred</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {branchHistory.length === 0
                ? <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No completed transfer history found.</td></tr>
                : branchHistory.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.request_code}</td>
                  <td style={{ padding: 12 }}>{r.drug_name}</td>
                  <td style={{ padding: 12 }}>{r.requested_qty}</td>
                  <td style={{ padding: 12 }}>{badge(r.status)}</td>
                  <td style={{ padding: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Section: Stock Adjustments ── */}
      {activeSection === 'Adjustments' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} color="#059669"/> Stock Adjustments — Pending CEO Approval
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Item</th>
                <th style={{ padding: 12 }}>Type</th>
                <th style={{ padding: 12 }}>Qty Adjusted</th>
                <th style={{ padding: 12 }}>Reason</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0
                ? <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No stock adjustments found.</td></tr>
                : adjustments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12 }}>{a.product_name || a.item_name}</td>
                  <td style={{ padding: 12 }}>{a.adjustment_type}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{a.quantity_adjusted}</td>
                  <td style={{ padding: 12 }}>{a.reason}</td>
                  <td style={{ padding: 12 }}>{badge(a.status)}</td>
                  <td style={{ padding: 12 }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Transfer Modal */}
      {rejectTransferId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ margin: '0 0 16px' }}>Reject Transfer #{rejectTransferId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}/>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectTransferId(null); setRejectReason(''); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleTransferDecision(rejectTransferId, 'REJECTED')} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOInventory;
