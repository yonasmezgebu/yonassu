import React from 'react';
import { formatCents } from '../../../utils/salesManagerState';

const CurrencyDisplay = ({ amountCents, currency = 'ETB', className = '', style = {} }) => {
  return (
    <span className={`currency-display ${className}`} style={{ fontFamily: 'monospace', ...style }}>
      {formatCents(amountCents, currency)}
    </span>
  );
};

export default CurrencyDisplay;
