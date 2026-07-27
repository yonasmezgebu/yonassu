import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesStatusBadge from '../components/SalesStatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const SalesQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  const loadData = () => setQuotations(salesState.getQuotations());

  useEffect(() => {
    loadData();
    salesState.notify('PAGE_LOAD');
  }, []);

  const handleAction = (id, type) => {
    if (type === 'send') setModalState({ isOpen: true, type, id, title: 'Send Quotation', message: 'Mark this quotation as sent to the customer?' });
    if (type === 'accept') setModalState({ isOpen: true, type, id, title: 'Accept Quotation', message: 'Mark this quotation as accepted by the customer?' });
    if (type === 'reject') setModalState({ isOpen: true, type, id, title: 'Reject Quotation', message: 'Mark this quotation as rejected?' });
    if (type === 'convert') setModalState({ isOpen: true, type, id, title: 'Convert to Order', message: 'Are you sure you want to convert this accepted quotation into a new Sales Order?' });
  };

  const confirmAction = () => {
    try {
      if (modalState.type === 'send') salesState.updateQuotationStatus(modalState.id, 'sent');
      if (modalState.type === 'accept') salesState.updateQuotationStatus(modalState.id, 'accepted');
      if (modalState.type === 'reject') salesState.updateQuotationStatus(modalState.id, 'rejected');
      if (modalState.type === 'convert') salesState.convertQuotationToOrder(modalState.id);
      loadData();
    } catch (e) {
      alert(e.message); // simple alert for mock errors
    }
  };

  const columns = [
    { label: 'Quotation #', field: 'quotation_number', sortable: true },
    { 
      label: 'Date', 
      field: 'created_at', 
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    { 
      label: 'Customer', 
      field: 'customer_id',
      render: (row) => salesState.getCustomers().find(c => c.id === row.customer_id)?.name || row.customer_id
    },
    { 
      label: 'Total', 
      field: 'total_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.total_cents} />
    },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => <SalesStatusBadge status={row.status} />
    },
    {
      label: 'Actions',
      field: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'draft' && <button onClick={() => handleAction(row.id, 'send')} style={btnStyle('#3b82f6')}>Send</button>}
          {row.status === 'sent' && (
            <>
              <button onClick={() => handleAction(row.id, 'accept')} style={btnStyle('#10b981')}>Accept</button>
              <button onClick={() => handleAction(row.id, 'reject')} style={btnStyle('#ef4444')}>Reject</button>
            </>
          )}
          {row.status === 'accepted' && <button onClick={() => handleAction(row.id, 'convert')} style={btnStyle('#8b5cf6')}>Convert to Order</button>}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Quotations</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage price quotes and convert them to orders.</p>
      </div>

      <SalesDataTable columns={columns} data={quotations} searchable={true} searchField="quotation_number" />

      <ConfirmModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        onConfirm={confirmAction}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type === 'reject' ? 'danger' : 'info'}
      />
    </div>
  );
};

const btnStyle = (color) => ({
  padding: '4px 8px', backgroundColor: color, color: 'white', border: 'none', borderRadius: 0, fontSize: '12px', cursor: 'pointer'
});

export default SalesQuotations;
