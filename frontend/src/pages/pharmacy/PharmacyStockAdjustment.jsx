import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Loader2, Search, Save, CheckCircle, XCircle, AlertTriangle, Package, ClipboardList } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useToast } from '../../components/Toast';

const OLIVE = '#B7C786';
const YELLOW = '#FEF3A5';
const DARK = '#2A3F08';
const MID = '#50760F';
const GOLD = '#D4A843';
const GOLD2 = '#9A701E';

const PharmacyStockAdjustment = () => {
  const { showToast, ToastContainer } = useToast();
  const [drugs, setDrugs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('add');
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [spinning, setSpinning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRaw, movRaw] = await Promise.all([
        pharmacyService.getAllProducts(),
        pharmacyService.getStockMovements()
      ]);
      setDrugs(Array.isArray(prodRaw) ? prodRaw : prodRaw?.data || []);
      setMovements(Array.isArray(movRaw) ? movRaw : movRaw?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); setSpinning(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => {
    setSpinning(true);
    loadData();
  };

  const selectedDrug = drugs.find(d => d.id === parseInt(selectedId));

  const doSubmit = async () => {
    if (!selectedId || !adjQty || !adjReason.trim()) return;
    setSaving(true);
    try {
      const qty = adjType === 'remove' ? -Math.abs(parseInt(adjQty)) : Math.abs(parseInt(adjQty));
      const requestedVal = (selectedDrug.stock_quantity || 0) + qty;
      
      if (requestedVal < 0) {
        setMsg({ type: 'error', text: 'Stock cannot go below 0' });
        setSaving(false);
        return;
      }
      
      await pharmacyService.createManagerRequest({
        drug_id: selectedDrug.id,
        drug_name: selectedDrug.name,
        drug_image: selectedDrug.drug_image,
        request_type: 'QUANTITY',
        current_value: selectedDrug.stock_quantity || 0,
        requested_value: requestedVal,
        reason: adjReason
      });
      setMsg({ type: 'success', text: `Adjustment requested for ${selectedDrug?.name} ${qty >= 0 ? '+' : ''}${qty}. Pending CEO approval.` });
      setAdjQty('');
      setAdjReason('');
      loadData();
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Adjustment failed' });
    } finally { setSaving(false); setTimeout(() => setMsg({ type: '', text: '' }), 5000); }
  };

  const filteredMovements = movements.filter(m => {
    const qtyChange = parseInt(m.quantity_change || m.quantity || 0);
    const mType = (m.type || (qtyChange >= 0 ? 'add' : 'remove')).toLowerCase();
    
    if (typeFilter && mType !== typeFilter.toLowerCase()) return false;
    const q = search.toLowerCase();
    return (m.drug_name || '').toLowerCase().includes(q) || 
           (m.reason || m.notes || '').toLowerCase().includes(q) || 
           mType.includes(q) || 
           (m.reference || m.reference_no || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 0, margin: 0, minHeight: '100vh', width: '100%', background: OLIVE, fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        
        /* 3D Animations */
        @keyframes blink3D {
          0%, 100% { opacity: 1; transform: perspective(400px) rotateY(0deg) scale(1); }
          50% { opacity: 0.4; transform: perspective(400px) rotateY(180deg) scale(1.1); }
        }
        @keyframes spin3D {
          100% { transform: perspective(400px) rotateX(360deg) rotateY(180deg); }
        }
        @keyframes rowIn3D {
          from { opacity: 0; transform: perspective(800px) rotateX(-60deg) translateY(-20px); }
          to { opacity: 1; transform: perspective(800px) rotateX(0deg) translateY(0); }
        }

        .action-btn-3d { 
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .action-btn-3d:hover { 
          transform: perspective(600px) translateZ(10px) translateY(-3px) rotateX(5deg) !important;
          box-shadow: 0 8px 0 #9A701E, 0 12px 15px rgba(0,0,0,0.2) !important;
        }
        .action-btn-3d:active { 
          transform: perspective(600px) translateZ(0) translateY(5px) rotateX(0deg) !important; 
          box-shadow: 0 0 0 #9A701E !important; 
        }

        .inv-row-3d {
          transition: transform 0.25s, background 0.25s, box-shadow 0.25s;
          transform-style: preserve-3d;
        }
        .inv-row-3d:hover {
          transform: perspective(800px) scale(1.005) translateZ(5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          z-index: 10;
          position: relative;
          background: #fff !important;
        }

        .icon-3d {
          animation: blink3D 3s ease-in-out infinite;
        }
      `}</style>
      <ToastContainer />

      {msg.text && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 24px', borderRadius: 0,
          background: msg.type === 'success' ? OLIVE : '#fef2f2',
          border: `3px solid ${msg.type === 'success' ? DARK : '#991b1b'}`,
          color: msg.type === 'success' ? DARK : '#991b1b',
          fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `4px 4px 0 ${msg.type === 'success' ? DARK : '#991b1b'}`,
          animation: 'fadeSlide 0.3s ease-out'
        }}>
          <span className="icon-3d" style={{ display: 'inline-block' }}>
            {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </span>
          {msg.text}
        </div>
      )}

      {/* ══ TOP HEADER BAR ══════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD}`,
        padding: '0 24px', animation: 'fadeUp .3s ease'
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},${YELLOW},${OLIVE},${GOLD})`,
          backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
          {/* Left – title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, perspective: 600 }}>
            <div
              className="icon-3d"
              style={{
                width: 46, height: 46, background: GOLD, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: `3px solid ${GOLD2}`, boxShadow: `4px 4px 0 ${GOLD2}`
              }}
            >
              <Sliders size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: YELLOW, margin: 0, lineHeight: 1.1 }}>
                Stock Adjustment
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: GOLD }}>
                Audit • Reconcile • Track
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Right – single Refresh button */}
            <button
              onClick={handleRefresh}
              className="action-btn-3d"
              style={{
                background: YELLOW, color: DARK, border: `3px solid ${GOLD2}`,
                padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                boxShadow: `4px 4px 0 ${GOLD2}`, display: 'inline-flex',
                alignItems: 'center', gap: 8, textTransform: 'uppercase',
                letterSpacing: '1.5px'
              }}
            >
              <RefreshCw size={17} style={spinning ? { animation: 'spin .7s linear infinite' } : {}} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ CONTENT AREA ════════════════════════════════════ */}
      <div style={{ padding: '24px', animation: 'fadeUp .4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          
          {/* Adjustment Form */}
          <div style={{ background: YELLOW, border: `3px solid ${DARK}`, padding: 24, boxShadow: `6px 6px 0 ${DARK}` }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 900, color: DARK, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="icon-3d"><Sliders size={18} color={DARK} /></span> New Adjustment
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Drug</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={inputStyle()}>
                <option value="">Choose a drug...</option>
                {drugs.map(d => <option key={d.id} value={d.id}>{d.name} (Stock: {d.stock_quantity || 0})</option>)}
              </select>
            </div>
            {selectedDrug && (
              <div style={{ padding: '12px 16px', background: OLIVE, border: `3px solid ${DARK}`, marginBottom: 16, fontSize: 13, color: DARK, fontWeight: 700, boxShadow: `3px 3px 0 ${DARK}` }}>
                CURRENT STOCK: <strong style={{ fontWeight: 900, fontSize: 15 }}>{selectedDrug.stock_quantity || 0}</strong> | REORDER LEVEL: {selectedDrug.reorder_level || 10}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Adjustment Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['add', 'remove'].map(t => (
                  <label key={t} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', cursor: 'pointer', background: adjType === t ? DARK : 'white', border: `3px solid ${DARK}`, transition: 'all 0.2s', boxShadow: adjType === t ? `3px 3px 0 ${GOLD}` : 'none' }}>
                    <input type="radio" value={t} checked={adjType === t} onChange={() => setAdjType(t)} style={{ accentColor: t === 'add' ? OLIVE : '#dc2626' }} />
                    <span style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: adjType === t ? (t === 'add' ? OLIVE : '#fca5a5') : DARK }}>
                      {t === 'add' ? '+ Add Stock' : '- Remove Stock'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Quantity</label>
              <input type="number" min={1} value={adjQty} onChange={e => setAdjQty(e.target.value)} style={inputStyle()} placeholder="0" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Reason</label>
              <textarea value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Why is this adjustment needed?"
                style={{ ...inputStyle(), resize: 'vertical', minHeight: 80 }} />
            </div>
            <button disabled={!selectedId || !adjQty || !adjReason.trim() || saving} onClick={doSubmit} className={(!selectedId || !adjQty || !adjReason.trim() || saving) ? '' : 'action-btn-3d'}
              style={{ width: '100%', padding: '16px', background: selectedId && adjQty && adjReason.trim() && !saving ? GOLD : '#e2e8f0', color: selectedId && adjQty && adjReason.trim() && !saving ? DARK : '#94a3b8', border: selectedId && adjQty && adjReason.trim() && !saving ? `3px solid ${GOLD2}` : '3px solid transparent', fontWeight: 900, cursor: selectedId && adjQty && adjReason.trim() && !saving ? 'pointer' : 'not-allowed', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1.2px', boxShadow: selectedId && adjQty && adjReason.trim() && !saving ? `5px 5px 0 ${GOLD2}` : 'none' }}>
              {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {saving ? 'Requesting...' : <><span className="icon-3d"><Save size={18} /></span> Request Adjustment</>}
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeSlide 0.5s ease-out' }}>
            <div style={{ background: YELLOW, border: `3px solid ${DARK}`, padding: 24, boxShadow: `6px 6px 0 ${DARK}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 900, color: DARK, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Total Drugs', value: drugs.length, color: DARK, bg: OLIVE },
                  { label: 'Recent Adjustments', value: movements.slice(0, 50).length, color: '#92400e', bg: '#fef3c7' },
                ].map(c => (
                  <div key={c.label} style={{ background: c.bg, padding: '16px', border: `3px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}` }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: c.color, marginBottom: 6, textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: DARK, border: `3px solid ${GOLD}`, padding: 24, color: YELLOW, boxShadow: `6px 6px 0 ${GOLD}` }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="icon-3d"><AlertTriangle size={16} /></span> Reminder
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 700 }}>
                All stock adjustments require Manager/CEO approval before stock is actually modified. Always provide a clear reason for audit compliance.
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div style={{ background: YELLOW, border: `3px solid ${DARK}`, overflow: 'hidden', boxShadow: `6px 6px 0 ${DARK}`, animation: 'fadeSlide 0.6s ease-out' }}>
          <div style={{ padding: '20px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DARK }}>
            <span style={{ fontWeight: 900, color: YELLOW, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="icon-3d"><ClipboardList size={18} color={YELLOW} /></span> Adjustment & Movement Audit Log
            </span>
            <span style={{ fontSize: 12, color: DARK, background: OLIVE, padding: '4px 10px', fontWeight: 900 }}>
              {loading ? <><Loader2 size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 6 }} />LOADING...</> : `${filteredMovements.length} RECORDS`}
            </span>
          </div>
          
          <div style={{ padding: '16px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', gap: 12, background: OLIVE }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color={DARK} style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none', fontWeight: 900 }} />
              <input type="text" placeholder="Search audit log..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 40px', border: `3px solid ${DARK}`, borderRadius: 0, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontWeight: 700, color: DARK }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '10px 14px', border: `3px solid ${DARK}`, borderRadius: 0, fontSize: 13, outline: 'none', fontWeight: 700, color: DARK, background: 'white' }}>
              <option value="">All Types</option>
              <option value="add">Add (+)</option>
              <option value="remove">Remove (-)</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Drug</th>
                  <th style={thStyle}>Type</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                  <th style={thStyle}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: DARK }} />
                  </td></tr>
                ) : filteredMovements.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center', color: DARK }}>
                    <span className="icon-3d" style={{ display: 'inline-block', fontSize: 40, marginBottom: 12 }}>📦</span>
                    <p style={{ fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>No adjustments recorded yet</p>
                  </td></tr>
                ) : filteredMovements.map((m, idx) => {
                  const qtyChange = parseInt(m.quantity_change || m.quantity || 0);
                  const isAdd = (m.type || '').toLowerCase() === 'add' || (m.type || '').toLowerCase() === 'in' || qtyChange >= 0;
                  return (
                    <tr key={m.id || idx} className="inv-row-3d" style={{ borderBottom: `2px solid ${DARK}`, background: idx % 2 === 0 ? YELLOW : OLIVE, animation: `rowIn3D 0.3s ease-out ${idx * 0.03}s both` }}>
                      <td style={{ padding: '14px 16px', color: DARK, fontSize: 12, whiteSpace: 'nowrap', fontWeight: 800 }}>{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: DARK, fontSize: 14 }}>{m.drug_name || 'Unknown'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 900, border: `2px solid ${isAdd ? '#065f46' : '#991b1b'}`, background: isAdd ? '#d1fae5' : '#fee2e2', color: isAdd ? '#065f46' : '#991b1b', textTransform: 'uppercase' }}>
                          <span className="icon-3d" style={{ display: 'inline-block' }}>{isAdd ? 'ADD' : 'REMOVE'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, color: isAdd ? '#059669' : '#dc2626', fontSize: 15 }}>
                        {isAdd ? '+' : ''}{qtyChange}
                      </td>
                      <td style={{ padding: '14px 16px', color: DARK, fontSize: 13, fontWeight: 700 }}>{m.reason || m.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 900, color: DARK, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = () => ({ 
  width: '100%', padding: '12px 16px', borderRadius: 0, 
  border: `3px solid ${DARK}`, fontSize: 13, fontWeight: 700,
  background: 'white', color: DARK, outline: 'none', 
  transition: 'all 0.2s', boxSizing: 'border-box',
  boxShadow: `3px 3px 0 ${DARK}`
});
const thStyle = { padding: '14px 16px', textAlign: 'left', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: OLIVE, borderBottom: `3px solid ${DARK}`, background: DARK };

export default PharmacyStockAdjustment;
