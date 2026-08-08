import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layers, RefreshCw, Plus, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Search, Package, Clock, Edit3, Building, GitBranch, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

// ── Theme Colors ─────────────────────────────────────────────────────────────
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf: '#4CAF50', sage: '#A5D6A7', olive: '#6B8E23',
  mint: '#98FF98', lime: '#8BC34A', earth: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', error: '#F44336', warning: '#FF9800',
  rowHov: '#e8f5e9', rowAlt: '#fcfcfc',
};

// ── Window Hook ──────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setW(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return w;
}

// ── Components ───────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, bg = G.emerald, color = G.white, outline, full, small, style }) {
  const [hov, setHov] = useState(false);
  const isDis = disabled;
  let bgC = outline ? 'transparent' : bg;
  let col = outline ? bg : color;
  if (isDis) { bgC = '#e0e0e0'; col = '#9e9e9e'; }
  else if (hov && !outline) bgC = G.dark;
  else if (hov && outline) { bgC = bg; col = G.white; }

  return (
    <button
      onClick={isDis ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={isDis}
      style={{
        background: bgC, color: col,
        border: `2px solid ${isDis ? '#9e9e9e' : bg}`,
        borderRadius: 0, cursor: isDis ? 'not-allowed' : 'pointer',
        padding: small ? '5px 12px' : '9px 18px',
        fontSize: small ? 12 : 14, fontWeight: 800,
        width: full ? '100%' : 'auto',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.1s', textTransform: 'uppercase',
        fontFamily: 'inherit',
        ...style
      }}
    >
      {children}
    </button>
  );
}

function SharpInput({ style, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      {...props}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      style={{
        width: '100%', padding: '10px 12px',
        border: foc ? `2px solid ${G.forest}` : `1px solid ${G.sage}`,
        borderRadius: 0, outline: 'none', fontSize: 14,
        color: G.darkGray, background: G.white, boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 0.12s',
        ...style,
      }}
    />
  );
}

function SharpSelect({ style, children, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <select
      {...props}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      style={{
        width: '100%', padding: '10px 12px',
        border: foc ? `2px solid ${G.forest}` : `1px solid ${G.sage}`,
        borderRadius: 0, outline: 'none', fontSize: 14,
        color: G.darkGray, background: G.white, boxSizing: 'border-box',
        fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
        transition: 'border-color 0.12s',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function FL({ children, required }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: G.darkGray,
        textTransform: 'uppercase', letterSpacing: '0.6px',
        display: 'flex', gap: 3, alignItems: 'center',
      }}>
        {children}
        {required && <span style={{ color: G.error }}>*</span>}
      </div>
    </div>
  );
}

function NotifBanner({ notif }) {
  if (!notif.show) return null;
  const ok = notif.type === 'success';
  return (
    <div style={{
      background: ok ? G.leaf : G.error, color: G.white,
      padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 700, borderBottom: `3px solid ${ok ? G.dark : '#B71C1C'}`,
      flexShrink: 0,
    }}>
      {ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      <span style={{ flex: 1 }}>{notif.message}</span>
      {notif.dismissible && (
        <button onClick={notif.onDismiss} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: G.white,
          cursor: 'pointer', padding: '2px 8px', fontSize: 12, borderRadius: 0,
        }}>✕</button>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SalesStockView({ hideHeader = false, refreshTrigger = 0 }) {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Sales Manager', 'Admin', 'CEO'].includes(r));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/sales-worker') ? '/sales-worker' : '/sales';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState(searchParams.get('filter') || '');
  
  // Update Form State
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Branches
  const [branches, setBranches] = useState([]);
  const [branchInventory, setBranchInventory] = useState({});
  const [branchStockLoading, setBranchStockLoading] = useState(false);
  const [assigningCell, setAssigningCell] = useState(null);
  const [cellQty, setCellQty] = useState(0);
  const [sourceBranchId, setSourceBranchId] = useState(null);

  // Notifications
  const [notif, setNotif] = useState({ show: false, type: '', message: '' });
  const timerRef = useRef(null);

  const showNotif = useCallback((type, message, duration = 4000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotif({ show: true, type, message });
    timerRef.current = setTimeout(() => setNotif({ show: false, type: '', message: '' }), duration);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      // Use /retail/inventory to get ALL products including is_active=false
      const [invRes, catRes] = await Promise.all([
        apiClient.get('/retail/inventory'),
        apiClient.get('/retail/categories')
      ]);
      const raw = invRes?.data?.data || invRes?.data || [];
      const cats = catRes?.data?.data || catRes?.data || [];
      setProducts(Array.isArray(raw) ? raw : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      showNotif('error', e?.response?.data?.message || 'Failed to load retail stock');
    } finally {
      setLoading(false);
    }
  };

  const loadBranchStock = async () => {
    if (!isManager) return;
    setBranchStockLoading(true);
    try {
      const bRes = await apiClient.get('/retail/branches');
      const bList = Array.isArray(bRes?.data) ? bRes.data : Array.isArray(bRes) ? bRes : [];
      setBranches(bList);

      const invPromises = bList.map(b => apiClient.get(`/retail/branch-inventory/${b.id}`).catch(() => ({ status: 'success', data: [] })));
      const results = await Promise.all(invPromises);

      const pMap = {};
      bList.forEach((b, i) => {
        const inv = Array.isArray(results[i]?.data) ? results[i].data : [];
        for (const item of inv) {
          if (!pMap[item.product_id]) pMap[item.product_id] = { branches: {} };
          pMap[item.product_id].branches[b.id] = item.quantity;
        }
      });
      setBranchInventory(pMap);
    } catch (e) {
      showNotif('error', 'Failed to load branch stock.');
    } finally {
      setBranchStockLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [refreshTrigger]);
  useEffect(() => { if (isManager) loadBranchStock(); }, [isManager, refreshTrigger]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleHide = async (p) => {
    if (!window.confirm(`Are you sure you want to ${p.is_active ? 'HIDE' : 'SHOW'} ${p.name}?`)) return;
    try {
      await apiClient.put(`/retail/products/${p.id}`, { is_active: !p.is_active });
      showNotif('success', `Product ${p.is_active ? 'hidden from' : 'shown to'} public view.`);
      loadData();
    } catch (e) {
      showNotif('error', e?.message || 'Failed to toggle visibility');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`DELETE ${p.name}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/retail/products/${p.id}`);
      showNotif('success', `Product deleted successfully.`);
      loadData();
    } catch (e) {
      showNotif('error', e?.response?.data?.message || e?.message || 'Failed to delete product (It may be linked to existing sales).');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', editing.name);
      fd.append('price', editing.price);
      fd.append('stock_quantity', editing.stock_quantity);
      fd.append('reorder_level', editing.reorder_level);
      if (editing.category_id) fd.append('category_id', editing.category_id);
      
      await apiClient.put(`/retail/products/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showNotif('success', `Product updated successfully.`);
      setEditing(null);
      loadData();
    } catch (error) {
      showNotif('error', error?.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignCell = async (product_id, branch_id, qty) => {
    try {
      const body = { branch_id, product_id, quantity: qty };
      if (sourceBranchId) body.transfer_from_branch_id = sourceBranchId;
      await apiClient.put('/retail/branch-products/set-quantity', body);
      showNotif('success', 'Branch quantity updated');
      setAssigningCell(null);
      setSourceBranchId(null);
      loadBranchStock();
    } catch (e) {
      setSourceBranchId(null);
      showNotif('error', e.response?.data?.message || e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Derived Data ───────────────────────────────────────────────────────────
  const filtered = products.filter(d => {
    const stk = parseInt(d.stock_quantity || 0);
    const rdr = parseInt(d.reorder_level || 10);
    if (filterMode === 'low-stock' && stk > rdr) return false;
    
    if (filterMode === 'expiring-soon' || filterMode === 'expired') {
      if (!d.expiry_date) return false;
      const daysLeft = (new Date(d.expiry_date) - new Date()) / 86400000;
      if (filterMode === 'expired' && daysLeft >= 0) return false;
      if (filterMode === 'expiring-soon' && (daysLeft < 0 || daysLeft > 30)) return false;
    }
    return !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.sku?.toLowerCase().includes(search.toLowerCase());
  });

  const totalStockQuantity = filtered.reduce((s, p) => s + (parseInt(p.stock_quantity) || 0), 0);
  const totalStockValue = filtered.reduce((s, p) => s + (parseFloat(p.price || 0) * (parseInt(p.stock_quantity) || 0)), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: G.lightGray, color: G.darkGray,
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column'
    }}>
      <NotifBanner notif={notif} />

      {/* Header */}
      {!hideHeader && (
        <div style={{ background: G.dark, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, background: G.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} color={G.white} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: G.white, margin: 0, textTransform: 'uppercase' }}>Retail Inventory</h1>
            <p style={{ color: G.sage, margin: 0, fontSize: 13, fontWeight: 600 }}>Manage Published Products & Stock</p>
          </div>
          <Btn onClick={handlePrint} bg={G.sage} color={G.dark}>🖨️ PRINT</Btn>
        </div>
      )}

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          <Btn onClick={() => setFilterMode('')} outline={filterMode !== ''} full>📦 All Items</Btn>
          <Btn onClick={() => setFilterMode('low-stock')} outline={filterMode !== 'low-stock'} full bg={G.warning}>⚠️ Low Stock</Btn>
          <Btn onClick={() => setFilterMode('expiring-soon')} outline={filterMode !== 'expiring-soon'} full bg={G.error}>⏳ Expiring</Btn>
          <Btn onClick={() => setFilterMode('expired')} outline={filterMode !== 'expired'} full bg="#B71C1C">❌ Expired</Btn>
        </div>

        {/* Search & Stats */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: G.white, padding: '10px 16px', border: `1px solid ${G.earth}` }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color={G.darkGray} style={{ position: 'absolute', left: 10, top: 11 }} />
            <SharpInput placeholder="Search products or SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, border: 'none', background: 'transparent' }} />
          </div>
          <div style={{ paddingLeft: 16, borderLeft: `2px solid ${G.sage}`, whiteSpace: 'nowrap', fontWeight: 800, fontSize: 13, color: G.dark }}>
            {filtered.length} SKUs <span style={{ color: G.sage }}>|</span> {totalStockQuantity} UNITS <span style={{ color: G.sage }}>|</span> {totalStockValue.toLocaleString()} ETB
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: G.dark }}>
              <SegmentedSpinner size={40} />
              <div style={{ fontWeight: 800 }}>LOADING RETAIL PRODUCTS...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: G.darkGray, background: G.white, border: `1px solid ${G.earth}` }}>
              <Package size={48} color={G.sage} style={{ margin: '0 auto 12px' }}/>
              <div style={{ fontWeight: 800, fontSize: 16 }}>NO PRODUCTS FOUND</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map(p => {
                const stock = parseInt(p.stock_quantity || 0);
                const reorder = parseInt(p.reorder_level || 10);
                const isOut = stock <= 0;
                const isLow = stock < reorder;
                const active = !!p.is_active;

                return (
                  <div key={p.id} style={{
                    background: G.white, border: `1px solid ${G.earth}`,
                    borderTop: `4px solid ${active ? G.forest : G.darkGray}`,
                    padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                    opacity: active ? 1 : 0.7
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: G.dark }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: G.olive, fontWeight: 700, marginTop: 4 }}>SKU: {p.sku}</div>
                      </div>
                      {!active && <span style={{ background: G.darkGray, color: G.white, padding: '3px 8px', fontSize: 10, fontWeight: 800 }}>HIDDEN</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 12, borderBottom: `1px solid ${G.sage}`, paddingBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: G.darkGray }}>PRICE</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: G.forest }}>{parseFloat(p.price || 0).toLocaleString()} ETB</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: G.darkGray }}>STOCK</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: isOut ? G.error : isLow ? G.warning : G.leaf }}>
                          {stock} <span style={{ fontSize: 10 }}>/ min {reorder}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 'auto' }}>
                      <Btn onClick={() => setEditing(p)} small bg={G.dark}>
                        <Edit3 size={12}/> EDIT
                      </Btn>
                      <Btn onClick={() => handleToggleHide(p)} small outline bg={active ? G.error : G.forest}>
                        {active ? <><EyeOff size={12}/> HIDE</> : <><Eye size={12}/> SHOW</>}
                      </Btn>
                      <Btn onClick={() => handleDelete(p)} small bg="#B71C1C">
                        <Trash2 size={12}/> DEL
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch Stock Overview Table */}
        {isManager && branches.length > 0 && (
          <div style={{ background: G.white, border: `1px solid ${G.earth}`, marginTop: 20 }}>
            <div style={{ background: G.dark, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: G.white, fontWeight: 800 }}>
              <Building size={16} color={G.sage}/> BRANCH STOCK DISTRIBUTION
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.forest, color: G.white }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800 }}>PRODUCT</th>
                    {branches.map(b => (
                      <th key={b.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, borderLeft: `1px solid ${G.sage}` }}>{b.name}</th>
                    ))}
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, background: G.dark }}>UNASSIGNED</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const itemBranchData = branchInventory[p.id]?.branches || {};
                    const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + (parseInt(q) || 0), 0);
                    const unassigned = Math.max(0, parseInt(p.stock_quantity || 0) - branchTotal);
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${G.sage}`, background: idx % 2 === 0 ? G.white : G.rowAlt }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: G.dark }}>{p.name}</td>
                        {branches.map(b => {
                          const qty = itemBranchData[b.id] || 0;
                          const isEditing = assigningCell?.product_id === p.id && assigningCell?.branch_id === b.id;
                          return (
                            <td key={b.id} style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${G.sage}` }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <SharpInput type="number" min={0} value={cellQty} onChange={e => setCellQty(parseInt(e.target.value)||0)} style={{ width: 60, padding: 4 }}/>
                                  <Btn onClick={() => handleAssignCell(p.id, b.id, cellQty)} small>✓</Btn>
                                  <Btn onClick={() => setAssigningCell(null)} small outline bg={G.error}>✕</Btn>
                                </div>
                              ) : qty > 0 ? (
                                <span onClick={() => { setAssigningCell({ product_id: p.id, branch_id: b.id }); setCellQty(qty); }} style={{ fontWeight: 800, color: G.forest, cursor: 'pointer', borderBottom: `2px dotted ${G.forest}` }}>{qty}</span>
                              ) : (
                                <span onClick={() => { setAssigningCell({ product_id: p.id, branch_id: b.id }); setCellQty(unassigned > 0 ? unassigned : 0); }} style={{ fontSize: 11, color: G.olive, cursor: 'pointer', fontWeight: 700 }}>+ Assign</span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900, background: unassigned === 0 ? '#e8f5e9' : '#fff3e0', color: unassigned === 0 ? G.forest : G.warning }}>{unassigned}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── FULL SCREEN EDIT MODAL ────────────────────────────────────────── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: G.lightGray, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: G.dark, height: 52, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 14, color: G.white, flexShrink: 0, borderBottom: `3px solid ${G.forest}` }}>
            <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: 'none', color: G.white, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}><X size={20}/></button>
            <div style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Update Retail Product</div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 14 : 40 }}>
            <form onSubmit={handleUpdateSubmit} style={{ maxWidth: 600, margin: '0 auto', background: G.white, border: `1px solid ${G.earth}`, padding: 30 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', borderLeft: `4px solid ${G.forest}`, paddingLeft: 10, marginBottom: 20 }}>Product Details</div>
              
              <div style={{ marginBottom: 16 }}>
                <FL required>Product Name</FL>
                <SharpInput required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <FL required>Selling Price (ETB)</FL>
                  <SharpInput type="number" step="0.01" min="0" required value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <FL>Category</FL>
                  <SharpSelect value={editing.category_id || ''} onChange={e => setEditing({...editing, category_id: e.target.value})}>
                    <option value="">-- No Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </SharpSelect>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <FL required>Stock Quantity</FL>
                  <SharpInput type="number" min="0" required value={editing.stock_quantity} onChange={e => setEditing({...editing, stock_quantity: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <FL required>Reorder Level</FL>
                  <SharpInput type="number" min="0" required value={editing.reorder_level} onChange={e => setEditing({...editing, reorder_level: e.target.value})} />
                </div>
              </div>

              <Btn full disabled={saving} onClick={handleUpdateSubmit}>
                {saving ? <SegmentedSpinner size={16} /> : <Save size={16}/>}
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </Btn>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
