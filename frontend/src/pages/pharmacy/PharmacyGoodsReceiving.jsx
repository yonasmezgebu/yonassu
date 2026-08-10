import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Package, Truck, Printer, CheckCircle, AlertCircle, RotateCw, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import { useToast } from '../../components/Toast';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const PharmacyGoodsReceiving = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const [filterMode] = useState(searchParams.get('filter') || '');

  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPO, setSelectedPO] = useState('');
  const [lines, setLines] = useState([]);
  const [receivedBy, setReceivedBy] = useState('Pharmacy Manager');
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [receiptsRes, productsRes] = await Promise.all([
        apiClient.get('/procurement/receipts'),
        pharmacyService.getProducts(),
      ]);
      const receiptsData = receiptsRes?.data || receiptsRes || [];
      const productsData = productsRes?.data || productsRes || [];
      const receiptsList = Array.isArray(receiptsData) ? receiptsData : [];
      const productsList = Array.isArray(productsData) ? productsData : [];
      setReceipts(receiptsList);
      setProducts(productsList);

      if (id) {
        const receipt = receiptsList.find(r => r.id === id || r._id === id || r.receipt_no === id);
        if (receipt) {
          setSelectedPO(receipt.id || receipt._id || receipt.receipt_no);
          const items = receipt.items || receipt.drugs || receipt.lines || [];
          setLines(items.map(d => ({
            id: d.id || d._id || Math.random(),
            name: d.name || d.product_name || d.drug_name || '',
            ordered: d.ordered || d.ordered_qty || 0,
            unit: d.unit || 'Unit',
            received: d.received || d.received_qty || 0,
            batchNo: d.batchNo || d.batch_number || '',
            expiry: d.expiry || d.expiry_date || '',
          })));
          setReceivedBy(receipt.receivedBy || receipt.received_by || 'Pharmacy Manager');
          setReceiveDate(receipt.date || receipt.receive_date || new Date().toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePOSelect = (poId) => {
    setSelectedPO(poId);
    const po = receipts.find(r => r.id === poId || r._id === poId || r.receipt_no === poId);
    if (po) {
      const items = po.items || po.drugs || po.lines || [];
      setLines(items.map(d => ({
        id: d.id || d._id || Math.random(),
        name: d.name || d.product_name || d.drug_name || '',
        ordered: d.ordered || d.ordered_qty || 0,
        unit: d.unit || 'Unit',
        received: d.received || d.received_qty || 0,
        batchNo: d.batchNo || d.batch_number || '',
        expiry: d.expiry || d.expiry_date || '',
      })));
    } else {
      setLines(products.map(p => ({
        id: p.id || p._id || Math.random(),
        name: p.name || p.product_name || '',
        ordered: 0,
        unit: p.unit || 'Unit',
        received: 0,
        batchNo: '',
        expiry: '',
      })));
    }
    setSubmitted(false);
  };

  const updateLine = (id, field, val) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const canSubmit = selectedPO && lines.length > 0 && lines.every(l => l.received > 0 && l.batchNo && l.expiry);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        po_reference: selectedPO,
        received_by: receivedBy,
        receive_date: receiveDate,
        items: lines.map(l => ({
          product_id: l.product_id || l.id,
          product_name: l.name,
          ordered_qty: l.ordered,
          received_qty: l.received,
          batch_no: l.batchNo,
          expiry_date: l.expiry,
          unit: l.unit,
        })),
      };
      await apiClient.post('/procurement/receipts', payload);
      setSubmitted(true);
      showToast('Goods received successfully! Inventory updated.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit receipt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const po = receipts.find(r => r.id === selectedPO || r._id === selectedPO || r.receipt_no === selectedPO);
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Goods Receiving Note</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1e293b;}h1{font-size:22px;margin:0;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;}th{background:#f1f5f9;font-size:12px;text-transform:uppercase;}td{font-size:14px;}.stamp{margin-top:60px;border-top:2px solid #0f172a;padding-top:10px;width:220px;text-align:center;font-size:13px;}</style>
    </head><body>
    <h1>Goods Receiving Note</h1>
    <p style="color:#64748b;font-size:13px;">PO Reference: <strong>${selectedPO}</strong> &nbsp;&nbsp; Supplier: <strong>${po?.supplier || 'N/A'}</strong> &nbsp;&nbsp; Date: <strong>${receiveDate}</strong></p>
    <p style="color:#64748b;font-size:13px;">Received By: <strong>${receivedBy}</strong></p>
    <table><thead><tr><th>Drug Name</th><th>Batch No</th><th>Expiry Date</th><th>Ordered</th><th>Received</th><th>Unit</th></tr></thead>
    <tbody>${lines.map(l => `<tr><td>${l.name}</td><td>${l.batchNo}</td><td>${l.expiry}</td><td>${l.ordered}</td><td>${l.received}</td><td>${l.unit}</td></tr>`).join('')}</tbody></table>
    <div class="stamp"><p>Manager Signature</p><p style="margin-top:40px;">______________________</p><p>Date: ${receiveDate}</p></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) {
    return (
      <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{100%{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <SegmentedSpinner size={24} />
          <p style={{ color: '#64748b', margin: 0 }}>Loading goods receiving data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{100%{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ textAlign: 'center', background: 'white', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Failed to Load Data</h3>
          <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: 14 }}>{error}</p>
          <button onClick={fetchData} style={{ padding: '10px 24px', background: '#224f94', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RotateCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <ToastContainer />

      <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
            <Package size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Goods Receiving</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Receive goods from purchase orders</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div style={{ animation: 'fadeSlide 0.4s ease-out', background: 'white', borderRadius: 14, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h2 style={{ color: '#059669', margin: '0 0 8px 0', fontSize: 22 }}>Goods Received Successfully!</h2>
          <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>Pharmacy inventory has been automatically updated. Batch data is now tracked in Batch Management.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={handlePrint} style={{ padding: '10px 24px', background: '#224f94', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={16} /> Print Receiving Note
            </button>
            <button onClick={() => { setSubmitted(false); setSelectedPO(''); setLines([]); }} style={{ padding: '10px 24px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              New Receiving
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 900, animation: 'fadeSlide 0.4s ease-out' }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={18} color="#224f94" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Step 1: Select Purchase Order</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Purchase Order *</label>
                  <select value={selectedPO} onChange={e => handlePOSelect(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}>
                    <option value="">Select Open PO</option>
                    {receipts.map(po => (
                      <option key={po.id || po._id || po.receipt_no} value={po.id || po._id || po.receipt_no}>
                        {po.receipt_no || po.id} {po.supplier ? `— ${po.supplier}` : ''} {po.date ? `(${po.date})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Receive Date *</label>
                  <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Received By *</label>
                  <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {selectedPO && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Supplier</label>
                    <input readOnly value={receipts.find(r => (r.id === selectedPO || r._id === selectedPO || r.receipt_no === selectedPO))?.supplier || ''} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {lines.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Step 2: Enter Received Quantities</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>Batch number and expiry date are required per drug line.</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Drug Name', 'Unit', 'Ordered Qty', 'Received Qty *', 'Batch Number *', 'Expiry Date *'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => (
                      <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{line.name}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{line.unit}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{line.ordered}</td>
                        <td style={{ padding: '8px 14px' }}>
                          <input type="number" min="0" max={line.ordered} value={line.received} onChange={e => updateLine(line.id, 'received', parseInt(e.target.value) || 0)}
                            style={{ width: 90, padding: '7px 10px', border: `1px solid ${line.received > 0 ? '#10b981' : '#e2e8f0'}`, borderRadius: 7, fontSize: 14, outline: 'none', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <input type="text" placeholder="e.g. BAT-2026-001" value={line.batchNo} onChange={e => updateLine(line.id, 'batchNo', e.target.value)}
                            style={{ width: 140, padding: '7px 10px', border: `1px solid ${line.batchNo ? '#10b981' : '#e2e8f0'}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <input type="date" value={line.expiry} onChange={e => updateLine(line.id, 'expiry', e.target.value)}
                            style={{ padding: '7px 10px', border: `1px solid ${line.expiry ? '#10b981' : '#e2e8f0'}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: 20, borderTop: '1px solid #e2e8f0' }}>
                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  style={{ padding: '12px 32px', background: canSubmit && !submitting ? '#059669' : '#e2e8f0', color: canSubmit && !submitting ? 'white' : '#94a3b8', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {submitting ? (
                    <><SegmentedSpinner size={24} /> Processing...</>
                  ) : (
                    <><CheckCircle size={18} /> Confirm Receipt & Update Inventory</>
                  )}
                </button>
                {!canSubmit && !submitting && <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#94a3b8' }}>Fill all received quantities, batch numbers and expiry dates to confirm.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyGoodsReceiving;
