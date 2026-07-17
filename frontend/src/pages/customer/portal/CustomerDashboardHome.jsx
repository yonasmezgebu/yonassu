import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import api from '../../../services/apiClient';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, CreditCard, Award, Send } from 'lucide-react';

const CustomerDashboardHome = () => {
  const [data, setData] = useState(null);
  const [bids, setBids] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      setData(customerState.getDashboardSummary());
      customerState.notify('PAGE_LOAD');
    };
    load();

    // Fetch live bids from backend
    const fetchBids = async () => {
      try {
        const res = await api.get('/public-tenders/customer/bids');
        setBids(res.data || []);
      } catch (err) {
        console.error('Failed to load bids:', err);
      }
    };
    fetchBids();

    return customerState.subscribe(load);
  }, []);

  if (!data) return <div style={{ padding: '24px' }}>Loading...</div>;

  const BidStatusBadge = ({ status }) => {
    const map = {
      pending: { bg: '#f1f5f9', color: '#475569', label: 'Pending' },
      recommended: { bg: '#dcfce7', color: '#166534', label: '⭐ Recommended' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
      winner: { bg: '#ede9fe', color: '#5b21b6', label: '🏆 Winner' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
    return (
      <span style={{
        fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
        background: s.bg, color: s.color, display: 'inline-block'
      }}>{s.label}</span>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Welcome Back</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage your orders, payments, and account all in one place.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/customer/payments/pay')} style={{ padding: '10px 16px', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Pay Invoice
            </button>
            <button onClick={() => navigate('/customer/orders/new')} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                + Place New Order
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <MetricCard icon={<Package size={24} color="#3b82f6" />} title="Total Orders" value={data.totalOrders} bg="#eff6ff" />
        <MetricCard icon={<Clock size={24} color="#f59e0b" />} title="Pending Orders" value={data.pendingOrders} bg="#fffbeb" />
        <MetricCard icon={<CheckCircle size={24} color="#10b981" />} title="Completed Orders" value={data.completedOrders} bg="#ecfdf5" />
        <MetricCard icon={<CreditCard size={24} color="#ef4444" />} title="Outstanding Balance" value={<CurrencyDisplay amountCents={data.outstandingBalanceCents} />} bg="#fef2f2" />
        <MetricCard icon={<Award size={24} color="#8b5cf6" />} title="Loyalty Points" value={data.loyaltyPoints} bg="#f5f3ff" />
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Recent Orders</h3>
        {data.recentOrders.length === 0 ? (
            <p style={{ color: '#64748b' }}>You haven't placed any orders yet.</p>
        ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px' }}>Order Number</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Fulfillment</th>
                    </tr>
                </thead>
                <tbody>
                    {data.recentOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '500', color: '#0f172a' }}>{order.order_number}</td>
                            <td style={{ padding: '12px', color: '#475569' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '12px', fontWeight: '600' }}><CurrencyDisplay amountCents={order.total_cents} /></td>
                            <td style={{ padding: '12px' }}><SalesStatusBadge status={order.fulfillment_status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginTop: '32px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={20} color="#3b82f6" /> My Tender Bids
        </h3>
        {bids.length === 0 ? (
            <p style={{ color: '#64748b' }}>You haven't submitted any bids yet. Visit the public tenders page to start bidding.</p>
        ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px' }}>Tender</th>
                        <th style={{ padding: '12px' }}>Date Submitted</th>
                        <th style={{ padding: '12px' }}>Total Amount</th>
                        <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bids.map(bid => (
                        <tr key={bid.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '500', color: '#0f172a' }}>
                                <div>{bid.tender_title}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{bid.tender_number}</div>
                            </td>
                            <td style={{ padding: '12px', color: '#475569' }}>{new Date(bid.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '12px', fontWeight: '600', fontFamily: 'monospace' }}>
                                {bid.total_birr}.{String(bid.total_cent || 0).padStart(2, '0')} ETB
                            </td>
                            <td style={{ padding: '12px' }}><BidStatusBadge status={bid.bid_status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, bg }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ backgroundColor: bg, padding: '12px', borderRadius: '50%' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{value}</div>
        </div>
    </div>
);

export default CustomerDashboardHome;
