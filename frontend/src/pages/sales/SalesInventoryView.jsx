import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layers, RefreshCw, Plus, Loader2, CheckCircle, XCircle, AlertTriangle, Search, Package, Send, Clock, Image as ImageIcon, Edit3, Building, GitBranch } from 'lucide-react';
import salesService from '../../services/salesService';
import apiClient from '../../services/apiClient';
import infoSound from '../../assets/notification/info.mp3';
import { useAuth } from '../../hooks/useAuth';

const SalesStockView = ({ hideHeader = false, themeColors, refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Sales Manager', 'Admin', 'CEO'].includes(r));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/sales-worker') ? '/sales-worker' : '/sales';
  const [products, setproducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('filter') === 'low-stock' ? '' : '');
  const [filterMode, setFilterMode] = useState(searchParams.get('filter') || '');
  const [adjusting, setAdjusting] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pendingReqs, setPendingReqs] = useState([]);
  const [branchInventory, setBranchInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchStockLoading, setBranchStockLoading] = useState(false);
  const [assigningCell, setAssigningCell] = useState(null); // { product_id, branch_id }
  const [cellQty, setCellQty] = useState(100);
  const [sourceBranchId, setSourceBranchId] = useState(null);

  const [workerCanAdjust, setWorkerCanAdjust] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      const branchesRes = await apiClient.get('/sales/branches');
      // apiClient already unwraps response.data, so branchesRes IS the data
      const branchList = Array.isArray(branchesRes) ? branchesRes : branchesRes?.data || [];
      setBranches(branchList);
      
      const invPromises = branchList.map(b => apiClient.get(`/sales/branch-inventory/${b.id}`).catch(() => ({ data: [] })));
      const results = await Promise.all(invPromises);
      
      const productMap = {};
      const addInv = (branchId, items) => {
        for (const item of items) {
          if (!productMap[item.product_id]) productMap[item.product_id] = { branches: {} };
          productMap[item.product_id].branches[branchId] = item.quantity;
        }
      };
      
      branchList.forEach((b, i) => {
        const inv = Array.isArray(results[i].data) ? results[i].data : results[i].data?.data || [];
        addInv(b.id, inv);
      });
      
      setBranchInventory(productMap);
    } catch (e) { console.error('Branch stock load error:', e.message); }
    finally { setBranchStockLoading(false); }
  };

  const handleAssignCell = async (product_id, branch_id, qty) => {
    try {
      const body = { branch_id, product_id, quantity: qty };
      if (sourceBranchId) body.transfer_from_branch_id = sourceBranchId;
      const resp = await apiClient.put('/sales/branch-products/set-quantity', body);
      const msgText = resp?.data?.message || 'product quantity updated';
      setMsg({ type: 'success', text: msgText });
      setAssigningCell(null);
      setSourceBranchId(null);
      loadBranchStock();
    } catch (e) {
      const errData = e.response?.data;
      if (errData?.data?.branches) {
        // Multiple sources — user must pick
        setSourceBranchId(null);
      }
      setMsg({ type: 'error', text: errData?.message || e.message });
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUnassignCell = async (product_id, branch_id) => {
    try {
      await apiClient.put('/sales/branch-products/set-quantity', {
        branch_id, product_id, quantity: 0
      });
      setMsg({ type: 'success', text: 'product removed from branch' });
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
      const raw = await salesService.getRetailProducts({ limit: 1000 });
      const list = Array.isArray(raw) ? raw : raw?.data?.products || raw?.data || [];
      setproducts(list.map(p => ({
        id: p.id, name: p.name, category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.selling_price || p.price || 0), stock: parseInt(p.stock_quantity || 0),
        reorder: parseInt(p.reorder_level || 10), image: p.product_image || null
      })));

      // Pending stock adjustment requests
      if (isManager) {
        try {
          const reqRaw = await apiClient.get('/retail/stock-adjustments?status=PENDING');
          const reqList = Array.isArray(reqRaw) ? reqRaw : reqRaw?.data || [];
          setPendingReqs(reqList);
        } catch (reqErr) {
          console.warn('Could not load stock adjustment requests', reqErr);
        }
      }

      // Worker adjust setting — default to true for retail
      setWorkerCanAdjust(true);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load retail stock');
      setproducts([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const playSound = () => {
    try { const a = new Audio(infoSound); a.play(); } catch {}
  };

  const handleToggleWorkerAdjust = async () => {
    // No specific endpoint for retail worker adjust setting
    setWorkerCanAdjust(prev => !prev);
  };

  const doRequest = async () => {
    if (!adjusting || !adjQty || !adjReason.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/retail/stock-adjustments', {
        product_id: adjusting.id,
        product_name: adjusting.name,
        current_value: adjusting.stock,
        requested_value: parseInt(adjQty),
        reason: adjReason.trim()
      });
      setPendingReqs(prev => [...prev, { product_id: adjusting.id, status: 'PENDING' }]);
      setMsg({ type: 'success', text: `Request sent for ${adjusting.name} — awaiting approval` });
      playSound();
      setAdjusting(null); setAdjQty(''); setAdjReason('');
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to send request' });
    } finally { setSaving(false); setTimeout(() => setMsg({ type: '', text: '' }), 3000); }
  };

  const isPending = (productId) => pendingReqs.some(r => Number(r.product_id) === Number(productId));

  const filtered = products.filter(d => {
    if (filterMode === 'low-stock' && d.stock > d.reorder) return false;
    return !search || d.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={hideHeader ? { fontFamily: "'Inter','Segoe UI',sans-serif" } : { padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: '#A5D6A7' }}>
      <style>{`
        @keyframes spin{100%{transform:rotate(360deg);}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(1.18)}}
        .inv-row:hover td { filter: brightness(.97); }
        .inv-action-btn { transition: transform .11s, box-shadow .11s; }
        .inv-action-btn:hover { transform: translateY(-2px); }
        .inv-action-btn:active { transform: translateY(1px); box-shadow: none !important; }
      `}</style>

      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', borderRadius: 0, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'fadeSlide 0.3s ease-out' }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}

      {!hideHeader && (
        <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: 0, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              <Layers size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Sales Stock</h1>
              <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Current sales stock — {products.length} items | {pendingReqs.length} pending CEO requests</p>
            </div>
          </div>
        </div>
      )}

      {filterMode === 'low-stock' && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 0, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#92400e' }}>
          <AlertTriangle size={18} />
          Showing low-stock items only
          <span style={{ marginLeft: 'auto', cursor: 'pointer', color: '#2563eb', fontWeight: 700 }} onClick={() => { setFilterMode(''); window.history.replaceState({}, '', '/sales-stock'); }}>Clear filter</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: '#1B5E20', borderBottom: '3px solid #8BC34A' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} color="#A5D6A7" style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 38px', border: '2px solid #8BC34A', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#2E8B57', color: '#A5D6A7', fontWeight: 600 }} />
        </div>
        <button onClick={() => navigate(`${basePath}/products`)}
          className="inv-action-btn"
          style={{ padding: '9px 18px', background: '#A5D6A7', color: '#1B5E20', border: '2px solid #6B8E23', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '3px 3px 0 #6B8E23' }}>
          <Package size={14} /> Products
        </button>

        {isManager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: workerCanAdjust ? '#A5D6A7' : '#F5F5F5', border: `2px solid ${workerCanAdjust ? '#1B5E20' : '#dc2626'}`, transition: 'all 0.3s', boxShadow: workerCanAdjust ? '3px 3px 0 #1B5E20' : '3px 3px 0 #dc2626' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: workerCanAdjust ? '#1B5E20' : '#991b1b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Worker Adjust</span>
              <span style={{ fontSize: 10, color: workerCanAdjust ? '#1B5E20' : '#dc2626', fontWeight: 700 }}>{workerCanAdjust ? '✓ ON' : '✗ OFF'}</span>
            </div>
            <button onClick={handleToggleWorkerAdjust} disabled={togglingSetting}
              style={{ width: 48, height: 24, border: `2px solid ${workerCanAdjust ? '#1B5E20' : '#dc2626'}`, cursor: togglingSetting ? 'not-allowed' : 'pointer', background: workerCanAdjust ? '#1B5E20' : '#fecaca', position: 'relative', padding: 0, outline: 'none' }}>
              <span style={{ display: 'block', width: 16, height: 16, background: workerCanAdjust ? '#A5D6A7' : '#dc2626', position: 'absolute', top: 2, left: workerCanAdjust ? 26 : 2, transition: 'left 0.25s ease' }} />
              {togglingSetting && <Loader2 size={11} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'spin 1s linear infinite', color: 'white' }} />}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', padding: '16px 20px', marginBottom: 0, borderBottom: '3px solid #dc2626', display: 'flex', alignItems: 'center', gap: 12 }}>
          <XCircle size={20} color="#dc2626" />
          <span style={{ color: '#991b1b', fontWeight: 700, fontSize: 13, flex: 1 }}>{error}</span>
          <button onClick={loadData} className="inv-action-btn" style={{ padding: '7px 14px', background: '#dc2626', color: 'white', border: '2px solid #991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '3px 3px 0 #991b1b', textTransform: 'uppercase' }}>Retry</button>
        </div>
      )}

      <div style={{ background: '#F5F5F5', border: 0, overflow: 'hidden', animation: 'fadeSlide 0.5s ease-out' }}>
        <div style={{ padding: '12px 18px', borderBottom: '3px solid #1B5E20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1B5E20' }}>
          <span style={{ fontWeight: 800, color: '#A5D6A7', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span style={{ animation: 'blink 1.6s ease-in-out infinite', color: '#4ade80' }}><Package size={16} /></span> Stock Levels
          </span>
          <span style={{ fontSize: 12, color: '#8BC34A', fontWeight: 700, letterSpacing: '1px' }}>
            {loading ? <><Loader2 size={13} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 5 }} />Loading...</> : `${filtered.length} ITEMS`}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Image','product Name','Category','Current Stock','Reorder Lvl','Action'].map((h,i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: i === 5 ? 'center' : 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5D6A7', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', background: '#F5F5F5' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1B5E20' }} />
                  <p style={{ color: '#1B5E20', margin: '12px 0 0', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: 12 }}>Loading stock...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', background: '#F5F5F5' }}>
                  <Package size={40} style={{ color: '#1B5E20', marginBottom: 12, opacity: .35 }} />
                  <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', color: '#1B5E20', textTransform: 'uppercase', letterSpacing: '1px' }}>No stock items found</p>
                </td></tr>
              ) : filtered.map((product, idx) => {
                const stockStatus = product.stock <= 0 ? 'out' : product.stock < product.reorder ? 'low' : 'ok';
                const rowBg = stockStatus === 'out' ? '#fee2e2' : stockStatus === 'low' ? '#fef9c3' : idx % 2 === 0 ? '#F5F5F5' : '#A5D6A7';
                const hasPending = isPending(product.id);
                return (
                  <tr key={product.id} className="inv-row"
                    style={{ borderBottom: `2px solid ${idx % 2 === 0 ? '#A5D6A7' : '#F5F5F5'}`, background: rowBg, transition: 'background .2s', animation: `rowIn 0.28s ease-out ${idx * 0.025}s both` }}>
                    <td style={{ padding: '10px 14px' }}>
                      {product.image ? (
                        <img src={`http://localhost:5000${product.image}`} alt={product.name}
                          style={{ width: 42, height: 42, objectFit: 'cover', border: `2px solid #1B5E20`, display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ width: 42, height: 42, background: '#A5D6A7', border: '2px solid #1B5E20', display: product.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={17} color="#1B5E20" />
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 800, color: '#1e293b', fontSize: 13 }}>
                      {product.name}
                      {stockStatus !== 'ok' && <AlertTriangle size={12} style={{ marginLeft: 5, color: stockStatus === 'out' ? '#dc2626' : '#d97706', verticalAlign: 'middle', animation: 'blink 1s ease-in-out infinite' }} />}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 9px', background: '#1B5E20', color: '#A5D6A7', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>{product.category}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 900, fontSize: 17, color: stockStatus === 'out' ? '#dc2626' : stockStatus === 'low' ? '#d97706' : '#16a34a', borderLeft: `3px solid ${stockStatus === 'out' ? '#dc2626' : stockStatus === 'low' ? '#fbbf24' : '#4ade80'}` }}>{product.stock}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600, fontSize: 13 }}>{product.reorder}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {hasPending ? (
                        <span style={{ padding: '5px 12px', background: '#fef9c3', color: '#854d0e', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, border: '2px solid #fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', animation: 'blink 1.5s ease-in-out infinite' }}>
                          <Clock size={12} /> CEO Review
                        </span>
                      ) : adjusting?.id === product.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="New qty"
                              style={{ width: 76, padding: '5px 7px', border: '2px solid #1B5E20', fontSize: 13, textAlign: 'center', outline: 'none', background: '#A5D6A7', fontWeight: 700 }} />
                            <button onClick={doRequest} disabled={saving || !adjQty || !adjReason.trim()} className="inv-action-btn"
                              style={{ padding: '5px 10px', background: saving ? '#e2e8f0' : '#1B5E20', color: saving ? '#94a3b8' : '#A5D6A7', border: `2px solid #1B5E20`, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3, boxShadow: '2px 2px 0 #8BC34A', textTransform: 'uppercase' }}>
                              {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={11} />} Apply
                            </button>
                            <button onClick={() => setAdjusting(null)} disabled={saving}
                              style={{ padding: '5px 8px', background: '#F5F5F5', color: '#991b1b', border: '2px solid #dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 800, boxShadow: '2px 2px 0 #dc2626' }}>✕</button>
                          </div>
                          <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Reason for CEO..."
                            style={{ width: 190, padding: '5px 8px', border: '2px solid #1B5E20', fontSize: 11, outline: 'none', background: '#A5D6A7', fontWeight: 600 }} />
                        </div>
                      ) : (
                        (isManager || workerCanAdjust) ? (
                          <button onClick={() => { setAdjusting(product); setAdjQty(String(product.stock)); setAdjReason(''); }} className="inv-action-btn"
                            style={{ padding: '6px 14px', background: '#8BC34A', color: '#1B5E20', border: '2px solid #6B8E23', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '3px 3px 0 #6B8E23', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Edit3 size={12} /> Adjust
                          </button>
                        ) : (
                          <span style={{ padding: '5px 12px', background: '#f1f5f9', color: '#94a3b8', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, border: '2px dashed #cbd5e1', textTransform: 'uppercase' }}>
                            🔒 Locked
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Branch Stock Overview ── */}
      <div style={{ background: '#F5F5F5', border: 0, overflow: 'hidden', animation: 'fadeSlide 0.5s ease-out', marginTop: 3, borderTop: '4px solid #8BC34A' }}>
        <div style={{ padding: '12px 18px', borderBottom: '3px solid #1B5E20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1B5E20' }}>
          <span style={{ fontWeight: 800, color: '#A5D6A7', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span style={{ animation: 'blink 2s ease-in-out infinite', color: '#fbbf24' }}><GitBranch size={16} /></span> Branch Stock Overview
          </span>
          <span style={{ fontSize: 11, color: '#8BC34A', fontWeight: 700 }}>{branchStockLoading ? 'Loading...' : `${branches.length} branches`}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5D6A7', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>product</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5D6A7', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>Strength</th>
                {branches.map(b => (
                  <th key={b.id} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8BC34A', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>
                    <Building size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{b.name}
                  </th>
                ))}
                <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5D6A7', borderBottom: '3px solid #8BC34A', background: '#1B5E20', whiteSpace: 'nowrap' }}>Unassigned</th>
                <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5D6A7', borderBottom: '3px solid #8BC34A', background: '#1B5E20', whiteSpace: 'nowrap' }}>Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {branchStockLoading ? (
                <tr><td colSpan={branches.length + 4} style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={branches.length + 4} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <GitBranch size={36} style={{ color: '#fde68a', marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>No branch stock data</p>
                  <p style={{ margin: 0, fontSize: 13 }}>Assign products to branches in Stock Transfer to see distribution</p>
                </td></tr>
              ) : filtered.map((product, idx) => {
                const itemBranchData = branchInventory[product.id]?.branches || {};
                const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + q, 0);
                const unassigned = Math.max(0, product.stock - branchTotal);
                return (
                  <tr key={product.id} className="inv-row" style={{ borderBottom: `2px solid ${idx % 2 === 0 ? '#A5D6A7' : '#F5F5F5'}`, background: idx % 2 === 0 ? '#F5F5F5' : '#A5D6A7', animation: `rowIn 0.28s ease-out ${idx * 0.025}s both` }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{product.name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13 }}>{product.strength ? `${product.strength}${product.unit ? ' ' + product.unit : ''}` : '-'}</td>
                    {branches.map(b => {
                      const qty = itemBranchData[b.id] || 0;
                      const isEditing = assigningCell?.product_id === product.id && assigningCell?.branch_id === b.id;
                      const srcBranches = branches
                        .filter(s => s.id !== b.id && (itemBranchData[s.id] || 0) > 0)
                        .map(s => ({ ...s, available_qty: itemBranchData[s.id] }));
                      return (
                        <td key={b.id} style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input type="number" min={0} value={cellQty} onChange={e => setCellQty(parseInt(e.target.value) || 0)}
                                  style={{ width: 60, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 12, textAlign: 'center', outline: 'none' }} />
                                 <button onClick={() => handleAssignCell(product.id, b.id, cellQty)} className="inv-action-btn"
                                   style={{ padding: '4px 9px', background: '#1B5E20', color: '#A5D6A7', border: '2px solid #8BC34A', cursor: 'pointer', fontSize: 11, fontWeight: 800, boxShadow: '2px 2px 0 #8BC34A' }}>Save</button>
                                 <button onClick={() => { setAssigningCell(null); setSourceBranchId(null); }}
                                   style={{ padding: '4px 8px', background: '#F5F5F5', color: '#dc2626', border: '2px solid #dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>✕</button>
                              </div>
                              {srcBranches.length > 0 && unassigned === 0 && (
                                <select value={sourceBranchId || ''} onChange={e => setSourceBranchId(parseInt(e.target.value) || null)}
                                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 11, outline: 'none', background: 'white' }}>
                                  <option value="">Transfer from...</option>
                                  {srcBranches.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} (stock: {s.available_qty})</option>
                                  ))}
                                </select>
                              )}
                              {unassigned > 0 && !sourceBranchId && (
                                <span style={{ fontSize: 10, color: '#6366f1' }}>From: Unassigned</span>
                              )}
                            </div>
                          ) : qty > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: '#16a34a' }}>{qty}</span>
                              {(isManager || workerCanAdjust) && (
                                <button onClick={() => handleUnassignCell(product.id, b.id)}
                                  style={{ padding: '2px 6px', background: '#F5F5F5', color: '#dc2626', border: '2px solid #fecaca', cursor: 'pointer', fontSize: 10, fontWeight: 800, lineHeight: 1 }} title="Remove from branch">×</button>
                              )}
                            </div>
                          ) : (
                            (isManager || workerCanAdjust) ? (
                              <button onClick={() => {
                                setAssigningCell({ product_id: product.id, branch_id: b.id });
                                setSourceBranchId(null);
                                setCellQty(Math.min(100, unassigned > 0 ? unassigned : product.stock));
                              }} className="inv-action-btn"
                                style={{ padding: '4px 10px', background: '#A5D6A7', color: '#1B5E20', border: '2px dashed #1B5E20', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                                + Assign
                              </button>
                            ) : (
                              <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                            )
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 900, fontSize: 15, color: '#6366f1', background: '#ede9fe', borderLeft: '3px solid #6366f1' }}>{unassigned}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 900, fontSize: 16, color: '#16a34a', background: '#dcfce7', borderLeft: '3px solid #16a34a' }}>{product.stock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesStockView;
