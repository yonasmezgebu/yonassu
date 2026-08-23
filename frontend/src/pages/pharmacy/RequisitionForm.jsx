import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import CEOStampSignature from '../../components/CEOStampSignature';
import { FileText, Package, AlertTriangle, Printer, ArrowLeft, Plus, Trash2 } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  APPROVED: { bg: '#DBEAFE', color: '#1E40AF', text: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
  CANCELLED: { bg: '#F1F5F9', color: '#475569', text: 'Cancelled' },
};

const EMPTY_ROW = { drugId: '', quantityRequested: '', unitOfMeasure: 'Tablets' };

const RequisitionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const printRef = useRef(null);
  const [tab, setTab] = useState(id ? 'detail' : 'create');
  const [products, setProducts] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [selected, setSelected] = useState(null);
  // Multi-product form: array of item rows
  const [items, setItems] = useState([{ ...EMPTY_ROW }]);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadRequisitions();
    if (id) loadRequisition(parseInt(id));
  }, [id]);

  const loadProducts = async () => {
    try { const res = await apiClient.get('/pharmacy/products'); if (res.status === 'success') setProducts(res.data || []); } catch (e) { console.error(e); }
  };

  const loadRequisitions = async () => {
    try { const res = await apiClient.get('/erp/requisitions'); if (res.status === 'success') setRequisitions(res.data || []); } catch (e) { console.error(e); }
  };

  const loadRequisition = async (reqId) => {
    try { const res = await apiClient.get(`/erp/requisitions/${reqId}`); if (res.status === 'success') setSelected(res.data); } catch (e) { console.error(e); }
  };

  // --- Multi-row form helpers ---
  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: value };
      if (field === 'drugId') {
        const p = products.find(x => x.id === parseInt(value));
        updated.unitOfMeasure = p?.unit_of_measure || 'Tablets';
      }
      return updated;
    }));
  };

  const addRow = () => setItems(prev => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const getProductInfo = (drugId) => products.find(x => x.id === parseInt(drugId));

  const rowTotal = (row) => {
    const p = getProductInfo(row.drugId);
    const price = p?.price || 0;
    const qty = parseFloat(row.quantityRequested) || 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, row) => sum + rowTotal(row), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = items.filter(row => row.drugId && row.quantityRequested);
    if (validItems.length === 0) { showToast('Please add at least one drug item with quantity', 'warning'); return; }
    setLoading(true);
    try {
      const payload = {
        items: validItems.map(row => ({
          drugId: parseInt(row.drugId),
          quantityRequested: parseInt(row.quantityRequested),
          unitOfMeasure: row.unitOfMeasure,
        })),
        justification,
      };
      const res = await apiClient.post('/erp/requisitions', payload);
      if (res.status === 'success') {
        showToast(`Requisition ${res.data.req_no} created — ${res.data.item_count} items sent to CEO`, 'success');
        setItems([{ ...EMPTY_ROW }]);
        setJustification('');
        setTab('list');
        loadRequisitions();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Failed to create requisition', 'error'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w || !selected) return;
    const allItems = selected.items || [selected];
    const printTotal = allItems.reduce((sum, item) => sum + (item.store_unit_price ? item.quantity_requested * item.store_unit_price : 0), 0);
    const itemRows = allItems.map((item, i) => {
      const lineTotal = item.store_unit_price ? (item.quantity_requested * item.store_unit_price).toFixed(2) : null;
      return `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}" style="border-bottom:1px solid #e2e8f0">
        <td class="py-4 px-3 font-medium text-gray-700">${item.drug_name}</td>
        <td class="py-4 px-3 text-center font-bold text-blue-900">${item.quantity_requested} <span class="text-xs font-normal text-gray-400">${item.unit_of_measure || 'Units'}</span></td>
        <td class="py-4 px-3 text-center text-gray-500">${item.store_unit_price ? `${item.store_unit_price} ETB` : '—'}</td>
        <td class="py-4 px-3 text-right font-bold text-gray-900">${lineTotal ? `${lineTotal} ETB` : '—'}</td>
      </tr>`;
    }).join('');

    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <title>Model 20 Requisition - ${selected.req_no}</title>
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
          <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase">REQUISITION:</h1>
          <p style="margin:0;font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:1px">Model 20 - Internal Request</p>
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
        <div style="font-size:18px;font-weight:600;color:#1e293b">${selected.requested_by_name}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px">● Department: ${selected.requesting_dept || 'Pharmacy'}</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#475569;display:flex;flex-direction:column;gap:4px">
        <div>Req No: <strong style="color:#1e293b">${selected.req_no}</strong></div>
        <div>Date: <strong style="color:#1e293b">${new Date(selected.created_at).toLocaleDateString()}</strong></div>
        <div style="margin-top:4px">
          <span style="background:${selected.status === 'APPROVED' ? '#dbeafe' : selected.status === 'REJECTED' ? '#fee2e2' : '#FEF3C7'};color:${selected.status === 'APPROVED' ? '#1e40af' : selected.status === 'REJECTED' ? '#991b1b' : '#92400E'};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">${selected.status}</span>
        </div>
      </div>
    </div>

    <!-- Product Table -->
    <div style="padding:24px 28px;flex:1">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="border-bottom:2px solid #224f94">
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase">Product</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Qty</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Cost Price</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:right">Total Cost</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #224f94;background:#eff6ff">
            <td colspan="3" style="padding:14px 0;font-weight:800;text-transform:uppercase;color:#1e40af;text-align:right;font-size:13px">Total Value:</td>
            <td style="padding:14px 0;text-align:right;font-weight:800;color:#224f94;font-size:16px;padding-right:4px">${printTotal > 0 ? `${printTotal.toFixed(2)} ETB` : '—'}</td>
          </tr>
        </tfoot>
      </table>

      ${selected.justification ? `<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;font-size:12px;color:#475569;margin-bottom:16px;border-left:3px solid #224f94"><strong>Justification:</strong> ${selected.justification}</div>` : ''}

      <!-- Signature -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;padding-top:16px">
        <div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px">Requested by</div>
          <div style="font-family:'Caveat',cursive;font-size:36px;color:#1e40af;transform:rotate(-3deg);display:inline-block;line-height:1">${selected.requested_by_name}</div>
          <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:4px"></div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${selected.requested_by_name} — Pharmacy</div>
        </div>
        ${selected.approval && selected.approval.decision === 'APPROVED' ? `
        <div style="border:4px solid #059669;border-radius:8px;padding:12px 20px;transform:rotate(-6deg);text-align:center;display:inline-flex;flex-direction:column;gap:2px">
          <span style="font-size:14px;font-weight:900;color:#059669;letter-spacing:2px">APPROVED</span>
          <span style="font-size:10px;color:#64748b">${selected.approval.approved_by_name}</span>
          <span style="font-size:10px;color:#64748b">${new Date(selected.approval.approved_at).toLocaleDateString()}</span>
        </div>` : ''}
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

  <script>
    document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 900); });
  </script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');`}</style>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setTab('list')} style={tabBtn(tab === 'list')}><FileText size={16} /> My Requisitions</button>
        <button onClick={() => setTab('create')} style={tabBtn(tab === 'create')}><Package size={16} /> New Requisition (Model 20)</button>
      </div>

      {/* ── CREATE TAB ── */}
      {tab === 'create' && (
        <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', maxWidth: 900 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1E293B' }}>Model 20 — Requisition Form</h2>
          <p style={{ margin: '0 0 1.25rem', fontSize: 12, color: '#64748B' }}>Add multiple drugs to a single requisition paper and send to CEO for approval</p>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Department</label>
                <input value="Pharmacy" disabled style={inputStyle(true)} />
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input value={new Date().toLocaleDateString()} disabled style={inputStyle(true)} />
              </div>
            </div>

            {/* Product rows table */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Drug Items *</label>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ ...thStyle, width: '40%' }}>Drug / Product</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Unit</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Cost Price</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total Cost</th>
                      <th style={{ ...thStyle, width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => {
                      const p = getProductInfo(row.drugId);
                      const price = p?.price || 0;
                      const qty = parseFloat(row.quantityRequested) || 0;
                      const total = qty * price;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <select value={row.drugId} onChange={e => updateItem(idx, 'drugId', e.target.value)} style={{ ...inputStyle(), fontSize: 12, padding: '8px 10px' }}>
                              <option value="">Select a drug...</option>
                              {products.map(pr => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name} (Stock: {pr.stock_quantity || 0})
                                </option>
                              ))}
                            </select>
                            {p && (
                              <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                                <span>Stock: <strong style={{ color: (p.stock_quantity||0) <= (p.reorder_level||p.minimum_stock||0) ? '#EF4444' : '#059669' }}>{p.stock_quantity||0}</strong></span>
                                <span>Reorder: <strong>{p.reorder_level||p.minimum_stock||0}</strong></span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input type="number" min="1" value={row.quantityRequested} onChange={e => updateItem(idx, 'quantityRequested', e.target.value)}
                              style={{ ...inputStyle(), width: 70, textAlign: 'center', padding: '8px' }} placeholder="0" />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <select value={row.unitOfMeasure} onChange={e => updateItem(idx, 'unitOfMeasure', e.target.value)} style={{ ...inputStyle(), padding: '8px', fontSize: 12 }}>
                              <option>Tablets</option><option>Vials</option><option>Bottles</option><option>Capsules</option><option>Syringes</option><option>Packs</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
                            {price > 0 ? `${price} ETB` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>
                            {total > 0 ? `${total.toFixed(2)} ETB` : '—'}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeRow(idx)}
                                style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F0FDF4', borderTop: '2px solid #E2E8F0' }}>
                      <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 700, color: '#065F46', fontSize: 13, textAlign: 'right' }}>
                        TOTAL VALUE:
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: 15 }}>
                        {grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button type="button" onClick={addRow}
                style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#EFF6FF', color: '#1D4ED8', border: '1px dashed #93C5FD', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <Plus size={14} /> Add Another Product
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Reason / Justification</label>
              <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3}
                style={{ ...inputStyle(), resize: 'vertical', width: '100%' }} placeholder="Explain why this stock transfer is needed..." />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" disabled={loading}
                style={{ padding: '12px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Submitting...' : `Submit Requisition (${items.filter(r => r.drugId).length} item${items.filter(r => r.drugId).length !== 1 ? 's' : ''})`}
              </button>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Digital signature will be auto-applied</span>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST TAB ── */}
      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B' }}>My Requisitions</h3>
              <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{requisitions.length} papers</span>
            </div>
          </div>
          {requisitions.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No requisitions yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>Req #</th><th style={thStyle}>Items</th><th style={thStyle}>Status</th><th style={thStyle}>Date</th><th style={thStyle}></th>
              </tr></thead>
              <tbody>{requisitions.map(grp => {
                const badge = STATUS_BADGES[grp.status] || {};
                const totalVal = (grp.items || []).reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.quantity_requested || 0)), 0);
                return (
                  <tr key={grp.req_no} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}><strong>{grp.req_no}</strong></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(grp.items || []).map(it => {
                          const sp = it.store_unit_price || it.pharmacy_unit_price || 0;
                          const lt = sp > 0 ? (it.quantity_requested * sp).toFixed(2) : null;
                          return (
                            <span key={it.id} style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 12 }}>
                              <span>• {it.drug_name} × {it.quantity_requested} {it.unit_of_measure}</span>
                              {sp > 0 && <span style={{ color: '#64748B' }}>@{sp} ETB</span>}
                              {lt && <span style={{ color: '#059669', fontWeight: 600 }}>= {lt} ETB</span>}
                            </span>
                          );
                        })}
                        {totalVal > 0 && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>Total: {totalVal.toFixed(2)} ETB</span>}
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{badge.text}</span></td>
                    <td style={tdStyle}>{new Date(grp.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => { loadRequisition(grp.id); setTab('detail'); }} style={actionBtn}>View</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {/* ── DETAIL TAB ── */}
      {tab === 'detail' && selected && (() => {
        const allItems = selected.items || [selected];
        const grandTotalDisplay = allItems.reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.quantity_requested || 0)), 0);
        // Aggregate store & pharmacy inventory stats
        const storeAvailable = allItems.reduce((sum, it) => sum + (it.current_store_stock || 0), 0);
        const storeTotalValue = allItems.reduce((sum, it) => sum + ((it.store_unit_price || 0) * (it.current_store_stock || 0)), 0);
        const pharmAvailable = allItems.reduce((sum, it) => sum + (it.current_pharmacy_stock || 0), 0);
        const pharmTotalValue = allItems.reduce((sum, it) => sum + ((it.pharmacy_unit_price || it.store_unit_price || 0) * (it.current_pharmacy_stock || 0)), 0);

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Inventory sidebars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Store Inventory */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Inventory</h4>
                {allItems.map(it => (
                  <div key={it.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{it.drug_name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Available: <strong style={{ color: '#1E293B' }}>{it.current_store_stock || 0}</strong></div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Cost Price: <strong style={{ color: '#1E293B' }}>{it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</strong></div>
                    <div style={{ fontSize: 12, color: '#064E3B', fontWeight: 700 }}>Total Cost Value: <strong>{it.store_unit_price ? `${((it.current_store_stock||0) * it.store_unit_price).toFixed(2)} ETB` : '—'}</strong></div>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid #DBEAFE', paddingTop: 8, marginTop: 4, fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
                  Grand Store Value: {storeTotalValue > 0 ? `${storeTotalValue.toFixed(2)} ETB` : '—'}
                </div>
              </div>
              {/* Pharmacy Inventory */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#9D174D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacy Inventory</h4>
                {allItems.map(it => {
                  const reorder = it.reorder_level || 0;
                  const current = it.current_pharmacy_stock || 0;
                  const shortage = current < reorder ? reorder - current : 0;
                  const pharmPrice = it.pharmacy_unit_price || it.store_unit_price || 0;
                  return (
                    <div key={it.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{it.drug_name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Available: <strong style={{ color: '#1E293B' }}>{current}</strong></div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Cost Price: <strong style={{ color: '#1E293B' }}>{pharmPrice > 0 ? `${pharmPrice} ETB` : '—'}</strong></div>
                      <div style={{ fontSize: 12, color: '#064E3B', fontWeight: 700 }}>Total Cost Value: <strong>{pharmPrice > 0 ? `${(current * pharmPrice).toFixed(2)} ETB` : '—'}</strong></div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Reorder: <strong>{reorder}</strong></div>
                      {shortage > 0 && <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>Shortage: -{shortage}</div>}
                    </div>
                  );
                })}
                <div style={{ borderTop: '2px solid #FCE7F3', paddingTop: 8, marginTop: 4, fontSize: 13, fontWeight: 800, color: '#9D174D' }}>
                  Grand Pharmacy Value: {pharmTotalValue > 0 ? `${pharmTotalValue.toFixed(2)} ETB` : '—'}
                </div>
              </div>
            </div>

            {/* Main Paper — Model 20 styled like CEO approval page */}
            <div ref={printRef} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
              <button onClick={() => setTab('list')} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12, zIndex: 20 }}><ArrowLeft size={14} /> Back</button>
              {/* Blue Header */}
              <div style={{ background: '#224f94', color: 'white', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 9 }}>SUTANA</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>REQUISITION:</h2>
                    <p style={{ margin: 0, fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Model 20 - Internal Request</p>
                  </div>
                </div>
                <button onClick={handlePrint} title="Print" style={{ zIndex: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 14px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
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
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{selected.requested_by_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>● Department: {selected.requesting_dept}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Req No: <strong style={{ color: '#1e293b' }}>{selected.req_no}</strong></div>
                  <div>Date: <strong style={{ color: '#1e293b' }}>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ background: STATUS_BADGES[selected.status]?.bg || '#F1F5F9', color: STATUS_BADGES[selected.status]?.color || '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div style={{ padding: '24px 28px', flexGrow: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #224f94' }}>
                      <th style={{ ...thStyle, textTransform: 'uppercase' }}>Product</th>
                      <th style={{ ...thStyle, textAlign: 'center', textTransform: 'uppercase' }}>Qty</th>
                      <th style={{ ...thStyle, textAlign: 'center', textTransform: 'uppercase' }}>Cost Price</th>
                      <th style={{ ...thStyle, textAlign: 'right', textTransform: 'uppercase' }}>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((it, i) => {
                      const lineTotal = it.store_unit_price ? it.quantity_requested * it.store_unit_price : 0;
                      return (
                        <tr key={it.id || i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#FAFBFF' }}>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{it.drug_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{it.quantity_requested} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{it.unit_of_measure}</span></td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#475569' }}>{it.store_unit_price ? `${it.store_unit_price} ETB` : '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{lineTotal > 0 ? `${lineTotal.toFixed(2)} ETB` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #224f94', background: '#EFF6FF' }}>
                      <td colSpan={3} style={{ ...tdStyle, fontWeight: 800, textTransform: 'uppercase', color: '#1E40AF', textAlign: 'right' }}>Total Value:</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#224f94', fontSize: 15 }}>
                        {grandTotalDisplay > 0 ? `${grandTotalDisplay.toFixed(2)} ETB` : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Justification */}
                {selected.justification && (
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', marginBottom: 16, borderLeft: '3px solid #224f94' }}>
                    <strong>Justification:</strong> {selected.justification}
                  </div>
                )}

                {/* Stamp */}
                {selected.approval && selected.approval.decision === 'APPROVED' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <CEOStampSignature stamp={{ stamp_id: selected.approval.stamp_id, approved_by_name: selected.approval.approved_by_name, role: 'CEO', timestamp: selected.approval.approved_at, document_id: selected.approval.id }} signerName={selected.approval.approved_by_name} />
                  </div>
                )}

                {/* Signature */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Requested by</div>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: '#1e40af', transform: 'rotate(-3deg)', display: 'inline-block', lineHeight: 1 }}>
                      {selected.requested_by_name}
                    </div>
                    <div style={{ width: 180, borderBottom: '1px solid #94a3b8', marginTop: 4 }}></div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{selected.requested_by_name} — Pharmacy</div>
                  </div>
                </div>
              </div>

              {/* Blue Footer */}
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
  );
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = (disabled) => ({ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: disabled ? '#F8FAFC' : 'white', boxSizing: 'border-box' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const actionBtn = { padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#475569' };
const tabBtn = (active) => ({ padding: '10px 20px', borderRadius: 8, border: active ? '2px solid #059669' : '1px solid #E2E8F0', background: active ? '#ECFDF5' : 'white', color: active ? '#065F46' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 });

export default RequisitionForm;
