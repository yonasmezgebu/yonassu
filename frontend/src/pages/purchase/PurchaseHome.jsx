import React from 'react';
import { ShoppingCart, FileText, Clipboard, Inbox, Truck, CheckCircle, DollarSign, Wallet, RotateCcw, Users, Package, Clock } from 'lucide-react';
import { getPurchaseSummary } from '../../utils/purchaseTransactionService';
import { financeState } from '../../utils/financeTransactionService';

const QuickSummaryCard = ({ title, value, icon: Icon, color, bg }) => (
  <div style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: `1px solid ${bg}`, display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ background: bg, padding: 14, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

const PurchaseHome = () => {
  const summary = getPurchaseSummary();
  const totalSuppliers = financeState.suppliers.length;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Context */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px' }}>Purchase Manager Dashboard</h1>
        <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 14, fontWeight: 500, flexWrap: 'wrap' }}>
          <span>Welcome, <strong>Abebe Kebede</strong></span>
          <span>•</span>
          <span>{dateStr}</span>
          <span>•</span>
          <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Department: Purchase</span>
          <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>18 Modules Active</span>
        </div>
      </div>

      {/* Quick Purchase Summary Widget — 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
        <QuickSummaryCard title="Total Suppliers" value={totalSuppliers} icon={Users} color="#1d4ed8" bg="#eff6ff" />
        <QuickSummaryCard title="Total Purchase Orders" value={summary.totalPOs} icon={ShoppingCart} color="#8b5cf6" bg="#ede9fe" />
        <QuickSummaryCard title="Pending Requests" value={summary.pendingRequests} icon={FileText} color="#3b82f6" bg="#eff6ff" />
        <QuickSummaryCard title="Open Tenders" value={summary.openTenders} icon={Clipboard} color="#0891b2" bg="#cffafe" />
        <QuickSummaryCard title="Supplier Bids" value={summary.supplierBids} icon={Inbox} color="#059669" bg="#dcfce7" />

        <QuickSummaryCard title="Pending Deliveries" value={summary.pendingDeliveries} icon={Clock} color="#d97706" bg="#fef3c7" />
        <QuickSummaryCard title="Received Today" value={summary.receivedToday} icon={Truck} color="#06b6d4" bg="#cffafe" />
        <QuickSummaryCard title="Total Spend (MTD)" value={`ETB ${summary.totalSpend.toLocaleString()}`} icon={DollarSign} color="#dc2626" bg="#fef2f2" />
        <QuickSummaryCard title="Budget Remaining" value={`ETB ${summary.budgetRemaining.toLocaleString()}`} icon={Wallet} color="#16a34a" bg="#dcfce7" />
        <QuickSummaryCard title="Active Returns" value={summary.returns} icon={RotateCcw} color="#ea580c" bg="#ffedd5" />
      </div>

      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Supplier List', desc: `${totalSuppliers} suppliers registered`, color: '#1d4ed8', bg: '#eff6ff', path: '/purchase/suppliers' },
          { label: 'Expiring Contracts', desc: 'Review contracts due for renewal', color: '#d97706', bg: '#fef3c7', path: '/purchase/contracts' },
          { label: 'Stock Availability', desc: 'Check current inventory vs reorder levels', color: '#0891b2', bg: '#cffafe', path: '/purchase/stock-availability' },
        ].map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: 10, border: `1px solid ${c.bg}`, padding: '18px 20px', cursor: 'pointer' }}
            onClick={() => window.location.hash = c.path}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseHome;
