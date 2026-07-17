import React, { useState, useEffect } from 'react';
import { Layers, Search, Loader2, CheckCircle, XCircle, RefreshCw, Package } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

/* ── Palette ─────────────────────────────────────────── */
const WHITE  = '#F4FDF7';   // near-white mint
const SAGE   = '#C2C99F';   // sage / muted olive
const DARK   = '#1E2D1A';   // deep forest (text / borders)
const MID    = '#3A5C30';   // medium forest (header)
const ACCENT = '#4E7C3F';   // vibrant leaf green
const GOLD   = '#D4A843';
const GOLD2  = '#9A701E';

const PharmacyBatches = () => {
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [msg,      setMsg]      = useState({ type: '', text: '' });
  const [spinning, setSpinning] = useState(false);

  /* ── data ── */
  const loadBatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res      = await pharmacyService.getAllProducts();
      const products = Array.isArray(res) ? res : res?.data || [];
      const extracted = products.map(p => {
        const batchNo = p.batch_number || p.batch_no || `BATCH-${String(p.id).padStart(4, '0')}`;
        const expiry  = p.expiry_date || '';
        const qty     = parseInt(p.stock_quantity || 0);
        const status  = expiry && new Date(expiry) < new Date() ? 'expired' : 'active';
        return { id: p.id, batchNo, drug: p.name || 'Unknown', qty, expiry, status };
      });
      setBatches(extracted);
      if (extracted.length > 0) {
        setMsg({ type: 'success', text: `Loaded ${extracted.length} batch(es)` });
        setTimeout(() => setMsg({ type: '', text: '' }), 3000);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load batch data');
      setBatches([]);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleRefresh = () => { setSpinning(true); loadBatches(); };

  const filtered = batches.filter(b =>
    !search || b.drug.toLowerCase().includes(search.toLowerCase())
  );

  /* ── helpers ── */
  const thStyle = {
    padding: '14px 18px', textAlign: 'left', fontWeight: 900,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em',
    color: WHITE, background: DARK, borderBottom: `3px solid ${ACCENT}`,
    whiteSpace: 'nowrap',
  };

  /* ════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 0, margin: 0, minHeight: '100vh', width: '100%', background: WHITE, fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes spin     { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

        @keyframes blink3D {
          0%,100%{ opacity:1;  transform:perspective(400px) rotateY(0deg)   scale(1); }
          50%    { opacity:0.5; transform:perspective(400px) rotateY(180deg) scale(1.15); }
        }
        @keyframes rowIn3D {
          from{ opacity:0; transform:perspective(900px) rotateX(-55deg) translateY(-18px); }
          to  { opacity:1; transform:perspective(900px) rotateX(0deg)   translateY(0);     }
        }
        @keyframes iconPop {
          0%,100%{ transform:scale(1)    rotateZ(0deg); }
          50%    { transform:scale(1.28) rotateZ(14deg); }
        }
        @keyframes badgePop {
          0%,100%{ transform:perspective(300px) rotateX(0deg) scale(1); }
          50%    { transform:perspective(300px) rotateX(20deg) scale(1.08); }
        }

        /* Button 3-D lift */
        .btn3d {
          transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
        }
        .btn3d:hover {
          transform: perspective(500px) translateZ(12px) translateY(-4px) rotateX(6deg) !important;
          box-shadow: 0 10px 0 ${GOLD2}, 0 14px 20px rgba(0,0,0,.25) !important;
        }
        .btn3d:active {
          transform: perspective(500px) translateZ(0) translateY(5px) rotateX(0deg) !important;
          box-shadow: 0 0 0 ${GOLD2} !important;
        }

        /* Row 3-D hover */
        .row3d {
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          transform-style: preserve-3d;
        }
        .row3d:hover {
          transform: perspective(900px) scale(1.006) translateZ(7px);
          box-shadow: 0 8px 22px rgba(0,0,0,.13);
          z-index: 5;
          position: relative;
          background: white !important;
        }

        .icon3d  { animation: blink3D 3.2s ease-in-out infinite; display:inline-block; }
        .iconPop { animation: iconPop  2.5s ease-in-out infinite; display:inline-block; }
        .badge3d { animation: badgePop 2.8s ease-in-out infinite; display:inline-block; }
      `}</style>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 24px', borderRadius: 0,
          background: msg.type === 'success' ? WHITE : '#fef2f2',
          border: `3px solid ${msg.type === 'success' ? DARK : '#991b1b'}`,
          color: msg.type === 'success' ? DARK : '#991b1b',
          fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `4px 4px 0 ${msg.type === 'success' ? DARK : '#991b1b'}`,
          animation: 'fadeSlide .3s ease-out',
        }}>
          <span className="icon3d">
            {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </span>
          {msg.text}
        </div>
      )}

      {/* ══ HEADER BAR ══════════════════════════════════════════ */}
      <div style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: '0 24px', animation: 'fadeUp .3s ease' }}>
        {/* shimmer strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},${WHITE},${SAGE},${ACCENT})`, backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>

          {/* Left – icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon3d" style={{
              width: 48, height: 48, background: SAGE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${WHITE}`, boxShadow: `4px 4px 0 ${WHITE}`,
            }}>
              <Layers size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: WHITE, margin: 0, lineHeight: 1.1 }}>
                Batch Management
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: SAGE }}>
                Track • Monitor • Resolve
              </p>
            </div>
          </div>

          {/* Centre – stat pills */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { icon: <Layers size={13}/>,  label: 'BATCH OPS',              color: SAGE  },
              { icon: <Package size={13}/>, label: `${filtered.length} BATCHES`, color: WHITE },
            ].map((p, i) => (
              <div key={i} className="icon3d" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.13)', color: p.color,
                fontSize: 10, fontWeight: 800, letterSpacing: '1.5px',
              }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>

          {/* Right – single Refresh */}
          <button
            onClick={handleRefresh}
            className="btn3d"
            style={{
              background: SAGE, color: DARK, border: `3px solid ${DARK}`,
              padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
              boxShadow: `4px 4px 0 ${DARK}`, display: 'inline-flex',
              alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1.5px',
            }}
          >
            <RefreshCw size={17} style={spinning ? { animation: 'spin .7s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════ */}
      <div style={{ padding: '24px', animation: 'fadeUp .4s ease' }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: `3px solid #dc2626`, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `4px 4px 0 #dc2626` }}>
            <span className="icon3d"><XCircle size={20} color="#dc2626" /></span>
            <span style={{ color: '#991b1b', fontWeight: 700, flex: 1 }}>{error}</span>
            <button onClick={handleRefresh} className="btn3d" style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: `3px solid #991b1b`, fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: `3px 3px 0 #991b1b` }}>Retry</button>
          </div>
        )}

        {/* Search bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={17} color={DARK} style={{ position: 'absolute', left: 14, top: 13, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by drug name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 46px',
                border: `3px solid ${DARK}`, borderRadius: 0,
                fontSize: 13, fontWeight: 700, color: DARK,
                background: 'white', outline: 'none', boxSizing: 'border-box',
                boxShadow: `3px 3px 0 ${DARK}`,
              }}
            />
          </div>
        </div>

        {/* Table card */}
        <div style={{ background: WHITE, border: `3px solid ${DARK}`, overflow: 'hidden', boxShadow: `6px 6px 0 ${DARK}`, animation: 'fadeSlide .5s ease-out' }}>

          {/* Table header bar */}
          <div style={{ padding: '18px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DARK }}>
            <span style={{ fontWeight: 900, color: WHITE, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="icon3d"><Layers size={18} color={SAGE} /></span>
              Batch Records
            </span>
            <span style={{ fontSize: 12, color: DARK, background: SAGE, padding: '4px 12px', fontWeight: 900 }}>
              {loading
                ? <><Loader2 size={13} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 6 }} />LOADING...</>
                : `${filtered.length} BATCH(ES)`}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Batch No</th>
                  <th style={thStyle}>Drug Name</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Quantity</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '70px 24px', textAlign: 'center' }}>
                    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: DARK }} />
                    <p style={{ color: DARK, margin: '14px 0 0', fontWeight: 800, textTransform: 'uppercase' }}>Loading batch data…</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '70px 24px', textAlign: 'center' }}>
                    <span className="iconPop" style={{ display: 'block', fontSize: 40, marginBottom: 14 }}>📦</span>
                    <p style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px', color: DARK, textTransform: 'uppercase' }}>No batches found</p>
                    <p style={{ fontSize: 13, margin: 0, fontWeight: 700, color: MID }}>Try a different search term.</p>
                  </td></tr>
                ) : filtered.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="row3d"
                    style={{
                      borderBottom: `2px solid ${DARK}`,
                      background: idx % 2 === 0 ? WHITE : SAGE + '55',
                      animation: `rowIn3D .35s ease-out ${idx * 0.03}s both`,
                    }}
                  >
                    {/* Batch No */}
                    <td style={{ padding: '14px 18px', fontWeight: 900, fontFamily: 'monospace', color: ACCENT, fontSize: 13 }}>
                      {b.batchNo}
                    </td>

                    {/* Drug Name */}
                    <td style={{ padding: '14px 18px', fontWeight: 900, color: DARK, fontSize: 14 }}>
                      {b.drug}
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 900, color: DARK, fontSize: 15 }}>
                      {b.qty}
                    </td>

                    {/* Expiry Date */}
                    <td style={{ padding: '14px 18px', color: b.status === 'expired' ? '#dc2626' : DARK, fontWeight: b.status === 'expired' ? 900 : 700 }}>
                      {b.expiry || 'N/A'}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        className="badge3d"
                        style={{
                          padding: '5px 12px', fontSize: 11, fontWeight: 900,
                          border: `2px solid ${b.status === 'expired' ? '#dc2626' : ACCENT}`,
                          background: b.status === 'expired' ? '#fee2e2' : '#dcfce7',
                          color: b.status === 'expired' ? '#dc2626' : '#166534',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                      >
                        {b.status === 'expired' ? '✕ Expired' : '✓ Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyBatches;
