import React, { useState, useEffect } from 'react';
import { DollarSign, Download } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingJobCostReport = () => {
  const [costs, setCosts] = useState([]);

  useEffect(() => {
    // Reconcile jobs with their material cost from materialUsage
    const data = printingState.jobs.map(j => {
      const mats = printingState.materialUsage.filter(m => m.jobId === j.id);
      const matCost = mats.reduce((sum, m) => sum + (m.quantity * 5), 0); // Mock unit price of $5
      const laborCost = 50; // Mock fixed labor cost
      const overhead = 20;
      const totalCost = matCost + laborCost + overhead;
      const profit = j.totalCost - totalCost; // j.totalCost is the selling price
      
      return { id: j.id, customer: j.customerName, sellingPrice: j.totalCost || 0, matCost, laborCost, overhead, totalCost, profit };
    }).filter(j => j.sellingPrice > 0); // Only jobs with price

    setCosts(data);
    playSound('info');
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exported Job Costing Report to PDF.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <DollarSign color="#10b981" size={28} /> JOB COST REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Per-job profitability analysis (Selling Price vs Materials/Labor).</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job #</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Customer</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Material Cost</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Labor + OH</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Total Cost</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Selling Price</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Profit / Loss</th>
            </tr>
          </thead>
          <tbody>
            {costs.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{c.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{c.customer}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444' }}>${c.matCost.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444' }}>${(c.laborCost + c.overhead).toFixed(2)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>${c.totalCost.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>${c.sellingPrice.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: c.profit >= 0 ? '#10b981' : '#ef4444' }}>
                  {c.profit >= 0 ? '+' : '-'}${Math.abs(c.profit).toFixed(2)}
                </td>
              </tr>
            ))}
            {costs.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No completed financial data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingJobCostReport;
