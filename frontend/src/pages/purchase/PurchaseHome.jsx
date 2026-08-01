import React from 'react';
import { ShoppingCart, FileText, Clipboard, Inbox, Truck, CheckCircle, DollarSign, Wallet, RotateCcw, Users, Package, Clock, Sprout } from 'lucide-react';
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
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes colorBlink { 0% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px #8BC34Acc); transform:scale(1.15) rotate(10deg); } 50% { color:#2E8B57; filter:drop-shadow(0 0 14px #2E8B57); transform:scale(1.3) rotate(-10deg); } 75% { color:#87CEEB; filter:drop-shadow(0 0 10px #87CEEBcc); transform:scale(1.15) rotate(5deg); } 100% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } }
        .blink-star { animation: colorBlink 2.5s infinite ease-in-out; display:inline-block; }
        .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 14, fontWeight: 500, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>Welcome, <strong>Abebe Kebede</strong></span>
            <span>•</span>
            <span>{dateStr}</span>
          </div>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Department: Purchase</span>
            <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>18 Modules Active</span>
          </div>
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
