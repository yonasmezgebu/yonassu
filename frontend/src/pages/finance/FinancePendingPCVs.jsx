import React, { useState, useEffect } from 'react';
import {
  Banknote, CheckCircle, Clock, XCircle, ArrowRight,
  RefreshCw, Printer, Building, Smartphone, PenTool
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Signature Block for Print ─── */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{
      height: 80, border: '1px solid #999', borderRadius: 4,
      marginBottom: 6, overflow: 'hidden', background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {sigImage
        ? <img src={sigImage} alt={`${label} signature`} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
        : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
      }
    </div>
    <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

/* ─── Finalize + Print Modal ─── */
const FinalizeModal = ({ pcv, onClose, onFinalized }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/finalize`);
      setDone(true);
      onFinalized();
    } catch (e) {
      alert('Failed to finalize PCV: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const pm = pcv.payment_method;

  if (done) {
    return (
      <>
        {/* Screen */}
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background: '#f0fdf4', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={48} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Recorded in Cashbook!</h2>
            <p style={{ color: '#64748b', marginBottom: 6 }}><b>{pcv.pcv_number}</b> has been finalized.</p>
            <p style={{ color: '#64748b', marginBottom: 28, fontSize: 13 }}>The amount has been deducted from the cashbook balance.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => window.print()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <Printer size={16} /> Print PCV
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: 12, background: '#422006', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Print View */}
        <div className="print-only" style={{ display: 'none', padding: '36px 48px', background: 'white', fontFamily: "'Times New Roman', serif" }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 3 }}>Sutana Enterprise</h1>
            <h2 style={{ fontSize: 16, margin: 0, fontWeight: 'normal', color: '#333' }}>PETTY CASH (PCV)</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
            <div>
              <b>Voucher No:</b> <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{pcv.pcv_number}</span><br />
              <b>Reference:</b> {pcv.reference_no || 'N/A'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <b>Date:</b> {new Date(pcv.date).toLocaleDateString('en-GB')}<br />
              <b>Payment Method:</b> {pm}
            </div>
          </div>
          <div style={{ lineHeight: 2.4, fontSize: 15, marginBottom: 24 }}>
            <div><b>PAID TO:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 320 }}>{pcv.paid_to}</span></div>
            <div><b>THE SUM OF:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 340, fontStyle: 'italic' }}>{parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB Only</span></div>
            <div><b>BEING PAYMENT FOR:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 280 }}>{pcv.description}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div style={{ padding: '12px 24px', border: '2px solid #000', fontSize: 26, fontWeight: 'bold' }}>
              ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {pm === 'Bank' && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
                <b>Bank Details:</b><br />
                Bank: {pcv.bank_name}<br />
                A/C Name: {pcv.account_holder}<br />
                A/C No: {pcv.account_number}
                {pcv.cheque_no && <><br />Cheque No: {pcv.cheque_no}</>}
              </div>
            )}
            {pm === 'Telebirr' && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 200 }}>
                <b>Telebirr:</b><br />
                Mobile: {pcv.telebirr_number}<br />
                Name: {pcv.telebirr_name}
              </div>
            )}
            {pm === 'Cash' && (
              <div style={{ padding: '12px 24px', border: '1px solid #555', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>By Cash</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48 }}>
            <PrintSigBlock label="Prepared By" name={pcv.prepared_by} sigImage={pcv.prepared_signature} />
            <PrintSigBlock label="Checked By" name={pcv.checked_by} sigImage={pcv.checked_signature} />
            <PrintSigBlock label="Payee's Signature" name={pcv.receiver_name} sigImage={pcv.receiver_signature} />
          </div>
        </div>
        <style>{`@media print { body * { visibility: hidden; } .print-only, .print-only * { visibility: visible; } .print-only { display: block !important; position: fixed; inset: 0; } .no-print { display: none !important; } @page { margin: 12mm; size: A4; } }`}</style>
      </>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 36, maxWidth: 480, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ background: '#fefce8', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fde047' }}>
            <CheckCircle size={40} color="#eab308" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>CEO Approved!</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
            <b>{pcv.pcv_number}</b> has been approved by the CEO.<br />
            Click below to record it in the cashbook and generate the PCV.
          </p>
        </div>

        <div style={{ background: '#fefce8', border: '1px dashed #fde047', borderRadius: 10, padding: 16, marginBottom: 24, fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><span style={{ color: '#a16207' }}>Paid To:</span> <b>{pcv.paid_to}</b></div>
            <div><span style={{ color: '#a16207' }}>Method:</span> <b>{pm}</b></div>
            <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#a16207' }}>Amount:</span> <b style={{ fontSize: 18, color: '#713f12' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={handleFinalize} disabled={loading}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', background: 'linear-gradient(135deg,#eab308,#a16207)', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? <SegmentedSpinner size={18} /> : <ArrowRight size={18} />}
            {loading ? 'Recording...' : 'Continue PCV →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─── Finance Pending PCVs Main Page ─── */
const FinancePendingPCVs = () => {
  const [pcvs, setPcvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalizeTarget, setFinalizeTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || res || [];
      setPcvs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (status) => {
    const map = {
      pending_ceo:      { label: '⏳ Awaiting CEO',   bg: '#fef9c3', color: '#a16207' },
      approved_finance: { label: '✅ CEO Approved',    bg: '#dcfce7', color: '#15803d' },
      rejected:         { label: '❌ Rejected by CEO', bg: '#fee2e2', color: '#dc2626' },
      completed:        { label: '✔ Completed',        bg: '#e0f2fe', color: '#0369a1' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
    return <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
  };

  const approved = pcvs.filter(p => p.status === 'approved_finance');
  const pending = pcvs.filter(p => p.status === 'pending_ceo');
  const rejected = pcvs.filter(p => p.status === 'rejected');
  const completed = pcvs.filter(p => p.status === 'completed');

  const renderGroup = (title, list, accent, showContinue = false) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: accent, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {title} <span style={{ background: accent + '22', color: accent, borderRadius: 99, padding: '2px 8px', fontSize: 12 }}>{list.length}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(pcv => (
            <div key={pcv.id} style={{
              background: 'white', borderRadius: 12, border: `2px solid ${showContinue ? '#22c55e' : '#e2e8f0'}`,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: showContinue ? '0 4px 14px rgba(34,197,94,.12)' : '0 2px 4px rgba(0,0,0,.04)'
            }}>
              <div style={{ flexShrink: 0, background: '#fefce8', padding: 10, borderRadius: 10 }}>
                <Banknote size={20} color="#eab308" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15 }}>{pcv.pcv_number}</span>
                  {statusBadge(pcv.status)}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 12 }}>
                  <span>To: <b style={{ color: '#0f172a' }}>{pcv.paid_to}</b></span>
                  <span>·</span>
                  <span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
                  <span>·</span>
                  <span style={{ fontWeight: 700, color: '#a16207' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {pcv.status === 'rejected' && pcv.reject_reason && (
                  <div style={{ marginTop: 6, fontSize: 12, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                    Reason: {pcv.reject_reason}
                  </div>
                )}
              </div>
              {showContinue && (
                <button onClick={() => setFinalizeTarget(pcv)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 10px rgba(34,197,94,.3)' }}>
                  <ArrowRight size={16} /> Click to Continue PCV
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#eab308,#a16207)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(234,179,8,.3)' }}>
              <Banknote color="white" size={22} />
            </span>
            PCV Status Tracker
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Track approval status of petty cash requests and continue approved ones.</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <SegmentedSpinner size={32} />
          <div>Loading...</div>
        </div>
      ) : pcvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>No pending PCVs</h3>
          <p style={{ color: '#64748b', margin: 0 }}>All petty cash requests are up to date.</p>
        </div>
      ) : (
        <>
          {renderGroup('✅ CEO Approved — Ready to Continue', approved, '#15803d', true)}
          {renderGroup('⏳ Awaiting CEO Approval', pending, '#a16207')}
          {renderGroup('❌ Rejected by CEO', rejected, '#dc2626')}
          {renderGroup('✔ Completed', completed, '#0369a1')}
        </>
      )}

      {finalizeTarget && (
        <FinalizeModal
          pcv={finalizeTarget}
          onClose={() => { setFinalizeTarget(null); load(); }}
          onFinalized={load}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FinancePendingPCVs;
