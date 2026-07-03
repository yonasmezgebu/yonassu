import React, { useContext } from 'react';
import { ShoppingCart, FileText, AlertTriangle, CheckCircle, TrendingUp, AlertCircle, Layers } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { mockInventoryState } from '../../utils/storeTransactionService';

const PharmacyWorkerHome = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Calculate mock tasks summary
  const totalTasks = mockInventoryState.tasks.filter(t => t.deadline === new Date().toISOString().slice(0, 10)).length;
  const completedTasks = mockInventoryState.tasks.filter(t => t.deadline === new Date().toISOString().slice(0, 10) && t.status === 'Completed').length;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: '0 0 8px', color: '#0f172a' }}>Pharmacy Worker Dashboard</h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>
          Welcome, <strong>Abebe Kebede</strong> | {currentDate} | <strong>Branch A</strong> | Role: Pharmacy Worker
        </p>
      </div>

      {!hasManagerPermission && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle color="#dc2626" />
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#991b1b', fontSize: 15 }}>Manager Permission Required</h4>
            <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>Sales and Stock Operations (Items 1-3, 11-15) are currently disabled. Please contact your Pharmacy Manager to enable transactional capabilities.</p>
          </div>
        </div>
      )}

      {/* Expanded Quick Pharmacy Worker Summary Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        
        {/* Row 1 */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>TODAY'S SALES</div>
            <div style={{ padding: 8, background: '#ecfdf5', borderRadius: 8 }}><TrendingUp size={20} color="#059669" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>$1,250.00</div>
          <div style={{ fontSize: 13, color: '#059669', marginTop: 4, fontWeight: 500 }}>↑ 12% from yesterday</div>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>TODAY'S TRANSACTIONS</div>
            <div style={{ padding: 8, background: '#dcfce7', borderRadius: 8 }}><ShoppingCart size={20} color="#16a34a" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>45</div>
          <div style={{ fontSize: 13, color: '#16a34a', marginTop: 4, fontWeight: 500 }}>12 Walk-ins, 33 Online</div>
        </div>
        
        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>PENDING PRESCRIPTIONS</div>
            <div style={{ padding: 8, background: '#fef3c7', borderRadius: 8 }}><FileText size={20} color="#d97706" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>18</div>
          <div style={{ fontSize: 13, color: '#d97706', marginTop: 4, fontWeight: 500 }}>Requires attention</div>
        </div>

        {/* Row 2 */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>LOW STOCK ITEMS</div>
            <div style={{ padding: 8, background: '#fee2e2', borderRadius: 8 }}><AlertTriangle size={20} color="#dc2626" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>5</div>
          <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>Items below minimum</div>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>EXPIRING ITEMS</div>
            <div style={{ padding: 8, background: '#fef2f2', borderRadius: 8 }}><AlertTriangle size={20} color="#ef4444" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>12</div>
          <div style={{ fontSize: 13, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>Expiring within 30 days</div>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>TODAY'S TASKS</div>
            <div style={{ padding: 8, background: '#e0e7ff', borderRadius: 8 }}><CheckCircle size={20} color="#4f46e5" /></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>{totalTasks} <span style={{ fontSize: 18, color: '#94a3b8' }}>/ {completedTasks} Done</span></div>
          <div style={{ fontSize: 13, color: '#4f46e5', marginTop: 4, fontWeight: 500 }}>{totalTasks - completedTasks} remaining</div>
        </div>

      </div>
    </div>
  );
};

export default PharmacyWorkerHome;
