import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Package, Truck, ArrowUpRight, ArrowLeftRight, Sliders, ClipboardCheck, FileText, PlusCircle } from 'lucide-react';

const actions = [
  { label: 'New Goods Receiving', path: '/store/goods-receiving', icon: <Truck size={22} />, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'New Goods Issue', path: '/store/goods-issue', icon: <ArrowUpRight size={22} />, color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'New Stock Transfer', path: '/store/stock-transfer', icon: <ArrowLeftRight size={22} />, color: '#8b5cf6', bg: '#f3e8ff', border: '#c4b5fd' },
  { label: 'New Stock Adjustment', path: '/store/stock-adjustment', icon: <Sliders size={22} />, color: '#f59e0b', bg: '#fef3c7', border: '#fde68a' },
  { label: 'New Physical Count', path: '/store/physical-count', icon: <ClipboardCheck size={22} />, color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
  { label: 'New Requisition', path: '/store/requisitions', icon: <FileText size={22} />, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { label: 'Add New Stock', path: '/store/add-new-stock', icon: <PlusCircle size={22} />, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { label: 'Stock List', path: '/store/stock-list', icon: <Package size={22} />, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
];

const StoreQuickAction = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap color="#f59e0b" size={28} /> QUICK ACTION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>One-click access to frequently used store operations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {actions.map(a => (
          <div key={a.label} onClick={() => navigate(a.path)}
            style={{ background: a.bg, border: '1px solid ' + a.border, borderRadius: 12, padding: 24, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: a.bg, border: '2px solid ' + a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
              {a.icon}
            </div>
            <span style={{ fontWeight: 700, color: a.color, fontSize: 14 }}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreQuickAction;
