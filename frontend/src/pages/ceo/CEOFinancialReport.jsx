import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Wallet, Download, Printer, Filter } from 'lucide-react';

const CEOFinancialReport = () => {
  const [dateRange, setDateRange] = useState('Month');

  useEffect(() => {
    receiveNotification('Financial Report', `💰 Financial Report Ready - Profit/Loss: $354,500`);
    // eslint-disable-next-line
  }, [dateRange]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting Financial Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending Financial Report to printer...');
    window.print();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet color="#10b981" size={28}/> FINANCIAL REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>CRV, PV & PCV Analytics and Cash Flow Breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Printer size={16}/> Print
          </button>
          <button onClick={handleExport} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b"/> <span style={{ fontWeight: 'bold', fontSize: 14 }}>Date Range:</span>
        </div>
        {['Today', 'Week', 'Month', 'Quarter', 'Year'].map(range => (
          <button key={range} onClick={() => setDateRange(range)} style={{ padding: '6px 16px', borderRadius: 20, border: dateRange === range ? 'none' : '1px solid #cbd5e1', background: dateRange === range ? '#10b981' : 'transparent', color: dateRange === range ? 'white' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
            {range}
          </button>
        ))}
      </div>

      {/* CORE FINANCIALS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#dcfce7', padding: 20, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Total Income</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d', marginTop: 8 }}>$1,245,000</div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 8 }}>Via CRV (Cash Receipt Vouchers)</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 20, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 'bold' }}>Total Expenses</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c', marginTop: 8 }}>$890,500</div>
          <div style={{ fontSize: 12, color: '#991b1b', marginTop: 8 }}>Via PV & PCV (Payment & Petty Cash)</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 'bold' }}>Net Profit / Loss</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>$354,500 🟢</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Real-time calculation</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* INCOME BREAKDOWN */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#15803d' }}>Income Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Pharmacy Sales', v: 800000, p: 64 },
              { n: 'Car Rental Sales', v: 200000, p: 16 },
              { n: 'Agri Rental Sales', v: 145000, p: 12 },
              { n: 'Printing Sales', v: 100000, p: 8 }
            ].map(i => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>{i.n}</span>
                  <span>${i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#22c55e', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#b91c1c' }}>Expense Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Purchase Cost (Goods)', v: 550000, p: 61 },
              { n: 'Salaries & Payroll', v: 220000, p: 25 },
              { n: 'Utilities & Rent', v: 80500, p: 9 },
              { n: 'Other Expenses (PCV)', v: 40000, p: 5 }
            ].map(i => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>{i.n}</span>
                  <span>${i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#ef4444', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* CASH FLOW & TAX */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Cash Flow & Tax Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#64748b' }}>Operating Cash Flow</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#166534' }}>+$410,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#64748b' }}>Investing Cash Flow</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }}>-$50,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#64748b' }}>Financing Cash Flow</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold' }}>$0</td>
              </tr>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <td style={{ padding: '12px 0', fontWeight: 'bold' }}>Net Cash Flow</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold' }}>+$360,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#64748b' }}>Estimated Tax Liability (15%)</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }}>$53,175</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', color: '#64748b' }}>Tax Paid YTD</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold' }}>$20,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FINANCIAL RATIOS */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Key Financial Ratios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>Gross Profit Margin</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>55.8%</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>Net Profit Margin</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>28.4%</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>Operating Ratio</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>71.5%</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>Return on Assets (ROA)</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>12.1%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOFinancialReport;
