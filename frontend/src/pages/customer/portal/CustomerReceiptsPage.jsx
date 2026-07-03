import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { Download } from 'lucide-react';

const CustomerReceiptsPage = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = () => {
      setPayments(customerState.getPayments());
      customerState.notify('RECEIPT_READY');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  const columns = [
    { header: 'Payment ID', accessor: 'id' },
    { header: 'Invoice', accessor: 'invoice_id' },
    { header: 'Amount', render: (row) => <CurrencyDisplay amountCents={row.amount_cents} /> },
    { header: 'Method', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.method}</span> },
    { header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Status', render: (row) => <SalesStatusBadge status={row.status === 'pending_verification' ? 'pending' : 'paid'} /> },
    { header: 'Print', render: () => (
      <button style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
        <Download size={14} />
      </button>
    )}
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Receipts</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Your verified and pending payment receipts.</p>
      </div>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <SalesDataTable data={payments} columns={columns} searchPlaceholder="Search receipts..." />
      </div>
    </div>
  );
};

export default CustomerReceiptsPage;
