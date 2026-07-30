import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layers, RefreshCw, Plus, Loader2, CheckCircle, XCircle, AlertTriangle, Search, Package, Send, Clock, Image as ImageIcon, Edit3, Building, GitBranch } from 'lucide-react';
import salesService from '../../services/salesService';
import apiClient from '../../services/apiClient';
import infoSound from '../../assets/notification/info.mp3';
import { useAuth } from '../../hooks/useAuth';

const SalesStockView = ({ hideHeader = false, themeColors, refreshTrigger = 0, hideWorkerAdjust = false }) => {
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
  const [adjData, setAdjData] = useState({ price: '', stock: '', reorder: '' });
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [branchInventory, setBranchInventory] = useState({});
  const [branches, setBranches] = useState([]);
  const [branchStockLoading, setBranchStockLoading] = useState(false);
  const [assigningCell, setAssigningCell] = useState(null); // { product_id, branch_id }
  const [cellQty, setCellQty] = useState(100);
  const [sourceBranchId, setSourceBranchId] = useState(null);

  const [workerCanAdjust, setWorkerCanAdjust] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [togglingSetting, setTogglingSetting] = useState(false);

  // Re-run branch load when auth resolves (isManager may be false on first render)
  useEffect(() => {
    if (isManager) loadBranchStock();
  }, [isManager]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
      if (isManager) loadBranchStock();
    }
  }, [refreshTrigger]);

  const loadBranchStock = async () => {
    setBranchStockLoading(true);
    try {
      const branchesRes = await apiClient.get('/retail/branches');
      // apiClient interceptor returns response.data = { status, data:[...] }
      const branchList = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : Array.isArray(branchesRes)
          ? branchesRes
          : [];
      setBranches(branchList);

      const invPromises = branchList.map(b =>
        apiClient.get(`/retail/branch-inventory/${b.id}`)
          .catch(() => ({ status: 'success', data: [] }))
      );
      const results = await Promise.all(invPromises);

      const productMap = {};
      const addInv = (branchId, items) => {
        for (const item of items) {
          if (!productMap[item.product_id]) productMap[item.product_id] = { branches: {} };
          productMap[item.product_id].branches[branchId] = item.quantity;
        }
      };

      branchList.forEach((b, i) => {
        // results[i] is already the server JSON body { status, data: [...] }
        const inv = Array.isArray(results[i]?.data) ? results[i].data : [];
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
      const resp = await apiClient.put('/retail/branch-products/set-quantity', body);
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
      await apiClient.put('/retail/branch-products/set-quantity', {
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
        reorder: parseInt(p.reorder_level || 10), image: p.product_image || null,
        expiry_date: p.expiry_date || p.expire_date || p.expiration_date || null
      })));

      // Pending stock adjustment requests are intentionally omitted here
      // as they are handled in the Store Dashboard.

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
    if (!adjusting) return;
    
    // Check if anything changed
    const priceChanged = adjData.price !== '' && parseFloat(adjData.price) !== adjusting.price;
    const stockChanged = adjData.stock !== '' && parseInt(adjData.stock) !== adjusting.stock;
    const reorderChanged = adjData.reorder !== '' && parseInt(adjData.reorder) !== adjusting.reorder;
    
    if (!priceChanged && !stockChanged && !reorderChanged) {
      setMsg({ type: 'error', text: 'No changes made.' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (priceChanged) payload.price = parseFloat(adjData.price);
      if (stockChanged) payload.stock = parseInt(adjData.stock);
      if (reorderChanged) payload.reorder = parseInt(adjData.reorder);

      await apiClient.post(`/retail/products/${adjusting.id}/update-request`, payload);
      setMsg({ type: 'success', text: `Update request sent to CEO for ${adjusting.name}` });
      playSound();
      setAdjusting(null); setAdjData({ price: '', stock: '', reorder: '' }); setAdjReason('');
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to send update request' });
    } finally { setSaving(false); setTimeout(() => setMsg({ type: '', text: '' }), 4000); }
  };

  const filtered = products.filter(d => {
    if (filterMode === 'low-stock' && d.stock > d.reorder) return false;
    
    if (filterMode === 'expiring-soon' || filterMode === 'expired') {
      if (!d.expiry_date) return false;
      const today = new Date();
      const exp = new Date(d.expiry_date);
      const daysLeft = (exp - today) / (1000 * 60 * 60 * 24);
      if (filterMode === 'expired' && daysLeft >= 0) return false; // Expired if daysLeft < 0
      if (filterMode === 'expiring-soon' && (daysLeft < 0 || daysLeft > 30)) return false; // Expiring soon if 0 <= daysLeft <= 30
    }
    
    return !search || d.name.toLowerCase().includes(search.toLowerCase());
  });

  const totalStockQuantity = filtered.reduce((sum, item) => sum + (parseInt(item.stock) || 0), 0);
  const totalStockValue = filtered.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.stock) || 0)), 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Stock Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #555; }
            h2 { margin: 0 0 5px 0; color: #1B5E20; }
            p { margin: 0 0 20px 0; color: #666; font-size: 13px; }
            .totals { margin-top: 20px; font-weight: bold; font-size: 15px; border-top: 2px solid #1B5E20; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h2>Sales Stock Report</h2>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock Level</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${p.price ? Number(p.price).toFixed(2) + ' ETB' : 'N/A'}</td>
                  <td>${p.stock}</td>
                  <td>${p.price ? (Number(p.price) * Number(p.stock)).toFixed(2) + ' ETB' : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            Total SKUs: ${filtered.length} <br/>
            Total Units in Stock: ${totalStockQuantity} <br/>
            Total Inventory Value: ${totalStockValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ETB
          </div>
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={hideHeader ? { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 0, margin: 0, boxSizing: 'border-box' } : { padding: 0, margin: 0, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", color: '#424242', minHeight: '100vh', background: '#F5F5F5' }}>
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
        <div style={{ padding: '24px 28px', background: '#FFFFFF', marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: 0, background: 'linear-gradient(135deg,#228B22,#1B5E20)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(34,139,34,0.3)' }}>
              <Layers size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#1B5E20', letterSpacing: '-0.02em' }}>Sales Stock</h1>
              <p style={{ color: '#424242', margin: '2px 0 0 0', fontSize: 14 }}>Current sales stock — {products.length} items</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', padding: '0 16px' }}>
        <button onClick={() => { setFilterMode(''); window.history.replaceState({}, '', '/sales-stock'); }}
          style={{ flex: 1, minWidth: 200, padding: '16px', background: filterMode === '' ? '#2E8B57' : '#FFFFFF', color: filterMode === '' ? '#FFFFFF' : '#1B5E20', border: '2px solid #1B5E20', borderRadius: 0, fontSize: 15, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: filterMode === '' ? 'none' : '4px 4px 0 #1B5E20', transition: 'all 0.2s' }}>
          <Package size={20} /> All Stock
        </button>
        <button onClick={() => setFilterMode('low-stock')}
          style={{ flex: 1, minWidth: 200, padding: '16px', background: filterMode === 'low-stock' ? '#FF9800' : '#FFFFFF', color: filterMode === 'low-stock' ? '#FFFFFF' : '#FF9800', border: '2px solid #FF9800', borderRadius: 0, fontSize: 15, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: filterMode === 'low-stock' ? 'none' : '4px 4px 0 #FF9800', transition: 'all 0.2s' }}>
          <AlertTriangle size={20} /> Low Stock
        </button>
        <button onClick={() => setFilterMode('expiring-soon')}
          style={{ flex: 1, minWidth: 200, padding: '16px', background: filterMode === 'expiring-soon' ? '#F44336' : '#FFFFFF', color: filterMode === 'expiring-soon' ? '#FFFFFF' : '#F44336', border: '2px solid #F44336', borderRadius: 0, fontSize: 15, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: filterMode === 'expiring-soon' ? 'none' : '4px 4px 0 #F44336', transition: 'all 0.2s' }}>
          <Clock size={20} /> Expiring Soon
        </button>
        <button onClick={() => setFilterMode('expired')}
          style={{ flex: 1, minWidth: 200, padding: '16px', background: filterMode === 'expired' ? '#B71C1C' : '#FFFFFF', color: filterMode === 'expired' ? '#FFFFFF' : '#B71C1C', border: '2px solid #B71C1C', borderRadius: 0, fontSize: 15, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: filterMode === 'expired' ? 'none' : '4px 4px 0 #B71C1C', transition: 'all 0.2s' }}>
          <XCircle size={20} /> Expired
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: '#1B5E20', borderBottom: '3px solid #8BC34A' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} color="#A5D6A7" style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 38px', border: '2px solid #8D6E63', borderRadius: 0, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FFFFFF', color: '#424242', fontWeight: 600 }} />
        </div>
        {!hideWorkerAdjust && isManager && (
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
          <button onClick={loadData} className="inv-action-btn" style={{ padding: '7px 14px', background: '#F44336', color: 'white', border: '2px solid #B71C1C', borderRadius: 0, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '3px 3px 0 #B71C1C', textTransform: 'uppercase' }}>Retry</button>
        </div>
      )}

      <div style={{ background: '#F5F5F5', border: 0, overflow: 'hidden', animation: 'fadeSlide 0.5s ease-out' }}>
        <div style={{ padding: '12px 18px', borderBottom: '3px solid #1B5E20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1B5E20' }}>
          <span style={{ fontWeight: 800, color: '#A5D6A7', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span style={{ animation: 'blink 1.6s ease-in-out infinite', color: '#4ade80' }}><Package size={16} /></span> Stock Levels
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8BC34A', fontWeight: 700, letterSpacing: '1px' }}>
              {loading ? <><Loader2 size={13} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 5 }} />Loading...</> : `${filtered.length} SKUs • ${totalStockQuantity} Units • ${totalStockValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ETB`}
            </span>
            <button onClick={handlePrint} style={{ padding: '6px 12px', background: '#A5D6A7', color: '#1B5E20', border: '2px solid #8BC34A', borderRadius: 0, fontWeight: 900, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase', transition: 'all 0.2s', boxShadow: '2px 2px 0 #8BC34A' }}>
              Print
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Product Name','Category','Price','Current Stock','Reorder Lvl','Expiry Date','Update Request'].map((h,i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: (i === 6) ? 'center' : 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', borderBottom: '3px solid #8BC34A', background: i === 6 ? '#1B5E20' : '#2E8B57', whiteSpace: 'nowrap' }}>{h}</th>
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
                return (
                  <tr key={product.id} className="inv-row"
                    style={{ borderBottom: `2px solid ${idx % 2 === 0 ? '#A5D6A7' : '#F5F5F5'}`, background: rowBg, transition: 'background .2s', animation: `rowIn 0.28s ease-out ${idx * 0.025}s both` }}>
                    <td style={{ padding: '11px 14px', fontWeight: 800, color: '#1e293b', fontSize: 13 }}>
                      {product.name}
                      {stockStatus !== 'ok' && <AlertTriangle size={12} style={{ marginLeft: 5, color: stockStatus === 'out' ? '#dc2626' : '#d97706', verticalAlign: 'middle', animation: 'blink 1s ease-in-out infinite' }} />}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 9px', background: '#1B5E20', color: '#A5D6A7', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>{product.category}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 800, fontSize: 13, color: '#1B5E20' }}>
                      {product.price ? `${Number(product.price).toFixed(2)} ETB` : 'N/A'}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 900, fontSize: 17, color: stockStatus === 'out' ? '#dc2626' : stockStatus === 'low' ? '#d97706' : '#16a34a', borderLeft: `3px solid ${stockStatus === 'out' ? '#dc2626' : stockStatus === 'low' ? '#fbbf24' : '#4ade80'}` }}>{product.stock}</td>
                    <td style={{ padding: '11px 14px', color: '#424242', fontWeight: 600, fontSize: 13 }}>{product.reorder}</td>
                    <td style={{ padding: '11px 14px', color: '#424242', fontWeight: 700, fontSize: 12 }}>
                      {product.expiry_date ? (() => {
                        const daysLeft = (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
                        const isExp = daysLeft < 0;
                        const isSoon = daysLeft >= 0 && daysLeft <= 30;
                        return (
                          <span style={{ color: isExp ? '#F44336' : isSoon ? '#FF9800' : '#424242', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isExp || isSoon ? <Clock size={12} /> : null}
                            {new Date(product.expiry_date).toLocaleDateString()}
                          </span>
                        );
                      })() : <span style={{ color: '#9E9E9E' }}>N/A</span>}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {(isManager || workerCanAdjust) ? (
                        <button onClick={() => navigate(`${basePath}/inventory/adjust/${product.id}`)} className="inv-action-btn"
                          style={{ padding: '6px 14px', background: '#1B5E20', color: '#A5D6A7', border: '2px solid #0a3d12', borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '3px 3px 0 #0a3d12', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <Edit3 size={12} /> Adjust
                        </button>
                      ) : (
                        <span style={{ padding: '5px 12px', background: '#F5F5F5', color: '#424242', borderRadius: 0, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, border: '2px dashed #8D6E63', textTransform: 'uppercase' }}>
                          🔒 Locked
                        </span>
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
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>Product</th>
                {branches.map(b => (
                  <th key={b.id} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', borderBottom: '3px solid #8BC34A', background: '#2E8B57', whiteSpace: 'nowrap' }}>
                    <Building size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{b.name}
                  </th>
                ))}
                <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', borderBottom: '3px solid #8BC34A', background: '#1B5E20', whiteSpace: 'nowrap' }}>Unassigned</th>
                <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', borderBottom: '3px solid #8BC34A', background: '#1B5E20', whiteSpace: 'nowrap' }}>Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {branchStockLoading ? (
                <tr><td colSpan={branches.length + 3} style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={branches.length + 3} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <GitBranch size={36} style={{ color: '#fde68a', marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>No branch stock data</p>
                  <p style={{ margin: 0, fontSize: 13 }}>Assign products to branches in Stock Transfer to see distribution</p>
                </td></tr>
              ) : filtered.map((product, idx) => {
                const itemBranchData = branchInventory[product.id]?.branches || {};
                const branchTotal = Object.values(itemBranchData).reduce((s, q) => s + (parseInt(q) || 0), 0);
                const unassigned = Math.max(0, parseInt(product.stock) - branchTotal);
                return (
                  <tr key={product.id} className="inv-row" style={{ borderBottom: `2px solid ${idx % 2 === 0 ? '#A5D6A7' : '#F5F5F5'}`, background: idx % 2 === 0 ? '#F5F5F5' : '#A5D6A7', animation: `rowIn 0.28s ease-out ${idx * 0.025}s both` }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{product.name}</td>
                    {branches.map(b => {
                      const qty = itemBranchData[b.id] || 0;
                      const isEditing = assigningCell?.product_id === product.id && assigningCell?.branch_id === b.id;
                      const srcBranches = branches
                        .filter(s => s.id !== b.id && (itemBranchData[s.id] || 0) > 0)
                        .map(s => ({ ...s, available_qty: itemBranchData[s.id] }));
                      return (
                        <td key={b.id} style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', minWidth: 140 }}>
                              {/* Qty input + save/cancel */}
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input type="number" min={0} value={cellQty}
                                  onChange={e => setCellQty(Math.max(0, parseInt(e.target.value) || 0))}
                                  style={{ width: 64, padding: '4px 6px', border: '2px solid #8D6E63', borderRadius: 0, fontSize: 12, textAlign: 'center', outline: 'none', fontWeight: 700 }} />
                                <button onClick={() => handleAssignCell(product.id, b.id, cellQty)} className="inv-action-btn"
                                  disabled={cellQty > qty && unassigned === 0 && sourceBranchId === null}
                                  style={{ padding: '4px 9px', background: (cellQty > qty && unassigned === 0 && sourceBranchId === null) ? '#E0E0E0' : '#2E8B57', color: (cellQty > qty && unassigned === 0 && sourceBranchId === null) ? '#9E9E9E' : '#FFFFFF', border: `2px solid ${(cellQty > qty && unassigned === 0 && sourceBranchId === null) ? '#9E9E9E' : '#1B5E20'}`, borderRadius: 0, cursor: (cellQty > qty && unassigned === 0 && sourceBranchId === null) ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 800, boxShadow: (cellQty > qty && unassigned === 0 && sourceBranchId === null) ? 'none' : '2px 2px 0 #1B5E20' }}>Save</button>
                                <button onClick={() => { setAssigningCell(null); setSourceBranchId(null); }}
                                  style={{ padding: '4px 8px', background: '#F5F5F5', color: '#F44336', border: '2px solid #F44336', borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>✕</button>
                              </div>
                              {/* Source selector — only visible when increasing stock */}
                              {cellQty > qty ? (
                                <select value={sourceBranchId === null ? '' : String(sourceBranchId)}
                                  onChange={e => setSourceBranchId(e.target.value === '' ? null : parseInt(e.target.value))}
                                  style={{ width: '100%', padding: '4px 6px', border: '2px solid #8D6E63', borderRadius: 0, fontSize: 11, outline: 'none', background: '#FFFFFF', color: '#424242', fontWeight: 600 }}>
                                  {unassigned > 0 ? (
                                    <option value="">📦 From Unassigned ({unassigned} left)</option>
                                  ) : (
                                    <option value="" disabled>-- Select Source Branch --</option>
                                  )}
                                  {srcBranches.map(s => (
                                    <option key={s.id} value={s.id}>🔀 From {s.name} ({s.available_qty} in stock)</option>
                                  ))}
                                  {unassigned === 0 && srcBranches.length === 0 && (
                                    <option value="none" disabled>No stock available</option>
                                  )}
                                </select>
                              ) : cellQty < qty ? (
                                <div style={{ fontSize: 10, color: '#047857', fontWeight: 700, textAlign: 'center', marginTop: 2, background: '#d1fae5', padding: '2px 4px' }}>
                                  Returning {qty - cellQty} to unassigned
                                </div>
                              ) : null}
                            </div>
                          ) : qty > 0 ? (
                            /* Already has stock — click to edit */
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <span
                                onClick={() => {
                                  if (isManager || workerCanAdjust) {
                                    setAssigningCell({ product_id: product.id, branch_id: b.id });
                                    setSourceBranchId(null);
                                    setCellQty(qty);
                                  }
                                }}
                                style={{ fontWeight: 900, fontSize: 15, color: '#16a34a', cursor: (isManager || workerCanAdjust) ? 'pointer' : 'default', borderBottom: (isManager || workerCanAdjust) ? '2px dotted #16a34a' : 'none' }}
                                title="Click to edit quantity"
                              >
                                {qty}
                              </span>
                            </div>
                          ) : (
                            /* No stock yet — show Assign button */
                            (isManager || workerCanAdjust) ? (
                              <button onClick={() => {
                                setAssigningCell({ product_id: product.id, branch_id: b.id });
                                setSourceBranchId(null);
                                setCellQty(unassigned > 0 ? unassigned : 0);
                              }} className="inv-action-btn"
                                style={{ padding: '4px 10px', background: '#2E8B57', color: '#FFFFFF', border: '2px dashed #1B5E20', borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                                + Assign
                              </button>
                            ) : (
                              <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                            )
                          )}
                        </td>
                      );
                    })}
                    {/* Unassigned column: shows 0 when fully assigned, or remaining qty */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 900, fontSize: 15,
                      color: unassigned === 0 ? '#16a34a' : '#6366f1',
                      background: unassigned === 0 ? '#dcfce7' : '#ede9fe',
                      borderLeft: `3px solid ${unassigned === 0 ? '#16a34a' : '#6366f1'}` }}>
                      {unassigned}
                    </td>
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
