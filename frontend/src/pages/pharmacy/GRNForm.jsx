import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import CEOStampSignature from '../../components/CEOStampSignature';
import { Package, CheckCircle, Printer, Truck, AlertTriangle } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46', text: 'Completed' },
};

const GRNForm = () => {
  const { id } = useParams();
  const { showToast, ToastContainer } = useToast();
  const printRef = useRef(null);
  const [tab, setTab] = useState(id ? 'detail' : 'list');
  const [grns, setGrns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ quantityReceived: '', condition: 'Good', discrepancyNote: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGRNs();
    if (id) loadGRN(parseInt(id));
  }, [id]);

  const loadGRNs = async () => {
    try {
      const res = await apiClient.get('/erp/grn');
      if (res.status === 'success') setGrns(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadGRN = async (gId) => {
    try {
      const res = await apiClient.get(`/erp/grn/${gId}`);
      if (res.status === 'success') {
        setDetail(res.data);
        setSelected(gId);
        setReceiveForm(f => ({ ...f, quantityReceived: String(res.data.quantity_expected) }));
      }
    } catch (e) { console.error(e); }
  };

  const handleReceive = async () => {
    const qty = parseInt(receiveForm.quantityReceived);
    if (isNaN(qty) || qty < 0) { showToast('Enter a valid quantity received', 'warning'); return; }
    setLoading(true);
    try {
      const res = await apiClient.patch(`/erp/grn/${selected}/receive`, {
        quantityReceived: qty, condition: receiveForm.condition,
        discrepancyNote: receiveForm.discrepancyNote || undefined
      });
      if (res.status === 'success') {
        showToast(`GRN completed — ${qty} units received`, 'success');
        playSound('success');
        loadGRN(selected);
        loadGRNs();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Receiving failed', 'error'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const g = detail;
    if (!g) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goods Receipt Form - ${g.grn_no}</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #111; }
    .header-title { color: #065F46; font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 5px; font-style: italic; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #065F46; color: white; border: 1px solid #000; padding: 10px; font-size: 13px; text-align: left; }
    td { border: 1px solid #000; padding: 12px; font-size: 13px; }
    @media print { @page { margin: 15mm; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #065F46; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print</button>
  </div>
  <div class="header-title">Goods Receipt Form</div>
  <div style="text-align: center; font-size: 12px; color: #666; margin-bottom: 30px;">Model 19</div>

  <div class="meta-grid">
    <div><strong>Receipt No.:</strong> ${g.grn_no}</div>
    <div><strong>Receipt Date:</strong> ${new Date(g.received_at || g.created_at).toLocaleDateString()}</div>
    <div><strong>Supplier:</strong> Internal Store</div>
    <div><strong>Purchase Order (optional):</strong> ${g.iss_no || '—'}</div>
    <div><strong>Warehouse:</strong> Pharmacy</div>
    <div><strong>Received By:</strong> ${g.received_by_name || '—'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Quantity</th>
        <th style="text-align:center;">Unit</th>
        <th style="text-align:center;">Unit Cost</th>
        <th style="text-align:center;">Batch/Lot No.</th>
        <th style="text-align:center;">Expiry Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${g.drug_name}</td>
        <td style="text-align:center;">${g.quantity_received || g.quantity_expected}</td>
        <td style="text-align:center;">${g.unit_of_measure || 'Units'}</td>
        <td style="text-align:center;">—</td>
        <td style="text-align:center;">—</td>
        <td style="text-align:center;">—</td>
      </tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>

  <div style="font-size: 14px;">
    <strong>Remarks:</strong> ${g.discrepancy_note || g.condition || '—'}
  </div>

  <script>
    setTimeout(() => { window.print(); }, 500);
  </script>
</body>
</html>`);
    w.document.close();
  };

  const pendingGRNs = grns.filter(g => g.status === 'PENDING');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setTab('list')} style={tabBtn(tab === 'list')}><Package size={16} /> Goods Receiving Notes</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
        <Truck size={20} color="#059669" />
        <span style={{ fontSize: 14, color: '#1E293B', fontWeight: 600 }}>Model 19 — Goods Receiving Note (GRN)</span>
        {pendingGRNs.length > 0 && <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{pendingGRNs.length} pending</span>}
      </div>

      {tab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '70vh', overflow: 'auto' }}>
            {grns.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No GRNs yet</div>
            ) : grns.map(g => {
              const badge = STATUS_BADGES[g.status] || {};
              return (
                <div key={g.id} onClick={() => { setSelected(g.id); loadGRN(g.id); setTab('detail'); }} style={{
                  padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                  background: selected === g.id ? '#F0FDF4' : 'white',
                  borderLeft: selected === g.id ? '3px solid #059669' : '3px solid transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#1E293B' }}>{g.grn_no}</strong>
                    <span style={{ background: badge.bg, color: badge.color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{badge.text}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{g.drug_name}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                    <span>Expected: {g.quantity_expected}</span>
                    <span>Received: {g.quantity_received || 0}</span>
                    <span>{g.iss_no}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', position: 'relative', minHeight: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {!detail ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1, color: '#94A3B8', fontSize: 13 }}>Select a GRN</div>
            ) : (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <button onClick={handlePrint} style={{ position: 'absolute', top: 16, right: 16, padding: '8px 14px', background: '#065F46', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Print</button>
                
                <h2 style={{ color: '#065F46', fontSize: 24, fontStyle: 'italic', fontWeight: 800, textAlign: 'center', margin: '0 0 5px 0' }}>Goods Receipt Form</h2>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748B', marginBottom: 24 }}>Model 19</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13, marginBottom: 24, color: '#1E293B' }}>
                  <div><strong>Receipt No.:</strong> {detail.grn_no}</div>
                  <div><strong>Receipt Date:</strong> {new Date(detail.received_at || detail.created_at).toLocaleDateString()}</div>
                  <div><strong>Supplier:</strong> Internal Store</div>
                  <div><strong>Purchase Order (optional):</strong> {detail.iss_no || '—'}</div>
                  <div><strong>Warehouse:</strong> Pharmacy</div>
                  <div><strong>Received By:</strong> {detail.received_by_name || '—'}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1E293B', marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: '#065F46', color: 'white' }}>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Item</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Unit</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Unit Cost</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Batch/Lot No.</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13 }}>{detail.drug_name}</td>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{detail.quantity_received || detail.quantity_expected}</td>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{detail.unit_of_measure || 'Units'}</td>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>—</td>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>—</td>
                      <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>—</td>
                    </tr>
                    {[...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ fontSize: 13, color: '#1E293B', marginBottom: 24 }}>
                  <strong>Remarks:</strong> {detail.discrepancy_note || detail.condition || '—'}
                </div>

                <div style={{ flex: 1 }}></div>

                {detail.status === 'PENDING' && (
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '16px', border: '1px solid #E2E8F0', marginTop: 'auto' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={18} color="#059669" /> Confirm Receipt & Update Stock
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Quantity Received *</label>
                        <input type="number" min="0" value={receiveForm.quantityReceived}
                          onChange={(e) => setReceiveForm(f => ({ ...f, quantityReceived: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Condition</label>
                        <select value={receiveForm.condition} onChange={(e) => setReceiveForm(f => ({ ...f, condition: e.target.value }))} style={inputStyle}>
                          <option value="Good">Good</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Discrepancy Note</label>
                      <input value={receiveForm.discrepancyNote}
                        onChange={(e) => setReceiveForm(f => ({ ...f, discrepancyNote: e.target.value }))}
                        placeholder={detail.quantity_received !== detail.quantity_expected ? ('Expected ' + detail.quantity_expected) : 'No discrepancy'}
                        style={inputStyle} />
                    </div>
                    <button onClick={handleReceive} disabled={loading} style={{
                      width: '100%', padding: '12px 24px', background: '#059669', color: 'white', border: 'none',
                      borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}><CheckCircle size={18} /> {loading ? 'Processing...' : 'CONFIRM RECEIPT'}</button>
                  </div>
                )}

                {detail.status === 'COMPLETED' && (
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669' }}>
                        <CheckCircle size={24} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>Receipt Completed</div>
                          <div style={{ fontSize: 12 }}>Stock updated: {detail.pharmacy_stock_before} → {detail.pharmacy_stock_after}</div>
                        </div>
                     </div>
                     {detail.stamp_id && <CEOStampSignature stamp={{ stamp_id: detail.stamp_id, approved_by_name: detail.received_by_name, role: 'Pharmacy Manager', timestamp: detail.received_at, document_id: detail.id }} signerName={detail.received_by_name} label="RECEIVED" />}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 };
const tabBtn = (active) => ({ padding: '10px 20px', borderRadius: 8, border: active ? '2px solid #059669' : '1px solid #E2E8F0', background: active ? '#ECFDF5' : 'white', color: active ? '#065F46' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 });

export default GRNForm;
