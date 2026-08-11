import React, { useState, useEffect } from 'react';
import '../pharmacy/StockOperations.css';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { FileText, Package, Printer, ArrowLeft, Plus, Trash2, AlertTriangle, PenLine, RefreshCw } from 'lucide-react';
import SignatureCanvas from '../../components/SignatureCanvas';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

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

/* ─── colour tokens ─────────────────────────────────────── */


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
  const [spinning, setSpinning] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);

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
    finally { setSpinning(false); }
  };

  const loadRequest = async (reqId) => {
    try { const res = await apiClient.get(`/procurement/requests/${reqId}`); if (res.status === 'success') setSelected(res.data); } catch (e) { console.error(e); }
  };

  const handleRefresh = () => {
    setSpinning(true);
    loadRequests();
    loadProducts();
    if (selected) loadRequest(selected.id);
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
    if (!signatureDataUrl) { showToast('Please sign the form before submitting', 'warning'); return; }
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
          managerSignature: signatureDataUrl,
        });
      } else {
        for (const row of validItems) {
          await apiClient.post('/procurement/requests', {
            drugName: row.drugName,
            quantityRequested: parseInt(row.quantityRequested),
            unitOfMeasure: row.unitOfMeasure,
            estimatedUnitPrice: parseFloat(row.estimatedUnitPrice) || 0,
            justification, urgency,
            managerSignature: signatureDataUrl,
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
      setSignatureDataUrl(null);
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
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <title>Procurement Request - ${selected.pr_no}</title>
  <style>
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111827; margin: 0; padding: 40px; }
    @media print { @page { margin: 0; size: A4; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
    .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
    .title { font-size: 24px; font-weight: 700; margin: 0; color: #111827; }
    .subtitle { font-size: 14px; color: #6B7280; margin-top: 4px; }
    .meta { text-align: right; font-size: 14px; color: #4B5563; }
    .meta strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #F9FAFB; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
    td { padding: 16px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
    .box { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; }
    .signature { margin-top: 60px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #2563EB; color: #fff; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">Print Document</button>
  </div>
  
  <div class="header">
    <div>
      <h1 class="title">Purchase Request</h1>
      <div class="subtitle">Pharmacy Department</div>
    </div>
    <div class="meta">
      <div>PR No: <strong>${selected.pr_no}</strong></div>
      <div>Date: <strong>${new Date(selected.created_at).toLocaleDateString()}</strong></div>
      <div>Urgency: <strong style="color: ${selected.urgency === 'CRITICAL' ? '#DC2626' : '#111827'}">${selected.urgency}</strong></div>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <div style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 4px;">Requested By</div>
    <div style="font-size: 16px; font-weight: 600;">${selected.requested_by_name}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: center;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: 500;">${selected.drug_name}</td>
        <td style="text-align: center;">${selected.quantity_requested} <span style="font-size: 12px; color: #6B7280;">${selected.unit_of_measure}</span></td>
        <td style="text-align: center;">${selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
        <td style="text-align: right; font-weight: 600;">${selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align: right; padding: 16px 12px; font-weight: 600; font-size: 14px;">Estimated Total:</td>
        <td style="text-align: right; padding: 16px 12px; font-weight: 700; font-size: 16px;">${selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
      </tr>
    </tfoot>
  </table>

  ${selected.justification ? `<div class="box"><strong style="display: block; margin-bottom: 4px; font-size: 12px; color: #6B7280; text-transform: uppercase;">Justification</strong>${selected.justification}</div>` : ''}

  <div class="signature">
    <div style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 12px;">Authorized Signature</div>
    ${selected.manager_signature 
      ? `<img src="${selected.manager_signature}" alt="Signature" style="height: 60px; object-fit: contain; display: block;" />` 
      : `<div style="font-family: 'Caveat', cursive; font-size: 32px;">${selected.requested_by_name}</div>`
    }
  </div>

  <script>document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 500); });</script>
</body>
</html>`);
    w.document.close();
  };

    return (
    <div className="pso-root">
      <ToastContainer />

      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Package size={20} />
          </div>
          <div>
            <h1 className="pso-title">Drug Procurement</h1>
            <p className="pso-subtitle">Request • Track • Receive</p>
          </div>
        </div>
        <div className="pso-header-right">
          <button onClick={handleRefresh} className="pso-btn-refresh" disabled={spinning}>
            <SegmentedSpinner size={15} spinning={spinning} />
            Refresh
          </button>
        </div>
      </div>

      <div className="pso-tabs">
        {[
          { id: 'list', label: 'My Requests', icon: FileText },
          { id: 'create', label: 'New Request', icon: Package }
        ].map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} className={`pso-tab ${active ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="pso-content">
        <div className="card-container" style={{ padding: 24, margin: '20px auto', maxWidth: tab === 'create' || tab === 'detail' ? 900 : '100%', borderTop: tab === 'create' || tab === 'detail' ? '4px solid var(--color-primary)' : '' }}>
          
          {tab === 'create' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--color-text-primary)', fontWeight: 600 }}>Procurement Request Form</h2>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Request drugs/items for purchase — will be reviewed by CEO</p>
              </div>
              
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 24 }}>
                  <label className="pso-label">Request Type <span style={{color: 'var(--color-danger)'}}>*</span></label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => setRequestType('EXISTING_DRUG')} className={`${requestType === 'EXISTING_DRUG' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
                      🏭 Existing Drug (Stocked)
                    </button>
                    <button type="button" onClick={() => setRequestType('NEW_DRUG')} className={`${requestType === 'NEW_DRUG' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
                      🆕 New Drug (Not Available)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div>
                    <label className="pso-label">Department</label>
                    <input value="Pharmacy" disabled className="pso-input" style={{ background: 'var(--color-bg-page)', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label className="pso-label">Urgency Level</label>
                    <select value={urgency} onChange={e => setUrgency(e.target.value)} className="pso-input">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                {requestType === 'EXISTING_DRUG' ? (
                  <div style={{ marginBottom: 24 }}>
                    <label className="pso-label">Items <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="pso-table">
                        <thead>
                          <tr>
                            <th style={{ width: '35%' }}>Drug / Item</th>
                            <th style={{ textAlign: 'center' }}>Qty</th>
                            <th style={{ textAlign: 'center' }}>Unit</th>
                            <th style={{ textAlign: 'center' }}>Est. Unit Price</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((row, idx) => {
                            const total = rowTotal(row);
                            return (
                              <tr key={idx}>
                                <td style={{ padding: '8px 12px' }}>
                                  <input value={row.drugName} onChange={e => updateItem(idx, 'drugName', e.target.value)}
                                    className="pso-input" style={{ fontSize: 13, padding: '6px 10px' }} placeholder="Enter drug/item name" list="product-list" />
                                  <datalist id="product-list">
                                    {products.map(p => <option key={p.id} value={p.name} />)}
                                  </datalist>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input type="number" min="1" value={row.quantityRequested} onChange={e => updateItem(idx, 'quantityRequested', e.target.value)}
                                    className="pso-input" style={{ width: 70, textAlign: 'center', padding: '6px' }} placeholder="0" />
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <select value={row.unitOfMeasure} onChange={e => updateItem(idx, 'unitOfMeasure', e.target.value)} className="pso-input" style={{ padding: '6px', fontSize: 13 }}>
                                    <option>Each</option><option>Box</option><option>Pack</option><option>Bottle</option><option>Vial</option><option>Carton</option>
                                  </select>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input type="number" min="0" step="0.01" value={row.estimatedUnitPrice} onChange={e => updateItem(idx, 'estimatedUnitPrice', e.target.value)}
                                    className="pso-input" style={{ width: 100, textAlign: 'center', padding: '6px' }} placeholder="0.00" />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {total > 0 ? `${total.toFixed(2)} ETB` : '—'}
                                </td>
                                <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                  {items.length > 1 && (
                                    <button type="button" onClick={() => removeRow(idx)} style={{ color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
                          <tr>
                            <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, textAlign: 'right', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>ESTIMATED TOTAL:</td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: 15 }}>
                              {grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <button type="button" onClick={addRow} className="btn-secondary" style={{ marginTop: 12, borderStyle: 'dashed' }}>
                      <Plus size={16} /> Add Another Item
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: 24, background: 'var(--color-bg-page)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>🆕</span>
                      <strong style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>New Drug Request</strong>
                      <span className="pso-badge" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>Single Item</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label className="pso-label">Drug Name <span style={{color: 'var(--color-danger)'}}>*</span></label>
                        <input value={items[0]?.drugName || ''} onChange={e => updateItem(0, 'drugName', e.target.value)}
                          className="pso-input" placeholder="e.g. Ciprofloxacin 500mg" />
                      </div>
                      <div>
                        <label className="pso-label">Quantity Requested <span style={{color: 'var(--color-danger)'}}>*</span></label>
                        <input type="number" min="1" value={items[0]?.quantityRequested || ''} onChange={e => updateItem(0, 'quantityRequested', e.target.value)}
                          className="pso-input" placeholder="0" />
                      </div>
                      <div>
                        <label className="pso-label">Unit of Measure</label>
                        <select value={items[0]?.unitOfMeasure || 'Each'} onChange={e => updateItem(0, 'unitOfMeasure', e.target.value)} className="pso-input">
                          <option>Each</option><option>Box</option><option>Pack</option><option>Bottle</option><option>Vial</option><option>Carton</option>
                        </select>
                      </div>
                      <div>
                        <label className="pso-label">Estimated Unit Price (ETB)</label>
                        <input type="number" min="0" step="0.01" value={items[0]?.estimatedUnitPrice || ''} onChange={e => updateItem(0, 'estimatedUnitPrice', e.target.value)}
                          className="pso-input" placeholder="0.00" />
                      </div>
                    </div>
                    <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 16, marginTop: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label className="pso-label">Drug Category <span style={{color: 'var(--color-danger)'}}>*</span></label>
                          <select value={drugCategory} onChange={e => setDrugCategory(e.target.value)} className="pso-input">
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
                          <label className="pso-label">Drug Classification <span style={{color: 'var(--color-danger)'}}>*</span></label>
                          <select value={drugClassification} onChange={e => setDrugClassification(e.target.value)} className="pso-input">
                            <option value="">— Select —</option>
                            <option value="OTC">Over the Counter (OTC)</option>
                            <option value="PRESCRIPTION">Prescription Only</option>
                            <option value="CONTROLLED">Controlled Substance</option>
                            <option value="NARCOTIC">Narcotic</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="pso-label">Therapeutic Use <span style={{color: 'var(--color-danger)'}}>*</span></label>
                        <textarea value={therapeuticUse} onChange={e => setTherapeuticUse(e.target.value)} rows={2}
                          className="pso-input" style={{ resize: 'vertical' }} placeholder="e.g. Treatment of bacterial infections" />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="pso-label">Reason for Request <span style={{color: 'var(--color-danger)'}}>*</span></label>
                        <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={2}
                          className="pso-input" style={{ resize: 'vertical' }} placeholder="Why is this new drug needed?" />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 12, padding: 12, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      EST. TOTAL: {items[0] ? ((parseFloat(items[0].estimatedUnitPrice) || 0) * (parseInt(items[0].quantityRequested) || 0)).toFixed(2) : '0.00'} ETB
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <label className="pso-label">Justification</label>
                  <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3}
                    className="pso-input" style={{ resize: 'vertical' }} placeholder="Explain why this purchase is needed..." />
                </div>

                <div style={{ marginBottom: 32, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <PenLine size={18} color="var(--color-text-primary)" />
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Manager Authorization Signature</span>
                    <span className="pso-badge" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>* REQUIRED</span>
                  </div>
                  <div style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      By signing below, you confirm this procurement request is accurate and authorized by you as Pharmacy Manager.
                    </p>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <SignatureCanvas
                        onSave={setSignatureDataUrl}
                        onClear={() => setSignatureDataUrl(null)}
                        width={700}
                        height={160}
                        label="Pharmacy Manager Signature"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="submit" disabled={loading || !signatureDataUrl} className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
                    {loading ? 'Submitting...' : !signatureDataUrl ? '✍️ Signature Required to Submit' : requestType === 'NEW_DRUG' ? 'Submit New Drug Request' : `Submit Request (${items.filter(r => r.drugName).length} item${items.filter(r => r.drugName).length !== 1 ? 's' : ''})`}
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Status will be PENDING_CEO_REVIEW</span>
                </div>
              </form>
            </div>
          )}

          {tab === 'list' && (
            <div>
              <div className="toolbar" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--color-border)', marginBottom: 16, background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 600 }}>My Procurement Requests</h3>
                  <span className="pso-badge">{requests.length} Requests</span>
                </div>
              </div>
              
              {requests.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No procurement requests yet.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="pso-table">
                    <thead>
                      <tr>
                        {['PR #', 'Item', 'Urgency', 'Status', 'Est. Total', 'Date', 'Action'].map((h, i) => (
                          <th key={i} style={{ textAlign: i === 6 ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => {
                        const badge = STATUS_BADGES[r.status] || { bg: '#F1F5F9', color: '#475569', text: r.status };
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.pr_no}</td>
                            <td>
                              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{r.drug_name} × {r.quantity_requested} {r.unit_of_measure}</div>
                            </td>
                            <td>
                              <span className="pso-badge" style={{
                                background: r.urgency === 'CRITICAL' ? 'var(--color-danger-bg)' : r.urgency === 'HIGH' ? 'var(--color-warning-bg)' : 'var(--color-bg-page)',
                                color: r.urgency === 'CRITICAL' ? 'var(--color-danger)' : r.urgency === 'HIGH' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                              }}>{r.urgency}</span>
                            </td>
                            <td>
                              <span className="pso-badge" style={{ background: badge.bg, color: badge.color }}>
                                {badge.text}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500 }}>{r.estimated_total ? `${parseFloat(r.estimated_total).toFixed(2)} ETB` : '—'}</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => { loadRequest(r.id); setTab('detail'); }} className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'detail' && selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={() => setTab('list')} className="btn-secondary" style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}>
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>Purchase Request #{selected.pr_no}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span className="pso-badge" style={{ background: STATUS_BADGES[selected.status]?.bg || '#F1F5F9', color: STATUS_BADGES[selected.status]?.color || '#475569', fontSize: 12 }}>
                        {STATUS_BADGES[selected.status]?.text || selected.status}
                      </span>
                      {selected.request_type === 'NEW_DRUG' && (
                        <span className="pso-badge" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
                          NEW DRUG
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={handlePrint} className="btn-secondary" style={{ gap: 8 }}>
                  <Printer size={16} /> Print
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, background: 'var(--color-bg-page)', padding: 20, borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Requested By</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selected.requested_by_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>Department: Pharmacy</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>PR No: <strong style={{ color: 'var(--color-text-primary)' }}>{selected.pr_no}</strong></div>
                  <div>Date: <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
                  <div>Urgency: <strong style={{ color: selected.urgency === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{selected.urgency}</strong></div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <table className="pso-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'center' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 14 }}>{selected.drug_name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--color-text-primary)', fontSize: 14 }}>{selected.quantity_requested} <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{selected.unit_of_measure}</span></td>
                      <td style={{ textAlign: 'center' }}>{selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>{selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
                    </tr>
                  </tbody>
                  <tfoot style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
                    <tr>
                      <td colSpan={3} style={{ padding: '16px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)' }}>Estimated Total:</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>
                        {selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selected.justification && (
                <div style={{ background: 'var(--color-bg-page)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 24, border: '1px solid var(--color-border)' }}>
                  <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Justification</strong> 
                  {selected.justification}
                </div>
              )}

              {selected.request_type === 'NEW_DRUG' && (
                <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={16} /> New Drug Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>CATEGORY</strong> {selected.drug_category || '—'}</div>
                    <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>CLASSIFICATION</strong> {selected.drug_classification || '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>THERAPEUTIC USE</strong> {selected.therapeutic_use || '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>REASON</strong> {selected.request_reason || '—'}</div>
                  </div>
                </div>
              )}

              {selected.wait_instructions && (
                <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-warning)', fontWeight: 600, textTransform: 'uppercase', fontSize: 13 }}>
                    <AlertTriangle size={16} /> CEO Wait Instructions
                  </strong>
                  <div style={{ color: 'var(--color-text-primary)', fontSize: 14 }}>
                    {selected.wait_document && <div style={{ marginBottom: 8 }}><strong>Document:</strong> {selected.wait_document}</div>}
                    <div>{selected.wait_instructions}</div>
                  </div>
                </div>
              )}

              {selected.ceo_notes && (
                <div style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                  <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: 'var(--color-info)', marginBottom: 8 }}>CEO Notes</strong>
                  {selected.ceo_notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>Requested & Authorized by</div>
                  {selected.manager_signature ? (
                    <div style={{ border: '1px solid var(--color-border)', background: 'white', padding: 8, borderRadius: 'var(--radius-md)', width: 220 }}>
                      <img
                        src={selected.manager_signature}
                        alt="Manager Signature"
                        style={{ width: 200, height: 70, objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: 'var(--color-text-primary)', transform: 'rotate(-2deg)', display: 'inline-block', lineHeight: 1, padding: '10px 0' }}>
                      {selected.requested_by_name}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 12, fontWeight: 500 }}>{selected.requested_by_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Pharmacy Manager</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcurementRequests;
