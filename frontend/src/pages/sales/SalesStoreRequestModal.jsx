/**
 * SalesStoreRequestModal.jsx
 * Sales Manager fills a product request form, draws an e-signature,
 * and submits a signed request to the Store Keeper.
 * Used inside RetailPOS cart panel.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, RotateCcw, Package, User, Hash, Pen, CheckCircle } from 'lucide-react';
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
export default function SalesStoreRequestModal({ onClose, onSuccess, showToast }) {
  const [storeMaterials, setStoreMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1=select product, 2=sign & submit

  useEffect(() => {
    setLoadingMaterials(true);
    apiClient.get('/store-inventory/inventory')
      .then(r => setStoreMaterials(r.data?.data || []))
      .catch(() => {
        // Fallback to general_store_materials endpoint
        apiClient.get('/store-inventory/inventory').then(r => setStoreMaterials(r.data?.data || [])).catch(() => {});
      })
      .finally(() => setLoadingMaterials(false));
  }, []);

  const filtered = storeMaterials.filter(m =>
    (m.material_name || m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.material_id || m.id || '').toString().toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) { showToast('Please select a product', 'warning'); return; }
    if (!signature) { showToast('Digital signature is required before submitting', 'warning'); return; }
    if (qty < 1) { showToast('Quantity must be at least 1', 'warning'); return; }

    const stockAvail = parseFloat(selectedProduct.quantity_in_store || selectedProduct.quantity || 0);
    if (qty > stockAvail) { showToast(`Only ${stockAvail} units available in store`, 'warning'); return; }

    setSubmitting(true);
    try {
      await apiClient.post('/store-sales-requests', {
        store_module: 'general_store',
        product_id: selectedProduct.material_id || String(selectedProduct.id),
        product_name: selectedProduct.material_name || selectedProduct.name,
        unit: selectedProduct.unit || '',
        quantity_requested: qty,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        digital_signature: signature,
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
              <Package size={20} color="#fff" /> Sales Request from Store
            </div>
            <div style={{ fontSize: 12, color: G.sage, marginTop: 3 }}>
              Step {step} of 2 — {step === 1 ? 'Select Product & Details' : 'Sign & Submit'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', height: 4 }}>
          <div style={{ flex: 1, background: G.forest }} />
          <div style={{ flex: 1, background: step >= 2 ? G.forest : '#E0E0E0', transition: 'background 0.3s' }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <form onSubmit={handleSubmit}>

            {step === 1 && (
              <>
                {/* Product Search */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                    Search Store Product
                  </label>
                  <input
                    type="text"
                    placeholder="Type product name or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                    onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
                  />
                </div>

                {/* Product List */}
                <div style={{ border: `1px solid ${G.earth}`, maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
                  {loadingMaterials ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Loading store stock...</div>
                  ) : filtered.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No products found</div>
                  ) : filtered.slice(0, 50).map(m => {
                    const qty_in = parseFloat(m.quantity_in_store || m.quantity || 0);
                    const isSelected = selectedProduct?.material_id === m.material_id || selectedProduct?.id === m.id;
                    return (
                      <div
                        key={m.id || m.material_id}
                        onClick={() => { setSelectedProduct(m); setQty(1); }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: isSelected ? '#E8F5E9' : 'white',
                          borderBottom: `1px solid #EEE`,
                          borderLeft: isSelected ? `4px solid ${G.forest}` : '4px solid transparent',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: G.text }}>{m.material_name || m.name}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>ID: {m.material_id || m.id} · {m.unit || '—'} · {m.category || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: qty_in > 0 ? G.forest : '#e53e3e' }}>{qty_in}</div>
                          <div style={{ fontSize: 10, color: '#999' }}>in stock</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected product summary */}
                {selectedProduct && (
                  <div style={{ background: '#E8F5E9', border: `1px solid ${G.leaf}`, padding: 12, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CheckCircle size={20} color={G.forest} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.dark }}>{selectedProduct.material_name || selectedProduct.name}</div>
                      <div style={{ fontSize: 12, color: G.olive }}>Available: {parseFloat(selectedProduct.quantity_in_store || selectedProduct.quantity || 0)} {selectedProduct.unit || 'units'}</div>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                    Quantity Requested *
                  </label>
                  <input
                    type="number" min={1}
                    max={parseFloat(selectedProduct?.quantity_in_store || selectedProduct?.quantity || 9999)}
                    value={qty}
                    onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                    onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
                  />
                </div>

                {/* Customer info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                      onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                      Customer Phone (Optional)
                    </label>
                    <input
                      type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                      onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    rows={2} placeholder="Any special instructions..."
                    style={{ width: '100%', padding: '12px', border: `1px solid ${G.earth}`, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.border = `2px solid ${G.forest}`}
                    onBlur={e => e.target.style.border = `1px solid ${G.earth}`}
                  />
                </div>

                {/* Next Step */}
                <button
                  type="button"
                  disabled={!selectedProduct}
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%', padding: '14px', background: selectedProduct ? G.forest : '#ccc',
                    color: '#fff', border: 'none', fontWeight: 900, fontSize: 15,
                    textTransform: 'uppercase', cursor: selectedProduct ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <Pen size={18} /> Next: Sign the Request
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Request Summary */}
                <div style={{ background: '#F1F8E9', border: `1px solid ${G.leaf}`, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 8 }}>Request Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: '#999' }}>Product: </span><strong>{selectedProduct?.material_name || selectedProduct?.name}</strong></div>
                    <div><span style={{ color: '#999' }}>Quantity: </span><strong>{qty} {selectedProduct?.unit || 'units'}</strong></div>
                    {customerName && <div><span style={{ color: '#999' }}>Customer: </span><strong>{customerName}</strong></div>}
                    <div><span style={{ color: '#999' }}>Available: </span><strong>{parseFloat(selectedProduct?.quantity_in_store || selectedProduct?.quantity || 0)}</strong></div>
                  </div>
                </div>

                {/* Signature Pad */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.text, marginBottom: 6, textTransform: 'uppercase' }}>
                    ✍️ Sales Manager Digital Signature *
                  </label>
                  <div style={{ fontSize: 11, color: G.earth, marginBottom: 8 }}>
                    By signing below, you confirm this request is authorized by you. The Store Keeper cannot release without this signature.
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
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: '13px', border: `2px solid ${G.earth}`,
                      background: '#fff', color: G.text, fontWeight: 800,
                      fontSize: 14, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    ← Back
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
              </>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
