import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import CEOStampSignature from '../../components/CEOStampSignature';
import { CheckCircle, X, Printer } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  APPROVED: { bg: '#DBEAFE', color: '#1E40AF', text: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
};

const PharmacyApprovals = () => {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [requisitions, setRequisitions] = useState([]);
  const [selectedReqNo, setSelectedReqNo] = useState(null);
  const [detail, setDetail] = useState(null);
  // Per-item approved quantities: { [itemId]: qty }
  const [approvedQtys, setApprovedQtys] = useState({});
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const res = await apiClient.get('/erp/requisitions?status=PENDING');
      if (res.status === 'success') setRequisitions(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadDetail = async (grp) => {
    setSelectedReqNo(grp.req_no);
    setShowReject(false);
    setRejectReason('');
    try {
      // Load full detail via the first item's id
      const res = await apiClient.get(`/erp/requisitions/${grp.id}`);
      if (res.status === 'success') {
        const d = res.data;
        setDetail(d);
        // Initialise approved qty per item
        const initial = {};
        (d.items || [d]).forEach(it => { initial[it.id] = it.quantity_requested; });
        setApprovedQtys(initial);
      }
    } catch (e) { console.error(e); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const firstItem = (detail.items || [detail])[0];
      const res = await apiClient.post(`/erp/approvals/${firstItem.id}`, {
        approvedQuantities: approvedQtys,
      });
      if (res.status === 'success') {
        const itemCount = (detail.items || [detail]).length;
        showToast(`Requisition ${detail.req_no} approved — ${itemCount} item(s)`, 'approved');
        playSound('success');
        sendPushNotification('Requisition Approved', `${detail.req_no} — ${itemCount} item(s) approved`, `/store/issue-notes/create/${res.data.id}`);
        setDetail(d => ({
          ...d,
          status: 'APPROVED',
          approval: { id: res.data.id, apr_no: res.data.apr_no, decision: 'APPROVED', stamp_id: res.data.stamp?.stamp_id, approved_by_name: res.data.stamp?.approved_by_name, approved_at: res.data.stamp?.timestamp }
        }));
        loadPending();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Approval failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Rejection reason is required', 'warning'); return; }
    setActionLoading(true);
    try {
      const firstItem = (detail.items || [detail])[0];
      const res = await apiClient.post(`/erp/approvals/${firstItem.id}`, { rejectionReason: rejectReason });
      if (res.status === 'success') {
        showToast(`Requisition ${detail.req_no} rejected`, 'rejected');
        playSound('error');
        setDetail(d => ({ ...d, status: 'REJECTED', rejection_reason: rejectReason }));
        setShowReject(false);
        loadPending();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Rejection failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handlePrint = () => {
    if (!detail) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const allItems = detail.items || [detail];
    const grandTotal = allItems.reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.quantity_requested || 0)), 0);

    const itemRows = allItems.map((it, i) => {
      const lineTotal = it.store_unit_price ? (it.quantity_requested * it.store_unit_price).toFixed(2) : null;
      return `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}" style="border-bottom:1px solid #e2e8f0">
        <td class="py-4 px-3 font-medium text-gray-700">${it.drug_name}</td>
        <td class="py-4 px-3 text-center font-bold text-blue-900">${it.quantity_requested} <span class="text-xs font-normal text-gray-400">${it.unit_of_measure || ''}</span></td>
        <td class="py-4 px-3 text-center text-gray-500">${it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</td>
        <td class="py-4 px-3 text-center font-bold text-gray-900">${lineTotal ? `${lineTotal} ETB` : '—'}</td>
        <td class="py-4 px-3 text-right font-bold text-green-700">${it.quantity_requested}</td>
      </tr>`;
    }).join('');

    const storeSideRows = allItems.map(it => `
      <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
        <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:4px">${it.drug_name}</div>
        <div style="font-size:11px;color:#64748b">Available: <strong style="color:#1e293b">${it.current_store_stock || 0}</strong></div>
        <div style="font-size:11px;color:#64748b">Single Price: <strong>${it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</strong></div>
        <div style="font-size:11px;font-weight:700;color:#065f46">Total Value: ${it.store_unit_price ? `${((it.current_store_stock||0)*it.store_unit_price).toFixed(2)} ETB` : '—'}</div>
      </div>`).join('');

    const pharmSideRows = allItems.map(it => {
      const reorder = it.reorder_level || 0;
      const current = it.current_pharmacy_stock || 0;
      const shortage = current < reorder ? reorder - current : 0;
      const price = it.pharmacy_unit_price || it.store_unit_price || 0;
      return `
      <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
        <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:4px">${it.drug_name}</div>
        <div style="font-size:11px;color:#64748b">Available: <strong>${current}</strong></div>
        <div style="font-size:11px;color:#64748b">Single Price: <strong>${price > 0 ? `${price} ETB` : '—'}</strong></div>
        <div style="font-size:11px;font-weight:700;color:#065f46">Total Value: ${price > 0 ? `${(current*price).toFixed(2)} ETB` : '—'}</div>
        <div style="font-size:11px;color:#64748b">Reorder: <strong>${reorder}</strong></div>
        ${shortage > 0 ? `<div style="font-size:11px;color:#ef4444;font-weight:700">Shortage: -${shortage}</div>` : ''}
      </div>`;
    }).join('');

    const storeTotalValue = allItems.reduce((sum, it) => sum + ((it.store_unit_price||0)*(it.current_store_stock||0)), 0);
    const pharmTotalValue = allItems.reduce((sum, it) => sum + ((it.pharmacy_unit_price||it.store_unit_price||0)*(it.current_pharmacy_stock||0)), 0);

    const approvedByName = detail.approval?.approved_by_name || '';
    const approvedAt = detail.approval?.approved_at ? new Date(detail.approval.approved_at).toLocaleDateString() : '';
    const isApproved = detail.status === 'APPROVED';

    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <title>Model 21 Approval - ${detail.req_no}</title>
  <style>
    body { font-family: 'Inter', sans-serif; }
    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-100 p-8">
  <div class="no-print mb-4 flex justify-end">
    <button onclick="window.print()" style="padding:10px 20px;background:#224f94;color:white;border:none;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer">🖨️ Print / Save PDF</button>
  </div>
  <div class="max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden flex flex-col" style="min-height:90vh">
      <!-- Blue Header -->
      <div style="background:#224f94;color:white;padding:28px 32px;display:flex;justify-content:space-between;position:relative;overflow:hidden">
        <div style="z-index:10;display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;background:white;border-radius:50% 50% 50% 0;display:flex;align-items:center;justify-content:center;color:#224f94;font-weight:800;font-size:9px">SUTANA</div>
          <div>
            <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase">APPROVAL:</h1>
            <p style="margin:0;font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:1px">Model 21 - CEO Authorization</p>
          </div>
        </div>
        <div style="position:absolute;top:-40px;right:-20px;width:180px;height:180px;background:#4585c5;border-radius:40% 60% 70% 30%;opacity:0.8"></div>
        <div style="position:absolute;bottom:-10px;right:110px;width:70px;height:70px;background:#1c3d70;border-radius:12px"></div>
        <div style="position:absolute;top:16px;right:56px;width:16px;height:16px;background:#93c5fd;border-radius:50%"></div>
      </div>

      <!-- Meta -->
      <div style="padding:20px 28px;display:flex;justify-content:space-between;border-bottom:2px solid #224f94">
        <div>
          <div style="font-size:10px;font-weight:800;color:#224f94;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Requested By:</div>
          <div style="font-size:18px;font-weight:600;color:#1e293b">${detail.requested_by_name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px">● Department: ${detail.requesting_dept || 'Pharmacy'}</div>
        </div>
        <div style="text-align:right;font-size:12px;color:#475569;display:flex;flex-direction:column;gap:4px">
          <div>Req No: <strong style="color:#1e293b">${detail.req_no}</strong></div>
          <div>Date: <strong style="color:#1e293b">${new Date(detail.created_at).toLocaleDateString()}</strong></div>
          <div style="margin-top:4px">
            <span style="background:${isApproved ? '#dbeafe' : '#fee2e2'};color:${isApproved ? '#1e40af' : '#991b1b'};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">${detail.status}</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div style="padding:24px 28px;flex:1">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="border-bottom:2px solid #224f94">
              <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase">Product</th>
              <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Qty</th>
              <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Single Price</th>
              <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Total Price</th>
              <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:right">Approved Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid #224f94;background:#eff6ff">
              <td colspan="3" style="padding:14px 0;font-weight:800;text-transform:uppercase;color:#1e40af;text-align:right;font-size:13px">Total Value:</td>
              <td colspan="2" style="padding:14px 0;text-align:center;font-weight:800;color:#224f94;font-size:16px">${grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}</td>
            </tr>
          </tfoot>
        </table>

        ${detail.justification ? `<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;font-size:12px;color:#475569;margin-bottom:16px;border-left:3px solid #224f94"><strong>Justification:</strong> ${detail.justification}</div>` : ''}

        <!-- Stamp & Signature -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;padding-top:16px">
          <div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px">Authorized by</div>
            <div style="font-family:'Caveat',cursive;font-size:36px;color:#1e40af;transform:rotate(-3deg);display:inline-block;line-height:1">${approvedByName}</div>
            <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:4px"></div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">${approvedByName} — CEO</div>
          </div>
          ${isApproved ? `
          <div style="border:4px solid #059669;border-radius:8px;padding:12px 20px;transform:rotate(-6deg);text-align:center;display:inline-flex;flex-direction:column;gap:2px">
            <span style="font-size:14px;font-weight:900;color:#059669;letter-spacing:2px">APPROVED</span>
            <span style="font-size:10px;color:#64748b">${approvedByName}</span>
            <span style="font-size:10px;color:#64748b">${approvedAt}</span>
          </div>` : `
          <div style="border:4px solid #dc2626;border-radius:8px;padding:12px 20px;transform:rotate(-6deg);text-align:center">
            <span style="font-size:14px;font-weight:900;color:#dc2626;letter-spacing:2px">REJECTED</span>
          </div>`}
        </div>
      </div>

      <!-- Inventory Summary -->
      <div style="display:flex;gap:24px;padding:20px 28px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:0 28px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #dbeafe">Store Inventory</div>
          ${storeSideRows}
          <div style="border-top:2px solid #dbeafe;padding-top:8px;font-size:11px;font-weight:800;color:#1e40af">
            Grand: ${storeTotalValue > 0 ? `${storeTotalValue.toFixed(2)} ETB` : '—'}
          </div>
        </div>
        <div style="width:1px;background:#e2e8f0"></div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:800;color:#9d174d;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #fce7f3">Pharmacy Inventory</div>
          ${pharmSideRows}
          <div style="border-top:2px solid #fce7f3;padding-top:8px;font-size:11px;font-weight:800;color:#9d174d">
            Grand: ${pharmTotalValue > 0 ? `${pharmTotalValue.toFixed(2)} ETB` : '—'}
          </div>
        </div>
      </div>

      <!-- Blue Footer -->
      <div style="background:#224f94;color:white;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:-10px;left:-10px;width:90px;height:90px;background:#1c3d70;border-radius:0 36px 0 0;padding:14px;display:flex;flex-wrap:wrap;gap:5px">
          <div style="width:7px;height:7px;background:#4585c5;border-radius:50%"></div>
          <div style="width:7px;height:7px;background:#4585c5;border-radius:50%"></div>
          <div style="width:7px;height:7px;background:#4585c5;border-radius:50%"></div>
          <div style="width:7px;height:7px;background:#4585c5;border-radius:50%"></div>
        </div>
        <div style="position:absolute;bottom:-16px;left:36px;width:64px;height:64px;background:#4585c5;border-radius:50%;opacity:0.5"></div>
        <div style="z-index:10;font-size:12px;display:flex;flex-direction:column;gap:3px;margin-left:90px">
          <div>+251 11 123 4567</div>
          <div>pharmacy@sutana.com</div>
          <div>www.sutana.com</div>
        </div>
        <div style="z-index:10;width:36px;height:36px;background:#60a5fa;border-radius:50%;margin-right:16px"></div>
      </div>
    </div>
  </div>

  <script>
    document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 900); });
  </script>
</body>
</html>`);
    w.document.close();
  };

  const pendingCount = requisitions.length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#1E293B' }}>Pharmacy Requisition Approvals</h2>
        {pendingCount > 0 && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{pendingCount} pending</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>

        {/* ── LEFT SIDEBAR: List of grouped requisitions ── */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '85vh', overflow: 'auto' }}>
          {requisitions.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No pending requisitions</div>
          ) : requisitions.map(grp => {
            const totalVal = (grp.items || []).reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.quantity_requested || 0)), 0);
            return (
              <div key={grp.req_no} onClick={() => loadDetail(grp)} style={{
                padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                background: selectedReqNo === grp.req_no ? '#F0FDF4' : 'white',
                borderLeft: selectedReqNo === grp.req_no ? '3px solid #059669' : '3px solid transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13, color: '#1E293B' }}>{grp.req_no}</strong>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>PENDING</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
                  {(grp.items || []).map(it => (
                    <span key={it.id} style={{ fontSize: 11, color: '#475569' }}>• {it.drug_name} × {it.quantity_requested}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  <span>{grp.requested_by_name}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{totalVal > 0 ? `${totalVal.toFixed(2)} ETB` : ''}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{new Date(grp.created_at).toLocaleDateString()}</div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Invoice-style approval paper ── */}
        {!detail ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94A3B8', fontSize: 13 }}>
            Select a requisition to review
          </div>
        ) : (() => {
          const allItems = detail.items || [detail];
          const grandTotal = allItems.reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.quantity_requested || 0)), 0);

          // Aggregate inventory stats
          const storeTotalValue = allItems.reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.current_store_stock || 0)), 0);
          const pharmTotalValue = allItems.reduce((sum, it) => sum + ((it.pharmacy_unit_price || it.store_unit_price || 0) * (it.current_pharmacy_stock || 0)), 0);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Inventory Sidebars (Horizontal top row) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Store Inventory */}
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #DBEAFE' }}>Store Inventory</div>
                  {allItems.map(it => (
                    <div key={it.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{it.drug_name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Available: <strong style={{ color: '#1E293B' }}>{it.current_store_stock || 0}</strong></div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Single Price: <strong style={{ color: '#1E293B' }}>{it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</strong></div>
                      <div style={{ fontSize: 11, color: '#065F46', fontWeight: 700 }}>Total Value: {it.store_unit_price ? `${((it.current_store_stock||0) * it.store_unit_price).toFixed(2)} ETB` : '—'}</div>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px solid #DBEAFE', paddingTop: 8, fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                    Grand: {storeTotalValue > 0 ? `${storeTotalValue.toFixed(2)} ETB` : '—'}
                  </div>
                </div>

                {/* Pharmacy Inventory */}
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9D174D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #FCE7F3' }}>Pharmacy Inventory</div>
                  {allItems.map(it => {
                    const reorder = it.reorder_level || 0;
                    const current = it.current_pharmacy_stock || 0;
                    const shortage = current < reorder ? reorder - current : 0;
                    const pharmPrice = it.pharmacy_unit_price || it.store_unit_price || 0;
                    return (
                      <div key={it.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{it.drug_name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Available: <strong style={{ color: '#1E293B' }}>{current}</strong></div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Single Price: <strong style={{ color: '#1E293B' }}>{pharmPrice > 0 ? `${pharmPrice} ETB` : '—'}</strong></div>
                        <div style={{ fontSize: 11, color: '#065F46', fontWeight: 700 }}>Total Value: {pharmPrice > 0 ? `${(current * pharmPrice).toFixed(2)} ETB` : '—'}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Reorder: <strong>{reorder}</strong></div>
                        {shortage > 0 && <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Shortage: -{shortage}</div>}
                      </div>
                    );
                  })}
                  <div style={{ borderTop: '2px solid #FCE7F3', paddingTop: 8, fontSize: 12, fontWeight: 800, color: '#9D174D' }}>
                    Grand: {pharmTotalValue > 0 ? `${pharmTotalValue.toFixed(2)} ETB` : '—'}
                  </div>
                </div>
              </div>

              {/* Model 21 Invoice Paper */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>

                {/* Header */}
                <div style={{ background: '#224f94', color: 'white', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 9 }}>SUTANA</div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>APPROVAL:</h2>
                      <p style={{ margin: 0, fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Model 21 - CEO Authorization</p>
                    </div>
                  </div>
                  <button onClick={handlePrint} title="Print Approval" style={{ zIndex: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 14px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                    <Printer size={15} /> Print
                  </button>
                  <div style={{ position: 'absolute', top: -40, right: -20, width: 180, height: 180, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.8 }}></div>
                  <div style={{ position: 'absolute', bottom: -10, right: 110, width: 70, height: 70, background: '#1c3d70', borderRadius: '12px' }}></div>
                  <div style={{ position: 'absolute', top: 16, right: 56, width: 16, height: 16, background: '#93c5fd', borderRadius: '50%' }}></div>
                </div>

                {/* Meta */}
                <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #224f94' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#224f94', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Requested By:</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{detail.requested_by_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>● Department: {detail.requesting_dept}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Req No: <strong style={{ color: '#1e293b' }}>{detail.req_no}</strong></div>
                    <div>Date: <strong style={{ color: '#1e293b' }}>{new Date(detail.created_at).toLocaleDateString()}</strong></div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ background: STATUS_BADGES[detail.status]?.bg || '#F1F5F9', color: STATUS_BADGES[detail.status]?.color || '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {detail.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Table */}
                <div style={{ padding: '24px 28px', flexGrow: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #224f94' }}>
                        <th style={th}>Product</th>
                        <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                        <th style={{ ...th, textAlign: 'center' }}>Single Price</th>
                        <th style={{ ...th, textAlign: 'center' }}>Total Price</th>
                        <th style={{ ...th, textAlign: 'right' }}>Approve Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allItems.map((it, i) => {
                        const lineTotal = it.store_unit_price ? it.quantity_requested * it.store_unit_price : 0;
                        return (
                          <tr key={it.id || i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#FAFBFF' }}>
                            <td style={{ ...td, fontWeight: 500 }}>{it.drug_name}</td>
                            <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{it.quantity_requested} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{it.unit_of_measure}</span></td>
                            <td style={{ ...td, textAlign: 'center', color: '#475569' }}>{it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</td>
                            <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{lineTotal > 0 ? `${lineTotal.toFixed(2)} ETB` : '—'}</td>
                            <td style={{ ...td, textAlign: 'right' }}>
                              {detail.status === 'PENDING' ? (
                                <input type="number" min="1" max={it.quantity_requested} value={approvedQtys[it.id] ?? it.quantity_requested}
                                  onChange={e => setApprovedQtys(prev => ({ ...prev, [it.id]: parseInt(e.target.value) || it.quantity_requested }))}
                                  style={{ width: 65, padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, textAlign: 'center', fontWeight: 600 }} />
                              ) : (
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{it.quantity_requested}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #224f94', background: '#EFF6FF' }}>
                        <td colSpan={3} style={{ ...td, fontWeight: 800, textTransform: 'uppercase', color: '#1E40AF', textAlign: 'right' }}>Total Value:</td>
                        <td style={{ ...td, textAlign: 'center', fontWeight: 800, color: '#224f94', fontSize: 15 }} colSpan={2}>
                          {grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Justification */}
                  {detail.justification && (
                    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', marginBottom: 16, borderLeft: '3px solid #224f94' }}>
                      <strong>Justification:</strong> {detail.justification}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
                    {detail.status === 'PENDING' ? (
                      <>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => setShowReject(!showReject)} style={{ padding: '10px 24px', background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                            <X size={14} style={{ display: 'inline', marginRight: 4 }} /> REJECT
                          </button>
                          <button onClick={handleApprove} disabled={actionLoading} style={{ padding: '10px 24px', background: '#224f94', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={14} /> {actionLoading ? 'Processing...' : 'APPROVE & STAMP'}
                          </button>
                        </div>
                        {showReject && (
                          <div style={{ background: '#FEF2F2', padding: 14, borderRadius: 8, border: '1px solid #FECACA', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <textarea placeholder="Rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                              style={{ width: '100%', padding: '8px', border: '1px solid #FCA5A5', borderRadius: 4, fontSize: 12, resize: 'vertical' }} />
                            <button onClick={handleReject} disabled={actionLoading}
                              style={{ padding: '8px 18px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Confirm Reject
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>General Manager / CEO</span>
                        {detail.status === 'APPROVED' && detail.approval && (
                          <CEOStampSignature
                            stamp={{ stamp_id: detail.approval?.stamp_id, approved_by_name: detail.approval?.approved_by_name, role: 'CEO', timestamp: detail.approval?.approved_at, document_id: detail.approval?.id }}
                            signerName={detail.approval?.approved_by_name}
                          />
                        )}
                        {detail.status === 'REJECTED' && detail.rejection_reason && (
                          <div style={{ color: '#DC2626', fontSize: 13, maxWidth: 300, textAlign: 'right' }}>
                            <strong>Rejected:</strong> {detail.rejection_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#224f94', color: 'white', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -10, left: -10, width: 90, height: 90, background: '#1c3d70', borderRadius: '0 36px 0 0', display: 'flex', flexWrap: 'wrap', padding: 14, gap: 5 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ width: 7, height: 7, background: '#4585c5', borderRadius: '50%' }}></div>)}
                  </div>
                  <div style={{ position: 'absolute', bottom: -16, left: 36, width: 64, height: 64, background: '#4585c5', borderRadius: '50%', opacity: 0.5 }}></div>
                  <div style={{ zIndex: 10, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 90 }}>
                    <div>+251 11 123 4567</div>
                    <div>pharmacy@sutana.com</div>
                    <div>www.sutana.com</div>
                  </div>
                  <div style={{ zIndex: 10, width: 36, height: 36, background: '#60a5fa', borderRadius: '50%', marginRight: 16 }}></div>
                </div>

              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const th = { padding: '0 0 14px 0', fontSize: 11, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '16px 0', fontSize: 13, color: '#475569' };

export default PharmacyApprovals;
