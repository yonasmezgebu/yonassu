import React, { useState, useEffect } from 'react';
import { Layers, Download } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingMaterialConsumptionReport = () => {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    // Group material usage logs by material type to show aggregated consumption and wastage
    const agg = {};
    printingState.materialUsage.forEach(mu => {
      if(!agg[mu.materialType]) agg[mu.materialType] = { totalUsed: 0, totalWasted: 0 };
      agg[mu.materialType].totalUsed += mu.quantity;
      agg[mu.materialType].totalWasted += (mu.wastageQty || 0);
    });

    const reportData = Object.keys(agg).map(type => {
      const stockItem = printingState.materials.find(m => m.type === type) || { stock: 0 };
      const used = agg[type].totalUsed;
      const wasted = agg[type].totalWasted;
      const totalPulled = used + wasted;
      const wastePercent = totalPulled > 0 ? Math.round((wasted / totalPulled) * 100) : 0;
      
      return { type, currentStock: stockItem.stock, used, wasted, wastePercent };
    });

    setMaterials(reportData);
    playSound('info');
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exported Material Consumption Report to PDF.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Layers color="#f97316" size={28} /> MATERIAL CONSUMPTION
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Aggregated usage vs wastage analysis across all production stages.</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: '#f97316', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Material Type</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Current Stock (Remaining)</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Total Consumed (Productive)</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Total Wasted</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Wastage %</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={m.type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{m.type}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: m.currentStock < 100 ? '#ef4444' : '#0f172a', fontWeight: 600 }}>{m.currentStock}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569' }}>{m.used}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: m.wasted > 0 ? '#ef4444' : '#475569' }}>{m.wasted}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: m.wastePercent > 10 ? '#ef4444' : '#10b981' }}>
                  {m.wastePercent}%
                </td>
              </tr>
            ))}
            {materials.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No material consumption data logged.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingMaterialConsumptionReport;
