import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Book, Download, Printer, Filter, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Eye, X, CheckCircle, Building, Smartphone, Banknote,
  ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import api from '../../services/apiClient';

/* ──────────────────────────────────────────────────────────────── */
/*  CRV Detail Modal + Print                                         */
/* ──────────────────────────────────────────────────────────────── */
const DocumentModal = ({ doc, onClose }) => {
  if (!doc) return null;

  const printRef = useRef(null);
  const isCRV = doc.docType === 'CRV';

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${doc.docType} Print</title>
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
        .sig-image { height: 80px; border: 1px solid #999; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; overflow: hidden; }
        .sig-image img { max-height: 75px; max-width: 100%; object-fit: contain; }
        .sig-name { border-top: 1px solid #333; padding-top: 4px; font-weight: 700; font-size: 13px; }
        .sig-label { font-size: 11px; color: #555; margin-top: 2px; }
      </style>
      </head><body>${content}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const pm = doc.payment_method;
  const amt = parseFloat(doc.amount || 0);
  const docNumber = isCRV ? doc.crv_number : (doc.docType === 'PCV' ? doc.pcv_number : doc.pv_number);
  const docTitle = isCRV ? 'CASH RECEIPT VOUCHER' : (doc.docType === 'PCV' ? 'PETTY CASH VOUCHER' : 'PAYMENT VOUCHER');
  const partyLabel = isCRV ? 'RECEIVED FROM' : 'PAID TO';
  const partyName = isCRV ? doc.received_from : doc.paid_to;

  const headerBg = isCRV ? 'linear-gradient(135deg,#0f172a,#1e293b)' : (doc.docType === 'PCV' ? 'linear-gradient(135deg,#eab308,#a16207)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)');
  const printBtnBg = isCRV ? '#22c55e' : (doc.docType === 'PCV' ? '#713f12' : '#0f172a');
  const accentColor = isCRV ? '#16a34a' : (doc.docType === 'PCV' ? '#a16207' : '#0284c7');
  const boxBg = isCRV ? '#f0fdf4' : (doc.docType === 'PCV' ? '#fefce8' : '#f0f9ff');
  const boxBorder = isCRV ? '1px solid #bbf7d0' : (doc.docType === 'PCV' ? '1px dashed #fde047' : '1px solid #bae6fd');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 760,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: headerBg,
          borderRadius: '20px 20px 0 0'
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{docTitle}</div>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{docNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: printBtnBg, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <Printer size={15} /> Print
            </button>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 28 }}>
          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              ['Date', new Date(doc.date).toLocaleDateString('en-GB')],
              ['Payment Method', doc.payment_method],
              ['Reference', doc.reference_no || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: boxBg, border: boxBorder, borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: accentColor, fontWeight: 600, marginBottom: 6 }}>{partyLabel}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{partyName}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>{doc.description}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>AMOUNT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: accentColor }}>ETB {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>

            {pm === 'Bank' && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> Bank Details</div>
                <div>Bank: <b>{doc.bank_name}</b></div>
                <div>A/C Name: <b>{doc.account_holder}</b></div>
                <div>A/C No: <b>{doc.account_number}</b></div>
                {doc.cheque_no && <div>Cheque No: <b>{doc.cheque_no}</b></div>}
              </div>
            )}
            {pm === 'Telebirr' && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Telebirr</div>
                <div>Mobile: <b>{doc.telebirr_number}</b></div>
                <div>Name: <b>{doc.telebirr_name}</b></div>
              </div>
            )}
            {pm === 'Cash' && (
              <div style={{ background: boxBg, border: boxBorder, borderRadius: 10, padding: '14px 24px', fontSize: 16, fontWeight: 700, color: accentColor, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Banknote size={20} /> By Cash
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 14 }}>Signatures</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
              {[
                { label: 'Prepared By',          name: doc.prepared_by,   sig: doc.prepared_signature },
                { label: 'Checked By',           name: doc.checked_by,    sig: doc.checked_signature },
                { label: isCRV ? "Receiver's Signature" : "Payee's Signature", name: doc.receiver_name, sig: doc.receiver_signature },
              ].map(({ label, name, sig }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 80, border: '1px solid #e2e8f0', borderRadius: 8,
                    overflow: 'hidden', background: '#fafafa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8
                  }}>
                    {sig
                      ? <img src={sig} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
                      : <span style={{ color: '#cbd5e1', fontSize: 11 }}>No signature</span>
                    }
                  </div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: 6, display: 'inline-block', minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
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
            <div><b>THE SUM OF:</b> <span class="underline" style={{fontStyle:'italic'}}>ETB {amt.toLocaleString()}</span></div>
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
              <span class="payment-box" style={{textAlign:'center', fontWeight:'bold', fontSize:18}}>By Cash</span>
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

/* ──────────────────────────────────────────────────────────────── */
/*  Main Cashbook Component                                          */
/* ──────────────────────────────────────────────────────────────── */
const FinanceCashBook = () => {
  const [entries, setEntries]     = useState([]);
  const [recordMap, setRecordMap] = useState({});   // reference → full CRV/PV object
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 15;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cbRes, crvRes, pvRes, pcvRes] = await Promise.all([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/crv'),
        api.get('/finance-cash/pv'),
        api.get('/finance-cash/pcv'),
      ]);

      const cashbook = cbRes?.data || cbRes || [];
      const crvs     = crvRes?.data || crvRes || [];
      const pvs      = pvRes?.data || pvRes || [];
      const pcvs     = pcvRes?.data || pcvRes || [];

      // Build lookup: reference number → record
      const map = {};
      (Array.isArray(crvs) ? crvs : []).forEach(c => { map[c.crv_number] = { ...c, docType: 'CRV' }; });
      (Array.isArray(pvs) ? pvs : []).forEach(p => { map[p.pv_number] = { ...p, docType: 'PV' }; });
      (Array.isArray(pcvs) ? pcvs : []).forEach(p => { map[p.pcv_number] = { ...p, docType: 'PCV' }; });

      setEntries(Array.isArray(cashbook) ? cashbook : []);
      setRecordMap(map);
    } catch (err) {
      setError(err.message || 'Failed to load cashbook');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePrintAll = () => {
    if (!filtered.length) return;
    const fmt2 = v => parseFloat(v||0).toLocaleString(undefined, { minimumFractionDigits: 2 });

    const rows = filtered.map((entry, idx) => {
      const isReceipt = entry.receipts > 0;
      const isPayment = entry.payments > 0;
      
      return `
        <tr>
          <td class="text-center">${new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td class="text-center"><b>${entry.type}</b></td>
          <td class="text-center" style="font-family:monospace;">${entry.reference || '-'}</td>
          <td>${entry.description || '-'}</td>
          <td class="text-right" style="color: #16a34a;">${isReceipt ? fmt2(entry.receipts) : '-'}</td>
          <td class="text-right" style="color: #dc2626;">${isPayment ? fmt2(entry.payments) : '-'}</td>
          <td class="text-right" style="font-weight:bold; color: ${entry.balance >= 0 ? '#0f172a' : '#dc2626'}">${fmt2(entry.balance)}</td>
        </tr>
      `;
    });

    const totalIn = filtered.reduce((sum, e) => sum + (e.receipts || 0), 0);
    const totalOut = filtered.reduce((sum, e) => sum + (e.payments || 0), 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cashbook Ledger</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&family=Courier+Prime&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Arial, sans-serif; 
      background: white; 
      color: #111; 
      padding: 30px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #000;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    .doc-title {
      font-size: 16px;
      color: #444;
      font-weight: bold;
    }
    .print-meta {
      font-size: 12px;
      color: #666;
      text-align: right;
      margin-top: 10px;
    }

    /* Ledger Table Design */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    th {
      border: 1px solid #000;
      padding: 10px;
      background-color: #f0f0f0;
      text-transform: uppercase;
      font-weight: bold;
      text-align: center;
      font-size: 11px;
    }
    td {
      border: 1px solid #aaa;
      padding: 8px 10px;
      vertical-align: top;
    }
    
    /* Simulate notebook lines */
    tbody tr:nth-child(even) { background-color: #fcfcfc; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .totals-row td {
      border: 2px solid #000;
      background-color: #e5e5e5;
      font-weight: bold;
      font-size: 13px;
    }

    .summary-box {
      float: right;
      width: 300px;
      border: 2px solid #000;
      padding: 15px;
      background: #fafafa;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .summary-row.net {
      border-top: 1px solid #000;
      padding-top: 8px;
      font-weight: bold;
      font-size: 16px;
    }

    .clearfix::after {
      content: "";
      clear: both;
      display: table;
    }

    @page { margin: 15mm; size: A4 portrait; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; } 
      th { background-color: #f0f0f0 !important; }
      .totals-row td { background-color: #e5e5e5 !important; }
      .summary-box { background: #fafafa !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">SUTANA ENTERPRISE</div>
    <div class="doc-title">CASHBOOK LEDGER</div>
    <div class="print-meta">
      Period: ${dateFrom ? new Date(dateFrom).toLocaleDateString() : 'Start'} to ${dateTo ? new Date(dateTo).toLocaleDateString() : 'Current'}<br/>
      Printed on: ${new Date().toLocaleString('en-GB')}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th width="10%">Date</th>
        <th width="8%">Type</th>
        <th width="15%">Reference</th>
        <th width="35%">Particulars / Description</th>
        <th width="12%">Income (In)</th>
        <th width="12%">Out (Pay)</th>
        <th width="12%">Net Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('\\n')}
      <tr class="totals-row">
        <td colspan="4" class="text-right">TOTALS:</td>
        <td class="text-right" style="color: #16a34a;">${fmt2(totalIn)}</td>
        <td class="text-right" style="color: #dc2626;">${fmt2(totalOut)}</td>
        <td class="text-right"></td>
      </tr>
    </tbody>
  </table>

  <div class="clearfix">
    <div class="summary-box">
      <div class="summary-row">
        <span>Total Income:</span>
        <span style="color: #16a34a;">ETB ${fmt2(totalIn)}</span>
      </div>
      <div class="summary-row">
        <span>Total Payments:</span>
        <span style="color: #dc2626;">ETB ${fmt2(totalOut)}</span>
      </div>
      <div class="summary-row net">
        <span>Net Balance:</span>
        <span style="color: ${totalIn - totalOut >= 0 ? '#000' : '#dc2626'};">ETB ${fmt2(totalIn - totalOut)}</span>
      </div>
    </div>
  </div>

</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=1100');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  // Running balance
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalReceipts  = filtered.reduce((a, e) => a + e.receipts, 0);
  const totalPayments  = filtered.reduce((a, e) => a + e.payments, 0);

  const fmt = v => v.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div style={{ padding: 32, background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
            <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(14,165,233,.3)' }}>
              <Book color="white" size={22} />
            </span>
            Cashbook Master Ledger
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>Central record of all cash receipts and payments</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', color: '#475569', fontWeight: 600, fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
          <button onClick={handlePrintAll}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#0f172a', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: 13 }}>
            <Printer size={15} /> Print All ({filtered.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: '20px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Total Receipts</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>ETB {fmt(totalReceipts)}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{filtered.filter(e => e.receipts > 0).length} entries</div>
          </div>
          <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12 }}><TrendingUp size={22} color="#16a34a" /></div>
        </div>
        <div style={{ background: 'white', padding: '20px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Total Payments</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>ETB {fmt(totalPayments)}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{filtered.filter(e => e.payments > 0).length} entries</div>
          </div>
          <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12 }}><TrendingDown size={22} color="#dc2626" /></div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '20px 24px', borderRadius: 16, boxShadow: '0 8px 20px rgba(15,23,42,.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Net Balance</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalReceipts - totalPayments >= 0 ? '#4ade80' : '#f87171' }}>
              ETB {fmt(totalReceipts - totalPayments)}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{filtered.length} total records</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.08)', padding: 12, borderRadius: 12 }}><DollarSign size={22} color="white" /></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>DATE FROM</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              style={{ width: '100%', padding: '9px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>DATE TO</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              style={{ width: '100%', padding: '9px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>TYPE</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              style={{ width: '100%', padding: '9px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' }}>
              <option value="All">All Types</option>
              <option value="CRV">Cash Receipt (CRV)</option>
              <option value="PV">Payment Voucher</option>
              <option value="PCV">Petty Cash</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>SEARCH</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Reference or description…"
                onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); setSearch(''); setPage(1); }}
            style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '14px 18px', borderRadius: 10, marginBottom: 18, border: '1px solid #fecaca', fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderBottom: '2px solid #e2e8f0' }}>
              {['Date', 'Type', 'Reference', 'Description', 'Receipts (In)', 'Payments (Out)', 'Balance', ''].map((col, i) => (
                <th key={i} style={{ padding: '14px 16px', textAlign: ['Receipts (In)', 'Payments (Out)', 'Balance'].includes(col) ? 'right' : 'left', color: '#475569', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                Loading cashbook data…
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <Book size={40} style={{ opacity: 0.15, margin: '0 auto 12px', display: 'block' }} />
                {entries.length === 0 ? 'No transactions yet. Create a CRV to get started.' : 'No results match your filters.'}
              </td></tr>
            ) : paginated.map((entry, idx) => {
              const isEven = idx % 2 === 0;
              const hasRecord = (entry.type === 'CRV' || entry.type === 'PV' || entry.type === 'PCV') && recordMap[entry.reference];
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', background: isEven ? 'white' : '#fafbfc', transition: 'background .15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f0f9ff')}
                  onMouseOut={e => (e.currentTarget.style.background = isEven ? 'white' : '#fafbfc')}>
                  <td style={{ padding: '13px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      background: entry.type === 'CRV' ? '#dcfce7' : entry.type === 'PV' ? '#fee2e2' : entry.type === 'PCV' ? '#fefce8' : '#fef9c3',
                      color: entry.type === 'CRV' ? '#15803d' : entry.type === 'PV' ? '#dc2626' : entry.type === 'PCV' ? '#a16207' : '#a16207',
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
                    }}>{entry.type}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0ea5e9', fontSize: 12 }}>{entry.reference}</td>
                  <td style={{ padding: '13px 16px', color: '#334155', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {entry.receipts > 0 ? `+ ${fmt(entry.receipts)}` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    {entry.payments > 0 ? `- ${fmt(entry.payments)}` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: entry.balance >= 0 ? '#0f172a' : '#dc2626', fontSize: 13 }}>
                    {fmt(entry.balance)}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                    {hasRecord && (
                      <button onClick={() => setSelectedRecord(hasRecord)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 7, cursor: 'pointer', color: '#0284c7', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Eye size={13} /> View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: '6px 11px', border: `1px solid ${p === page ? '#0ea5e9' : '#e2e8f0'}`, borderRadius: 6, background: p === page ? '#0ea5e9' : 'white', color: p === page ? 'white' : '#475569', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: 13 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedRecord && <DocumentModal doc={selectedRecord} onClose={() => setSelectedRecord(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FinanceCashBook;
