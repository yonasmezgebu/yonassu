import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { FileText, Package, Printer, ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react';

const STATUS_BADGES = {
  DRAFT: { bg: '#F1F5F9', color: '#475569', text: 'Draft' },
  PENDING_CEO_REVIEW: { bg: '#FEF3C7', color: '#92400E', text: 'Pending CEO Review' },
  CEO_APPROVED: { bg: '#DBEAFE', color: '#1E40AF', text: 'CEO Approved' },
  CEO_REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'CEO Rejected' },
  CEO_WAITING: { bg: '#FEF3C7', color: '#D97706', text: '⏳ CEO Wait' },
  IN_MARKET: { bg: '#E0E7FF', color: '#3730A3', text: 'In Market' },
  TENDER_CREATED: { bg: '#F3E8FF', color: '#6B21A8', text: 'Tender Created' },
  AWAITING_DECISION: { bg: '#FEF3C7', color: '#D97706', text: 'Awaiting Decision' },
  FUND_REQUESTED: { bg: '#FCE7F3', color: '#9D174D', text: 'Fund Requested' },
  FUND_APPROVED: { bg: '#D1FAE5', color: '#065F46', text: 'Fund Approved' },
  PAYMENT_MADE: { bg: '#E0F2FE', color: '#075985', text: 'Payment Made' },
  SHIPPED: { bg: '#E0E7FF', color: '#3730A3', text: 'Shipped' },
  RECEIVED: { bg: '#D1FAE5', color: '#065F46', text: 'Received' },
  CANCELLED: { bg: '#F1F5F9', color: '#475569', text: 'Cancelled' },
};

const EMPTY_ROW = { drugName: '', quantityRequested: '', unitOfMeasure: 'Each', estimatedUnitPrice: '' };

const ProcurementRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState(id ? 'detail' : 'create');
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([{ ...EMPTY_ROW }]);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [requestType, setRequestType] = useState('EXISTING_DRUG');
  const [drugCategory, setDrugCategory] = useState('');
  const [drugClassification, setDrugClassification] = useState('');
  const [therapeuticUse, setTherapeuticUse] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadRequests();
    if (id) loadRequest(parseInt(id));
  }, [id]);

  const loadProducts = async () => {
    try { const res = await apiClient.get('/pharmacy/products'); if (res.status === 'success') setProducts(res.data || []); } catch (e) { console.error(e); }
  };

  const loadRequests = async () => {
    try { const res = await apiClient.get('/procurement/requests'); if (res.status === 'success') setRequests(res.data || []); } catch (e) { console.error(e); }
  };

  const loadRequest = async (reqId) => {
    try { const res = await apiClient.get(`/procurement/requests/${reqId}`); if (res.status === 'success') setSelected(res.data); } catch (e) { console.error(e); }
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: value };
      if (field === 'drugName') {
        const p = products.find(x => x.name === value || x.id === parseInt(value));
        updated.unitOfMeasure = p?.unit || 'Each';
        updated.estimatedUnitPrice = p?.selling_price || '';
      }
      return updated;
    }));
  };

  const addRow = () => setItems(prev => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const rowTotal = (row) => {
    const qty = parseFloat(row.quantityRequested) || 0;
    const price = parseFloat(row.estimatedUnitPrice) || 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, row) => sum + rowTotal(row), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = items.filter(row => row.drugName && row.quantityRequested);
    if (validItems.length === 0) { showToast('Add at least one item with quantity', 'warning'); return; }
    setLoading(true);
    try {
      if (requestType === 'NEW_DRUG') {
        if (!drugCategory || !drugClassification || !therapeuticUse || !requestReason) {
          showToast('All new drug fields are required', 'warning'); setLoading(false); return;
        }
        await apiClient.post('/procurement/requests', {
          drugName: items[0]?.drugName,
          quantityRequested: parseInt(items[0]?.quantityRequested) || 0,
          unitOfMeasure: items[0]?.unitOfMeasure || 'Each',
          estimatedUnitPrice: parseFloat(items[0]?.estimatedUnitPrice) || 0,
          justification, urgency,
          requestType: 'NEW_DRUG',
          drugCategory, drugClassification, therapeuticUse, requestReason,
        });
      } else {
        for (const row of validItems) {
          await apiClient.post('/procurement/requests', {
            drugName: row.drugName,
            quantityRequested: parseInt(row.quantityRequested),
            unitOfMeasure: row.unitOfMeasure,
            estimatedUnitPrice: parseFloat(row.estimatedUnitPrice) || 0,
            justification, urgency,
          });
        }
      }
      showToast(`Procurement request created — sent to CEO for review`, 'success');
      playSound('info');
      setItems([{ ...EMPTY_ROW }]);
      setJustification('');
      setUrgency('MEDIUM');
      setRequestType('EXISTING_DRUG');
      setDrugCategory(''); setDrugClassification(''); setTherapeuticUse(''); setRequestReason('');
      setTab('list');
      loadRequests();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to create request', 'error'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w || !selected) return;
    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <title>Procurement Request - ${selected.pr_no}</title>
  <style>
    body { font-family: 'Inter', sans-serif; }
    @media print { @page { margin: 0; size: A4; } body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-100 p-8">
  <div class="no-print mb-4 flex justify-end">
    <button onclick="window.print()" style="padding:10px 20px;background:#224f94;color:white;border:none;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer"> Print / Save PDF</button>
  </div>
  <div class="max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden flex flex-col" style="min-height:90vh">
    <div style="background:#224f94;color:white;padding:28px 32px;display:flex;justify-content:space-between;position:relative;overflow:hidden">
      <div style="z-index:10;display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;background:white;border-radius:50% 50% 50% 0;display:flex;align-items:center;justify-content:center;color:#224f94;font-weight:800;font-size:9px">SUTANA</div>
        <div>
          <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase">PROCUREMENT:</h1>
          <p style="margin:0;font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:1px">Purchase Request - Pharmacy</p>
        </div>
      </div>
      <div style="position:absolute;top:-40px;right:-20px;width:180px;height:180px;background:#4585c5;border-radius:40% 60% 70% 30%;opacity:0.8"></div>
      <div style="position:absolute;bottom:-10px;right:110px;width:70px;height:70px;background:#1c3d70;border-radius:12px"></div>
      <div style="position:absolute;top:16px;right:56px;width:16px;height:16px;background:#93c5fd;border-radius:50%"></div>
    </div>
    <div style="padding:20px 28px;display:flex;justify-content:space-between;border-bottom:2px solid #224f94">
      <div>
        <div style="font-size:10px;font-weight:800;color:#224f94;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Requested By:</div>
        <div style="font-size:18px;font-weight:600;color:#1e293b">${selected.requested_by_name}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px">● Department: Pharmacy</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#475569;display:flex;flex-direction:column;gap:4px">
        <div>PR No: <strong style="color:#1e293b">${selected.pr_no}</strong></div>
        <div>Date: <strong style="color:#1e293b">${new Date(selected.created_at).toLocaleDateString()}</strong></div>
        <div>Urgency: <strong style="color:#1e293b">${selected.urgency}</strong></div>
        <div style="margin-top:4px">
          <span style="background:${STATUS_BADGES[selected.status]?.bg || '#F1F5F9'};color:${STATUS_BADGES[selected.status]?.color || '#475569'};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">${STATUS_BADGES[selected.status]?.text || selected.status}</span>
        </div>
      </div>
    </div>
    <div style="padding:24px 28px;flex:1">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="border-bottom:2px solid #224f94">
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase">Item</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Qty</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:center">Unit Price</th>
            <th style="padding:0 0 14px 0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e2e8f0;background:white">
            <td style="padding:12px 14px;color:#1E293B;font-weight:500">${selected.drug_name}</td>
            <td style="padding:12px 14px;color:#1E293B;text-align:center;font-weight:600">${selected.quantity_requested} <span style="font-size:11px;color:#64748b;font-weight:400">${selected.unit_of_measure}</span></td>
            <td style="padding:12px 14px;color:#1E293B;text-align:center">${selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
            <td style="padding:12px 14px;color:#1E293B;text-align:right;font-weight:700">${selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid #224f94;background:#eff6ff">
            <td colspan="3" style="padding:14px 0;font-weight:800;text-transform:uppercase;color:#1e40af;text-align:right;font-size:13px">Estimated Total:</td>
            <td style="padding:14px 0;text-align:right;font-weight:800;color:#224f94;font-size:16px;padding-right:4px">${selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
          </tr>
        </tfoot>
      </table>
      ${selected.justification ? `<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;font-size:12px;color:#475569;margin-bottom:16px;border-left:3px solid #224f94"><strong>Justification:</strong> ${selected.justification}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;padding-top:16px">
        <div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px">Requested by</div>
          <div style="font-family:'Caveat',cursive;font-size:36px;color:#1e40af;transform:rotate(-3deg);display:inline-block;line-height:1">${selected.requested_by_name}</div>
          <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:4px"></div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${selected.requested_by_name} — Pharmacy</div>
        </div>
        ${selected.ceo_decision === 'APPROVED' ? `
        <div style="border:4px solid #059669;border-radius:8px;padding:12px 20px;transform:rotate(-6deg);text-align:center;display:inline-flex;flex-direction:column;gap:2px">
          <span style="font-size:14px;font-weight:900;color:#059669;letter-spacing:2px">CEO APPROVED</span>
        </div>` : selected.ceo_decision === 'REJECTED' ? `
        <div style="border:4px solid #EF4444;border-radius:8px;padding:12px 20px;transform:rotate(-6deg);text-align:center;display:inline-flex;flex-direction:column;gap:2px">
          <span style="font-size:14px;font-weight:900;color:#EF4444;letter-spacing:2px">CEO REJECTED</span>
        </div>` : ''}
      </div>
    </div>
    <div style="background:#224f94;color:white;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-10px;left:-10px;width:90px;height:90px;background:#1c3d70;border-radius:0 36px 0 0;padding:14px;display:flex;flex-wrap:wrap;gap:5px">
        ${[0,1,2,3].map(() => '<div style="width:7px;height:7px;background:#4585c5;border-radius:50%"></div>').join('')}
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
  <script>document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 900); });</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');`}</style>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setTab('list')} style={tabBtn(tab === 'list')}><FileText size={16} /> My Requests</button>
        <button onClick={() => setTab('create')} style={tabBtn(tab === 'create')}><Package size={16} /> New Procurement Request</button>
      </div>

      {tab === 'create' && (
        <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', maxWidth: 900 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1E293B' }}>Procurement Request Form</h2>
          <p style={{ margin: '0 0 1.25rem', fontSize: 12, color: '#64748B' }}>Request drugs/items for purchase — will be reviewed by CEO</p>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Request Type *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setRequestType('EXISTING_DRUG')}
                  style={{ padding: '10px 20px', borderRadius: 8, border: requestType === 'EXISTING_DRUG' ? '2px solid #224f94' : '1px solid #D1D5DB', background: requestType === 'EXISTING_DRUG' ? '#EFF6FF' : 'white', color: requestType === 'EXISTING_DRUG' ? '#224f94' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  🏭 Existing Drug (Stocked)
                </button>
                <button type="button" onClick={() => setRequestType('NEW_DRUG')}
                  style={{ padding: '10px 20px', borderRadius: 8, border: requestType === 'NEW_DRUG' ? '2px solid #059669' : '1px solid #D1D5DB', background: requestType === 'NEW_DRUG' ? '#ECFDF5' : 'white', color: requestType === 'NEW_DRUG' ? '#059669' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  🆕 New Drug (Not Available)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Department</label>
                <input value="Pharmacy" disabled style={inputStyle(true)} />
              </div>
              <div>
                <label style={labelStyle}>Urgency Level</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} style={inputStyle()}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {requestType === 'EXISTING_DRUG' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Items *</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ ...thStyle, width: '35%' }}>Drug / Item</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Unit</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Est. Unit Price</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                        <th style={{ ...thStyle, width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => {
                        const total = rowTotal(row);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <input value={row.drugName} onChange={e => updateItem(idx, 'drugName', e.target.value)}
                                style={{ ...inputStyle(), fontSize: 12, padding: '8px 10px' }} placeholder="Enter drug/item name" list="product-list" />
                              <datalist id="product-list">
                                {products.map(p => <option key={p.id} value={p.name} />)}
                              </datalist>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input type="number" min="1" value={row.quantityRequested} onChange={e => updateItem(idx, 'quantityRequested', e.target.value)}
                                style={{ ...inputStyle(), width: 70, textAlign: 'center', padding: '8px' }} placeholder="0" />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <select value={row.unitOfMeasure} onChange={e => updateItem(idx, 'unitOfMeasure', e.target.value)} style={{ ...inputStyle(), padding: '8px', fontSize: 12 }}>
                                <option>Each</option><option>Box</option><option>Pack</option><option>Bottle</option><option>Vial</option><option>Carton</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input type="number" min="0" step="0.01" value={row.estimatedUnitPrice} onChange={e => updateItem(idx, 'estimatedUnitPrice', e.target.value)}
                                style={{ ...inputStyle(), width: 100, textAlign: 'center', padding: '8px' }} placeholder="0.00" />
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
                        <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 700, color: '#065F46', fontSize: 13, textAlign: 'right' }}>ESTIMATED TOTAL:</td>
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
                  <Plus size={14} /> Add Another Item
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 16, background: '#F0FDF4', borderRadius: 8, padding: 16, border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>🆕</span>
                  <strong style={{ fontSize: 14, color: '#065F46' }}>New Drug Request</strong>
                  <span style={{ fontSize: 11, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 4 }}>Single Item</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Drug Name *</label>
                    <input value={items[0]?.drugName || ''} onChange={e => updateItem(0, 'drugName', e.target.value)}
                      style={inputStyle()} placeholder="e.g. Ciprofloxacin 500mg" />
                  </div>
                  <div>
                    <label style={labelStyle}>Quantity Requested *</label>
                    <input type="number" min="1" value={items[0]?.quantityRequested || ''} onChange={e => updateItem(0, 'quantityRequested', e.target.value)}
                      style={inputStyle()} placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>Unit of Measure</label>
                    <select value={items[0]?.unitOfMeasure || 'Each'} onChange={e => updateItem(0, 'unitOfMeasure', e.target.value)} style={inputStyle()}>
                      <option>Each</option><option>Box</option><option>Pack</option><option>Bottle</option><option>Vial</option><option>Carton</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Estimated Unit Price (ETB)</label>
                    <input type="number" min="0" step="0.01" value={items[0]?.estimatedUnitPrice || ''} onChange={e => updateItem(0, 'estimatedUnitPrice', e.target.value)}
                      style={inputStyle()} placeholder="0.00" />
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #A7F3D0', paddingTop: 12, marginTop: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Drug Category *</label>
                      <select value={drugCategory} onChange={e => setDrugCategory(e.target.value)} style={inputStyle()}>
                        <option value="">— Select —</option>
                        <option value="ANTIBIOTIC">Antibiotic</option>
                        <option value="ANALGESIC">Analgesic</option>
                        <option value="ANTIMALARIAL">Antimalarial</option>
                        <option value="ANTIHYPERTENSIVE">Antihypertensive</option>
                        <option value="ANTIDIABETIC">Antidiabetic</option>
                        <option value="VACCINE">Vaccine</option>
                        <option value="VITAMIN">Vitamin</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Drug Classification *</label>
                      <select value={drugClassification} onChange={e => setDrugClassification(e.target.value)} style={inputStyle()}>
                        <option value="">— Select —</option>
                        <option value="OTC">Over the Counter (OTC)</option>
                        <option value="PRESCRIPTION">Prescription Only</option>
                        <option value="CONTROLLED">Controlled Substance</option>
                        <option value="NARCOTIC">Narcotic</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Therapeutic Use *</label>
                    <textarea value={therapeuticUse} onChange={e => setTherapeuticUse(e.target.value)} rows={2}
                      style={{ ...inputStyle(), resize: 'vertical' }} placeholder="e.g. Treatment of bacterial infections" />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Reason for Request *</label>
                    <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={2}
                      style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Why is this new drug needed?" />
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#065F46', marginTop: 8 }}>
                  Est. Total: {items[0] ? ((parseFloat(items[0].estimatedUnitPrice) || 0) * (parseInt(items[0].quantityRequested) || 0)).toFixed(2) : '0.00'} ETB
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Justification</label>
              <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3}
                style={{ ...inputStyle(), resize: 'vertical', width: '100%' }} placeholder="Explain why this purchase is needed..." />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" disabled={loading}
                style={{ padding: '12px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Submitting...' : requestType === 'NEW_DRUG' ? '🆕 Submit New Drug Request for CEO Review' : `Submit for CEO Review (${items.filter(r => r.drugName).length} item${items.filter(r => r.drugName).length !== 1 ? 's' : ''})`}
              </button>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Status will be PENDING_CEO_REVIEW</span>
            </div>
          </form>
        </div>
      )}

      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B' }}>My Procurement Requests</h3>
              <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{requests.length} requests</span>
            </div>
          </div>
          {requests.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No procurement requests yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>PR #</th><th style={thStyle}>Item</th><th style={thStyle}>Urgency</th><th style={thStyle}>Status</th><th style={thStyle}>Est. Total</th><th style={thStyle}>Date</th><th style={thStyle}></th>
              </tr></thead>
              <tbody>{requests.map(r => {
                const badge = STATUS_BADGES[r.status] || {};
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}><strong>{r.pr_no}</strong></td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13, color: '#1E293B' }}>{r.drug_name} × {r.quantity_requested} {r.unit_of_measure}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: r.urgency === 'CRITICAL' ? '#FEE2E2' : r.urgency === 'HIGH' ? '#FEF3C7' : '#F1F5F9',
                        color: r.urgency === 'CRITICAL' ? '#991B1B' : r.urgency === 'HIGH' ? '#92400E' : '#475569',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                      }}>{r.urgency}</span>
                    </td>
                    <td style={tdStyle}><span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{badge.text}</span></td>
                    <td style={tdStyle}>{r.estimated_total ? `${parseFloat(r.estimated_total).toFixed(2)} ETB` : '—'}</td>
                    <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => { loadRequest(r.id); setTab('detail'); }} style={actionBtn}>View</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'detail' && selected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setTab('list')} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12, zIndex: 20 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ background: '#224f94', color: 'white', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 9 }}>SUTANA</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>PROCUREMENT:</h2>
                    <p style={{ margin: 0, fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Purchase Request #{selected.pr_no}</p>
                    {selected.request_type === 'NEW_DRUG' && (
                      <span style={{ background: '#059669', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        🆕 NEW DRUG
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handlePrint} title="Print" style={{ zIndex: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 14px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                  <Printer size={15} /> Print
                </button>
                <div style={{ position: 'absolute', top: -40, right: -20, width: 180, height: 180, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.8 }}></div>
                <div style={{ position: 'absolute', bottom: -10, right: 110, width: 70, height: 70, background: '#1c3d70', borderRadius: '12px' }}></div>
                <div style={{ position: 'absolute', top: 16, right: 56, width: 16, height: 16, background: '#93c5fd', borderRadius: '50%' }}></div>
              </div>
            </div>

            <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #224f94' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#224f94', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Requested By:</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{selected.requested_by_name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>● Department: Pharmacy</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>PR No: <strong style={{ color: '#1e293b' }}>{selected.pr_no}</strong></div>
                <div>Date: <strong style={{ color: '#1e293b' }}>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
                <div>Urgency: <strong style={{ color: '#1e293b' }}>{selected.urgency}</strong></div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ background: STATUS_BADGES[selected.status]?.bg || '#F1F5F9', color: STATUS_BADGES[selected.status]?.color || '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {STATUS_BADGES[selected.status]?.text || selected.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px', flexGrow: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #224f94' }}>
                    <th style={{ ...thStyle, textTransform: 'uppercase' }}>Item</th>
                    <th style={{ ...thStyle, textAlign: 'center', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'center', textTransform: 'uppercase' }}>Unit Price</th>
                    <th style={{ ...thStyle, textAlign: 'right', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{selected.drug_name}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{selected.quantity_requested} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{selected.unit_of_measure}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#475569' }}>{selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #224f94', background: '#EFF6FF' }}>
                    <td colSpan={3} style={{ ...tdStyle, fontWeight: 800, textTransform: 'uppercase', color: '#1E40AF', textAlign: 'right' }}>Estimated Total:</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#224f94', fontSize: 15 }}>
                      {selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {selected.justification && (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', marginBottom: 16, borderLeft: '3px solid #224f94' }}>
                  <strong>Justification:</strong> {selected.justification}
                </div>
              )}

              {selected.request_type === 'NEW_DRUG' && (
                <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, borderLeft: '3px solid #059669' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🆕 New Drug Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#374151' }}>
                    <div><strong>Category:</strong> {selected.drug_category || '—'}</div>
                    <div><strong>Classification:</strong> {selected.drug_classification || '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Therapeutic Use:</strong> {selected.therapeutic_use || '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {selected.request_reason || '—'}</div>
                  </div>
                </div>
              )}

              {selected.wait_instructions && (
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 16, borderLeft: '3px solid #F59E0B' }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>⏳ CEO Wait Instructions:</strong>
                  {selected.wait_document && <div>📄 Document: {selected.wait_document}</div>}
                  <div>📝 {selected.wait_instructions}</div>
                </div>
              )}

              {selected.ceo_notes && (
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 16, borderLeft: '3px solid #F59E0B' }}>
                  <strong>CEO Notes:</strong> {selected.ceo_notes}
                </div>
              )}

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
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = (disabled) => ({ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: disabled ? '#F8FAFC' : 'white', boxSizing: 'border-box' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const actionBtn = { padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#475569' };
const tabBtn = (active) => ({ padding: '10px 20px', borderRadius: 8, border: active ? '2px solid #059669' : '1px solid #E2E8F0', background: active ? '#ECFDF5' : 'white', color: active ? '#065F46' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 });

export default ProcurementRequests;
