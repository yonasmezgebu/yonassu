import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { salesState, formatCents } from '../../../utils/salesManagerState';

const SalesLineItemEditor = ({ lines, setLines }) => {
  const [products] = useState(salesState.getProducts());
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [discountCents, setDiscountCents] = useState(0);

  const handleAddLine = () => {
    if (!selectedProductId || qty <= 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newLine = {
      id: Date.now().toString(), // temporary ID
      product_id: product.id,
      description: product.name,
      unit_price_cents: product.unit_price_cents,
      qty: parseInt(qty, 10),
      discount_cents: parseInt(discountCents, 10) || 0,
    };
    newLine.line_total_cents = (newLine.unit_price_cents - newLine.discount_cents) * newLine.qty;
    
    setLines([...lines, newLine]);
    // Reset form
    setSelectedProductId('');
    setQty(1);
    setDiscountCents(0);
  };

  const handleRemoveLine = (id) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleQtyChange = (id, newQty) => {
      const q = parseInt(newQty, 10);
      if(isNaN(q) || q < 1) return;
      
      setLines(lines.map(l => {
          if(l.id === id) {
              return {
                  ...l,
                  qty: q,
                  line_total_cents: (l.unit_price_cents - l.discount_cents) * q
              };
          }
          return l;
      }));
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 0, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Product</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '120px' }}>Unit Price</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '120px' }}>Discount</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '100px' }}>Qty</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '120px', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '12px 16px', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#1e293b' }}>{line.description}</td>
                <td style={{ padding: '12px 16px', color: '#1e293b' }}>{formatCents(line.unit_price_cents)}</td>
                <td style={{ padding: '12px 16px', color: '#ef4444' }}>
                  {line.discount_cents > 0 ? `-${formatCents(line.discount_cents)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                    <input 
                        type="number" 
                        min="1" 
                        value={line.qty} 
                        onChange={(e) => handleQtyChange(line.id, e.target.value)}
                        style={{ width: '60px', padding: '6px', borderRadius: 0, border: '1px solid #cbd5e1' }}
                    />
                </td>
                <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                  {formatCents(line.line_total_cents)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => handleRemoveLine(line.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Add New Line Row */}
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '12px 16px' }}>
                <select 
                  value={selectedProductId} 
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 0, border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCents(p.unit_price_cents)})</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>
                {selectedProductId ? formatCents(products.find(p => p.id === selectedProductId)?.unit_price_cents || 0) : '-'}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <input 
                  type="number" 
                  min="0"
                  step="100"
                  placeholder="0.00"
                  value={discountCents ? discountCents / 100 : ''} 
                  onChange={(e) => setDiscountCents(Math.round(parseFloat(e.target.value || 0) * 100))}
                  style={{ width: '80px', padding: '8px', borderRadius: 0, border: '1px solid #cbd5e1' }}
                />
              </td>
              <td style={{ padding: '12px 16px' }}>
                <input 
                  type="number" 
                  min="1" 
                  value={qty} 
                  onChange={(e) => setQty(e.target.value)}
                  style={{ width: '60px', padding: '8px', borderRadius: 0, border: '1px solid #cbd5e1' }}
                />
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
                {selectedProductId ? formatCents(
                    ((products.find(p => p.id === selectedProductId)?.unit_price_cents || 0) - (discountCents || 0)) * qty
                ) : '-'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <button 
                  type="button"
                  onClick={handleAddLine}
                  disabled={!selectedProductId}
                  style={{ 
                    backgroundColor: selectedProductId ? '#3b82f6' : '#94a3b8', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 0, 
                    padding: '6px 10px', 
                    cursor: selectedProductId ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Add Line"
                >
                  <Plus size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesLineItemEditor;
