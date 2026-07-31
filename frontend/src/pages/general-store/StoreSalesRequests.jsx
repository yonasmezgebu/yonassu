/**
 * StoreSalesRequests.jsx
 * Store Keeper view: see incoming signed requests from Sales Manager, review signature, release stock.
 * This page is added to the General Store sidebar under Stock Operations → Issue to Departments.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Package, CheckCircle, XCircle, Eye, RefreshCw, Clock, Pen, User, Calendar, Hash } from 'lucide-react';
import apiClient from '../../services/apiClient';

const G = {
  forest:  '#228B22',
  dark:    '#1B5E20',
  emerald: '#2E8B57',
  leaf:    '#4CAF50',
  sage:    '#A5D6A7',
  olive:   '#6B8E23',
  earth:   '#8D6E63',
  text:    '#424242',
  bg:      '#F5F5F5',
  white:   '#FFFFFF',
};

const STATUS_COLOR = {
  Pending:  { bg: '#FFF8E1', color: '#F57F17', border: '#FFD54F' },
  Sold:     { bg: '#E8F5E9', color: '#2E7D32', border: '#81C784' },
  Rejected: { bg: '#FFEBEE', color: '#C62828', border: '#EF9A9A' },
  Released: { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  Approved: { bg: '#E8EAF6', color: '#283593', border: '#9FA8DA' },
};

// ─── Signature Canvas ────────────────────────────────────────────────────────
function SignatureCanvas({ onSignatureChange }) {
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const lastPos = React.useRef(null);
  const [signed, setSigned] = React.useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setSigned(true);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const endDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSignatureChange(null);
  };

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <canvas
        ref={canvasRef}
        width={460}
        height={140}
        style={{
          border: `2px solid ${signed ? '#228B22' : '#8D6E63'}`,
          background: signed ? '#F0FFF0' : '#FAFFF8',
          cursor: 'crosshair',
          display: 'block',
          width: '100%',
          touchAction: 'none',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div style={{
        position: 'absolute', bottom: 6, left: 10,
        fontSize: 11, color: '#aaa', pointerEvents: 'none',
        display: signed ? 'none' : 'block',
      }}>
        ✍️ Draw your signature here...
      </div>
      {signed && (
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: '#fff', border: `1px solid #8D6E63`,
            padding: '3px 8px', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, color: '#8D6E63',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function SignaturePreviewModal({ request, onClose, onRelease, onReject, releasing, rejecting }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [storeSignature, setStoreSignature] = useState(null);
  const [storeNotes, setStoreNotes] = useState('');

  // Handle cart items array if it exists
  const itemsList = request.cart_items ? JSON.parse(request.cart_items) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: G.white, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderTop: `6px solid ${G.forest}`, boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ background: G.dark, color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={18} color="#fff" /> Review Signed Request
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Request Details */}
          <div style={{ background: G.bg, padding: 16, marginBottom: 20, borderLeft: `4px solid ${G.forest}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 10 }}>Request Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div><span style={{ color: '#888' }}>Request Code: </span><strong style={{ color: G.dark }}>{request.request_code}</strong></div>
              <div><span style={{ color: '#888' }}>Date: </span><strong>{new Date(request.created_at).toLocaleString()}</strong></div>
              
              {itemsList ? (
                <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
                  <span style={{ color: '#888', display: 'block', marginBottom: 4 }}>Cart Items: </span>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {itemsList.map((it, idx) => (
                      <li key={idx}><strong style={{ color: G.forest }}>{it.qty}x</strong> {it.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div><span style={{ color: '#888' }}>Product: </span><strong style={{ color: G.forest }}>{request.product_name}</strong></div>
                  <div><span style={{ color: '#888' }}>Quantity: </span><strong style={{ color: G.dark, fontSize: 15 }}>{request.quantity_requested} {request.unit || 'units'}</strong></div>
                </>
              )}
              
              <div style={{ marginTop: 8 }}><span style={{ color: '#888' }}>Requested By: </span><strong>{request.requested_by_name || '—'}</strong></div>
              {request.customer_name && <div style={{ marginTop: 8 }}><span style={{ color: '#888' }}>Customer: </span><strong>{request.customer_name}</strong></div>}
              {request.customer_phone && <div><span style={{ color: '#888' }}>Phone: </span><strong>{request.customer_phone}</strong></div>}
              {request.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#888' }}>Sales Mgr Notes: </span><span>{request.notes}</span></div>}
            </div>
          </div>

          {/* Manager Signature */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: G.text, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pen size={14} /> Sales Manager Signature
              {request.digital_signature ? (
                <span style={{ background: '#E8F5E9', color: G.forest, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>✅ SIGNED</span>
              ) : (
                <span style={{ background: '#FFEBEE', color: '#C62828', fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>⚠️ NOT SIGNED</span>
              )}
            </div>
            {request.digital_signature ? (
              <div style={{ border: `2px solid ${G.forest}`, background: '#F0FFF0', padding: 8 }}>
                <img src={request.digital_signature} alt="Signature" style={{ maxWidth: '100%', maxHeight: 150, display: 'block' }} />
                <div style={{ fontSize: 11, color: G.earth, marginTop: 6 }}>
                  Signed at: {request.signature_timestamp ? new Date(request.signature_timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFEBEE', border: `1px solid #EF9A9A`, padding: 16, textAlign: 'center', color: '#C62828', fontWeight: 700 }}>
                ⛔ No signature found — Cannot release without Sales Manager signature
              </div>
            )}
          </div>

          {/* Store Keeper Approval block */}
          {request.status === 'Pending' && !showRejectForm && (
            <div style={{ marginBottom: 20, background: '#FAFAFA', border: '1px solid #E0E0E0', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: G.dark, textTransform: 'uppercase', marginBottom: 8 }}>
                ✍️ Store Keeper Approval
              </div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                To approve and release the items, you must provide your signature and any notes.
              </div>
              <SignatureCanvas onSignatureChange={setStoreSignature} />
              
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#444', marginBottom: 4 }}>Additional Data / Reason for Sending</label>
                <textarea
                  rows={2}
                  value={storeNotes}
                  onChange={(e) => setStoreNotes(e.target.value)}
                  placeholder="Notes about this release..."
                  style={{ width: '100%', padding: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div style={{ marginBottom: 16, background: '#FFF8E1', border: `1px solid #FFD54F`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 8, textTransform: 'uppercase' }}>Rejection Reason</div>
              <textarea
                rows={3}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${G.earth}`, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowRejectForm(false)}
                  style={{ flex: 1, padding: '10px', border: `1px solid ${G.earth}`, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  disabled={rejecting || !rejectReason}
                  onClick={() => onReject(rejectReason)}
                  style={{ flex: 1, padding: '10px', border: 'none', background: '#C62828', color: '#fff', cursor: rejecting || !rejectReason ? 'not-allowed' : 'pointer', fontWeight: 800, textTransform: 'uppercase' }}
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {request.status === 'Pending' && (
            <div style={{ display: 'flex', gap: 12 }}>
              {!showRejectForm && (
                <button
                  onClick={() => setShowRejectForm(true)}
                  style={{ flex: 1, padding: '13px', border: `2px solid #C62828`, background: '#fff', color: '#C62828', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  ✕ Reject
                </button>
              )}
              <button
                disabled={!request.digital_signature || releasing || !storeSignature}
                onClick={() => onRelease(storeSignature, storeNotes)}
                style={{
                  flex: 2, padding: '13px', border: 'none',
                  background: (request.digital_signature && storeSignature && !releasing) ? G.forest : '#ccc',
                  color: '#fff', fontWeight: 900, fontSize: 14, textTransform: 'uppercase',
                  cursor: (request.digital_signature && storeSignature && !releasing) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: (request.digital_signature && storeSignature) ? `4px 4px 0 ${G.dark}` : 'none',
                }}
              >
                <CheckCircle size={18} /> {releasing ? 'Releasing...' : 'Release & Mark Sold'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoreSalesRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = filter === 'All' ? {} : { status: filter };
      const res = await apiClient.get('/store-sales-requests', { params });
      setRequests(res.data?.data || []);
    } catch (e) {
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleRelease = async (storeSignature, storeNotes) => {
    if (!selectedRequest) return;
    setReleasing(true);
    try {
      await apiClient.patch(`/store-sales-requests/${selectedRequest.id}/release`, {
        store_keeper_signature: storeSignature,
        notes: storeNotes
      });
      showToast('✅ Product released and sale recorded successfully!', 'success');
      setSelectedRequest(null);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || 'Failed to release', 'error');
    } finally {
      setReleasing(false);
    }
  };

  const handleReject = async (reason) => {
    if (!selectedRequest) return;
    setRejecting(true);
    try {
      await apiClient.patch(`/store-sales-requests/${selectedRequest.id}/reject`, { rejection_reason: reason });
      showToast('Request rejected.', 'info');
      setSelectedRequest(null);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || 'Failed to reject', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const statusCounts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const filterOptions = ['Pending', 'Sold', 'Rejected', 'All'];

  return (
    <div style={{ padding: 32, minHeight: '100%', background: G.bg }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 99999,
          background: toastMsg.type === 'success' ? G.forest : toastMsg.type === 'error' ? '#C62828' : '#1565C0',
          color: '#fff', padding: '12px 24px', fontWeight: 700, fontSize: 14,
          boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
        }}>
          {toastMsg.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Package size={26} color={G.forest} /> Sales Requests from Store
          </h1>
          <p style={{ margin: '4px 0 0 0', color: G.earth, fontSize: 14 }}>
            Review signed requests from Sales Manager → Release product → Auto-record sale
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          style={{ background: G.forest, border: 'none', color: '#fff', padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}
        >
          <RefreshCw size={15} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Pending', count: statusCounts.Pending || 0, bg: '#FFF8E1', color: '#F57F17' },
          { label: 'Released/Sold', count: (statusCounts.Sold || 0) + (statusCounts.Released || 0), bg: '#E8F5E9', color: G.forest },
          { label: 'Rejected', count: statusCounts.Rejected || 0, bg: '#FFEBEE', color: '#C62828' },
          { label: 'Total', count: requests.length, bg: '#E3F2FD', color: '#1565C0' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, padding: 16, borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${G.earth}` }}>
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '9px 20px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
              background: filter === f ? G.forest : 'transparent',
              color: filter === f ? '#fff' : G.text,
              textTransform: 'uppercase',
              borderBottom: filter === f ? `2px solid ${G.forest}` : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {f} {f !== 'All' && statusCounts[f] ? `(${statusCounts[f]})` : ''}
          </button>
        ))}
      </div>

      {/* Request Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bbb', fontSize: 16 }}>
          <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>No {filter !== 'All' ? filter.toLowerCase() : ''} requests found.</div>
        </div>
      ) : (
        <div style={{ background: G.white, borderTop: `4px solid ${G.forest}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: G.dark, color: '#fff' }}>
                {['Request Code', 'Product', 'Qty', 'Requested By', 'Customer', 'Signature', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => {
                const sc = STATUS_COLOR[r.status] || STATUS_COLOR.Pending;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: G.dark, fontFamily: 'monospace' }}>{r.request_code}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: G.text }}>{r.product_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 15, fontWeight: 900, color: G.forest, textAlign: 'center' }}>{r.quantity_requested}<div style={{ fontSize: 10, color: '#999' }}>{r.unit || 'units'}</div></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: G.text }}>{r.requested_by_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: G.text }}>{r.customer_name || <span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {r.digital_signature
                        ? <span style={{ background: '#E8F5E9', color: G.forest, fontSize: 11, padding: '3px 8px', fontWeight: 800 }}>✅ SIGNED</span>
                        : <span style={{ background: '#FFEBEE', color: '#C62828', fontSize: 11, padding: '3px 8px', fontWeight: 800 }}>⚠️ UNSIGNED</span>
                      }
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#999' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: 11, padding: '3px 10px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => setSelectedRequest(r)}
                        style={{
                          background: r.status === 'Pending' ? G.emerald : '#EEE',
                          color: r.status === 'Pending' ? '#fff' : '#888',
                          border: 'none', padding: '7px 14px', fontSize: 12, fontWeight: 800,
                          cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Eye size={13} /> {r.status === 'Pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature Review Modal */}
      {selectedRequest && (
        <SignaturePreviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRelease={handleRelease}
          onReject={handleReject}
          releasing={releasing}
          rejecting={rejecting}
        />
      )}
    </div>
  );
}
