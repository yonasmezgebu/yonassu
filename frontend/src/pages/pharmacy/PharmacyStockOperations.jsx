import React, { useState, useEffect, useRef } from 'react';
import './StockOperations.css';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package, TrendingDown, Clock, AlertTriangle,
  Activity, Zap, Layers, FlaskConical
} from 'lucide-react';

import PharmacyInventoryView           from './PharmacyInventoryView';
import PharmacyWorkerLowStock          from './PharmacyWorkerLowStock';
import PharmacyWorkerExpiringMedicines from './PharmacyWorkerExpiringMedicines';
import ExpiredDrugReport               from './ExpiredDrugReport';
import SegmentedSpinner                from '../../components/ui/SegmentedSpinner';

/* ─── tab definitions ───────────────────────────────────── */
const TABS = [
  { id: 'current',  label: 'Current Stock',  Icon: Package,       statusColor: '#16a34a' },
  { id: 'low',      label: 'Low Stock',       Icon: TrendingDown,  statusColor: '#dc2626' },
  { id: 'expiring', label: 'Expiring Soon',   Icon: Clock,         statusColor: '#d97706' },
  { id: 'expired',  label: 'Expired',         Icon: AlertTriangle, statusColor: '#9333ea' },
];

export default function PharmacyStockOperations() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const urlTab          = searchParams.get('tab');
  const [tab, setTab]   = useState(urlTab || 'current');
  const [spinning, setSpinning] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (urlTab && urlTab !== tab) setTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (t) => {
    setTab(t);
    navigate(`?tab=${t}`, { replace: true });
  };

  const handleRefresh = () => {
    setSpinning(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="pso-root">
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div className="pso-header-icon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="pso-title">Stock Operations</h1>
            <p className="pso-subtitle">Manage · Track · Audit</p>
          </div>
        </div>

        <div className="pso-header-right">
          {/* Live status pills */}
          <div className="pso-status-pills">
            <span className="pso-pill pso-pill-green"><Zap size={12} /> Live Data</span>
            <span className="pso-pill pso-pill-blue"><FlaskConical size={12} /> Pharmacy</span>
            <span className="pso-pill pso-pill-amber"><Layers size={12} /> Stock Ops</span>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            className="pso-btn-refresh"
            disabled={spinning}
          >
            <SegmentedSpinner size={15} spinning={spinning} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div className="pso-tab-bar">
        {TABS.map(({ id, label, Icon, statusColor }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`pso-tab${tab === id ? ' pso-tab-active' : ''}`}
          >
            <span
              className="pso-tab-dot"
              style={{ background: tab === id ? '#2563EB' : statusColor }}
            />
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div className="pso-content">
        {tab === 'current'  && <PharmacyInventoryView           hideHeader={true} refreshTrigger={refreshTrigger} />}
        {tab === 'low'      && <PharmacyWorkerLowStock           hideHeader={true} refreshTrigger={refreshTrigger} />}
        {tab === 'expiring' && <PharmacyWorkerExpiringMedicines  hideHeader={true} refreshTrigger={refreshTrigger} />}
        {tab === 'expired'  && <ExpiredDrugReport                hideHeader={true} refreshTrigger={refreshTrigger} />}
      </div>
    </div>
  );
}
