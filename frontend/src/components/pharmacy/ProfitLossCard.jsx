import React from 'react';

const containerStyle = {
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  padding: '20px 24px',
  fontFamily: "'Inter', sans-serif",
  color: '#1e293b',
  maxWidth: 420,
};

const headerStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 16,
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  fontSize: '0.95rem',
  borderBottom: '1px solid #f1f5f9',
};

const labelStyle = {
  color: '#64748b',
  fontWeight: 500,
};

const valueStyle = {
  fontWeight: 700,
  color: '#0f172a',
};

const resultStyle = (isProfit) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0 0',
  fontSize: '1.05rem',
  fontWeight: 700,
  color: isProfit ? '#059669' : '#dc2626',
  borderTop: '2px solid #e2e8f0',
  marginTop: 8,
});

const ProfitLossCard = ({ revenue = 0, cogs = 0 }) => {
  const profitLoss = revenue - cogs;
  const isProfit = profitLoss >= 0;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Profit / Loss Summary</div>
      <div style={rowStyle}>
        <span style={labelStyle}>Revenue</span>
        <span style={valueStyle}>${revenue.toFixed(2)}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Cost of Goods Sold</span>
        <span style={{ ...valueStyle, color: '#dc2626' }}>-${cogs.toFixed(2)}</span>
      </div>
      <div style={resultStyle(isProfit)}>
        <span>{isProfit ? '✅ PROFIT' : '❌ LOSS'}</span>
        <span>
          ${Math.abs(profitLoss).toFixed(2)}
          <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#64748b', marginLeft: 8 }}>
            ({isProfit ? 'Revenue − COGS = Profit' : 'Revenue − COGS = Loss'})
          </span>
        </span>
      </div>
    </div>
  );
};

export default ProfitLossCard;
