/**
 * SalesStoreRequestModal.jsx
 * Sales Manager fills a product request form, draws an e-signature,
 * and submits a signed request to the Store Keeper.
 * Used inside RetailPOS cart panel to submit entire carts.
 */
import React, { useState, useRef } from 'react';
import { X, Send, RotateCcw, Package, CheckCircle } from 'lucide-react';
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

// ─── Signature Canvas ────────────────────────────────────────────────────────
function SignatureCanvas({ onSignatureChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const [signed, setSigned] = useState(false);

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
    ctx.strokeStyle = G.dark;
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
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={460}
        height={140}
        style={{
          border: `2px solid ${signed ? G.forest : G.earth}`,
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
            background: '#fff', border: `1px solid ${G.earth}`,
            padding: '3px 8px', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, color: G.earth,
          }}
        >
          <RotateCcw size={11} /> Clear
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function SalesStoreRequestModal({ onClose, onSuccess, showToast, cartData }) {
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signature) { showToast('Digital signature is required before submitting', 'warning'); return; }

    setSubmitting(true);
    try {
      await apiClient.post('/pos/cart/sign-store', {
        cart_code: cartData.cart_code,
        customer_name: cartData.customer_name,
        customer_phone: cartData.customer_phone,
        items: cartData.items,
        total_amount: cartData.total_amount,
        payment_method: cartData.payment_method,
        payment_amount: cartData.payment_amount,
        txn_id: cartData.txn_id,
        signature: signature,
        notes: notes || null,
      });
      showToast('✅ Signed request sent to Store Keeper!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe check if no cart
  if (!cartData) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: G.white, width: '100%', maxWidth: 560,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        borderTop: `6px solid ${G.forest}`,
        boxShadow: '6px 6px 0 rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{ background: G.dark, color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Package size={20} color="#fff" /> Send Cart to Store
            </div>
            <div style={{ fontSize: 12, color: G.sage, marginTop: 3 }}>
              Manager Signature Required
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <form onSubmit={handleSubmit}>

            {/* Request Summary */}
            <div style={{ background: '#F1F8E9', border: `1px solid ${G.leaf}`, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 8 }}>Cart Details</div>
              
              <div style={{ marginBottom: 12 }}>
                {cartData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #ddd', paddingBottom: 4, marginBottom: 4 }}>
                    <span>{item.qty}x {item.name}</span>
                    <strong>{(item.price * item.qty).toFixed(2)} ETB</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, marginTop: 8, color: G.forest }}>
                  <span>TOTAL:</span>
                  <span>{cartData.total_amount.toFixed(2)} ETB</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: G.text }}>
                {cartData.customer_name && <div><span style={{ color: '#999' }}>Customer: </span><strong>{cartData.customer_name}</strong></div>}
                <div><span style={{ color: '#999' }}>Payment: </span><strong>{cartData.payment_method}</strong></div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                Notes for Store (Optional)
              </label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="Any special instructions..."
                style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
              />
            </div>

            {/* Signature Pad */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                ✍️ Sales Manager Digital Signature *
              </label>
              <div style={{ fontSize: 11, color: G.earth, marginBottom: 8 }}>
                By signing below, you authorize the store to release these items.
              </div>
              <SignatureCanvas onSignatureChange={setSignature} />
              {signature && (
                <div style={{ marginTop: 6, fontSize: 11, color: G.forest, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} /> Signature captured — {new Date().toLocaleString()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '13px', border: `2px solid ${G.earth}`,
                  background: '#fff', color: G.text, fontWeight: 800,
                  fontSize: 14, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!signature || submitting}
                style={{
                  flex: 2, padding: '13px', border: 'none',
                  background: signature && !submitting ? G.forest : '#ccc',
                  color: '#fff', fontWeight: 900, fontSize: 14,
                  textTransform: 'uppercase',
                  cursor: signature && !submitting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: signature ? `4px 4px 0 ${G.dark}` : 'none',
                }}
              >
                <Send size={17} /> {submitting ? 'Submitting...' : 'Submit Signed Request'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
