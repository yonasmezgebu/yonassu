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
    @keyframes floatLeaf { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(7deg); } }
    @keyframes rowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
    @keyframes laserSweep { 0% { left: -150%; } 100% { left: 150%; } }
    @keyframes colorBlink { 0% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px #8BC34Acc); transform:scale(1.15) rotate(10deg); } 50% { color:#2E8B57; filter:drop-shadow(0 0 14px #2E8B57); transform:scale(1.3) rotate(-10deg); } 75% { color:#87CEEB; filter:drop-shadow(0 0 10px #87CEEBcc); transform:scale(1.15) rotate(5deg); } 100% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } }
    .blink-star { animation: colorBlink 2.5s infinite ease-in-out; display:inline-block; }

    .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
    .artistic-3d-subtitle { font-size:1rem; color:#2E8B57; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
    .btn-sync { position: relative; background: #FFFFFF; color: #1B5E20; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; overflow: hidden; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
    .btn-sync::before { content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%; background: conic-gradient(transparent, transparent, transparent, #4CAF50, #228B22); animation: rotate-border 2s linear infinite; z-index: -2; }
    .btn-sync::after { content: ''; position: absolute; inset: 2px; background: #FFFFFF; border-radius: 6px; z-index: -1; }
    .btn-sync:hover::after { background: #F5F5F5; }
    .btn-sync:active { transform: scale(0.97); }
    @keyframes rotate-border { 100% { transform: rotate(360deg); } }

    .d-card {
      --hover-color: #2E8B57;
      position:relative; overflow:hidden; background-color:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation:fadeUp 0.5s ease both; border:none; cursor:pointer;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,80,120,0.14), 0 0 18px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card:hover::before { animation: laserSweep 0.8s ease-out; }

    .d-card-no-hover {
      --hover-color: #228B22;
      position:relative; overflow:hidden; background:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s; animation:fadeUp 0.5s ease both;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card-no-hover::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.2) 20%, rgba(255,0,255,0.2) 50%, rgba(0,255,0,0.2) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card-no-hover:hover::before { animation: laserSweep 1s ease-out; }

    .alert-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:14px; padding:13px 16px; background:rgba(230,242,235,0.5); border-radius:0; cursor:pointer; transition:all 0.25s; border:1.5px solid transparent; margin-bottom:10px; }
    .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .alert-row:hover { background:white; border-color:var(--row-c); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
    .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px; gap:12px; align-items:center; padding:11px 14px; border-radius:0; transition:background 0.2s; cursor:pointer; }
    .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .cat-row:hover { background:rgba(230,242,235,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
    .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .top-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:0; background:rgba(230,242,235,0.45); margin-bottom:8px; transition:all 0.2s; cursor:pointer; }
    .top-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(107,142,35,0.3), rgba(107,142,35,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .top-row:hover { background:white; box-shadow:0 3px 12px rgba(0,80,120,0.09); border:1px solid rgba(107,142,35,0.4); }
    .top-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .qa-card {
      --hover-color: #2E8B57;
      --base-top: transparent;
      position:relative; overflow:hidden; background:rgba(255,255,255,0.65); border-radius:0; padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(.4,0,.2,1); border:none;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color)), linear-gradient(to right, var(--base-top), var(--base-top));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%, 0 0; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%, 100% 4px;
    }
    .qa-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,255,0.6), rgba(255,0,255,0.6), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .qa-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%, 100% 4px; }
    .qa-card:hover::before { animation: laserSweep 0.6s ease-out; }
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
