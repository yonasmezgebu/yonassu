import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const STATUS_STYLES = {
  APPROVED: { bg: '#D1FAE5', border: '#059669', icon: CheckCircle, color: '#059669', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', border: '#EF4444', icon: XCircle, color: '#EF4444', label: 'Rejected' },
  WAIT: { bg: '#FEF3C7', border: '#D97706', icon: Clock, color: '#D97706', label: '⏳ WAIT — Market Research' },
  PENDING: { bg: '#FEF3C7', border: '#D97706', icon: Clock, color: '#D97706', label: 'Pending CEO Review' },
};

export default function DecisionCard({ decision, ceoNotes, ceoDecidedBy, ceoDecidedAt, onApprove, onReject, onWait, waitDocument, waitInstructions, loading }) {
  const style = STATUS_STYLES[decision] || STATUS_STYLES.PENDING;
  const Icon = style.icon;
  const isDecided = decision !== 'PENDING';
  const [showWaitForm, setShowWaitForm] = useState(false);
  const [waitDoc, setWaitDoc] = useState('');
  const [waitInstr, setWaitInstr] = useState('');

  const handleWait = () => {
    if (!waitDoc.trim() || !waitInstr.trim()) return;
    onWait && onWait(waitDoc, waitInstr);
    setShowWaitForm(false);
  };

  return (
    <div style={{
      border: `2px solid ${style.border}`,
      borderRadius: 12,
      background: style.bg,
      padding: '1.25rem',
      maxWidth: 420,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ background: style.color, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: style.color }}>{style.label}</div>
          {isDecided && ceoDecidedAt && (
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {new Date(ceoDecidedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {ceoNotes && (
        <div style={{ background: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#475569', marginBottom: 12, borderLeft: `3px solid ${style.color}` }}>
          {ceoNotes}
        </div>
      )}

      {ceoDecidedBy && (
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
          Decided by: <strong style={{ color: '#1E293B' }}>{ceoDecidedBy}</strong>
        </div>
      )}

      {decision === 'WAIT' && waitDocument && (
        <div style={{ background: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 12, borderLeft: '3px solid #D97706' }}>
          <strong>Document:</strong> {waitDocument}<br />
          {waitInstructions && <><strong>Instructions:</strong> {waitInstructions}</>}
        </div>
      )}

      {!isDecided && onApprove && onReject && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, marginBottom: showWaitForm ? 12 : 0 }}>
            <button onClick={onApprove} disabled={loading}
              style={{
                flex: 1, padding: '10px 16px', background: '#059669', color: 'white', border: 'none',
                borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.6 : 1
              }}>
              <CheckCircle size={16} /> Approve
            </button>
            <button onClick={onReject} disabled={loading}
              style={{
                flex: 1, padding: '10px 16px', background: '#EF4444', color: 'white', border: 'none',
                borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.6 : 1
              }}>
              <XCircle size={16} /> Reject
            </button>
          </div>
          {onWait && (
            <div style={{ marginTop: 8 }}>
              {!showWaitForm ? (
                <button onClick={() => setShowWaitForm(true)}
                  style={{
                    width: '100%', padding: '10px 16px', background: '#D97706', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                  <Clock size={16} /> ⏳ Wait — Assign Market Research
                </button>
              ) : (
                <div style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #FDE68A' }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 4 }}>
                      <FileText size={12} style={{ marginRight: 4 }} /> Document URL / Reference *
                    </label>
                    <input type="text" value={waitDoc} onChange={e => setWaitDoc(e.target.value)}
                      placeholder="Link to document or file name"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 4 }}>Instructions *</label>
                    <textarea value={waitInstr} onChange={e => setWaitInstr(e.target.value)}
                      placeholder="What should the market team research?"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, minHeight: 50, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleWait} disabled={loading || !waitDoc.trim() || !waitInstr.trim()}
                      style={{ flex: 1, padding: '8px 12px', background: '#D97706', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: (loading || !waitDoc.trim() || !waitInstr.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !waitDoc.trim() || !waitInstr.trim()) ? 0.6 : 1 }}>
                      {loading ? 'Processing...' : 'Confirm WAIT'}
                    </button>
                    <button onClick={() => { setShowWaitForm(false); setWaitDoc(''); setWaitInstr(''); }}
                      style={{ padding: '8px 12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
