import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { amountInWordsBirr } from '../../utils/amountInWords';
import styles from './FinanceReceiptsDashboard.module.css';


const Icon = {
  file: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  barChart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  money: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>,
  bank: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>,
  building: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  trendUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  court: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-4h18v4"/><path d="M19 18v-8"/><path d="M15 18v-8"/><path d="M9 18v-8"/><path d="M5 18v-8"/><path d="M2 10l10-7 10 7H2z"/></svg>,
  users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  clipboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
};

const G = {
  forest: '#059669', sky: '#0891B2', blue: '#2563EB', orange: '#D97706', darkGray: '#374151'
};

const fmt = (n) => 'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return 'ETB ' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return 'ETB ' + (v / 1000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const fmtNum = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Print helper: open in new tab and trigger print ─────────────────────── */
const printInNewTab = (target, doc, company) => {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { window.alert('Pop-up blocked — please allow pop-ups for this site.'); return; }

  const buildInvoice = () => {
    const items = doc.items || [];
    const vatRate = doc.vatStandardRate || 0.15;
    const standardItems = items.filter(it => (it.taxTreatment || 'standard') === 'standard');
    const exemptItems = items.filter(it => it.taxTreatment === 'exempt');
    const zeroRatedItems = items.filter(it => it.taxTreatment === 'zero-rated');
    const hasStandard = standardItems.length > 0;
    const hasExempt = exemptItems.length > 0;
    const hasZeroRated = zeroRatedItems.length > 0;
    const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const vatStandard = standardItems.reduce((s, it) => s + Number(it.vat || 0), 0);
    const vatExempt = exemptItems.reduce((s, it) => s + Number(it.vat || 0), 0);
    const total = subtotal;

    const itemRows = items.map((it) => {
      const treatment = it.taxTreatment || 'standard';
      const tagClass = treatment === 'exempt' ? 'tag-exempt' : treatment === 'zero-rated' ? 'tag-zero' : 'tag-std';
      const tagLabel = treatment === 'exempt' ? 'Exempt' : treatment === 'zero-rated' ? 'Zero-rated' : `Std ${Math.round(vatRate * 100)}%`;
      return `<tr>
        <td>${it.name}</td>
        <td class="tc"><span class="tag ${tagClass}">${tagLabel}</span></td>
        <td class="tr">${it.qty}</td>
        <td class="tr">${fmtNum(it.unitPrice)}</td>
        <td class="tr">${fmtNum(it.vat)}</td>
        <td class="tr">${fmtNum(it.amount)}</td>
      </tr>`;
    }).join('');

    const brandSub = [company.address, company.phone, company.tin ? `TIN: ${company.tin}` : '', company.vatReg ? `VAT Reg. No: ${company.vatReg}` : ''].filter(Boolean).join('  |  ');

    let vatLines = '';
    if (hasStandard) vatLines += `<div class="tr"><span class="tl">VAT ${Math.round(vatRate * 100)}% (Standard-rated items):</span><span class="tv">${fmt(vatStandard)}</span></div>`;
    if (hasExempt) vatLines += `<div class="tr"><span class="tl">VAT Exempt items:</span><span class="tv">${fmt(vatExempt)}</span></div>`;
    if (hasZeroRated) vatLines += `<div class="tr"><span class="tl">VAT Zero-rated items:</span><span class="tv">${fmt(vatZeroRated)}</span></div>`;

    const balanceColor = (doc.balance || 0) > 0.001 ? '#DC2626' : '#16A34A';

    return `
      <div class="brand"><h1>${company.name || 'Company Name'}</h1><p class="sub">${brandSub || 'Address  |  Phone  |  TIN  |  VAT Registration No.'}</p></div>
      <div class="title">SALES INVOICE</div>
      <div class="meta"><div>Invoice No: <span class="dot-w">${doc.invoiceNo || '-'}</span></div><div class="mr">Date: <span class="dot">${fmtDate(doc.date)}</span></div></div>
      <div class="meta"><div>Customer: <span class="dot-w">${doc.customer || 'Walk-in Customer'}</span></div><div class="mr">Customer TIN: <span class="dot">${doc.customerTin || '__________'}</span></div></div>
      <div class="linkage"><span><span class="ll">Sale</span> <span class="li">${doc.saleId || '—'}</span></span><span class="la">→</span><span><span class="ll">Invoice</span> <span class="li">${doc.invoiceNo || '—'}</span></span><span class="la">→</span><span><span class="ll">Payment</span> <span class="li">${doc.paymentId || '—'}</span></span><span class="la">→</span><span><span class="ll">Receipt</span> <span class="li">${doc.receiptNo || '—'}</span></span></div>
      <table class="tbl"><thead><tr><th>Item</th><th>Tax Treatment</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">VAT</th><th class="tr">Amount</th></tr></thead><tbody>${itemRows || '<tr><td colspan="6" class="tc" style="color:#9CA3AF;padding:16px">No line items</td></tr>'}</tbody></table>
      <div class="totals">
        <div class="tr"><span class="tl">Subtotal:</span><span class="tv">${fmt(subtotal)}</span></div>
        ${vatLines}
        <div class="grand"><span class="gl">TOTAL:</span><span class="gv">${fmt(total)}</span></div>
      </div>
      <hr class="hr"/>
      <div class="paybox">
        <div class="pr"><span class="pl">Payment Method:</span><span class="pv">${doc.paymentMethod || 'Cash / Bank / Other'}</span></div>
        <div class="pr" style="margin-top:6px;padding-top:6px;border-top:1px dashed #E5E7EB"><span class="pl">Amount Paid:</span><span class="pv">${fmt(doc.amountPaid)}</span><span class="pv" style="color:#DC2626;margin-left:24px">Balance: ${fmt(doc.balance)}</span></div>
      </div>
      <div class="sigs"><div class="sig"><span class="sigline">${doc.seller || ''}</span><span class="sigcap">Seller (Authorized Signatory)</span></div><div class="sig"><span class="sigline">${doc.customer || ''}</span><span class="sigcap">Customer</span></div></div>`;
  };

  const buildReceipt = () => {
    const items = doc.items || [];
    const totalVat = items.reduce((s, it) => s + Number(it.vat || 0), 0);
    const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const brandSub = [company.address, company.phone, company.tin ? `TIN: ${company.tin}` : ''].filter(Boolean).join('  |  ');
    const balanceColor = (doc.balance || 0) > 0.001 ? '#DC2626' : '#16A34A';

    const itemRows = items.map((it, idx) => `<tr>
      <td class="tc" style="color:#9CA3AF;font-size:12px">${idx + 1}</td>
      <td>${it.name}</td>
      <td class="tr">${it.qty}</td>
      <td class="tr">${fmtNum(it.unitPrice)}</td>
      <td class="tr">${fmtNum(it.vat)}</td>
      <td class="tr">${fmtNum(it.amount)}</td>
    </tr>`).join('');

    const itemsTable = items.length > 0 ? `
      <table class="tbl"><thead><tr><th style="width:36px">#</th><th>Item</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">VAT</th><th class="tr">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="totals">
        <div class="tr"><span class="tl">Subtotal:</span><span class="tv">${fmt(subtotal)}</span></div>
        <div class="tr"><span class="tl">Total VAT:</span><span class="tv">${fmt(totalVat)}</span></div>
        <div class="grand"><span class="gl">TOTAL:</span><span class="gv">${fmt(doc.total)}</span></div>
      </div>` : '';

    return `
      <div class="brand"><h1>${company.name || 'Company Name'}</h1><p class="sub">${brandSub || 'Address  |  Phone  |  TIN'}</p></div>
      <div class="title">RECEIPT</div>
      <div class="meta"><div>Receipt No: <span class="dot-w">${doc.receiptNo || '-'}</span></div><div class="mr">Date: <span class="dot">${fmtDate(doc.date)}</span></div></div>
      <div class="meta"><div>Customer: <span class="dot-w">${doc.customer || 'Walk-in Customer'}</span></div><div class="mr">Invoice No: <span class="dot">${doc.invoiceNo || '-'}</span></div></div>
      <div class="linkage"><span><span class="ll">Sale</span> <span class="li">${doc.saleId || '—'}</span></span><span class="la">→</span><span><span class="ll">Invoice</span> <span class="li">${doc.invoiceNo || '—'}</span></span><span class="la">→</span><span><span class="ll">Payment</span> <span class="li">${doc.paymentId || '—'}</span></span><span class="la">→</span><span><span class="ll">Receipt</span> <span class="li">${doc.receiptNo || '—'}</span></span></div>
      <div class="meta" style="justify-content:flex-start"><div>Description: <span class="dot-w">${doc.description || 'Payment for goods/services'}</span></div></div>
      ${itemsTable}
      <hr class="hr"/>
      <div class="paybox">
        <div class="pr"><span class="pl">Amount Due (per Invoice):</span><span class="pv">${fmt(doc.total)}</span></div>
        ${totalVat > 0 ? `<div class="pr"><span class="pl">Total VAT (from Invoice):</span><span class="pv">${fmt(totalVat)}</span></div>` : ''}
        <div class="pr"><span class="pl">Amount Received:</span><span class="pv" style="color:#16A34A">${fmt(doc.amountPaid)}</span></div>
        <div class="pr"><span class="pl">Balance Remaining:</span><span class="pv" style="color:${balanceColor}">${fmt(doc.balance)}</span></div>
        <div class="pr" style="margin-top:8px;padding-top:8px;border-top:1px dashed #E5E7EB"><span class="pl">Payment Method:</span><span class="pv">${doc.paymentMethod || 'Cash'}</span></div>
      </div>
      <hr class="hr"/>
      <div style="margin-top:8px"><span class="pl" style="font-size:12px">Amount Received (in words):</span><div class="words">${amountInWordsBirr(doc.amountPaid)}</div></div>
      <div class="sigs"><div class="sig"><span class="sigline">${doc.receivedBy || ''}</span><span class="sigcap">Received By (Authorized Signatory)</span></div></div>
      <p class="note">This receipt confirms payment received against Invoice ${doc.invoiceNo || '—'}. It does not constitute a new sale.</p>`;
  };

  const invoiceHTML = target === 'receipt' ? '' : buildInvoice();
  const receiptHTML = target === 'invoice' ? '' : buildReceipt();
  const pageBreak = target === 'both' ? '<div style="page-break-before:always;break-before:page"></div>' : '';

  w.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>${target === 'invoice' ? 'Sales Invoice' : target === 'receipt' ? 'Sales Receipt' : 'Invoice & Receipt'} — ${doc.invoiceNo || ''}</title>
<style>
  @page{size:A4;margin:15mm 18mm}
  *{box-sizing:border-box}
  body{margin:0;padding:24px 32px;font-family:'Segoe UI','Inter',Arial,sans-serif;color:#111827;line-height:1.5;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .brand{text-align:center;margin-bottom:4px}
  .brand h1{font-size:22px;font-weight:800;letter-spacing:.5px;margin:0}
  .sub{font-size:12px;color:#6B7280;margin:4px 0 0}
  .title{text-align:center;font-size:20px;font-weight:800;letter-spacing:4px;margin:16px 0 18px;text-transform:uppercase}
  .meta{display:flex;justify-content:space-between;font-size:13px;margin:4px 0}
  .mr{text-align:right}
  .dot{border-bottom:1px dotted #111827;font-weight:600;padding:0 4px;min-width:80px;display:inline-block}
  .dot-w{border-bottom:1px dotted #111827;font-weight:600;padding:0 4px;min-width:140px;display:inline-block}
  .linkage{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;font-size:11px;color:#6B7280;margin:12px 0 4px;padding:8px 12px;background:#F9FAFB;border-radius:6px;border:1px solid #E5E7EB}
  .la{color:#9CA3AF}.li{font-weight:700;color:#374151}.ll{font-weight:500;color:#6B7280}
  .tbl{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
  .tbl th{border:1px solid #111827;padding:8px 10px;text-align:left;font-weight:700;background:#F9FAFB;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
  .tbl td{border:1px solid #111827;padding:7px 10px}
  .tbl .tr{text-align:right;font-variant-numeric:tabular-nums}
  .tbl .tc{text-align:center}
  .tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600}
  .tag-std{background:#DBEAFE;color:#1E40AF}.tag-exempt{background:#FEF3C7;color:#92400E}.tag-zero{background:#F3F4F6;color:#6B7280}
  .totals{width:100%;font-size:13px;margin:8px 0 4px}
  .tr{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin:3px 0}
  .tl{color:#6B7280;font-weight:600;width:200px;text-align:right}
  .tv{font-weight:600;width:160px;text-align:right;font-variant-numeric:tabular-nums}
  .grand{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin:6px 0;border-top:2px solid #111827;padding-top:8px}
  .gl{font-weight:800;width:200px;text-align:right;font-size:14px}
  .gv{font-weight:800;width:160px;text-align:right;font-variant-numeric:tabular-nums;font-size:14px}
  .hr{border:none;border-top:1px solid #d1d5db;margin:14px 0}
  .paybox{border:1px solid #E5E7EB;border-radius:8px;padding:12px 16px;margin:12px 0;background:#FAFBFC}
  .pr{display:flex;justify-content:space-between;font-size:13px;margin:4px 0}
  .pl{color:#6B7280;font-weight:500}.pv{font-weight:700;font-variant-numeric:tabular-nums}
  .words{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:4px}
  .sigs{display:flex;justify-content:space-between;gap:40px;margin-top:36px;font-size:13px;font-weight:600}
  .sig{flex:1;text-align:center}
  .sigline{display:block;border-bottom:1px solid #111827;margin-top:48px;margin-bottom:4px;padding:0 8px}
  .sigcap{font-size:11px;color:#6B7280;font-weight:500}
  .note{font-size:11px;color:#9CA3AF;font-style:italic;margin-top:8px}
  @media print{.tbl tr{page-break-inside:avoid}}
</style></head><body>
${invoiceHTML}${pageBreak}${receiptHTML}
</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
};

/* ── Shared inline styles for printed documents ──────────────────────────── */
const S = {
  sheet: {
    maxWidth: 750, margin: '0 auto', background: '#fff', padding: '32px 36px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif", color: '#111827', lineHeight: 1.5,
  },
  brand: { textAlign: 'center', marginBottom: 4 },
  brandName: { fontSize: 22, fontWeight: 800, letterSpacing: 0.5, margin: 0, color: '#111827' },
  brandSub: { fontSize: 12, color: '#6B7280', margin: '4px 0 0', letterSpacing: 0.02 },
  title: { textAlign: 'center', fontSize: 20, fontWeight: 800, letterSpacing: 4, margin: '16px 0 18px', color: '#111827', textTransform: 'uppercase' },
  metaRow: { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, margin: '4px 0' },
  metaLeft: {},
  metaRight: { textAlign: 'right' },
  fieldLabel: { color: '#6B7280', fontWeight: 600 },
  dotted: { borderBottom: '1px dotted #111827', fontWeight: 600, padding: '0 4px', minWidth: 80, display: 'inline-block' },
  dottedWide: { borderBottom: '1px dotted #111827', fontWeight: 600, padding: '0 4px', minWidth: 140, display: 'inline-block' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: 13 },
  th: { border: '1px solid #111827', padding: '8px 10px', textAlign: 'left', fontWeight: 700, background: '#F9FAFB', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.03 },
  thR: { border: '1px solid #111827', padding: '8px 10px', textAlign: 'right', fontWeight: 700, background: '#F9FAFB', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.03 },
  td: { border: '1px solid #111827', padding: '7px 10px' },
  tdR: { border: '1px solid #111827', padding: '7px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  tdC: { border: '1px solid #111827', padding: '7px 10px', textAlign: 'center' },
  totals: { width: '100%', fontSize: 13, margin: '8px 0 4px' },
  totalRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, margin: '3px 0' },
  totalLabel: { color: '#6B7280', fontWeight: 600, width: 200, textAlign: 'right' },
  totalVal: { fontWeight: 600, width: 160, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  grandRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, margin: '6px 0', borderTop: '2px solid #111827', paddingTop: 8 },
  grandLabel: { fontWeight: 800, width: 200, textAlign: 'right', fontSize: 14 },
  grandVal: { fontWeight: 800, width: 160, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 },
  line: { border: 'none', borderTop: '1px solid #d1d5db', margin: '14px 0' },
  sigRow: { display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 36, fontSize: 13, fontWeight: 600 },
  sigBlock: { flex: 1, textAlign: 'center' },
  sigLine: { display: 'block', borderBottom: '1px solid #111827', marginTop: 48, marginBottom: 4, padding: '0 8px' },
  sigCaption: { fontSize: 11, color: '#6B7280', fontWeight: 500 },
  words: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 },
  linkageRow: { display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, color: '#6B7280', margin: '12px 0 4px', padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' },
  linkageArrow: { color: '#9CA3AF', fontWeight: 400 },
  linkageId: { fontWeight: 700, color: '#374151' },
  linkageLabel: { fontWeight: 500, color: '#6B7280' },
  paymentBox: { border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', margin: '12px 0', background: '#FAFBFC' },
  paymentRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' },
  paymentLabel: { color: '#6B7280', fontWeight: 500 },
  paymentVal: { fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  sectionNote: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', marginTop: 8 },
  vatTag: { display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 4 },
  vatStandard: { background: '#DBEAFE', color: '#1E40AF' },
  vatExempt: { background: '#FEF3C7', color: '#92400E' },
  vatZero: { background: '#F3F4F6', color: '#6B7280' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SALES INVOICE
   Legal, tax-bearing document with per-item tax treatment breakdown.
   ═══════════════════════════════════════════════════════════════════════════ */
const SalesInvoiceForm = ({ doc, company }) => {
  const items = doc.items || [];
  const vatRate = doc.vatStandardRate || 0.15;

  const standardItems = items.filter(it => (it.taxTreatment || 'standard') === 'standard');
  const exemptItems = items.filter(it => it.taxTreatment === 'exempt');
  const zeroRatedItems = items.filter(it => it.taxTreatment === 'zero-rated');

  const hasStandard = standardItems.length > 0;
  const hasExempt = exemptItems.length > 0;
  const hasZeroRated = zeroRatedItems.length > 0;

  const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const vatStandard = standardItems.reduce((s, it) => s + Number(it.vat || 0), 0);
  const vatExempt = exemptItems.reduce((s, it) => s + Number(it.vat || 0), 0);
  const vatZeroRated = zeroRatedItems.reduce((s, it) => s + Number(it.vat || 0), 0);
  const total = subtotal;

  return (
    <div className="invoice-sheet print-sheet" style={S.sheet}>
      {/* ── Company Header ── */}
      <div style={S.brand}>
        <h2 style={S.brandName}>{company.name || 'Company Name'}</h2>
        <p style={S.brandSub}>
          {[company.address, company.phone, company.tin ? `TIN: ${company.tin}` : '', company.vatReg ? `VAT Reg. No: ${company.vatReg}` : '']
            .filter(Boolean).join('  |  ') || 'Address  |  Phone  |  TIN  |  VAT Registration No.'}
        </p>
      </div>

      <div style={S.title}>SALES INVOICE</div>

      {/* ── Invoice Meta ── */}
      <div style={S.metaRow}>
        <div style={S.metaLeft}>Invoice No: <span style={S.dottedWide}>{doc.invoiceNo || '-'}</span></div>
        <div style={S.metaRight}>Date: <span style={S.dotted}>{fmtDate(doc.date)}</span></div>
      </div>
      <div style={S.metaRow}>
        <div style={S.metaLeft}>Customer: <span style={S.dottedWide}>{doc.customer || 'Walk-in Customer'}</span></div>
        <div style={S.metaRight}>Customer TIN: <span style={S.dotted}>{doc.customerTin || '__________'}</span></div>
      </div>

      {/* ── Linkage Chain ── */}
      <div style={S.linkageRow}>
        <span><span style={S.linkageLabel}>Sale</span> <span style={S.linkageId}>{doc.saleId || '—'}</span></span>
        <span style={S.linkageArrow}>→</span>
        <span><span style={S.linkageLabel}>Invoice</span> <span style={S.linkageId}>{doc.invoiceNo || '—'}</span></span>
        <span style={S.linkageArrow}>→</span>
        <span><span style={S.linkageLabel}>Payment</span> <span style={S.linkageId}>{doc.paymentId || '—'}</span></span>
        <span style={S.linkageArrow}>→</span>
        <span><span style={S.linkageLabel}>Receipt</span> <span style={S.linkageId}>{doc.receiptNo || '—'}</span></span>
      </div>

      {/* ── Line Items Table ── */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: 36 }}>#</th>
            <th style={S.th}>Item</th>
            <th style={S.th}>Tax Treatment</th>
            <th style={S.thR}>Qty</th>
            <th style={S.thR}>Unit Price</th>
            <th style={S.thR}>VAT</th>
            <th style={S.thR}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const treatment = it.taxTreatment || 'standard';
            const tagStyle = treatment === 'exempt' ? S.vatExempt : treatment === 'zero-rated' ? S.vatZero : S.vatStandard;
            const tagLabel = treatment === 'exempt' ? 'Exempt' : treatment === 'zero-rated' ? 'Zero-rated' : `Std ${Math.round(vatRate * 100)}%`;
            return (
              <tr key={i}>
                <td style={{ ...S.tdC, color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                <td style={S.td}>{it.name}</td>
                <td style={{ ...S.tdC, fontSize: 11 }}>
                  <span style={{ ...S.vatTag, ...tagStyle }}>{tagLabel}</span>
                </td>
                <td style={S.tdR}>{it.qty}</td>
                <td style={S.tdR}>{fmtNum(it.unitPrice)}</td>
                <td style={S.tdR}>{fmtNum(it.vat)}</td>
                <td style={S.tdR}>{fmtNum(it.amount)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#9CA3AF', padding: 16 }}>No line items</td></tr>
          )}
        </tbody>
      </table>

      {/* ── VAT Breakdown — only show applicable treatments ── */}
      <div style={S.totals}>
        <div style={S.totalRow}>
          <span style={S.totalLabel}>Subtotal:</span>
          <span style={S.totalVal}>{fmt(subtotal)}</span>
        </div>

        {hasStandard && (
          <div style={S.totalRow}>
            <span style={S.totalLabel}>VAT {Math.round(vatRate * 100)}% (Standard-rated items):</span>
            <span style={S.totalVal}>{fmt(vatStandard)}</span>
          </div>
        )}
        {hasExempt && (
          <div style={S.totalRow}>
            <span style={S.totalLabel}>VAT Exempt items:</span>
            <span style={S.totalVal}>{fmt(vatExempt)}</span>
          </div>
        )}
        {hasZeroRated && (
          <div style={S.totalRow}>
            <span style={S.totalLabel}>VAT Zero-rated items:</span>
            <span style={S.totalVal}>{fmt(vatZeroRated)}</span>
          </div>
        )}

        <div style={S.grandRow}>
          <span style={S.grandLabel}>TOTAL:</span>
          <span style={S.grandVal}>{fmt(total)}</span>
        </div>
      </div>

      {/* ── Payment Summary ── */}
      <hr style={S.line} />
      <div style={S.paymentBox}>
        <div style={S.paymentRow}>
          <span style={S.paymentLabel}>Payment Method:</span>
          <span style={S.paymentVal}>{doc.paymentMethod || 'Cash / Bank / Other'}</span>
        </div>
        <div style={{ ...S.paymentRow, marginTop: 6, paddingTop: 6, borderTop: '1px dashed #E5E7EB' }}>
          <span style={S.paymentLabel}>Amount Paid:</span>
          <span style={S.paymentVal}>{fmt(doc.amountPaid)}</span>
          <span style={{ ...S.paymentVal, color: '#DC2626', marginLeft: 24 }}>Balance: {fmt(doc.balance)}</span>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={S.sigRow}>
        <div style={S.sigBlock}>
          <span style={S.sigLine}>{doc.seller || ''}</span>
          <span style={S.sigCaption}>Seller (Authorized Signatory)</span>
        </div>
        <div style={S.sigBlock}>
          <span style={S.sigLine}>{doc.customer || ''}</span>
          <span style={S.sigCaption}>Customer</span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SALES RECEIPT
   Proof of payment received. Does NOT recalculate the sale — confirms
   money received against an existing invoice.
   ═══════════════════════════════════════════════════════════════════════════ */
const SalesReceiptForm = ({ doc, company }) => {
  const items = doc.items || [];
  const totalVat = items.reduce((s, it) => s + Number(it.vat || 0), 0);

  return (
  <div className="receipt-sheet print-sheet" style={S.sheet}>
    {/* ── Company Header ── */}
    <div style={S.brand}>
      <h2 style={S.brandName}>{company.name || 'Company Name'}</h2>
      <p style={S.brandSub}>
        {[company.address, company.phone, company.tin ? `TIN: ${company.tin}` : '']
          .filter(Boolean).join('  |  ') || 'Address  |  Phone  |  TIN'}
      </p>
    </div>

    <div style={S.title}>RECEIPT</div>

    {/* ── Receipt Meta ── */}
    <div style={S.metaRow}>
      <div style={S.metaLeft}>Receipt No: <span style={S.dottedWide}>{doc.receiptNo || '-'}</span></div>
      <div style={S.metaRight}>Date: <span style={S.dotted}>{fmtDate(doc.date)}</span></div>
    </div>
    <div style={S.metaRow}>
      <div style={S.metaLeft}>Customer: <span style={S.dottedWide}>{doc.customer || 'Walk-in Customer'}</span></div>
      <div style={S.metaRight}>Invoice No: <span style={S.dotted}>{doc.invoiceNo || '-'}</span></div>
    </div>

    {/* ── Linkage Chain ── */}
    <div style={S.linkageRow}>
      <span><span style={S.linkageLabel}>Sale</span> <span style={S.linkageId}>{doc.saleId || '—'}</span></span>
      <span style={S.linkageArrow}>→</span>
      <span><span style={S.linkageLabel}>Invoice</span> <span style={S.linkageId}>{doc.invoiceNo || '—'}</span></span>
      <span style={S.linkageArrow}>→</span>
      <span><span style={S.linkageLabel}>Payment</span> <span style={S.linkageId}>{doc.paymentId || '—'}</span></span>
      <span style={S.linkageArrow}>→</span>
      <span><span style={S.linkageLabel}>Receipt</span> <span style={S.linkageId}>{doc.receiptNo || '—'}</span></span>
    </div>

    {/* ── Description ── */}
    <div style={{ ...S.metaRow, justifyContent: 'flex-start' }}>
      <div>Description: <span style={S.dottedWide}>{doc.description || 'Payment for goods/services'}</span></div>
    </div>

    {/* ── Line Items (from Invoice) ── */}
    {items.length > 0 && (
      <>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 36 }}>#</th>
              <th style={S.th}>Item</th>
              <th style={S.thR}>Qty</th>
              <th style={S.thR}>Unit Price</th>
              <th style={S.thR}>VAT</th>
              <th style={S.thR}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...S.tdC, color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                <td style={S.td}>{it.name}</td>
                <td style={S.tdR}>{it.qty}</td>
                <td style={S.tdR}>{fmtNum(it.unitPrice)}</td>
                <td style={S.tdR}>{fmtNum(it.vat)}</td>
                <td style={S.tdR}>{fmtNum(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={S.totals}>
          <div style={S.totalRow}>
            <span style={S.totalLabel}>Subtotal:</span>
            <span style={S.totalVal}>{fmt(items.reduce((s, it) => s + Number(it.amount || 0), 0))}</span>
          </div>
          <div style={S.totalRow}>
            <span style={S.totalLabel}>Total VAT:</span>
            <span style={S.totalVal}>{fmt(totalVat)}</span>
          </div>
          <div style={S.grandRow}>
            <span style={S.grandLabel}>TOTAL:</span>
            <span style={S.grandVal}>{fmt(doc.total)}</span>
          </div>
        </div>
      </>
    )}

      {/* ── Payment Confirmation ── */}
      <hr style={S.line} />
      <div style={S.paymentBox}>
        <div style={S.paymentRow}>
          <span style={S.paymentLabel}>Amount Due (per Invoice):</span>
          <span style={S.paymentVal}>{fmt(doc.total)}</span>
        </div>
        {totalVat > 0 && (
          <div style={S.paymentRow}>
            <span style={S.paymentLabel}>Total VAT (from Invoice):</span>
            <span style={S.paymentVal}>{fmt(totalVat)}</span>
          </div>
        )}
        <div style={S.paymentRow}>
          <span style={S.paymentLabel}>Amount Received:</span>
          <span style={{ ...S.paymentVal, color: '#16A34A' }}>{fmt(doc.amountPaid)}</span>
        </div>
        <div style={S.paymentRow}>
          <span style={S.paymentLabel}>Balance Remaining:</span>
          <span style={{ ...S.paymentVal, color: (doc.balance || 0) > 0.001 ? '#DC2626' : '#16A34A' }}>
            {fmt(doc.balance)}
          </span>
        </div>
      <div style={{ ...S.paymentRow, marginTop: 8, paddingTop: 8, borderTop: '1px dashed #E5E7EB' }}>
        <span style={S.paymentLabel}>Payment Method:</span>
        <span style={S.paymentVal}>{doc.paymentMethod || 'Cash'}</span>
      </div>
    </div>

    <hr style={S.line} />

    {/* ── Amount in Words ── */}
    <div style={{ marginTop: 8 }}>
      <span style={{ ...S.paymentLabel, fontSize: 12 }}>Amount Received (in words):</span>
      <div style={{ ...S.words, marginTop: 4 }}>{amountInWordsBirr(doc.amountPaid)}</div>
    </div>

    {/* ── Received By ── */}
    <div style={S.sigRow}>
      <div style={S.sigBlock}>
        <span style={S.sigLine}>{doc.receivedBy || ''}</span>
        <span style={S.sigCaption}>Received By (Authorized Signatory)</span>
      </div>
    </div>

    <div style={S.sectionNote}>
      This receipt confirms payment received against Invoice {doc.invoiceNo || '—'}. It does not constitute a new sale.
    </div>
  </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENT MODAL
   Tabs: Sales Invoice / Sales Receipt + Print buttons
   ═══════════════════════════════════════════════════════════════════════════ */
const DocumentModal = ({ doc, company, onClose }) => {
  const [tab, setTab] = useState('invoice');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{doc.sourceLabel} · {doc.invoiceNo}</h3>
            <p className={styles.modalSub}>Sale → Invoice → Payment → Receipt (linked end-to-end)</p>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.tabBtn} onClick={() => setTab('invoice')} style={tab === 'invoice' ? { background: '#2563EB', color: '#fff', borderColor: '#2563EB' } : {}}>
              Sales Invoice
            </button>
            <button className={styles.tabBtn} onClick={() => setTab('receipt')} style={tab === 'receipt' ? { background: '#16A34A', color: '#fff', borderColor: '#16A34A' } : {}}>
              Sales Receipt
            </button>
            <span style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />
            <button className={styles.printBtn} onClick={() => printInNewTab('invoice', doc, company)} title="Print Sales Invoice only">
              Print Invoice
            </button>
            <button className={styles.printBtnGreen} onClick={() => printInNewTab('receipt', doc, company)} title="Print Sales Receipt only">
              Print Receipt
            </button>
            <button className={styles.printBtnBoth} onClick={() => printInNewTab('both', doc, company)} title="Print both Invoice and Receipt">
              Print Both
            </button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.printArea}>
            <SalesInvoiceForm doc={doc} company={company} />
          </div>
          <div className={styles.printArea} style={{ marginTop: 20 }}>
            <SalesReceiptForm doc={doc} company={company} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

const FinanceReceiptsDashboard = () => {
  const [agg, setAgg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [vatReport, setVatReport] = useState(null);
  const [vatLoading, setVatLoading] = useState(false);
  const [company, setCompany] = useState({ name: '', address: '', phone: '', tin: '', vatReg: '' });
  const [companyDraft, setCompanyDraft] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [page, setPage] = useState(1);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.includes('receipts') ? 'receipts' : 'receivable');
  const [vatPeriod, setVatPeriod] = useState('year');
  const [vatDateRange, setVatDateRange] = useState({ from: '', to: '' });
  const vatPeriodRef = useRef(vatPeriod);
  const vatDateRangeRef = useRef(vatDateRange);

  useEffect(() => {
    setActiveTab(location.pathname.includes('receipts') ? 'receipts' : 'receivable');
    setPage(1);
  }, [location.pathname]);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const [aggRes, docRes, compRes] = await Promise.allSettled([
        api.get('/finance/receipts-dashboard'),
        api.get('/finance/receipts-dashboard/documents'),
        api.get('/finance/company-info')
      ]);
      if (aggRes.status === 'fulfilled') setAgg(aggRes.value?.data || null);
      if (docRes.status === 'fulfilled') setDocs(docRes.value?.data?.documents || []);
      if (compRes.status === 'fulfilled') {
        const c = compRes.value?.data?.company || {};
        setCompany(c);
        setCompanyDraft(c);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard');
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fetchVatReport = async (period, from, to) => {
    setVatLoading(true);
    try {
      const params = {};
      if (from && to) {
        params.from = from;
        params.to = to + ' 23:59:59';
      } else {
        params.period = period || 'year';
      }
      const res = await api.get('/finance/vat-profit-report', { params });
      setVatReport(res?.data || null);
    } catch (err) {
      console.error('VAT report load failed:', err);
      setVatReport(null);
    }
    setVatLoading(false);
  };

  // Load VAT report whenever user opens the tab, and also on first mount
  useEffect(() => {
    if (activeTab === 'vatprofit') {
      fetchVatReport(vatPeriod, vatDateRange.from, vatDateRange.to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Also load on first render if the tab is already vatprofit
  useEffect(() => {
    fetchVatReport('year', '', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodClick = (key) => {
    setVatPeriod(key);
    setVatDateRange({ from: '', to: '' });
    vatPeriodRef.current = key;
    vatDateRangeRef.current = { from: '', to: '' };
    fetchVatReport(key, '', '');
  };

  const handleDateFromChange = (val) => {
    const newRange = { ...vatDateRange, from: val };
    setVatDateRange(newRange);
    vatDateRangeRef.current = newRange;
    setVatPeriod('custom');
    vatPeriodRef.current = 'custom';
  };

  const handleDateToChange = (val) => {
    const newRange = { ...vatDateRange, to: val };
    setVatDateRange(newRange);
    vatDateRangeRef.current = newRange;
    setVatPeriod('custom');
    vatPeriodRef.current = 'custom';
  };

  const handleRefresh = () => {
    const p = vatPeriodRef.current;
    const r = vatDateRangeRef.current;
    fetchVatReport(p, r.from, r.to);
  };

  const saveCompany = async () => {
    setSavingCompany(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const res = await api.put('/finance/company-info', companyDraft);
      const c = res?.data?.company || res?.company || {};
      setCompany(c);
      setCompanyDraft(c);
      setSaveMsg('✓ Company info saved successfully');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (err) {
      setSaveError('✗ ' + (err?.message || 'Failed to save company info'));
      setTimeout(() => setSaveError(''), 5000);
    }
    setSavingCompany(false);
  };

  const receivableDocs = docs.filter((d) => d.balance < -0.001);
  const paidDocs = docs.filter((d) => d.balance >= -0.001);
  const activeDocs = activeTab === 'receivable' ? receivableDocs : paidDocs;

  const totalPages = Math.max(1, Math.ceil(activeDocs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedDocs = activeDocs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const receivableValue = receivableDocs.reduce((s, d) => s + Math.abs(d.balance), 0);
  const paidValue = paidDocs.reduce((s, d) => s + d.total, 0);
  const owedTotal = receivableDocs.reduce((s, d) => s + Math.abs(d.balance), 0);
  const vatTotal = paidDocs.reduce((s, d) => s + (d.vat || 0), 0);

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>
            Invoices & Receipts <span className={styles.welcomeEmoji}>🧾</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Auto-generated: Order → Invoice → Payment → Receipt · All modules + 2 tenders · No manual form filling
          </p>
        </div>
        <button onClick={load} className={styles.syncBtn} disabled={refreshing}>
          {refreshing && <SegmentedSpinner size={16} />}
          <span>Sync</span>
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${activeTab === 'receivable' ? styles.kpiCardActive : ''}`}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Receivable Invoices</span>
            <span className={styles.kpiIcon} style={{ background: '#FEF3C7' }}><Icon.file /></span>
          </div>
          <div className={styles.kpiValue} style={{ color: '#B45309' }}>{receivableDocs.length}</div>
          <div className={styles.kpiMeta}>Unpaid / outstanding orders</div>
          <div className={styles.kpiSub}>Awaiting full payment</div>
        </div>

        <div className={`${styles.kpiCard} ${activeTab === 'receipts' ? styles.kpiCardActive : ''}`}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Receipts (Paid)</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-success-bg)' }}><Icon.check /></span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.forest }}>{paidDocs.length}</div>
          <div className={styles.kpiMeta}>Fully paid orders</div>
          <div className={styles.kpiSub}>Invoice → Payment confirmed</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCardHero}`}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Outstanding Balance</span>
            <span className={styles.kpiIconHero}><Icon.money /></span>
          </div>
          <div className={styles.kpiHeroValue}>{fmt(receivableValue)}</div>
          <div className={styles.kpiHeroMeta}>
            <span>{fmtShort(receivableValue)}</span>
            <span>{receivableDocs.length} invoices</span>
          </div>
          <div className={styles.kpiHeroFoot}>Total unpaid across all modules</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Total Value Collected</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-info-bg)' }}><Icon.bank /></span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.blue }}>{fmt(paidValue)}</div>
          <div className={styles.kpiMeta}>Revenue received to date</div>
          <div className={styles.kpiSub}>{paidDocs.length} confirmed receipts</div>
        </div>
      </div>

      {/* ── ROW 2: TABS ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'receivable' ? styles.tabBtnActive : ''}`}
          onClick={() => { setActiveTab('receivable'); setPage(1); }}
        >
          <Icon.file /> Receivable Invoices
          <span className={styles.tabBadge} style={{ background: '#FEF3C7', color: '#92400E' }}>{receivableDocs.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'receipts' ? styles.tabBtnActive : ''}`}
          onClick={() => { setActiveTab('receipts'); setPage(1); }}
        >
          <Icon.check /> Receipts (Paid)
          <span className={styles.tabBadge} style={{ background: '#DCFCE7', color: '#166534' }}>{paidDocs.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'vatprofit' ? styles.tabBtnActive : ''}`}
          onClick={() => { setActiveTab('vatprofit'); setPage(1); }}
        >
          <Icon.barChart /> VAT & Profit
        </button>
      </div>

      {/* ── ROW 3: COMPANY PROFILE ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}><Icon.building /></span>
          <h3 className={styles.cardTitle}>Company Profile (Invoice / Receipt header)</h3>
          <span className={styles.cardSub}>Saved to settings — used on all documents</span>
        </div>
        <div className={styles.companyGrid}>
          {[
            { k: 'name', label: 'Company Name' },
            { k: 'address', label: 'Address' },
            { k: 'phone', label: 'Phone' },
            { k: 'tin', label: 'TIN' },
            { k: 'vatReg', label: 'VAT Registration No.' }
          ].map((f) => (
            <div key={f.k} className={styles.companyField}>
              <label className={styles.companyLabel}>{f.label}</label>
              <input
                className={styles.companyInput}
                value={companyDraft?.[f.k] || ''}
                onChange={(e) => setCompanyDraft((d) => ({ ...d, [f.k]: e.target.value }))}
              />
            </div>
          ))}
          <div className={styles.companyField} style={{ alignSelf: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className={styles.saveBtn} onClick={saveCompany} disabled={savingCompany}>
                {savingCompany ? 'Saving…' : 'Save'}
              </button>
              {saveMsg && (
                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {saveMsg}
                </span>
              )}
              {saveError && (
                <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {saveError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: VAT & PROFIT (when tab active) ── */}
      {activeTab === 'vatprofit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Period Filter Bar */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitleIcon}><Icon.barChart /></span>
              <h3 className={styles.cardTitle}>VAT & Profit Report</h3>
              <span className={styles.cardSub}>Live data — Output VAT from invoices · Input VAT from purchases/expenses · HR costs from payroll · Profit = Revenue - Cost - HR</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 20px', flexWrap: 'wrap' }}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'year', label: 'This Year' },
                { key: 'all', label: 'All Time' }
              ].map(p => (
                <button key={p.key} onClick={() => handlePeriodClick(p.key)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: vatPeriod === p.key && !vatDateRange.from ? '#2563EB' : '#F3F4F6',
                    color: vatPeriod === p.key && !vatDateRange.from ? '#fff' : '#374151' }}>
                  {p.label}
                </button>
              ))}
              <span style={{ color: '#D1D5DB', margin: '0 4px' }}>|</span>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Custom:</label>
              <input type="date" value={vatDateRange.from} onChange={(e) => handleDateFromChange(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12 }} />
              <span style={{ color: '#9CA3AF' }}>-</span>
              <input type="date" value={vatDateRange.to} onChange={(e) => handleDateToChange(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12 }} />
              <button onClick={handleRefresh} disabled={vatLoading}
                style={{ padding: '5px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: vatLoading ? 0.6 : 1 }}>
                {vatLoading ? 'Loading...' : 'Refresh'}
              </button>
              {vatReport?.period && (
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>
                  {vatReport.period.from} to {vatReport.period.to} · {vatReport.summary?.invoiceCount || 0} invoices
                </span>
              )}
            </div>
          </div>

          {/* Spinner: first load (no data yet) */}
          {vatLoading && !vatReport && (
            <div className={styles.card} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#9CA3AF' }}>
              <SegmentedSpinner size={28} />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>Loading live VAT &amp; Profit data…</div>
            </div>
          )}

          {/* Subtle refresh overlay while data is already showing */}
          {vatLoading && vatReport && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: '#6B7280', fontSize: '0.8125rem' }}>
              <SegmentedSpinner size={14} /> Refreshing…
            </div>
          )}

          {/* No data */}
          {!vatLoading && !vatReport && (
            <div className={styles.card} style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>No data for this period</div>
              <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Try selecting a different time range or click Refresh.</div>
            </div>
          )}

          {vatReport && (() => {
            const s = vatReport.summary || {};
            const hr = s.hrCosts || {};
          return (<>
            {/* ── VAT Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: 12, padding: '16px 18px', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>Output VAT (Sales)</span><span><Icon.trendUp /></span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{fmt(s.outputVat)}</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>VAT collected from customers</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', borderRadius: 12, padding: '16px 18px', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>Input VAT (Purchases)</span><span><Icon.trendDown /></span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{fmt(s.inputVat)}</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>PO: {fmt(s.inputVatFromPurchases)} + Exp: {fmt(s.inputVatFromExpenses)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', borderRadius: 12, padding: '16px 18px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E3A8A' }}>Payable VAT</span><span><Icon.court /></span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.payableVat >= 0 ? '#2563EB' : '#DC2626' }}>{s.payableVat >= 0 ? '+' : ''}{fmt(s.payableVat)}</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{s.payableVat >= 0 ? 'Amount payable to govt' : 'Refund due from govt'}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: 12, padding: '16px 18px', border: '1px solid #FDE68A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Net Profit</span><span><Icon.money /></span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.netProfit >= 0 ? '#059669' : '#DC2626' }}>{fmt(s.netProfit)}</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>After COGS + Expenses + HR</div>
              </div>
            </div>

            {/* ── P&L Statement Cards ── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitleIcon}><Icon.clipboard /></span>
                <h3 className={styles.cardTitle}>Profit & Loss Statement</h3>
                <span className={styles.cardSub}>Revenue - COGS - Expenses - HR = Net Profit</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Revenue (Sales)', value: s.totalRevenue, color: '#059669', indent: 0 },
                  { label: 'Cost of Goods Sold (COGS)', value: -s.totalCogs, color: '#DC2626', indent: 0 },
                  { label: 'Gross Profit', value: s.grossProfit, color: '#2563EB', indent: 0, bold: true },
                  { label: 'Operating Expenses', value: -s.totalExpenses, color: '#DC2626', indent: 16 },
                  { label: 'Operating Profit', value: s.operatingProfit, color: '#2563EB', indent: 0, bold: true },
                  { label: `HR Costs (${hr.employeeCount || 0} employees, ${fmt(hr.monthlySalaryTotal)}/mo)`, value: -hr.netPay, color: '#DC2626', indent: 16 },
                  { label: '    Base Salaries', value: hr.grossPay, color: '#9CA3AF', indent: 32, small: true },
                  { label: '    Deductions (tax/pension)', value: -hr.deductions, color: '#9CA3AF', indent: 32, small: true },
                  { label: '    Overtime Pay', value: hr.overtime, color: '#9CA3AF', indent: 32, small: true },
                  { label: 'NET PROFIT', value: s.netProfit, color: s.netProfit >= 0 ? '#059669' : '#DC2626', indent: 0, bold: true, large: true },
                  { label: 'Profit Margin', value: s.margin + '%', color: '#374151', indent: 0, isText: true }
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: row.indent,
                    padding: `${row.large ? '10' : '4'}px ${row.large ? '12' : '8'}px`, marginLeft: row.indent,
                    borderRadius: row.bold ? 6 : 0, background: row.bold ? '#F9FAFB' : 'transparent',
                    borderTop: row.bold && row.large ? '2px solid #D1D5DB' : 'none' }}>
                    <span style={{ fontSize: row.small ? 11 : row.large ? 14 : 13, fontWeight: row.bold ? 700 : 400, color: row.color }}>{row.label}</span>
                    <span style={{ fontSize: row.large ? 16 : row.small ? 11 : 13, fontWeight: row.bold ? 800 : 400, color: row.color, fontFamily: 'monospace' }}>
                      {row.isText ? row.value : (row.value >= 0 ? '+' : '') + fmt(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── HR Breakdown ── */}
            {hr.employeeCount > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitleIcon}><Icon.users /></span>
                  <h3 className={styles.cardTitle}>HR Costs ({hr.employeeCount} Active Employees)</h3>
                  <span className={styles.cardSub}>Monthly salary total: {fmt(hr.monthlySalaryTotal)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, padding: '12px 20px' }}>
                  {[
                    { label: 'Gross Pay', value: hr.grossPay, color: '#2563EB', bg: '#EFF6FF' },
                    { label: 'Net Pay', value: hr.netPay, color: '#059669', bg: '#ECFDF5' },
                    { label: 'Deductions', value: hr.deductions, color: '#DC2626', bg: '#FEF2F2' },
                    { label: 'Overtime', value: hr.overtime, color: '#D97706', bg: '#FFFBEB' }
                  ].map((c, i) => (
                    <div key={i} style={{ background: c.bg, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: c.color, marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{fmt(c.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Breakdown by Department ── */}
            {vatReport.bySource && vatReport.bySource.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitleIcon}><Icon.barChart /></span>
                  <h3 className={styles.cardTitle}>Revenue by Department</h3>
                </div>
                <div className={styles.table}>
                  <div className={styles.tHead} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                    <span>Department</span>
                    <span style={{ textAlign: 'right' }}>Revenue</span>
                    <span style={{ textAlign: 'right' }}>COGS</span>
                    <span style={{ textAlign: 'right' }}>Profit</span>
                    <span style={{ textAlign: 'right' }}>Margin</span>
                    <span style={{ textAlign: 'right' }}>Output VAT</span>
                  </div>
                  {vatReport.bySource.map((src, i) => (
                    <div key={i} className={styles.tRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{src.label || src.source}</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#059669' }}>{fmt(src.revenue)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#DC2626' }}>{fmt(src.cost)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: src.profit >= 0 ? '#059669' : '#DC2626' }}>{fmt(src.profit)}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{src.margin || 0}%</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#7C3AED' }}>{fmt(src.outputVat)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Monthly Trend ── */}
            {vatReport.byMonth && vatReport.byMonth.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitleIcon}><Icon.trendUp /></span>
                  <h3 className={styles.cardTitle}>Monthly Trend</h3>
                </div>
                <div className={styles.table}>
                  <div className={styles.tHead} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
                    <span>Month</span>
                    <span style={{ textAlign: 'right' }}>Revenue</span>
                    <span style={{ textAlign: 'right' }}>Cost</span>
                    <span style={{ textAlign: 'right' }}>Profit</span>
                    <span style={{ textAlign: 'right' }}>Output VAT</span>
                    <span style={{ textAlign: 'right' }}>Margin</span>
                  </div>
                  {vatReport.byMonth.map((m, i) => (
                    <div key={i} className={styles.tRow} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <span style={{ fontWeight: 600 }}>{m.month}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{fmt(m.revenue)}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{fmt(m.cost)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: m.profit >= 0 ? '#059669' : '#DC2626' }}>{fmt(m.profit)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#7C3AED' }}>{fmt(m.outputVat)}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{m.margin || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top Products ── */}
            {vatReport.topProducts && vatReport.topProducts.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitleIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                  </span>
                  <h3 className={styles.cardTitle}>Top Products</h3>
                  <span className={styles.cardSub}>{vatReport.topProducts.length} products · Sell Price − Cost = Profit</span>
                </div>
                <div className={styles.table}>
                  <div className={styles.tHead} style={{ gridTemplateColumns: '36px 2fr 1fr 0.6fr 1fr 1fr 1fr 0.8fr' }}>
                    <span>#</span><span>Product</span><span>Source</span>
                    <span style={{ textAlign: 'right' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Revenue</span>
                    <span style={{ textAlign: 'right' }}>Cost</span>
                    <span style={{ textAlign: 'right' }}>Profit</span>
                    <span style={{ textAlign: 'right' }}>Margin</span>
                  </div>
                  {vatReport.topProducts.map((p, i) => (
                    <div key={i} className={styles.tRow} style={{ gridTemplateColumns: '36px 2fr 1fr 0.6fr 1fr 1fr 1fr 0.8fr' }}>
                      <span className={styles.rowNum}>{i + 1}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{p.name || 'Unknown'}</span>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', color: '#6B7280' }}>{p.source}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{p.qtySold}</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#059669' }}>{fmt(p.revenue)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', color: '#DC2626' }}>{fmt(p.cost)}</span>
                      <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: p.profit >= 0 ? '#059669' : '#DC2626' }}>{fmt(p.profit)}</span>
                      <span className={styles.num} style={{ textAlign: 'right' }}>{p.margin}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.note}>
              <strong>Live data:</strong> Output VAT from sales invoices · Input VAT from purchase orders + expenses · COGS from invoice item cost prices · HR costs from payroll salary components. Profit = Revenue - COGS - Expenses - HR Costs.
            </div>
          </>); })()}
        </div>
      )}

      {/* ── ROW 4: DOCUMENT LIST ── */}
      {activeTab !== 'vatprofit' && (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}>{activeTab === 'receivable' ? <Icon.file /> : <Icon.check />}</span>
          <h3 className={styles.cardTitle}>
            {activeTab === 'receivable' ? 'Receivable Invoices — awaiting full payment' : 'Receipts — payment confirmed'}
          </h3>
          <span className={styles.cardSub}>{activeDocs.length} documents · click row to view</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tHead}>
            <span>#</span>
            <span>Module</span>
            <span style={{ textAlign: 'center' }}>Invoice No</span>
            <span style={{ textAlign: 'center' }}>Receipt No</span>
            <span style={{ textAlign: 'center' }}>Date</span>
            {activeTab === 'receipts' && <span style={{ textAlign: 'right' }}>VAT</span>}
            <span style={{ textAlign: 'right' }}>Paid</span>
            {activeTab === 'receivable' && <span style={{ textAlign: 'right' }}>Balance</span>}
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>

          {pagedDocs.length === 0 ? (
            <div className={styles.empty}>
              {activeTab === 'receivable'
                ? 'No outstanding invoices — all orders fully paid!'
                : 'No confirmed receipts yet — payments will appear here once orders are paid.'}
            </div>
          ) : pagedDocs.map((d, i) => (
            <div key={d.id} className={styles.tRow} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelected(d)} onClick={() => setSelected(d)}>
              <span className={styles.rowNum}>{(safePage - 1) * PAGE_SIZE + i + 1}</span>
              <span className={styles.moduleName}>
                <span className={styles.moduleIcon} style={{ background: (d.color || G.darkGray) + '1A', color: d.color }}>{d.icon}</span>
                <span className={styles.moduleLabel}>{d.sourceLabel}</span>
              </span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{d.invoiceNo}</span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{d.receiptNo}</span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{fmtDate(d.date)}</span>
              {activeTab === 'receipts' && <span className={styles.num} style={{ textAlign: 'right', color: '#7C3AED', fontWeight: 600 }}>{fmt(d.vat || 0)}</span>}
              <span className={styles.num} style={{ textAlign: 'right' }}>{fmt(d.amountPaid)}</span>
              {activeTab === 'receivable' && (
                <span className={styles.num} style={{ textAlign: 'right', color: d.balance < -0.001 ? '#DC2626' : G.forest, fontWeight: d.balance < -0.001 ? 700 : 400 }}>
                  {fmt(Math.abs(d.balance))}
                  {d.balance < -0.001 ? ' owed' : ' ✓'}
                </span>
              )}
              <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(d.total)}</span>
            </div>
          ))}

          {activeDocs.length > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.rowNum}></span>
              <span className={styles.moduleName} style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 13 }}>Summary</span>
              <span></span>
              <span></span>
              <span></span>
              {activeTab === 'receipts' && <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>{fmt(vatTotal)}</span>}
              <span></span>
              {activeTab === 'receivable' && <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{fmt(owedTotal)}</span>}
              <span></span>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? <span key={`e${i}`} className={styles.pageDots}>…</span> :
                <button key={p} className={`${styles.pageBtn} ${p === safePage ? styles.pageBtnActive : ''}`} onClick={() => setPage(p)}>{p}</button>
              )}
            <button className={styles.pageBtn} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button>
          </div>
        )}

        <div className={styles.note}>
          {activeTab === 'receivable'
            ? 'Every order placed in any module auto-generates a Sales Invoice. The invoice shows per-item tax treatment (Standard / Exempt / Zero-rated) from the CEO-configured tax mappings. Once payment is confirmed, the invoice moves to Receipts and the balance becomes zero.'
            : 'Every payment received auto-generates a linked Sales Receipt: Sale ID → Invoice ID → Payment ID → Receipt ID — no double counting. The receipt confirms money received against the invoice; it never recalculates the sale.'}
        </div>
      </div>
      )}

      {selected && <DocumentModal doc={selected} company={company} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default FinanceReceiptsDashboard;
