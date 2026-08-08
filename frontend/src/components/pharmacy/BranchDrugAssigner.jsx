import React, { useState, useEffect, useCallback } from 'react';
import { Building, Pill, Loader2, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';

const BranchDrugAssigner = ({ title = 'Branch Inventory Setup', onAssigned, defaultBranchId = '' }) => {
  const [branches, setBranches] = useState([]);
  const [allDrugs, setAllDrugs] = useState([]);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [drugId, setDrugId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [globalInventory, setGlobalInventory] = useState([]); // Array of all inventory items across all branches

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: bData }, { data: dData }] = await Promise.all([
        apiClient.get('/pharmacy/branches'),
        apiClient.get('/pharmacy/products/all')
      ]);
      const branchList = bData?.data || bData || [];
      setBranches(branchList);
      setAllDrugs(dData?.data || []);
      
      const invPromises = branchList.map(b => apiClient.get(`/pharmacy/branch-inventory/${b.id}`));
      const invResults = await Promise.allSettled(invPromises);
      
      const allItems = [];
      invResults.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          const items = Array.isArray(res.value.data) ? res.value.data : res.value.data?.data || [];
          items.forEach(i => allItems.push({ ...i, branch_id: branchList[idx].id }));
        }
      });
      setGlobalInventory(allItems);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetQty = async () => {
    if (!branchId || !drugId) return;
    setSaving(true);
    try {
      const body = {
        branch_id: parseInt(branchId),
        drug_id: parseInt(drugId),
        quantity: parseInt(quantity) || 0,
      };
      const { data } = await apiClient.put('/pharmacy/branch-drugs/set-quantity', body);
      setMsg({ type: 'success', text: data?.message || 'Quantity assigned' });
      await loadData(); // Reload to get fresh unassigned stock
      if (onAssigned) onAssigned();
      setDrugId('');
      setBranchId('');
      setQuantity(0);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || e.message });
    }
    setSaving(false);
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  // Compute unassigned stock for each drug
  const drugsWithUnassigned = allDrugs.map(d => {
    const assignedSum = globalInventory.filter(i => i.drug_id === d.id).reduce((sum, i) => sum + i.quantity, 0);
    const totalStock = d.stock_quantity || 0;
    const unassigned = Math.max(0, totalStock - assignedSum);
    return { ...d, unassigned };
  });

  const availableDrugs = drugsWithUnassigned.filter(d => d.unassigned > 0);
  const selectedDrug = drugsWithUnassigned.find(d => d.id === parseInt(drugId));
  const currentBranchStock = selectedDrug && branchId ? globalInventory.find(i => i.drug_id === parseInt(drugId) && i.branch_id === parseInt(branchId)) : null;

  useEffect(() => {
    if (selectedDrug && !quantity) {
      setQuantity(selectedDrug.unassigned);
    }
  }, [drugId, selectedDrug]);

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {msg.text && (
        <div style={{ marginBottom: 12, padding: '10px 16px', borderRadius: 10, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {msg.text}
        </div>
      )}
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Building size={17} color="#059669" /> {title}
      </h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220, flex: 2 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>1. Select Drug</label>
          <select value={drugId} onChange={e => { setDrugId(e.target.value); setQuantity(0); }} disabled={loading}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', outline: 'none' }}>
            <option value="">{loading ? 'Loading...' : 'Select unassigned drug...'}</option>
            {availableDrugs.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}{d.generic_name ? ` (${d.generic_name})` : ''} - Unassigned: {d.unassigned}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>2. Select Branch</label>
          <select value={branchId} onChange={e => setBranchId(e.target.value)} disabled={!drugId}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', outline: 'none' }}>
            <option value="">Select branch...</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div style={{ width: 100 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>3. Quantity</label>
          <input type="number" min={1} max={selectedDrug?.unassigned || 0} value={quantity} onChange={e => setQuantity(Math.min(parseInt(e.target.value) || 0, selectedDrug?.unassigned || 0))} disabled={!drugId}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSetQty} disabled={!branchId || !drugId || quantity <= 0 || saving}
          style={{ padding: '10px 20px', background: branchId && drugId && quantity > 0 && !saving ? '#059669' : '#e2e8f0', color: branchId && drugId && quantity > 0 && !saving ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: branchId && drugId && quantity > 0 && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
          {saving ? <SegmentedSpinner size={16} /> : <Pill size={16} />}
          {saving ? 'Saving...' : 'Assign Drug'}
        </button>
      </div>
      {selectedDrug && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>Available Unassigned Stock: <strong style={{ color: '#059669' }}>{selectedDrug.unassigned}</strong></span>
          {currentBranchStock && <span>Already in selected branch: <strong style={{ color: '#0369a1' }}>{currentBranchStock.quantity}</strong> (will be added to)</span>}
        </div>
      )}
      {!loading && availableDrugs.length === 0 && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#065f46' }}>
          All drugs are fully assigned to branches. No unassigned stock available.
        </div>
      )}
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default BranchDrugAssigner;
