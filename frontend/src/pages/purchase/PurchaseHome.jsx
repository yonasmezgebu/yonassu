import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Clipboard, Inbox, Truck, DollarSign, Wallet, RotateCcw, Users, Clock, ArrowRight } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';

const STYLES = `
  .sc-root {
    width: 100%;
    min-height: 100%;
    background: #F5F6FA;
    font-family: 'Inter', system-ui, sans-serif;
    color: #111827;
    box-sizing: border-box;
    padding: 24px;
  }


  /* ── Header ── */
  .sc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
  }
  .sc-header-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 4px 0;
    letter-spacing: -0.01em;
  }
  .sc-header-sub {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
  }

  /* ── Header Context Tags ── */
  .sc-header-tags {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .sc-tag {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 12px;
  }
  .sc-tag-blue { background: #EFF6FF; color: #1D4ED8; }
  .sc-tag-green { background: #DCFCE7; color: #15803D; }

  /* ── Grid Layouts ── */
  .sc-kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .sc-secondary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }

  @media (max-width: 1400px) {
    .sc-kpi-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 1100px) {
    .sc-kpi-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .sc-kpi-grid, .sc-secondary-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 500px) {
    .sc-kpi-grid, .sc-secondary-grid { grid-template-columns: 1fr; }
  }

  /* ── KPI Cards ── */
  .sc-kpi-card {
    background: #FFFFFF;
    border-radius: 10px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid #E5E7EB;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .sc-kpi-card:hover {
    border-color: #D97706;
    box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.1), 0 2px 4px -1px rgba(217, 119, 6, 0.06);
    transform: translateY(-2px);
  }
  .sc-kpi-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sc-kpi-content {
    flex: 1;
  }
  .sc-kpi-label {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .sc-kpi-value {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  }

  /* ── Action Cards ── */
  .sc-action-card {
    background: #FFFFFF;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sc-action-card:hover {
    border-color: #D97706;
    background: #FFFBEB;
  }
  .sc-action-card:hover .sc-action-arrow {
    transform: translateX(4px);
    color: #D97706;
  }
  .sc-action-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  .sc-action-desc {
    font-size: 13px;
    color: #6B7280;
  }
  .sc-action-arrow {
    color: #9CA3AF;
    transition: all 0.2s ease;
  }
`;

const KPI = ({ title, value, icon: Icon, color, bg, onClick }) => (
  <div className="sc-kpi-card" onClick={onClick}>
    <div className="sc-kpi-icon" style={{ background: bg }}>
      <Icon size={22} color={color} />
    </div>
    <div className="sc-kpi-content">
      <div className="sc-kpi-label">{title}</div>
      <div className="sc-kpi-value">{value}</div>
    </div>
  </div>
);

const PurchaseHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real Data States
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [openTenders, setOpenTenders] = useState(0);
  const [totalPOs, setTotalPOs] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [supplierBids, setSupplierBids] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [receivedToday, setReceivedToday] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [budgetRemaining, setBudgetRemaining] = useState(0);
  const [activeReturns, setActiveReturns] = useState(0);

  useEffect(() => {
    // Suppliers — response: { data: [...] }
    apiClient.get('/suppliers')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data)) setTotalSuppliers(data.length);
      })
      .catch(() => setTotalSuppliers(0));

    // Open Tenders — response: { data: [...] }
    apiClient.get('/tenders')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data)) {
          const openCount = data.filter(t => {
            const s = t.status?.toLowerCase();
            return s === 'published' || s === 'open';
          }).length;
          setOpenTenders(openCount);
        }
      })
      .catch(() => setOpenTenders(0));

    // Purchase Orders — response: { data: { orders: [...], pagination: {} } }
    apiClient.get('/purchase/orders')
      .then(res => {
        const data = res.data?.data;
        const orders = data?.orders ?? data;
        setTotalPOs(Array.isArray(orders) ? orders.length : (data?.pagination?.total ?? 0));
      })
      .catch(() => setTotalPOs(0));

    // Pending Requests — /procurement/requests returns { data: [...] }
    apiClient.get('/procurement/requests')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data)) {
          const pending = data.filter(r => {
            const s = r.status?.toUpperCase();
            return s === 'PENDING' || s === 'SUBMITTED' || s === 'PENDING_CEO';
          }).length;
          setPendingRequests(pending);
        }
      })
      .catch(() => setPendingRequests(0));

    // Quotations — response: { data: [...] }
    apiClient.get('/purchase/quotations')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data)) setSupplierBids(data.length);
      })
      .catch(() => setSupplierBids(0));

    // Statistics — response: { data: { totalSpendThisYear, pendingReceiving, ... } }
    apiClient.get('/purchase/statistics')
      .then(res => {
        const data = res.data?.data;
        if (data) {
          setTotalSpend(parseFloat(data.totalSpendThisYear) || 0);
          setPendingDeliveries(parseInt(data.pendingReceiving) || 0);
        }
      })
      .catch(() => {
        setTotalSpend(0);
        setPendingDeliveries(0);
      });

    // Budget & Returns: no endpoint yet — show 0 (honest)
    setBudgetRemaining(0);
    setActiveReturns(0);
    setReceivedToday(0);
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="sc-root">
      <style>{STYLES}</style>

      <div className="sc-header">
        <div>
          <h1 className="sc-header-title">Welcome back!</h1>
          <p className="sc-header-sub">
            <span style={{ fontWeight: 600, color: '#111827' }}>{user?.full_name || 'Abebe Kebede'}</span> • {dateStr}
          </p>
          <div className="sc-header-tags">
             <span className="sc-tag sc-tag-blue">Department: Purchase</span>
             <span className="sc-tag sc-tag-green">18 Modules Active</span>
          </div>
        </div>
      </div>

      {/* 10 KPIs exactly as original order */}
      <div className="sc-kpi-grid">
        <KPI title="Total Suppliers" value={totalSuppliers} icon={Users} color="#1d4ed8" bg="#eff6ff" onClick={() => navigate('/purchase/suppliers')} />
        <KPI title="Total Purchase Orders" value={totalPOs} icon={ShoppingCart} color="#8b5cf6" bg="#ede9fe" onClick={() => navigate('/purchase/orders')} />
        <KPI title="Pending Requests" value={pendingRequests} icon={FileText} color="#3b82f6" bg="#eff6ff" onClick={() => navigate('/purchase/requests')} />
        <KPI title="Open Tenders" value={openTenders} icon={Clipboard} color="#0891b2" bg="#cffafe" onClick={() => navigate('/purchase/smart-tenders')} />
        <KPI title="Supplier Bids" value={supplierBids} icon={Inbox} color="#059669" bg="#dcfce7" onClick={() => navigate('/purchase/quotations')} />

        <KPI title="Pending Deliveries" value={pendingDeliveries} icon={Clock} color="#d97706" bg="#fef3c7" onClick={() => navigate('/purchase/reports/delivery')} />
        <KPI title="Received Today" value={receivedToday} icon={Truck} color="#06b6d4" bg="#cffafe" onClick={() => navigate('/purchase/orders')} />
        <KPI title="Total Spend (MTD)" value={`ETB ${totalSpend.toLocaleString()}`} icon={DollarSign} color="#dc2626" bg="#fef2f2" onClick={() => navigate('/purchase/reports/financial')} />
        <KPI title="Budget Remaining" value={`ETB ${budgetRemaining.toLocaleString()}`} icon={Wallet} color="#16a34a" bg="#dcfce7" onClick={() => navigate('/purchase/reports/financial')} />
        <KPI title="Active Returns" value={activeReturns} icon={RotateCcw} color="#ea580c" bg="#ffedd5" onClick={() => navigate('/purchase/returns')} />
      </div>

      <div className="sc-header" style={{ marginTop: '32px', marginBottom: '16px' }}>
        <h2 className="sc-header-title" style={{ fontSize: '18px' }}>Quick Actions</h2>
      </div>

      <div className="sc-secondary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="sc-action-card" onClick={() => navigate('/purchase/suppliers')}>
          <div>
            <div className="sc-action-title">Supplier Directory</div>
            <div className="sc-action-desc">Manage {totalSuppliers} registered suppliers</div>
          </div>
          <ArrowRight className="sc-action-arrow" size={20} />
        </div>
        
        <div className="sc-action-card" onClick={() => navigate('/purchase/requests')}>
          <div>
            <div className="sc-action-title">Purchase Requests</div>
            <div className="sc-action-desc">Review {pendingRequests} pending requests</div>
          </div>
          <ArrowRight className="sc-action-arrow" size={20} />
        </div>
      </div>

    </div>
  );
};

export default PurchaseHome;
