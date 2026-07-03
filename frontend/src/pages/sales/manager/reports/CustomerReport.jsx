import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerReport = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  
  // Filters
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]); // 90 days default
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [customerType, setCustomerType] = useState('');

  const loadReport = () => {
    // Base aggregation
    const result = salesState.generateReport({
      dateFrom, dateTo,
      granularity: 'month',
      groupBy: ['customer']
    });

    // Compute Advanced Customer Metrics
    const customers = salesState.getCustomers();
    const filteredCustomers = customerType ? customers.filter(c => c.type === customerType) : customers;
    
    const activeCustomers = result.groupings.customer.filter(c => customerType ? c.type === customerType : true);
    const activeCount = activeCustomers.length;
    
    // Retention (simplistic: ordered in prior period AND this period)
    const df = new Date(dateFrom);
    const dt = new Date(dateTo);
    const duration = dt - df;
    const priorStart = new Date(df.getTime() - duration).toISOString().split('T')[0];
    const priorEnd = new Date(dt.getTime() - duration).toISOString().split('T')[0];
    
    const priorResult = salesState.generateReport({ dateFrom: priorStart, dateTo: priorEnd, groupBy: ['customer'] });
    const priorActive = priorResult.groupings.customer;
    
    let retained = 0;
    priorActive.forEach(p => {
        if (activeCustomers.find(a => a.key === p.key)) retained++;
    });
    const retentionRate = priorActive.length > 0 ? (retained / priorActive.length) * 100 : 0;
    
    // New Customers (created in this period)
    const newCustomers = filteredCustomers.filter(c => new Date(c.created_at) >= df && new Date(c.created_at) <= dt).length;
    
    // Outstanding Credit (reused logic)
    const invoices = salesState.getInvoices().filter(i => i.status !== 'paid');
    const creditList = customers.map(c => {
        const cInvs = invoices.filter(i => i.customer_id === c.id);
        const outstanding = cInvs.reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);
        return { ...c, outstanding };
    }).filter(c => c.outstanding > 0);

    result.advanced = {
        totalCustomers: filteredCustomers.length,
        activeCount,
        avgRevenuePerCustomer: activeCount > 0 ? Math.round(result.metrics.totalSalesCents / activeCount) : 0,
        retentionRate,
        newCustomers,
        topCustomers: activeCustomers.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        creditList: creditList.sort((a, b) => b.outstanding - a.outstanding)
    };
      
    setData(result);
    salesState.notify('CUSTOMER_REPORT');
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, customerType]);

  const handleSendStatement = (id) => {
      // In a real app, this might just open the statement view, or trigger an API email
      navigate(`/sales/manager/customers/statement?customerId=${id}`);
  };

  const handleSendPromo = (customer) => {
      if (!customer.email && !customer.phone) {
          alert(`Cannot send promo to ${customer.name}: No email or phone on file.`);
          return;
      }
      // Simulated API call
      console.log(`Sending promo to ${customer.name}`);
      salesState.notify('INFO'); // Using generic info toast for demo
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Customer Report</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Behavior, retention, and credit risk analysis.</p>
        </div>
        <button style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        <select value={customerType} onChange={e => setCustomerType(e.target.value)} style={inputStyle}>
            <option value="">All Types</option>
            <option value="walk_in">Walk In</option>
            <option value="credit">Credit</option>
            <option value="wholesale">Wholesale</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Active Customers" value={`${data.advanced.activeCount} / ${data.advanced.totalCustomers}`} />
        <StatCard title="Avg Rev / Customer" value={<CurrencyDisplay amountCents={data.advanced.avgRevenuePerCustomer} />} />
        <StatCard title="Retention Rate" value={`${data.advanced.retentionRate.toFixed(1)}%`} />
        <StatCard title="New Customers" value={`+${data.advanced.newCustomers}`} />
        <StatCard title="Total Rev (Period)" value={<CurrencyDisplay amountCents={data.metrics.totalSalesCents} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top Customers by Revenue</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.advanced.topCustomers.map((c, i) => (
                    <li key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.advanced.topCustomers.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <div>
                            <div style={{ color: '#334155', fontWeight: '500' }}>{c.name || 'Unknown'}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>{c.count} transactions</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={c.revenue} /></div>
                            <button onClick={() => handleSendPromo({name: c.name, email: null})} title="Send Promo" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8b5cf6' }}><Mail size={16} /></button>
                        </div>
                    </li>
                ))}
                {data.advanced.topCustomers.length === 0 && <li style={{ color: '#94a3b8' }}>No active customers in period.</li>}
            </ul>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Outstanding Credit List</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.advanced.creditList.map((c, i) => (
                    <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.advanced.creditList.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <div>
                            <div style={{ color: '#334155', fontWeight: '500' }}>{c.name}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>Limit: {c.credit_limit_cents / 100}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ fontWeight: '600', color: '#ef4444' }}><CurrencyDisplay amountCents={c.outstanding} /></div>
                            <button onClick={() => handleSendStatement(c.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Statement</button>
                        </div>
                    </li>
                ))}
                {data.advanced.creditList.length === 0 && <li style={{ color: '#10b981' }}>No outstanding credit!</li>}
            </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = '#0f172a' }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '500' }}>{title}</h3>
    <div style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</div>
  </div>
);

const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' };

export default CustomerReport;
