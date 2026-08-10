import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Plus, Trash2, Building, Pill } from 'lucide-react';
import apiClient from '../../services/apiClient';
import BranchDrugAssigner from '../../components/pharmacy/BranchDrugAssigner';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BranchDrugs = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showAssign, setShowAssign] = useState(false);
  const [available, setAvailable] = useState([]);
  const [assignForm, setAssignForm] = useState({ drug_id: '', quantity: 10, reorder_level: 5, batch_no: '', expiry_date: '' });
  const [bulking, setBulking] = useState(false);
  const [bulkQty, setBulkQty] = useState(10);

  const loadBranches = async () => {
    try {
      const { data } = await apiClient.get('/pharmacy/branches');
      setBranches(data?.data || data || []);
    } catch (e) { console.error(e); }
  };

  const loadInventory = async (branchId) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/pharmacy/branch-inventory/${branchId}`);
      setInventory(data?.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { loadInventory(selectedBranch); }, [selectedBranch]);

  const loadAvailable = async () => {
    try {
      const { data } = await apiClient.get(`/pharmacy/branch-inventory/${selectedBranch}/available`);
      setAvailable(data?.data || []);
    } catch (e) { setAvailable([]); }
  };

  const openAssign = () => { loadAvailable(); setShowAssign(true); };

  const handleAssign = async () => {
    if (!assignForm.drug_id) return;
    try {
      await apiClient.post('/pharmacy/branch-drugs/assign', {
        branch_id: parseInt(selectedBranch),
        drug_id: parseInt(assignForm.drug_id),
        quantity: parseInt(assignForm.quantity),
        reorder_level: parseInt(assignForm.reorder_level),
        batch_no: assignForm.batch_no || null,
        expiry_date: assignForm.expiry_date || null,
      });
      setMsg({ type: 'success', text: 'Drug assigned to branch' });
      setShowAssign(false);
      setAssignForm({ drug_id: '', quantity: 10, reorder_level: 5, batch_no: '', expiry_date: '' });
      loadInventory(selectedBranch);
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this drug from branch?')) return;
    try {
      await apiClient.delete(`/pharmacy/branch-drugs/${id}`);
      setMsg({ type: 'success', text: 'Drug removed from branch' });
      loadInventory(selectedBranch);
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUpdateQty = async (id, quantity) => {
    try {
      await apiClient.put(`/pharmacy/branch-drugs/${id}`, { quantity: parseInt(quantity) });
      loadInventory(selectedBranch);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const handleBulkAssign = async () => {
    if (!window.confirm(`Assign ALL drugs to ${branches.find(b => b.id === parseInt(selectedBranch))?.name} with qty ${bulkQty}?`)) return;
    setBulking(true);
    try {
      const { data } = await apiClient.post('/pharmacy/branch-drugs/bulk-assign', {
        branch_id: parseInt(selectedBranch),
        quantity: bulkQty || 10
      });
      setMsg({ type: 'success', text: data?.message || 'Bulk assign done' });
      loadInventory(selectedBranch);
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || e.message }); }
    setBulking(false);
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const branch = branches.find(b => b.id === parseInt(selectedBranch));

  return (
    <div className="p-6" style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#eff6ff 100%)' }}>
      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', borderRadius: 12, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {msg.text}
        </div>
      )}

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
          <Building size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Branch Drug Assignment</h1>
          <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Manage which drugs belong to each branch</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}><BranchDrugAssigner title="Quick Assign" /></div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', minWidth: 200, outline: 'none' }}>
          <option value="">Select branch...</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {selectedBranch && (
          <>
            <button onClick={openAssign} style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Assign Drug
            </button>
            <input type="number" min={1} value={bulkQty} onChange={e => setBulkQty(parseInt(e.target.value) || 10)}
              placeholder="Qty"
              style={{ width: 70, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
            <button onClick={handleBulkAssign} disabled={bulking} style={{ padding: '10px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: bulking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {bulking ? <Loader2 size={15} /> : <Plus size={15} />} {bulking ? 'Assigning...' : 'Assign All Drugs'}
            </button>
            <button onClick={() => loadInventory(selectedBranch)} style={{ padding: '10px 14px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        )}
      </div>

      {showAssign && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Assign Drug to {branch?.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Drug *</label>
              <select value={assignForm.drug_id} onChange={e => setAssignForm({...assignForm, drug_id: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', outline: 'none' }}>
                <option value="">Select drug...</option>
                {available.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.strength ? `(${d.strength} ${d.unit || ''})` : ''} — {d.generic_name || ''}
                  </option>
                ))}
                {available.length === 0 && <option disabled>No unassigned drugs</option>}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Quantity</label>
              <input type="number" value={assignForm.quantity} onChange={e => setAssignForm({...assignForm, quantity: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Reorder Level</label>
              <input type="number" value={assignForm.reorder_level} onChange={e => setAssignForm({...assignForm, reorder_level: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Batch No</label>
              <input type="text" value={assignForm.batch_no} onChange={e => setAssignForm({...assignForm, batch_no: e.target.value})} placeholder="Optional"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Expiry Date</label>
              <input type="date" value={assignForm.expiry_date} onChange={e => setAssignForm({...assignForm, expiry_date: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={handleAssign} disabled={!assignForm.drug_id} style={{ padding: '10px 20px', background: assignForm.drug_id ? '#059669' : '#e2e8f0', color: assignForm.drug_id ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: assignForm.drug_id ? 'pointer' : 'not-allowed', fontSize: 14 }}>
              Assign to Branch
            </button>
            <button onClick={() => setShowAssign(false)} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedBranch && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
            <span style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={17} color="#059669" /> {branch?.name} — Drug Inventory ({inventory.length})
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Drug</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Strength</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Qty</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Reorder</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Batch</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Expiry</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <SegmentedSpinner size={32} />
                  </td></tr>
                ) : inventory.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <Building size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontWeight: 700, margin: 0 }}>No drugs assigned to this branch</p>
                    <p style={{ fontSize: 13, margin: '4px 0 0' }}>Click "Assign Drug" or "Assign All Drugs" to add inventory</p>
                  </td></tr>
                ) : inventory.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.strength ? `${item.strength} ${item.unit || ''}` : '-'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <input type="number" value={item.quantity} onChange={e => handleUpdateQty(item.id, e.target.value)}
                        style={{ width: 70, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, textAlign: 'right', outline: 'none' }} />
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>{item.reorder_level || 0}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13 }}>{item.batch_no || '-'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13 }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => handleRemove(item.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default BranchDrugs;
