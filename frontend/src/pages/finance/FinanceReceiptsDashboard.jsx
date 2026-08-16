import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { amountInWordsBirr } from '../../utils/amountInWords';
import styles from './FinanceReceiptsDashboard.module.css';

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

/* ── Exact-form document modal (Sales Invoice + Sales Receipt) ─────────── */
const DocStyles = {
  sheet: { maxWidth: 720, margin: '0 auto', background: '#fff', padding: '28px 32px', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif", color: '#111827' },
  brand: { textAlign: 'center', marginBottom: 2 },
  brandName: { fontSize: 20, fontWeight: 700, letterSpacing: 0.5, margin: 0 },
  brandSub: { fontSize: 12, color: '#6B7280', margin: '2px 0 0' },
  title: { textAlign: 'center', fontSize: 20, fontWeight: 800, letterSpacing: 3, margin: '14px 0 16px' },
  metaRow: { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, margin: '3px 0' },
  fieldLabel: { color: '#6B7280', fontWeight: 600 },
  dotted: { borderBottom: '1px dotted #111827', fontWeight: 600, padding: '0 4px' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '14px 0', fontSize: 13 },
  th: { border: '1px solid #111827', padding: '6px 8px', textAlign: 'left', fontWeight: 700 },
  thR: { border: '1px solid #111827', padding: '6px 8px', textAlign: 'right', fontWeight: 700 },
  td: { border: '1px solid #111827', padding: '6px 8px' },
  tdR: { border: '1px solid #111827', padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  totals: { width: '100%', fontSize: 13, margin: '6px 0 4px' },
  totalRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, margin: '2px 0' },
  totalLabel: { color: '#6B7280', fontWeight: 600, width: 180, textAlign: 'right' },
  totalVal: { fontWeight: 600, width: 150, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  grandRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, margin: '4px 0', borderTop: '2px solid #111827', paddingTop: 6 },
  grandLabel: { fontWeight: 800, width: 180, textAlign: 'right' },
  grandVal: { fontWeight: 800, width: 150, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  line: { border: 'none', borderTop: '1px solid #111827', margin: '10px 0' },
  sigRow: { display: 'flex', justifyContent: 'space-between', gap: 32, marginTop: 30, fontSize: 13, fontWeight: 600 },
  sigLine: { borderBottom: '1px solid #111827', padding: '0 18px 4px' },
  words: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }
};

const SalesInvoiceForm = ({ doc, company }) => (
  <div className="invoice-sheet" style={DocStyles.sheet}>
    <div style={DocStyles.brand}>
      <h2 style={DocStyles.brandName}>{company.name || 'Company Name'}</h2>
      <p style={DocStyles.brandSub}>
        {[company.address, company.phone, company.tin ? `TIN: ${company.tin}` : '', company.vatReg ? `VAT Reg. No: ${company.vatReg}` : '']
          .filter(Boolean).join(' | ') || 'Address | Phone | TIN'}
      </p>
    </div>
    <div style={DocStyles.title}>SALES INVOICE</div>

    <div style={DocStyles.metaRow}>
      <div>Invoice No: <span style={DocStyles.dotted}>{doc.invoiceNo || '-'}</span></div>
      <div>Date: <span style={DocStyles.dotted}>{fmtDate(doc.date)}</span></div>
    </div>
    <div style={DocStyles.metaRow}>
      <div>Customer: <span style={DocStyles.dotted}>{doc.customer || 'Walk-in Customer'}</span></div>
      <div>Customer TIN: <span style={DocStyles.dotted}>{doc.customerTin || '__________'}</span></div>
    </div>

    <table style={DocStyles.table}>
      <thead>
        <tr>
          <th style={DocStyles.th}>Item</th>
          <th style={DocStyles.thR}>Qty</th>
          <th style={DocStyles.thR}>Unit Price</th>
          <th style={DocStyles.thR}>VAT</th>
          <th style={DocStyles.thR}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {(doc.items || []).map((it, i) => (
          <tr key={i}>
            <td style={DocStyles.td}>{it.name}</td>
            <td style={DocStyles.tdR}>{it.qty}</td>
            <td style={DocStyles.tdR}>{Number(it.unitPrice).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
            <td style={DocStyles.tdR}>{Number(it.vat).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
            <td style={DocStyles.tdR}>{Number(it.amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={DocStyles.totals}>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>Subtotal:</span><span style={DocStyles.totalVal}>{fmt(doc.subtotal)}</span></div>
      <div style={DocStyles.totalRow}>
        <span style={DocStyles.totalLabel}>VAT {Math.round((doc.vatStandardRate || 0.15) * 100)}%:</span>
        <span style={DocStyles.totalVal}>{fmt(doc.vatStandard)}</span>
      </div>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>VAT Exempt:</span><span style={DocStyles.totalVal}>{fmt(doc.vatExempt)}</span></div>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>VAT Zero-rated:</span><span style={DocStyles.totalVal}>{fmt(doc.vatZeroRated)}</span></div>
      <div style={DocStyles.grandRow}><span style={DocStyles.grandLabel}>TOTAL:</span><span style={DocStyles.grandVal}>{fmt(doc.total)}</span></div>
    </div>

    <hr style={DocStyles.line} />
    <div style={DocStyles.metaRow}>
      <div>Payment Method: <span style={DocStyles.dotted}>{doc.paymentMethod || 'Cash / Bank / Other'}</span></div>
    </div>
    <div style={DocStyles.metaRow}>
      <div>Amount Paid: <span style={DocStyles.dotted}>{fmt(doc.amountPaid)}</span></div>
      <div>Balance: <span style={DocStyles.dotted}>{fmt(doc.balance)}</span></div>
    </div>

    <div style={DocStyles.sigRow}>
      <div>Seller: <span style={DocStyles.sigLine}>{doc.seller || '___________'}</span></div>
      <div>Customer: <span style={DocStyles.sigLine}>___________</span></div>
    </div>
  </div>
);

const SalesReceiptForm = ({ doc, company }) => (
  <div className="receipt-sheet" style={DocStyles.sheet}>
    <div style={DocStyles.brand}>
      <h2 style={DocStyles.brandName}>{company.name || 'Company Name'}</h2>
      <p style={DocStyles.brandSub}>
        {[company.address, company.phone, company.tin ? `TIN: ${company.tin}` : ''].filter(Boolean).join(' | ') || 'Address | Phone | TIN'}
      </p>
    </div>
    <div style={DocStyles.title}>RECEIPT</div>

    <div style={DocStyles.metaRow}>
      <div>Receipt No: <span style={DocStyles.dotted}>{doc.receiptNo || '-'}</span></div>
      <div>Date: <span style={DocStyles.dotted}>{fmtDate(doc.date)}</span></div>
    </div>
    <div style={DocStyles.metaRow}>
      <div>Customer: <span style={DocStyles.dotted}>{doc.customer || 'Walk-in Customer'}</span></div>
      <div>Invoice No: <span style={DocStyles.dotted}>{doc.invoiceNo || '-'}</span></div>
    </div>

    <div style={DocStyles.metaRow}>
      <div>Description: <span style={DocStyles.dotted}>{doc.description || 'Payment for goods/services'}</span></div>
    </div>

    <hr style={DocStyles.line} />
    <div style={DocStyles.totals}>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>Amount Due:</span><span style={DocStyles.totalVal}>{fmt(doc.total)}</span></div>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>Amount Paid:</span><span style={DocStyles.totalVal}>{fmt(doc.amountPaid)}</span></div>
      <div style={DocStyles.totalRow}><span style={DocStyles.totalLabel}>Balance:</span><span style={DocStyles.totalVal}>{fmt(doc.balance)}</span></div>
    </div>
    <div style={DocStyles.metaRow}>
      <div>Payment Method: <span style={DocStyles.dotted}>{doc.paymentMethod || 'Cash'}</span></div>
    </div>
    <hr style={DocStyles.line} />

    <div style={DocStyles.totalRow}>
      <span style={DocStyles.totalLabel}>Amount Received:</span>
      <span style={DocStyles.words}>{amountInWordsBirr(doc.amountPaid)}</span>
    </div>

    <div style={DocStyles.sigRow}>
      <div>Received By: <span style={DocStyles.sigLine}>{doc.receivedBy || '___________'}</span></div>
    </div>
  </div>
);

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
            <p className={styles.modalSub}>Sale → Invoice → Payment → Receipt (linked)</p>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.tabBtn} onClick={() => setTab('invoice')} style={tab === 'invoice' ? { background: '#2563EB', color: '#fff', borderColor: '#2563EB' } : {}}>Sales Invoice</button>
            <button className={styles.tabBtn} onClick={() => setTab('receipt')} style={tab === 'receipt' ? { background: '#16A34A', color: '#fff', borderColor: '#16A34A' } : {}}>Sales Receipt</button>
            <button className={styles.printBtn} onClick={() => window.print()}>🖨️ Print</button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.printArea}>
            {tab === 'invoice' ? <SalesInvoiceForm doc={doc} company={company} /> : <SalesReceiptForm doc={doc} company={company} />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────────── */
const FinanceReceiptsDashboard = () => {
  const [agg, setAgg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [company, setCompany] = useState({ name: '', address: '', phone: '', tin: '', vatReg: '' });
  const [companyDraft, setCompanyDraft] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const saveCompany = async () => {
    setSavingCompany(true);
    try {
      const res = await api.put('/finance/company-info', companyDraft);
      const c = res?.data?.company || {};
      setCompany(c);
      setCompanyDraft(c);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save company info');
    }
    setSavingCompany(false);
  };

  const summary = agg?.summary || {};
  const generatedAt = agg?.generatedAt ? new Date(agg.generatedAt) : null;

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>
            Invoices & Receipts <span className={styles.welcomeEmoji}>🧾</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Sales → Invoice → Payment → Receipt · All modules (Online + Walk-in) · 2 Tenders · Only paid/completed
            {generatedAt && <> · Updated {generatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>}
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
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Total Invoices</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-info-bg)' }}>📄</span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.blue }}>{Number(summary.totalInvoices || 0).toLocaleString()}</div>
          <div className={styles.kpiMeta}>Orders issued across all modules</div>
          <div className={styles.kpiSub}>Retail · Pharmacy · Printing · Rental · AgriRent · Tenders</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Total Receipts</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-success-bg)' }}>🧾</span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.forest }}>{Number(summary.totalReceipts || 0).toLocaleString()}</div>
          <div className={styles.kpiMeta}>Payments received</div>
          <div className={styles.kpiSub}>Paid / verified / confirmed</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCardHero}`}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Total Price Value</span>
            <span className={styles.kpiIconHero}>💰</span>
          </div>
          <div className={styles.kpiHeroValue}>{fmt(summary.totalValue)}</div>
          <div className={styles.kpiHeroMeta}>
            <span>{fmtShort(summary.totalValue)}</span>
            <span>{Number(summary.totalInvoices || 0)} invoices</span>
          </div>
          <div className={styles.kpiHeroFoot}>Sum of all paid/completed values</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Online vs Walk-in</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-warning-bg)' }}>🌐</span>
          </div>
          <div className={styles.channelRow}>
            <span className={styles.channelDot} style={{ background: G.sky }} />
            <span className={styles.channelLabel}>Online</span>
            <span className={styles.channelVal}>{fmtShort(summary.online?.value || 0)}</span>
            <span className={styles.channelCount}>{Number(summary.online?.invoices || 0)} invoices</span>
          </div>
          <div className={styles.channelRow}>
            <span className={styles.channelDot} style={{ background: G.orange }} />
            <span className={styles.channelLabel}>Walk-in</span>
            <span className={styles.channelVal}>{fmtShort(summary.walkIn?.value || 0)}</span>
            <span className={styles.channelCount}>{Number(summary.walkIn?.invoices || 0)} invoices</span>
          </div>
          <div className={styles.kpiSub}>Channel split where recorded (Retail, Pharmacy, AgriRent)</div>
        </div>
      </div>

      {/* ── ROW 2: COMPANY PROFILE + DOCUMENTS ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}>🏢</span>
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
            <button className={styles.saveBtn} onClick={saveCompany} disabled={savingCompany}>
              {savingCompany ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 3: DOCUMENT LIST ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}>📊</span>
          <h3 className={styles.cardTitle}>Sales Invoices & Receipts</h3>
          <span className={styles.cardSub}>{docs.length} documents · click to view</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tHead}>
            <span>Module / Document</span>
            <span style={{ textAlign: 'center' }}>Invoice No</span>
            <span style={{ textAlign: 'center' }}>Receipt No</span>
            <span style={{ textAlign: 'center' }}>Date</span>
            <span style={{ textAlign: 'right' }}>Total</span>
            <span style={{ textAlign: 'right' }}>Paid</span>
            <span style={{ textAlign: 'right' }}>Balance</span>
          </div>

          {docs.length === 0 ? (
            <div className={styles.empty}>No paid/completed documents yet — connect to backend</div>
          ) : docs.map((d) => (
            <div key={d.id} className={styles.tRow} onClick={() => setSelected(d)}>
              <span className={styles.moduleName}>
                <span className={styles.moduleIcon} style={{ background: (d.color || G.darkGray) + '1A', color: d.color }}>{d.icon}</span>
                <span className={styles.moduleLabel}>{d.sourceLabel}</span>
              </span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{d.invoiceNo}</span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{d.receiptNo}</span>
              <span className={styles.num} style={{ textAlign: 'center' }}>{fmtDate(d.date)}</span>
              <span className={styles.num} style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(d.total)}</span>
              <span className={styles.num} style={{ textAlign: 'right' }}>{fmt(d.amountPaid)}</span>
              <span className={styles.num} style={{ textAlign: 'right', color: d.balance !== 0 ? G.orange : 'inherit' }}>{fmt(d.balance)}</span>
            </div>
          ))}
        </div>

        <div className={styles.note}>
          Every sale produces one linked Sales Invoice (sale details + per-item tax treatment) and one Sales Receipt
          (proof of payment against that invoice): Sale ID → Invoice ID → Payment ID → Receipt ID — no double counting.
          VAT is shown per item using the applicable treatment (Standard / Exempt / Zero-rated) from the tax configuration,
          never a hard-coded 15% for every item.
        </div>
      </div>

      {selected && <DocumentModal doc={selected} company={company} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default FinanceReceiptsDashboard;
