import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { Package, AlertTriangle, CheckCircle, Clock, Plus, RotateCcw, X, Camera } from 'lucide-react';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

const statusStyle = (status) => {
  const map = {
    active: { bg: '#ecfdf5', color: '#10b981' },
    overdue: { bg: '#fef2f2', color: '#ef4444' },
    returned: { bg: '#f8fafc', color: '#64748b' },
    pending: { bg: '#fffbeb', color: '#d97706' },
    approved: { bg: '#ecfdf5', color: '#10b981' },
    rejected: { bg: '#fef2f2', color: '#ef4444' },
    issued: { bg: '#eff6ff', color: '#3b82f6' },
    cancelled: { bg: '#f8fafc', color: '#94a3b8' },
  };
  return map[status] || { bg: '#f8fafc', color: '#64748b' };
};

const StatusBadge = ({ status }) => {
  const s = statusStyle(status);
  return (
    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: s.bg, color: s.color }}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Return Modal ---
const ReturnModal = ({ material, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    assigned_material_id: material?.id || '',
    quantity_returned: material?.quantity || 1,
    condition: 'good',
    notes: '',
    photos: []
  });
  const [photoAdded, setPhotoAdded] = useState(false);

  const needsPhoto = form.condition === 'damaged' || form.condition === 'lost';

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      onSubmit(form);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '460px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Return Item</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        {material && (
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: '#475569' }}>
            Returning: <strong>{material.item_name}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Condition</label>
            <select required value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}>
              <option value="good">Good</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {needsPhoto && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>
                <Camera size={14} style={{ marginRight: '4px' }} />
                Photo Evidence (Required for Damaged/Lost)
              </label>
              <div
                onClick={() => { setPhotoAdded(true); setForm({ ...form, photos: ['evidence_photo.jpg'] }); }}
                style={{ padding: '20px', border: `2px dashed ${photoAdded ? '#10b981' : '#ef4444'}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', backgroundColor: photoAdded ? '#ecfdf5' : '#fef2f2', color: photoAdded ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                {photoAdded ? '✓ Photo attached' : 'Click to attach photo'}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Notes</label>
            <textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
              Submit Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 11. Assigned Materials ---
export const AssignedMaterials = ({ preSelectReturn }) => {
  const [materials, setMaterials] = useState([]);
  const [returnModal, setReturnModal] = useState(null);

  useEffect(() => {
    const fetch = () => setMaterials(employeePortalState.getAssignedMaterials(SESSION_EMPLOYEE_ID));
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  useEffect(() => {
    if (preSelectReturn) {
      const m = materials.find(mat => mat.id === preSelectReturn);
      if (m) setReturnModal(m);
    }
  }, [preSelectReturn, materials]);

  const handleReturn = (form) => {
    employeePortalState.returnMaterial(SESSION_EMPLOYEE_ID, form);
    setReturnModal(null);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Assigned Materials" description="Items currently assigned to you from the store." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {materials.map(m => (
          <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${m.status === 'overdue' ? '#fca5a5' : '#e2e8f0'}`, padding: '24px', position: 'relative' }}>
            {m.status === 'overdue' && (
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{m.item_name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{m.category.replace('_', ' ')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Assigned</span>
                <span style={{ fontWeight: '600', color: '#475569' }}>{m.assigned_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Condition</span>
                <span style={{ fontWeight: '600', color: '#475569', textTransform: 'capitalize' }}>{m.condition_at_assignment}</span>
              </div>
              {m.return_by_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Return By</span>
                  <span style={{ fontWeight: '600', color: m.status === 'overdue' ? '#ef4444' : '#475569' }}>{m.return_by_date}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <StatusBadge status={m.status} />
              </div>
            </div>

            {m.status !== 'returned' && (
              <button
                onClick={() => setReturnModal(m)}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <RotateCcw size={14} /> Mark as Returned
              </button>
            )}
          </div>
        ))}
        {materials.length === 0 && <p style={{ color: '#64748b' }}>No materials assigned.</p>}
      </div>

      {returnModal && <ReturnModal material={returnModal} onClose={() => setReturnModal(null)} onSubmit={handleReturn} />}
    </div>
  );
};

// --- 12. Request Materials ---
export const RequestMaterials = () => {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ item_name: '', category: 'electronics', quantity_required: 1, purpose: '', required_date: '', urgency: 'normal', additional_notes: '' });

  useEffect(() => {
    const fetch = () => setRequests(employeePortalState.getMaterialRequests(SESSION_EMPLOYEE_ID));
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      employeePortalState.requestMaterials(SESSION_EMPLOYEE_ID, form);
      setForm({ item_name: '', category: 'electronics', quantity_required: 1, purpose: '', required_date: '', urgency: 'normal', additional_notes: '' });
    } catch (err) { alert(err.message); }
  };

  const handleCancel = (id) => {
    try { employeePortalState.cancelMaterialRequest(SESSION_EMPLOYEE_ID, id); }
    catch (err) { alert(err.message); }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Request Materials" description="Submit a request for items from the store." />

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700' }}>New Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Item Name</label>
                <input required value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="e.g. Wireless Keyboard" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Qty</label>
                <input type="number" min="1" required value={form.quantity_required} onChange={e => setForm({ ...form, quantity_required: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="electronics">Electronics</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="furniture">Furniture</option>
                  <option value="tools">Tools</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Urgency</label>
                <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Purpose</label>
              <input required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Why do you need this?" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Required By</label>
              <input type="date" required value={form.required_date} onChange={e => setForm({ ...form, required_date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              <Plus size={18} /> Submit Request
            </button>
          </form>
        </div>

        <div style={{ width: '380px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Request History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(r => (
              <div key={r.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{r.request_number}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{r.item_name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Qty: {r.quantity_required} · {r.category}</div>
                {r.status === 'pending' && (
                  <button onClick={() => handleCancel(r.id)} style={{ marginTop: '10px', padding: '6px 12px', fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
            {requests.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>No requests yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 13. Return Items ---
export const ReturnItems = () => {
  const [materials, setMaterials] = useState([]);
  const [returns, setReturns] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [form, setForm] = useState({ condition: 'good', notes: '', photos: [] });
  const [photoAdded, setPhotoAdded] = useState(false);

  useEffect(() => {
    const fetch = () => {
      setMaterials(employeePortalState.getAssignedMaterials(SESSION_EMPLOYEE_ID).filter(m => m.status !== 'returned'));
      setReturns(employeePortalState.getMaterialReturns(SESSION_EMPLOYEE_ID));
    };
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const needsPhoto = form.condition === 'damaged' || form.condition === 'lost';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMaterial) return alert('Please select a material to return.');
    try {
      employeePortalState.returnMaterial(SESSION_EMPLOYEE_ID, {
        assigned_material_id: selectedMaterial.id,
        quantity_returned: selectedMaterial.quantity,
        ...form
      });
      setSelectedMaterial(null);
      setForm({ condition: 'good', notes: '', photos: [] });
      setPhotoAdded(false);
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Return Items" description="Log a return for items assigned to you." />

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700' }}>New Return</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Select Item to Return</label>
              <select value={selectedMaterial?.id || ''} onChange={e => setSelectedMaterial(materials.find(m => m.id === e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Choose an item --</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.item_name} (Qty: {m.quantity})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Condition at Return</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value, photos: [] }) & setPhotoAdded(false)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {needsPhoto && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>📷 Photo Evidence (Required)</label>
                <div onClick={() => { setPhotoAdded(true); setForm(f => ({ ...f, photos: ['evidence_photo.jpg'] })); }} style={{ padding: '20px', border: `2px dashed ${photoAdded ? '#10b981' : '#ef4444'}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', backgroundColor: photoAdded ? '#ecfdf5' : '#fef2f2', color: photoAdded ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {photoAdded ? '✓ Photo attached' : 'Click to attach photo'}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Notes</label>
              <textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              <RotateCcw size={18} /> Submit Return
            </button>
          </form>
        </div>

        <div style={{ width: '360px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Return History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {returns.map(r => (
              <div key={r.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{r.return_number}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ fontSize: '13px', color: '#475569' }}>Condition: <strong style={{ textTransform: 'capitalize' }}>{r.condition}</strong></div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{new Date(r.submitted_at).toLocaleString()}</div>
              </div>
            ))}
            {returns.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>No returns submitted.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
