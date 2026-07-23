import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Package, Truck, ArrowUpRight, ArrowRightLeft, Sliders, ClipboardCheck, PlusCircle } from 'lucide-react';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98',
  brown:'#8D6E63', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336', sky:'#0288D1',
};

const actions = [
  { label: 'Receive Goods', path: '/pharmacy-store/goods-receiving', icon: <Truck size={24} />, color: G.olive },
  { label: 'Goods Issue', path: '/pharmacy-store/goods-issue', icon: <ArrowUpRight size={24} />, color: G.brown },
  { label: 'Stock Adjustment', path: '/pharmacy-store/stock-adjustment', icon: <Sliders size={24} />, color: G.emerald },
  { label: 'Physical Count', path: '/pharmacy-store/physical-count', icon: <ClipboardCheck size={24} />, color: G.dark },
  { label: 'New Physical Count', path: '/pharmacy-store/physical-count', icon: <ClipboardCheck size={24} />, color: G.sky },
  { label: 'Add New Stock', path: '/pharmacy-store/add-new-stock', icon: <PlusCircle size={24} />, color: G.forest },
  { label: 'Stock List', path: '/pharmacy-store/stock-list', icon: <Package size={24} />, color: G.dark },
];

const StoreQuickAction = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: G.orange, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
            <Zap size={24} color={G.white} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Quick Actions</h1>
            <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>One-click access to frequently used operations</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${a.color}`, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', transition: 'all .1s', outline: 'none' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px)'; e.currentTarget.style.boxShadow = `3px 3px 0 ${a.color}`; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `6px 6px 0 ${a.color}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `6px 6px 0 ${a.color}`; }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: G.lightGray, border: `3px solid ${a.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                {a.icon}
              </div>
              <span style={{ fontWeight: 900, color: G.dark, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreQuickAction;
