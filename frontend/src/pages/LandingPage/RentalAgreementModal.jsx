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
    <div className="ram-overlay" onClick={onClose}>
      <div className="ram-modal" onClick={e => e.stopPropagation()}>
        <div className="ram-modal-header">
          <div>
            <h3 className="ram-modal-title"><Car size={22} /> Reserve Vehicle</h3>
            <p className="ram-modal-subtitle">{car?.name} — ETB {dailyRate.toLocaleString()}/day — Fill in all details below</p>
          </div>
          <button className="ram-close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {successData ? (
          <div className="ram-success-body">
            <span className="ram-success-emoji">✅</span>
            <h3 className="ram-success-title">Order Placed Successfully!</h3>
            <p className="ram-success-sub">
              Order <strong>{successData.orderNumber}</strong> has been received.<br />
              Our team will contact you shortly to confirm the booking.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button className="ram-btn-primary" onClick={() => {
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
              <button className="ram-btn-secondary" onClick={() => { onClose(); navigate('/customer'); }}>
                My Orders
              </button>
            </div>
            <p className="ram-success-hint">Track your order from <strong>Customer Portal → Car Rental Orders</strong></p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} className="ram-modal-form">
            <div className="ram-modal-body">
              {error && (
                <div className="ram-error-box"><X size={15} /> {error}</div>
              )}

              {/* Customer Info */}
              <div className="ram-info-panel">
                <div className="ram-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <User size={14} /> Customer Information
                </div>
                <div className="ram-form-row">
                  <div className="ram-form-group">
                    <label className="ram-form-label">Full Name</label>
                    <input className="ram-form-input" value={currentUser?.fullName || currentUser?.full_name || currentUser?.name || ''} disabled />
                  </div>
                  <div className="ram-form-group">
                    <label className="ram-form-label">Email</label>
                    <input className="ram-form-input" value={currentUser?.email || ''} disabled />
                  </div>
                </div>
                <div className="ram-form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="ram-form-label">Phone Number</label>
                  <input className="ram-form-input" value={currentUser?.phone || ''} disabled />
                </div>
              </div>

              {/* Vehicle summary */}
              <div className="ram-vehicle-panel">
                <Car size={28} className="ram-vehicle-icon" />
                <div>
                  <div className="ram-vehicle-name">{car?.name}</div>
                  <div className="ram-vehicle-rate">ETB {dailyRate.toLocaleString()}/day • Includes Company Driver</div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="ram-section-divider"><Calendar size={14} /> Rental Period</div>
              <div className="ram-form-row">
                <div className="ram-form-group">
                  <label className="ram-form-label">Pickup Date *</label>
                  <input type="date" required className="ram-form-input" value={orderForm.pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setOrderForm(p => ({ ...p, pickupDate: e.target.value }))} />
                </div>
                <div className="ram-form-group">
                  <label className="ram-form-label">Return Date *</label>
                  <input type="date" required className="ram-form-input" value={orderForm.returnDate}
                    min={orderForm.pickupDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setOrderForm(p => ({ ...p, returnDate: e.target.value }))} />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="ram-price-summary">
                  <div className="ram-price-row"><span>{totalDays} day{totalDays !== 1 ? 's' : ''} × ETB {dailyRate.toLocaleString()}/day</span><span>ETB {rentalTotal.toLocaleString()}</span></div>
                  <div className="ram-price-row"><span>VAT ({fmtPct(vatCalc.rate)})</span><span>ETB {vatCalc.vat.toLocaleString()}</span></div>
                  <div className="ram-price-row" style={{ color: 'hsl(var(--ram-success))' }}><span>Security Deposit (Refundable)</span><span>ETB {securityDeposit.toLocaleString()}</span></div>
                  <div className="ram-price-total" style={{ display: 'flex', justifyContent: 'space-between' }}><span>TOTAL ESTIMATED (incl. VAT)</span><span>ETB {grandTotal.toLocaleString()}</span></div>
                </div>
              )}

              {/* Payment */}
              <div className="ram-section-divider"><CreditCard size={14} /> Payment Proof</div>
              <div className="ram-form-row">
                <div className="ram-form-group">
                  <label className="ram-form-label">Payment Method *</label>
                  {financeAccounts.length === 0 ? (
                    <div className="ram-loading-box">
                      ⏳ Loading payment accounts…
                    </div>
                  ) : (
                    <select required className="ram-form-input"
                      value={orderForm.paymentMethod}
                      onChange={e => setOrderForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    >
                      <option value="">— Select Payment Account —</option>
                      {['Bank', 'Mobile Wallet'].map(type => {
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
                <div className="ram-form-group">
                  <label className="ram-form-label">Transaction Reference</label>
                  <input type="text" className="ram-form-input" placeholder="e.g. TXN-123456"
                    value={orderForm.paymentReference} onChange={e => setOrderForm(p => ({ ...p, paymentReference: e.target.value }))} />
                </div>
              </div>

              {/* Auto-fill account details panel */}
              {orderForm.paymentMethod && (() => {
                const acc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
                if (!acc) return null;
                return (
                  <div className="ram-bank-panel">
                    <Wallet size={18} className="ram-bank-icon" />
                    <div>
                      <div className="ram-bank-title">📋 Transfer Payment To:</div>
                      <div><strong>Account Name:</strong> {acc.account_name}</div>
                      {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                      {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                      {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                      <div className="ram-bank-hint">After payment, enter the transaction reference number above.</div>
                    </div>
                  </div>
                );
              })()}

              {/* Screenshot upload */}
              <div className="ram-form-group">
                <label className="ram-form-label"><Upload size={14} /> Payment Screenshot <span>(optional if reference given)</span></label>
                <div className={`ram-file-upload${orderFile ? ' has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files[0] || null)} />
                  <Upload size={24} color={orderFile ? 'hsl(var(--ram-primary))' : 'hsl(var(--ram-muted-fg))'} />
                  <p className="ram-file-upload-title">
                    {orderFile ? `✅ ${orderFile.name}` : 'Click to upload payment screenshot'}
                  </p>
                  <p className="ram-file-upload-sub">PNG, JPG, JPEG accepted</p>
                </div>
              </div>

              {/* Special Requests */}
              <div className="ram-form-group">
                <label className="ram-form-label">Special Instructions <span>(Optional)</span></label>
                <textarea className="ram-form-input" rows={2} placeholder="Any specific requirements…"
                  value={orderForm.specialRequests} onChange={e => setOrderForm(p => ({ ...p, specialRequests: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>

            </div>

            <div className="ram-modal-footer">
              <button type="button" className="ram-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="ram-btn-primary" disabled={loading || totalDays <= 0}>
                {loading ? <><span className="ram-spinner" /> Submitting…</> : <><Car size={18} /> Submit Reservation</>}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        /* ── MODAL / OVERLAY ─────────────────────────────── */
        :root {
          --ram-bg: 0 0% 100%;
          --ram-fg: 222.2 84% 4.9%;
          --ram-primary: 142.1 76.2% 36.3%;
          --ram-primary-fg: 355.7 100% 97.3%;
          --ram-muted: 210 40% 96.1%;
          --ram-muted-fg: 215.4 16.3% 46.9%;
          --ram-border: 214.3 31.8% 91.4%;
          --ram-radius: 0.75rem;
          --ram-radius-sm: 0.5rem;
          --ram-success: 160.1 84.1% 39.4%;
          --ram-error: 0 84.2% 60.2%;
        }

        .ram-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9999;
          overflow-y: auto;
          padding: 5rem 1rem 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .ram-overlay *, .ram-overlay *::before, .ram-overlay *::after {
          box-sizing: border-box;
        }

        .ram-modal {
          margin: 0 auto;
          background-color: hsl(var(--ram-bg));
          border-radius: var(--ram-radius);
          width: 100%;
          max-width: 650px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          animation: ram-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes ram-pop {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ram-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid hsl(var(--ram-border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: hsl(var(--ram-bg));
          z-index: 10;
          border-radius: var(--ram-radius) var(--ram-radius) 0 0;
        }

        .ram-modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--ram-fg));
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ram-modal-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--ram-muted-fg));
          margin: 0.25rem 0 0;
          line-height: 1.5;
        }

        .ram-close-btn {
          background-color: hsl(var(--ram-muted));
          border: none;
          color: hsl(var(--ram-muted-fg));
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: var(--ram-radius-sm);
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .ram-close-btn:hover {
          background-color: hsl(var(--ram-border));
          color: hsl(var(--ram-fg));
        }

        .ram-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ram-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ram-form-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: hsl(var(--ram-fg));
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .ram-form-label span {
          font-weight: 400;
          color: hsl(var(--ram-muted-fg));
        }

        .ram-form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid hsl(var(--ram-border));
          border-radius: var(--ram-radius-sm);
          background-color: hsl(var(--ram-bg));
          font-size: 1rem;
          font-family: inherit;
          color: hsl(var(--ram-fg));
          line-height: 1.5;
          min-height: 3rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          appearance: auto;
          -webkit-appearance: auto;
        }
        .ram-form-input:focus {
          outline: none;
          border-color: hsl(var(--ram-primary));
          box-shadow: 0 0 0 2px hsl(var(--ram-primary) / 0.2);
        }
        .ram-form-input:disabled {
          background-color: hsl(var(--ram-muted));
          color: hsl(var(--ram-muted-fg));
          cursor: not-allowed;
        }

        select.ram-form-input {
          padding-top: 0.625rem;
          padding-bottom: 0.625rem;
          height: auto;
          cursor: pointer;
        }

        .ram-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media(max-width: 600px) {
          .ram-form-row { grid-template-columns: 1fr; }
        }

        .ram-section-divider {
          font-size: 0.75rem;
          font-weight: 700;
          color: hsl(var(--ram-muted-fg));
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0 0;
          border-top: 1px solid hsl(var(--ram-border));
        }

        /* Information Panels */
        .ram-info-panel {
          background-color: hsl(var(--ram-muted));
          border: 1px solid hsl(var(--ram-border));
          border-radius: var(--ram-radius-sm);
          padding: 1.25rem;
        }

        .ram-vehicle-panel {
          background-color: hsl(var(--ram-primary) / 0.05);
          border: 1px solid hsl(var(--ram-primary) / 0.2);
          border-radius: var(--ram-radius-sm);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ram-vehicle-icon {
          color: hsl(var(--ram-primary));
          flex-shrink: 0;
        }
        .ram-vehicle-name {
          font-weight: 700;
          font-size: 1rem;
          color: hsl(var(--ram-fg));
          margin-bottom: 0.25rem;
        }
        .ram-vehicle-rate {
          font-size: 0.875rem;
          color: hsl(var(--ram-primary));
          font-weight: 600;
        }

        .ram-bank-panel {
          background-color: hsl(var(--ram-primary) / 0.05);
          border: 1px solid hsl(var(--ram-primary) / 0.3);
          border-radius: var(--ram-radius-sm);
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: hsl(var(--ram-fg));
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .ram-bank-icon {
          color: hsl(var(--ram-primary));
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .ram-bank-title {
          font-weight: 700;
          margin-bottom: 0.375rem;
        }
        .ram-bank-hint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: hsl(var(--ram-primary));
        }

        /* File Upload */
        .ram-file-upload {
          border: 1px dashed hsl(var(--ram-border));
          border-radius: var(--ram-radius-sm);
          padding: 2rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          background-color: hsl(var(--ram-muted));
        }
        .ram-file-upload:hover {
          border-color: hsl(var(--ram-primary));
          background-color: hsl(var(--ram-primary) / 0.02);
        }
        .ram-file-upload.has-file {
          border-color: hsl(var(--ram-primary));
          background-color: hsl(var(--ram-primary) / 0.05);
          border-style: solid;
        }
        .ram-file-upload-title {
          margin: 0.75rem 0 0.25rem;
          font-weight: 600;
          color: hsl(var(--ram-fg));
          font-size: 0.875rem;
        }
        .ram-file-upload-sub {
          margin: 0;
          font-size: 0.75rem;
          color: hsl(var(--ram-muted-fg));
        }

        /* Pricing Summary */
        .ram-price-summary {
          background-color: hsl(var(--ram-primary) / 0.05);
          border: 1px solid hsl(var(--ram-primary) / 0.2);
          border-radius: var(--ram-radius-sm);
          padding: 1.25rem;
        }
        .ram-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: hsl(var(--ram-fg));
          padding: 0.25rem 0;
        }
        .ram-price-total {
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(var(--ram-fg));
          border-top: 1px solid hsl(var(--ram-border));
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Buttons & Footer */
        .ram-modal-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid hsl(var(--ram-border));
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background-color: hsl(var(--ram-bg));
          border-radius: 0 0 var(--ram-radius) var(--ram-radius);
        }

        .ram-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: hsl(var(--ram-primary));
          color: hsl(var(--ram-primary-fg));
          font-weight: 600;
          font-size: 1rem;
          border-radius: var(--ram-radius-sm);
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          font-family: inherit;
        }
        .ram-btn-primary:hover:not(:disabled) {
          background-color: hsl(var(--ram-primary-dark));
          transform: translateY(-2px);
        }
        .ram-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ram-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          background-color: hsl(var(--ram-bg));
          color: hsl(var(--ram-fg));
          font-weight: 600;
          font-size: 1rem;
          border-radius: var(--ram-radius-sm);
          border: 1px solid hsl(var(--ram-border));
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-family: inherit;
        }
        .ram-btn-secondary:hover:not(:disabled) {
          background-color: hsl(var(--ram-muted));
        }
        .ram-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Utilities */
        .ram-error-box {
          background-color: hsl(var(--ram-error) / 0.1);
          border: 1px solid hsl(var(--ram-error) / 0.3);
          color: hsl(var(--ram-error));
          padding: 1rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: var(--ram-radius-sm);
        }

        .ram-spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 9999px;
          border-top-color: white;
          animation: ram-spin 0.8s linear infinite;
        }
        @keyframes ram-spin {
          to { transform: rotate(360deg); }
        }

        .ram-loading-box {
          padding: 0.75rem 1rem;
          background-color: hsl(var(--ram-muted));
          border: 1px solid hsl(var(--ram-border));
          border-radius: var(--ram-radius-sm);
          font-size: 0.875rem;
          color: hsl(var(--ram-muted-fg));
        }

        /* Success Screen */
        .ram-success-body {
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ram-success-emoji {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          display: block;
          animation: ram-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ram-success-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--ram-fg));
          margin: 0 0 0.5rem;
        }
        .ram-success-sub {
          font-size: 1rem;
          color: hsl(var(--ram-muted-fg));
          margin: 0 0 2rem;
          line-height: 1.625;
        }
        .ram-success-hint {
          font-size: 0.875rem;
          color: hsl(var(--ram-muted-fg));
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default RentalAgreementModal;
