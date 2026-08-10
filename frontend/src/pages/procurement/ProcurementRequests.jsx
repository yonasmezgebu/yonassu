import React, { useState, useEffect } from 'react';
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
const MINT  = '#D9FDE7';
const LIME  = '#E5FAAC';
const DARK  = '#1A3326';   // dark forest green
const MID   = '#2A5741';   // mid forest green
const GOLD  = '#D4A843';
const GOLD2 = '#9A701E';

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
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <title>Procurement Request - ${selected.pr_no}</title>
  <style>
    body { font-family: 'Inter', sans-serif; background: #fff; margin: 0; }
    @media print { @page { margin: 0; size: A4; } body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
  </style>
</head>
<body class="p-8">
  <div class="no-print mb-4 flex justify-end">
    <button onclick="window.print()" style="padding:10px 20px;background:#1A3326;color:#D9FDE7;border:none;font-weight:900;font-size:13px;cursor:pointer;text-transform:uppercase;">Print Document</button>
  </div>
  <div class="max-w-4xl mx-auto" style="border:4px solid #1A3326;min-height:90vh;">
    <div style="background:#1A3326;color:#D9FDE7;padding:28px 32px;display:flex;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:14px">
        <div>
          <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#D9FDE7;">PROCUREMENT:</h1>
          <p style="margin:0;font-size:11px;color:#E5FAAC;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Purchase Request - Pharmacy</p>
        </div>
      </div>
    </div>
    <div style="padding:20px 28px;display:flex;justify-content:space-between;border-bottom:4px solid #1A3326;background:#D9FDE7;">
      <div>
        <div style="font-size:11px;font-weight:900;color:#1A3326;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Requested By:</div>
        <div style="font-size:18px;font-weight:800;color:#1A3326">${selected.requested_by_name}</div>
        <div style="font-size:12px;color:#2A5741;margin-top:3px;font-weight:700">● Department: Pharmacy</div>
      </div>
      <div style="text-align:right;font-size:13px;color:#1A3326;display:flex;flex-direction:column;gap:4px;font-weight:700">
        <div>PR No: <strong>${selected.pr_no}</strong></div>
        <div>Date: <strong>${new Date(selected.created_at).toLocaleDateString()}</strong></div>
        <div>Urgency: <strong>${selected.urgency}</strong></div>
      </div>
    </div>
    <div style="padding:24px 28px;background:#E5FAAC;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:12px;background:#1A3326;color:#E5FAAC;font-weight:900;text-transform:uppercase;text-align:left;border:2px solid #1A3326">Item</th>
            <th style="padding:12px;background:#1A3326;color:#E5FAAC;font-weight:900;text-transform:uppercase;text-align:center;border:2px solid #1A3326">Qty</th>
            <th style="padding:12px;background:#1A3326;color:#E5FAAC;font-weight:900;text-transform:uppercase;text-align:center;border:2px solid #1A3326">Unit Price</th>
            <th style="padding:12px;background:#1A3326;color:#E5FAAC;font-weight:900;text-transform:uppercase;text-align:right;border:2px solid #1A3326">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px;border:2px solid #1A3326;font-weight:800;color:#1A3326;background:#D9FDE7;">${selected.drug_name}</td>
            <td style="padding:12px;border:2px solid #1A3326;text-align:center;font-weight:800;color:#1A3326;background:#D9FDE7;">${selected.quantity_requested} <span style="font-size:11px;">${selected.unit_of_measure}</span></td>
            <td style="padding:12px;border:2px solid #1A3326;text-align:center;font-weight:800;color:#1A3326;background:#D9FDE7;">${selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
            <td style="padding:12px;border:2px solid #1A3326;text-align:right;font-weight:900;color:#1A3326;background:#D9FDE7;">${selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
          </tr>
        </tbody>
      </table>
      ${selected.justification ? `<div style="border:3px solid #1A3326;background:#D9FDE7;padding:12px;font-size:13px;color:#1A3326;font-weight:700;"><strong>Justification:</strong> ${selected.justification}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;">
        <div>
          <div style="font-size:12px;color:#1A3326;text-transform:uppercase;margin-bottom:6px;font-weight:900">Requested &amp; Authorized by</div>
          ${selected.manager_signature
            ? `<div style="width:220px;border:3px solid #1A3326;background:#D9FDE7;padding:10px;">
                <img src="${selected.manager_signature}" alt="Signature" style="width:200px;height:70px;object-fit:contain;display:block;" />
               </div>`
            : `<div style="font-family:'Caveat',cursive;font-size:36px;color:#1A3326;">${selected.requested_by_name}</div>`
          }
        </div>
      </div>
    </div>
  </div>
  <script>document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 900); });</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div style={{ padding: 0, margin: 0, minHeight: '100vh', width: '100%', background: MINT, fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        
        /* 3D Animations */
        @keyframes blink3D {
          0%, 100% { opacity: 1; transform: perspective(400px) rotateY(0deg) scale(1); }
          50% { opacity: 0.4; transform: perspective(400px) rotateY(180deg) scale(1.1); }
        }
        @keyframes spin3D {
          100% { transform: perspective(400px) rotateX(360deg) rotateY(180deg); }
        }
        @keyframes rowIn3D {
          from { opacity: 0; transform: perspective(800px) rotateX(-60deg) translateY(-20px); }
          to { opacity: 1; transform: perspective(800px) rotateX(0deg) translateY(0); }
        }

        .action-btn-3d { 
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .action-btn-3d:hover { 
          transform: perspective(600px) translateZ(10px) translateY(-3px) rotateX(5deg) !important;
          box-shadow: 0 8px 0 #9A701E, 0 12px 15px rgba(0,0,0,0.2) !important;
        }
        .action-btn-3d:active { 
          transform: perspective(600px) translateZ(0) translateY(5px) rotateX(0deg) !important; 
          box-shadow: 0 0 0 #9A701E !important; 
        }

        .inv-row-3d {
          transition: transform 0.25s, background 0.25s, box-shadow 0.25s;
          transform-style: preserve-3d;
        }
        .inv-row-3d:hover {
          transform: perspective(800px) scale(1.005) translateZ(5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          z-index: 10;
          position: relative;
          background: #fff !important;
        }

        /* Continuous rotation for specific icons */
        .icon-3d {
          animation: blink3D 3s ease-in-out infinite;
        }
      `}</style>
      <ToastContainer />

      {/* ══ TOP HEADER BAR ══════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD}`,
        padding: '0 24px', animation: 'fadeUp .3s ease'
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},${MINT},${LIME},${GOLD})`,
          backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
          {/* Left – title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, perspective: 600 }}>
            <div
              className="icon-3d"
              style={{
                width: 46, height: 46, background: GOLD, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: `3px solid ${GOLD2}`, boxShadow: `4px 4px 0 ${GOLD2}`
              }}
            >
              <Package size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: MINT, margin: 0, lineHeight: 1.1 }}>
                Drug Procurement
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: GOLD }}>
                Request • Track • Receive
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Right – single Refresh button */}
            <button
              onClick={handleRefresh}
              className="action-btn-3d"
              style={{
                background: MINT, color: DARK, border: `3px solid ${GOLD2}`,
                padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                boxShadow: `4px 4px 0 ${GOLD2}`, display: 'inline-flex',
                alignItems: 'center', gap: 8, textTransform: 'uppercase',
                letterSpacing: '1.5px'
              }}
            >
              <SegmentedSpinner size={17} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ TAB BAR ═════════════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD2}`,
        padding: '0 24px', display: 'flex', gap: 0,
        animation: 'fadeUp .35s ease'
      }}>
        {[
          { id: 'list', label: 'My Requests', icon: FileText },
          { id: 'create', label: 'New Request', icon: Package }
        ].map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: '13px 16px',
                border: 'none', borderBottom: active ? `4px solid ${GOLD}` : '4px solid transparent',
                background: active ? GOLD : 'transparent',
                color: active ? DARK : 'rgba(217,253,231,.65)',
                fontWeight: 900, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                boxShadow: active ? `inset 0 -4px 0 ${GOLD2}` : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span className={active ? '' : 'icon-3d'}>
                <Icon size={16} />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ══ CONTENT AREA ════════════════════════════════════ */}
      <div style={{ padding: '0 0 32px' }}>
        <div style={{
          background: LIME,
          border: `0 solid ${DARK}`,
          borderTop: `3px solid ${DARK}`,
          minHeight: 520,
          boxShadow: `6px 6px 0 rgba(26,51,38,.18)`,
          animation: 'fadeUp .4s ease'
        }}>
          
          {tab === 'create' && (
            <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
              <div style={{ background: MINT, border: `3px solid ${DARK}`, padding: 24, boxShadow: `6px 6px 0 ${DARK}` }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, color: DARK, fontWeight: 900, textTransform: 'uppercase' }}>Procurement Request Form</h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: MID, fontWeight: 700 }}>Request drugs/items for purchase — will be reviewed by CEO</p>
                
                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Request Type *</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" onClick={() => setRequestType('EXISTING_DRUG')} className="action-btn-3d"
                        style={{ flex: 1, padding: '12px 20px', border: `3px solid ${DARK}`, background: requestType === 'EXISTING_DRUG' ? DARK : MINT, color: requestType === 'EXISTING_DRUG' ? MINT : DARK, fontWeight: 900, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${GOLD}` }}>
                        <span className="icon-3d" style={{ display: 'inline-block', marginRight: 8 }}>🏭</span> Existing Drug (Stocked)
                      </button>
                      <button type="button" onClick={() => setRequestType('NEW_DRUG')} className="action-btn-3d"
                        style={{ flex: 1, padding: '12px 20px', border: `3px solid ${DARK}`, background: requestType === 'NEW_DRUG' ? DARK : MINT, color: requestType === 'NEW_DRUG' ? MINT : DARK, fontWeight: 900, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${GOLD}` }}>
                        <span className="icon-3d" style={{ display: 'inline-block', marginRight: 8 }}>🆕</span> New Drug (Not Available)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
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
                    <div style={{ marginBottom: 24 }}>
                      <label style={labelStyle}>Items *</label>
                      <div style={{ border: `3px solid ${DARK}`, background: MINT }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: DARK, color: MINT }}>
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
                                <tr key={idx} className="inv-row-3d" style={{ borderBottom: `2px solid ${DARK}`, background: idx % 2 === 0 ? LIME : MINT }}>
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
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: DARK }}>
                                    {total > 0 ? `${total.toFixed(2)} ETB` : '—'}
                                  </td>
                                  <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                    {items.length > 1 && (
                                      <button type="button" onClick={() => removeRow(idx)} className="action-btn-3d"
                                        style={{ background: '#FEE2E2', border: '2px solid #EF4444', padding: '6px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', boxShadow: '2px 2px 0 #EF4444' }}>
                                        <Trash2 size={14} className="icon-3d" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: DARK, color: MINT }}>
                              <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 900, fontSize: 14, textAlign: 'right', textTransform: 'uppercase' }}>ESTIMATED TOTAL:</td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: LIME, fontSize: 16 }}>
                                {grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <button type="button" onClick={addRow} className="action-btn-3d"
                        style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: LIME, color: DARK, border: `2px dashed ${DARK}`, cursor: 'pointer', fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>
                        <Plus size={16} className="icon-3d" /> Add Another Item
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 24, background: LIME, padding: 20, border: `3px solid ${DARK}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span className="icon-3d" style={{ fontSize: 24 }}>🆕</span>
                        <strong style={{ fontSize: 16, color: DARK, textTransform: 'uppercase', fontWeight: 900 }}>New Drug Request</strong>
                        <span style={{ fontSize: 11, color: MINT, background: DARK, padding: '4px 10px', fontWeight: 800, textTransform: 'uppercase' }}>Single Item</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
                      <div style={{ borderTop: `2px dashed ${DARK}`, paddingTop: 16, marginTop: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
                        <div style={{ marginBottom: 16 }}>
                          <label style={labelStyle}>Therapeutic Use *</label>
                          <textarea value={therapeuticUse} onChange={e => setTherapeuticUse(e.target.value)} rows={2}
                            style={{ ...inputStyle(), resize: 'vertical' }} placeholder="e.g. Treatment of bacterial infections" />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label style={labelStyle}>Reason for Request *</label>
                          <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={2}
                            style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Why is this new drug needed?" />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 900, color: DARK, marginTop: 12, padding: '12px', background: MINT, border: `3px solid ${DARK}` }}>
                        EST. TOTAL: {items[0] ? ((parseFloat(items[0].estimatedUnitPrice) || 0) * (parseInt(items[0].quantityRequested) || 0)).toFixed(2) : '0.00'} ETB
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Justification</label>
                    <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3}
                      style={{ ...inputStyle(), resize: 'vertical', width: '100%' }} placeholder="Explain why this purchase is needed..." />
                  </div>

                  {/* ─── Digital Signature Section ─── */}
                  <div style={{ marginBottom: 32, borderTop: `3px solid ${DARK}`, paddingTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <PenLine size={20} color={DARK} className="icon-3d" />
                      <span style={{ fontSize: 16, fontWeight: 900, color: DARK, textTransform: 'uppercase' }}>Manager Authorization Signature</span>
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 800, border: '2px solid #ef4444', padding: '2px 8px' }}>* REQUIRED</span>
                    </div>
                    <div style={{ background: LIME, border: `3px solid ${DARK}`, padding: 20 }}>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: MID, fontWeight: 700 }}>
                        <span className="icon-3d" style={{ display: 'inline-block' }}>✍️</span> By signing below, you confirm this procurement request is accurate and authorized by you as Pharmacy Manager.
                      </p>
                      <SignatureCanvas
                        onSave={setSignatureDataUrl}
                        onClear={() => setSignatureDataUrl(null)}
                        width={700}
                        height={160}
                        label="Pharmacy Manager Signature"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button type="submit" disabled={loading || !signatureDataUrl} className={(loading || !signatureDataUrl) ? '' : 'action-btn-3d'}
                      style={{
                        background: loading || !signatureDataUrl ? '#e2e8f0' : GOLD,
                        color: loading || !signatureDataUrl ? '#94a3b8' : DARK,
                        border: loading || !signatureDataUrl ? '3px solid #cbd5e1' : `3px solid ${GOLD2}`,
                        padding: '16px 32px',
                        fontWeight: 900, fontSize: 14, cursor: loading || !signatureDataUrl ? 'not-allowed' : 'pointer',
                        boxShadow: loading || !signatureDataUrl ? 'none' : `6px 6px 0 ${GOLD2}`,
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        textTransform: 'uppercase', letterSpacing: '1.2px', borderRadius: 0
                      }}>
                      {loading ? 'Submitting...' : !signatureDataUrl ? '✍️ Signature Required to Submit' : requestType === 'NEW_DRUG' ? '🆕 Submit New Drug Request' : `Submit Request (${items.filter(r => r.drugName).length} item${items.filter(r => r.drugName).length !== 1 ? 's' : ''})`}
                    </button>
                    <span style={{ fontSize: 12, color: MID, fontWeight: 700, textTransform: 'uppercase' }}>Status will be PENDING_CEO_REVIEW</span>
                  </div>
                </form>
              </div>
            </div>
          )}

          {tab === 'list' && (
            <div style={{ padding: '24px' }}>
              <div style={{ background: MINT, border: `3px solid ${DARK}`, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DARK }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: MINT, fontWeight: 900, textTransform: 'uppercase' }}>My Procurement Requests</h3>
                    <span style={{ fontSize: 12, color: DARK, background: LIME, padding: '4px 10px', fontWeight: 800 }}>{requests.length} REQUESTS</span>
                  </div>
                </div>
                {requests.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: DARK, fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>
                    <div className="icon-3d" style={{ display: 'inline-block', fontSize: 40, marginBottom: 10 }}>📦</div>
                    <div>No procurement requests yet.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead><tr style={{ background: LIME, borderBottom: `3px solid ${DARK}` }}>
                        {['PR #', 'Item', 'Urgency', 'Status', 'Est. Total', 'Date', 'Action'].map((h, i) => (
                          <th key={i} style={{ padding: '14px 16px', textAlign: i === 6 ? 'center' : 'left', fontWeight: 900, fontSize: 12, color: DARK, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{requests.map((r, idx) => {
                        const badge = STATUS_BADGES[r.status] || {};
                        return (
                          <tr key={r.id} className="inv-row-3d" style={{ borderBottom: `2px solid ${DARK}`, background: idx % 2 === 0 ? MINT : LIME, animation: `rowIn3D 0.3s ease-out ${idx * 0.05}s both` }}>
                            <td style={{ padding: '14px 16px', color: DARK, fontWeight: 900 }}>{r.pr_no}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 13, color: DARK, fontWeight: 800 }}>{r.drug_name} × {r.quantity_requested} {r.unit_of_measure}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                background: r.urgency === 'CRITICAL' ? '#FEE2E2' : r.urgency === 'HIGH' ? '#FEF3C7' : DARK,
                                color: r.urgency === 'CRITICAL' ? '#991B1B' : r.urgency === 'HIGH' ? '#92400E' : MINT,
                                border: `2px solid ${r.urgency === 'CRITICAL' ? '#991B1B' : r.urgency === 'HIGH' ? '#92400E' : MINT}`,
                                padding: '4px 10px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase'
                              }}>{r.urgency}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ background: badge.bg, color: badge.color, border: `2px solid ${badge.color}`, padding: '4px 10px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                                <span className={r.status.includes('WAITING') || r.status.includes('PENDING') ? 'icon-3d' : ''} style={{ display: 'inline-block' }}>
                                  {badge.text}
                                </span>
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 900, color: DARK }}>{r.estimated_total ? `${parseFloat(r.estimated_total).toFixed(2)} ETB` : '—'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: MID }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <button onClick={() => { loadRequest(r.id); setTab('detail'); }} className="action-btn-3d"
                                style={{ padding: '8px 16px', background: DARK, color: LIME, border: `2px solid ${GOLD}`, cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${GOLD}` }}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'detail' && selected && (
            <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', animation: 'fadeUp 0.3s ease-out' }}>
              <div style={{ background: MINT, border: `3px solid ${DARK}`, overflow: 'hidden', boxShadow: `8px 8px 0 ${DARK}` }}>
                
                <div style={{ background: DARK, color: MINT, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `4px solid ${GOLD}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setTab('list')} className="action-btn-3d"
                      style={{ background: MINT, color: DARK, border: `2px solid ${GOLD}`, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${GOLD}` }}>
                      <ArrowLeft size={16} className="icon-3d" /> Back
                    </button>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: LIME }}>PROCUREMENT:</h2>
                      <p style={{ margin: 0, fontSize: 12, color: MINT, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Purchase Request #{selected.pr_no}</p>
                      {selected.request_type === 'NEW_DRUG' && (
                        <span style={{ background: GOLD, color: DARK, border: `2px solid ${DARK}`, padding: '4px 12px', fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, textTransform: 'uppercase' }}>
                          <span className="icon-3d">🆕</span> NEW DRUG
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={handlePrint} className="action-btn-3d" title="Print" style={{ background: GOLD, color: DARK, border: `3px solid ${GOLD2}`, padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${GOLD2}` }}>
                    <Printer size={18} className="icon-3d" /> Print
                  </button>
                </div>

                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `3px solid ${DARK}`, background: LIME }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Requested By:</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: DARK }}>{selected.requested_by_name}</div>
                    <div style={{ fontSize: 12, color: MID, marginTop: 4, fontWeight: 700 }}>● Department: Pharmacy</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: DARK, display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700 }}>
                    <div>PR No: <strong style={{ fontWeight: 900, fontSize: 14 }}>{selected.pr_no}</strong></div>
                    <div>Date: <strong>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
                    <div>Urgency: <strong style={{ color: selected.urgency === 'CRITICAL' ? '#EF4444' : DARK }}>{selected.urgency}</strong></div>
                    <div style={{ marginTop: 6 }}>
                      <span className="icon-3d" style={{ display: 'inline-block', background: STATUS_BADGES[selected.status]?.bg || '#F1F5F9', color: STATUS_BADGES[selected.status]?.color || '#475569', border: `2px solid ${STATUS_BADGES[selected.status]?.color || '#475569'}`, padding: '6px 14px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                        {STATUS_BADGES[selected.status]?.text || selected.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '32px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 24, border: `3px solid ${DARK}` }}>
                    <thead>
                      <tr style={{ background: DARK, color: MINT }}>
                        <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price</th>
                        <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: LIME, borderBottom: `2px solid ${DARK}` }}>
                        <td style={{ padding: '16px', color: DARK, fontWeight: 800, fontSize: 14 }}>{selected.drug_name}</td>
                        <td style={{ padding: '16px', textAlign: 'center', color: DARK, fontWeight: 900, fontSize: 14 }}>{selected.quantity_requested} <span style={{ fontSize: 11, fontWeight: 700 }}>{selected.unit_of_measure}</span></td>
                        <td style={{ padding: '16px', textAlign: 'center', color: DARK, fontWeight: 800 }}>{selected.estimated_unit_price ? `${selected.estimated_unit_price} ETB` : '—'}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: DARK, fontSize: 15 }}>{selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: DARK, color: LIME }}>
                        <td colSpan={3} style={{ padding: '16px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right', fontSize: 14 }}>Estimated Total:</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, fontSize: 18 }}>
                          {selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {selected.justification && (
                    <div style={{ background: LIME, border: `3px solid ${DARK}`, padding: '16px', fontSize: 13, color: DARK, marginBottom: 24, boxShadow: `4px 4px 0 ${DARK}` }}>
                      <strong style={{ textTransform: 'uppercase', fontWeight: 900, marginRight: 8 }}>Justification:</strong> {selected.justification}
                    </div>
                  )}

                  {selected.request_type === 'NEW_DRUG' && (
                    <div style={{ background: '#ECFDF5', border: `3px solid #059669`, padding: '20px', marginBottom: 24, boxShadow: `4px 4px 0 #059669` }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#065F46', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="icon-3d">🆕</span> New Drug Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#065F46', fontWeight: 700 }}>
                        <div><strong>CATEGORY:</strong> {selected.drug_category || '—'}</div>
                        <div><strong>CLASSIFICATION:</strong> {selected.drug_classification || '—'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>THERAPEUTIC USE:</strong> {selected.therapeutic_use || '—'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>REASON:</strong> {selected.request_reason || '—'}</div>
                      </div>
                    </div>
                  )}

                  {selected.wait_instructions && (
                    <div style={{ background: '#FEF3C7', border: `3px solid #D97706`, padding: '20px', marginBottom: 24, boxShadow: `4px 4px 0 #D97706` }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#92400E', fontWeight: 900, textTransform: 'uppercase' }}>
                        <span className="icon-3d">⏳</span> CEO Wait Instructions:
                      </strong>
                      <div style={{ color: '#92400E', fontWeight: 700, fontSize: 13 }}>
                        {selected.wait_document && <div style={{ marginBottom: 4 }}>📄 Document: {selected.wait_document}</div>}
                        <div>📝 {selected.wait_instructions}</div>
                      </div>
                    </div>
                  )}

                  {selected.ceo_notes && (
                    <div style={{ background: '#FEF3C7', border: `3px solid #D97706`, padding: '16px', fontSize: 13, color: '#92400E', marginBottom: 24, boxShadow: `4px 4px 0 #D97706` }}>
                      <strong style={{ textTransform: 'uppercase', fontWeight: 900, marginRight: 8 }}>CEO Notes:</strong> {selected.ceo_notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ fontSize: 12, color: DARK, textTransform: 'uppercase', marginBottom: 10, fontWeight: 900 }}>Requested &amp; Authorized by</div>
                      {selected.manager_signature ? (
                        <div style={{ position: 'relative', width: 240, border: `3px solid ${DARK}`, background: 'white', padding: 10, boxShadow: `4px 4px 0 ${DARK}` }}>
                          <img
                            src={selected.manager_signature}
                            alt="Manager Signature"
                            style={{ width: 220, height: 80, objectFit: 'contain', display: 'block', filter: 'contrast(1.15)' }}
                          />
                        </div>
                      ) : (
                        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 42, color: DARK, transform: 'rotate(-5deg)', display: 'inline-block', lineHeight: 1, padding: 10 }}>
                          {selected.requested_by_name}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: MID, marginTop: 12, fontWeight: 800, textTransform: 'uppercase' }}>{selected.requested_by_name} — Pharmacy Manager</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: DARK, color: MINT, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, letterSpacing: 1 }}>
                    <div>📞 +251 11 123 4567</div>
                    <div>✉️ pharmacy@sutana.com</div>
                    <div>🌐 www.sutana.com</div>
                  </div>
                  <div className="icon-3d" style={{ width: 44, height: 44, background: GOLD, border: `3px solid ${GOLD2}` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 900, color: DARK, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = (disabled) => ({ 
  width: '100%', padding: '12px 16px', borderRadius: 0, 
  border: `3px solid ${DARK}`, fontSize: 13, fontWeight: 700,
  background: disabled ? LIME : 'white', color: DARK, outline: 'none', 
  transition: 'all 0.2s', ...(disabled ? {} : { cursor: 'text' }),
  boxShadow: disabled ? 'none' : `3px 3px 0 ${DARK}`
});
const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 900, color: MINT, textTransform: 'uppercase', letterSpacing: '0.05em' };

export default ProcurementRequests;
