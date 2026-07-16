import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, TrendingDown, Clock, AlertTriangle, RefreshCw, Box } from 'lucide-react';

import PharmacyInventoryView from './PharmacyInventoryView';
import PharmacyWorkerLowStock from './PharmacyWorkerLowStock';
import PharmacyWorkerExpiringMedicines from './PharmacyWorkerExpiringMedicines';
import ExpiredDrugReport from './ExpiredDrugReport';

export default function PharmacyStockOperations() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab');

  const [tab, setTab] = useState(urlTab || 'current');

  useEffect(() => {
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    navigate(`?tab=${newTab}`, { replace: true });
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f6f5ef' }}>
      
      {/* Header section identical to Sales */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#161e2e', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Playfair Display', serif" }}>
            STOCK OPERATIONS
          </h1>
          <div style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: 'white', width: 60, height: 60, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{tab === 'current' ? '4' : '4'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>TABS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(145deg, #e6e6e6, #ffffff)', boxShadow: '5px 5px 10px #d1d1d1, -5px -5px 10px #ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} strokeWidth={2.5} />
            <span style={{ fontSize: 9, fontWeight: 800, marginTop: 4 }}>REFRESH</span>
          </div>
          <button style={{ padding: '0 24px', height: 50, background: 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(34,197,94,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Box size={18} /> Stock Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', background: '#e5e5e0', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
        <TabBtn 
          id="current" 
          label="Current Stock" 
          icon={<Package size={16} />} 
          active={tab === 'current'} 
          onClick={() => handleTabChange('current')} 
        />
        <TabBtn 
          id="low" 
          label="Low Stock" 
          icon={<TrendingDown size={16} />} 
          active={tab === 'low'} 
          onClick={() => handleTabChange('low')} 
        />
        <TabBtn 
          id="expiring" 
          label="Expiring Soon" 
          icon={<Clock size={16} />} 
          active={tab === 'expiring'} 
          onClick={() => handleTabChange('expiring')} 
        />
        <TabBtn 
          id="expired" 
          label="Expired" 
          icon={<AlertTriangle size={16} />} 
          active={tab === 'expired'} 
          onClick={() => handleTabChange('expired')} 
        />
      </div>

      {/* Content Area - Rendering the actual pages but hiding their redundant headers */}
      <div className="stock-tab-content">
        {tab === 'current' && <PharmacyInventoryView hideHeader={true} />}
        {tab === 'low' && <PharmacyWorkerLowStock hideHeader={true} />}
        {tab === 'expiring' && <PharmacyWorkerExpiringMedicines hideHeader={true} />}
        {tab === 'expired' && <ExpiredDrugReport hideHeader={true} />}
      </div>
    </div>
  );
}

function TabBtn({ id, label, icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 160, padding: '14px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
        fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em',
        background: active ? 'linear-gradient(135deg, #a7f3d0, #34d399)' : 'transparent',
        color: active ? '#065f46' : '#78716c',
        boxShadow: active ? '0 4px 12px rgba(52,211,153,0.3)' : 'none'
      }}
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      {label}
      {count !== undefined && (
        <span style={{ background: active ? 'rgba(255,255,255,0.5)' : '#d6d3d1', color: active ? '#064e3b' : '#57534e', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginLeft: 4 }}>
          {count}
        </span>
      )}
    </button>
  );
}
