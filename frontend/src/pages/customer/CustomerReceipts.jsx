import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../../services/apiClient';
import carService from '../../services/carService';
import {
  RefreshCw, FileText, CheckCircle, Loader2, Search, Download,
  Printer, Leaf, Car, ShoppingBag, Pill, Award, Package,
  Calendar, CreditCard, X
} from 'lucide-react';

/* ─── shared CSS (same token set) ───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .rec-page {
    padding: 32px;
    background: #F8FAFC;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #334155;
  }
  @media (max-width: 720px) { .rec-page { padding: 16px; } }

  .rec-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
  .rec-title { font-size: 2.4rem; font-weight: 800; color: #1B5E20; margin: 0; letter-spacing: -0.03em; line-height: 1.1; }
  .rec-sub { font-size: 0.95rem; color: #6B8E23; margin: 6px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Premium Stats Cards */
  .rec-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 32px; }
  .rec-stat { 
    background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
    border: 1px solid rgba(141, 110, 99, 0.2); border-radius: 16px; padding: 24px; 
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .rec-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); }
  .rec-stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
  .rec-stat-value { font-size: 2rem; font-weight: 800; color: #1B5E20; letter-spacing: -0.02em; }
  .rec-stat-sub { font-size: 0.85rem; color: #94a3b8; margin-top: 8px; font-weight: 500; }

  /* Controls */
  .rec-controls { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .rec-search { 
    flex: 1; min-width: 250px; display: flex; align-items: center; gap: 10px; 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: border-color 0.2s ease;
  }
  .rec-search:focus-within { border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.1); }
  .rec-search input { border: none; outline: none; flex: 1; font-size: 0.95rem; font-family: 'Inter', sans-serif; color: #334155; }
  .rec-select { 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; 
    font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #475569; cursor: pointer; font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: border-color 0.2s ease;
  }
  .rec-select:focus { outline: none; border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.1); }

  /* Cards grid */
  .rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
  @media (max-width: 760px) { .rec-grid { grid-template-columns: 1fr; } }

  .rec-card { 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
  }
  .rec-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: #cbd5e1; }

  .rec-card-top { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .rec-card-body { padding: 20px 24px; flex: 1; background: #fff; }
  .rec-card-footer { padding: 16px 24px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid #f1f5f9; }

  .rec-ref { font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #1B5E20; letter-spacing: 0.05em; background: #f0fdf4; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px;}
  .rec-title-text { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; line-height: 1.3; }
  .rec-amount { font-size: 1.8rem; font-weight: 800; color: #1B5E20; letter-spacing: -0.02em; margin-bottom: 2px; }
  .rec-amount-sub { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }

  .rec-detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.9rem; }
  .rec-detail-row:last-child { margin-bottom: 0; }
  .rec-detail-label { color: #64748b; font-weight: 600; }
  .rec-detail-value { color: #334155; font-weight: 700; text-align: right; }

  /* Source tag */
  .rec-source { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid transparent; }
  .rec-tag-retail    { background: #fff7ed; color: #c2410c; border-color: #ffedd5; }
  .rec-tag-agrirent  { background: #f0fdf4; color: #15803d; border-color: #dcfce7; }
  .rec-tag-car       { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
  .rec-tag-printing  { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
  .rec-tag-pharmacy  { background: #fdf2f8; color: #be185d; border-color: #fce7f3; }
  .rec-tag-buytender { background: #fefce8; color: #a16207; border-color: #fef08a; }
  .rec-tag-selltender { background: #f5f3ff; color: #6d28d9; border-color: #ede9fe; }

  /* Status badge */
  .rec-badge-done { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }

  /* Buttons */
  .rec-btn-primary { background: #2E8B57; color: #FFFFFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(46, 139, 87, 0.25); }
  .rec-btn-primary:hover { background: #246e45; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(46, 139, 87, 0.35); }
  .rec-btn-secondary { background: #FFFFFF; color: #1B5E20; border: 1px solid #1B5E20; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s ease; }
  .rec-btn-secondary:hover:not(:disabled) { background: #f8fafc; transform: translateY(-1px); }
  .rec-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Print overlay */
  .rec-print-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .rec-print-modal { background: #FFFFFF; border-radius: 20px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
  .rec-print-header { padding: 24px 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 20px 20px 0 0; }
  .rec-print-body { padding: 32px; }
  
  .rec-spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .rec-empty { text-align: center; padding: 80px 20px; color: #64748b; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1; margin-top: 20px; }
  .rec-empty-icon { margin-bottom: 20px; color: #cbd5e1; }

  /* We handle print explicitly by opening a new window, so @media print here is a fallback */
  @media print {
    body * { visibility: hidden; }
    .receipt-printable, .receipt-printable * { visibility: visible; }
    .receipt-printable { position: fixed; left: 0; top: 0; width: 100%; }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtAmt = (n) => {
  const num = parseFloat(n || 0);
  return `ETB ${num.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const COMPLETED_STATUSES = ['COMPLETED', 'DELIVERED', 'PAID', 'AWARDED', 'PICKED_UP', 'DONE'];
const isCompleted = (s) => COMPLETED_STATUSES.some(x => String(s || '').toUpperCase().includes(x));

const SOURCE_MAP = {
  retail:     { label: 'Retail',         icon: <ShoppingBag size={12}/>, cls: 'rec-tag-retail' },
  agrirent:   { label: 'AgriRent',       icon: <Leaf size={12}/>,        cls: 'rec-tag-agrirent' },
  car:        { label: 'Car Rental',     icon: <Car size={12}/>,          cls: 'rec-tag-car' },
  printing:   { label: 'Printing',       icon: <Printer size={12}/>,      cls: 'rec-tag-printing' },
  pharmacy:   { label: 'Pharmacy',       icon: <Pill size={12}/>,         cls: 'rec-tag-pharmacy' },
  buytender:  { label: 'Compete & Buy',  icon: <Award size={12}/>,        cls: 'rec-tag-buytender' },
  selltender: { label: 'Compete & Sell', icon: <Package size={12}/>,      cls: 'rec-tag-selltender' },
};

const ReceiptModal = ({ rec, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${rec.refNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              max-width: 800px; 
              margin: 0 auto; 
              background: #fff;
            }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1B5E20; padding-bottom: 24px; margin-bottom: 32px; }
            .invoice-brand h1 { margin: 0; color: #1B5E20; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
            .invoice-brand p { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { margin: 0 0 8px 0; color: #64748b; font-size: 1.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
            .invoice-meta p { margin: 4px 0; font-size: 0.95rem; color: #334155; }
            .invoice-meta strong { color: #1e293b; }
            
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 10rem; color: rgba(34, 139, 34, 0.03); z-index: -1; font-weight: 800; white-space: nowrap; pointer-events: none; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px #e2e8f0; }
            th { background: #f8fafc; color: #475569; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 14px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; }
            td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
            tr:last-child td { border-bottom: none; }
            
            .summary { width: 320px; float: right; }
            .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #475569; }
            .summary-row.total { border-bottom: none; border-top: 2px solid #1B5E20; padding-top: 16px; margin-top: 8px; font-size: 1.4rem; font-weight: 800; color: #1B5E20; }
            
            .footer { clear: both; margin-top: 60px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 0.85rem; }
            .status-stamp { display: inline-block; padding: 8px 16px; border: 2px solid #15803d; color: #15803d; font-weight: 800; font-size: 1.2rem; transform: rotate(-5deg); border-radius: 8px; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 16px; }
            
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="watermark">PAID</div>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    // small delay to load fonts before printing
    setTimeout(() => { win.print(); }, 250);
  };

  const src = SOURCE_MAP[rec.source] || { label: rec.source };

  const buildItems = () => {
    const { source, raw } = rec;
    if (source === 'retail' && raw.items?.length) {
      return raw.items.map(it => ({ name: it.product_name, qty: it.quantity, unitPrice: it.unit_price, subtotal: it.subtotal }));
    }
    if (source === 'selltender' && raw.items?.length) {
      return raw.items.map(it => ({ name: it.object_type, qty: it.tender_quantity, unitPrice: `${it.price_birr}.${String(it.price_cent||0).padStart(2,'0')} ETB`, subtotal: `${it.total_birr}.${String(it.total_cent||0).padStart(2,'0')} ETB` }));
    }
    return [];
  };

  const lineItems = buildItems();

  return (
    <div className="rec-print-overlay" onClick={onClose}>
      <div className="rec-print-modal" onClick={e => e.stopPropagation()}>
        <div className="rec-print-header">
          <div>
            <div style={{fontSize:'1.4rem', fontWeight:800, color:'#1B5E20', display:'flex', alignItems:'center', gap:'8px'}}>
              <Award size={24} /> Receipt Preview
            </div>
          </div>
          <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
            <button className="rec-btn-primary" onClick={handlePrint}><Printer size={16} /> Print Receipt</button>
            <button onClick={onClose} style={{background:'#f1f5f9', border:'none', cursor:'pointer', color:'#64748b', padding:'8px', borderRadius:'50%', display:'flex'}}><X size={20} /></button>
          </div>
        </div>

        <div className="rec-print-body receipt-printable" style={{display:'none'}} ref={printRef}>
          <div className="invoice-header">
            <div className="invoice-brand">
              <h1>SUTANA Trading</h1>
              <p>Addis Ababa, Ethiopia<br/>TIN: 0011223344</p>
            </div>
            <div className="invoice-meta">
              <h2>RECEIPT</h2>
              <p>Receipt #: <strong>{rec.refNumber}</strong></p>
              <p>Date: <strong>{fmtDate(rec.date)}</strong></p>
              <p>Service: <strong>{src.label}</strong></p>
            </div>
          </div>

          <div style={{marginBottom:'32px'}}>
            <div className="status-stamp">PAID / COMPLETED</div>
            <p style={{margin:0, color:'#334155'}}><strong>Description:</strong> {rec.description}</p>
          </div>

          {/* Line items if available */}
          {lineItems.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{textAlign:'right'}}>Qty</th>
                  <th style={{textAlign:'right'}}>Unit Price</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((it, i) => (
                  <tr key={i}>
                    <td>{it.name}</td>
                    <td style={{textAlign:'right'}}>{it.qty}</td>
                    <td style={{textAlign:'right'}}>{typeof it.unitPrice === 'number' ? fmtAmt(it.unitPrice) : it.unitPrice}</td>
                    <td style={{textAlign:'right', fontWeight:600}}>{typeof it.subtotal === 'number' ? fmtAmt(it.subtotal) : it.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Summary */}
          <div className="summary">
            {rec.source === 'retail' && (
              <>
                <div className="summary-row"><span>Subtotal</span><span>{fmtAmt(rec.raw.subtotal)}</span></div>
                <div className="summary-row"><span>VAT (15%)</span><span>{fmtAmt(rec.raw.tax)}</span></div>
                <div className="summary-row"><span>Delivery</span><span>{fmtAmt(rec.raw.delivery_fee)}</span></div>
              </>
            )}
            {rec.source === 'agrirent' && (
              <>
                <div className="summary-row"><span>Daily Rate</span><span>{fmtAmt(rec.raw.daily_rate)}</span></div>
                <div className="summary-row"><span>Days</span><span>{rec.raw.total_days}</span></div>
                <div className="summary-row"><span>Payment Method</span><span>{rec.raw.payment_method || '—'}</span></div>
              </>
            )}
            {rec.source === 'car' && (
              <>
                <div className="summary-row"><span>Rental Amount</span><span>{fmtAmt(rec.raw.rentalAmount)}</span></div>
                <div className="summary-row"><span>Security Deposit</span><span>{fmtAmt(rec.raw.securityDeposit)}</span></div>
                <div className="summary-row"><span>Payment Method</span><span>{rec.raw.paymentMethod || '—'}</span></div>
                {rec.raw.damageFee > 0 && <div className="summary-row"><span>Damage Fee</span><span>{fmtAmt(rec.raw.damageFee)}</span></div>}
                {rec.raw.lateFee > 0 && <div className="summary-row"><span>Late Fee</span><span>{fmtAmt(rec.raw.lateFee)}</span></div>}
              </>
            )}
            {rec.source === 'printing' && (
              <>
                <div className="summary-row"><span>Product</span><span>{rec.raw.product_type}</span></div>
                <div className="summary-row"><span>Quantity</span><span>{rec.raw.quantity} copies</span></div>
                <div className="summary-row"><span>Payment Method</span><span>{rec.raw.payment_method || '—'}</span></div>
              </>
            )}
            {rec.source === 'pharmacy' && (
              <>
                <div className="summary-row"><span>Medication</span><span>{rec.raw.medication_name}</span></div>
                <div className="summary-row"><span>Quantity</span><span>{rec.raw.quantity}</span></div>
                <div className="summary-row"><span>Delivery Option</span><span>{rec.raw.delivery_option || '—'}</span></div>
                {rec.raw.delivery_fee > 0 && <div className="summary-row"><span>Delivery Fee</span><span>{fmtAmt(rec.raw.delivery_fee)}</span></div>}
              </>
            )}
            {rec.source === 'buytender' && (
              <>
                <div className="summary-row"><span>Item</span><span>{rec.raw.item_name}</span></div>
                <div className="summary-row"><span>Qty Requested</span><span>{rec.raw.quantity_requested}</span></div>
                <div className="summary-row"><span>Unit Price</span><span>{fmtAmt(rec.raw.bid_price_per_unit)}</span></div>
              </>
            )}
            <div className="summary-row total">
              <span>TOTAL PAID</span>
              <span>{fmtAmt(rec.totalAmount)}</span>
            </div>
          </div>

          <div className="footer">
            Thank you for your business.<br/>
            This is a computer generated receipt and does not require a physical signature.<br/>
            <strong>SUTANA Enterprise Management System</strong>
          </div>
        </div>
        
        {/* Visual preview in the modal (looks exactly like print but scaled for modal) */}
        <div className="rec-print-body" style={{background:'#f8fafc'}}>
          <div style={{background:'#fff', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', position:'relative', zIndex:1, overflow:'hidden'}}>
             <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%) rotate(-45deg)', fontSize:'8rem', color:'rgba(34, 139, 34, 0.03)', zIndex:-1, fontWeight:800, whiteSpace:'nowrap', pointerEvents:'none'}}>PAID</div>
             <div style={{display:'flex', justifyContent:'space-between', borderBottom:'2px solid #1B5E20', paddingBottom:'24px', marginBottom:'32px'}}>
                <div>
                   <h1 style={{margin:0, color:'#1B5E20', fontSize:'1.8rem', fontWeight:800, letterSpacing:'-0.03em'}}>SUTANA Trading</h1>
                   <p style={{margin:'4px 0 0', color:'#64748b', fontSize:'0.85rem'}}>Addis Ababa, Ethiopia<br/>TIN: 0011223344</p>
                </div>
                <div style={{textAlign:'right'}}>
                   <h2 style={{margin:'0 0 8px 0', color:'#64748b', fontSize:'1.4rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em'}}>RECEIPT</h2>
                   <p style={{margin:'4px 0', fontSize:'0.9rem', color:'#334155'}}>Receipt #: <strong>{rec.refNumber}</strong></p>
                   <p style={{margin:'4px 0', fontSize:'0.9rem', color:'#334155'}}>Date: <strong>{fmtDate(rec.date)}</strong></p>
                </div>
             </div>
             
             <div style={{marginBottom:'24px'}}>
               <div style={{display:'inline-block', padding:'6px 12px', border:'2px solid #15803d', color:'#15803d', fontWeight:800, fontSize:'1rem', transform:'rotate(-5deg)', borderRadius:'6px', letterSpacing:'0.1em', opacity:0.8, marginBottom:'12px'}}>PAID / COMPLETED</div>
               <p style={{margin:0, color:'#334155', fontSize:'0.95rem'}}><strong>Description:</strong> {rec.description}</p>
             </div>
             
             {lineItems.length > 0 && (
                <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'24px', borderRadius:'8px', overflow:'hidden', boxShadow:'0 0 0 1px #e2e8f0'}}>
                  <thead>
                    <tr>
                      <th style={{background:'#f8fafc', color:'#475569', fontWeight:700, fontSize:'0.8rem', textTransform:'uppercase', padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0'}}>Description</th>
                      <th style={{background:'#f8fafc', color:'#475569', fontWeight:700, fontSize:'0.8rem', textTransform:'uppercase', padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0'}}>Qty</th>
                      <th style={{background:'#f8fafc', color:'#475569', fontWeight:700, fontSize:'0.8rem', textTransform:'uppercase', padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0'}}>Price</th>
                      <th style={{background:'#f8fafc', color:'#475569', fontWeight:700, fontSize:'0.8rem', textTransform:'uppercase', padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0'}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((it, i) => (
                      <tr key={i}>
                        <td style={{padding:'12px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem'}}>{it.name}</td>
                        <td style={{padding:'12px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', textAlign:'right'}}>{it.qty}</td>
                        <td style={{padding:'12px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', textAlign:'right'}}>{typeof it.unitPrice === 'number' ? fmtAmt(it.unitPrice) : it.unitPrice}</td>
                        <td style={{padding:'12px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', textAlign:'right', fontWeight:600}}>{typeof it.subtotal === 'number' ? fmtAmt(it.subtotal) : it.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
             
             <div style={{display:'flex', justifyContent:'flex-end'}}>
               <div style={{width:'280px'}}>
                  {rec.source === 'retail' && (
                    <>
                      <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', color:'#475569'}}><span>Subtotal</span><span>{fmtAmt(rec.raw.subtotal)}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', color:'#475569'}}><span>VAT (15%)</span><span>{fmtAmt(rec.raw.tax)}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem', color:'#475569'}}><span>Delivery</span><span>{fmtAmt(rec.raw.delivery_fee)}</span></div>
                    </>
                  )}
                  {/* Just render the total for preview space saving */}
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:'16px', marginTop:'8px', borderTop:'2px solid #1B5E20', fontSize:'1.2rem', fontWeight:800, color:'#1B5E20'}}>
                    <span>TOTAL PAID</span><span>{fmtAmt(rec.totalAmount)}</span>
                  </div>
               </div>
             </div>
             
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Receipt Card ──────────────────────────────────────────────────────── */
const ReceiptCard = ({ rec, onView }) => {
  const src = SOURCE_MAP[rec.source] || { label: rec.source, icon: <FileText size={12}/>, cls: '' };

  const detailLines = () => {
    const { source, raw } = rec;
    if (source === 'retail') return [
      { label: 'Items', value: (raw.items || []).map(i => i.product_name).join(', ').slice(0, 60) || '—' },
      { label: 'Delivery', value: raw.delivery_type || '—' },
    ];
    if (source === 'agrirent') return [
      { label: 'Tractor', value: raw.tractor_name || '—' },
      { label: 'Period', value: `${fmtDate(raw.start_date)} → ${fmtDate(raw.end_date)}` },
      { label: 'Payment', value: raw.payment_method || '—' },
    ];
    if (source === 'car') return [
      { label: 'Car', value: raw.carName || '—' },
      { label: 'Period', value: `${fmtDate(raw.pickupDate)} → ${fmtDate(raw.returnDate)}` },
      { label: 'Payment', value: raw.paymentMethod || '—' },
    ];
    if (source === 'printing') return [
      { label: 'Product', value: `${raw.product_type} × ${raw.quantity}` },
      { label: 'Payment', value: raw.payment_method || '—' },
    ];
    if (source === 'pharmacy') return [
      { label: 'Medication', value: raw.medication_name },
      { label: 'Qty', value: String(raw.quantity) },
      { label: 'Delivery', value: raw.delivery_option || '—' },
    ];
    if (source === 'buytender') return [
      { label: 'Item', value: raw.item_name || '—' },
      { label: 'Qty', value: String(raw.quantity_requested) },
    ];
    if (source === 'selltender') return [
      { label: 'Category', value: raw.tender_category || '—' },
      { label: 'Bidder', value: raw.competitor_name || '—' },
    ];
    return [];
  };

  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <div>
          <div className="rec-ref">{rec.refNumber}</div>
          <div className="rec-title-text" style={{maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{rec.description}</div>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px'}}>
          <span className={`rec-source ${src.cls}`}>{src.icon} {src.label}</span>
          <span className="rec-badge-done"><CheckCircle size={12}/> Completed</span>
        </div>
      </div>

      <div className="rec-card-body">
        <div className="rec-amount">{fmtAmt(rec.totalAmount)}</div>
        <div className="rec-amount-sub">Total paid</div>

        <div style={{marginTop:'16px', display:'flex', flexDirection:'column', gap:'8px'}}>
          {detailLines().map((d, i) => (
            <div key={i} className="rec-detail-row">
              <span className="rec-detail-label">{d.label}</span>
              <span className="rec-detail-value" style={{maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.value}</span>
            </div>
          ))}
          <div className="rec-detail-row">
            <span className="rec-detail-label"><Calendar size={13} style={{verticalAlign:'middle', marginRight:4}} />Date</span>
            <span className="rec-detail-value">{fmtDate(rec.date)}</span>
          </div>
        </div>
      </div>

      <div className="rec-card-footer">
        <button className="rec-btn-primary" onClick={() => onView(rec)}>
          <Download size={16} /> View Receipt
        </button>
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function CustomerReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [viewingReceipt, setViewingReceipt] = useState(null);

  /* ── Fetch all services, keep only completed ones ─────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const all = [];
    const safeGet = async (fn) => { try { return await fn(); } catch { return null; } };

    const [retRes, agrRes, carRes, prtRes, rxRes, pubRes, saleRes] = await Promise.all([
      safeGet(() => apiClient.get('/retail/orders/my-orders')),
      safeGet(() => apiClient.get('/agrirent-orders/my-orders')),
      safeGet(() => carService.getMyRentalOrders()),
      safeGet(() => apiClient.get('/printing/customer/orders')),
      safeGet(() => apiClient.get('/pharmacy/requests/my-requests')),
      safeGet(() => apiClient.get('/public-tenders/customer/bids')),
      safeGet(() => apiClient.get('/tenders/my-bids')),
    ]);

    // Retail — completed
    if (retRes?.status === 'success') {
      (retRes.data || []).filter(o => isCompleted(o.status) || isCompleted(o.payment_status)).forEach(o => all.push({
        id: `ret-${o.id}`,
        source: 'retail',
        refNumber: o.invoice_number,
        description: (o.items || []).map(i => i.product_name).join(', ').slice(0, 60) || 'Retail Order',
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        date: o.created_at,
        raw: o,
      }));
    }

    // AgriRent — completed (approved + paid considered done)
    if (agrRes?.status === 'success') {
      (agrRes.data || []).filter(o => isCompleted(o.status) || isCompleted(o.payment_status)).forEach(o => all.push({
        id: `agr-${o.id}`,
        source: 'agrirent',
        refNumber: o.order_number,
        description: `${o.tractor_name || 'Tractor'} — ${o.total_days} day(s)`,
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        date: o.created_at,
        raw: o,
      }));
    }

    // Car Rental — completed
    if (carRes?.status === 'success') {
      (carRes.data || []).filter(o => isCompleted(o.status) || isCompleted(o.paymentStatus)).forEach(o => all.push({
        id: `car-${o.id}`,
        source: 'car',
        refNumber: o.orderNumber,
        description: `${o.carName || 'Car'} — ${o.totalDays} day(s)`,
        totalAmount: parseFloat(o.totalAmount || 0),
        status: o.status,
        date: o.createdAt,
        raw: o,
      }));
    }

    // Printing — completed
    if (prtRes?.status === 'success') {
      const orders = prtRes.data?.orders || prtRes.data || [];
      orders.filter(o => isCompleted(o.status_name) || isCompleted(o.status_code) || isCompleted(o.payment_status)).forEach(o => all.push({
        id: `prt-${o.id}`,
        source: 'printing',
        refNumber: o.order_number,
        description: `${o.product_type || 'Print'} — ${o.quantity} copies`,
        totalAmount: parseFloat(o.total_price || 0),
        status: o.status_name || o.status_code,
        date: o.created_at,
        raw: o,
      }));
    }

    // Pharmacy — completed
    if (rxRes?.status === 'success') {
      const data = rxRes.data?.data || rxRes.data || [];
      data.filter(o => isCompleted(o.status)).forEach(o => all.push({
        id: `rx-${o.id}`,
        source: 'pharmacy',
        refNumber: o.request_number,
        description: `${o.medication_name} × ${o.quantity}`,
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        date: o.requested_at,
        raw: o,
      }));
    }

    // Compete & Sell — awarded
    if (pubRes?.status === 'success') {
      (pubRes.data || []).filter(o => isCompleted(o.bid_status)).forEach(o => {
        const total = (o.items || []).reduce((s, it) => s + (it.total_birr || 0), 0);
        all.push({
          id: `ptb-${o.id}`,
          source: 'selltender',
          refNumber: o.tender_number,
          description: o.tender_title,
          totalAmount: total,
          status: o.bid_status,
          date: o.created_at,
          raw: o,
        });
      });
    }

    // Compete & Buy — awarded
    if (saleRes?.status === 'success') {
      (saleRes.data || []).filter(o => isCompleted(o.status)).forEach(o => all.push({
        id: `stb-${o.id}`,
        source: 'buytender',
        refNumber: o.reference_number,
        description: o.tender_title || o.item_name,
        totalAmount: parseFloat(o.total_bid_value || 0),
        status: o.status,
        date: o.submitted_at,
        raw: o,
      }));
    }

    all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    setReceipts(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Filter ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.refNumber?.toLowerCase().includes(q) && !r.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [receipts, sourceFilter, search]);

  const totalPaid = receipts.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div className="rec-page">
      <style>{STYLES}</style>
      {viewingReceipt && <ReceiptModal rec={viewingReceipt} onClose={() => setViewingReceipt(null)} />}

      {/* Header */}
      <div className="rec-header">
        <div>
          <h1 className="rec-title">My Receipts</h1>
          <p className="rec-sub">Completed transactions across all services</p>
        </div>
        <button className="rec-btn-secondary" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'rec-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="rec-stats">
          <div className="rec-stat">
            <div className="rec-stat-label">Total Receipts</div>
            <div className="rec-stat-value">{receipts.length}</div>
            <div className="rec-stat-sub">Completed transactions</div>
          </div>
          <div className="rec-stat">
            <div className="rec-stat-label">Total Paid</div>
            <div className="rec-stat-value" style={{fontSize:'1.4rem'}}>{fmtAmt(totalPaid)}</div>
            <div className="rec-stat-sub">All time</div>
          </div>
          <div className="rec-stat">
            <div className="rec-stat-label">Services Used</div>
            <div className="rec-stat-value">{new Set(receipts.map(r => r.source)).size}</div>
            <div className="rec-stat-sub">Departments</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="rec-controls">
        <div className="rec-search">
          <Search size={16} color="#757575" />
          <input placeholder="Search by reference # or description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rec-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="retail">Retail</option>
          <option value="agrirent">AgriRent</option>
          <option value="car">Car Rental</option>
          <option value="printing">Printing</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="selltender">Compete & Sell</option>
          <option value="buytender">Compete & Buy</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rec-empty">
          <Loader2 size={40} className="rec-spin rec-empty-icon" />
          <div style={{fontWeight:600}}>Loading all completed transactions...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rec-empty">
          <CheckCircle size={48} className="rec-empty-icon" />
          <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:'8px'}}>No Receipts Yet</div>
          <div>Completed orders, rentals, and awarded bids will appear here automatically.</div>
        </div>
      ) : (
        <div className="rec-grid">
          {filtered.map(r => <ReceiptCard key={r.id} rec={r} onView={setViewingReceipt} />)}
        </div>
      )}
    </div>
  );
}
