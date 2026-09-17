import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Clipboard, Inbox, Truck, DollarSign, Wallet, RotateCcw, Users, Clock, ArrowRight } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';

const STYLES = `
  .dashboard-root {
    width: 100%;
    min-height: 100vh;
    background: #F4F5F7;
    font-family: 'Inter', system-ui, sans-serif;
    color: #172B4D;
    padding: 32px;
    box-sizing: border-box;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  .dashboard-title {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: -0.01em;
    color: #091E42;
  }
  
  .dashboard-subtitle {
    font-size: 14px;
    color: #5E6C84;
    margin: 0;
  }
  
  .section-container {
    margin-bottom: 40px;
  }
  
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #5E6C84;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #DFE1E6;
    padding-bottom: 8px;
  }
  
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  
  @media (max-width: 1200px) {
    .grid-layout { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 900px) {
    .grid-layout { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .grid-layout { grid-template-columns: 1fr; }
  }

  .kpi-card {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(9, 30, 66, 0.1), 0 0 1px rgba(9, 30, 66, 0.1);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  
  .kpi-card:hover {
    border-color: #D97706;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
    transform: translateY(-2px);
  }
  
  .kpi-card:hover::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: #D97706;
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .kpi-title {
    font-size: 14px;
    color: #42526E;
    font-weight: 500;
  }
  
  .kpi-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: 600;
    color: #172B4D;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  
  .kpi-footer {
    font-size: 13px;
    color: #6B778C;
  }
`;

const KPI = ({ title, value, footer, icon: Icon, color, bg, onClick }) => (
  <div className="kpi-card" onClick={onClick}>
    <div className="kpi-header">
      <div className="kpi-title">{title}</div>
      <div className="kpi-icon-wrapper" style={{ backgroundColor: bg, color: color }}>
        <Icon size={20} />
      </div>
    </div>
    <div className="kpi-value">{value}</div>
    {footer && <div className="kpi-footer">{footer}</div>}
  </div>
);

const asList = (body) => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.data)) return body.data;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;
  if (Array.isArray(body.suppliers)) return body.suppliers;
  if (Array.isArray(body.orders)) return body.orders;
  if (Array.isArray(body.tenders)) return body.tenders;
  return [];
};

const PurchaseHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [openTenders, setOpenTenders] = useState(0);
  const [totalPOs, setTotalPOs] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [supplierBids, setSupplierBids] = useState(0);
  const [storeAwaiting, setStoreAwaiting] = useState(0);
  const [storeReceived, setStoreReceived] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [receivedToday, setReceivedToday] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [budgetRemaining, setBudgetRemaining] = useState(null);
  const [activeReturns, setActiveReturns] = useState(0);

  useEffect(() => {
    let mounted = true;
    const live = (fn) => (v) => { if (mounted) fn(v); };

    // Total Suppliers — Supplier Directory subpage uses GET /suppliers
    apiClient.get('/suppliers')
      .then(res => live(setTotalSuppliers)(Array.isArray(res?.data) ? res.data.length : 0))
      .catch(() => live(setTotalSuppliers)(0));

    // Open Tenders — Tender & Bid subpage uses GET /public-tenders/internal
    apiClient.get('/public-tenders/internal')
      .then(res => {
        const list = asList(res);
        const openCount = list.filter(t => ['published', 'open'].includes(String(t.status || '').toLowerCase())).length;
        live(setOpenTenders)(openCount);
      })
      .catch(() => live(setOpenTenders)(0));

    // Purchase Orders — orders subpage uses GET /purchase/orders
    apiClient.get('/purchase/orders')
      .then(res => {
        const container = res?.data && typeof res.data === 'object' ? res.data : {};
        const list = Array.isArray(container.orders) ? container.orders : [];
        live(setTotalPOs)(container.pagination?.total ?? list.length);
        const awaiting = ['Pending', 'Approved', 'Sent'];
        live(setPendingDeliveries)(list.filter(o => awaiting.includes(o.status_name)).length);
        live(setReceivedToday)(list.filter(o => String(o.status_name || '') === 'Received').length);
      })
      .catch(() => {
        live(setTotalPOs)(0);
        live(setPendingDeliveries)(0);
        live(setReceivedToday)(0);
      });

    // Pending Requests — Purchase subpage uses GET /purchase-flow/purchase-requests
    apiClient.get('/purchase-flow/purchase-requests')
      .then(res => {
        const list = asList(res);
        const pendStates = ['PENDING', 'SUBMITTED', 'WAIT', 'PENDING_DECISION', 'APPROVAL'];
        const pendCount = list.filter(r => pendStates.includes(String(r.status || '').toUpperCase())).length;
        live(setPendingRequests)(pendCount || list.length);
      })
      .catch(() => live(setPendingRequests)(0));

    // Supplier Bids — Quotation subpage uses GET /purchase/quotations
    apiClient.get('/purchase/quotations')
      .then(res => {
        const list = asList(res);
        live(setSupplierBids)(list.length);
        live(setStoreAwaiting)(list.filter(q => String(q.status) === 'Converted' && String(q.store_status) === 'pending').length);
        live(setStoreReceived)(list.filter(q => String(q.status) === 'Converted' && String(q.store_status) === 'received').length);
      })
      .catch(() => {
        live(setSupplierBids)(0);
        live(setStoreAwaiting)(0);
        live(setStoreReceived)(0);
      });

    // Active Returns — Returns subpage uses GET /purchase-returns
    apiClient.get('/purchase-returns')
      .then(res => {
        const list = asList(res);
        const activeCount = list.filter(r => !['Completed', 'Cancelled'].includes(String(r.status || ''))).length;
        live(setActiveReturns)(activeCount);
      })
      .catch(() => live(setActiveReturns)(0));

    // Total Spend — purchase statistics endpoint
    apiClient.get('/purchase/statistics')
      .then(res => live(setTotalSpend)(parseFloat(res?.data?.totalSpendThisYear) || 0))
      .catch(() => live(setTotalSpend)(0));

    // Budget Remaining — finance statistics exposes active budget period
    apiClient.get('/finance/statistics/enhanced')
      .then(res => {
        const bu = res?.data?.budgetUtilization;
        const budget = parseFloat(bu?.budget) || 0;
        const used = parseFloat(bu?.used) || 0;
        live(setBudgetRemaining)(Math.max(budget - used, 0));
      })
      .catch(() => live(setBudgetRemaining)(null));

    return () => { mounted = false; };
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const userName = user?.full_name || user?.username || 'User';

  return (
    <div className="dashboard-root">
      <style>{STYLES}</style>

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Procurement Overview</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{userName}</strong> • {dateStr}
          </p>
        </div>
      </div>

      <div className="section-container">
        <div className="section-title">Sourcing & Tenders</div>
        <div className="grid-layout">
          <KPI title="Pending Requests" value={pendingRequests} footer="Awaiting review" icon={FileText} color="#0052CC" bg="#DEEBFF" onClick={() => navigate('/purchase/requests')} />
          <KPI title="Open Tenders" value={openTenders} footer="Published & Open for bids" icon={Clipboard} color="#008DA6" bg="#E6FCFF" onClick={() => navigate('/purchase/smart-tenders')} />
          <KPI title="Supplier Bids" value={supplierBids} footer="Quotations received" icon={Inbox} color="#006644" bg="#E3FCEF" onClick={() => navigate('/purchase/quotations')} />
          <KPI title="Total Suppliers" value={totalSuppliers} footer="Registered in directory" icon={Users} color="#403294" bg="#EAE6FF" onClick={() => navigate('/purchase/suppliers')} />
        </div>
      </div>

      <div className="section-container">
        <div className="section-title">Orders & Logistics</div>
        <div className="grid-layout">
          <KPI title="Purchase Orders" value={totalPOs} footer="Total orders created" icon={ShoppingCart} color="#0052CC" bg="#DEEBFF" onClick={() => navigate('/purchase/orders')} />
          <KPI title="Pending Deliveries" value={pendingDeliveries} footer="Awaiting fulfillment" icon={Clock} color="#FF8B00" bg="#FFFAE6" onClick={() => navigate('/purchase/orders')} />
          <KPI title="Store Waiting" value={storeAwaiting} footer="Sent — awaiting store acceptance" icon={Clock} color="#B45309" bg="#FEF3C7" onClick={() => navigate('/purchase/quotations')} />
          <KPI title="Store Received" value={storeReceived} footer="Accepted by General Store" icon={Truck} color="#15803D" bg="#DCFCE7" onClick={() => navigate('/purchase/quotations')} />
          <KPI title="Received POs" value={receivedToday} footer="Inward shipments received" icon={Truck} color="#008DA6" bg="#E6FCFF" onClick={() => navigate('/purchase/orders')} />
          <KPI title="Active Returns" value={activeReturns} footer="Processing RMA" icon={RotateCcw} color="#DE350B" bg="#FFEBE6" onClick={() => navigate('/purchase/returns')} />
        </div>
      </div>

      <div className="section-container">
        <div className="section-title">Financial Overview</div>
        <div className="grid-layout">
          <KPI title="Total Spend" value={`ETB ${totalSpend.toLocaleString()}`} footer="Year to date" icon={DollarSign} color="#DE350B" bg="#FFEBE6" onClick={() => navigate('/purchase/reports/financial')} />
          <KPI title="Budget Remaining" value={budgetRemaining === null ? '—' : `ETB ${budgetRemaining.toLocaleString()}`} footer="Active budget period" icon={Wallet} color="#006644" bg="#E3FCEF" onClick={() => navigate('/purchase/reports/financial')} />
        </div>
      </div>

    </div>
  );
};

export default PurchaseHome;
