import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesStatusBadge from '../components/SalesStatusBadge';

const SalesReturns = () => {
  const [returns, setReturns] = useState([]);
  const [sales] = useState(salesState.getSales());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({ source_sale_id: '', reason: 'damaged', refund_amount: '' });
  const [error, setError] = useState('');

  const loadData = () => setReturns(salesState.getReturns());

  useEffect(() => {
    loadData();
    salesState.notify('PAGE_LOAD');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      salesState.createReturn({
        source_sale_id: newReturn.source_sale_id,
        customer_id: sales.find(s => s.id === newReturn.source_sale_id)?.customer_id,
        reason: newReturn.reason,
        refund_amount_cents: Math.round(parseFloat(newReturn.refund_amount) * 100),
        refund_method: 'cash'
      });
      setIsModalOpen(false);
      setNewReturn({ source_sale_id: '', reason: 'damaged', refund_amount: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { label: 'Return #', field: 'return_number', sortable: true },
    { 
      label: 'Date', 
      field: 'created_at', 
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    { 
      label: 'Source Sale', 
      field: 'source_sale_id',
      render: (row) => sales.find(s => s.id === row.source_sale_id)?.sale_number || row.source_sale_id
    },
    { label: 'Reason', field: 'reason' },
    { 
      label: 'Refund Amount', 
      field: 'refund_amount_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.refund_amount_cents} />
    },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => <SalesStatusBadge status={row.status} />
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Sales Returns</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Process and track customer returns and refunds.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          + New Return
        </button>
      </div>

      <SalesDataTable columns={columns} data={returns} searchable={true} searchField="return_number" />

      {/* New Return Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '500px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Process New Return</h3>
            
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Source Sale:</label>
                <select 
                  value={newReturn.source_sale_id} 
                  onChange={(e) => setNewReturn({ ...newReturn, source_sale_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">Select a sale...</option>
                  {sales.map(s => (
                    <option key={s.id} value={s.id}>{s.sale_number} ({new Date(s.created_at).toLocaleDateString()}) - {formatCents(s.total_cents)}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Reason:</label>
                <select 
                  value={newReturn.reason} 
                  onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="damaged">Damaged</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="complaint">Complaint</option>
                  <option value="change_of_mind">Change of Mind</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Refund Amount (ETB):</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={newReturn.refund_amount}
                  onChange={(e) => setNewReturn({ ...newReturn, refund_amount: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Submit Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick helper since we don't import formatCents here directly
const formatCents = (cents) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(cents / 100);

export default SalesReturns;
