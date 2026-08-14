import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { triggerNotification } from '../../utils/ceoNotifications';
import {
  TrendingUp, Download, Search, CheckCircle2, AlertCircle,
  Calendar, Building, DollarSign, Filter, RefreshCw, Layers, FileText,
  ArrowLeft, Printer, User, Phone, Package, CreditCard, Hash, Smartphone, Eye, X
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const fmt = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
const fmtD = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── In-App Toast ─────────────────────────────────────────────── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: t.type === 'success' ? 'var(--color-success)' : t.type === 'error' ? 'var(--color-danger)' : 'var(--color-warning)',
        color: 'white', padding: '12px 16px', borderLeft: '4px solid rgba(255,255,255,0.5)',
        minWidth: 280, maxWidth: 420, fontWeight: 500, fontSize: 14,
        borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', animation: 'rorSlideIn .25s ease'
      }}>
        <span style={{ flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} className="ror-toast-close" style={{ padding: 4 }}><X size={16} /></button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, show, remove };
};

/* ─── Receivable Detail View ────────────────────────────────────────── */
const ReceivableDetailView = ({ receivableId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/finance-receivables/book/${receivableId}/detail`);
        setDetail(res?.data || null);
      } catch (e) {
        setError(e.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [receivableId]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Receivable Detail</title>
      <style>
        @page { margin: 15mm; size: A4; }
        body { font-family: 'Times New Roman', serif; color: #000; margin: 0; }
        h1,h2,h3 { margin: 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1B5E20; color: white; border: 1px solid #1B5E20; padding: 7px 10px; font-size: 11px; text-align: left; }
        td { border: 1px solid #A5D6A7; padding: 7px 10px; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (loading) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      <SegmentedSpinner size={32} />
      <div style={{ fontSize: 16, fontWeight: 500 }}>Loading record details...</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 8, margin: 24, color: 'var(--color-danger)', fontWeight: 600 }}>
      Error: {error}
    </div>
  );

  const { receivable, transactions, systemTotal, transactionCount: rawTxCount } = detail;
  const transactionCount = rawTxCount > 0 ? rawTxCount : (receivable.manual_details ? 1 : 0);
  let manualDetails = null;
  if (receivable.manual_details) {
    try { manualDetails = JSON.parse(receivable.manual_details); } catch (e) {}
  }

  let runningTotal = [];
  if (transactions && transactions.length > 0) {
    runningTotal = transactions.reduce((acc, t) => {
      acc.push((acc.length ? acc[acc.length - 1] : 0) + parseFloat(t.total_amount || 0));
      return acc;
    }, []);
  }

  return (
    <div style={{ width: '100%', padding: '0 0 40px', boxSizing: 'border-box' }}>
      {/* Detail Nav Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={onBack} className="ror-btn-outline">
          <ArrowLeft size={15} /> Back to Ledger
        </button>
        <button onClick={handlePrint} className="ror-btn-primary">
          <Printer size={14} /> Print Detail
        </button>
      </div>

      <div ref={printRef}>
        {/* ── Header Block ── */}
        <div className="ror-card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          {receivable.status === 'Paid' && (
            <div style={{ position: 'absolute', top: 20, right: -36, background: '#16A34A', color: 'white', fontWeight: 700, padding: '6px 52px', transform: 'rotate(45deg)', fontSize: 12, letterSpacing: 2 }}>
              SETTLED
            </div>
          )}

          <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#111827', textTransform: 'uppercase' }}>Sutana Enterprise</div>
              <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Revenue Book — Official Record</div>
            </div>
            <div style={{ textAlign: 'right', paddingRight: receivable.status === 'Paid' ? 60 : 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#2563EB', letterSpacing: 2 }}>{receivable.invoice_no}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Recorded Entry</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#2563EB', marginBottom: 18, textAlign: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
            {receivable.department_source} Department — Recorded Income
          </div>

          <div className="ror-meta-grid">
            {[
              { label: 'Customer / Source', value: receivable.customer_name, icon: <Building size={13} /> },
              { label: 'Record Date', value: fmtD(receivable.invoice_date), icon: <Calendar size={13} /> },
              { label: 'Total Settled', value: `ETB ${fmt(receivable.amount_paid)}`, icon: <CheckCircle2 size={13} />, highlight: receivable.status === 'Paid' },
              { label: 'Total Amount', value: `ETB ${fmt(receivable.total_amount)}`, icon: <DollarSign size={13} />, highlight: true },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} style={{ background: highlight ? '#DCFCE7' : '#F5F6FA', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: highlight ? 17 : 14, fontWeight: 700, color: highlight ? '#16A34A' : '#111827' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction Breakdown ── */}
        {transactions && transactions.length > 0 && (
          <div className="ror-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <FileText size={16} color="#2563EB" /> Transaction Breakdown ({transactionCount} Records)
            </div>

            {transactions.map((txn, idx) => {
              const typeColor = txn.sale_type === 'RETURNED' ? '#DC2626' : '#16A34A';
              return (
                <div key={txn.id} style={{ marginBottom: idx < transactions.length - 1 ? 20 : 0 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#2563EB', color: 'white', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, borderRadius: '50%' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563EB', fontSize: 14 }}>{txn.receipt_no}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{fmtDateTime(txn.created_at)}</div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 12, fontWeight: 500, color: typeColor, border: '1px solid', borderColor: typeColor, background: `${typeColor}18`, borderRadius: 999 }}>
                          {txn.sale_type}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: typeColor, fontVariantNumeric: 'tabular-nums' }}>
                          {txn.sale_type === 'RETURNED' ? '−' : ''}ETB {fmt(txn.total_amount)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Running total: ETB {fmt(runningTotal[idx])}</div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="ror-pay-grid" style={{ marginBottom: 10 }}>
                      {(() => {
                        const base = [
                          { icon: <Building size={11} />, label: 'Branch', value: txn.branch_name || '—' },
                          { icon: <User size={11} />, label: 'Cashier', value: txn.worker_name || '—', highlight: true },
                          { icon: <Package size={11} />, label: 'Total Items', value: txn.total_products },
                          { icon: <CreditCard size={11} />, label: 'Payment Method', value: txn.payment_method || 'CASH' }
                        ];
                        if (txn.payment_method === 'BANK_TRANSFER') {
                          base.push(
                            { icon: <Building size={11} />, label: 'Bank Name', value: txn.bank_name || '—' },
                            { icon: <User size={11} />, label: 'Account Holder', value: txn.account_holder || '—' },
                            { icon: <Hash size={11} />, label: 'Account Number', value: txn.account_number || '—' },
                            { icon: <User size={11} />, label: 'Sender Name', value: txn.pp_recipient_name || txn.recipient_name || '—' },
                            { icon: <Phone size={11} />, label: 'Sender Phone', value: txn.pp_recipient_phone || txn.recipient_phone || '—' }
                          );
                        } else if (txn.payment_method === 'TELBIR') {
                          base.push(
                            { icon: <Smartphone size={11} />, label: 'Telebirr Number', value: txn.telbir_number || '—' },
                            { icon: <User size={11} />, label: 'Sender Name', value: txn.pp_recipient_name || txn.recipient_name || '—' },
                            { icon: <Phone size={11} />, label: 'Sender Phone', value: txn.pp_recipient_phone || txn.recipient_phone || '—' }
                          );
                        } else {
                          base.push(
                            { icon: <User size={11} />, label: 'Cash Given By', value: txn.pp_recipient_name || txn.recipient_name || '—' },
                            { icon: <Phone size={11} />, label: 'Phone', value: txn.pp_recipient_phone || txn.recipient_phone || '—' }
                          );
                        }
                        return base;
                      })().map(({ icon, label, value, highlight }) => (
                        <div key={label} style={{ background: highlight ? '#DCFCE7' : '#F5F6FA', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: highlight ? '#16A34A' : '#9CA3AF', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{icon} {label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Items table */}
                    {txn.items && txn.items.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600, fontVariantNumeric: 'tabular-nums' }}>
                          <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                              {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: '#6B7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txn.items.map((item, i) => (
                              <tr key={i} className="ror-table-row" style={{ borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
                                <td style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 11 }}>{i + 1}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{item.drug_name}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{fmt(item.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {idx < transactions.length - 1 && <hr style={{ border: 'none', borderTop: '1px dashed #E5E7EB', margin: '16px 0' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Manual Details ── */}
        {manualDetails && (
          <div className="ror-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <FileText size={16} color="#2563EB" /> Manual Submission Details
            </div>

            <div className="ror-meta-grid" style={{ marginBottom: 18 }}>
              <div style={{ background: '#F5F6FA', padding: 16, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Payment Method</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{manualDetails.paymentMethod}</div>
              </div>
              <div style={{ background: '#F5F6FA', padding: 16, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Received From</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{manualDetails.receivedFrom || '—'}</div>
              </div>
              <div style={{ background: '#DCFCE7', padding: 16, border: '1px solid #16A34A', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#16A34A' }}>ETB {fmt(manualDetails.amount || receivable.total_amount)}</div>
              </div>
            </div>

            {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
              <div style={{ background: '#E0F2FE', padding: 18, border: '1px solid #0284C7', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0284C7', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Bank Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#111827' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                  <div><strong style={{ color: '#111827' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                  <div><strong style={{ color: '#111827' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                  {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#111827' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                </div>
              </div>
            )}

            {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
              <div style={{ background: '#FEF3C7', padding: 18, border: '1px solid #D97706', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#D97706', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Telebirr Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#111827' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                  <div><strong style={{ color: '#111827' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                </div>
              </div>
            )}

            {manualDetails.contractDetails && (
              <div style={{ background: '#F5F6FA', padding: 18, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <Building size={16} color="#2563EB" /> Contract & Asset Summary
                </div>
                {manualDetails.contractDetails.carName ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div><strong style={{ color: '#6B7280' }}>Vehicle:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.carName}</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Driver:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.driverName} ({manualDetails.contractDetails.driverLicense})</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Duration:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.totalDays} Days ({manualDetails.contractDetails.dates})</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Daily Rate:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>ETB {Number(manualDetails.contractDetails.dailyRate || 0).toLocaleString()}</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Rental Total:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>ETB {Number(manualDetails.contractDetails.rentalAmount || 0).toLocaleString()}</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Deposit:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>ETB {Number(manualDetails.contractDetails.securityDeposit || 0).toLocaleString()}</span></div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div><strong style={{ color: '#6B7280' }}>Location:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.location}</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Area:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.hectares} Hectares</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Operation:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.purpose}</span></div>
                    <div><strong style={{ color: '#6B7280' }}>Duration:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{manualDetails.contractDetails.days} Days ({manualDetails.contractDetails.dates})</span></div>
                  </div>
                )}
              </div>
            )}

            {(manualDetails.paymentReference || manualDetails.proofImagePath) && (
              <div style={{ background: '#F5F6FA', padding: 18, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Online Payment Verification
                </div>
                {manualDetails.paymentReference && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Transaction ID / Reference</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                  </div>
                )}
                {manualDetails.proofImagePath && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Attached Payment Proof</div>
                    <img
                      src={`http://localhost:5000/${manualDetails.proofImagePath}`}
                      alt="Payment Proof"
                      style={{ maxWidth: '100%', maxHeight: 400, border: '1px solid #E5E7EB', borderRadius: 8 }}
                    />
                  </div>
                )}
              </div>
            )}

            {(() => {
              const hasWalkInSigs = manualDetails.preparedSignature || manualDetails.checkedSignature || manualDetails.receiverSignature;
              if (!hasWalkInSigs && !manualDetails.financeSignature) return null;
              return (
                <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: 20, marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Signatures</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    {hasWalkInSigs && [
                      { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                      { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                      { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                    ].map(({ label, name, sigImage }) => (
                      <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 80, border: '1px solid #E5E7EB', marginBottom: 8, overflow: 'hidden', background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                          {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#9CA3AF', fontSize: 11 }}>No signature</span>}
                        </div>
                        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
                        </div>
                      </div>
                    ))}

                    {manualDetails.financeSignature && (
                      <div style={{ flex: 1, textAlign: 'center', background: '#DCFCE7', padding: 10, border: '1px solid #16A34A', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Verified & Approved By (Finance)</div>
                        <div style={{ height: 80, border: '1px solid #E5E7EB', marginBottom: 8, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                          {typeof manualDetails.financeSignature === 'string' && manualDetails.financeSignature.length > 5 ? (
                            <img src={manualDetails.financeSignature} alt="Finance Signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: 18, color: '#16A34A', fontWeight: 600 }}>
                              System Verified ✓
                            </div>
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #16A34A', paddingTop: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{manualDetails.financeName || 'Finance Officer'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};


/* ─── Main Component ────────────────────────────────────────────── */
const FinanceOutstandingReceivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, show, remove } = useToast();

  // Navigation State
  const [view, setView] = useState('list');
  const [detailId, setDetailId] = useState(null);

  // Filters
  const [customerFilter, setCustomerFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadReceivables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/finance-receivables/book');
      setReceivables(res?.data || []);
      show('Revenue book refreshed.', 'success');
    } catch (e) {
      console.error('Receivables fetch error:', e);
      show('Failed to load revenue book.', 'error');
      triggerNotification('Error', 'Failed to load receivables book.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      loadReceivables();
    }
  }, [view, loadReceivables]);

  // Process data
  const today = new Date();
  const processed = useMemo(() => {
    return receivables.map(inv => {
      const dueDate = new Date(inv.due_date);
      const diffTime = today - dueDate;
      const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
      return { ...inv, daysOverdue };
    });
  }, [receivables, today]);

  const uniqueCustomers = useMemo(() => [...new Set(processed.map(r => r.customer_name))].sort(), [processed]);

  const filtered = useMemo(() => {
    return processed.filter(inv => {
      const matchCust = customerFilter === 'All' || inv.customer_name === customerFilter;
      let matchAging = true;
      if (agingFilter === '0-30') matchAging = inv.daysOverdue >= 0 && inv.daysOverdue <= 30;
      if (agingFilter === '31-60') matchAging = inv.daysOverdue > 30 && inv.daysOverdue <= 60;
      if (agingFilter === '61-90') matchAging = inv.daysOverdue > 60 && inv.daysOverdue <= 90;
      if (agingFilter === '>90') matchAging = inv.daysOverdue > 90;
      const matchSearch = (inv.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCust && matchAging && matchSearch;
    });
  }, [processed, customerFilter, agingFilter, searchQuery]);

  const totalOutstanding = filtered.reduce((s, r) => s + parseFloat(r.outstanding_balance || 0), 0);
  const totalPaid = filtered.reduce((s, r) => s + parseFloat(r.amount_paid || 0), 0);
  const totalInvoiced = filtered.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);

  return (
    <div className="ror-page">
      <Toast toasts={toasts} remove={remove} />

      {/* ── Main Padding Wrapper ── */}
      <div style={{ boxSizing: 'border-box' }}>

        {view === 'detail' ? (
          <ReceivableDetailView receivableId={detailId} onBack={() => { setView('list'); setDetailId(null); }} />
        ) : (
          <>
            {/* ── PAGE HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--color-primary)', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                    <Layers size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Revenue Book</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 400, marginTop: 2 }}>
                      Master ledger for all company income, approved transactions, and settled accounts.
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="ror-btn-outline" onClick={loadReceivables}>
                  <RefreshCw size={15} /> Refresh
                </button>
                <button className="ror-btn-primary">
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="ror-kpi-grid">
              {[
                { title: 'Total Invoiced', value: totalInvoiced, icon: <FileText size={22} color="#FFFFFF" />, accent: 'var(--color-primary)', bg: '#EFF6FF' },
                { title: 'Total Settled / Paid', value: totalPaid, icon: <CheckCircle2 size={22} color="#FFFFFF" />, accent: 'var(--color-success)', bg: 'var(--color-success-bg)', textColor: 'var(--color-success)' },
                { title: 'Total Outstanding', value: totalOutstanding, icon: <TrendingUp size={22} color="#FFFFFF" />, accent: 'var(--color-warning)', bg: 'var(--color-warning-bg)', textColor: 'var(--color-warning)' },
                { title: 'Recorded Entries', value: filtered.length, icon: <Layers size={22} color="#FFFFFF" />, accent: 'var(--color-info)', bg: 'var(--color-info-bg)', isCount: true, textColor: 'var(--color-info)' },
              ].map((kpi, i) => (
                <div key={i} className="ror-kpi-card" style={{ background: kpi.bg, borderLeft: `4px solid ${kpi.accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 10, background: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                      {kpi.icon}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: kpi.textColor || 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{kpi.title}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: kpi.textColor || 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {!kpi.isCount && <span style={{ fontSize: 15, color: kpi.textColor || 'var(--color-text-muted)', marginRight: 5, fontWeight: 600 }}>ETB</span>}
                    {kpi.isCount ? kpi.value : fmt(kpi.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* ── FILTERS ── */}
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, marginBottom: 20 }}>
              <div className="ror-filter-grid">
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <Search size={13} /> Search Reference / Source
                  </label>
                  <input
                    type="text"
                    placeholder="Search by invoice # or customer..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="ror-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <Building size={13} /> Source / Department
                  </label>
                  <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="ror-input">
                    <option value="All">All Sources</option>
                    {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <Filter size={13} /> Aging Filter
                  </label>
                  <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} className="ror-input">
                    <option value="All">All Records</option>
                    <option value="0-30">0 - 30 Days</option>
                    <option value="31-60">31 - 60 Days</option>
                    <option value="61-90">61 - 90 Days</option>
                    <option value=">90">Over 90 Days</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => { setCustomerFilter('All'); setAgingFilter('All'); setSearchQuery(''); }} className="ror-btn-clear">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* ── DATA TABLE ── */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)', background: '#fff' }}>
              {loading ? (
                <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <SegmentedSpinner size={32} />
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Loading master ledger...</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ror-table">
                    <thead>
                      <tr>
                        {['Source / Reference', 'Dates', 'Total Amount (ETB)', 'Settled / Paid (ETB)', 'Status', 'Action'].map((h, hi) => (
                          <th key={h} style={{ textAlign: hi >= 2 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ background: 'var(--color-bg-page)', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px dashed var(--color-border)', borderRadius: 10 }}>
                              <Search size={28} color="var(--color-primary)" />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>No records found</div>
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 13 }}>Try adjusting your filters or search query.</div>
                          </td>
                        </tr>
                      ) : filtered.map((inv, rowIdx) => {
                        const isPaid = inv.status === 'Paid';
                        const isOverdue = inv.status === 'Overdue';
                        return (
                          <tr key={inv.id} className="ror-table-row" style={{ background: '#fff' }}>
                            <td style={{ verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14, marginBottom: 6 }}>{inv.customer_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-info)', background: 'var(--color-info-bg)', padding: '2px 10px', fontFamily: 'monospace', borderRadius: 999 }}>
                                  {inv.invoice_no || `REC-ID-${inv.id}`}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500, background: 'var(--color-bg-page)', padding: '2px 10px', borderRadius: 999 }}>
                                  {inv.department_source || 'N/A'}
                                </span>
                              </div>
                            </td>

                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13, verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Calendar size={13} color="var(--color-primary)" />
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, minWidth: 44 }}>Record:</span>
                                {fmtD(inv.invoice_date)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} color="var(--color-text-muted)" />
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, minWidth: 44 }}>Due:</span>
                                {fmtD(inv.due_date)}
                              </div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 15 }}>{fmt(inv.total_amount)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 15 }}>{fmt(inv.amount_paid)}</div>
                            </td>

                            <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: isPaid ? 'var(--color-success-bg)' : isOverdue ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                                color: isPaid ? 'var(--color-success)' : isOverdue ? 'var(--color-danger)' : 'var(--color-warning)',
                                padding: '2px 10px', fontSize: 12, fontWeight: 500,
                                border: `1px solid ${isPaid ? 'var(--color-success)' : isOverdue ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                                borderRadius: 999,
                              }}>
                                {isPaid ? <CheckCircle2 size={13} strokeWidth={3} /> : <AlertCircle size={13} strokeWidth={3} />}
                                {inv.status}
                              </div>
                            </td>

                            <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                              <button
                                onClick={() => { setDetailId(inv.id); setView('detail'); }}
                                className="ror-btn-view"
                              >
                                <Eye size={13} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes ror-spin { 100% { transform: rotate(360deg); } }

        * { box-sizing: border-box; }

        .ror-page {
          --color-primary:#2563EB; --color-primary-hover:#1D4ED8;
          --color-bg-page:#F5F6FA; --color-bg-card:#FFFFFF; --color-border:#E5E7EB;
          --color-text-primary:#111827; --color-text-secondary:#6B7280; --color-text-muted:#9CA3AF;
          --color-success:#16A34A; --color-success-bg:#DCFCE7;
          --color-danger:#DC2626; --color-danger-bg:#FEE2E2;
          --color-warning:#D97706; --color-warning-bg:#FEF3C7;
          --color-info:#0284C7; --color-info-bg:#E0F2FE;
          --color-gold:#F59E0B; --color-gold-text:#1F2937;
          width: 100%;
          min-height: 100vh;
          background: var(--color-bg-page);
          color: var(--color-text-primary);
          font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          max-width: 1600px;
          margin: 0 auto;
        }
        .ror-page *, .ror-page *::before, .ror-page *::after { box-sizing: border-box; }
        .ror-page h1, .ror-page h2, .ror-page h3, .ror-page h4, .ror-page p { line-height: 1.3; }

        .ror-card {
          background: white;
          border: 1px solid var(--color-border);
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06);
          padding: 24px;
          width: 100%;
          transition: box-shadow 150ms ease, transform 150ms ease;
        }
        .ror-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

        .ror-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .ror-pay-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .ror-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .ror-kpi-card {
          padding: 20px;
          border: 1px solid var(--color-border);
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06);
          transition: box-shadow 150ms ease, transform 150ms ease;
        }
        .ror-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

        .ror-filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: end;
        }

        .ror-input {
          width: 100%;
          height: 36px;
          padding: 0 12px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 400;
          background: white;
          color: var(--color-text-primary);
          outline: none;
          font-family: inherit;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .ror-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .ror-table-row {
          transition: background 150ms ease;
        }
        .ror-table-row:hover {
          background: #F9FAFB !important;
        }

        .ror-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          text-align: left;
          font-variant-numeric: tabular-nums;
          min-width: 900px;
        }
        .ror-table thead th {
          background: #F9FAFB;
          color: var(--color-text-secondary);
          padding: 12px 16px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.03em;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .ror-table tbody td { padding: 14px 16px; border-bottom: 1px solid var(--color-border); }

        .ror-btn-primary, .ror-btn-outline, .ror-btn-clear, .ror-btn-view {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 8px;
          height: 36px;
          padding: 0 16px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          border: 1px solid transparent;
          transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
        }
        .ror-btn-primary { background: var(--color-primary); color: white; }
        .ror-btn-primary:hover { background: var(--color-gold); color: var(--color-gold-text); }
        .ror-btn-outline { background: white; color: var(--color-primary); border-color: var(--color-border); }
        .ror-btn-outline:hover { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
        .ror-btn-clear { background: var(--color-bg-page); color: var(--color-text-primary); border-color: var(--color-border); width: 100%; }
        .ror-btn-clear:hover { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
        .ror-btn-view { background: var(--color-primary); color: white; height: 32px; padding: 0 12px; font-size: 13px; }
        .ror-btn-view:hover { background: var(--color-gold); color: var(--color-gold-text); }

        .ror-toast-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 150ms ease, background-color 150ms ease;
        }
        .ror-toast-close:hover { opacity: 1; background: rgba(0,0,0,0.12); }

        @keyframes rorSlideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 1200px) {
          .ror-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .ror-meta-grid { grid-template-columns: repeat(2, 1fr); }
          .ror-filter-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .ror-kpi-grid { grid-template-columns: 1fr; }
          .ror-meta-grid { grid-template-columns: 1fr; }
          .ror-pay-grid { grid-template-columns: repeat(2, 1fr); }
          .ror-filter-grid { grid-template-columns: 1fr; }
          .ror-btn-primary, .ror-btn-outline, .ror-btn-clear, .ror-btn-view, .ror-input { height: 44px; }
        }
        @media (max-width: 480px) {
          .ror-pay-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default FinanceOutstandingReceivables;
