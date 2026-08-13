import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Package, Pill, DollarSign, AlertTriangle, Layers, RefreshCw } from 'lucide-react';

export default function CEOStoreRequisitions() {
  const [stats, setStats] = useState(null);
  const [generalStats, setGeneralStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [pharmacyRes, generalRes] = await Promise.all([
        apiClient.get('/store-inventory/dashboard'),
        apiClient.get('/store/dashboard')
      ]);
      setStats(pharmacyRes.data.data || pharmacyRes.data);
      setGeneralStats(generalRes.data.data || generalRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#0F172A' }}>
            <Package size={26} color="#059669" /> Enterprise Store Overview
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 13 }}>
            Live monitoring of all corporate inventory assets
          </p>
        </div>
        <button onClick={fetchStats} disabled={loading}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'ceo-store-spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* ── Pharmacy Store Overview Section ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill size={18} color="#059669" /> Pharmacy Store Inventory
          <span style={{ fontSize: 11, fontWeight: 600, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 12 }}>Live</span>
        </h2>
        
        {loading && !stats ? (
          <div style={{ display: 'flex', gap: 16 }}>
             {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 110, background: '#E2E8F0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Total Value */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Stock Value</span>
                <div style={{ padding: 8, background: '#ECFDF5', borderRadius: 8 }}><DollarSign size={18} color="#059669" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>ETB {Number(stats?.totalValue || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Pharmacy store valuation</div>
            </div>
            {/* Total SKUs */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total SKUs</span>
                <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8 }}><Layers size={18} color="#3B82F6" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{Number(stats?.totalItems || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Distinct stock lines</div>
            </div>
            {/* Total Quantity */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Quantity</span>
                <div style={{ padding: 8, background: '#F3E8FF', borderRadius: 8 }}><Package size={18} color="#8B5CF6" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{Number(stats?.totalQuantity || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Total physical units</div>
            </div>
            {/* Low Stock */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Low Stock</span>
                <div style={{ padding: 8, background: (stats?.lowStockCount > 0 ? '#FEF2F2' : '#F8FAFC'), borderRadius: 8 }}>
                  <AlertTriangle size={18} color={stats?.lowStockCount > 0 ? '#EF4444' : '#94A3B8'} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: stats?.lowStockCount > 0 ? '#EF4444' : '#0F172A' }}>{Number(stats?.lowStockCount || 0)}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Items below minimum</div>
            </div>
          </div>
        )}
      </div>

      {/* ── General Store Overview Section ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} color="#475569" /> General Store Inventory
          <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 12 }}>Live</span>
        </h2>
        
        {loading && !generalStats ? (
          <div style={{ display: 'flex', gap: 16 }}>
             {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 110, background: '#E2E8F0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Total Value */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Stock Value</span>
                <div style={{ padding: 8, background: '#F8FAFC', borderRadius: 8 }}><DollarSign size={18} color="#475569" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>ETB {Number(generalStats?.totalValue || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>General store valuation</div>
            </div>
            {/* Total SKUs */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total SKUs</span>
                <div style={{ padding: 8, background: '#F8FAFC', borderRadius: 8 }}><Layers size={18} color="#475569" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{Number(generalStats?.totalItems || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Distinct material lines</div>
            </div>
            {/* Total Quantity */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Quantity</span>
                <div style={{ padding: 8, background: '#F8FAFC', borderRadius: 8 }}><Package size={18} color="#475569" /></div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{Number(generalStats?.totalQuantity || 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Total physical units</div>
            </div>
            {/* Low Stock */}
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Low Stock</span>
                <div style={{ padding: 8, background: (generalStats?.lowStockCount > 0 ? '#FEF2F2' : '#F8FAFC'), borderRadius: 8 }}>
                  <AlertTriangle size={18} color={generalStats?.lowStockCount > 0 ? '#EF4444' : '#94A3B8'} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: generalStats?.lowStockCount > 0 ? '#EF4444' : '#0F172A' }}>{Number(generalStats?.lowStockCount || 0)}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Items below minimum</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes ceo-store-spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
