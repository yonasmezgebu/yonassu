import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ShoppingCart, Loader2, RefreshCw, CheckCircle, XCircle, Search, Package, User, FileText, Pill, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import apiClient from '../../services/apiClient';
import infoSound from '../../assets/notification/info.mp3';

const PharmacyIssueMedicines = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [successModal, setSuccessModal] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [search, setSearch] = useState('');
  const audioRef = useRef(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const playSound = () => {
    try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } } catch {}
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await pharmacyService.getProducts();
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      setProducts(list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentIssues = useCallback(async () => {
    try {
      const res = await apiClient.get('/pharmacy/dispenses?limit=10');
      setRecentIssues(Array.isArray(res) ? res : res?.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
    loadRecentIssues();
  }, [loadProducts, loadRecentIssues]);

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category_name?.toLowerCase().includes(search.toLowerCase()));

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  const addToCart = () => {
    if (!selectedProduct || quantity < 1) return;
    const img = selectedProduct.drug_image || selectedProduct.cover_image || null;
    setCart(prev => {
      const existing = prev.find(i => i.id === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.id === selectedProduct.id ? { ...i, qty: i.qty + quantity } : i);
      }
      return [...prev, { id: selectedProduct.id, name: selectedProduct.name, image: img, price: selectedProduct.price || selectedProduct.unit_price || 0, stock: selectedProduct.stock_quantity || 0, qty: quantity }];
    });
    setSelectedProductId('');
    setQuantity(1);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const canSubmit = cart.length > 0 && customerName.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        notes: notes,
        items: cart.map(i => ({ medication_id: i.id, quantity: i.qty }))
      };
      await apiClient.post('/pharmacy/dispense', payload);
      setSuccessModal({
        customer: customerName,
        items: [...cart],
        total
      });
      playSound();
      setCart([]);
      setCustomerName('');
      setNotes('');
      loadRecentIssues();
    } catch (e) {
      showMsg('error', e?.response?.data?.message || e.message || 'Failed to issue medicines');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#ecfeff 100%)' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>

      <audio ref={audioRef} src={infoSound} preload="auto" />

      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', borderRadius: 12, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'fadeSlide 0.3s ease-out' }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeSlide 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'scaleIn 0.3s ease-out' }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={40} color="#059669" />
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#059669' }}>Medicines Issued!</h2>
            <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 14 }}>Successfully issued to <strong>{successModal.customer}</strong></p>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#065f46', marginBottom: 10 }}>Issued Items ({successModal.items.length})</div>
              {successModal.items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #d1fae5' }}>
                  {item.image ? (
                    <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pill size={14} color="#059669" />
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>x{item.qty}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#065f46' }}>ETB {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 800, fontSize: 15, color: '#065f46' }}>
                <span>Total</span>
                <span>ETB {successModal.total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => setSuccessModal(null)}
              style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
            <ArrowRight size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Issue Medicines</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Issue medicines to customers — recent issues: {recentIssues.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeSlide 0.3s ease-out' }}>
          <XCircle size={20} color="#dc2626" />
          <span style={{ color: '#991b1b', fontWeight: 600, fontSize: 14, flex: 1 }}>{error}</span>
          <button onClick={loadProducts} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Details */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.4s ease-out' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#059669" /> Customer Details
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Customer Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#059669'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          {/* Add Drugs */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.45s ease-out' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={18} color="#059669" /> Add Medicines
            </h3>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..."
                style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            </div>

            {/* Selected Drug Preview */}
            {selectedProduct && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, marginBottom: 12, border: '1px solid #bbf7d0' }}>
                {selectedProduct.drug_image || selectedProduct.cover_image ? (
                  <img src={`http://localhost:5000${selectedProduct.drug_image || selectedProduct.cover_image}`} alt={selectedProduct.name}
                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{ display: selectedProduct.drug_image || selectedProduct.cover_image ? 'none' : 'flex', width: 48, height: 48, borderRadius: 10, background: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} color="#059669" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>Stock: {selectedProduct.stock_quantity || 0} | Price: ETB {Number(selectedProduct.price || selectedProduct.unit_price || 0).toFixed(2)}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Select Medicine</label>
                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                  <option value="">Choose a medicine...</option>
                  {filtered.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.stock_quantity !== undefined ? `(Stock: ${p.stock_quantity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 100 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Qty</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
              <button onClick={addToCart} disabled={!selectedProductId}
                style={{ padding: '10px 20px', background: selectedProductId ? 'linear-gradient(135deg,#059669,#10b981)' : '#e2e8f0', color: selectedProductId ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: selectedProductId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.5s ease-out' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="#059669" /> Notes
            </h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes, instructions, or reference..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'vertical', minHeight: 70, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#059669'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        </div>

        {/* Cart / Submit */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.45s ease-out', position: 'sticky', top: 28 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={17} color="#059669" /> Cart ({cart.length})
            </span>
          </div>
          {cart.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <Package size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#64748b' }}>Cart is empty</p>
              <p style={{ fontSize: 13, margin: 0 }}>Add medicines from the form to start.</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {cart.map((item, idx) => (
                  <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', animation: `fadeSlide 0.2s ease-out ${idx * 0.03}s both` }}>
                    {item.image ? (
                      <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pill size={16} color="#94a3b8" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Qty: {item.qty} &times; ETB {Number(item.price).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>ETB {(item.price * item.qty).toFixed(2)}</div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 20px', borderTop: '2px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: '#059669' }}>ETB {total.toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  style={{ width: '100%', padding: '13px', background: canSubmit && !submitting ? 'linear-gradient(135deg,#059669,#10b981)' : '#e2e8f0', color: canSubmit && !submitting ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: canSubmit && !submitting ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
                  {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {submitting ? 'Processing...' : 'Issue Medicines'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Issues */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.6s ease-out', marginTop: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRight size={17} color="#059669" /> Recent Issues
          </span>
          <button onClick={() => { loadProducts(); loadRecentIssues(); }} disabled={loading}
            style={{ padding: '6px 12px', background: 'transparent', color: '#059669', border: '1px solid #059669', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Customer</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Items</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#059669' }} />
                </td></tr>
              ) : recentIssues.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <Package size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>No recent issues</p>
                </td></tr>
              ) : recentIssues.map((issue, idx) => {
                const issItems = Array.isArray(issue.items) ? issue.items : (typeof issue.items === 'string' ? JSON.parse(issue.items) : []);
                return (
                <tr key={issue.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', animation: `fadeSlide 0.3s ease-out ${idx * 0.03}s both` }}>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {issue.created_at ? new Date(issue.created_at).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{issue.customer_name || 'Unknown'}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{issItems.map(it => it.medication_name).join(', ') || '-'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#d1fae5', color: '#065f46', textTransform: 'capitalize' }}>
                      Issued
                    </span>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacyIssueMedicines;