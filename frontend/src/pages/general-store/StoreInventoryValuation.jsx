import React, { useEffect } from 'react';
import { DollarSign, Download, Printer, Filter, PieChart } from 'lucide-react';
import { storeInfo } from '../../utils/storeNotifications';

const SIV_CSS = `
  /* ── Root / safe edge ── */
  .siv-valuation { box-sizing: border-box; width: 100%; min-height: 100%; background: var(--color-bg-page, #F5F6FA); color: var(--color-text-primary, #111827); font-family: 'Inter','Segoe UI',system-ui,-apple-system,'Roboto',sans-serif; padding: 24px; }
  .siv-valuation *, .siv-valuation *::before, .siv-valuation *::after { box-sizing: border-box; }
  .siv-valuation button, .siv-valuation input, .siv-valuation select { font-family: inherit; }
  .siv-content { display: flex; flex-direction: column; gap: 24px; max-width: 1440px; margin: 0 auto; }

  /* ── Toast (app notification confirmation) ── */
  @keyframes sivToastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .siv-toast { position: fixed; right: 24px; bottom: 24px; z-index: 10000; max-width: 380px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; border-left: 4px solid rgba(255,255,255,0.55); background: var(--color-text-primary, #111827); color: #fff; font-size: 13px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.18); animation: sivToastIn 200ms ease; }
  .siv-toast--success { background: var(--color-success, #16A34A); }
  .siv-toast--error { background: var(--color-danger, #DC2626); }
  .siv-toast-icon { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.24); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }

  /* ── Header ── */
  .siv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .siv-header-left { display: flex; align-items: center; gap: 14px; }
  .siv-header-icon { flex-shrink: 0; width: 46px; height: 46px; border-radius: 10px; background: #EFF6FF; color: var(--color-primary, #2563EB); display: flex; align-items: center; justify-content: center; }
  .siv-title { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; }
  .siv-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--color-text-secondary, #6B7280); line-height: 1.5; }
  .siv-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons (yellow hover) ── */
  .siv-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: background 150ms ease-in-out, border-color 150ms ease-in-out, color 150ms ease-in-out, box-shadow 150ms ease-in-out, transform 150ms ease-in-out; }
  .siv-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(234,179,8,0.4); }
  .siv-btn--primary { background: var(--color-primary, #2563EB); border: 1px solid var(--color-primary, #2563EB); color: #fff; }
  .siv-btn--primary:hover { background: #EAB308; border-color: #EAB308; color: #78350F; box-shadow: 0 4px 14px rgba(234,179,8,0.35); }
  .siv-btn--ghost { background: var(--color-bg-card, #FFFFFF); border: 1px solid var(--color-border, #E5E7EB); color: var(--color-text-primary, #111827); }
  .siv-btn--ghost:hover { background: #FEFCE8; border-color: #EAB308; color: #78350F; }

  /* ── KPI cards ── */
  .siv-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
  .siv-kpi { background: var(--color-bg-card, #FFFFFF); border: 1px solid var(--color-border, #E5E7EB); border-top: 3px solid var(--color-text-primary, #111827); border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out, border-color 150ms ease-in-out; }
  .siv-kpi:hover { border-color: #FCD34D; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .siv-kpi--success { border-top-color: var(--color-success, #16A34A); }
  .siv-kpi--info { border-top-color: var(--color-info, #0284C7); }
  .siv-kpi-label { display: block; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-muted, #9CA3AF); margin-bottom: 8px; }
  .siv-kpi-value { display: block; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; font-variant-numeric: tabular-nums; }
  .siv-kpi--success .siv-kpi-value { color: var(--color-success, #16A34A); }
  .siv-kpi--info .siv-kpi-value { color: var(--color-info, #0284C7); }

  /* ── Filter toolbar ── */
  .siv-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--color-bg-card, #FFFFFF); border: 1px solid var(--color-border, #E5E7EB); border-radius: 10px; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .siv-toolbar-icon { display: flex; align-items: center; color: var(--color-text-muted, #9CA3AF); }
  .siv-select { height: 36px; padding: 0 12px; border: 1px solid var(--color-border, #E5E7EB); border-radius: 8px; background: var(--color-bg-card, #FFFFFF); color: var(--color-text-primary, #111827); font-size: 14px; font-weight: 500; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
  .siv-select:hover { border-color: var(--color-warning, #D97706); }
  .siv-select:focus { border-color: var(--color-primary, #2563EB); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

  /* ── Chart cards ── */
  .siv-charts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .siv-card { background: var(--color-bg-card, #FFFFFF); border: 1px solid var(--color-border, #E5E7EB); border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .siv-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .siv-card-icon { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: #EFF6FF; color: var(--color-primary, #2563EB); }
  .siv-card-title { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }

  /* ── Category bars ── */
  .siv-bar-row { margin-bottom: 16px; }
  .siv-bar-row:last-child { margin-bottom: 0; }
  .siv-bar-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
  .siv-bar-name { font-size: 13px; font-weight: 500; }
  .siv-bar-val { font-size: 12px; color: var(--color-text-secondary, #6B7280); font-variant-numeric: tabular-nums; }
  .siv-bar-track { height: 8px; background: #F3F4F6; border-radius: 999px; overflow: hidden; }
  .siv-bar-fill { height: 100%; border-radius: 999px; transition: width 300ms ease; }
  .siv-bar-fill--0 { background: #2563EB; }
  .siv-bar-fill--1 { background: #10B981; }
  .siv-bar-fill--2 { background: #F59E0B; }
  .siv-bar-fill--3 { background: #8B5CF6; }

  /* ── Location list ── */
  .siv-locs { display: flex; flex-direction: column; }
  .siv-loc-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 4px; border-bottom: 1px solid #F3F4F6; transition: background 150ms ease-in-out; }
  .siv-loc-row:last-child { border-bottom: none; }
  .siv-loc-row:hover { background: #FEFCE8; }
  .siv-loc-name { font-size: 14px; font-weight: 500; }
  .siv-loc-val { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }

  /* ── Table ── */
  .siv-table-wrap { overflow-x: auto; }
  .siv-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
  .siv-table thead th { background: #F9FAFB; padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-secondary, #6B7280); white-space: nowrap; border-bottom: 1px solid var(--color-border, #E5E7EB); }
  .siv-table thead th.siv-th-num { text-align: right; }
  .siv-table tbody td { padding: 13px 14px; border-bottom: 1px solid #F3F4F6; }
  .siv-table tbody tr { transition: background 150ms ease-in-out; }
  .siv-table tbody tr:hover { background: #FEFCE8; }
  .siv-table tbody tr:last-child td { border-bottom: none; }
  .siv-td-rank { font-weight: 700; color: var(--color-text-muted, #9CA3AF); font-variant-numeric: tabular-nums; }
  .siv-td-name { font-weight: 600; }
  .siv-td-cat { color: var(--color-text-secondary, #6B7280); }
  .siv-td-num { text-align: right; font-weight: 600; color: var(--color-success, #16A34A); font-variant-numeric: tabular-nums; white-space: nowrap; }

  /* ── Badge ── */
  .siv-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--color-info-bg, #E0F2FE); color: var(--color-info, #0284C7); }

  /* ── Responsive ── */
  @media (max-width: 1024px) { .siv-charts { grid-template-columns: 1fr; } }
  @media (max-width: 768px) {
    .siv-valuation { padding: 16px; }
    .siv-kpis { grid-template-columns: repeat(2, 1fr); }
    .siv-kpi-value { font-size: 26px; }
  }
  @media (max-width: 480px) {
    .siv-valuation { padding: 12px; }
    .siv-kpis { grid-template-columns: 1fr; }
    .siv-title { font-size: 22px; }
    .siv-header-actions { width: 100%; }
    .siv-btn { flex: 1; justify-content: center; height: 44px; }
    .siv-toolbar { flex-direction: column; align-items: stretch; }
    .siv-toolbar-icon { display: none; }
    .siv-select { width: 100%; height: 44px; }
  }
`;

const StoreInventoryValuation = () => {
  useEffect(() => {
    storeInfo('💰 Inventory Valuation Ready', '💰 Valuation Report', 'Your inventory valuation report has been generated.');
  }, []);

  const totalValue = 4901.50;
  const cogs = 12500.00;
  const turnoverRatio = 2.55;

  const categoryValue = [
    { cat: 'Pharmaceuticals', val: 3200.00, percent: 65 },
    { cat: 'Medical Supplies', val: 1200.00, percent: 24 },
    { cat: 'Office Supplies', val: 101.50, percent: 2 },
    { cat: 'Equipment', val: 400.00, percent: 9 },
  ];

  const locValue = [
    { loc: 'Main Store', val: 3500.00 },
    { loc: 'Branch A', val: 1000.00 },
    { loc: 'Branch B', val: 401.50 },
  ];

  const topItems = [
    { name: 'MRI Contrast Agent', cat: 'Pharmaceuticals', val: 1200.00 },
    { name: 'Surgical Gloves (L)', cat: 'Medical Supplies', val: 1000.00 },
    { name: 'Paracetamol 500mg', cat: 'Pharmaceuticals', val: 600.00 },
  ];

  return (
    <div className="siv-valuation">
      <style>{SIV_CSS}</style>

      <div className="siv-content">
        {/* ── HEADER ── */}
        <div className="siv-header">
          <div className="siv-header-left">
            <span className="siv-header-icon"><DollarSign size={24} /></span>
            <div>
              <h1 className="siv-title">Inventory Valuation</h1>
              <p className="siv-subtitle">Document Model: Valuation</p>
            </div>
          </div>
          <div className="siv-header-actions">
            <button className="siv-btn siv-btn--ghost" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
            <button className="siv-btn siv-btn--primary">
              <Download size={15} /> Export PDF/Excel
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="siv-kpis">
          <div className="siv-kpi siv-kpi--success">
            <span className="siv-kpi-label">Total Inventory Value</span>
            <span className="siv-kpi-value">ETB {totalValue.toFixed(2)}</span>
          </div>
          <div className="siv-kpi">
            <span className="siv-kpi-label">Cost of Goods Sold (COGS)</span>
            <span className="siv-kpi-value">ETB {cogs.toFixed(2)}</span>
          </div>
          <div className="siv-kpi siv-kpi--info">
            <span className="siv-kpi-label">Inventory Turnover Ratio</span>
            <span className="siv-kpi-value">{turnoverRatio}x</span>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="siv-toolbar">
          <span className="siv-toolbar-icon"><Filter size={16} /></span>
          <select className="siv-select">
            <option>All Categories</option>
            <option>Pharmaceuticals</option>
            <option>Medical Supplies</option>
          </select>
          <select className="siv-select">
            <option>All Locations</option>
            <option>Main Store</option>
            <option>Branch A</option>
          </select>
        </div>

        {/* ── CHARTS ── */}
        <div className="siv-charts">
          {/* Value by Category */}
          <div className="siv-card">
            <div className="siv-card-head">
              <span className="siv-card-icon"><PieChart size={16} /></span>
              <h2 className="siv-card-title">Value by Category</h2>
            </div>
            {categoryValue.map((c, i) => (
              <div key={c.cat} className="siv-bar-row">
                <div className="siv-bar-top">
                  <span className="siv-bar-name">{c.cat}</span>
                  <span className="siv-bar-val">ETB {c.val.toFixed(2)} · {c.percent}%</span>
                </div>
                <div className="siv-bar-track">
                  <div className={`siv-bar-fill siv-bar-fill--${i}`} style={{ width: `${c.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Value by Location */}
          <div className="siv-card">
            <div className="siv-card-head">
              <span className="siv-card-icon"><PieChart size={16} /></span>
              <h2 className="siv-card-title">Value by Location</h2>
            </div>
            <div className="siv-locs">
              {locValue.map(l => (
                <div key={l.loc} className="siv-loc-row">
                  <span className="siv-loc-name">{l.loc}</span>
                  <span className="siv-loc-val">ETB {l.val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TOP ITEMS TABLE ── */}
        <div className="siv-card">
          <div className="siv-card-head">
            <h2 className="siv-card-title">Top Items by Value</h2>
          </div>
          <div className="siv-table-wrap">
            <table className="siv-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th className="siv-th-num">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td className="siv-td-rank">#{i + 1}</td>
                    <td className="siv-td-name">{item.name}</td>
                    <td className="siv-td-cat"><span className="siv-badge">{item.cat}</span></td>
                    <td className="siv-td-num">ETB {item.val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreInventoryValuation;
