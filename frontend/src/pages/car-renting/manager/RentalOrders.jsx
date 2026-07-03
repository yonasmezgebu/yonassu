import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import { useNavigate } from 'react-router-dom';

const RentalOrders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
        // Enriched orders with asset/customer and computed 'days_remaining'
        const raw = rentalState.getRentalOrders();
        const assets = rentalState.getAssets();
        const customers = rentalState.getCustomers();
        
        const enriched = raw.map(o => {
            const a = assets.find(x => x.id === o.asset_id);
            const c = customers.find(x => x.id === o.customer_id);
            
            let daysRemaining = 'N/A';
            if (o.status === 'active' || o.status === 'pending' || o.status === 'confirmed') {
                const diff = new Date(o.end_datetime) - new Date();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }

            return {
                ...o,
                asset_name: a ? `[${a.asset_type === 'car' ? 'Car' : 'Agri'}] ${a.name}` : 'Unknown',
                customer_name: c ? c.name : 'Unknown',
                days_remaining: daysRemaining
            };
        });
        setOrders(enriched.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  const handleProcessPickup = (order) => {
      // Direct process for demo, or normally route to POS pre-filled.
      try {
          rentalState.processPickup(order.id, 'cash');
          rentalState.notify('PICKUP_SUCCESS');
      } catch (e) {
          alert(e.message);
      }
  };

  const handleProcessReturn = (order) => {
      const condition = prompt("Enter return condition notes (or leave blank):", "Good");
      if (condition === null) return;
      const damage = window.confirm("Was there any damage reported?");
      
      try {
          rentalState.processReturn(order.id, {
              return_datetime: new Date().toISOString(),
              condition_notes: condition,
              damage_reported: damage,
              additional_charges_cents: 0
          });
          rentalState.notify('RETURN_SUCCESS');
      } catch (e) {
          alert(e.message);
      }
  };

  const handleCancel = (order) => {
      const reason = prompt("Enter cancellation reason:");
      if (!reason) return;
      try {
          rentalState.cancelOrder(order.id, reason);
          rentalState.notify('ORDER_UPDATED');
      } catch (e) {
          alert(e.message);
      }
  };

  const columns = [
    { header: 'Order #', accessor: 'order_number' },
    { header: 'Asset', accessor: 'asset_name' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Start Date', render: (row) => new Date(row.start_datetime).toLocaleDateString() },
    { header: 'Status', render: (row) => <SalesStatusBadge status={row.status} /> },
    { header: 'Days Rem.', accessor: 'days_remaining' },
    { header: 'Actions', render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
            {['pending', 'confirmed'].includes(row.status) && (
                <>
                <button onClick={() => handleProcessPickup(row)} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Pickup</button>
                <button onClick={() => handleCancel(row)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </>
            )}
            {row.status === 'active' && (
                <button onClick={() => handleProcessReturn(row)} style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Process Return</button>
            )}
        </div>
    )}
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Rental Orders</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Manage lifecycle of all rental bookings.</p>
        </div>
        <button onClick={() => navigate('/car-renting/manager/new-sale')} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + New Advance Order
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={orders} columns={columns} searchPlaceholder="Search orders..." />
      </div>
    </div>
  );
};

export default RentalOrders;
