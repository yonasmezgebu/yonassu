import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Book, Printer, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Eye, X, CheckCircle, Building, Smartphone, Banknote,
  ChevronLeft, ChevronRight, Search, Filter
} from 'lucide-react';
import api from '../../services/apiClient';

/* ── Global CSS ─────────────────────────────────────────────── */
const G = `
  .cb-wrap {
    padding: 24px;
    background: #F5F5F5;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    width: 100%;
    box-sizing: border-box;
  }
  .cb-inp {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    font-size: 13px;
    font-weight: 600;
    color: #424242;
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cb-inp:focus {
    border-color: #228B22;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .cb-select {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    font-size: 13px;
    font-weight: 600;
    color: #424242;
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .cb-select:focus { border-color: #228B22; }
  .cb-lbl {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: #1B5E20;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .btn-green {
    background: #228B22;
    color: #FFFFFF;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-green:hover { background: #1B5E20; transform: translateY(-1px); }
  .btn-outline {
    background: #FFFFFF;
    color: #1B5E20;
    border: 2px solid #228B22;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-outline:hover { background: #228B22; color: #FFFFFF; }
  .btn-reset {
    background: #F5F5F5;
    color: #424242;
    border: 2px solid #8D6E63;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s;
    white-space: nowrap;
  }
  .btn-reset:hover { background: #8D6E63; color: #FFFFFF; }
  .cb-tr { transition: background 0.15s; }
  .cb-tr:hover { background: #A5D6A7 !important; cursor: pointer; }
  .cb-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 0;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }
  .cb-filter-panel {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 0;
    padding: 18px 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }
  .cb-table-wrap {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 0;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    width: 100%;
  }
  .pg-btn {
    padding: 6px 12px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    background: #FFFFFF;
    cursor: pointer;
    font-weight: 700;
    font-size: 13px;
    color: #424242;
    transition: all 0.15s;
  }
  .pg-btn:hover { background: #228B22; color: #FFFFFF; border-color: #228B22; }
  .pg-btn.active { background: #228B22; color: #FFFFFF; border-color: #1B5E20; }
  .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .view-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: #A5D6A7;
    border: 1px solid #228B22;
    border-radius: 0;
    cursor: pointer;
    color: #1B5E20;
    font-size: 12px;
    font-weight: 700;
    transition: background 0.15s;
  }
  .view-btn:hover { background: #228B22; color: #FFFFFF; }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-box {
    background: #FFFFFF;
    border: 2px solid #1B5E20;
    border-radius: 0;
    width: 100%;
    max-width: 760px;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 2fr auto; gap: 14px; align-items: flex-end; }
  @media (max-width: 900px) {
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .grid-3 { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: 1fr; }
    .cb-wrap { padding: 12px; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ── In-app Notification ─────────────────────────────────────── */
const Notif = ({ n, onClose }) => {
  if (!n) return null;
  return (
    <div style={{ background: n.type === 'error' ? '#F44336' : '#4CAF50', color: '#FFFFFF', padding: '14px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, border: '2px solid #1B5E20', width: '100%', boxSizing: 'border-box' }}>
      {n.type === 'error' ? '⚠' : '✓'} {n.msg}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 900, fontSize: 18 }}>✕</button>
    </div>
  );
};

/* ── Document Modal ───────────────────────────────────────────── */
const DocumentModal = ({ doc, onClose }) => {
  if (!doc) return null;
  const printRef = useRef(null);
  const isCRV = doc.docType === 'CRV';
  const isPCV = doc.docType === 'PCV';

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
  const docNumber = isCRV ? doc.crv_number : (isPCV ? doc.pcv_number : doc.pv_number);
  const docTitle = isCRV ? 'CASH RECEIPT VOUCHER' : (isPCV ? 'PETTY CASH VOUCHER' : 'PAYMENT VOUCHER');
  const partyLabel = isCRV ? 'RECEIVED FROM' : 'PAID TO';
  const partyName = isCRV ? doc.received_from : doc.paid_to;

  const accentColor = isCRV ? '#228B22' : (isPCV ? '#FF9800' : '#228B22');
  const accentBg    = isCRV ? '#A5D6A7' : (isPCV ? '#FFF3E0' : '#A5D6A7');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #8D6E63', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1B5E20' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{docTitle}</div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{docNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-green" onClick={handlePrint} style={{ padding: '8px 16px', fontSize: 13, background: '#2E8B57' }}>
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', borderRadius: 0 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 28 }}>
          {/* Meta grid */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              ['Date', new Date(doc.date).toLocaleDateString('en-GB')],
              ['Payment Method', doc.payment_method],
              ['Reference', doc.reference_no || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#F5F5F5', padding: '12px 16px', border: '1px solid #8D6E63' }}>
                <div style={{ fontSize: 10, color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: accentBg, border: `2px solid ${accentColor}`, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: accentColor, fontWeight: 800, marginBottom: 6 }}>{partyLabel}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>{partyName}</div>
            <div style={{ fontSize: 13, color: '#424242', fontWeight: 600 }}>{doc.description}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6B8E23', fontWeight: 800, marginBottom: 4 }}>AMOUNT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#1B5E20' }}>ETB {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            {pm === 'Bank' && (
              <div style={{ background: '#A5D6A7', border: '2px solid #228B22', padding: '14px 18px', fontSize: 13 }}>
                <div style={{ fontWeight: 800, color: '#1B5E20', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> Bank Details</div>
                <div>Bank: <b>{doc.bank_name}</b></div>
                <div>A/C Name: <b>{doc.account_holder}</b></div>
                <div>A/C No: <b>{doc.account_number}</b></div>
                {doc.cheque_no && <div>Cheque No: <b>{doc.cheque_no}</b></div>}
              </div>
            )}
            {pm === 'Telebirr' && (
              <div style={{ background: '#FFF3E0', border: '2px solid #FF9800', padding: '14px 18px', fontSize: 13 }}>
                <div style={{ fontWeight: 800, color: '#FF9800', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Telebirr</div>
                <div>Mobile: <b>{doc.telebirr_number}</b></div>
                <div>Name: <b>{doc.telebirr_name}</b></div>
              </div>
            )}
            {pm === 'Cash' && (
              <div style={{ background: '#A5D6A7', border: '2px solid #228B22', padding: '14px 24px', fontSize: 16, fontWeight: 800, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Banknote size={20} /> By Cash
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ borderTop: '2px solid #8D6E63', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 14 }}>Signatures</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {[
                { label: 'Prepared By',          name: doc.prepared_by,   sig: doc.prepared_signature },
                { label: 'Checked By',           name: doc.checked_by,    sig: doc.checked_signature },
                { label: isCRV ? "Receiver's Signature" : "Payee's Signature", name: doc.receiver_name, sig: doc.receiver_signature },
              ].map(({ label, name, sig }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', minWidth: 140 }}>
                  <div style={{ height: 80, border: '2px solid #8D6E63', overflow: 'hidden', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    {sig ? <img src={sig} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#8D6E63', fontSize: 11 }}>No signature</span>}
                  </div>
                  <div style={{ borderTop: '2px solid #1B5E20', paddingTop: 6, display: 'inline-block', minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1B5E20' }}>{name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#6B8E23', marginTop: 2, fontWeight: 600 }}>{label}</div>
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
      const [cbRes, pvRes, pcvRes] = await Promise.all([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/pv'),
        api.get('/finance-cash/pcv'),
      ]);
      const cashbook = cbRes?.data || [];
      const pvs      = pvRes?.data || [];
      const pcvs     = pcvRes?.data || [];

      const map = {};
      (Array.isArray(pvs)  ? pvs  : []).forEach(p => { map[p.pv_number]  = { ...p, docType: 'PV'  }; });
      (Array.isArray(pcvs) ? pcvs : []).forEach(p => { map[p.pcv_number] = { ...p, docType: 'PCV' }; });

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
      CRV: { bg: '#A5D6A7', color: '#1B5E20' },
      PV:  { bg: '#FFEBEE', color: '#F44336' },
      PCV: { bg: '#FFF3E0', color: '#FF9800' },
    };
    const s = map[type] || { bg: '#F5F5F5', color: '#424242' };
    return { background: s.bg, color: s.color, padding: '3px 10px', fontSize: 11, fontWeight: 800, border: `1px solid ${s.color}`, whiteSpace: 'nowrap' };
  };

  return (
    <div className="cb-wrap">
      <style>{G}</style>

      <Notif n={notif} onClose={() => setNotif(null)} />

      {/* Top Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Book size={24} color="#228B22" /> Expense Book Ledger
          </h1>
          <p style={{ color: '#424242', margin: 0, fontSize: 14, fontWeight: 600 }}>Central record of all cash receipts and payments</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={fetchAll} style={{ padding: '10px 16px', fontSize: 13 }}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
          <button className="btn-green" onClick={handlePrintAll} style={{ padding: '10px 16px', fontSize: 13 }}>
            <Printer size={14} /> Print All ({filtered.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* Total Receipts */}
        <div className="cb-card" style={{ borderLeft: '4px solid #228B22' }}>
          <div>
            <div style={{ fontSize: 11, color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Total Receipts</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#228B22' }}>ETB {fmt(totalReceipts)}</div>
            <div style={{ fontSize: 11, color: '#6B8E23', marginTop: 2, fontWeight: 600 }}>{filtered.filter(e => e.receipts > 0).length} entries</div>
          </div>
          <div style={{ background: '#A5D6A7', padding: 14, display: 'flex', alignItems: 'center' }}>
            <TrendingUp size={24} color="#1B5E20" />
          </div>
        </div>
        {/* Total Payments */}
        <div className="cb-card" style={{ borderLeft: '4px solid #F44336' }}>
          <div>
            <div style={{ fontSize: 11, color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Total Payments</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#F44336' }}>ETB {fmt(totalPayments)}</div>
            <div style={{ fontSize: 11, color: '#6B8E23', marginTop: 2, fontWeight: 600 }}>{filtered.filter(e => e.payments > 0).length} entries</div>
          </div>
          <div style={{ background: '#FFEBEE', padding: 14, display: 'flex', alignItems: 'center' }}>
            <TrendingDown size={24} color="#F44336" />
          </div>
        </div>
        {/* Net Balance */}
        <div className="cb-card" style={{ background: '#1B5E20', border: '1px solid #1B5E20' }}>
          <div>
            <div style={{ fontSize: 11, color: '#A5D6A7', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Net Balance</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: netBalance >= 0 ? '#8BC34A' : '#FF5252' }}>
              ETB {fmt(netBalance)}
            </div>
            <div style={{ fontSize: 11, color: '#A5D6A7', marginTop: 2, fontWeight: 600 }}>{filtered.length} total records</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: 14, display: 'flex', alignItems: 'center' }}>
            <DollarSign size={24} color="#FFFFFF" />
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
              <option value="PV">Payment Voucher</option>
              <option value="PCV">Petty Cash</option>
            </select>
          </div>
          <div>
            <label className="cb-lbl">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8D6E63' }} />
              <input className="cb-inp" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Reference or description…" style={{ paddingLeft: 30 }} />
            </div>
          </div>
          <button className="btn-reset" onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); setSearch(''); setPage(1); }} style={{ padding: '10px 16px', fontSize: 13 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="cb-table-wrap">
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#2E8B57' }}>
                {['Date', 'Type', 'Reference', 'Description', 'Receipts (In)', 'Payments (Out)', 'Balance', ''].map((col, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: ['Receipts (In)', 'Payments (Out)', 'Balance'].includes(col) ? 'right' : 'left', color: '#FFFFFF', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '2px solid #1B5E20' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#1B5E20', fontWeight: 700 }}>
                  <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                  Loading expense book data…
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#1B5E20' }}>
                  <Book size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontWeight: 700 }}>{entries.length === 0 ? 'No transactions yet.' : 'No results match your filters.'}</div>
                </td></tr>
              ) : paginated.map((entry, idx) => {
                const isEven = idx % 2 === 0;
                const hasRecord = (entry.type === 'PV' || entry.type === 'PCV') && recordMap[entry.reference];
                return (
                  <tr key={entry.id} className="cb-tr" style={{ borderBottom: '1px solid #E0E0E0', background: isEven ? '#FFFFFF' : '#F1F8E9' }}>
                    <td style={{ padding: '13px 16px', color: '#424242', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600 }}>
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={typeBadge(entry.type)}>{entry.type}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#228B22', fontSize: 12 }}>{entry.reference}</td>
                    <td style={{ padding: '13px 16px', color: '#424242', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.description}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: '#228B22' }}>
                      {entry.receipts > 0 ? `+ ${fmt(entry.receipts)}` : <span style={{ color: '#BDBDBD' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: '#F44336' }}>
                      {entry.payments > 0 ? `- ${fmt(entry.payments)}` : <span style={{ color: '#BDBDBD' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 900, color: entry.balance >= 0 ? '#1B5E20' : '#F44336', fontSize: 13 }}>
                      {fmt(entry.balance)}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
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
          <div style={{ padding: '14px 20px', borderTop: '2px solid #8D6E63', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F8E9', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#1B5E20', fontWeight: 700 }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
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
