import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layers, RefreshCw, Plus, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Search, Package, Clock, Edit3, Building, GitBranch, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ── Theme Colors ─────────────────────────────────────────────────────────────
const G = {
  primary:'#2563EB', primaryH:'#1D4ED8', forest:'#2563EB', dark:'#1D4ED8',
  emerald:'#2563EB', leaf:'#16A34A', sage:'#BFDBFE', olive:'#6B7280',
  mint:'#DCFCE7', lime:'#F59E0B', earth:'#E5E7EB', sky:'#EFF6FF',
  white:'#FFFFFF', lightGray:'#F5F6FA', darkGray:'#4B5563',
  error:'#DC2626', warning:'#D97706', rowHov:'#F9FAFB', rowAlt:'#F9FAFB',
  muted:'#9CA3AF', txt:'#111827', txt2:'#6B7280', border:'#E5E7EB',
  success:'#16A34A', successBg:'#DCFCE7', dangerBg:'#FEE2E2',
  warningBg:'#FEF3C7', info:'#0284C7', infoBg:'#E0F2FE',
  dangerH:'#B91C1C', warningH:'#B45309', successH:'#15803D',
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
function Btn({ children, onClick, disabled, bg = G.primary, color = G.white, outline, full, small, style }) {
  const [hov, setHov] = useState(false);
  const [foc, setFoc] = useState(false);
  const isDis = disabled;
  const HOV = { [G.primary]:G.primaryH, [G.success]:G.successH, [G.warning]:G.warningH, [G.error]:G.dangerH, [G.info]:'#0369A1' };
  const hoverBg = HOV[bg] || bg;
  let bgC = outline ? G.white : bg;
  let col = outline ? bg : color;
  let bd  = outline ? `1px solid ${bg}` : '1px solid transparent';
  if (isDis) { bgC = '#F3F4F6'; col = G.muted; bd = '1px solid #E5E7EB'; }
  else if (hov) { bgC = '#F59E0B'; col = '#78350F'; bd = '1px solid #F59E0B'; }

  return (
    <button
      type="button"
      onClick={isDis ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      disabled={isDis}
      style={{
        background: bgC, color: col, border: bd,
        borderRadius: 8, cursor: isDis ? 'not-allowed' : 'pointer',
        padding: small ? '0 12px' : '0 16px',
        height: small ? 32 : 40,
        fontSize: small ? 13 : 14, fontWeight: 500, lineHeight: 1,
        width: full ? '100%' : 'auto',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s ease', textTransform: 'none',
        boxShadow: foc ? '0 0 0 3px rgba(37,99,235,0.18)' : 'none',
        fontFamily: 'inherit', outline: 'none',
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
        width: '100%', height: 36, padding: '0 12px',
        border: foc ? `1px solid ${G.primary}` : `1px solid ${G.border}`,
        boxShadow: foc ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
        borderRadius: 8, outline: 'none', fontSize: 14,
        color: G.txt, background: G.white, boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'all 0.15s ease',
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
        width: '100%', height: 36, padding: '0 32px 0 12px',
        border: foc ? `1px solid ${G.primary}` : `1px solid ${G.border}`,
        boxShadow: foc ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
        borderRadius: 8, outline: 'none', fontSize: 14,
        color: G.txt, background: G.white, boxSizing: 'border-box',
        fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        transition: 'all 0.15s ease',
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
        fontSize: 12, fontWeight: 500, color: G.txt2,
        textTransform: 'uppercase', letterSpacing: '0.04em',
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
      background: ok ? '#F0FDF4' : '#FEF2F2', color: ok ? '#166534' : '#991B1B',
      padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 500, borderLeft: `4px solid ${ok ? G.success : G.error}`,
      flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      {ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      <span style={{ flex: 1 }}>{notif.message}</span>
      {notif.dismissible && (
        <button onClick={notif.onDismiss} style={{
          background: 'transparent', border: 'none', color: 'inherit',
          cursor: 'pointer', padding: '2px 8px', fontSize: 12, fontWeight: 600, borderRadius: 6, opacity: 0.7,
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
      background: G.lightGray, color: G.txt,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column'
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .lift-card { transition:all .15s ease; }
        .lift-card:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.08) !important; }
        .hover-card { transition:all .15s ease; }
        .hover-card:hover { border-color:#F59E0B !important; box-shadow:0 4px 12px rgba(0,0,0,.08) !important; transform:translateY(-1px); }
        .siv-row { transition:background .15s ease; }
        .siv-row:hover { background:#F9FAFB; }
        @media(max-width:768px){ .siv-inv-btn{ min-height:44px; } }
      `}</style>
      <NotifBanner notif={notif} />

      {/* Header */}
      {!hideHeader && (
        <div style={{ background: G.primaryH, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
            <Layers size={24} color={G.white} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: G.white, margin: 0, lineHeight: 1.3 }}>Retail Inventory</h1>
            <p style={{ color: '#BFDBFE', margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Manage Published Products & Stock</p>
          </div>
          <Btn onClick={handlePrint} bg={G.primary}>🖨️ Print</Btn>
        </div>
      )}

      <div style={{ padding: hideHeader ? 0 : '24px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1536, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          <Btn onClick={() => setFilterMode('')} outline={filterMode !== ''} full>📦 All Items</Btn>
          <Btn onClick={() => setFilterMode('low-stock')} outline={filterMode !== 'low-stock'} full bg={G.warning}>⚠️ Low Stock</Btn>
          <Btn onClick={() => setFilterMode('expiring-soon')} outline={filterMode !== 'expiring-soon'} full bg={G.error}>⏳ Expiring</Btn>
          <Btn onClick={() => setFilterMode('expired')} outline={filterMode !== 'expired'} full bg={G.dangerH}>❌ Expired</Btn>
        </div>

        {/* Search & Stats */}
        <div className="hover-card" style={{ display: 'flex', gap: 16, alignItems: 'center', background: G.white, padding: '10px 16px', border: `1px solid ${G.border}`, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
            <Search size={16} color={G.txt2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <SharpInput placeholder="Search products or SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, border: 'none', background: 'transparent' }} />
          </div>
          <div style={{ paddingLeft: 16, borderLeft: `1px solid ${G.border}`, whiteSpace: 'nowrap', fontWeight: 500, fontSize: 13, color: G.txt2, fontVariantNumeric: 'tabular-nums' }}>
            {filtered.length} SKUs <span style={{ color: G.muted }}>|</span> {totalStockQuantity} UNITS <span style={{ color: G.muted }}>|</span> {totalStockValue.toLocaleString()} ETB
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: G.txt2 }}>
              <SegmentedSpinner size={40} />
              <div style={{ fontWeight: 500, marginTop: 12, fontSize: 14 }}>Loading retail products…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="hover-card" style={{ padding: 60, textAlign: 'center', color: G.txt2, background: G.white, border: `1px solid ${G.border}`, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 999, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Package size={30} color={G.primary} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, color: G.txt }}>No products found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map(p => {
                const stock = parseInt(p.stock_quantity || 0);
                const reorder = parseInt(p.reorder_level || 10);
                const isOut = stock <= 0;
                const isLow = stock < reorder;
                const active = !!p.is_active;

                return (
                  <div key={p.id} className="lift-card" style={{
                    background: G.white, border: `1px solid ${G.border}`,
                    borderTop: `3px solid ${active ? G.primary : G.muted}`,
                    borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                    opacity: active ? 1 : 0.7, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: G.txt, lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: G.txt2, fontWeight: 500, marginTop: 4, letterSpacing: '.02em' }}>SKU: {p.sku}</div>
                      </div>
                      {!active && <span style={{ background: '#F3F4F6', color: G.txt2, padding: '3px 10px', fontSize: 11, fontWeight: 500, borderRadius: 999, whiteSpace: 'nowrap' }}>HIDDEN</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 12, borderBottom: `1px solid ${G.border}`, paddingBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: G.txt2, textTransform: 'uppercase', letterSpacing: '.04em' }}>PRICE</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: G.primary, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(p.price || 0).toLocaleString()} ETB</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: G.txt2, textTransform: 'uppercase', letterSpacing: '.04em' }}>STOCK</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: isOut ? G.error : isLow ? G.warning : G.success, fontVariantNumeric: 'tabular-nums' }}>
                          {stock} <span style={{ fontSize: 10, fontWeight: 500 }}>/ min {reorder}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 'auto' }}>
                      <Btn onClick={() => setEditing(p)} small bg={G.primary}>
                        <Edit3 size={12}/> EDIT
                      </Btn>
                      <Btn onClick={() => handleToggleHide(p)} small outline bg={active ? G.error : G.success}>
                        {active ? <><EyeOff size={12}/> HIDE</> : <><Eye size={12}/> SHOW</>}
                      </Btn>
                      <Btn onClick={() => handleDelete(p)} small bg={G.dangerH}>
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
          <div className="hover-card" style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: 4 }}>
            <div style={{ background: G.primaryH, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: G.white, fontWeight: 600, fontSize: 14 }}>
              <Building size={16} color="#BFDBFE"/> BRANCH STOCK DISTRIBUTION
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, fontSize: 12, color: G.txt2, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${G.border}` }}>Product</th>
                    {branches.map(b => (
                      <th key={b.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 500, fontSize: 12, color: G.txt2, textTransform: 'uppercase', letterSpacing: '.04em', borderLeft: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>{b.name}</th>
                    ))}
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 500, fontSize: 12, color: G.txt2, textTransform: 'uppercase', letterSpacing: '.04em', background: '#F9FAFB', borderLeft: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>Unassigned</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const itemBranchData = branchInventory[p.id]?.branches || {};
                    const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + (parseInt(q) || 0), 0);
                    const unassigned = Math.max(0, parseInt(p.stock_quantity || 0) - branchTotal);
                    return (
                      <tr key={p.id} className="siv-row" style={{ borderBottom: `1px solid ${G.border}`, background: G.white }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: G.txt }}>{p.name}</td>
                        {branches.map(b => {
                          const qty = itemBranchData[b.id] || 0;
                          const isEditing = assigningCell?.product_id === p.id && assigningCell?.branch_id === b.id;
                          return (
                            <td key={b.id} style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${G.border}` }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <SharpInput type="number" min={0} value={cellQty} onChange={e => setCellQty(parseInt(e.target.value)||0)} style={{ width: 60, height: 32, padding: '0 6px' }}/>
                                  <Btn onClick={() => handleAssignCell(p.id, b.id, cellQty)} small>✓</Btn>
                                  <Btn onClick={() => setAssigningCell(null)} small outline bg={G.error}>✕</Btn>
                                </div>
                              ) : qty > 0 ? (
                                <span onClick={() => { setAssigningCell({ product_id: p.id, branch_id: b.id }); setCellQty(qty); }} style={{ fontWeight: 600, color: G.primary, cursor: 'pointer', borderBottom: `2px dotted ${G.primary}`, transition: 'color .15s ease' }}>{qty}</span>
                              ) : (
                                <span onClick={() => { setAssigningCell({ product_id: p.id, branch_id: b.id }); setCellQty(unassigned > 0 ? unassigned : 0); }} style={{ fontSize: 12, color: G.info, cursor: 'pointer', fontWeight: 500, transition: 'color .15s ease' }}>+ Assign</span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, background: unassigned === 0 ? G.successBg : G.warningBg, color: unassigned === 0 ? G.success : G.warning, fontVariantNumeric: 'tabular-nums' }}>{unassigned}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: G.white, width: 560, maxWidth: '100%', borderRadius: 12, boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
            <div style={{ background: G.primaryH, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, color: G.white }}>
              <button onClick={() => setEditing(null)} style={{ background: 'rgba(255,255,255,0.14)', border: 'none', color: G.white, cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease' }}><X size={18}/></button>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Update Retail Product</div>
            </div>
            
            <form onSubmit={handleUpdateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: G.txt, borderLeft: `3px solid ${G.primary}`, paddingLeft: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>Product Details</div>
              
              <div>
                <FL required>Product Name</FL>
                <SharpInput required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
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

              <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <FL required>Stock Quantity</FL>
                  <SharpInput type="number" min="0" required value={editing.stock_quantity} onChange={e => setEditing({...editing, stock_quantity: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <FL required>Reorder Level</FL>
                  <SharpInput type="number" min="0" required value={editing.reorder_level} onChange={e => setEditing({...editing, reorder_level: e.target.value})} />
                </div>
              </div>

              <Btn full disabled={saving} onClick={handleUpdateSubmit} style={{ height: 44 }}>
                {saving ? <SegmentedSpinner size={16} /> : <Save size={16}/>}
                {saving ? 'Saving…' : 'Save Changes'}
              </Btn>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
