import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, RefreshCw, Eye, Edit3, Trash2, X, Check } from 'lucide-react';
import { getTodayReceipts, updateReceipt, deleteReceipt } from '../../utils/storeApi';
import { storeSuccess, storeInfo } from '../../utils/storeNotifications';

const StoreGoodsReceivedToday = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchData = () => {
    setLoading(true);
    getTodayReceipts()
      .then(r => { setReceipts(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleView = (r) => setDetail(r);

  const handleEdit = (r) => {
    setEditId(r.id);
    setEditForm({ supplier_name: r.supplier_name || '', purchase_order_ref: r.purchase_order_ref || '', delivery_note_ref: r.delivery_note_ref || '', remarks: r.remarks || '' });
  };

  const handleEditSave = async (id) => {
    try {
      await updateReceipt(id, editForm);
      storeSuccess('Receipt Updated', 'Goods Receiving Note updated successfully');
      setEditId(null);
      fetchData();
    } catch { storeInfo('Update Failed', 'Could not update receipt'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt? Inventory will be reverted.')) return;
    try {
      const res = await deleteReceipt(id);
      if (res.success) {
        storeSuccess('Receipt Deleted', 'Goods Receiving Note deleted, inventory reverted');
        fetchData();
      } else throw new Error(res.message);
    } catch (e) { storeInfo('Delete Failed', e.message || 'Could not delete receipt'); }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#15803d' }}>
            <Inbox color="#22c55e" size={28} /> GOODS RECEIVED TODAY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Today's stock receipts — {new Date().toLocaleDateString()}</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No goods received today</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All received stock will appear here</div>
          <button onClick={() => navigate('/store/goods-receiving')} style={{ marginTop: 16, padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + New Goods Receiving
          </button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0fdf4' }}>
                {['Receipt No', 'Supplier', 'PO Ref', 'Items', 'Qty', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.receipt_no}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.supplier_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.purchase_order_ref || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>{(r.items || []).length} item(s)</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{(r.items || []).reduce((s, i) => s + Number(i.quantity), 0)}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{new Date(r.created_at).toLocaleTimeString()}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleView(r)} title="View Details" style={{ padding: '5px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', color: '#1d4ed8' }}><Eye size={14} /></button>
                      <button onClick={() => handleEdit(r)} title="Edit" style={{ padding: '5px 8px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', color: '#b45309' }}><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} title="Delete" style={{ padding: '5px 8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', color: '#b91c1c' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{detail.receipt_no}</h2>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: 13 }}>
              <div><strong>Supplier:</strong> {detail.supplier_name || '—'}</div>
              <div><strong>PO Ref:</strong> {detail.purchase_order_ref || '—'}</div>
              <div><strong>Delivery Note:</strong> {detail.delivery_note_ref || '—'}</div>
              <div><strong>Remarks:</strong> {detail.remarks || '—'}</div>
              <div><strong>Date:</strong> {new Date(detail.created_at).toLocaleString()}</div>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Drug</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((item, i) => (
                  <tr key={item.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px' }}>Drug #{item.drug_id}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>ETB {Number(item.unit_cost || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>ETB {Number(item.subtotal || item.quantity * (item.unit_cost || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditId(null)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Edit Receipt</h2>
            {['supplier_name', 'purchase_order_ref', 'delivery_note_ref', 'remarks'].map(f => (
              <div key={f} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{f.replace(/_/g, ' ').toUpperCase()}</label>
                <input value={editForm[f] || ''} onChange={e => setEditForm({ ...editForm, [f]: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditId(null)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={() => handleEditSave(editId)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}><Check size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreGoodsReceivedToday;
