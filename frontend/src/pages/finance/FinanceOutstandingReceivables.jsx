import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { triggerNotification } from '../../utils/ceoNotifications';
import {
  TrendingUp, Download, Search, CheckCircle2, AlertCircle,
  Calendar, Building, DollarSign, Filter, RefreshCw, Layers, FileText,
  ArrowLeft, Printer, User, Phone, Package, CreditCard, Hash, Smartphone, Eye
} from 'lucide-react';

const fmt = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
const fmtD = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── Receivable Detail View ────────────────────────────────────────── */
const ReceivableDetailView = ({ receivableId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        // apiClient interceptor unwraps response.data
        // so res = { success: true, data: { receivable, transactions, ... } }
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
        th { background: #f1f5f9; border: 1px solid #ccc; padding: 7px 10px; font-size: 11px; text-align: left; }
        td { border: 1px solid #ddd; padding: 7px 10px; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (loading) return (
    <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 16px', color: '#0284c7' }} />
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading record details...</div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return <div style={{ padding: 40, color: '#dc2626' }}>{error}</div>;

  const { receivable, transactions, systemTotal, transactionCount: rawTxCount } = detail;
  const transactionCount = rawTxCount > 0 ? rawTxCount : (receivable.manual_details ? 1 : 0);
  let manualDetails = null;
  if (receivable.manual_details) {
    try {
      manualDetails = JSON.parse(receivable.manual_details);
    } catch (e) {}
  }

  let runningTotal = [];
  if (transactions && transactions.length > 0) {
    runningTotal = transactions.reduce((acc, t) => {
      acc.push((acc.length ? acc[acc.length - 1] : 0) + parseFloat(t.total_amount || 0));
      return acc;
    }, []);
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#475569' }}>
          <ArrowLeft size={15} /> Back to Ledger
        </button>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <Printer size={14} /> Print Detail
        </button>
      </div>

      <div ref={printRef}>
        {/* Header Block */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', padding: '36px 40px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden' }}>
          {receivable.status === 'Paid' && (
            <div style={{ position: 'absolute', top: 20, right: -40, background: '#4CAF50', color: 'white', fontWeight: 900, padding: '8px 50px', transform: 'rotate(45deg)', fontSize: 12, letterSpacing: 2 }}>
              SETTLED
            </div>
          )}
          
          <div style={{ borderBottom: '3px double #1B5E20', paddingBottom: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#1B5E20', margin: '0 0 4px', textTransform: 'uppercase' }}>Sutana Enterprise</h1>
              <p style={{ margin: 0, color: '#424242', fontSize: 13 }}>Receivables Book — Official Record</p>
            </div>
            <div style={{ textAlign: 'right', paddingRight: receivable.status === 'Paid' ? 60 : 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#2E8B57', letterSpacing: 2 }}>{receivable.invoice_no}</div>
              <div style={{ fontSize: 12, color: '#6B8E23', marginTop: 4 }}>RECORDED ENTRY</div>
            </div>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#1B5E20', margin: '0 0 20px', textAlign: 'center' }}>
            {receivable.department_source} DEPARTMENT — RECORDED INCOME
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { label: 'Customer / Source', value: receivable.customer_name, icon: <Building size={13} /> },
              { label: 'Record Date', value: fmtD(receivable.invoice_date), icon: <Calendar size={13} /> },
              { label: 'Total Settled', value: `ETB ${fmt(receivable.amount_paid)}`, icon: <CheckCircle2 size={13} />, highlight: receivable.status === 'Paid' },
              { label: 'Total Amount', value: `ETB ${fmt(receivable.total_amount)}`, icon: <DollarSign size={13} />, highlight: true },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} style={{ background: highlight ? '#98FF98' : '#F5F5F5', borderRadius: 10, padding: '14px 16px', border: `1px solid ${highlight ? '#A5D6A7' : '#A5D6A7'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#424242', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: highlight ? 17 : 14, fontWeight: highlight ? 900 : 600, color: highlight ? '#1B5E20' : '#1B5E20' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Breakdown */}
        {transactions && transactions.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', padding: '28px 36px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#228B22" /> Transaction Breakdown ({transactionCount} Records)
            </h3>

            {transactions.map((txn, idx) => {
              const typeColor = txn.sale_type === 'RETURNED' ? '#F44336' : '#2E8B57';
              return (
                <div key={txn.id}>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#1B5E20', color: 'white', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#228B22', fontSize: 14 }}>{txn.receipt_no}</div>
                          <div style={{ fontSize: 11, color: '#6B8E23' }}>{fmtDateTime(txn.created_at)}</div>
                        </div>
                        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: typeColor, border: `1px solid ${typeColor}40`, background: `${typeColor}10` }}>
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

                    {/* Payment Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
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
                        <div key={label} style={{ background: highlight ? '#ecfdf5' : '#F5F5F5', borderRadius: 8, padding: '9px 12px', border: `1px solid ${highlight ? '#A5D6A7' : '#A5D6A7'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: highlight ? '#2E8B57' : '#424242', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{icon} {label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? '#1B5E20' : '#1B5E20' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Items table */}
                    {txn.items && txn.items.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: '#F5F5F5' }}>
                              {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: '#6B8E23', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', border: '1px solid #A5D6A7' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txn.items.map((item, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                <td style={{ padding: '7px 12px', color: '#6B8E23', fontSize: 11, border: '1px solid #A5D6A7' }}>{i + 1}</td>
                                <td style={{ padding: '7px 12px', fontWeight: 600, color: '#1B5E20', border: '1px solid #A5D6A7' }}>{item.drug_name}</td>
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
                  {idx < transactions.length - 1 && <hr style={{ border: 'none', borderTop: '2px dashed #A5D6A7', margin: '20px 0' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Manual Details Breakdown */}
        {manualDetails && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', padding: '28px 36px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#228B22" /> Manual Submission Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.paymentMethod}</div>
              </div>
              <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Received From</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.receivedFrom || '—'}</div>
              </div>
              <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#2E8B57' }}>ETB {fmt(manualDetails.amount || receivable.total_amount)}</div>
              </div>
            </div>

            {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
              <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#1B5E20' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                  {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#1B5E20' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                </div>
              </div>
            )}

            {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
              <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div><strong style={{ color: '#1B5E20' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                  <div><strong style={{ color: '#1B5E20' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                </div>
              </div>
            )}
            
            {manualDetails.contractDetails && (
              <div style={{ background: '#F5F5F5', padding: 20, borderRadius: 12, border: '1px solid #A5D6A7', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={18} color="#2E8B57" /> Contract & Asset Summary
                </h4>
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
              <div style={{ background: '#F5F5F5', padding: 20, borderRadius: 12, border: '1px solid #A5D6A7', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#2E8B57" /> Online Payment Verification
                </h4>
                {manualDetails.paymentReference && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Transaction ID / Reference</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                  </div>
                )}
                {manualDetails.proofImagePath && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 8 }}>Attached Payment Proof</div>
                    <img 
                      src={`http://localhost:5000/${manualDetails.proofImagePath}`} 
                      alt="Payment Proof" 
                      style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, border: '2px solid #A5D6A7', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                    />
                  </div>
                )}
              </div>
            )}

            {(() => {
              const hasWalkInSigs = manualDetails.preparedSignature || manualDetails.checkedSignature || manualDetails.receiverSignature;
              if (!hasWalkInSigs && !manualDetails.financeSignature) return null;
              
              return (
                <div style={{ borderTop: '2px dashed #A5D6A7', paddingTop: 24, marginTop: 12 }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#1B5E20', fontWeight: 800 }}>Signatures</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                    {hasWalkInSigs && [
                      { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                      { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                      { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                    ].map(({ label, name, sigImage }) => (
                      <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 80, border: '1px solid #A5D6A7', borderRadius: 8, marginBottom: 8, overflow: 'hidden', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#8D6E63', fontSize: 11 }}>No signature</span>}
                        </div>
                        <div style={{ borderTop: '1px solid #8D6E63', paddingTop: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#424242', marginTop: 2 }}>{label}</div>
                        </div>
                      </div>
                    ))}
                    
                    {manualDetails.financeSignature && (
                      <div style={{ flex: 1, textAlign: 'center', background: '#ecfdf5', borderRadius: 12, padding: 10, border: '1px solid #4CAF50' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#2E8B57', marginBottom: 8, textTransform: 'uppercase' }}>Verified & Approved By (Finance)</div>
                        <div style={{ height: 80, border: '1px solid #A5D6A7', borderRadius: 8, marginBottom: 8, overflow: 'hidden', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {typeof manualDetails.financeSignature === 'string' && manualDetails.financeSignature.length > 5 ? (
                            <img src={manualDetails.financeSignature} alt="Finance Signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: 18, color: '#2E8B57', fontWeight: 700 }}>
                              System Verified ✓
                            </div>
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #4CAF50', paddingTop: 8 }}>
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
    } catch (e) {
      console.error('Receivables fetch error:', e);
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

  if (view === 'detail') {
    return (
      <div className="nature-page-bg">
        <ReceivableDetailView receivableId={detailId} onBack={() => { setView('list'); setDetailId(null); }} />
      </div>
    );
  }

  return (
    <div className="nature-page-bg" style={{ padding: '32px 40px', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER ── */}
      <div className="header-responsive">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 14, color: '#1B5E20', letterSpacing: '-0.5px' }}>
            <span style={{ background: 'linear-gradient(135deg, #228B22, #4CAF50)', color: 'white', padding: 12, borderRadius: 14, display: 'flex', boxShadow: '0 4px 0 #1B5E20' }}>
              <Layers size={26} />
            </span>
            Receivables Book
          </h1>
          <p style={{ color: '#424242', margin: '10px 0 0 0', fontSize: 15, fontWeight: 500 }}>
            Master ledger for all company income, approved transactions, and settled accounts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: '1rem' }}>
          <button className="btn-3d btn-white" onClick={loadReceivables}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn-3d btn-primary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI METRICS (2x2 Grid) ── */}
      <div className="kpi-grid">
        {[
          { title: 'Total Invoiced', value: totalInvoiced, icon: <FileText size={24} color="#1B5E20" />, bg: '#A5D6A7', border: '#4CAF50', color: '#1B5E20' },
          { title: 'Total Settled / Paid', value: totalPaid, icon: <CheckCircle2 size={24} color="#FFFFFF" />, bg: '#4CAF50', border: '#2E8B57', color: '#1B5E20' },
          { title: 'Total Outstanding', value: totalOutstanding, icon: <TrendingUp size={24} color="#8D6E63" />, bg: '#F5F5F5', border: '#8D6E63', color: '#1B5E20' },
          { title: 'Recorded Entries', value: filtered.length, isCount: true, icon: <Layers size={24} color="#2E8B57" />, bg: '#98FF98', border: '#4CAF50', color: '#1B5E20' }
        ].map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ background: 'white', borderRadius: 20, border: `2px solid ${kpi.border}`, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: kpi.bg, borderRadius: '50%', opacity: 0.3, transition: 'all 0.3s ease' }} className="kpi-circle"></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
              <div style={{ padding: 10, background: kpi.bg, borderRadius: 12, border: `2px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#424242', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.title}</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#1B5E20', position: 'relative' }}>
              {!kpi.isCount && <span style={{ fontSize: 18, color: '#6B8E23', marginRight: 6, fontWeight: 800 }}>ETB</span>}
              {kpi.isCount ? kpi.value : fmt(kpi.value)}
            </div>
          </div>
        ))}
      </div>

      {/* ── ADVANCED FILTERS ── */}
      <div style={{ background: 'white', borderRadius: 20, border: '2px solid #A5D6A7', padding: 24, marginBottom: 32, boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
        <div className="filters-grid">
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>
              <Search size={14}/> Search Reference / Source
            </label>
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>
              <Building size={14}/> Source / Department
            </label>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="filter-input">
              <option value="All">All Sources</option>
              {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>
              <Filter size={14}/> Aging Filter
            </label>
            <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} className="filter-input">
              <option value="All">All Records</option>
              <option value="0-30">0 - 30 Days</option>
              <option value="31-60">31 - 60 Days</option>
              <option value="61-90">61 - 90 Days</option>
              <option value=">90">Over 90 Days</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setCustomerFilter('All'); setAgingFilter('All'); setSearchQuery(''); }} className="btn-3d btn-secondary">
              Clear
            </button>
          </div>

        </div>
      </div>

      {/* ── DATA GRID ── */}
      <div style={{ background: 'white', borderRadius: 20, border: '2px solid #A5D6A7', overflow: 'hidden', boxShadow: '0 8px 24px rgba(34,139,34,0.1)' }}>
        {loading ? (
          <div style={{ padding: 100, textAlign: 'center', color: '#2E8B57' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 16px', color: '#228B22' }} />
            <div style={{ fontSize: 16, fontWeight: 800 }}>Loading master ledger...</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#1B5E20', color: 'white', borderBottom: '3px solid #000' }}>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Source / Reference</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Dates</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, textAlign: 'right' }}>Settled / Paid</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '80px', textAlign: 'center' }}>
                      <div style={{ background: '#F5F5F5', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px dashed #A5D6A7' }}>
                        <Search size={28} color="#228B22" />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1B5E20' }}>No records found</div>
                      <div style={{ color: '#424242', marginTop: 4 }}>Try adjusting your filters or search query.</div>
                    </td>
                  </tr>
                ) : filtered.map(inv => {
                  const isPaid = inv.status === 'Paid';
                  const isOverdue = inv.status === 'Overdue';
                  
                  return (
                    <tr key={inv.id} className="table-row">
                      
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #A5D6A7' }}>
                        <div style={{ fontWeight: 900, color: '#1B5E20', fontSize: 15, marginBottom: 6 }}>{inv.customer_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#2E8B57', background: '#98FF98', padding: '4px 10px', borderRadius: 8, fontFamily: 'monospace', border: '1px solid #4CAF50' }}>
                            {inv.invoice_no || `REC-ID-${inv.id}`}
                          </span>
                          <span style={{ fontSize: 12, color: '#424242', fontWeight: 700, background: '#F5F5F5', padding: '4px 8px', borderRadius: 8, border: '1px solid #A5D6A7' }}>Dept: {inv.department_source || 'N/A'}</span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '20px 24px', color: '#424242', fontSize: 13, borderBottom: '1px solid #A5D6A7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Calendar size={14} color="#2E8B57" /> <span style={{ width: 45, display: 'inline-block', color: '#1B5E20', fontWeight: 800 }}>Record:</span> {fmtD(inv.invoice_date)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color="#8D6E63" /> <span style={{ width: 45, display: 'inline-block', color: '#1B5E20', fontWeight: 800 }}>Due:</span> {fmtD(inv.due_date)}
                        </div>
                      </td>
                      
                      <td style={{ padding: '20px 24px', textAlign: 'right', borderBottom: '1px solid #A5D6A7' }}>
                        <div style={{ fontWeight: 900, color: '#1B5E20', fontSize: 16 }}>{fmt(inv.total_amount)}</div>
                      </td>
                      
                      <td style={{ padding: '20px 24px', textAlign: 'right', borderBottom: '1px solid #A5D6A7' }}>
                        <div style={{ fontWeight: 900, color: '#4CAF50', fontSize: 16 }}>{fmt(inv.amount_paid)}</div>
                      </td>
                      
                      <td style={{ padding: '20px 24px', textAlign: 'center', borderBottom: '1px solid #A5D6A7' }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 6, 
                          background: isPaid ? '#4CAF50' : isOverdue ? '#F44336' : '#FF9800', 
                          color: 'white', 
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, 
                          border: `2px solid ${isPaid ? '#2E8B57' : isOverdue ? '#D32F2F' : '#F57C00'}`,
                          boxShadow: '0 2px 0 rgba(0,0,0,0.2)'
                        }}>
                          {isPaid ? <CheckCircle2 size={14} strokeWidth={3}/> : <AlertCircle size={14} strokeWidth={3}/>}
                          {inv.status}
                        </div>
                      </td>
  
                      <td style={{ padding: '20px 24px', textAlign: 'center', borderBottom: '1px solid #A5D6A7' }}>
                        <button
                          onClick={() => { setDetailId(inv.id); setView('detail'); }}
                          className="btn-3d btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12 }}
                        >
                          <Eye size={13} /> View Detail
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

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .nature-page-bg {
          background-color: #F5F5F5;
        }

        .header-responsive {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 36px;
        }
        @media (max-width: 768px) {
          .header-responsive {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* 2x2 Grid setup */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 0 #A5D6A7 !important;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 0 #A5D6A7 !important;
        }
        .kpi-card:hover .kpi-circle {
          transform: scale(1.2);
          opacity: 0.5 !important;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) 250px 220px auto;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .filters-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }

        .filter-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #A5D6A7;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          font-weight: 700;
          box-sizing: border-box;
          background: white;
          color: #1B5E20;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .filter-input:focus {
          border-color: #2E8B57;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(46,139,87,0.2);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table-row {
          transition: all 0.2s ease;
          background: white;
        }
        .table-row:hover {
          background: #F0FFF0 !important;
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(34,139,34,0.15);
          position: relative;
          z-index: 10;
        }

        /* 3D Buttons */
        .btn-3d {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          transition: all 0.1s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 20px;
        }
        
        .btn-primary {
          background: #228B22;
          color: white;
          box-shadow: 0 5px 0 #1B5E20, 0 8px 10px rgba(0,0,0,0.2);
        }
        .btn-primary:active {
          transform: translateY(5px);
          box-shadow: 0 0 0 #1B5E20, 0 2px 4px rgba(0,0,0,0.2);
        }

        .btn-white {
          background: white;
          color: #1B5E20;
          border: 2px solid #A5D6A7;
          box-shadow: 0 4px 0 #A5D6A7, 0 6px 10px rgba(0,0,0,0.1);
        }
        .btn-white:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #A5D6A7, 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-secondary {
          background: #A5D6A7;
          color: #1B5E20;
          box-shadow: 0 5px 0 #8BC34A, 0 8px 10px rgba(0,0,0,0.1);
          height: 46px;
        }
        .btn-secondary:active {
          transform: translateY(5px);
          box-shadow: 0 0 0 #8BC34A, 0 2px 4px rgba(0,0,0,0.1);
        }

      `}</style>
    </div>
  );
};

export default FinanceOutstandingReceivables;
