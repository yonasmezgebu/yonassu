import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';

const CustomerInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      setInvoices(customerState.getInvoices());
      customerState.notify('INVOICE_READY');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  // Compute overdue status identically to Sales Manager (same function logic)
  const enriched = invoices.map(inv => {
    const isOverdue = inv.status !== 'paid' && new Date(inv.due_date) < new Date();
    return { ...inv, display_status: isOverdue ? 'overdue' : inv.status };
  });

  const outstanding = enriched.reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);

  const columns = [
    { header: 'Invoice ID', accessor: 'id' },
    { header: 'Total', render: (row) => <CurrencyDisplay amountCents={row.total_cents} /> },
    { header: 'Paid', render: (row) => <CurrencyDisplay amountCents={row.amount_paid_cents} /> },
    { header: 'Outstanding', render: (row) => {
      const bal = row.total_cents - row.amount_paid_cents;
      return <span style={{ fontWeight: 'bold', color: bal > 0 ? '#ef4444' : '#10b981' }}><CurrencyDisplay amountCents={bal} /></span>;
    }},
    { header: 'Due Date', render: (row) => new Date(row.due_date).toLocaleDateString() },
    { header: 'Status', render: (row) => <SalesStatusBadge status={row.display_status} /> },
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {row.display_status !== 'paid' && (
          <button onClick={() => navigate('/customer/payments/pay')} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            Pay Now
          </button>
        )}
        <button style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
          <Download size={14} />
        </button>
      </div>
    )}
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Invoices</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Your billing history and outstanding balances.</p>
        </div>
        <div style={{ backgroundColor: outstanding > 0 ? '#fef2f2' : '#ecfdf5', border: `1px solid ${outstanding > 0 ? '#fca5a5' : '#86efac'}`, padding: '12px 20px', borderRadius: '10px', textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Total Outstanding</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: outstanding > 0 ? '#dc2626' : '#15803d' }}>
            <CurrencyDisplay amountCents={outstanding} />
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <SalesDataTable data={enriched} columns={columns} searchPlaceholder="Search invoices..." />
      </div>
    </div>
  );
};

export default CustomerInvoicesPage;
