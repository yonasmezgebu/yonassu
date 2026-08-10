import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, EyeOff, Eye, Loader2, RefreshCw,
  Pill, Package, AlertTriangle, XCircle, CheckCircle, Clock, Send, Image as ImageIcon, ArrowLeft
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import infoSound from '../../assets/notification/info.mp3';
import { useAuth } from '../../hooks/useAuth';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const today = new Date();
const inDays = (d, n) => new Date(d) <= new Date(today.getTime() + n * 86400000);
const getExpiryStatus = d => { const e = new Date(d); if (e < today) return 'expired'; if (inDays(d, 30)) return 'expiring-soon'; return 'ok'; };
const getStockStatus = (stock, reorder) => stock === 0 ? 'out' : stock < reorder ? 'low' : 'ok';

/* ─── colour tokens ─────────────────────────────────────── */
const LIME  = '#E5FBAD';   // light lime green
const PEACH = '#FEFACE';   // light peach
const DARK  = '#2A3F08';   // deep olive text / borders
const MID   = '#50760F';   // mid olive accent
const GOLD  = '#D4A843';
const GOLD2 = '#9A701E';

const STOCK_META = {
  ok: { bg: '#dcfce7', color: '#166534', label: 'In Stock', icon: CheckCircle },
  low: { bg: '#fef3c7', color: '#92400e', label: 'Low Stock', icon: AlertTriangle },
  out: { bg: '#fee2e2', color: '#991b1b', label: 'Out of Stock', icon: XCircle }
};
const EXPIRY_META = {
  ok: { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  'expiring-soon': { bg: '#fef3c7', color: '#92400e', icon: Clock },
  expired: { bg: '#fee2e2', color: '#991b1b', icon: XCircle }
};

const Th = ({ col, sortKey, sortDir, onSort, children }) => (
  <th onClick={() => onSort(col)}
    style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: LIME, cursor: 'pointer', userSelect: 'none', borderBottom: `3px solid ${GOLD}`, whiteSpace: 'nowrap',
      background: DARK, position: 'sticky', top: 0, zIndex: 2 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
      <span style={{ color: sortKey === col ? '#fbbf24' : '#84a059', display: 'inline-flex' }}>
        {sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} />}
      </span>
    </span>
  </th>
);

const selectStyle = {
  padding: '9px 14px', border: `2px solid ${GOLD}`, borderRadius: 0, fontSize: 13, fontWeight: 700,
  color: LIME, backgroundColor: MID, outline: 'none', cursor: 'pointer', transition: 'all 0.2s',
  appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23E5FBAD%27 stroke-width=%273%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36,
  minWidth: 160
};

const PharmacyMedicines = () => {
  const { user } = useAuth();
  const workerAuth = useContext(WorkerAuthContext);
  const navigate = useNavigate();
  const isRealManager = user?.roles?.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
  const [workerCanHide, setWorkerCanHide] = useState(false);
  const [loadingSetting, setLoadingSetting] = useState(false);
  
  const isManager = isRealManager || (workerCanHide && workerAuth?.hasManagerPermission !== false);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [hidingDrug, setHidingDrug] = useState(null);
  const [hideType, setHideType] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [hideSuccess, setHideSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showHidden, setShowHidden] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const audioRef = useRef(null);

  const loadData = async (includeHidden = false) => {
    setLoading(true);
    setError('');
    try {
      const raw = await pharmacyService.getProducts(includeHidden);
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.products || [];
      setDrugs(list.map(p => ({
        id: p.id, name: p.name, category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.price || p.selling_price || 0), stock: parseInt(p.stock_quantity || 0),
        reorderLevel: parseInt(p.reorder_level || 10), expiryDate: p.expiry_date || '2027-01-01',
        batchNo: p.batch_number || '—', isHidden: !!p.is_hidden,
        image: p.drug_image || p.cover_image || null
      })));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load medicines');
      setDrugs([]);
    } finally { setLoading(false); setSpinning(false); }
  };

  useEffect(() => { loadData(showHidden); }, [showHidden]);

  useEffect(() => {
    pharmacyService.getWorkerHideDrugSetting().then(res => setWorkerCanHide(res.data?.enabled)).catch(() => {});
  }, []);

  const toggleWorkerHideSetting = async (e) => {
    const val = e.target.checked;
    setLoadingSetting(true);
    try {
      await pharmacyService.updateWorkerHideDrugSetting(val);
      setWorkerCanHide(val);
    } catch(err) {}
    setLoadingSetting(false);
  };

  const handleRefresh = () => {
    setSpinning(true);
    loadData(showHidden);
  };

  const categories = [...new Set(drugs.map(d => d.category))].sort();

  const filtered = drugs.filter(d => {
    const q = search.toLowerCase();
    if (search && !d.name.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !d.batchNo.toLowerCase().includes(q)) return false;
    if (catFilter && d.category !== catFilter) return false;
    if (stockFilter && getStockStatus(d.stock, d.reorderLevel) !== stockFilter) return false;
    if (expiryFilter && getExpiryStatus(d.expiryDate) !== expiryFilter) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    return va < vb ? (sortDir === 'asc' ? -1 : 1) : va > vb ? (sortDir === 'asc' ? 1 : -1) : 0;
  });

  const onSort = key => { setSortKey(key); setSortDir(prev => key === sortKey ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); };

  const playSound = () => { try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } } catch {} };

  const doHide = async () => {
    setSaving(true);
    try {
      await pharmacyService.hideProduct(hidingDrug.id, { reason: hideReason, hide_type: hideType });
      setDrugs(prev => prev.map(d => d.id === hidingDrug.id ? { ...d, isHidden: true, hideType, hideReason } : d));
      setMsg({ type: 'success', text: `${hidingDrug.name} hidden from public view` });
      playSound();
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to hide drug' });
    } finally {
      setSaving(false);
      setHideSuccess(true);
      setTimeout(() => { setHidingDrug(null); setHideSuccess(false); setHideType(''); setHideReason(''); setMsg({ type: '', text: '' }); }, 1500);
    }
  };

  const doRestore = async (drug) => {
    setSaving(true);
    try {
      await pharmacyService.restoreProduct(drug.id);
      setDrugs(prev => prev.map(d => d.id === drug.id ? { ...d, isHidden: false, hideType: '', hideReason: '' } : d));
      setMsg({ type: 'success', text: `${drug.name} restored to public view` });
      playSound();
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to restore drug' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 2000);
    }
  };

  const resetFilters = () => { setSearch(''); setCatFilter(''); setStockFilter(''); setExpiryFilter(''); };

  const showEmpty = !loading && !error && filtered.length === 0;

  return (
    <div style={{ padding: 0, margin: 0, fontFamily: "'Inter','Segoe UI',sans-serif", color: DARK, minHeight: '100vh', background: LIME, overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin{100%{transform:rotate(360deg);}}
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(1.18)}}
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .inv-row:hover td { filter: brightness(.97); }
        .action-btn { transition: transform .12s, box-shadow .12s; }
        .action-btn:hover { transform: translateY(-2px) !important; }
        .action-btn:active { transform: translateY(2px) !important; box-shadow: none !important; }
      `}</style>

      {/* ══ TOP HEADER BAR ══════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD}`,
        padding: '0 24px', animation: 'fadeUp .3s ease'
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},${LIME},${PEACH},${GOLD})`,
          backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
          {/* Left – title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate('/pharmacy/stock-operations?tab=current')}
              className="action-btn"
              style={{
                width: 46, height: 46, background: GOLD, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: `3px solid ${GOLD2}`, boxShadow: `4px 4px 0 ${GOLD2}`, padding: 0
              }}
              title="Back to Stock Operations"
            >
              <ArrowLeft size={24} color={DARK} />
            </button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: LIME, margin: 0, lineHeight: 1.1 }}>
                Drug Catalog
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: GOLD }}>
                {drugs.length} registered drugs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isRealManager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: workerCanHide ? LIME : PEACH, border: `2px solid ${workerCanHide ? DARK : '#dc2626'}`, transition: 'all 0.3s', boxShadow: workerCanHide ? `3px 3px 0 ${DARK}` : '3px 3px 0 #dc2626', marginRight: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: workerCanHide ? DARK : '#991b1b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Worker Hide</span>
                  <span style={{ fontSize: 10, color: workerCanHide ? DARK : '#dc2626', fontWeight: 700 }}>{workerCanHide ? '✓ ON' : '✗ OFF'}</span>
                </div>
                <button onClick={() => toggleWorkerHideSetting({ target: { checked: !workerCanHide } })} disabled={loadingSetting}
                  style={{ width: 48, height: 24, border: `2px solid ${workerCanHide ? DARK : '#dc2626'}`, cursor: loadingSetting ? 'not-allowed' : 'pointer', background: workerCanHide ? DARK : '#fecaca', position: 'relative', padding: 0, outline: 'none' }}>
                  <span style={{ display: 'block', width: 16, height: 16, background: workerCanHide ? LIME : '#dc2626', position: 'absolute', top: 2, left: workerCanHide ? 26 : 2, transition: 'left 0.25s ease' }} />
                  {loadingSetting && <SegmentedSpinner size={11} />}
                </button>
              </div>
            )}
            
            <button
              onClick={handleRefresh}
              className="action-btn"
              style={{
                background: LIME, color: DARK, border: `3px solid ${GOLD2}`,
                padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                boxShadow: `4px 4px 0 ${GOLD2}`, display: 'inline-flex',
                alignItems: 'center', gap: 8, textTransform: 'uppercase',
                letterSpacing: '1.5px'
              }}
            >
              <SegmentedSpinner size={17} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ CONTENT AREA ════════════════════════════════════ */}
      <div style={{ padding: '0 0 32px' }}>
        <div style={{
          background: PEACH,
          border: `0 solid ${DARK}`,
          borderTop: `3px solid ${DARK}`,
          minHeight: 520,
          boxShadow: `6px 6px 0 rgba(42,63,8,.18)`,
          animation: 'fadeUp .4s ease'
        }}>
          
          {/* Filters Bar */}
          <div style={{ padding: '16px 24px', background: DARK, borderBottom: `3px solid ${GOLD}` }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={16} color={LIME} style={{ position: 'absolute', left: 14, top: 11, pointerEvents: 'none' }} />
                <input type="text" placeholder="Search by name, category, batch number..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 16px 9px 40px', border: `2px solid ${GOLD}`, borderRadius: 0, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: MID, color: LIME, fontWeight: 600 }}
                />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} style={selectStyle}>
                <option value="">All Stock Levels</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <select value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)} style={selectStyle}>
                <option value="">All Expiry</option>
                <option value="ok">OK</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
              <button onClick={() => setShowHidden(!showHidden)} className="action-btn"
                style={{ ...selectStyle, display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '9px 18px', background: showHidden ? LIME : MID, color: showHidden ? DARK : LIME, border: `2px solid ${GOLD}`, minWidth: 'auto', cursor: loading ? 'not-allowed' : 'pointer' }}
                disabled={loading}>
                <Eye size={15} /> {showHidden ? 'Showing Hidden' : 'Show Hidden'}
              </button>
            </div>

            {(search || catFilter || stockFilter || expiryFilter) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {search && <FilterChip onRemove={() => setSearch('')}>Search: "{search}"</FilterChip>}
                {catFilter && <FilterChip onRemove={() => setCatFilter('')}>Category: {catFilter}</FilterChip>}
                {stockFilter && <FilterChip onRemove={() => setStockFilter('')}>Stock: {stockFilter}</FilterChip>}
                {expiryFilter && <FilterChip onRemove={() => setExpiryFilter('')}>Expiry: {expiryFilter}</FilterChip>}
              </div>
            )}
          </div>

          {/* Toast */}
          {msg.text && (
            <div style={{
              position: 'fixed', top: 20, right: 20, zIndex: 9999,
              padding: '12px 24px', borderRadius: 0,
              background: msg.type === 'success' ? LIME : '#fef2f2',
              border: `3px solid ${msg.type === 'success' ? DARK : '#991b1b'}`,
              color: msg.type === 'success' ? DARK : '#991b1b',
              fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: `4px 4px 0 ${msg.type === 'success' ? DARK : '#991b1b'}`,
              animation: 'fadeSlide 0.3s ease-out'
            }}>
              {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {msg.text}
            </div>
          )}

          <audio ref={audioRef} src={infoSound} preload="auto" />

          {/* Error state */}
          {error && (
            <div style={{ background: '#fef2f2', padding: '16px 24px', borderBottom: '3px solid #dc2626', display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={20} color="#dc2626" />
              <span style={{ color: '#991b1b', fontWeight: 700, fontSize: 14, flex: 1 }}>{error}</span>
              <button onClick={() => loadData(showHidden)} className="action-btn" style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: '2px solid #991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '3px 3px 0 #991b1b' }}>Retry</button>
            </div>
          )}

          {/* Table Container */}
          <div style={{ background: PEACH, overflowX: 'auto', paddingBottom: 40 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <Th col="image" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Image</Th>
                  <Th col="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Drug Name</Th>
                  <Th col="category" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Category</Th>
                  <Th col="price" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Price</Th>
                  <Th col="stock" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Stock</Th>
                  <Th col="expiryDate" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Expiry Date</Th>
                  <Th col="batchNo" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Batch #</Th>
                  {isManager && <Th col="actions" sortKey={sortKey} sortDir={sortDir} onSort={() => {}}>Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center', background: PEACH }}>
                    <SegmentedSpinner size={32} />
                    <p style={{ color: DARK, margin: '12px 0 0', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: 12 }}>Loading drug catalog...</p>
                  </td></tr>
                ) : showEmpty ? (
                  <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center', background: PEACH }}>
                    <Package size={40} style={{ color: DARK, marginBottom: 12, opacity: 0.35 }} />
                    <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', color: DARK, textTransform: 'uppercase', letterSpacing: '1px' }}>No drugs found</p>
                    <p style={{ fontSize: 13, margin: 0, fontWeight: 600, color: '#50760F' }}>Try adjusting your search or filter criteria.</p>
                  </td></tr>
                ) : filtered.map((drug, idx) => {
                  const ss = getStockStatus(drug.stock, drug.reorderLevel);
                  const es = getExpiryStatus(drug.expiryDate);
                  const sm = STOCK_META[ss];
                  const em = EXPIRY_META[es];
                  const SI = sm.icon;
                  const EI = em.icon;
                  return (
                    <tr key={drug.id} className="inv-row"
                      style={{
                        borderBottom: `2px solid ${idx % 2 === 0 ? LIME : PEACH}`,
                        background: drug.isHidden ? '#faf5ff'
                          : es === 'expired' ? '#fee2e2'
                            : ss === 'out' ? '#fee2e2'
                              : idx % 2 === 0 ? PEACH : LIME,
                        transition: 'background 0.2s',
                        animation: `rowIn 0.28s ease-out ${idx * 0.025}s both`
                      }}>
                      <td style={{ padding: '10px 16px' }}>
                        {drug.image ? (
                          <img src={`http://localhost:5000${drug.image}`} alt={drug.name}
                            style={{ width: 42, height: 42, objectFit: 'cover', border: `2px solid ${DARK}`, display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{ width: 42, height: 42, background: LIME, border: `2px solid ${DARK}`, display: drug.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={17} color={DARK} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: DARK, fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {drug.name}
                          {drug.isHidden && <span style={{ fontSize: 10, background: '#ede9fe', color: '#7c3aed', padding: '2px 7px', border: '2px solid #7c3aed', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hidden</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: DARK }}>
                        <span style={{ padding: '3px 9px', background: DARK, color: LIME, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>{drug.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#16a34a', fontSize: 14 }}>ETB {drug.price.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, fontWeight: 800, border: `2px solid ${sm.color}`, background: sm.bg, color: sm.color, textTransform: 'uppercase' }}>
                          <span style={ss !== 'ok' ? { animation: 'blink 1.5s ease-in-out infinite', color: sm.color } : {}}>
                            <SI size={13} />
                          </span> {drug.stock} — {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, fontWeight: 800, border: `2px solid ${em.color}`, background: em.bg, color: em.color, textTransform: 'uppercase' }}>
                          <span style={es !== 'ok' ? { animation: 'blink 1.5s ease-in-out infinite', color: em.color } : {}}>
                            <EI size={13} />
                          </span> {drug.expiryDate} {es === 'expiring-soon' ? '(Soon)' : es === 'expired' ? '(Expired)' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: DARK, fontWeight: 700 }}>{drug.batchNo}</td>
                      {isManager && (
                        <td style={{ padding: '12px 16px' }}>
                          {drug.isHidden ? (
                            <button onClick={() => doRestore(drug)} disabled={saving} className="action-btn"
                              style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: '2px solid #14532d', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '3px 3px 0 #14532d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              <Eye size={12} /> Restore
                            </button>
                          ) : (
                            <button onClick={() => { setHidingDrug(drug); setHideType(''); setHideReason(''); }} className="action-btn"
                              style={{ padding: '6px 14px', background: '#d97706', color: '#fff', border: '2px solid #78350f', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '3px 3px 0 #78350f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              <EyeOff size={12} /> Hide
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Hide Drug Modal */}
      {hidingDrug && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,63,8,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeSlide 0.2s ease-out' }}>
          <div style={{ background: PEACH, border: `3px solid ${DARK}`, padding: 36, width: 480, boxShadow: `8px 8px 0 ${DARK}`, animation: 'fadeSlide 0.3s ease-out' }}>
            {hideSuccess ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ width: 64, height: 64, background: LIME, border: `3px solid ${DARK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color={DARK} />
                </div>
                <h3 style={{ color: DARK, margin: '0 0 6px 0', fontSize: 20, fontWeight: 900, textTransform: 'uppercase' }}>Drug Hidden</h3>
                <p style={{ color: DARK, margin: 0, fontSize: 14, fontWeight: 600 }}>{hidingDrug.name} has been hidden from public view.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, background: '#f5f3ff', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EyeOff size={20} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: DARK, fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>Hide from Public</h3>
                    <p style={{ color: DARK, margin: '2px 0 0', fontSize: 13, fontWeight: 600 }}>Drug: <strong>{hidingDrug.name}</strong></p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { value: 'temporary', label: 'Temporary', desc: 'Hidden until a Manager restores it' },
                    { value: 'permanent', label: 'Permanent', desc: 'Permanently hidden from all public views' },
                    { value: 'internal-only', label: 'Internal Only', desc: 'Visible only to pharmacy staff' },
                  ].map(opt => (
                    <label key={opt.value}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s', background: hideType === opt.value ? LIME : 'white', border: `2px solid ${hideType === opt.value ? DARK : '#cbd5e1'}`, boxShadow: hideType === opt.value ? `2px 2px 0 ${DARK}` : 'none' }}>
                      <input type="radio" value={opt.value} checked={hideType === opt.value} onChange={() => setHideType(opt.value)} style={{ marginTop: 3, accentColor: DARK }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: DARK, textTransform: 'uppercase' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: DARK, marginTop: 2, fontWeight: 600 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <textarea placeholder="Reason for hiding (required)..." value={hideReason} onChange={e => setHideReason(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: `2px solid ${DARK}`, fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', marginBottom: 20, boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 600, background: LIME }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button disabled={!hideType || !hideReason.trim() || saving} onClick={doHide} className={(!hideType || !hideReason.trim() || saving) ? '' : 'action-btn'}
                    style={{ flex: 1, padding: '12px', background: hideType && hideReason.trim() && !saving ? DARK : '#e2e8f0', color: hideType && hideReason.trim() && !saving ? LIME : '#94a3b8', border: hideType && hideReason.trim() && !saving ? `2px solid ${DARK}` : '2px solid transparent', fontWeight: 800, textTransform: 'uppercase', cursor: hideType && hideReason.trim() && !saving ? 'pointer' : 'not-allowed', fontSize: 13, transition: 'all 0.2s', boxShadow: hideType && hideReason.trim() && !saving ? `3px 3px 0 ${GOLD}` : 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving && <SegmentedSpinner size={16} />}
                    {saving ? 'Saving...' : 'Apply Hide'}
                  </button>
                  <button onClick={() => setHidingDrug(null)} disabled={saving} className={saving ? '' : 'action-btn'} style={{ flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: '2px solid #991b1b', fontWeight: 800, textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, boxShadow: saving ? 'none' : '3px 3px 0 #991b1b' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterChip = ({ children, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: LIME, color: DARK, border: `2px solid ${DARK}`, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
    {children}
    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DARK, padding: 0, display: 'flex', lineHeight: 1, fontSize: 16 }}>&times;</button>
  </span>
);

export default PharmacyMedicines;
