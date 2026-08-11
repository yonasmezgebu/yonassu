import React, { useState, useEffect } from 'react';
import './StockOperations.css'; // Use the shared CSS for enterprise design
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layers, RefreshCw, Plus, CheckCircle, XCircle, AlertTriangle, Search, Package, Send, Clock, Image as ImageIcon, Edit3, Building, GitBranch } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import apiClient from '../../services/apiClient';
import infoSound from '../../assets/notification/info.mp3';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const PharmacyStockView = ({ hideHeader = false, refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/pharmacy-worker') ? '/pharmacy-worker' : '/pharmacy';
  
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('filter') === 'low-stock' ? '' : '');
  const [filterMode, setFilterMode] = useState(searchParams.get('filter') || '');
  
  const [adjusting, setAdjusting] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pendingReqs, setPendingReqs] = useState([]);
  
  const [branchInventory, setBranchInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchStockLoading, setBranchStockLoading] = useState(false);
  const [assigningCell, setAssigningCell] = useState(null); // { drug_id, branch_id }
  const [cellQty, setCellQty] = useState(100);
  const [sourceBranchId, setSourceBranchId] = useState(null);

  const [workerCanAdjust, setWorkerCanAdjust] = useState(false);
  const [togglingSetting, setTogglingSetting] = useState(false);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
      loadBranchStock();
    }
  }, [refreshTrigger]);

  const loadBranchStock = async () => {
    if (!isManager) return; // workers don't need branch assignment view
    setBranchStockLoading(true);
    try {
      const branchesRes = await apiClient.get('/pharmacy/branches');
      const branchList = Array.isArray(branchesRes) ? branchesRes : branchesRes?.data || [];
      setBranches(branchList);
      
      const invPromises = branchList.map(b => apiClient.get(`/pharmacy/branch-inventory/${b.id}`).catch(() => ({ data: [] })));
      const results = await Promise.all(invPromises);
      
      const drugMap = {};
      const addInv = (branchId, items) => {
        for (const item of items) {
          if (!drugMap[item.drug_id]) drugMap[item.drug_id] = { branches: {} };
          drugMap[item.drug_id].branches[branchId] = item.quantity;
        }
      };
      
      branchList.forEach((b, i) => {
        const inv = Array.isArray(results[i].data) ? results[i].data : results[i].data?.data || [];
        addInv(b.id, inv);
      });
      
      setBranchInventory(drugMap);
    } catch (e) { console.error('Branch stock load error:', e.message); }
    finally { setBranchStockLoading(false); }
  };

  const handleAssignCell = async (drug_id, branch_id, qty) => {
    try {
      const body = { branch_id, drug_id, quantity: qty };
      if (sourceBranchId) body.transfer_from_branch_id = sourceBranchId;
      const resp = await apiClient.put('/pharmacy/branch-drugs/set-quantity', body);
      setMsg({ type: 'success', text: resp?.data?.message || 'Drug quantity updated' });
      setAssigningCell(null);
      setSourceBranchId(null);
      loadBranchStock();
    } catch (e) {
      const errData = e.response?.data;
      if (errData?.data?.branches) setSourceBranchId(null);
      setMsg({ type: 'error', text: errData?.message || e.message });
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUnassignCell = async (drug_id, branch_id) => {
    try {
      await apiClient.put('/pharmacy/branch-drugs/set-quantity', { branch_id, drug_id, quantity: 0 });
      setMsg({ type: 'success', text: 'Drug removed from branch' });
      loadBranchStock();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || e.message });
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await pharmacyService.getAllProducts();
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.products || [];
      setDrugs(list.map(p => ({
        id: p.id, name: p.name, category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.price || 0), stock: parseInt(p.stock_quantity || 0),
        reorder: parseInt(p.reorder_level || 10), image: p.drug_image || p.cover_image || null,
        strength: p.strength, unit: p.unit
      })));

      if (isManager) {
        try {
          const reqRaw = await pharmacyService.getManagerRequests();
          const reqList = Array.isArray(reqRaw) ? reqRaw : reqRaw?.data || [];
          setPendingReqs(reqList.filter(r => r.status === 'PENDING'));
        } catch (reqErr) { console.warn('Could not load manager requests', reqErr); }
      }

      try {
        const settingRes = await pharmacyService.getWorkerAdjustStockSetting();
        setWorkerCanAdjust(settingRes?.data?.enabled ?? false);
      } catch (err) { console.error('Failed to load worker adjust setting', err); }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load pharmacy stock');
      setDrugs([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); loadBranchStock(); }, []);

  const playSound = () => { try { const a = new Audio(infoSound); a.play(); } catch {} };

  const handleToggleWorkerAdjust = async () => {
    setTogglingSetting(true);
    try {
      const newValue = !workerCanAdjust;
      await pharmacyService.updateWorkerAdjustStockSetting(newValue);
      setWorkerCanAdjust(newValue);
      setMsg({ type: 'success', text: `Worker adjusting is now ${newValue ? 'ENABLED' : 'DISABLED'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update setting' });
    } finally {
      setTogglingSetting(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const doRequest = async () => {
    if (!adjusting || !adjQty || !adjReason.trim()) return;
    setSaving(true);
    try {
      await pharmacyService.createManagerRequest({
        drug_name: adjusting.name, drug_id: adjusting.id, drug_image: adjusting.image,
        request_type: 'QUANTITY', current_value: adjusting.stock,
        requested_value: parseInt(adjQty), reason: adjReason.trim()
      });
      setPendingReqs(prev => [...prev, { drug_id: adjusting.id, status: 'PENDING' }]);
      setMsg({ type: 'success', text: `Request sent to CEO for ${adjusting.name}` });
      playSound();
      setAdjusting(null); setAdjQty(''); setAdjReason('');
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to send request' });
    } finally { setSaving(false); setTimeout(() => setMsg({ type: '', text: '' }), 3000); }
  };

  const isPending = (drugId) => pendingReqs.some(r => Number(r.drug_id) === Number(drugId));

  const filtered = drugs.filter(d => {
    if (filterMode === 'low-stock' && d.stock > d.reorder) return false;
    return !search || d.name.toLowerCase().includes(search.toLowerCase());
  });

  const content = (
    <div className="card-container" style={{ padding: 0, overflow: 'hidden' }}>
      
      {/* Toast */}
      {msg.text && (
        <div className={`toast ${msg.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ margin: '16px 20px', background: msg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', border: `1px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {msg.text}
        </div>
      )}

      {filterMode === 'low-stock' && (
        <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', margin: '16px 20px', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: 'var(--color-warning)' }}>
          <AlertTriangle size={18} />
          Showing low-stock items only
          <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }} onClick={() => { setFilterMode(''); window.history.replaceState({}, '', '/pharmacy/pharmacy-stock'); }}>Clear filter</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="toolbar" style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        
        <button onClick={() => navigate(`${basePath}/medicines`)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={14} /> Drug Catalog
        </button>

        {isManager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px', background: workerCanAdjust ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${workerCanAdjust ? 'var(--color-success)' : 'var(--color-danger)'}`, borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: workerCanAdjust ? 'var(--color-success)' : 'var(--color-danger)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Worker Adjust</span>
              <span style={{ fontSize: 11, color: workerCanAdjust ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>{workerCanAdjust ? '✓ ON' : '✗ OFF'}</span>
            </div>
            <input 
              type="checkbox"
              checked={workerCanAdjust}
              onChange={handleToggleWorkerAdjust}
              disabled={togglingSetting}
              style={{ width: 16, height: 16, cursor: togglingSetting ? 'not-allowed' : 'pointer' }}
            />
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '16px 20px', margin: '16px 20px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <XCircle size={20} color="var(--color-danger)" />
          <span style={{ color: 'var(--color-danger)', fontWeight: 500, flex: 1 }}>{error}</span>
          <button onClick={loadData} className="btn-primary">Retry</button>
        </div>
      )}

      {/* Main Stock Table */}
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Drug Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reorder Lvl</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><SegmentedSpinner size={32} /></div>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 12 }}>Loading stock...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                <Package size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>No stock items found</p>
              </td></tr>
            ) : filtered.map((drug, idx) => {
              const stockStatus = drug.stock <= 0 ? 'out' : drug.stock < drug.reorder ? 'low' : 'ok';
              const hasPending = isPending(drug.id);
              return (
                <tr key={drug.id} style={{ background: stockStatus === 'out' ? 'var(--color-danger-bg)' : stockStatus === 'low' ? 'var(--color-warning-bg)' : 'var(--color-bg-card)' }}>
                  <td>
                    {drug.image ? (
                      <img src={`http://localhost:5000${drug.image}`} alt={drug.name}
                        style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block', border: '1px solid var(--color-border)' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', display: drug.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={16} color="var(--color-text-muted)" />
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {drug.name}
                      {stockStatus !== 'ok' && <AlertTriangle size={14} color={stockStatus === 'out' ? 'var(--color-danger)' : 'var(--color-warning)'} />}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{drug.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: stockStatus === 'out' ? 'var(--color-danger)' : stockStatus === 'low' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {drug.stock}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{drug.reorder}</td>
                  <td style={{ textAlign: 'center' }}>
                    {hasPending ? (
                      <span className="badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
                        <Clock size={12} /> CEO Review
                      </span>
                    ) : adjusting?.id === drug.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="Qty" style={{ width: 70 }} />
                          <button onClick={doRequest} disabled={saving || !adjQty || !adjReason.trim()} className="btn-primary" style={{ padding: '0 10px' }}>
                            {saving ? <SegmentedSpinner size={12} /> : <Send size={12} />}
                          </button>
                          <button onClick={() => setAdjusting(null)} disabled={saving} style={{ padding: '0 8px' }}>✕</button>
                        </div>
                        <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Reason for CEO..." style={{ width: '100%', maxWidth: 200 }} />
                      </div>
                    ) : (
                      (isManager || workerCanAdjust) ? (
                        <button onClick={() => { setAdjusting(drug); setAdjQty(String(drug.stock)); setAdjReason(''); }} style={{ height: 28, padding: '0 10px', fontSize: 12 }}>
                          <Edit3 size={12} /> Adjust
                        </button>
                      ) : (
                        <span className="badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-muted)' }}>🔒 Locked</span>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Branch Stock Overview */}
      {isManager && (
        <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-primary)' }}>
              <GitBranch size={18} color="var(--color-primary)" /> Branch Stock Distribution
            </span>
            <span className="badge" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              {branchStockLoading ? 'Loading...' : `${branches.length} branches`}
            </span>
          </div>
          
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Strength</th>
                  {branches.map(b => (
                    <th key={b.id} style={{ textAlign: 'center' }}>
                      <Building size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{b.name}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', borderLeft: '1px dashed var(--color-border)' }}>Unassigned</th>
                  <th style={{ textAlign: 'center' }}>Total Stock</th>
                </tr>
              </thead>
              <tbody>
                {branchStockLoading ? (
                  <tr><td colSpan={branches.length + 4} style={{ padding: '40px 24px', textAlign: 'center' }}><SegmentedSpinner size={28} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={branches.length + 4} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No branch stock data</td></tr>
                ) : filtered.map((drug, idx) => {
                  const itemBranchData = branchInventory[drug.id]?.branches || {};
                  const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + q, 0);
                  const unassigned = Math.max(0, drug.stock - branchTotal);
                  return (
                    <tr key={drug.id}>
                      <td style={{ fontWeight: 500 }}>{drug.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{drug.strength ? `${drug.strength}${drug.unit ? ' ' + drug.unit : ''}` : '-'}</td>
                      {branches.map(b => {
                        const qty = itemBranchData[b.id] || 0;
                        const isEditing = assigningCell?.drug_id === drug.id && assigningCell?.branch_id === b.id;
                        const srcBranches = branches
                          .filter(s => s.id !== b.id && (itemBranchData[s.id] || 0) > 0)
                          .map(s => ({ ...s, available_qty: itemBranchData[s.id] }));
                        return (
                          <td key={b.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {qty > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{qty}</span>
                                {(isManager || workerCanAdjust) && (
                                  <button onClick={() => handleUnassignCell(drug.id, b.id)} style={{ padding: '2px 6px', fontSize: 10 }}>✕</button>
                                )}
                              </div>
                            ) : (
                              (isManager || workerCanAdjust) ? (
                                <button onClick={() => { setAssigningCell({ drug_id: drug.id, branch_id: b.id }); setSourceBranchId(null); setCellQty(Math.min(100, unassigned > 0 ? unassigned : drug.stock)); }} 
                                  style={{ padding: '4px 10px', fontSize: 11, background: 'transparent', border: '1px dashed var(--color-border)', cursor: 'pointer' }}>
                                  + Assign
                                </button>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                              )
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)', borderLeft: '1px dashed var(--color-border)' }}>{unassigned}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-success)' }}>{drug.stock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigningCell && (() => {
        const drug = drugs.find(d => d.id === assigningCell.drug_id);
        const branch = branches.find(b => b.id === assigningCell.branch_id);
        if (!drug || !branch) return null;

        const itemBranchData = branchInventory[drug.id]?.branches || {};
        const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + q, 0);
        const unassigned = Math.max(0, drug.stock - branchTotal);

        const srcBranches = branches
          .filter(s => s.id !== branch.id && (itemBranchData[s.id] || 0) > 0)
          .map(s => ({ ...s, available_qty: itemBranchData[s.id] }));

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card-container" style={{ width: 440, margin: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Assign Drug to Branch</h3>
                  <p style={{ color: 'var(--color-text-secondary)', margin: '2px 0 0', fontSize: 13 }}>
                    Moving <strong>{drug.name}</strong> to <strong>{branch.name}</strong>
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--color-bg-page)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Total Stock</span>
                  <strong>{drug.stock}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Unassigned (Available)</span>
                  <strong style={{ color: unassigned > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{unassigned}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Quantity to Assign</label>
                <input 
                  type="number" 
                  min={1} 
                  value={cellQty} 
                  onChange={e => setCellQty(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>

              {srcBranches.length > 0 && unassigned === 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-warning)' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    No unassigned stock. Transfer from another branch:
                  </label>
                  <select 
                    value={sourceBranchId || ''} 
                    onChange={e => setSourceBranchId(parseInt(e.target.value) || null)} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                  >
                    <option value="">-- Select Source Branch --</option>
                    {srcBranches.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Available: {s.available_qty})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => { setAssigningCell(null); setSourceBranchId(null); }}>Cancel</button>
                <button 
                  disabled={!cellQty || (unassigned === 0 && !sourceBranchId)} 
                  onClick={() => handleAssignCell(drug.id, branch.id, cellQty)} 
                  className="btn-primary"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // If hideHeader is true, we are inside StockOperations, so just return the content.
  // Otherwise, we are a standalone page (Store Inventory) and need the wrapper.
  if (hideHeader) return content;

  return (
    <div className="pso-root">
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Layers size={20} />
          </div>
          <div>
            <h1 className="pso-title">Store Inventory</h1>
            <p className="pso-subtitle">Current pharmacy stock — {drugs.length} items</p>
          </div>
        </div>
      </div>
      <div className="pso-content">
        {content}
      </div>
    </div>
  );
};

export default PharmacyStockView;
