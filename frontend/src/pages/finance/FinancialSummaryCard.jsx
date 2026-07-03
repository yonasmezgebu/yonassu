import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const FinancialSummaryCard = ({ title, amount, period, comparisonAmount, trendDirection, colorMode }) => {
  // Format amount
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formattedAmount = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(absAmount);
  
  // Determine color coding based on mode
  let isFavorable = true;
  let displayTitle = title;
  
  if (colorMode === 'favorable-high') {
    isFavorable = trendDirection === 'up'; // Higher is better
  } else if (colorMode === 'favorable-low') {
    isFavorable = trendDirection === 'down'; // Lower is better
  } else if (colorMode === 'signed') {
    isFavorable = !isNegative; // Positive is better
    // Spec: shows as "Shortfall" in red when negative, "Profit" in green when positive
    displayTitle = isNegative ? 'Net Loss (Shortfall)' : 'Net Profit';
  }

  const valueColor = colorMode === 'signed' ? (isNegative ? '#dc2626' : '#16a34a') : '#0f172a';
  const trendColor = isFavorable ? '#16a34a' : '#dc2626';
  const trendBg = isFavorable ? '#dcfce7' : '#fee2e2';

  const renderTrendIcon = () => {
    if (colorMode === 'signed') {
       return isNegative ? <TrendingDown size={14} color={trendColor} /> : <TrendingUp size={14} color={trendColor} />;
    }
    if (trendDirection === 'up') return <TrendingUp size={14} color={trendColor} />;
    if (trendDirection === 'down') return <TrendingDown size={14} color={trendColor} />;
    return <Minus size={14} color="#64748b" />;
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {displayTitle}
      </div>
      
      <div style={{ fontSize: 28, fontWeight: 'bold', color: valueColor, letterSpacing: '-0.02em' }}>
        {colorMode === 'signed' && isNegative ? `-${formattedAmount}` : formattedAmount}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, background: trendDirection === 'flat' && colorMode !== 'signed' ? '#f1f5f9' : trendBg, color: trendDirection === 'flat' && colorMode !== 'signed' ? '#64748b' : trendColor, fontSize: 12, fontWeight: 700 }}>
          {renderTrendIcon()}
          {comparisonAmount ? new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(Math.abs(comparisonAmount)) : (colorMode === 'signed' ? (isNegative ? 'Deficit' : 'Surplus') : 'vs Prior')}
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{period}</span>
      </div>
    </div>
  );
};

export default FinancialSummaryCard;
