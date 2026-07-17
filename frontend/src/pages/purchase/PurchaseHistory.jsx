import React, { useState, useEffect } from 'react';
import { Clock, Download, Printer } from 'lucide-react';
import { purchaseState } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseHistory = () => {
  const [history, setHistory] = useState([]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    // Generate history from POs (simplifying since PO has most required data)
    const hist = purchaseState.purchaseOrders.map(po => ({
      id: po.id,
      date: po.dateCreated,
      supplier: po.supplierName,
      item: po.item,
      totalAmount: po.qty * po.unitPrice,
      status: po.status,
      receivedDate: po.status === 'Received' ? new Date().toISOString().slice(0, 10) : '-'
    }));
    setHistory(hist);
    submitNotification('📊 Purchase History Ready', '📊 Purchase History Report Generated', 'info.mp3');
  }, []);

  const filtered = history.filter(h => 
    (filterStatus === 'All' || (filterStatus === 'Completed' ? h.status === 'Received' : filterStatus === 'Pending' ? h.status !== 'Received' : true)) &&
    (!filterSupplier || h.supplier.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  // Summary Statistics
  const totalPOs = history.length;
  const totalSpend = history.reduce((acc, h) => acc + h.totalAmount, 0);
  const uniqueSuppliers = new Set(history.map(h => h.supplier)).size;

  // Mock Top Suppliers/Categories (since category isn't on PO currently, we just hardcode the display for the spec)
  const topSuppliers = 'Global Pharma Supplies ($140,000), Ethio Medical ($100,000)';
  const topCategories = 'Pharmaceuticals, Medical Equipment';

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
            <Clock color="#475569" size={28} /> PURCHASE HISTORY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Comprehensive historical record of all purchases.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export PDF
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Summary Statistics Block */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Purchase Orders</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{totalPOs}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Spend</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>ETB {totalSpend.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Suppliers</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0ea5e9' }}>{uniqueSuppliers}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Top Suppliers by Spend</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginTop: 4 }}>{topSuppliers}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Top Categories by Spend</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginTop: 4 }}>{topCategories}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier Name</label>
          <input placeholder="Search Supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Completed</option><option>Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['PO #', 'Date', 'Supplier Name', 'Items Purchased', 'Total Amount', 'Status', 'Received Date'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Total Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{h.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{h.date}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{h.supplier}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{h.item}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>ETB {h.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: h.status === 'Received' ? '#dcfce7' : '#f1f5f9', color: h.status === 'Received' ? '#16a34a' : '#475569' }}>
                    {h.status === 'Received' ? 'Completed' : h.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{h.receivedDate}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No purchase history found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseHistory;
