import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { amountInWordsBirr } from '../../utils/amountInWords';
import { triggerNotification } from '../../utils/ceoNotifications';
import {
  TrendingUp, Download, Search, CheckCircle2, AlertCircle,
  Calendar, Building, DollarSign, Filter, RefreshCw, Layers, FileText,
  ArrowLeft, Printer, User, Phone, Package, CreditCard, Hash, Smartphone, Eye, X, Receipt, Mail
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const getPaymentMethodName = (val) => {
  const s = String(val || '').toUpperCase();
  if (s === '1' || s.includes('CASH')) return 'Cash';
  if (s === '2' || s.includes('BANK')) return 'Bank Transfer';
  if (s === '3' || s.includes('CARD') || s.includes('POS')) return 'Credit/Debit Card';
  if (s === '4' || s.includes('TELE') || s.includes('TELBIR')) return 'Telebirr';
  if (s === '5') return 'Check';
  return s.replace(/_/g, ' ');
};

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
  const [markingRefund, setMarkingRefund] = useState(false);
  const [cpoRefunded, setCpoRefunded] = useState(false);
  const [refundedAt, setRefundedAt] = useState(null);
  const [refundedBy, setRefundedBy] = useState(null);

  // Car Rental security deposit states (strictly for Car Rental department)
  const [carDepositRefunded, setCarDepositRefunded] = useState(false);
  const [carDepositRefundedAt, setCarDepositRefundedAt] = useState(null);
  const [carDepositRefundedBy, setCarDepositRefundedBy] = useState(null);
  const [confirmCarRefundModal, setConfirmCarRefundModal] = useState(false);

  const { toasts, show: showToast, remove: removeToast } = useToast();
  const printRef = useRef(null);

  const [confirmRefundModal, setConfirmRefundModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/finance-receivables/book/${receivableId}/detail`);
        const data = res?.data || null;
        setDetail(data);
        if (data?.receivable?.cpo_refunded !== undefined) {
           setCpoRefunded(data.receivable.cpo_refunded);
        }
        if (data?.receivable?.security_deposit_refunded !== undefined) {
           setCarDepositRefunded(Boolean(data.receivable.security_deposit_refunded));
        }
        if (data?.receivable?.deposit_refunded_at) {
           setCarDepositRefundedAt(data.receivable.deposit_refunded_at);
        }
        if (data?.receivable?.deposit_refunded_by) {
           setCarDepositRefundedBy(data.receivable.deposit_refunded_by);
        }
        if (data?.receivable?.manual_details) {
           try {
             const md = JSON.parse(data.receivable.manual_details);
             if (md.refunded_at) setRefundedAt(md.refunded_at);
             if (md.refunded_by) setRefundedBy(md.refunded_by);
             if (md.security_deposit_refunded !== undefined) {
               setCarDepositRefunded(Boolean(md.security_deposit_refunded));
             }
             if (md.deposit_refunded_at) setCarDepositRefundedAt(md.deposit_refunded_at);
             if (md.deposit_refunded_by) setCarDepositRefundedBy(md.deposit_refunded_by);
           } catch(e) {}
        }
      } catch (e) {
        setError(e.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [receivableId]);

  const confirmRefundAction = async () => {
    setConfirmRefundModal(false);
    setMarkingRefund(true);
    const currentStatus = cpoRefunded;
    try {
      const res = await apiClient.patch(`/finance-receivables/book/${receivableId}/mark-refunded`, { refunded: !currentStatus });
      if (res.success) {
        setCpoRefunded(!currentStatus);
        if (!currentStatus) {
           setRefundedAt(new Date().toISOString());
        }
        showToast(res.message, 'success');
      } else {
        showToast(res.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      showToast(e.message || 'An error occurred', 'error');
    } finally {
      setMarkingRefund(false);
    }
  };

  const handleToggleRefund = (currentStatus) => {
    setConfirmRefundModal(true);
  };

  // Car Rental security deposit toggle actions
  const confirmCarRefundAction = async () => {
    setConfirmCarRefundModal(false);
    setMarkingRefund(true);
    const currentStatus = carDepositRefunded;
    try {
      const res = await apiClient.patch(`/finance-receivables/book/${receivableId}/mark-refunded`, {
        refunded: !currentStatus,
        type: 'car_rental'
      });
      if (res.success) {
        const nextStatus = !currentStatus;
        setCarDepositRefunded(nextStatus);
        if (nextStatus) {
          setCarDepositRefundedAt(res.deposit_refunded_at || new Date().toISOString());
          setCarDepositRefundedBy(res.deposit_refunded_by || 'Finance Officer');
        } else {
          setCarDepositRefundedAt(null);
          setCarDepositRefundedBy(null);
        }
        showToast(res.message || (nextStatus ? 'Security deposit marked as refunded' : 'Refund mark removed'), 'success');
      } else {
        showToast(res.message || 'Failed to update refund status', 'error');
      }
    } catch (e) {
      showToast(e.message || 'An error occurred', 'error');
    } finally {
      setMarkingRefund(false);
    }
  };

  const handleToggleCarRefund = () => {
    setConfirmCarRefundModal(true);
  };



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

  // Strictly check if record belongs to Car Rental department
  const isCarRental = receivable?.department_source === 'Car Rental' ||
    (manualDetails?.department === 'Car Rental') ||
    Boolean(manualDetails?.contractDetails?.carName);

  const carDepositAmount = manualDetails?.contractDetails?.securityDeposit != null
    ? parseFloat(manualDetails.contractDetails.securityDeposit)
    : 5000;

  const contactTxn = (transactions && (transactions.find(t => t.recipient_phone || t.pp_recipient_phone || t.customer_email) || transactions[0])) || {};
  const customerPhone = receivable.customer_phone || contactTxn.pp_recipient_phone || contactTxn.recipient_phone || manualDetails?.bidderPhone || manualDetails?.telebirrNumber || '—';
  const customerEmail = receivable.customer_email || contactTxn.customer_email || manualDetails?.bidderEmail || '—';

  let runningTotal = [];
  if (transactions && transactions.length > 0) {
    runningTotal = transactions.reduce((acc, t) => {
      acc.push((acc.length ? acc[acc.length - 1] : 0) + parseFloat(t.total_amount || 0));
      return acc;
    }, []);
  }

  // Row calculations based on the main table
  const rowInputVat = parseFloat(receivable.input_vat || 0);
  const rowOutputVat = parseFloat(receivable.output_vat || receivable.vat_total || 0);
  const rowPayableVat = rowOutputVat - rowInputVat;
  const isPaid = receivable.status === 'Paid';
  const isReceipt = isPaid && receivable.receipt_no;


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

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#2563EB', marginBottom: 18, textAlign: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{receivable.department_source} Department — Recorded Income</span>
            {isCarRental && (
              carDepositRefunded ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
                  <CheckCircle2 size={12} /> DEPOSIT REFUNDED
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
                  ⏳ DEPOSIT NOT REFUNDED
                </span>
              )
            )}
          </div>

          <div className="ror-meta-grid">
            {[
              { label: 'Customer / Source', value: receivable.customer_name, icon: <Building size={13} /> },
              { label: 'Record Date', value: fmtD(receivable.invoice_date), icon: <Calendar size={13} /> },
              { label: 'Total Settled', value: `ETB ${fmt(receivable.amount_paid)}`, icon: <CheckCircle2 size={13} />, highlight: receivable.status === 'Paid' },
              { label: 'Total Amount', value: `ETB ${fmt(receivable.total_amount)}`, icon: <DollarSign size={13} />, highlight: true },
              { label: 'Customer Phone', value: customerPhone, icon: <Phone size={13} /> },
              { label: 'Customer Email', value: customerEmail, icon: <Mail size={13} /> },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} style={{ background: highlight ? '#DCFCE7' : '#F5F6FA', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: highlight ? 17 : 14, fontWeight: 700, color: highlight ? '#16A34A' : '#111827' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ledger Record Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { label: 'Source / Reference', value: receivable.department_source || 'N/A' },
                { label: 'Date', value: fmtD(receivable.invoice_date) },
                ...(isCarRental ? [{
                  label: 'Security Deposit',
                  value: carDepositRefunded ? `ETB ${fmt(carDepositAmount)} (Refunded ✓)` : `ETB ${fmt(carDepositAmount)} (Not Refunded ⏳)`
                }] : []),
                { label: 'Selling Price', value: `ETB ${fmt(receivable.selling_price || receivable.subtotal || receivable.total_amount)}` },
                { label: 'COGS', value: `ETB ${fmt(receivable.cogs || 0)}` },
                { label: 'Input VAT', value: `ETB ${fmt(rowInputVat)}` },
                { label: 'Output VAT', value: `ETB ${fmt(rowOutputVat)}` },
                { label: 'Payable VAT', value: `ETB ${fmt(rowPayableVat)}` },
                { label: 'Total', value: `ETB ${fmt(receivable.total_amount)}` },
                { label: 'Status', value: isPaid ? (isReceipt ? 'Receipt / Paid' : 'Paid') : 'Invoice / Unpaid' }
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Receipt Data & Additional Info ── */}
        {isReceipt && (
          <div className="ror-card" style={{ marginBottom: 16 }}>
             <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <Receipt size={16} color="#16A34A" /> Receipt Data & Items
            </div>

            {transactions && transactions.map((txn, idx) => {
              const saleItems = txn.items || [];
              const subtotal = saleItems.reduce((sum, it) => sum + (parseFloat(it.unit_price) * parseFloat(it.quantity || 1)), 0);
              const totalVat = parseFloat(txn.total_amount || 0) - subtotal; // Approx if exact vat isn't in txn
              
              return (
                <div key={txn.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: idx < transactions.length - 1 ? '1px dashed #E5E7EB' : 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Receipt No</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>{txn.receipt_no || receivable.receipt_no || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Payment Method</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{getPaymentMethodName(txn.payment_method)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Sales Manager / Cashier</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {txn.worker_name || receivable.sales_manager_name || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Customer Name</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {txn.recipient_name || receivable.customer_name || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Customer Phone</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {txn.recipient_phone || txn.pp_recipient_phone || receivable.customer_phone || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Customer Email</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {txn.customer_email || receivable.customer_email || '—'}
                      </div>
                    </div>
                  </div>

                  {saleItems.length > 0 && (
                    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #E5E7EB' }}>
                        <thead style={{ background: '#F8FAFC' }}>
                          <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Item / Product</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Qty</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Unit Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleItems.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.name || item.drug_name || item.product_name || '—'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.qty ?? item.quantity}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{fmt(item.line_total || item.total_price || (item.unit_price * (item.qty ?? item.quantity)))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ background: '#F8FAFC' }}>
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Subtotal:</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>ETB {fmt(subtotal)}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total VAT:</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>ETB {fmt(totalVat > 0 ? totalVat : 0)}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>TOTAL RECEIVED:</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>ETB {fmt(txn.total_amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Amount Received (in words)</div>
                       <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D' }}>{amountInWordsBirr(txn.total_amount)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Balance Remaining</div>
                       <div style={{ fontSize: 16, fontWeight: 800, color: '#14532D' }}>ETB 0.00</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* ── Transaction Breakdown ── */}

        {transactions && transactions.length > 0 && receivable?.department_source !== 'Retail & POS' && (
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
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563EB', fontSize: 14 }}>{txn.receipt_no || receivable.invoice_no}</div>
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

        {/* ── Car Rental Security Deposit Refund Markup Card (ONLY FOR DEPARTMENT CAR RENTAL) ── */}
        {isCarRental && (
          <div className="ror-card" style={{
            marginBottom: 16,
            border: `1.5px solid ${carDepositRefunded ? '#16A34A' : '#F59E0B'}`,
            background: carDepositRefunded ? '#F0FDF4' : '#FFFBEB'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: carDepositRefunded ? '#16A34A' : '#B45309', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 7 }}>
                🚗 Car Rental — Security Deposit Refund Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {carDepositRefunded ? (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#16A34A', color: 'white', padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <CheckCircle2 size={13} /> REFUNDED
                    </span>
                    <button onClick={handleToggleCarRefund} disabled={markingRefund} style={{ border: 'none', background: 'none', color: '#6B7280', fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: '2px 4px' }}>
                      {markingRefund ? 'Wait...' : 'Undo'}
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      ⏳ NOT REFUNDED
                    </span>
                    <button
                      onClick={handleToggleCarRefund}
                      disabled={markingRefund}
                      style={{ background: '#16A34A', border: '1px solid #15803D', color: 'white', padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    >
                      {markingRefund ? <SegmentedSpinner size={12} /> : null} Mark as Refunded
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Refundable Deposit Amount</div>
                <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 16 }}>ETB {fmt(carDepositAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Refund Status</div>
                <div style={{ fontWeight: 700, color: carDepositRefunded ? '#16A34A' : '#D97706' }}>
                  {carDepositRefunded ? '✓ Deposit Refund Settled' : '⚠️ Deposit Held / Pending Refund'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Vehicle</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails?.contractDetails?.carName || 'Rental Vehicle'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Customer / Driver</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails?.contractDetails?.driverName || receivable?.customer_name || '—'}</div>
              </div>
            </div>

            {carDepositRefunded ? (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 6, fontSize: 12, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> Security Deposit Refunded {carDepositRefundedAt && `on ${fmtD(carDepositRefundedAt)}`} {carDepositRefundedBy && `by ${carDepositRefundedBy}`}
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF3C7', border: '1px solid #D97706', borderRadius: 6, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                ⚠️ This is a refundable car rental security deposit (ETB {fmt(carDepositAmount)}). Return upon vehicle return inspection and mark as refunded when returned to customer.
              </div>
            )}
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
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{getPaymentMethodName(manualDetails.paymentMethod)}</div>
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

            {/* ── Tender / Compete & Buy Details ── */}
            {manualDetails.type === 'tender_sell' && (
              <div style={{ background: cpoRefunded ? '#F0FDF4' : '#EFF6FF', padding: 18, border: `1px solid ${cpoRefunded ? '#16A34A' : '#2563EB'}`, borderRadius: 8, marginBottom: 18, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cpoRefunded ? '#16A34A' : '#2563EB', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏷️ Tender (Compete &amp; Buy) — CPO Deposit Record
                  </div>
                  <div>
                    {cpoRefunded ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#16A34A', color: 'white', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                           <CheckCircle2 size={12} /> REFUNDED
                         </span>
                         <button onClick={() => handleToggleRefund(cpoRefunded)} disabled={markingRefund} style={{ border: 'none', background: 'none', color: '#6B7280', fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                           {markingRefund ? 'Wait...' : 'Undo'}
                         </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleToggleRefund(cpoRefunded)} 
                        disabled={markingRefund}
                        style={{ background: 'white', border: '1px solid #D97706', color: '#D97706', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                         {markingRefund ? <SegmentedSpinner size={12} /> : null} Mark as Refunded
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13 }}>
                  {manualDetails.tenderReference && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Tender Reference</div>
                      <div style={{ fontWeight: 700, color: '#1E40AF', fontFamily: 'monospace' }}>{manualDetails.tenderReference}</div>
                    </div>
                  )}
                  {manualDetails.tenderTitle && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Tender Title</div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails.tenderTitle}</div>
                    </div>
                  )}
                  {(manualDetails.bidderName || manualDetails.receivedFrom) && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Bidder Name</div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails.bidderName || manualDetails.receivedFrom}</div>
                    </div>
                  )}
                  {(manualDetails.bidderPhone || receivable?.customer_phone) && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Bidder Phone</div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails.bidderPhone || receivable?.customer_phone}</div>
                    </div>
                  )}
                  {(manualDetails.bidderEmail || receivable?.customer_email) && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>Bidder Email</div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{manualDetails.bidderEmail || receivable?.customer_email}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3 }}>CPO Amount</div>
                    <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 15 }}>ETB {fmt(manualDetails.cpoAmount || manualDetails.amount || receivable?.total_amount)}</div>
                  </div>
                </div>
                {cpoRefunded ? (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 6, fontSize: 12, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} /> CPO Deposit Refunded {refundedAt && `on ${fmtD(refundedAt)}`} {refundedBy && `by ${refundedBy}`}
                  </div>
                ) : (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF3C7', border: '1px solid #D97706', borderRadius: 6, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                    ⚠️ This is a refundable CPO deposit. Contact the bidder using the details above to process refund after tender closure.
                  </div>
                )}
              </div>
            )}

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
                    <div>
                      <strong style={{ color: '#6B7280' }}>Deposit:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>ETB {Number(manualDetails.contractDetails.securityDeposit || carDepositAmount || 5000).toLocaleString()}</span>
                      {carDepositRefunded ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginLeft: 8 }}>
                          <CheckCircle2 size={10} /> REFUNDED
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginLeft: 8 }}>
                          ⏳ NOT REFUNDED
                        </span>
                      )}
                    </div>
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
                      src={`http://localhost:5000/${String(manualDetails.proofImagePath).replace(/^\//, '')}`}
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

      {/* ── Refund Confirmation Modal ── */}
      {confirmRefundModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'rorSlideIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 10, background: cpoRefunded ? '#FEF2F2' : '#EFF6FF', color: cpoRefunded ? '#EF4444' : '#2563EB', borderRadius: '50%' }}>
                <AlertCircle size={24} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {cpoRefunded ? 'Remove Refund Mark' : 'Confirm CPO Refund'}
              </div>
            </div>
            
            <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              {cpoRefunded 
                ? 'Are you sure you want to remove the "Refunded" status from this CPO deposit? It will be marked as pending refund again.'
                : 'Are you sure you want to mark this CPO deposit as refunded? This indicates that the deposit has been successfully returned to the bidder.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setConfirmRefundModal(false)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 6, color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRefundAction}
                style={{ padding: '8px 16px', background: cpoRefunded ? '#EF4444' : '#2563EB', border: 'none', borderRadius: 6, color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {cpoRefunded ? 'Remove Mark' : 'Mark as Refunded'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Car Rental Security Deposit Refund Confirmation Modal ── */}
      {confirmCarRefundModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'rorSlideIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 10, background: carDepositRefunded ? '#FEF2F2' : '#F0FDF4', color: carDepositRefunded ? '#EF4444' : '#16A34A', borderRadius: '50%' }}>
                <AlertCircle size={24} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {carDepositRefunded ? 'Remove Deposit Refund Mark' : 'Confirm Security Deposit Refund'}
              </div>
            </div>
            
            <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              {carDepositRefunded 
                ? 'Are you sure you want to remove the "Refunded" mark from this Car Rental security deposit? It will be marked as not refunded / pending again.'
                : `Are you sure you want to mark this Car Rental security deposit as refunded? This confirms that the guarantee deposit (ETB ${fmt(carDepositAmount)}) has been returned to the customer.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setConfirmCarRefundModal(false)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 6, color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmCarRefundAction}
                style={{ padding: '8px 16px', background: carDepositRefunded ? '#EF4444' : '#16A34A', border: 'none', borderRadius: 6, color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {carDepositRefunded ? 'Remove Mark' : 'Mark as Refunded'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


/* ─── Main Component ────────────────────────────────────────────── */
const PAGE_SIZE = 20;

const FinanceOutstandingReceivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, show, remove } = useToast();
  const navigate = useNavigate();

  // Navigation State
  const [view, setView] = useState('list');
  const [detailId, setDetailId] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');
  const [depositFilter, setDepositFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [deptFilter, agingFilter, searchQuery, depositFilter]);

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

  // Fixed departments (matches SOURCE_LABEL on backend)
  const DEPARTMENTS = ['Retail & POS', 'Pharmacy', 'Printing', 'Car Rental', 'AgriRent', 'Manual Entry'];

  const filtered = useMemo(() => {
    return processed.filter(inv => {
      const matchDept = deptFilter === 'All' || inv.department_source === deptFilter;
      let matchAging = true;
      if (agingFilter === '0-30') matchAging = inv.daysOverdue >= 0 && inv.daysOverdue <= 30;
      if (agingFilter === '31-60') matchAging = inv.daysOverdue > 30 && inv.daysOverdue <= 60;
      if (agingFilter === '61-90') matchAging = inv.daysOverdue > 60 && inv.daysOverdue <= 90;
      if (agingFilter === '>90') matchAging = inv.daysOverdue > 90;
      const matchSearch = (inv.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      let matchDeposit = true;
      if (depositFilter !== 'All') {
        const isCarRentalDept = inv.department_source === 'Car Rental';
        const refunded = inv.security_deposit_refunded === true;
        matchDeposit = isCarRentalDept && (depositFilter === 'refunded' ? refunded : !refunded);
      }
      return matchDept && matchAging && matchSearch && matchDeposit;
    });
  }, [processed, deptFilter, agingFilter, searchQuery, depositFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  // Totals (entire filtered set — not just current page)
  const totalInvoiced    = filtered.reduce((s, r) => s + parseFloat(r.total_amount   || 0), 0);
  const totalSellingPrice= filtered.reduce((s, r) => s + parseFloat(r.selling_price  || r.subtotal || r.total_amount || 0), 0);
  const totalCogs        = filtered.reduce((s, r) => s + parseFloat(r.cogs           || 0), 0);
  const totalInputVat    = filtered.reduce((s, r) => s + parseFloat(r.input_vat      || 0), 0);
  const totalOutputVat   = filtered.reduce((s, r) => s + parseFloat(r.output_vat     || 0), 0);
  const totalPayableVat  = totalOutputVat - totalInputVat;
  const totalGrossProfit = filtered.reduce((s, r) => s + parseFloat(r.gross_profit   || 0), 0);
  const totalOutstanding = filtered.reduce((s, r) => s + parseFloat(r.outstanding_balance || 0), 0);
  const totalPaid        = filtered.reduce((s, r) => s + parseFloat(r.amount_paid    || 0), 0);

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
                <button
                  className="ror-btn-outline"
                  onClick={() => navigate('/finance/invoices')}
                  style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                >
                  <Receipt size={15} /> Sales Invoices &amp; Receipts
                </button>
                <button className="ror-btn-primary">
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="ror-kpi-grid">
              {[
                { title: 'Total Revenue',   value: totalInvoiced,    icon: <FileText   size={22} color="#FFFFFF" />, accent: 'var(--color-primary)', bg: '#EFF6FF' },
                { title: 'Total COGS',      value: totalCogs,        icon: <DollarSign size={22} color="#FFFFFF" />, accent: '#7C3AED',              bg: '#F5F3FF',                   textColor: '#7C3AED' },
                { title: 'Gross Profit',    value: totalGrossProfit, icon: <TrendingUp  size={22} color="#FFFFFF" />, accent: 'var(--color-success)', bg: 'var(--color-success-bg)', textColor: 'var(--color-success)' },
                { title: 'Output VAT',      value: totalOutputVat,   icon: <CheckCircle2 size={22} color="#FFFFFF" />, accent: 'var(--color-info)', bg: 'var(--color-info-bg)',     textColor: 'var(--color-info)' },
                { title: 'Input VAT',       value: totalInputVat,    icon: <CheckCircle2 size={22} color="#FFFFFF" />, accent: 'var(--color-warning)', bg: 'var(--color-warning-bg)', textColor: 'var(--color-warning)' },
                { title: 'Payable VAT (Output − Input)', value: totalPayableVat, icon: <DollarSign size={22} color="#FFFFFF" />, accent: totalPayableVat >= 0 ? '#DC2626' : '#16A34A', bg: totalPayableVat >= 0 ? '#FEE2E2' : '#DCFCE7', textColor: totalPayableVat >= 0 ? '#DC2626' : '#16A34A' },
              ].map((kpi, i) => (
                <div key={i} className="ror-kpi-card" style={{ background: kpi.bg, borderLeft: `4px solid ${kpi.accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 10, background: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                      {kpi.icon}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: kpi.textColor || 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{kpi.title}</div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: kpi.textColor || 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: 13, color: kpi.textColor || 'var(--color-text-muted)', marginRight: 5, fontWeight: 600 }}>ETB</span>
                    {fmt(kpi.value)}
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
                    <Building size={13} /> Department
                  </label>
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="ror-input">
                    <option value="All">All Departments</option>
                    <option value="Retail &amp; POS">Retail &amp; POS</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Printing">Printing</option>
                    <option value="Car Rental">Car Rental</option>
                    <option value="AgriRent">AgriRent</option>
                    <option value="Tender">Tender</option>
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

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <DollarSign size={13} /> Car Rental Deposit
                  </label>
                  <select value={depositFilter} onChange={e => setDepositFilter(e.target.value)} className="ror-input">
                    <option value="All">All Records</option>
                    <option value="pending">Pending Refund (Held)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => { setDeptFilter('All'); setAgingFilter('All'); setDepositFilter('All'); setSearchQuery(''); }} className="ror-btn-clear">
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
                        {['Source / Reference', 'Date', 'Selling Price (ETB)', 'COGS (ETB)', 'Input VAT (ETB)', 'Output VAT (ETB)', 'Payable VAT (ETB)', 'Total (ETB)', 'Status', 'Action'].map((h, hi) => (
                          <th key={h} style={{ textAlign: hi >= 2 && hi <= 7 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ background: 'var(--color-bg-page)', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px dashed var(--color-border)', borderRadius: 10 }}>
                              <Search size={28} color="var(--color-primary)" />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>No records found</div>
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 13 }}>Try adjusting your filters or search query.</div>
                          </td>
                        </tr>
                      ) : pagedData.map((inv) => {
                        const isPaid = inv.status === 'Paid';
                        const isReceipt = isPaid && inv.receipt_no;
                        const rowInputVat = parseFloat(inv.input_vat || 0);
                        const rowOutputVat = parseFloat(inv.output_vat || inv.vat_total || 0);
                        const rowPayableVat = rowOutputVat - rowInputVat;
                        return (
                          <tr key={inv.id} className="ror-table-row" style={{ background: '#fff' }}>
                            <td style={{ verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14, marginBottom: 4 }}>{inv.customer_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-info)', background: 'var(--color-info-bg)', padding: '2px 8px', fontFamily: 'monospace', borderRadius: 999 }}>
                                  {inv.invoice_no || `ID-${inv.id}`}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500, background: 'var(--color-bg-page)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--color-border)' }}>
                                  {inv.department_source || 'N/A'}
                                </span>
                                {isReceipt && (
                                  <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 600, background: 'var(--color-success-bg)', padding: '2px 8px', borderRadius: 999 }}>
                                    RCP: {inv.receipt_no}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                              {fmtD(inv.invoice_date)}
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>{fmt(inv.selling_price || inv.subtotal || inv.total_amount)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: '#7C3AED', fontSize: 14 }}>{fmt(inv.cogs || 0)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-warning)', fontSize: 14 }}>{fmt(rowInputVat)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-info)', fontSize: 14 }}>{fmt(rowOutputVat)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: rowPayableVat >= 0 ? '#DC2626' : '#16A34A', fontSize: 14 }}>{fmt(rowPayableVat)}</div>
                            </td>

                            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>{fmt(inv.total_amount)}</div>
                            </td>

                            <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: isPaid ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                                color: isPaid ? 'var(--color-success)' : 'var(--color-warning)',
                                padding: '3px 10px', fontSize: 12, fontWeight: 600,
                                border: `1px solid ${isPaid ? 'var(--color-success)' : 'var(--color-warning)'}`,
                                borderRadius: 999, whiteSpace: 'nowrap'
                              }}>
                                {isPaid ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                {isPaid ? (isReceipt ? 'Receipt / Paid' : 'Paid') : 'Invoice / Unpaid'}
                              </div>
                            </td>

                            <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                <button
                                  onClick={() => { setDetailId(inv.id); setView('detail'); }}
                                  className="ror-btn-view"
                                >
                                  <Eye size={13} /> Detail
                                </button>
                                {isPaid && (
                                  <button
                                    onClick={() => navigate('/finance/invoices', { state: { selectedSaleId: inv.sale_id || inv.id } })}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      background: '#7C3AED', color: 'white',
                                      border: 'none', borderRadius: 6,
                                      padding: '4px 10px', fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
                                    }}
                                  >
                                    <Receipt size={12} /> Receipt
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* ── SUMMARY / TOTALS ROW ── */}
                    {filtered.length > 0 && (
                      <tfoot>
                        <tr style={{ background: '#1E293B' }}>
                          <td colSpan={2} style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Page {safePage}/{totalPages} &nbsp;·&nbsp; {filtered.length} records total
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalSellingPrice)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#A78BFA', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCogs)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#FCD34D', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalInputVat)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#67E8F9', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalOutputVat)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: totalPayableVat >= 0 ? '#FCA5A5' : '#86EFAC', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalPayableVat)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalInvoiced)}</td>
                          <td colSpan={2} style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>TOTALS</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* ── PAGINATION FOOTER ── */}
              {!loading && filtered.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: '#F8FAFC',
                  borderTop: '1px solid var(--color-border)',
                  flexWrap: 'wrap', gap: 12,
                  position: 'sticky', bottom: 0, zIndex: 10,
                  boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
                }}>
                  {/* Left: record info */}
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Showing <strong style={{ color: 'var(--color-text-primary)' }}>
                      {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                    </strong> of <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong> records
                  </div>

                  {/* Center: page jump */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Go to page</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={e => setPageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { const p = parseInt(pageInput); if (!isNaN(p)) goToPage(p); } }}
                      onBlur={() => { const p = parseInt(pageInput); if (!isNaN(p)) goToPage(p); }}
                      style={{
                        width: 60, height: 34, border: '1px solid var(--color-border)',
                        borderRadius: 7, textAlign: 'center', fontSize: 13,
                        fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                        color: 'var(--color-text-primary)', background: 'white'
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>of <strong>{totalPages}</strong></span>
                  </div>

                  {/* Right: prev/next */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      style={{
                        height: 34, padding: '0 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                        background: safePage <= 1 ? '#F1F5F9' : 'var(--color-primary)',
                        color: safePage <= 1 ? '#94A3B8' : 'white',
                        border: '1px solid ' + (safePage <= 1 ? 'var(--color-border)' : 'var(--color-primary)'),
                        cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'inherit', transition: 'all 150ms ease'
                      }}
                    >← Prev</button>
                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      style={{
                        height: 34, padding: '0 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                        background: safePage >= totalPages ? '#F1F5F9' : 'var(--color-primary)',
                        color: safePage >= totalPages ? '#94A3B8' : 'white',
                        border: '1px solid ' + (safePage >= totalPages ? 'var(--color-border)' : 'var(--color-primary)'),
                        cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'inherit', transition: 'all 150ms ease'
                      }}
                    >Next →</button>
                  </div>
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
          grid-template-columns: repeat(3, 1fr);
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
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
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
        tfoot td { vertical-align: middle; }
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
