import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const buildReceipt = () => {
    const items = doc.items || [];
    const totalVat = items.reduce((s, it) => s + Number(it.vat || 0), 0);
    // Subtotal = sum of NET (pre-VAT) line amounts (unitPrice × qty). The
    // stored `amount` field is gross (already includes VAT), so summing it here
    // would double-count VAT and make Subtotal equal TOTAL.
    const subtotal = items.reduce((s, it) => s + (Number(it.unitPrice || 0) * Number(it.qty || 0)), 0);
    const brandSub = [company.address, company.phone, company.tin ? `TIN: ${company.tin}` : ''].filter(Boolean).join('  |  ');
    const balanceColor = (doc.balance || 0) > 0.001 ? '#DC2626' : '#16A34A';

    const itemRows = items.map((it, idx) => `<tr>
      <td class="tc" style="color:#9CA3AF;font-size:12px">${idx + 1}</td>
      <td>${it.name}</td>
      <td class="tr">${it.qty}</td>
      <td class="tr">${fmtNum(it.unitPrice)}</td>
      <td class="tr">${fmtNum(it.vat)}</td>
      <td class="tr">${fmtNum(Number(it.unitPrice || 0) * Number(it.qty || 0))}</td>
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

  const receiptHTML = buildReceipt();

  w.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Sales Receipt — ${doc.invoiceNo || ''}</title>
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
${receiptHTML}
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
   SALES RECEIPT
   Proof of payment received. Does NOT recalculate the sale — confirms
   money received against an existing receipt.
   ═══════════════════════════════════════════════════════════════════════════ */
const SalesReceiptForm = ({ doc, company }) => {
  const items = doc.items || [];
  const totalVat = items.reduce((s, it) => s + Number(it.vat || 0), 0);
  // Subtotal = sum of NET (pre-VAT) line amounts (unitPrice × qty). The stored
  // `amount` field is gross (already includes VAT), so summing it here would
  // double-count VAT and make Subtotal equal TOTAL.
  const subtotal = items.reduce((s, it) => s + (Number(it.unitPrice || 0) * Number(it.qty || 0)), 0);

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
                <td style={S.tdR}>{fmtNum(Number(it.unitPrice || 0) * Number(it.qty || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={S.totals}>
          <div style={S.totalRow}>
            <span style={S.totalLabel}>Subtotal:</span>
            <span style={S.totalVal}>{fmt(subtotal)}</span>
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
   Tabs: Sales Receipt + Print buttons
   ═══════════════════════════════════════════════════════════════════════════ */
const DocumentModal = ({ doc, company, onClose }) => {
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
            <h3 className={styles.modalTitle}>{doc.sourceLabel} · Receipt {doc.receiptNo || doc.invoiceNo}</h3>
            <p className={styles.modalSub}>Sale → Receipt (linked end-to-end)</p>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.printBtnGreen} onClick={() => printInNewTab('receipt', doc, company)} title="Print Sales Receipt">
              Print Receipt
            </button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.printArea}>
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname.includes('receipts') ? 'receipts' : 'invoices');

  useEffect(() => {
    setActiveTab(location.pathname.includes('receipts') ? 'receipts' : 'invoices');
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

  useEffect(() => {
    if (docs.length > 0 && location.state?.selectedSaleId) {
      const doc = docs.find(d => d.saleId === location.state.selectedSaleId || d.id === location.state.selectedSaleId);
      if (doc) setSelected(doc);
    }
  }, [docs, location.state]);


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

  const receivableDocs = docs.filter((d) => d.balance < -0.001 && d.source === 'printing');
  const paidDocs = docs.filter((d) => !(d.balance < -0.001 && d.source === 'printing'));
  const activeDocs = activeTab === 'invoices' ? receivableDocs : paidDocs;

  const totalPages = Math.max(1, Math.ceil(activeDocs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedDocs = activeDocs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const receivableValue = receivableDocs.reduce((s, d) => s + Math.abs(d.balance), 0);
  const paidValue = paidDocs.reduce((s, d) => s + d.total, 0);
  const owedTotal = receivableValue;

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: '#374151', marginBottom: 8, fontFamily: 'inherit',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ← Back
          </button>
          <h2 className={styles.welcomeTitle}>
            Receipts <span className={styles.welcomeEmoji}>🧾</span>
          </h2>
          <p className={styles.welcomeSub}>
            Auto-generated: Order → Payment → Receipt · All modules + 2 tenders · No manual form filling
          </p>
        </div>
        <button onClick={load} className={styles.syncBtn} disabled={refreshing}>
          {refreshing && <SegmentedSpinner size={16} />}
          <span>Sync</span>
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}


      {/* ── ROW 2: TABS ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.tabBtnActive : ''}`}
          onClick={() => { setActiveTab('invoices'); setPage(1); }}
        >
          <Icon.file /> Invoices (Unpaid)
          <span className={styles.tabBadge} style={{ background: '#FEF3C7', color: '#92400E' }}>{receivableDocs.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'receipts' ? styles.tabBtnActive : ''}`}
          onClick={() => { setActiveTab('receipts'); setPage(1); }}
        >
          <Icon.check /> Receipts (Paid)
          <span className={styles.tabBadge} style={{ background: '#DCFCE7', color: '#166534' }}>{paidDocs.length}</span>
        </button>
      </div>

      {/* ── ROW 3: COMPANY PROFILE ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}><Icon.building /></span>
          <h3 className={styles.cardTitle}>Company Profile (Receipt header)</h3>
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

      {/* ── ROW 4: DOCUMENT LIST ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}>{activeTab === 'invoices' ? <Icon.file /> : <Icon.check />}</span>
          <h3 className={styles.cardTitle}>
            {activeTab === 'invoices' ? 'Invoices — awaiting full payment' : 'Receipts — payment confirmed'}
          </h3>
          <span className={styles.cardSub}>{activeDocs.length} documents · click row to view</span>
        </div>

        <div className={styles.table}>
          <div
            className={styles.tHead}
            style={{ gridTemplateColumns: activeTab === 'receipts'
              ? '40px 1.5fr 1fr 1fr 1fr 1fr'
              : '40px 1.8fr 1.1fr 1fr 1fr 1fr 1fr' }}
          >
            <span>#</span>
            <span>Module</span>
            <span style={{ textAlign: 'center' }}>Receipt No</span>
            <span style={{ textAlign: 'center' }}>Date</span>
            <span style={{ textAlign: 'right' }}>Paid</span>
            {activeTab === 'invoices' && <span style={{ textAlign: 'right' }}>Balance</span>}
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>

          {pagedDocs.length === 0 ? (
            <div className={styles.empty}>
              {activeTab === 'invoices'
                ? 'No outstanding invoices — all orders fully paid!'
                : 'No confirmed receipts yet — payments will appear here once orders are paid.'}
            </div>
          ) : pagedDocs.map((d, i) => {
            return (
              <div
                key={d.id}
                className={styles.tRow}
                role="button"
                tabIndex={0}
                style={{ gridTemplateColumns: activeTab === 'receipts'
                  ? '40px 1.5fr 1fr 1fr 1fr 1fr'
                  : '40px 1.8fr 1.1fr 1fr 1fr 1fr 1fr' }}
                onKeyDown={e => e.key === 'Enter' && setSelected(d)}
                onClick={() => setSelected(d)}
              >
                <span className={styles.rowNum}>{(safePage - 1) * PAGE_SIZE + i + 1}</span>
                <span className={styles.moduleName}>
                  <span className={styles.moduleIcon} style={{ background: (d.color || G.darkGray) + '1A', color: d.color }}>{d.icon}</span>
                  <span className={styles.moduleLabel}>{d.sourceLabel}</span>
                </span>
                <span className={styles.num} style={{ textAlign: 'center' }}>{d.receiptNo}</span>
                <span className={styles.num} style={{ textAlign: 'center' }}>{fmtDate(d.date)}</span>
                <span className={styles.num} style={{ textAlign: 'right' }}>{fmt(d.amountPaid)}</span>
                {activeTab === 'invoices' && (
                  <span className={styles.num} style={{ textAlign: 'right', color: d.balance < -0.001 ? '#DC2626' : G.forest, fontWeight: d.balance < -0.001 ? 700 : 400 }}>
                    {fmt(Math.abs(d.balance))}
                    {d.balance < -0.001 ? ' owed' : ' ✓'}
                  </span>
                )}
                <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(d.total)}</span>
              </div>
            );
          })}

          {activeDocs.length > 0 && (
            <div
              className={styles.summaryRow}
              style={{ gridTemplateColumns: activeTab === 'receipts'
                ? '40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr'
                : '40px 1.8fr 1.1fr 1fr 1fr 1fr 1fr' }}
            >
              <span className={styles.rowNum}></span>
              <span className={styles.moduleName} style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 13 }}>TOTAL</span>
              <span></span>
              <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700 }}>
                {activeTab === 'receipts' ? fmt(paidValue) : ''}
              </span>
              {activeTab === 'invoices' && <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{fmt(owedTotal)}</span>}
              <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700 }}>
                {activeTab === 'receipts' ? fmt(paidValue) : ''}
              </span>
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
          {activeTab === 'invoices'
            ? 'Every order placed in any module auto-generates a Sales Receipt upon payment. The receipt shows per-item tax treatment (Standard / Exempt / Zero-rated). Once payment is confirmed, the receipt moves to Paid Receipts.'
            : 'Every payment received auto-generates a linked Sales Receipt: Sale ID → Payment ID → Receipt ID — no double counting. The receipt confirms money received against the sale; it never recalculates the sale.'}
        </div>
      </div>

      {selected && <DocumentModal doc={selected} company={company} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default FinanceReceiptsDashboard;
