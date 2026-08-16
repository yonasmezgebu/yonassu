import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, FileText, CreditCard, Car, Wallet, Upload, CheckCircle2 } from 'lucide-react';
import carService from '../../services/carService';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';

const RentalAgreementModal = ({ car, isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  const [orderForm, setOrderForm] = useState({
    pickupDate: '',
    returnDate: '',
    specialRequests: '',
    paymentMethod: '',
    paymentReference: ''
  });

  const [orderFile, setOrderFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  const fileRef = useRef(null);
  const securityDeposit = 5000;

  useEffect(() => {
    if (authService.isAuthenticated()) setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFinanceAccounts();
      setOrderForm({ pickupDate: '', returnDate: '', specialRequests: '', paymentMethod: '', paymentReference: '' });
      setOrderFile(null);
      setError('');
      setSuccessData(null);
    }
  }, [isOpen]);

  const loadFinanceAccounts = async () => {
    try {
      const result = await axios.get('/finance-bank');
      if (result && result.success && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      } else if (Array.isArray(result)) {
        setFinanceAccounts(result);
      } else if (result && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      }
    } catch (e) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const result2 = await axios.get('/finance-bank', { headers: { Authorization: `Bearer ${token}` } });
          if (result2 && Array.isArray(result2.data)) setFinanceAccounts(result2.data);
          else if (Array.isArray(result2)) setFinanceAccounts(result2);
        } catch (e2) {
          console.error('[CarRentalForm] Failed to load finance accounts:', e2.message);
        }
      }
    }
  };

  const totalDays = (() => {
    if (!orderForm.pickupDate || !orderForm.returnDate) return 0;
    const diff = new Date(orderForm.returnDate) - new Date(orderForm.pickupDate);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const dailyRate = parseFloat(car?.dailyRate || 0);
  const rentalTotal = dailyRate * totalDays;
  const vatCalc = getVatForItem(vatCtx, 'car_rental', car?.id, rentalTotal);
  const grandTotal = rentalTotal + vatCalc.vat + securityDeposit;

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (totalDays <= 0) { setError('Return date must be after pickup date.'); return; }
    if (!orderForm.paymentMethod) { setError('Please select a payment account / method.'); return; }
    if (!orderForm.paymentReference && !orderFile) { setError('Please enter a payment reference or upload a screenshot.'); return; }
    
    setLoading(true);
    setError('');

    try {
      const pickupDateTime = new Date(`${orderForm.pickupDate}T10:00`);
      const returnDateTime = new Date(`${orderForm.returnDate}T10:00`);

      const selectedAcc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
      const paymentMethodName = selectedAcc ? selectedAcc.account_name : orderForm.paymentMethod;

      const payload = {
        carId: car.id,
        pickupDate: pickupDateTime.toISOString(),
        returnDate: returnDateTime.toISOString(),
        driverName: '', // Internal driver
        driverLicense: '', // Internal driver
        specialRequests: orderForm.specialRequests + (orderForm.paymentReference ? ` [Ref: ${orderForm.paymentReference}]` : ''),
        paymentMethod: paymentMethodName
      };

      const res = await carService.createRentalOrder(payload);
      
      if (res.status === 'success') {
        const orderData = res.data;
        
        // Upload proof if exists
        if (orderFile) {
          try {
             const fd = new FormData();
             fd.append('proof', orderFile);
             await carService.uploadPaymentProof(orderData.id, fd);
          } catch(err) {
             console.error("Proof upload failed", err);
             // Order still created successfully
          }
        }

        setSuccessData(orderData);
      } else {
        setError('Failed to create reservation. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while creating the reservation.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !car) return null;

  return (
    <div className="psp-overlay" onClick={onClose}>
      <div className="psp-modal" onClick={e => e.stopPropagation()}>
        <div className="psp-modal-header">
          <div>
            <h3 className="psp-modal-title"><Car size={22} /> Reserve Vehicle</h3>
            <p className="psp-modal-subtitle">{car?.name} — ETB {dailyRate.toLocaleString()}/day — Fill in all details below</p>
          </div>
          <button className="psp-close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {successData ? (
          <div className="psp-success-body">
            <span className="psp-success-emoji">✅</span>
            <h3 className="psp-success-title">Order Placed Successfully!</h3>
            <p className="psp-success-sub">
              Order <strong>{successData.orderNumber}</strong> has been received.<br />
              Our team will contact you shortly to confirm the booking.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              <button className="psp-print-btn" onClick={() => {
                const win = window.open('', '_blank', 'width=760,height=800');
                const u = currentUser || {};
                const userName = u.fullName || u.full_name || u.name || 'Customer';
                const selectedAcc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
                const paymentName = selectedAcc ? selectedAcc.account_name : orderForm.paymentMethod;
                win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Car Rental Receipt – ${successData.orderNumber}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1a1a1a}.wrap{max-width:700px;margin:0 auto;background:white;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12)}.hdr{background:linear-gradient(135deg,#1a2b4b,#0D7C66);padding:30px 36px;display:flex;justify-content:space-between;align-items:center}.hdr-l h1{color:#FFD700;font-size:20px;font-weight:900;margin-bottom:4px}.hdr-l p{color:rgba(255,255,255,0.7);font-size:12px}.ord-no{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);padding:8px 16px;color:white;font-size:13px;font-weight:700;text-align:right}.ord-no span{display:block;font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);margin-bottom:3px}.sbar{background:#0D7C66;padding:8px 36px;font-size:12px;font-weight:700;color:white}.body{padding:28px 36px}.sec-title{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}.cell{background:#f8fafc;border:1px solid #e2e8f0;padding:12px}.cell .lbl{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}.cell .val{font-size:14px;font-weight:700;color:#0f172a}.total{background:#f0fdf4;border:2px solid #86efac;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.total .lbl{font-size:12px;color:#166534;font-weight:700}.total .val{font-size:22px;font-weight:900;color:#059669}.ftr{background:#0f172a;padding:20px 36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}.ftr-l{color:rgba(255,255,255,0.6);font-size:11px;line-height:1.7}.ftr-r{color:rgba(255,255,255,0.4);font-size:11px}@media print{body{background:white;padding:0}.wrap{box-shadow:none}}</style></head><body>
<div class="wrap"><div class="hdr"><div class="hdr-l"><h1>🚗 SUTANA Car Rental</h1><p>Vehicle Rental Service — Addis Ababa, Ethiopia</p></div><div class="ord-no"><span>ORDER NO.</span>${successData.orderNumber}</div></div>
<div class="sbar">✅ ORDER RECEIVED — PENDING CONFIRMATION BY OUR TEAM</div>
<div class="body">
<p class="sec-title">Customer Information</p>
<div class="grid">
<div class="cell"><div class="lbl">Full Name</div><div class="val">${userName}</div></div>
<div class="cell"><div class="lbl">Email</div><div class="val">${u.email || '—'}</div></div>
<div class="cell"><div class="lbl">Phone</div><div class="val">${u.phone || '—'}</div></div>
<div class="cell"><div class="lbl">Order Date</div><div class="val">${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
</div>
<p class="sec-title">Rented Vehicle</p>
<div class="grid">
<div class="cell"><div class="lbl">Vehicle</div><div class="val">${car?.name || '—'}</div></div>
<div class="cell"><div class="lbl">Driver</div><div class="val">Company Driver Included</div></div>
<div class="cell"><div class="lbl">Pickup Date</div><div class="val">${orderForm.pickupDate}</div></div>
<div class="cell"><div class="lbl">Return Date</div><div class="val">${orderForm.returnDate}</div></div>
<div class="cell"><div class="lbl">Duration</div><div class="val">${totalDays} day${totalDays!==1?'s':''}</div></div>
<div class="cell"><div class="lbl">Daily Rate</div><div class="val">ETB ${dailyRate.toLocaleString()}</div></div>
</div>
<div class="total"><div class="lbl">TOTAL ESTIMATED AMOUNT</div><div class="val">ETB ${grandTotal.toLocaleString()}</div></div>
<p class="sec-title">Payment Info</p>
<div class="grid">
<div class="cell"><div class="lbl">Method</div><div class="val">${paymentName}</div></div>
<div class="cell"><div class="lbl">Reference</div><div class="val">${orderForm.paymentReference||'Screenshot Uploaded'}</div></div>
</div>
${successData.orderNumber?`<p style="text-align:center;font-family:monospace;letter-spacing:3px;font-size:22px;color:#1a2b4b;background:#f1f5f9;padding:10px">${successData.orderNumber}</p>`:''}
</div>
<div class="ftr"><div class="ftr-l">SUTANA Car Rental &nbsp;|&nbsp; Addis Ababa, Ethiopia<br/>📞 +251 911 000 000 &nbsp;|&nbsp; ✉️ carrental@sutana.com</div><div class="ftr-r">Printed: ${new Date().toLocaleString()}</div></div>
</div><script>window.onload=function(){window.print()}<\/script></body></html>`);
                win.document.close();
              }}>
                <Car size={18} /> Print Receipt
              </button>
              <button style={{ padding: '12px 24px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}
                onClick={() => { onClose(); navigate('/customer'); }}>
                My Orders
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>Track your order from <strong>Customer Portal → Car Rental Orders</strong></p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit}>
            <div className="psp-modal-body">
              {error && (
                <div className="psp-error-box"><X size={15} /> {error}</div>
              )}

              {/* Customer Info */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px' }}>
                <div className="psp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <Wallet size={14} /> Customer Information
                </div>
                <div className="psp-form-row">
                  <div className="psp-form-group">
                    <label className="psp-form-label">Full Name</label>
                    <input className="psp-form-input" value={currentUser?.fullName || currentUser?.full_name || currentUser?.name || ''} disabled />
                  </div>
                  <div className="psp-form-group">
                    <label className="psp-form-label">Email</label>
                    <input className="psp-form-input" value={currentUser?.email || ''} disabled />
                  </div>
                </div>
                <div className="psp-form-group" style={{ marginTop: 12 }}>
                  <label className="psp-form-label">Phone Number</label>
                  <input className="psp-form-input" value={currentUser?.phone || ''} disabled />
                </div>
              </div>

              {/* Vehicle summary */}
              <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Car size={28} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{car?.name}</div>
                  <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>ETB {dailyRate.toLocaleString()}/day • Includes Company Driver</div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="psp-section-divider"><Calendar size={14} /> Rental Period</div>
              <div className="psp-form-row">
                <div className="psp-form-group">
                  <label className="psp-form-label">Pickup Date *</label>
                  <input type="date" required className="psp-form-input" value={orderForm.pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setOrderForm(p => ({ ...p, pickupDate: e.target.value }))} />
                </div>
                <div className="psp-form-group">
                  <label className="psp-form-label">Return Date *</label>
                  <input type="date" required className="psp-form-input" value={orderForm.returnDate}
                    min={orderForm.pickupDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setOrderForm(p => ({ ...p, returnDate: e.target.value }))} />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="psp-price-summary">
                  <div className="psp-price-row"><span>{totalDays} day{totalDays !== 1 ? 's' : ''} × ETB {dailyRate.toLocaleString()}/day</span><span>ETB {rentalTotal.toLocaleString()}</span></div>
                  <div className="psp-price-row"><span>VAT ({fmtPct(vatCalc.rate)})</span><span>ETB {vatCalc.vat.toLocaleString()}</span></div>
                  <div className="psp-price-row" style={{ color: '#047857' }}><span>Security Deposit (Refundable)</span><span>ETB {securityDeposit.toLocaleString()}</span></div>
                  <div className="psp-price-total" style={{ display: 'flex', justifyContent: 'space-between' }}><span>TOTAL ESTIMATED (incl. VAT)</span><span>ETB {grandTotal.toLocaleString()}</span></div>
                </div>
              )}

              {/* Payment */}
              <div className="psp-section-divider"><CreditCard size={14} /> Payment Proof</div>
              <div className="psp-form-row">
                <div className="psp-form-group">
                  <label className="psp-form-label">Payment Method *</label>
                  {financeAccounts.length === 0 ? (
                    <div style={{ padding: '10px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                      ⏳ Loading payment accounts…
                    </div>
                  ) : (
                    <select required className="psp-form-input"
                      value={orderForm.paymentMethod}
                      onChange={e => setOrderForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    >
                      <option value="">— Select Payment Account —</option>
                      {['Bank', 'Mobile Wallet', 'Cash'].map(type => {
                        const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                        if (group.length === 0) return null;
                        return (
                          <optgroup key={type} label={type}>
                            {group.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.account_name}{acc.account_number ? ` — ${acc.account_number}` : ''}{acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  )}
                </div>
                <div className="psp-form-group">
                  <label className="psp-form-label">Transaction Reference</label>
                  <input type="text" className="psp-form-input" placeholder="e.g. TXN-123456"
                    value={orderForm.paymentReference} onChange={e => setOrderForm(p => ({ ...p, paymentReference: e.target.value }))} />
                </div>
              </div>

              {/* Auto-fill account details panel */}
              {orderForm.paymentMethod && (() => {
                const acc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
                if (!acc) return null;
                return (
                  <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '6px', border: '1.5px solid #4ade80', fontSize: '13px', color: '#166534', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <Wallet size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>📋 Transfer Payment To:</div>
                      <div><strong>Account Name:</strong> {acc.account_name}</div>
                      {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                      {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                      {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#15803d' }}>After payment, enter the transaction reference number above.</div>
                    </div>
                  </div>
                );
              })()}

              {/* Screenshot upload */}
              <div className="psp-form-group">
                <label className="psp-form-label"><Upload size={14} /> Payment Screenshot <span>(optional if reference given)</span></label>
                <div className={`psp-file-upload${orderFile ? ' has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files[0] || null)} />
                  <Upload size={24} color={orderFile ? '#0D7C66' : '#94a3b8'} />
                  <p style={{ margin: '8px 0 4px', fontWeight: 700, color: orderFile ? '#0D7C66' : '#475569', fontSize: 14 }}>
                    {orderFile ? `✅ ${orderFile.name}` : 'Click to upload payment screenshot'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>PNG, JPG, JPEG accepted</p>
                </div>
              </div>

              {/* Special Requests */}
              <div className="psp-form-group">
                <label className="psp-form-label">Special Instructions <span>(Optional)</span></label>
                <textarea className="psp-form-input" rows={2} placeholder="Any specific requirements…"
                  value={orderForm.specialRequests} onChange={e => setOrderForm(p => ({ ...p, specialRequests: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>

            </div>

            <div className="psp-modal-footer">
              <button type="button" className="psp-cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="psp-submit-btn" disabled={loading || totalDays <= 0}>
                {loading ? <><span className="psp-spinner" /> Submitting…</> : <><Car size={18} /> Submit Reservation</>}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        /* ── MODAL / OVERLAY ─────────────────────────────── */
        .psp-overlay {
          position:fixed;top:0;left:0;right:0;bottom:0;
          background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);
          display:flex;align-items:flex-start;justify-content:center;
          z-index:9999;padding:40px 20px;overflow-y:auto;
        }
        .psp-modal {
          background:white;border-radius:0;width:100%;max-width:620px;
          margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);
          animation:psp-pop 0.3s ease;
        }
        @keyframes psp-pop {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .psp-modal-header {
          padding:24px 28px;border-bottom:1px solid #e2e8f0;
          display:flex;align-items:center;justify-content:space-between;
          background:linear-gradient(135deg,#1a2b4b,#0D7C66);
        }
        .psp-modal-title { margin:0;font-size:1.1rem;font-weight:800;color:#FFD700;display:flex;align-items:center;gap:10px; }
        .psp-modal-subtitle { font-size:0.8rem;color:rgba(255,255,255,0.7);margin:4px 0 0; }
        .psp-close-btn {
          background:rgba(255,255,255,0.15);border:none;color:white;
          cursor:pointer;display:flex;align-items:center;
          padding:8px;border-radius:8px;transition:all 0.2s;
        }
        .psp-close-btn:hover { background:rgba(255,255,255,0.3); }
        .psp-modal-body { padding:28px;display:flex;flex-direction:column;gap:18px; }
        .psp-form-group { display:flex;flex-direction:column;gap:8px; }
        .psp-form-label {
          font-weight:700;font-size:0.85rem;color:#1e293b;
          display:flex;align-items:center;gap:6px;
        }
        .psp-form-label span { font-weight:400;color:#94a3b8; }
        .psp-form-input {
          padding:12px 16px;border:2px solid #e2e8f0;width:100%;box-sizing:border-box;
          border-radius:0;font-size:0.95rem;background:white;
          color:#0f172a;transition:all 0.2s;font-family:inherit;outline:none;
        }
        .psp-form-input:focus { border-color:#0D7C66;box-shadow:0 0 0 3px rgba(13,124,102,0.1); }
        .psp-form-input:disabled { background:#f8fafc;color:#64748b;cursor:not-allowed; }
        .psp-form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
        @media(max-width:500px){ .psp-form-row { grid-template-columns:1fr; } }
        
        .psp-section-divider {
          font-size:0.75rem;font-weight:800;color:#1a2b4b;letter-spacing:1.5px;
          text-transform:uppercase;padding:8px 0 4px;border-top:2px solid #e2e8f0;
          margin-top:4px;display:flex;align-items:center;gap:8px;
        }
        .psp-section-divider::after { content:'';flex:1;height:1px;background:#e2e8f0; }
        
        .psp-file-upload {
          border:2px dashed #cbd5e1;border-radius:0;padding:24px;
          text-align:center;cursor:pointer;transition:all 0.3s;background:#f8fafc;
        }
        .psp-file-upload:hover { border-color:#0D7C66;background:#f0fdf4; }
        .psp-file-upload.has-file { border-color:#0D7C66;background:#f0fdf4;border-style:solid; }
        
        .psp-price-summary {
          background:linear-gradient(135deg,#f0fdf4,#dcfce7);
          border:2px solid #86efac;border-radius:0;padding:20px;
        }
        .psp-price-row { display:flex;justify-content:space-between;align-items:center;font-size:0.9rem;color:#166534;padding:4px 0; }
        .psp-price-total { font-size:1.3rem;font-weight:900;color:#15803d;border-top:2px solid #86efac;padding-top:12px;margin-top:8px; }
        
        .psp-modal-footer {
          padding:20px 28px;border-top:1px solid #e2e8f0;
          display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;
        }
        .psp-cancel-btn {
          padding:12px 24px;background:white;border:2px solid #e2e8f0;
          border-radius:0;color:#475569;font-weight:700;
          cursor:pointer;transition:all 0.2s;font-family:inherit;
        }
        .psp-cancel-btn:hover { background:#f1f5f9; }
        .psp-submit-btn {
          padding:12px 28px;
          background:linear-gradient(135deg,#1a2b4b,#0D7C66);
          border:none;border-radius:0;color:white;
          font-weight:800;cursor:pointer;display:flex;
          align-items:center;gap:8px;transition:all 0.2s;
          font-family:inherit;font-size:1rem;
        }
        .psp-submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
        .psp-submit-btn:disabled { opacity:0.6;cursor:not-allowed; }
        .psp-spinner {
          display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);
          border-radius:50%;border-top-color:white;animation:spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        
        .psp-error-box {
          background:#fef2f2;border:1.5px solid #fca5a5;color:#dc2626;
          padding:12px 16px;font-size:13px;display:flex;align-items:center;gap:8px;border-radius:0;
        }
        .psp-success-body { padding:48px 32px;text-align:center;display:flex;flex-direction:column;align-items:center; }
        .psp-success-emoji { font-size:4rem;margin-bottom:16px;display:block;animation:psp-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        .psp-success-title { font-size:1.6rem;font-weight:900;color:#0f172a;margin:0 0 8px; }
        .psp-success-sub { font-size:1rem;color:#475569;margin:0;line-height:1.6; }
        .psp-print-btn {
          padding:12px 24px;background:linear-gradient(135deg,#1a2b4b,#0D7C66);
          border:none;border-radius:0;color:white;font-weight:700;
          cursor:pointer;display:flex;align-items:center;gap:8px;
          font-family:inherit;font-size:0.95rem;transition:all 0.2s;
        }
        .psp-print-btn:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
      `}</style>
    </div>
  );
};

export default RentalAgreementModal;
