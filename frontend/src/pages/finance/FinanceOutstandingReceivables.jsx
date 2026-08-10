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
        background: t.type === 'success' ? '#228B22' : t.type === 'error' ? '#F44336' : '#FF9800',
        color: 'white', padding: '14px 20px', border: `2px solid ${t.type === 'success' ? '#1B5E20' : t.type === 'error' ? '#D32F2F' : '#E65100'}`,
        minWidth: 280, fontWeight: 700, fontSize: 14
      }}>
        <span style={{ flex: 1 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
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
    <div style={{ padding: '80px 24px', textAlign: 'center', color: '#1B5E20' }}>
      <SegmentedSpinner size={32} />
      <div style={{ fontSize: 16, fontWeight: 700 }}>Loading record details...</div>
      <style>{`@keyframes ror-spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, background: '#FFEBEE', border: '2px solid #F44336', margin: 24, color: '#F44336', fontWeight: 700 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #1B5E20' }}>
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
            <div style={{ position: 'absolute', top: 20, right: -36, background: '#4CAF50', color: 'white', fontWeight: 900, padding: '8px 52px', transform: 'rotate(45deg)', fontSize: 12, letterSpacing: 2 }}>
              SETTLED
            </div>
          )}

          <div style={{ borderBottom: '3px double #1B5E20', paddingBottom: 16, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#1B5E20', textTransform: 'uppercase' }}>Sutana Enterprise</div>
              <div style={{ color: '#424242', fontSize: 13, marginTop: 2 }}>Revenue Book — Official Record</div>
            </div>
            <div style={{ textAlign: 'right', paddingRight: receivable.status === 'Paid' ? 60 : 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#2E8B57', letterSpacing: 2 }}>{receivable.invoice_no}</div>
              <div style={{ fontSize: 12, color: '#6B8E23', marginTop: 4, fontWeight: 700, textTransform: 'uppercase' }}>Recorded Entry</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#228B22', marginBottom: 18, textAlign: 'center', borderBottom: '1px solid #A5D6A7', paddingBottom: 12 }}>
            {receivable.department_source} Department — Recorded Income
          </div>

          <div className="ror-meta-grid">
            {[
              { label: 'Customer / Source', value: receivable.customer_name, icon: <Building size={13} /> },
              { label: 'Record Date', value: fmtD(receivable.invoice_date), icon: <Calendar size={13} /> },
              { label: 'Total Settled', value: `ETB ${fmt(receivable.amount_paid)}`, icon: <CheckCircle2 size={13} />, highlight: receivable.status === 'Paid' },
              { label: 'Total Amount', value: `ETB ${fmt(receivable.total_amount)}`, icon: <DollarSign size={13} />, highlight: true },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} style={{ background: highlight ? '#E8F5E9' : '#F5F5F5', padding: '14px 16px', border: `2px solid ${highlight ? '#228B22' : '#1B5E20'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B8E23', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: highlight ? 17 : 14, fontWeight: 900, color: '#1B5E20' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction Breakdown ── */}
        {transactions && transactions.length > 0 && (
          <div className="ror-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <FileText size={16} color="#228B22" /> Transaction Breakdown ({transactionCount} Records)
            </div>

            {transactions.map((txn, idx) => {
              const typeColor = txn.sale_type === 'RETURNED' ? '#F44336' : '#2E8B57';
              return (
                <div key={txn.id} style={{ marginBottom: idx < transactions.length - 1 ? 20 : 0 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#1B5E20', color: 'white', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#228B22', fontSize: 14 }}>{txn.receipt_no}</div>
                          <div style={{ fontSize: 11, color: '#6B8E23' }}>{fmtDateTime(txn.created_at)}</div>
                        </div>
                        <span style={{ display: 'inline-flex', padding: '3px 10px', fontSize: 11, fontWeight: 700, color: typeColor, border: `2px solid ${typeColor}`, background: `${typeColor}18` }}>
                          {txn.sale_type}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: typeColor }}>
                          {txn.sale_type === 'RETURNED' ? '−' : ''}ETB {fmt(txn.total_amount)}
                        </div>
                        <div style={{ fontSize: 11, color: '#8D6E63' }}>Running total: ETB {fmt(runningTotal[idx])}</div>
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
                        <div key={label} style={{ background: highlight ? '#E8F5E9' : '#F5F5F5', padding: '9px 12px', border: `1px solid ${highlight ? '#228B22' : '#1B5E20'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: highlight ? '#2E8B57' : '#6B8E23', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{icon} {label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1B5E20' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Items table */}
                    {txn.items && txn.items.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '2px solid #1B5E20' }}>
                          <thead>
                            <tr style={{ background: '#1B5E20' }}>
                              {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: 'white', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', border: '1px solid #4CAF50' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txn.items.map((item, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #A5D6A7', background: i % 2 === 0 ? 'white' : '#F1F8E9' }}>
                                <td style={{ padding: '7px 12px', color: '#6B8E23', fontSize: 11, border: '1px solid #A5D6A7' }}>{i + 1}</td>
                                <td style={{ padding: '7px 12px', fontWeight: 700, color: '#1B5E20', border: '1px solid #A5D6A7' }}>{item.drug_name}</td>
                                <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #A5D6A7' }}>{item.quantity}</td>
                                <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #A5D6A7' }}>{fmt(item.unit_price)}</td>
                                <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#2E8B57', border: '1px solid #A5D6A7' }}>{fmt(item.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {idx < transactions.length - 1 && <hr style={{ border: 'none', borderTop: '2px dashed #A5D6A7', margin: '16px 0' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Manual Details ── */}
        {manualDetails && (
          <div className="ror-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <FileText size={16} color="#228B22" /> Manual Submission Details
            </div>

            <div className="ror-meta-grid" style={{ marginBottom: 18 }}>
              <div style={{ background: '#F5F5F5', padding: 16, border: '2px solid #1B5E20' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#1B5E20' }}>{manualDetails.paymentMethod}</div>
              </div>
              <div style={{ background: '#F5F5F5', padding: 16, border: '2px solid #1B5E20' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Received From</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#1B5E20' }}>{manualDetails.receivedFrom || '—'}</div>
              </div>
              <div style={{ background: '#E8F5E9', padding: 16, border: '2px solid #228B22' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#228B22' }}>ETB {fmt(manualDetails.amount || receivable.total_amount)}</div>
              </div>
            </div>

            {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
              <div style={{ background: '#E3F2FD', padding: 18, border: '2px solid #87CEEB', marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 10, textTransform: 'uppercase' }}>Bank Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#1B5E20' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                  {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#1B5E20' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                </div>
              </div>
            )}

            {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
              <div style={{ background: '#FFF8E1', padding: 18, border: '2px solid #FFB74D', marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#E65100', marginBottom: 10, textTransform: 'uppercase' }}>Telebirr Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#1B5E20' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                </div>
              </div>
            )}

            {manualDetails.contractDetails && (
              <div style={{ background: '#F5F5F5', padding: 18, border: '2px solid #1B5E20', marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                  <Building size={16} color="#2E8B57" /> Contract & Asset Summary
                </div>
                {manualDetails.contractDetails.carName ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div><strong style={{ color: '#424242' }}>Vehicle:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.carName}</span></div>
                    <div><strong style={{ color: '#424242' }}>Driver:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.driverName} ({manualDetails.contractDetails.driverLicense})</span></div>
                    <div><strong style={{ color: '#424242' }}>Duration:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.totalDays} Days ({manualDetails.contractDetails.dates})</span></div>
                    <div><strong style={{ color: '#424242' }}>Daily Rate:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>ETB {Number(manualDetails.contractDetails.dailyRate || 0).toLocaleString()}</span></div>
                    <div><strong style={{ color: '#424242' }}>Rental Total:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>ETB {Number(manualDetails.contractDetails.rentalAmount || 0).toLocaleString()}</span></div>
                    <div><strong style={{ color: '#424242' }}>Deposit:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>ETB {Number(manualDetails.contractDetails.securityDeposit || 0).toLocaleString()}</span></div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div><strong style={{ color: '#424242' }}>Location:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.location}</span></div>
                    <div><strong style={{ color: '#424242' }}>Area:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.hectares} Hectares</span></div>
                    <div><strong style={{ color: '#424242' }}>Operation:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.purpose}</span></div>
                    <div><strong style={{ color: '#424242' }}>Duration:</strong> <span style={{ color: '#1B5E20', fontWeight: 700 }}>{manualDetails.contractDetails.days} Days ({manualDetails.contractDetails.dates})</span></div>
                  </div>
                )}
              </div>
            )}

            {(manualDetails.paymentReference || manualDetails.proofImagePath) && (
              <div style={{ background: '#F5F5F5', padding: 18, border: '2px solid #1B5E20', marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 14, textTransform: 'uppercase' }}>
                  Online Payment Verification
                </div>
                {manualDetails.paymentReference && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Transaction ID / Reference</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                  </div>
                )}
                {manualDetails.proofImagePath && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 8 }}>Attached Payment Proof</div>
                    <img
                      src={`http://localhost:5000/${manualDetails.proofImagePath}`}
                      alt="Payment Proof"
                      style={{ maxWidth: '100%', maxHeight: 400, border: '2px solid #228B22' }}
                    />
                  </div>
                )}
              </div>
            )}

            {(() => {
              const hasWalkInSigs = manualDetails.preparedSignature || manualDetails.checkedSignature || manualDetails.receiverSignature;
              if (!hasWalkInSigs && !manualDetails.financeSignature) return null;
              return (
                <div style={{ borderTop: '2px dashed #A5D6A7', paddingTop: 20, marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 14, textTransform: 'uppercase' }}>Signatures</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    {hasWalkInSigs && [
                      { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                      { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                      { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                    ].map(({ label, name, sigImage }) => (
                      <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 80, border: '2px solid #A5D6A7', marginBottom: 8, overflow: 'hidden', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#8D6E63', fontSize: 11 }}>No signature</span>}
                        </div>
                        <div style={{ borderTop: '1px solid #8D6E63', paddingTop: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#424242', marginTop: 2 }}>{label}</div>
                        </div>
                      </div>
                    ))}

                    {manualDetails.financeSignature && (
                      <div style={{ flex: 1, textAlign: 'center', background: '#E8F5E9', padding: 10, border: '2px solid #4CAF50' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#2E8B57', marginBottom: 8, textTransform: 'uppercase' }}>Verified & Approved By (Finance)</div>
                        <div style={{ height: 80, border: '2px solid #A5D6A7', marginBottom: 8, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {typeof manualDetails.financeSignature === 'string' && manualDetails.financeSignature.length > 5 ? (
                            <img src={manualDetails.financeSignature} alt="Finance Signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: 18, color: '#2E8B57', fontWeight: 700 }}>
                              System Verified ✓
                            </div>
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #4CAF50', paddingTop: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.financeName || 'Finance Officer'}</div>
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
    <div style={{ width: '100%', minHeight: '100vh', background: '#FFFFFF', boxSizing: 'border-box', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <Toast toasts={toasts} remove={remove} />

      {/* ── Main Padding Wrapper ── */}
      <div style={{ padding: '20px 24px', boxSizing: 'border-box' }}>

        {view === 'detail' ? (
          <ReceivableDetailView receivableId={detailId} onBack={() => { setView('list'); setDetailId(null); }} />
        ) : (
          <>
            {/* ── PAGE HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #1B5E20', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#228B22', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#1B5E20', letterSpacing: '-0.5px' }}>Revenue Book</div>
                    <div style={{ color: '#424242', fontSize: 13, fontWeight: 500, marginTop: 2 }}>
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
                { title: 'Total Invoiced', value: totalInvoiced, icon: <FileText size={22} color="#228B22" />, accent: '#228B22', bg: '#E8F5E9' },
                { title: 'Total Settled / Paid', value: totalPaid, icon: <CheckCircle2 size={22} color="white" />, accent: '#4CAF50', bg: '#4CAF50', textColor: 'white' },
                { title: 'Total Outstanding', value: totalOutstanding, icon: <TrendingUp size={22} color="#8D6E63" />, accent: '#8D6E63', bg: '#F5F5F5' },
                { title: 'Recorded Entries', value: filtered.length, icon: <Layers size={22} color="#2E8B57" />, accent: '#2E8B57', bg: '#F1F8E9', isCount: true },
              ].map((kpi, i) => (
                <div key={i} className="ror-kpi-card" style={{ background: kpi.bg, border: `2px solid ${kpi.accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 10, background: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {kpi.icon}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: kpi.textColor || '#424242', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.title}</div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: kpi.textColor || '#1B5E20' }}>
                    {!kpi.isCount && <span style={{ fontSize: 15, color: kpi.textColor || '#6B8E23', marginRight: 5, fontWeight: 800 }}>ETB</span>}
                    {kpi.isCount ? kpi.value : fmt(kpi.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* ── FILTERS ── */}
            <div style={{ background: '#F5F5F5', border: '2px solid #1B5E20', padding: 20, marginBottom: 20 }}>
              <div className="ror-filter-grid">
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 8, textTransform: 'uppercase' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 8, textTransform: 'uppercase' }}>
                    <Building size={13} /> Source / Department
                  </label>
                  <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="ror-input">
                    <option value="All">All Sources</option>
                    {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 8, textTransform: 'uppercase' }}>
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
            <div style={{ border: '2px solid #1B5E20', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '80px 24px', textAlign: 'center', color: '#1B5E20' }}>
                  <SegmentedSpinner size={32} />
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Loading master ledger...</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1B5E20' }}>
                        {['Source / Reference', 'Dates', 'Total Amount (ETB)', 'Settled / Paid (ETB)', 'Status', 'Action'].map((h, hi) => (
                          <th key={h} style={{
                            padding: '16px 20px', fontWeight: 800, textTransform: 'uppercase', fontSize: 11,
                            letterSpacing: 0.8, color: 'white', border: '1px solid #4CAF50',
                            textAlign: hi >= 2 ? 'right' : 'left',
                            whiteSpace: 'nowrap'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ background: '#F5F5F5', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '2px dashed #A5D6A7' }}>
                              <Search size={28} color="#228B22" />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1B5E20' }}>No records found</div>
                            <div style={{ color: '#424242', marginTop: 4, fontSize: 13 }}>Try adjusting your filters or search query.</div>
                          </td>
                        </tr>
                      ) : filtered.map((inv, rowIdx) => {
                        const isPaid = inv.status === 'Paid';
                        const isOverdue = inv.status === 'Overdue';
                        return (
                          <tr key={inv.id} className="ror-table-row" style={{ background: rowIdx % 2 === 0 ? 'white' : '#F9FBF9' }}>
                            <td style={{ padding: '16px 20px', border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: 14, marginBottom: 6 }}>{inv.customer_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#228B22', background: '#E8F5E9', padding: '3px 8px', fontFamily: 'monospace', border: '1px solid #4CAF50' }}>
                                  {inv.invoice_no || `REC-ID-${inv.id}`}
                                </span>
                                <span style={{ fontSize: 11, color: '#424242', fontWeight: 600, background: '#F5F5F5', padding: '3px 8px', border: '1px solid #A5D6A7' }}>
                                  {inv.department_source || 'N/A'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '16px 20px', color: '#424242', fontSize: 13, border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Calendar size={13} color="#2E8B57" />
                                <span style={{ color: '#1B5E20', fontWeight: 700, minWidth: 44 }}>Record:</span>
                                {fmtD(inv.invoice_date)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} color="#8D6E63" />
                                <span style={{ color: '#1B5E20', fontWeight: 700, minWidth: 44 }}>Due:</span>
                                {fmtD(inv.due_date)}
                              </div>
                            </td>

                            <td style={{ padding: '16px 20px', textAlign: 'right', border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 900, color: '#1B5E20', fontSize: 15 }}>{fmt(inv.total_amount)}</div>
                            </td>

                            <td style={{ padding: '16px 20px', textAlign: 'right', border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 900, color: '#4CAF50', fontSize: 15 }}>{fmt(inv.amount_paid)}</div>
                            </td>

                            <td style={{ padding: '16px 20px', textAlign: 'center', border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: isPaid ? '#4CAF50' : isOverdue ? '#F44336' : '#FF9800',
                                color: 'white',
                                padding: '5px 12px', fontSize: 11, fontWeight: 900,
                                border: `2px solid ${isPaid ? '#2E8B57' : isOverdue ? '#D32F2F' : '#E65100'}`,
                              }}>
                                {isPaid ? <CheckCircle2 size={13} strokeWidth={3} /> : <AlertCircle size={13} strokeWidth={3} />}
                                {inv.status}
                              </div>
                            </td>

                            <td style={{ padding: '16px 20px', textAlign: 'center', border: '1px solid #A5D6A7', verticalAlign: 'top' }}>
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
        @keyframes ror-spin { 100% { transform: rotate(360deg); } }

        * { box-sizing: border-box; }

        .ror-card {
          background: white;
          border: 2px solid #1B5E20;
          padding: 24px;
          width: 100%;
        }

        .ror-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .ror-pay-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .ror-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .ror-kpi-card {
          padding: 20px;
          transition: background 0.2s;
        }
        .ror-kpi-card:hover {
          filter: brightness(0.96);
        }

        .ror-filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: end;
        }

        .ror-input {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #1B5E20;
          font-size: 13px;
          font-weight: 600;
          background: white;
          color: #424242;
          outline: none;
          font-family: inherit;
        }
        .ror-input:focus {
          border-color: #228B22;
          background: #F1F8E9;
        }

        .ror-table-row {
          transition: background 0.15s;
        }
        .ror-table-row:hover {
          background: #E8F5E9 !important;
        }

        .ror-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #228B22;
          color: white;
          border: 2px solid #1B5E20;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .ror-btn-primary:hover { background: #1B5E20; }

        .ror-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: white;
          color: #1B5E20;
          border: 2px solid #1B5E20;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .ror-btn-outline:hover { background: #E8F5E9; }

        .ror-btn-clear {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #A5D6A7;
          color: #1B5E20;
          border: 2px solid #228B22;
          padding: 10px 18px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          width: 100%;
          justify-content: center;
          transition: background 0.2s;
        }
        .ror-btn-clear:hover { background: #81C784; }

        .ror-btn-view {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #2E8B57;
          color: white;
          border: 2px solid #1B5E20;
          padding: 7px 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .ror-btn-view:hover { background: #228B22; }

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
        }
        @media (max-width: 480px) {
          .ror-pay-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default FinanceOutstandingReceivables;
