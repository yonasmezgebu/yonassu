import React, { useState, useEffect } from 'react';
import { Layers, Search, CheckCircle, XCircle, Package } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

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

  const activeCount  = batches.filter(b => b.status === 'active').length;
  const expiredCount = batches.filter(b => b.status === 'expired').length;

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="pso-root">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .batch-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: var(--color-bg-card);
          border-left: 4px solid var(--color-success);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 14px 20px; min-width: 280px;
          animation: slideIn .2s ease;
          display: flex; gap: 12px; align-items: center;
          font-size: 14px; font-weight: 500;
          color: var(--color-text-primary);
        }
        .batch-toast.error { border-left-color: var(--color-danger); }

        .batch-row { transition: background var(--transition); }
        .batch-row:hover { background: var(--color-bg-page) !important; }

        /* KPI stat cards hover */
        .batch-stat-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition), transform var(--transition);
          cursor: default;
        }
        .batch-stat-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Toast notification */}
      {msg.text && (
        <div className={`batch-toast ${msg.type === 'error' ? 'error' : ''}`}>
          {msg.type === 'success'
            ? <CheckCircle size={18} color="var(--color-success)" />
            : <XCircle size={18} color="var(--color-danger)" />}
          <span style={{ flex: 1 }}>{msg.text}</span>
          <button
            onClick={() => setMsg({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >✕</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: 'var(--shadow-sm)',
          }}>
            <Layers size={20} />
          </div>
          <div>
            <h1 className="pso-title">Batch Management</h1>
            <p className="pso-subtitle">Track · Monitor · Resolve</p>
          </div>
        </div>
        <div className="pso-header-right">
          <span className="pso-badge">
            <Package size={12} /> {loading ? '…' : `${filtered.length} Batches`}
          </span>
          <button
            onClick={handleRefresh}
            className="pso-btn-refresh"
            disabled={spinning || loading}
          >
            <SegmentedSpinner size={15} spinning={spinning || loading} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="pso-content">
        <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

          {/* Error banner */}
          {error && (
            <div style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px', marginBottom: 20,
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <XCircle size={16} /> {error}
              <button
                onClick={handleRefresh}
                className="btn-secondary"
                style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI stat cards */}
          {!loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}>
              <div className="batch-stat-card">
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Total Batches
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {batches.length}
                </div>
              </div>
              <div className="batch-stat-card">
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Active Batches
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>
                  {activeCount}
                </div>
              </div>
              <div className="batch-stat-card">
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Expired Batches
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: expiredCount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                  {expiredCount}
                </div>
              </div>
              <div className="batch-stat-card">
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Filtered Results
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-info)' }}>
                  {filtered.length}
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative', maxWidth: 480 }}>
              <Search
                size={15}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                className="pso-input"
                type="text"
                placeholder="Search by drug name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Table card */}
          <div className="card-container" style={{ overflow: 'hidden', padding: 0 }}>

            {/* Table header bar */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--color-bg-card)', flexWrap: 'wrap', gap: 12,
            }}>
              <span style={{
                fontWeight: 600, color: 'var(--color-text-primary)',
                fontSize: 16, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Layers size={18} color="var(--color-primary)" /> Batch Records
              </span>
              <span className="pso-badge">
                {loading
                  ? <><SegmentedSpinner size={12} spinning={true} /> Loading…</>
                  : `${filtered.length} Batch(es)`}
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="pso-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Batch No</th>
                    <th>Drug Name</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <SegmentedSpinner size={28} spinning={true} />
                        <p style={{ margin: '14px 0 0', fontWeight: 500 }}>Loading batch data…</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                          No batches found
                        </p>
                        <p style={{ fontSize: 13, margin: 0 }}>
                          {search ? 'Try a different search term.' : 'No batch data available.'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map((b) => (
                    <tr key={b.id} className="batch-row">

                      {/* Batch No */}
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: 13 }}>
                        {b.batchNo}
                      </td>

                      {/* Drug Name */}
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 14 }}>
                        {b.drug}
                      </td>

                      {/* Quantity */}
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
                        {b.qty}
                      </td>

                      {/* Expiry Date */}
                      <td style={{
                        color: b.status === 'expired' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                        fontWeight: b.status === 'expired' ? 600 : 400,
                        fontSize: 13,
                      }}>
                        {b.expiry ? new Date(b.expiry).toLocaleDateString() : '—'}
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          className="pso-badge"
                          style={{
                            background: b.status === 'expired' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                            color: b.status === 'expired' ? 'var(--color-danger)' : 'var(--color-success)',
                          }}
                        >
                          {b.status === 'expired' ? <XCircle size={11} /> : <CheckCircle size={11} />}
                          {b.status === 'expired' ? 'Expired' : 'Active'}
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
    </div>
  );
};

export default PharmacyBatches;
