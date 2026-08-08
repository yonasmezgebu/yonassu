import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import carService from '../../services/carService';
import {
  RefreshCw, FileText, ChevronDown, ChevronUp, Clock, CheckCircle,
  XCircle, Loader2, Search, Filter, Printer, Leaf, Car, ShoppingBag,
  Pill, Award, Package, Calendar, CreditCard
} from 'lucide-react';

/* ─── shared CSS ────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .fin-page {
    padding: 32px;
    background: #F8FAFC; /* Softer, cooler light gray */
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #334155;
  }
  @media (max-width: 720px) { .fin-page { padding: 16px; } }

  .fin-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
  .fin-title { font-size: 2.4rem; font-weight: 800; color: #1B5E20; margin: 0; letter-spacing: -0.03em; line-height: 1.1; }
  .fin-sub { font-size: 0.95rem; color: #6B8E23; margin: 6px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Premium Stats Cards */
  .fin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 32px; }
  .fin-stat { 
    background: rgba(255, 255, 255, 0.9); 
    backdrop-filter: blur(10px);
    border: 1px solid rgba(141, 110, 99, 0.2); 
    border-radius: 16px; 
    padding: 24px; 
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .fin-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); }
  .fin-stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
  .fin-stat-value { font-size: 2rem; font-weight: 800; color: #1B5E20; letter-spacing: -0.02em; }
  .fin-stat-sub { font-size: 0.85rem; color: #94a3b8; margin-top: 8px; font-weight: 500; }

  /* Controls */
  .fin-controls { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .fin-search { 
    flex: 1; min-width: 250px; display: flex; align-items: center; gap: 10px; 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: border-color 0.2s ease;
  }
  .fin-search:focus-within { border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.1); }
  .fin-search input { border: none; outline: none; flex: 1; font-size: 0.95rem; font-family: 'Inter', sans-serif; color: #334155; }
  .fin-select { 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; 
    font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #475569; cursor: pointer; font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: border-color 0.2s ease;
  }
  .fin-select:focus { outline: none; border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.1); }

  /* Table / Responsive List */
  .fin-table-wrap { 
    background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 16px; 
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04); overflow: hidden; 
  }
  .fin-table { width: 100%; border-collapse: collapse; }
  .fin-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .fin-table thead th { 
    color: #64748b; padding: 16px 20px; text-align: left; font-size: 0.75rem; 
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; 
  }
  .fin-table thead th.num { text-align: right; }
  
  .fin-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease; }
  .fin-table tbody tr:last-child { border-bottom: none; }
  .fin-table tbody tr:hover { background: #f8fafc; cursor: pointer; }
  .fin-table td { padding: 16px 20px; font-size: 0.95rem; color: #334155; vertical-align: middle; }
  .fin-table td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }

  /* Mobile Responsive Table -> Cards */
  @media (max-width: 850px) {
    .fin-table thead { display: none; }
    .fin-table, .fin-table tbody, .fin-table tr, .fin-table td { display: block; width: 100%; box-sizing: border-box; }
    .fin-table tbody tr { 
      margin-bottom: 16px; background: #fff; border: 1px solid #e2e8f0; 
      border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); 
    }
    .fin-table tbody tr:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
    .fin-table td { 
      padding: 12px 16px; text-align: right; position: relative; border-bottom: 1px solid #f8fafc; 
      display: flex; justify-content: space-between; align-items: center;
    }
    .fin-table td::before { 
      content: attr(data-label); font-size: 0.75rem; font-weight: 700; 
      text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; text-align: left; 
    }
    .fin-table td:last-child { border-bottom: none; justify-content: center; background: #f8fafc; border-radius: 0 0 12px 12px; padding: 8px; }
    .fin-table td.num { text-align: right; }
  }

  /* Expand panel */
  .fin-expand { background: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); }
  .fin-expand-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
  .fin-expand-item { display: flex; flex-direction: column; gap: 6px; }
  .fin-expand-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
  .fin-expand-value { font-size: 1rem; font-weight: 600; color: #1e293b; }

  /* Items table inside expand */
  .fin-items { margin-top: 16px; background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .fin-items table { width: 100%; border-collapse: collapse; }
  .fin-items th { background: #f1f5f9; color: #475569; padding: 12px 16px; text-align: left; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #e2e8f0; }
  .fin-items td { padding: 12px 16px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #f8fafc; }
  .fin-items tr:last-child td { border-bottom: none; }

  /* Badges */
  .fin-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .fin-badge-pending  { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
  .fin-badge-unpaid   { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
  .fin-badge-active   { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
  .fin-badge-paid     { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
  .fin-badge-done     { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
  .fin-badge-rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
  .fin-badge-neutral  { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

  /* Source tag */
  .fin-source { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: 1px solid transparent; }
  .fin-tag-retail    { background: #fff7ed; color: #c2410c; border-color: #ffedd5; }
  .fin-tag-agrirent  { background: #f0fdf4; color: #15803d; border-color: #dcfce7; }
  .fin-tag-car       { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
  .fin-tag-printing  { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
  .fin-tag-pharmacy  { background: #fdf2f8; color: #be185d; border-color: #fce7f3; }
  .fin-tag-buytender { background: #fefce8; color: #a16207; border-color: #fef08a; }
  .fin-tag-selltender { background: #f5f3ff; color: #6d28d9; border-color: #ede9fe; }

  /* Buttons */
  .fin-btn { background: #2E8B57; color: #FFFFFF; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(46, 139, 87, 0.25); }
  .fin-btn:hover:not(:disabled) { background: #246e45; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(46, 139, 87, 0.35); }
  .fin-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
  
  .fin-btn-expand { background: #f1f5f9; border: none; cursor: pointer; padding: 8px; border-radius: 50%; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
  .fin-btn-expand:hover { background: #e2e8f0; color: #1B5E20; transform: scale(1.05); }

  .fin-spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  
  .fin-empty { text-align: center; padding: 80px 20px; color: #64748b; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1; margin-top: 20px; }
  .fin-empty-icon { margin-bottom: 20px; color: #cbd5e1; }
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

const isCompleted = (s) => {
  const u = String(s).toUpperCase();
  return ['COMPLETED', 'DELIVERED', 'PAID', 'AWARDED', 'PICKED_UP', 'DONE'].some(x => u.includes(x));
};

const isRejected = (s) => {
  const u = String(s).toUpperCase();
  return ['REJECTED', 'CANCELLED', 'NOT_SELECTED', 'DISQUALIFIED', 'CANCELED'].some(x => u.includes(x));
};

const StatusBadge = ({ status, paymentStatus }) => {
  const display = paymentStatus || status || '—';
  const cls = isCompleted(display) ? 'fin-badge-paid'
    : isRejected(display) ? 'fin-badge-rejected'
    : ['PENDING', 'PROCESSING', 'AWAITING', 'UNPAID', 'PENDING_APPROVAL', 'IN_QUEUE'].some(x => String(display).toUpperCase().includes(x)) ? 'fin-badge-pending'
    : ['ACTIVE', 'ON_TRIP', 'APPROVED', 'OPEN'].some(x => String(display).toUpperCase().includes(x)) ? 'fin-badge-active'
    : 'fin-badge-neutral';
  return <span className={`fin-badge ${cls}`}>{String(display).replace(/_/g, ' ')}</span>;
};

const SourceTag = ({ source }) => {
  const map = {
    retail:     { label: 'Retail',         icon: <ShoppingBag size={12}/>, cls: 'fin-tag-retail' },
    agrirent:   { label: 'AgriRent',       icon: <Leaf size={12}/>,        cls: 'fin-tag-agrirent' },
    car:        { label: 'Car Rental',     icon: <Car size={12}/>,          cls: 'fin-tag-car' },
    printing:   { label: 'Printing',       icon: <Printer size={12}/>,      cls: 'fin-tag-printing' },
    pharmacy:   { label: 'Pharmacy',       icon: <Pill size={12}/>,         cls: 'fin-tag-pharmacy' },
    buytender:  { label: 'Compete & Buy',  icon: <Award size={12}/>,        cls: 'fin-tag-buytender' },
    selltender: { label: 'Compete & Sell', icon: <Package size={12}/>,      cls: 'fin-tag-selltender' },
  };
  const m = map[source] || { label: source, icon: <FileText size={12}/>, cls: 'fin-tag-neutral' };
  return <span className={`fin-source ${m.cls}`}>{m.icon} {m.label}</span>;
};

/* ─── Expanded Row Details ──────────────────────────────────────────────── */
const ExpandedDetails = ({ inv }) => {
  const { source, raw } = inv;

  // Retail
  if (source === 'retail' && raw.items?.length) {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Invoice #</span><span className="fin-expand-value">{raw.invoice_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Delivery Type</span><span className="fin-expand-value">{raw.delivery_type || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Status</span><span className="fin-expand-value"><StatusBadge status={raw.payment_status} /></span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Order Date</span><span className="fin-expand-value">{fmtDate(raw.created_at)}</span></div>
        </div>
        <div className="fin-items">
          <table><thead><tr><th>Product</th><th>Qty</th><th style={{textAlign:'right'}}>Unit Price</th><th style={{textAlign:'right'}}>Subtotal</th></tr></thead>
            <tbody>{raw.items.map((it, i) => (
              <tr key={i}><td>{it.product_name}</td><td>{it.quantity}</td><td style={{textAlign:'right'}}>{fmtAmt(it.unit_price)}</td><td style={{textAlign:'right'}}>{fmtAmt(it.subtotal)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:'16px',marginTop:'12px',fontSize:'0.9rem',color:'#424242'}}>
          <span>Subtotal: <strong>{fmtAmt(raw.subtotal)}</strong></span>
          <span>Tax (VAT): <strong>{fmtAmt(raw.tax)}</strong></span>
          <span>Delivery: <strong>{fmtAmt(raw.delivery_fee)}</strong></span>
        </div>
      </div>
    );
  }

  // AgriRent
  if (source === 'agrirent') {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Order #</span><span className="fin-expand-value">{raw.order_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Tractor</span><span className="fin-expand-value">{raw.tractor_name || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Rental Period</span><span className="fin-expand-value">{fmtDate(raw.start_date)} → {fmtDate(raw.end_date)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Total Days</span><span className="fin-expand-value">{raw.total_days}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Daily Rate</span><span className="fin-expand-value">{fmtAmt(raw.daily_rate)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Field Location</span><span className="fin-expand-value">{raw.field_location || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Method</span><span className="fin-expand-value">{raw.payment_method || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Ref</span><span className="fin-expand-value">{raw.payment_reference || '—'}</span></div>
        </div>
      </div>
    );
  }

  // Car Rental
  if (source === 'car') {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Order #</span><span className="fin-expand-value">{raw.orderNumber}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Car</span><span className="fin-expand-value">{raw.carName || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Driver</span><span className="fin-expand-value">{raw.driverName || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Pickup → Return</span><span className="fin-expand-value">{fmtDate(raw.pickupDate)} → {fmtDate(raw.returnDate)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Days</span><span className="fin-expand-value">{raw.totalDays}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Daily Rate</span><span className="fin-expand-value">{fmtAmt(raw.dailyRate)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Security Deposit</span><span className="fin-expand-value">{fmtAmt(raw.securityDeposit)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Method</span><span className="fin-expand-value">{raw.paymentMethod || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Ref</span><span className="fin-expand-value">{raw.paymentReference || '—'}</span></div>
        </div>
      </div>
    );
  }

  // Printing
  if (source === 'printing') {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Order #</span><span className="fin-expand-value">{raw.order_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Product Type</span><span className="fin-expand-value">{raw.product_type || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Paper</span><span className="fin-expand-value">{raw.paper_type || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Quantity</span><span className="fin-expand-value">{raw.quantity} copies</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Binding</span><span className="fin-expand-value">{raw.binding_type || 'None'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Due Date</span><span className="fin-expand-value">{fmtDate(raw.due_date)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Method</span><span className="fin-expand-value">{raw.payment_method || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Status</span><span className="fin-expand-value"><StatusBadge status={raw.payment_status} /></span></div>
        </div>
      </div>
    );
  }

  // Pharmacy
  if (source === 'pharmacy') {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Request #</span><span className="fin-expand-value">{raw.request_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Medication</span><span className="fin-expand-value">{raw.medication_name}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Quantity</span><span className="fin-expand-value">{raw.quantity}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Price/Unit</span><span className="fin-expand-value">{fmtAmt(raw.price_per_unit)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Delivery</span><span className="fin-expand-value">{raw.delivery_option || '—'} {raw.delivery_fee > 0 ? `(${fmtAmt(raw.delivery_fee)})` : ''}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Requested At</span><span className="fin-expand-value">{fmtDate(raw.requested_at)}</span></div>
        </div>
      </div>
    );
  }

  // Compete & Sell (public tenders)
  if (source === 'selltender') {
    const itemsTotal = (raw.items || []).reduce((sum, it) => sum + (it.total_birr || 0), 0);
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Tender #</span><span className="fin-expand-value">{raw.tender_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Bidder</span><span className="fin-expand-value">{raw.competitor_name}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Category</span><span className="fin-expand-value">{raw.tender_category}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Delivery Time</span><span className="fin-expand-value">{raw.delivery_time || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Payment Terms</span><span className="fin-expand-value">{raw.payment_terms || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Total Bid Value</span><span className="fin-expand-value" style={{color:'#1B5E20',fontWeight:800}}>{fmtAmt(itemsTotal)}</span></div>
        </div>
        {raw.items?.length > 0 && (
          <div className="fin-items">
            <table><thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th style={{textAlign:'right'}}>Price/unit</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
              <tbody>{raw.items.map((it, i) => (
                <tr key={i}><td>{it.object_type}</td><td>{it.unit}</td><td>{it.tender_quantity}</td>
                  <td style={{textAlign:'right'}}>{it.price_birr?.toLocaleString()}.{String(it.price_cent||0).padStart(2,'0')} ETB</td>
                  <td style={{textAlign:'right'}}>{it.total_birr?.toLocaleString()}.{String(it.total_cent||0).padStart(2,'0')} ETB</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Compete & Buy (direct tenders/bids)
  if (source === 'buytender') {
    return (
      <div className="fin-expand">
        <div className="fin-expand-grid">
          <div className="fin-expand-item"><span className="fin-expand-label">Reference #</span><span className="fin-expand-value">{raw.reference_number}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Bidder</span><span className="fin-expand-value">{raw.bidder_full_name || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Item</span><span className="fin-expand-value">{raw.item_name || '—'}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Price/Unit</span><span className="fin-expand-value">{fmtAmt(raw.bid_price_per_unit)}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Qty Requested</span><span className="fin-expand-value">{raw.quantity_requested}</span></div>
          <div className="fin-expand-item"><span className="fin-expand-label">Deadline</span><span className="fin-expand-value">{fmtDate(raw.deadline)}</span></div>
          {raw.notes && <div className="fin-expand-item" style={{gridColumn:'1/-1'}}><span className="fin-expand-label">Notes</span><span className="fin-expand-value">{raw.notes}</span></div>}
        </div>
      </div>
    );
  }

  return null;
};

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Fetch all services in parallel ─────────────────────────────────── */
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

    // Retail
    if (retRes?.status === 'success') {
      (retRes.data || []).forEach(o => all.push({
        id: `ret-${o.id}`,
        source: 'retail',
        refNumber: o.invoice_number,
        description: (o.items || []).map(i => i.product_name).join(', ').slice(0, 60) || 'Retail Order',
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        paymentStatus: o.payment_status,
        date: o.created_at,
        raw: o,
      }));
    }

    // AgriRent
    if (agrRes?.status === 'success') {
      (agrRes.data || []).forEach(o => all.push({
        id: `agr-${o.id}`,
        source: 'agrirent',
        refNumber: o.order_number,
        description: `${o.tractor_name || 'Tractor'} — ${o.total_days} day(s)`,
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        paymentStatus: o.payment_status,
        date: o.created_at,
        raw: o,
      }));
    }

    // Car Rental (camelCase)
    if (carRes?.status === 'success') {
      (carRes.data || []).forEach(o => all.push({
        id: `car-${o.id}`,
        source: 'car',
        refNumber: o.orderNumber,
        description: `${o.carName || 'Car'} — ${o.totalDays} day(s)`,
        totalAmount: parseFloat(o.totalAmount || 0),
        status: o.status,
        paymentStatus: o.paymentStatus,
        date: o.createdAt,
        raw: o,
      }));
    }

    // Printing (data.orders, amount = total_price)
    if (prtRes?.status === 'success') {
      const orders = prtRes.data?.orders || prtRes.data || [];
      orders.forEach(o => all.push({
        id: `prt-${o.id}`,
        source: 'printing',
        refNumber: o.order_number,
        description: `${o.product_type || 'Print'} — ${o.quantity} copies`,
        totalAmount: parseFloat(o.total_price || 0),
        status: o.status_name || o.status_code || String(o.status_id),
        paymentStatus: o.payment_status,
        date: o.created_at,
        raw: o,
      }));
    }

    // Pharmacy (date = requested_at)
    if (rxRes?.status === 'success') {
      const data = rxRes.data?.data || rxRes.data || [];
      data.forEach(o => all.push({
        id: `rx-${o.id}`,
        source: 'pharmacy',
        refNumber: o.request_number,
        description: `${o.medication_name} × ${o.quantity}`,
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        paymentStatus: null,
        date: o.requested_at,
        raw: o,
      }));
    }

    // Compete & Sell (public tenders) — total = sum of item total_birr
    if (pubRes?.status === 'success') {
      (pubRes.data || []).forEach(o => {
        const total = (o.items || []).reduce((s, it) => s + (it.total_birr || 0), 0);
        all.push({
          id: `ptb-${o.id}`,
          source: 'selltender',
          refNumber: o.tender_number,
          description: o.tender_title,
          totalAmount: total,
          status: o.bid_status,
          paymentStatus: null,
          date: o.created_at,
          raw: o,
        });
      });
    }

    // Compete & Buy (direct sale bids)
    if (saleRes?.status === 'success') {
      (saleRes.data || []).forEach(o => all.push({
        id: `stb-${o.id}`,
        source: 'buytender',
        refNumber: o.reference_number,
        description: o.tender_title || o.item_name,
        totalAmount: parseFloat(o.total_bid_value || 0),
        status: o.status,
        paymentStatus: null,
        date: o.submitted_at,
        raw: o,
      }));
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    setInvoices(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Filter & Search ─────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (sourceFilter !== 'all' && inv.source !== sourceFilter) return false;
      if (statusFilter === 'pending' && (isCompleted(inv.status) || isRejected(inv.status))) return false;
      if (statusFilter === 'paid' && !isCompleted(inv.status)) return false;
      if (statusFilter === 'rejected' && !isRejected(inv.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!inv.refNumber?.toLowerCase().includes(q) && !inv.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, sourceFilter, statusFilter, search]);

  /* ── Stats ───────────────────────────────────────────────────────────── */
  const totalAmt = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const pendingAmt = invoices.filter(i => !isCompleted(i.status) && !isRejected(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const pendingCount = invoices.filter(i => !isCompleted(i.status) && !isRejected(i.status)).length;

  return (
    <div className="fin-page">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="fin-header">
        <div>
          <h1 className="fin-title">My Invoices</h1>
          <p className="fin-sub">All your active orders & bids — across all services</p>
        </div>
        <button className="fin-btn" onClick={fetchAll} disabled={loading}>
          <SegmentedSpinner size={16} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="fin-stats">
          <div className="fin-stat">
            <div className="fin-stat-label">Total Records</div>
            <div className="fin-stat-value">{invoices.length}</div>
            <div className="fin-stat-sub">Across all services</div>
          </div>
          <div className="fin-stat">
            <div className="fin-stat-label">Total Value</div>
            <div className="fin-stat-value" style={{fontSize:'1.4rem'}}>{fmtAmt(totalAmt)}</div>
            <div className="fin-stat-sub">All time</div>
          </div>
          <div className="fin-stat">
            <div className="fin-stat-label">Pending</div>
            <div className="fin-stat-value" style={{color: pendingCount > 0 ? '#E65100' : '#1B5E20'}}>{pendingCount}</div>
            <div className="fin-stat-sub">Awaiting completion</div>
          </div>
          <div className="fin-stat">
            <div className="fin-stat-label">Outstanding</div>
            <div className="fin-stat-value" style={{fontSize:'1.3rem', color: pendingAmt > 0 ? '#E65100' : '#1B5E20'}}>{fmtAmt(pendingAmt)}</div>
            <div className="fin-stat-sub">Not yet paid / completed</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="fin-controls">
        <div className="fin-search">
          <Search size={16} color="#757575" />
          <input placeholder="Search by reference # or description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="fin-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="retail">Retail</option>
          <option value="agrirent">AgriRent</option>
          <option value="car">Car Rental</option>
          <option value="printing">Printing</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="selltender">Compete & Sell</option>
          <option value="buytender">Compete & Buy</option>
        </select>
        <select className="fin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending / Active</option>
          <option value="paid">Completed / Paid</option>
          <option value="rejected">Rejected / Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="fin-empty">
          <SegmentedSpinner size={40} />
          <div style={{fontWeight:600}}>Loading all your records...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="fin-empty">
          <FileText size={48} className="fin-empty-icon" />
          <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:'8px'}}>No Invoices Found</div>
          <div>Your active orders, rental bookings, and bids will appear here once created.</div>
        </div>
      ) : (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Service</th>
                <th>Description</th>
                <th className="num">Amount (ETB)</th>
                <th>Status</th>
                <th className="num">Date</th>
                <th style={{width:40}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <React.Fragment key={inv.id}>
                  <tr onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                    <td style={{fontFamily:'monospace', fontWeight:700, color:'#1B5E20', fontSize:'0.88rem'}}>{inv.refNumber || '—'}</td>
                    <td><SourceTag source={inv.source} /></td>
                    <td style={{maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{inv.description}</td>
                    <td className="num" style={{fontWeight:700}}>{fmtAmt(inv.totalAmount)}</td>
                    <td><StatusBadge status={inv.status} paymentStatus={inv.paymentStatus} /></td>
                    <td className="num" style={{color:'#757575', fontSize:'0.85rem'}}>{fmtDate(inv.date)}</td>
                    <td><button className="fin-btn-expand">{expandedId === inv.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button></td>
                  </tr>
                  {expandedId === inv.id && (
                    <tr>
                      <td colSpan={7} style={{padding:0}}><ExpandedDetails inv={inv} /></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
