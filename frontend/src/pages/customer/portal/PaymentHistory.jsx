import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = () => {
      setPayments(customerState.getPayments());
      customerState.notify('PAYMENT_HISTORY');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  const getStatusBadge = (status) => {
    const cfg = {
      verified:             { label: 'Verified',             bg: '#dcfce7', color: '#15803d' },
      pending_verification: { label: 'Pending Verification', bg: '#fff7ed', color: '#b45309' },
    };
    const s = cfg[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
    return <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: s.bg, color: s.color, fontSize: '12px', fontWeight: '600' }}>{s.label}</span>;
  };

  const columns = [
    { header: 'Payment ID', accessor: 'id' },
    { header: 'Invoice', accessor: 'invoice_id' },
    { header: 'Amount', render: (row) => <span style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={row.amount_cents} /></span> },
    { header: 'Method', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.method}</span> },
    { header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
  ];

  const verified = payments.filter(p => p.status === 'verified');
  const pending = payments.filter(p => p.status === 'pending_verification');

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Payment History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>All your payments, including those awaiting staff verification.</p>
      </div>

      {pending.length > 0 && (
        <div style={{ padding: '16px 20px', backgroundColor: '#fff7ed', border: '1px solid #fcd34d', borderRadius: '10px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>⏳ {pending.length} Payment(s) Pending Verification</div>
          <div style={{ fontSize: '13px', color: '#b45309' }}>These payments are awaiting confirmation from a staff member. Your outstanding balance will be updated once verified.</div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <SalesDataTable data={payments} columns={columns} searchPlaceholder="Search payments..." />
      </div>
    </div>
  );
};

export default PaymentHistory;
