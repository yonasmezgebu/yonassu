import React, { useState, useMemo } from 'react';
import { triggerNotification } from '../../utils/ceoNotifications';
import { Package, Download, AlertTriangle, Layers } from 'lucide-react';

const CEOInventory = () => {
  const [activeTab, setActiveTab] = useState('Pharmacy');

  const [inventory] = useState({
    Pharmacy: [
      { id: 1, item: 'Amoxicillin 500mg', qty: 450, unit: 'Capsules', reorder: 500, cost: 2.5 },
      { id: 2, item: 'Paracetamol 500mg', qty: 2000, unit: 'Tablets', reorder: 1000, cost: 0.5 },
    ],
    Store: [
      { id: 3, item: 'A4 Paper', qty: 10, unit: 'Boxes', reorder: 20, cost: 45 },
      { id: 4, item: 'Syringes 5ml', qty: 500, unit: 'Pieces', reorder: 200, cost: 0.1 },
    ],
    Cars: [
      { id: 5, item: 'Toyota Corolla 2022', qty: 1, unit: 'Vehicle', reorder: 0, cost: 25000, status: 'Maintenance Overdue' },
      { id: 6, item: 'Hyundai Elantra 2021', qty: 1, unit: 'Vehicle', reorder: 0, cost: 22000, status: 'OK' },
    ],
    Agri: [
      { id: 7, item: 'John Deere Tractor', qty: 2, unit: 'Machine', reorder: 1, cost: 45000, status: 'OK' },
    ],
    Printing: [
      { id: 8, item: 'Cyan Ink Toner', qty: 5, unit: 'Cartridges', reorder: 10, cost: 120 },
    ]
  });

  const totalValue = useMemo(() => {
    let total = 0;
    Object.values(inventory).forEach(dept => {
      dept.forEach(item => {
        total += (item.qty * item.cost);
      });
    });
    return total;
  }, [inventory]);

  const handleExport = () => {
    triggerNotification('Export Started', `Exporting ${activeTab} Inventory as PDF...`);
  };

  const renderTable = (data) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead style={{ background: '#f8fafc' }}>
        <tr>
          <th style={{ padding: 12 }}>Item Name</th>
          <th style={{ padding: 12 }}>Current Stock</th>
          <th style={{ padding: 12 }}>Unit</th>
          <th style={{ padding: 12 }}>Unit Cost</th>
          <th style={{ padding: 12 }}>Total Value</th>
          <th style={{ padding: 12 }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map(i => {
          const isLow = (activeTab === 'Cars' || activeTab === 'Agri') 
            ? i.status !== 'OK' 
            : i.qty <= i.reorder;

          return (
            <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: 12 }}>{i.item}</td>
              <td style={{ padding: 12, fontWeight: 'bold' }}>{i.qty}</td>
              <td style={{ padding: 12 }}>{i.unit}</td>
              <td style={{ padding: 12 }}>${i.cost.toFixed(2)}</td>
              <td style={{ padding: 12, fontWeight: 'bold' }}>${(i.qty * i.cost).toLocaleString()}</td>
              <td style={{ padding: 12 }}>
                {isLow ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 'bold', fontSize: 13, background: '#fee2e2', padding: '4px 8px', borderRadius: 4, width: 'fit-content' }}>
                    <AlertTriangle size={14}/> {activeTab === 'Cars' ? 'Maintenance' : 'Low Stock'}
                  </span>
                ) : (
                  <span style={{ color: '#166534', fontWeight: 'bold', fontSize: 13, background: '#dcfce7', padding: '4px 8px', borderRadius: 4 }}>
                    OK
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>📦 INVENTORY OVERVIEW</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Read-Only View of All Department Stocks</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: 24, borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: '50%' }}><Layers size={32}/></div>
        <div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>Aggregated Total Inventory Value</div>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.keys(inventory).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: activeTab === tab ? '#0f172a' : 'white', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', border: activeTab === tab ? 'none' : '1px solid #e2e8f0' }}>
            {tab} Stock
          </button>
        ))}
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18}/> {activeTab} Inventory Items
        </h3>
        {renderTable(inventory[activeTab])}
      </div>
    </div>
  );
};

export default CEOInventory;
