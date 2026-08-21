import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Book, Printer, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Eye, X, CheckCircle, Building, Smartphone, Banknote,
  ChevronLeft, ChevronRight, Search, Filter
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ── Global CSS (design pass only) ──────────────────────────── */
const G = `
  .cb-wrap {
    --color-primary: #2563EB;
    --color-primary-hover: #1D4ED8;
    --color-bg-page: #F5F6FA;
    --color-bg-card: #FFFFFF;
    --color-border: #E5E7EB;
    --color-text-primary: #111827;
    --color-text-secondary: #6B7280;
    --color-text-muted: #9CA3AF;
    --color-success: #16A34A;
    --color-success-bg: #DCFCE7;
    --color-danger: #DC2626;
    --color-danger-bg: #FEE2E2;
    --color-warning: #D97706;
    --color-warning-bg: #FEF3C7;
    --color-info: #0284C7;
    --color-info-bg: #E0F2FE;
    --color-gold: #F59E0B;
    --color-gold-hover: #D97706;
    --color-gold-text: #1F2937;
    --cb-radius: 10px;
    --cb-radius-sm: 8px;
    --cb-transition: 150ms ease-in-out;
    padding: 0;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100%;
    box-sizing: border-box;
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-text-primary);
    -webkit-font-smoothing: antialiased;
  }
  .cb-wrap *, .cb-wrap *::before, .cb-wrap *::after { box-sizing: border-box; }
  .cb-wrap h1, .cb-wrap h2, .cb-wrap h3 { line-height: 1.3; }

  /* Inputs */
  .cb-inp, .cb-select {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--cb-radius-sm);
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--cb-transition), box-shadow var(--cb-transition);
  }
  .cb-inp:focus, .cb-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .cb-select { cursor: pointer; }
  .cb-lbl {
    display: block;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }

  /* Buttons — every button gets a gold hover (text stays readable) */
  .btn-green, .btn-outline, .btn-reset, .view-btn, .pg-btn, .cb-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: var(--cb-radius-sm);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--cb-transition), color var(--cb-transition), border-color var(--cb-transition);
  }
  .btn-green {
    background: var(--color-primary);
    color: #FFFFFF;
    border: 1px solid var(--color-primary);
  }
  .btn-green:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-outline {
    background: #FFFFFF;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  .btn-outline:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-reset {
    background: #FFFFFF;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .btn-reset:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .view-btn {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    background: var(--color-info-bg);
    color: var(--color-info);
    border: 1px solid transparent;
  }
  .view-btn:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .pg-btn {
    height: 32px;
    min-width: 32px;
    padding: 0 10px;
    font-size: 13px;
    background: #FFFFFF;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .pg-btn:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .pg-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #FFFFFF;
  }
  .pg-btn.active:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .cb-btn-icon {
    width: 36px;
    height: 36px;
    padding: 0;
    background: #FFFFFF;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .cb-btn-icon:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-green:disabled, .btn-outline:disabled, .btn-reset:disabled,
  .view-btn:disabled, .pg-btn:disabled, .cb-btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Cards */
  .cb-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--cb-radius);
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    transition: box-shadow var(--cb-transition), transform var(--cb-transition);
  }
  .cb-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
  .cb-filter-panel {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--cb-radius);
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .cb-table-wrap {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--cb-radius);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    width: 100%;
  }

  /* Table */
  .cb-table-wrap table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 720px;
  }
  .cb-table-wrap thead th {
    background: #F9FAFB;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 12px 16px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--color-border);
  }
  .cb-table-wrap tbody td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  .cb-table-wrap tbody tr { transition: background var(--cb-transition); }
  .cb-table-wrap tbody tr:hover { background: #F9FAFB; }
  .cb-table-wrap tbody tr:last-child td { border-bottom: none; }

  /* Pagination */
  .cb-pagination {
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #FFFFFF;
    flex-wrap: wrap;
    gap: 10px;
  }
  .cb-pagination-info {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  /* Grid */
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; align-items: stretch; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 2fr auto; gap: 16px; align-items: flex-end; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-box {
    background: #FFFFFF;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%;
    max-width: 780px;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }

  /* Notif / Toast */
  .cb-notif {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 20px;
    border-radius: var(--cb-radius);
    font-size: 14px;
    font-weight: 500;
    width: 100%;
    box-sizing: border-box;
    animation: cbSlideIn var(--cb-transition) ease-out;
  }
  .cb-notif-success {
    background: var(--color-success-bg);
    border: 1px solid var(--color-success);
    border-left: 4px solid var(--color-success);
    color: #166534;
  }
  .cb-notif-error {
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger);
    border-left: 4px solid var(--color-danger);
    color: #991B1B;
  }
  .cb-notif-close {
    margin-left: auto;
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--cb-radius-sm);
    transition: background var(--cb-transition), opacity var(--cb-transition);
  }
  .cb-notif-close:hover { opacity: 1; background: rgba(0,0,0,0.08); }

  @keyframes cbSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .grid-4 { grid-template-columns: 1fr; }
    .btn-green, .btn-outline, .btn-reset, .cb-btn-icon { height: 44px; }
    .view-btn, .pg-btn { height: 44px; min-width: 44px; }
    .cb-inp, .cb-select { height: 44px; }
    .cb-filter-panel { padding: 12px; }
  }
`;

/* ── In-app Notification ─────────────────────────────────────── */
const Notif = ({ n, onClose }) => {
  if (!n) return null;
  return (
    <div className={`cb-notif ${n.type === 'error' ? 'cb-notif-error' : 'cb-notif-success'}`} role="alert">
      <span style={{ fontSize: 15, lineHeight: 1 }}>{n.type === 'error' ? '⚠' : '✓'}</span>
      <span>{n.msg}</span>
      <button className="cb-notif-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
};

/* ── Document Modal ───────────────────────────────────────────── */
const DocumentModal = ({ doc, onClose }) => {
  if (!doc) return null;
  const printRef = useRef(null);
  const isCRV = doc.docType === 'CRV';

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${doc.docType} Print</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; }
        h1 { font-size: 26px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 4px; text-align: center; }
        h2 { font-size: 16px; font-weight: normal; text-align: center; margin: 0 0 16px; }
        .header { border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
        .body-line { line-height: 2.4; font-size: 15px; margin-bottom: 20px; }
        .underline { border-bottom: 1px solid #000; display: inline-block; min-width: 280px; }
        .amount-box { padding: 12px 24px; border: 2px solid #000; font-size: 26px; font-weight: bold; display: inline-block; }
        .payment-box { padding: 12px 16px; border: 1px solid #555; font-size: 13px; display: inline-block; min-width: 240px; vertical-align: top; margin-left: 20px; }
        .sig-row { display: flex; justify-content: space-between; margin-top: 50px; }
        .sig-block { text-align: center; width: 210px; }
        .sig-image { height: 80px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; overflow: hidden; }
        .sig-image img { max-height: 75px; max-width: 100%; object-fit: contain; }
        .sig-name { border-top: 1px solid #333; padding-top: 4px; font-weight: 700; font-size: 13px; }
        .sig-label { font-size: 11px; color: #555; margin-top: 2px; }
      </style>
      </head><body>${content}</body></html>`);
    w.document.close(); w.focus(); w.print(); w.close();
  };

  const pm = doc.payment_method;
  const amt = parseFloat(doc.amount || 0);
  const docNumber = isCRV ? doc.crv_number : doc.ev_number;
  const docTitle = isCRV ? 'CASH RECEIPT VOUCHER' : 'EXPENSE VOUCHER';
  const partyLabel = isCRV ? 'RECEIVED FROM' : 'PAID TO';
  const partyName = isCRV ? doc.received_from : doc.paid_to;

  const accentColor = isCRV ? 'var(--color-success)' : 'var(--color-danger)';
  const accentBg    = isCRV ? 'var(--color-success-bg)' : 'var(--color-danger-bg)';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Modal Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
          <div>
            <div style={{ color: 'var(--color-primary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>{docTitle}</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{docNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-green" onClick={handlePrint}>
              <Printer size={14} /> Print
            </button>
            <button className="cb-btn-icon" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24 }}>
          {/* Meta grid */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              ['Date', new Date(doc.date).toLocaleDateString('en-GB')],
              ['Payment Method', doc.payment_method],
              ['Reference', doc.reference_no || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#F9FAFB', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: accentBg, border: `1px solid ${accentColor}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: accentColor, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>{partyLabel}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>{partyName}</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 400 }}>{doc.description}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>AMOUNT</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>ETB {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            {pm === 'Bank' && (
              <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> Bank Details</div>
                <div>Bank: <b>{doc.bank_name}</b></div>
                <div>A/C Name: <b>{doc.account_holder}</b></div>
                <div>A/C No: <b>{doc.account_number}</b></div>
                {doc.cheque_no && <div>Cheque No: <b>{doc.cheque_no}</b></div>}
              </div>
            )}
            {pm === 'Telebirr' && (
              <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Telebirr</div>
                <div>Mobile: <b>{doc.telebirr_number}</b></div>
                <div>Name: <b>{doc.telebirr_name}</b></div>
              </div>
            )}
            {pm === 'Cash' && (
              <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 8, padding: '14px 24px', fontSize: 16, fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Banknote size={20} /> By Cash
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 14 }}>Signatures</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {[
                { label: 'Prepared By',          name: doc.prepared_by,   sig: doc.prepared_signature },
                { label: 'Checked By',           name: doc.checked_by,    sig: doc.checked_signature },
                { label: isCRV ? "Receiver's Signature" : "Payee's Signature", name: doc.receiver_name, sig: doc.receiver_signature },
              ].map(({ label, name, sig }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', minWidth: 140 }}>
                  <div style={{ height: 80, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    {sig ? <img src={sig} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>No signature</span>}
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, display: 'inline-block', minWidth: 140 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 500 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden printable version */}
        <div ref={printRef} style={{ display: 'none' }}>
          <div class="header">
            <h1>Sutana Enterprise</h1>
            <h2>OFFICIAL {docTitle}</h2>
          </div>
          <div class="meta">
            <div>
              <b>{isCRV ? 'Receipt No:' : 'Voucher No:'}</b> {docNumber}<br />
              <b>Reference:</b> {doc.reference_no || 'N/A'}
            </div>
            <div>
              <b>Date:</b> {new Date(doc.date).toLocaleDateString('en-GB')}<br />
              <b>Payment Method:</b> {doc.payment_method}
            </div>
          </div>
          <div class="body-line">
            <div><b>{partyLabel}:</b> <span class="underline">{partyName}</span></div>
            <div><b>THE SUM OF:</b> <span class="underline" style={{ fontStyle: 'italic' }}>ETB {amt.toLocaleString()}</span></div>
            <div><b>BEING PAYMENT FOR:</b> <span class="underline">{doc.description}</span></div>
          </div>
          <div>
            <span class="amount-box">ETB {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {pm === 'Bank' && (
              <span class="payment-box">
                <b>Bank Details:</b><br />
                Bank: {doc.bank_name}<br />
                A/C Name: {doc.account_holder}<br />
                A/C No: {doc.account_number}
                {doc.cheque_no ? <><br />Cheque No: {doc.cheque_no}</> : ''}
              </span>
            )}
            {pm === 'Telebirr' && (
              <span class="payment-box">
                <b>Telebirr Details:</b><br />
                Mobile: {doc.telebirr_number}<br />
                Name: {doc.telebirr_name}
              </span>
            )}
            {pm === 'Cash' && (
              <span class="payment-box" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>By Cash</span>
            )}
          </div>
          <div class="sig-row">
            {[
              { label: 'Prepared By',          name: doc.prepared_by,   sig: doc.prepared_signature },
              { label: 'Checked By',           name: doc.checked_by,    sig: doc.checked_signature },
              { label: isCRV ? "Receiver's Signature" : "Payee's Signature", name: doc.receiver_name, sig: doc.receiver_signature },
            ].map(({ label, name, sig }) => (
              <div key={label} class="sig-block">
                <div class="sig-image">
                  {sig ? <img src={sig} alt={label} /> : <span>—</span>}
                </div>
                <div class="sig-name">{name || '_______________'}</div>
                <div class="sig-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Expense Book Component ─────────────────────────────── */
const FinanceCashBook = () => {
  const [entries, setEntries]         = useState([]);
  const [recordMap, setRecordMap]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [notif, setNotif]             = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const PER_PAGE = 15;

  const fetchAll = useCallback(async () => {
    setLoading(true); setNotif(null);
    try {
      const [cbRes, evRes] = await Promise.all([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/ev'),
      ]);
      const cashbook = cbRes?.data || [];
      const evs      = evRes?.data || [];

      const map = {};
      (Array.isArray(evs) ? evs : []).forEach(e => { map[e.ev_number] = { ...e, docType: 'EV' }; });

      setEntries(Array.isArray(cashbook) ? cashbook : []);
      setRecordMap(map);
    } catch (err) {
      setNotif({ type: 'error', msg: err.message || 'Failed to load Expense Book' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Running balance calculation
  let runningBal = 0;
  const withBalance = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id)
    .map(e => {
      const r = parseFloat(e.receipts || 0);
      const p = parseFloat(e.payments || 0);
      runningBal += (r - p);
      return { ...e, receipts: r, payments: p, balance: runningBal };
    });

  // Filters
  const filtered = withBalance.filter(e => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo   && e.date > dateTo)   return false;
    if (typeFilter !== 'All' && e.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.reference?.toLowerCase().includes(q) && !e.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated     = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalReceipts = filtered.reduce((a, e) => a + e.receipts, 0);
  const totalPayments = filtered.reduce((a, e) => a + e.payments, 0);
  const netBalance    = totalReceipts - totalPayments;

  const fmt = v => v.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const fmt2 = v => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handlePrintAll = () => {
    if (!filtered.length) return;
    const rows = filtered.map(entry => {
      const isReceipt = entry.receipts > 0;
      const isPayment = entry.payments > 0;
      return `
        <tr>
          <td class="text-center">${new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td class="text-center"><b>${entry.type}</b></td>
          <td class="text-center" style="font-family:monospace;">${entry.reference || '-'}</td>
          <td>${entry.description || '-'}</td>
          <td class="text-right" style="color:#228B22;">${isReceipt ? fmt2(entry.receipts) : '-'}</td>
          <td class="text-right" style="color:#F44336;">${isPayment ? fmt2(entry.payments) : '-'}</td>
          <td class="text-right" style="font-weight:bold; color:${entry.balance >= 0 ? '#1B5E20' : '#F44336'}">${fmt2(entry.balance)}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Expense Book Ledger</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:white;color:#111;padding:30px;}
    .header{text-align:center;margin-bottom:30px;padding-bottom:15px;border-bottom:3px solid #1B5E20;}
    .company-name{font-size:24px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;color:#1B5E20;}
    .doc-title{font-size:16px;color:#444;font-weight:bold;}.print-meta{font-size:12px;color:#666;text-align:right;margin-top:10px;}
    table{width:100%;border-collapse:collapse;margin-bottom:30px;font-size:12px;}
    th{border:1px solid #1B5E20;padding:10px;background-color:#A5D6A7;text-transform:uppercase;font-weight:bold;text-align:center;font-size:11px;color:#1B5E20;}
    td{border:1px solid #8D6E63;padding:8px 10px;vertical-align:top;}
    tbody tr:nth-child(even){background-color:#F1F8E9;}
    .text-center{text-align:center;}.text-right{text-align:right;}
    .totals-row td{border:2px solid #1B5E20;background-color:#A5D6A7;font-weight:bold;font-size:13px;color:#1B5E20;}
    .summary-box{float:right;width:300px;border:2px solid #1B5E20;padding:15px;background:#F1F8E9;}
    .summary-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;}
    .summary-row.net{border-top:1px solid #1B5E20;padding-top:8px;font-weight:bold;font-size:16px;}
    .clearfix::after{content:"";clear:both;display:table;}
    @page{margin:15mm;size:A4 portrait;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;}}</style>
    </head><body>
    <div class="header">
      <div class="company-name">SUTANA ENTERPRISE</div>
      <div class="doc-title">EXPENSE BOOK LEDGER</div>
      <div class="print-meta">Period: ${dateFrom ? new Date(dateFrom).toLocaleDateString() : 'Start'} to ${dateTo ? new Date(dateTo).toLocaleDateString() : 'Current'}<br/>Printed on: ${new Date().toLocaleString('en-GB')}</div>
    </div>
    <table><thead><tr>
      <th width="10%">Date</th><th width="8%">Type</th><th width="15%">Reference</th>
      <th width="35%">Particulars</th><th width="12%">Income (In)</th><th width="12%">Out (Pay)</th><th width="12%">Net Balance</th>
    </tr></thead><tbody>
      ${rows.join('\n')}
      <tr class="totals-row"><td colspan="4" class="text-right">TOTALS:</td>
        <td class="text-right">${fmt2(totalReceipts)}</td>
        <td class="text-right">${fmt2(totalPayments)}</td>
        <td class="text-right"></td>
      </tr>
    </tbody></table>
    <div class="clearfix">
      <div class="summary-box">
        <div class="summary-row"><span>Total Income:</span><span style="color:#228B22;">ETB ${fmt2(totalReceipts)}</span></div>
        <div class="summary-row"><span>Total Payments:</span><span style="color:#F44336;">ETB ${fmt2(totalPayments)}</span></div>
        <div class="summary-row net"><span>Net Balance:</span><span style="color:${netBalance >= 0 ? '#1B5E20' : '#F44336'};">ETB ${fmt2(netBalance)}</span></div>
      </div>
    </div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=900,height=1100');
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  // Type badge styling
  const typeBadge = (type) => {
    const map = {
      CRV: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      EV:  { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)' },
    };
    const s = map[type] || { bg: '#F3F4F6', color: 'var(--color-text-secondary)' };
    return {
      background: s.bg,
      color: s.color,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 500,
      border: `1px solid ${s.color}`,
      borderRadius: 9999,
      whiteSpace: 'nowrap',
      display: 'inline-block',
    };
  };

  return (
    <div className="cb-wrap">
      <style>{G}</style>

      <Notif n={notif} onClose={() => setNotif(null)} />

      {/* Top Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 12, lineHeight: 1.3 }}>
            <Book size={28} color="var(--color-primary)" /> Expense Book Ledger
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0', fontSize: 14, fontWeight: 400 }}>Central record of all cash receipts and payments</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={fetchAll}>
            <SegmentedSpinner size={14} /> Refresh
          </button>
          <button className="btn-green" onClick={handlePrintAll}>
            <Printer size={14} /> Print All ({filtered.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* Total Receipts */}
        <div className="cb-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>Total Receipts</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(totalReceipts)}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 500 }}>{filtered.filter(e => e.receipts > 0).length} entries</div>
          </div>
          <div style={{ background: 'var(--color-success-bg)', padding: 14, display: 'flex', alignItems: 'center', borderRadius: 8 }}>
            <TrendingUp size={24} color="var(--color-success)" />
          </div>
        </div>
        {/* Total Payments */}
        <div className="cb-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>Total Payments</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(totalPayments)}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 500 }}>{filtered.filter(e => e.payments > 0).length} entries</div>
          </div>
          <div style={{ background: 'var(--color-danger-bg)', padding: 14, display: 'flex', alignItems: 'center', borderRadius: 8 }}>
            <TrendingDown size={24} color="var(--color-danger)" />
          </div>
        </div>
        {/* Net Balance */}
        <div className="cb-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>Net Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: netBalance >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>
              ETB {fmt(netBalance)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 500 }}>{filtered.length} total records</div>
          </div>
          <div style={{ background: 'var(--color-info-bg)', padding: 14, display: 'flex', alignItems: 'center', borderRadius: 8 }}>
            <DollarSign size={24} color="var(--color-primary)" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cb-filter-panel">
        <div className="grid-4">
          <div>
            <label className="cb-lbl">Date From</label>
            <input className="cb-inp" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="cb-lbl">Date To</label>
            <input className="cb-inp" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="cb-lbl">Type</label>
            <select className="cb-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="All">All Types</option>
              <option value="CRV">Cash Receipt (CRV)</option>
              <option value="EV">Expense Voucher (EV)</option>
            </select>
          </div>
          <div>
            <label className="cb-lbl">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input className="cb-inp" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Reference or description…" style={{ paddingLeft: 32 }} />
            </div>
          </div>
          <button className="btn-reset" onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); setSearch(''); setPage(1); }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="cb-table-wrap">
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table>
            <thead>
              <tr>
                {['Date', 'Type', 'Reference', 'Description', 'Receipts (In)', 'Payments (Out)', 'Balance', ''].map((col, i) => (
                  <th key={i} style={['Receipts (In)', 'Payments (Out)', 'Balance'].includes(col) ? { textAlign: 'right' } : undefined}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center' }}>
                  <SegmentedSpinner size={28} />
                  <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>Loading expense book data…</div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Book size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block', color: 'var(--color-text-muted)' }} />
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{entries.length === 0 ? 'No transactions yet.' : 'No results match your filters.'}</div>
                </td></tr>
              ) : paginated.map((entry) => {
                const hasRecord = entry.type === 'EV' && recordMap[entry.reference];
                return (
                  <tr key={entry.id} className="cb-tr">
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span style={typeBadge(entry.type)}>{entry.type}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: 13 }}>{entry.reference}</td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{entry.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-success)' }}>
                      {entry.receipts > 0 ? `+ ${fmt(entry.receipts)}` : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-danger)' }}>
                      {entry.payments > 0 ? `- ${fmt(entry.payments)}` : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: entry.balance >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger)' }}>
                      {fmt(entry.balance)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {hasRecord && (
                        <button className="view-btn" onClick={() => setSelectedRecord(hasRecord)}>
                          <Eye size={13} /> View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="cb-pagination">
            <span className="cb-pagination-info">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                <button key={p} className={`pg-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedRecord && <DocumentModal doc={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </div>
  );
};

export default FinanceCashBook;
