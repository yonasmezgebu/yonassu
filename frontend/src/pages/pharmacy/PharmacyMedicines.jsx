import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './StockOperations.css'; // Use the shared CSS for enterprise design
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, EyeOff, Eye,
  Package, AlertTriangle, XCircle, CheckCircle, Clock, ArrowLeft
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../hooks/useAuth';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const today = new Date();
const inDays = (d, n) => new Date(d) <= new Date(today.getTime() + n * 86400000);
const getExpiryStatus = d => { const e = new Date(d); if (e < today) return 'expired'; if (inDays(d, 30)) return 'expiring-soon'; return 'ok'; };
const getStockStatus = (stock, reorder) => stock === 0 ? 'out' : stock < reorder ? 'low' : 'ok';

const STOCK_META = {
  ok: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'In Stock', icon: CheckCircle },
  low: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Low Stock', icon: AlertTriangle },
  out: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Out of Stock', icon: XCircle }
};
const EXPIRY_META = {
  ok: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', icon: CheckCircle },
  'expiring-soon': { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', icon: Clock },
  expired: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', icon: XCircle }
};

const Th = ({ col, sortKey, sortDir, onSort, children }) => (
  <th onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
      <span style={{ color: sortKey === col ? 'var(--color-primary)' : 'var(--color-text-muted)', display: 'inline-flex' }}>
        {sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} />}
      </span>
    </span>
  </th>
);

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
        price: parseFloat(p.price || 0), selling_price: parseFloat(p.selling_price || p.price || 0), stock: parseInt(p.stock_quantity || 0),
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
    const handleSearch = (e) => setSearch(e.detail || '');
    window.addEventListener('dashboardSearch', handleSearch);
    return () => window.removeEventListener('dashboardSearch', handleSearch);
  }, []);

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
    <div className="pso-root">
      
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <button
            type="button"
            onClick={() => navigate('/pharmacy/stock-operations?tab=current')}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)', color: 'var(--color-text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Back to Stock Operations"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="pso-title">Drug Catalog</h1>
            <p className="pso-subtitle">{drugs.length} registered drugs</p>
          </div>
        </div>

        <div className="pso-header-right">
          {isRealManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px', background: workerCanHide ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${workerCanHide ? 'var(--color-success)' : 'var(--color-danger)'}`, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: workerCanHide ? 'var(--color-success)' : 'var(--color-danger)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Worker Hide</span>
                <span style={{ fontSize: 11, color: workerCanHide ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>{workerCanHide ? '✓ ON' : '✗ OFF'}</span>
              </div>
              <input 
                type="checkbox"
                checked={workerCanHide}
                onChange={toggleWorkerHideSetting}
                disabled={loadingSetting}
                style={{ width: 16, height: 16, cursor: loadingSetting ? 'not-allowed' : 'pointer' }}
              />
            </div>
          )}
          
          <button
            type="button"
            onClick={handleRefresh}
            className="pso-btn-refresh"
            disabled={spinning}
          >
            <SegmentedSpinner size={15} spinning={spinning} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────── */}
      <div className="pso-content">
        <div className="card-container" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Filters Bar */}
          <div className="toolbar" style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search by name, category, batch number..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto', flex: 1, minWidth: 140 }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} style={{ width: 'auto', flex: 1, minWidth: 140 }}>
              <option value="">All Stock Levels</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <select value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)} style={{ width: 'auto', flex: 1, minWidth: 140 }}>
              <option value="">All Expiry</option>
              <option value="ok">OK</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <button onClick={() => setShowHidden(!showHidden)} disabled={loading} style={{ background: showHidden ? 'var(--color-primary)' : 'var(--color-bg-card)', color: showHidden ? 'white' : 'var(--color-text-primary)' }}>
              <Eye size={14} /> {showHidden ? 'Showing Hidden' : 'Show Hidden'}
            </button>
          </div>

          {(search || catFilter || stockFilter || expiryFilter) && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
              {search && <FilterChip onRemove={() => setSearch('')}>Search: "{search}"</FilterChip>}
              {catFilter && <FilterChip onRemove={() => setCatFilter('')}>Category: {catFilter}</FilterChip>}
              {stockFilter && <FilterChip onRemove={() => setStockFilter('')}>Stock: {stockFilter}</FilterChip>}
              {expiryFilter && <FilterChip onRemove={() => setExpiryFilter('')}>Expiry: {expiryFilter}</FilterChip>}
            </div>
          )}

          {/* Toast */}
          {msg.text && (
            <div className={`toast ${msg.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ margin: '16px 20px', background: msg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', border: `1px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {msg.text}
            </div>
          )}

          <audio ref={audioRef} src={infoSound} preload="auto" />

          {/* Error state */}
          {error && (
            <div style={{ padding: '16px 20px', margin: '16px 20px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={20} color="var(--color-danger)" />
              <span style={{ color: 'var(--color-danger)', fontWeight: 500, flex: 1 }}>{error}</span>
              <button onClick={() => loadData(showHidden)} className="btn-primary">Retry</button>
            </div>
          )}

          {/* Table Container */}
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <Th col="image" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Image</Th>
                  <Th col="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Drug Name</Th>
                  <Th col="category" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Category</Th>
                  <Th col="price" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Cost Price</Th>
                  <Th col="selling_price" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Selling Price</Th>
                  <Th col="stock" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Stock</Th>
                  <Th col="expiryDate" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Expiry Date</Th>
                  <Th col="batchNo" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Batch #</Th>
                  {isManager && <Th col="actions" sortKey={sortKey} sortDir={sortDir} onSort={() => {}}>Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><SegmentedSpinner size={32} /></div>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 12 }}>Loading drug catalog...</p>
                  </td></tr>
                ) : showEmpty ? (
                  <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <Package size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>No drugs found</p>
                    <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-secondary)' }}>Try adjusting your search or filter criteria.</p>
                  </td></tr>
                ) : filtered.map((drug, idx) => {
                  const ss = getStockStatus(drug.stock, drug.reorderLevel);
                  const es = getExpiryStatus(drug.expiryDate);
                  const sm = STOCK_META[ss];
                  const em = EXPIRY_META[es];
                  const SI = sm.icon;
                  const EI = em.icon;
                  return (
                    <tr key={drug.id} style={{ background: drug.isHidden ? '#f8fafc' : es === 'expired' ? 'var(--color-danger-bg)' : ss === 'out' ? 'var(--color-danger-bg)' : 'var(--color-bg-card)' }}>
                      <td>
                        {drug.image ? (
                          <img src={`http://localhost:5000${drug.image}`} alt={drug.name}
                            style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block', border: '1px solid var(--color-border)' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', display: drug.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={16} color="var(--color-text-muted)" />
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {drug.name}
                          {drug.isHidden && <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>Hidden</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{drug.category}</span>
                      </td>
                      <td className="amount">ETB {drug.price.toFixed(2)}</td>
                      <td className="amount">ETB {drug.selling_price.toFixed(2)}</td>
                      <td>
                        <span className="badge" style={{ background: sm.bg, color: sm.color }}>
                          <SI size={12} /> {drug.stock} — {sm.label}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: em.bg, color: em.color }}>
                          <EI size={12} /> {drug.expiryDate} {es === 'expiring-soon' ? '(Soon)' : es === 'expired' ? '(Expired)' : ''}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-secondary)' }}>{drug.batchNo}</td>
                      {isManager && (
                        <td>
                          {drug.isHidden ? (
                            <button onClick={() => doRestore(drug)} disabled={saving} className="btn-primary" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>
                              <Eye size={12} /> Restore
                            </button>
                          ) : (
                            <button onClick={() => { setHidingDrug(drug); setHideType(''); setHideReason(''); }} style={{ height: 28, padding: '0 10px', fontSize: 12 }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card-container" style={{ width: 480, margin: 20 }}>
            {hideSuccess ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color="var(--color-success)" />
                </div>
                <h3 style={{ margin: '0 0 6px 0' }}>Drug Hidden</h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{hidingDrug.name} has been hidden from public view.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EyeOff size={18} color="var(--color-text-secondary)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>Hide from Public</h3>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '2px 0 0', fontSize: 13 }}>Drug: <strong>{hidingDrug.name}</strong></p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { value: 'temporary', label: 'Temporary', desc: 'Hidden until a Manager restores it' },
                    { value: 'permanent', label: 'Permanent', desc: 'Permanently hidden from all public views' },
                    { value: 'internal-only', label: 'Internal Only', desc: 'Visible only to pharmacy staff' },
                  ].map(opt => (
                    <label key={opt.value}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 'var(--radius-md)', transition: 'all 0.15s', background: hideType === opt.value ? 'var(--color-info-bg)' : 'var(--color-bg-card)', border: `1px solid ${hideType === opt.value ? 'var(--color-info)' : 'var(--color-border)'}` }}>
                      <input type="radio" value={opt.value} checked={hideType === opt.value} onChange={() => setHideType(opt.value)} style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: hideType === opt.value ? 'var(--color-info)' : 'var(--color-text-primary)' }}>{opt.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <textarea placeholder="Reason for hiding (required)..." value={hideReason} onChange={e => setHideReason(e.target.value)} style={{ marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setHidingDrug(null)} disabled={saving}>Cancel</button>
                  <button disabled={!hideType || !hideReason.trim() || saving} onClick={doHide} className="btn-primary">
                    {saving && <SegmentedSpinner size={14} />}
                    {saving ? 'Saving...' : 'Apply Hide'}
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
  <span className="badge" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
    {children}
    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, height: 'auto', display: 'flex', color: 'var(--color-text-muted)' }}>&times;</button>
  </span>
);

export default PharmacyMedicines;
