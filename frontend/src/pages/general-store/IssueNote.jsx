import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import CEOStampSignature from '../../components/CEOStampSignature';
import { Truck, Printer, CheckCircle } from 'lucide-react';

const STATUS_BADGES = {
  DRAFT:     { bg: '#F1F5F9', color: '#475569', text: 'Draft' },
  ISSUED:    { bg: '#F3E8FF', color: '#6B21A8', text: 'Issued' },
  RECEIVED:  { bg: '#DBEAFE', color: '#1E40AF', text: 'Received' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46', text: 'Completed' },
};

const IssueNote = () => {
  const { id, approvalId } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [issueForm, setIssueForm] = useState({ quantityIssued: '', batchNumber: '', expiryDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVouchers();
    if (approvalId && !id) setupFromApproval(approvalId);
    if (id) loadVoucher(parseInt(id));
  }, [id, approvalId]);

  const setupFromApproval = async (aprId) => {
    try {
      const res = await apiClient.post(`/erp/issue-vouchers/create/${aprId}`);
      if (res.status === 'success') {
        setSelectedVoucher(res.data);
        setIssueForm(f => ({ ...f, quantityIssued: String(res.data.quantity_approved) }));
      }
    } catch (e) { showToast(e.response?.data?.message || 'Failed to create issue voucher', 'error'); }
  };

  const loadVouchers = async () => {
    try {
      const res = await apiClient.get('/erp/issue-vouchers');
      if (res.status === 'success') setVouchers(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadVoucher = async (vId) => {
    try {
      const res = await apiClient.get(`/erp/issue-vouchers/${vId}`);
      if (res.status === 'success') {
        setSelectedVoucher(res.data);
        setIssueForm(f => ({ ...f, quantityIssued: String(res.data.quantity_approved) }));
      }
    } catch (e) { console.error(e); }
  };

  const handleIssue = async () => {
    if (!issueForm.quantityIssued || parseInt(issueForm.quantityIssued) < 1) {
      showToast('Enter a valid quantity', 'warning'); return;
    }
    setLoading(true);
    try {
      const res = await apiClient.patch(`/erp/issue-vouchers/${selectedVoucher.id}/issue`, issueForm);
      if (res.status === 'success') {
        showToast(`Issued ${issueForm.quantityIssued} units from Store to Pharmacy`, 'success');
        playSound('info');
        sendPushNotification('Items Dispatched', `${selectedVoucher.drug_name} — ${issueForm.quantityIssued} units shipped to Pharmacy`, `/pharmacy/grn`);
        loadVoucher(selectedVoucher.id);
        loadVouchers();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Issue failed', 'error'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const v = selectedVoucher;
    if (!v) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goods Issue Form - ${v.iss_no}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #111; }
    .header-title { color: #065F46; font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 5px; font-style: italic; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #065F46; color: white; border: 1px solid #000; padding: 10px; font-size: 13px; text-align: left; }
    td { border: 1px solid #000; padding: 12px; font-size: 13px; }
    .no-print { }
    @media print { @page { margin: 15mm; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right; margin-bottom:20px;">
    <button onclick="window.print()" style="padding:8px 16px;background:#065F46;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Print</button>
  </div>
  <div class="header-title">Goods Issue Form</div>
  <div style="text-align:center;font-size:12px;color:#666;margin-bottom:30px;">Model 22</div>
  <div class="meta-grid">
    <div><strong>Issue No.:</strong> ${v.iss_no}</div>
    <div><strong>Issue Date:</strong> ${new Date(v.issued_at || v.created_at).toLocaleDateString()}</div>
    <div><strong>Department:</strong> Pharmacy</div>
    <div><strong>Requested By:</strong> ${v.req_no || '—'}</div>
    <div><strong>Approved By:</strong> ${v.apr_no || '—'}</div>
    <div><strong>Warehouse:</strong> Main Store</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Quantity</th>
        <th style="text-align:center;">Unit</th>
        <th style="text-align:center;">Purpose</th>
        <th style="text-align:center;">Batch No.</th>
        <th style="text-align:center;">Expiry Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${v.drug_name}</td>
        <td style="text-align:center;">${v.quantity_issued || v.quantity_approved}</td>
        <td style="text-align:center;">${v.unit_of_measure || 'Units'}</td>
        <td style="text-align:center;">Dispensing</td>
        <td style="text-align:center;">${v.batch_number || '—'}</td>
        <td style="text-align:center;">${v.expiry_date ? new Date(v.expiry_date).toLocaleDateString() : '—'}</td>
      </tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td><br></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>
  <div style="font-size:14px;margin-bottom:30px;"><strong>Remarks:</strong> —</div>
  <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:13px;">
    <div><strong>Issued By:</strong><br>${v.issued_by_name || 'Store Manager'}<br><br>Signature: _________________</div>
    <div style="text-align:right;"><strong>Received By (Pharmacy):</strong><br>_________________________<br><br>Signature: _________________</div>
  </div>
  <script>setTimeout(() => { window.print(); }, 500);</script>
</body>
</html>`);
    w.document.close();
  };

  const pendingCount = vouchers.filter(v => v.status === 'DRAFT').length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', alignItems: 'center' }}>
        <Truck size={20} color="#6B21A8" />
        <h2 style={{ margin: 0, color: '#1E293B', fontSize: 24, fontWeight: 700 }}>Goods Issue</h2>
        {pendingCount > 0 && (
          <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Split screen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* LEFT: voucher list */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '70vh', overflow: 'auto' }}>
          {vouchers.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No issue vouchers found</div>
          ) : vouchers.map(v => {
            const badge = STATUS_BADGES[v.status] || {};
            const isSelected = selectedVoucher && selectedVoucher.id === v.id;
            return (
              <div key={v.id} onClick={() => loadVoucher(v.id)} style={{
                padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                background: isSelected ? '#FAF5FF' : 'white',
                borderLeft: isSelected ? '3px solid #6B21A8' : '3px solid transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#1E293B' }}>{v.iss_no}</strong>
                  <span style={{ background: badge.bg, color: badge.color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{badge.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>{v.drug_name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                  <span>Qty: {v.quantity_issued || v.quantity_approved}</span>
                  <span>{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: paper form */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', position: 'relative', minHeight: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {!selectedVoucher ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1, color: '#94A3B8', fontSize: 13 }}>
              Select an issue voucher to view
            </div>
          ) : (
            <div style={{ padding: '2rem', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Print button — only when issued */}
              {selectedVoucher.status !== 'DRAFT' && (
                <button onClick={handlePrint} style={{ position: 'absolute', top: 16, right: 16, padding: '8px 14px', background: '#065F46', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={14} /> Print
                </button>
              )}

              {/* Paper heading */}
              <h2 style={{ color: '#065F46', fontSize: 24, fontStyle: 'italic', fontWeight: 800, textAlign: 'center', margin: '0 0 5px 0' }}>Goods Issue Form</h2>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#64748B', marginBottom: 24 }}>Model 22</div>

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13, marginBottom: 24, color: '#1E293B' }}>
                <div><strong>Issue No.:</strong> {selectedVoucher.iss_no}</div>
                <div><strong>Issue Date:</strong> {new Date(selectedVoucher.issued_at || selectedVoucher.created_at).toLocaleDateString()}</div>
                <div><strong>Department:</strong> Pharmacy</div>
                <div><strong>Requested By:</strong> {selectedVoucher.req_no || '—'}</div>
                <div><strong>Approved By:</strong> {selectedVoucher.apr_no || '—'}</div>
                <div><strong>Warehouse:</strong> Main Store</div>
              </div>

              {/* Item table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1E293B', marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: '#065F46', color: 'white' }}>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Unit</th>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Batch No.</th>
                    <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13 }}>{selectedVoucher.drug_name}</td>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{selectedVoucher.quantity_issued || selectedVoucher.quantity_approved}</td>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{selectedVoucher.unit_of_measure || 'Units'}</td>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>Dispensing</td>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{selectedVoucher.batch_number || '—'}</td>
                    <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{selectedVoucher.expiry_date ? new Date(selectedVoucher.expiry_date).toLocaleDateString() : '—'}</td>
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
                <strong>Remarks:</strong> —
              </div>

              <div style={{ flex: 1 }}></div>

              {/* Action panel for DRAFT vouchers */}
              {selectedVoucher.status === 'DRAFT' && (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '16px', border: '1px solid #E2E8F0', marginTop: 'auto' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={18} color="#6B21A8" /> Issue Items & Deduct Stock
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Quantity to Issue *</label>
                      <input type="number" min="1" max={selectedVoucher.quantity_approved}
                        value={issueForm.quantityIssued}
                        onChange={e => setIssueForm(f => ({ ...f, quantityIssued: e.target.value }))}
                        style={inputStyle} />
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Max: {selectedVoucher.quantity_approved}</div>
                    </div>
                    <div>
                      <label style={labelStyle}>Batch Number</label>
                      <input value={issueForm.batchNumber}
                        onChange={e => setIssueForm(f => ({ ...f, batchNumber: e.target.value }))}
                        style={inputStyle} placeholder="Optional" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Expiry Date</label>
                    <input type="date" value={issueForm.expiryDate}
                      onChange={e => setIssueForm(f => ({ ...f, expiryDate: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <button onClick={handleIssue} disabled={loading} style={{
                    width: '100%', padding: '12px 24px', background: '#6B21A8', color: 'white',
                    border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    <Truck size={18} /> {loading ? 'Processing...' : 'ISSUE ITEMS & DEDUCT STOCK'}
                  </button>
                </div>
              )}

              {/* Issued stamp */}
              {selectedVoucher.status !== 'DRAFT' && (
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B21A8' }}>
                    <CheckCircle size={24} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Issued by: {selectedVoucher.issued_by_name || 'Store Manager'}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Stock: {selectedVoucher.store_stock_before} → {selectedVoucher.store_stock_after}</div>
                    </div>
                  </div>
                  {selectedVoucher.stamp_id && (
                    <CEOStampSignature
                      stamp={{ stamp_id: selectedVoucher.stamp_id, approved_by_name: selectedVoucher.issued_by_name, role: 'Store Manager', timestamp: selectedVoucher.issued_at, document_id: selectedVoucher.id }}
                      signerName={selectedVoucher.issued_by_name}
                      label="ISSUED"
                    />
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, boxSizing: 'border-box' };

export default IssueNote;
