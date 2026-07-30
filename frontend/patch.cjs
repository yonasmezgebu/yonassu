const fs = require('fs');
const content = fs.readFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', 'utf8');

let newContent = content;

// 1. Add Edit3, Trash2, Eye, EyeOff, Save to imports if not there
if (!newContent.includes('Edit3')) {
  newContent = newContent.replace(
    'X, Minus, ChevronRight, ChevronDown, Package, AlertCircle',
    'X, Minus, ChevronRight, ChevronDown, Package, AlertCircle, Edit3, Trash2, Eye, EyeOff, Save'
  );
}

// 2. Add state
const stateIdx = newContent.indexOf('const [search, setSearch]');
if (!newContent.includes('editingProduct')) {
  const insertState = `
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
`;
  newContent = newContent.slice(0, stateIdx) + insertState + newContent.slice(stateIdx);
}

// 3. Add handler functions
const handlerIdx = newContent.indexOf('const addToCart');
if (!newContent.includes('handleUpdateProductSubmit')) {
  const insertHandlers = `
  const handleToggleHide = async (p) => {
    try {
      await apiClient.put('/retail/products/' + p.id, { is_active: !p.is_active });
      showToast('Visibility toggled successfully.', 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to toggle visibility', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiClient.delete('/retail/products/' + id);
      showToast('Product deleted.', 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const fd = new FormData();
      fd.append('name', editingProduct.name || '');
      fd.append('price', editingProduct.price || editingProduct.selling_price || 0);
      fd.append('stock_quantity', editingProduct.stock || editingProduct.stock_quantity || 0);
      fd.append('reorder_level', editingProduct.reorder_level || 10);
      if (editingProduct.category_id) fd.append('category_id', editingProduct.category_id);
      
      await apiClient.put('/retail/products/' + editingProduct.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Product updated successfully.', 'success');
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      showToast(error?.message || 'Failed to update product.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };
`;
  newContent = newContent.slice(0, handlerIdx) + insertHandlers + '\n' + newContent.slice(handlerIdx);
}

// 4. Update the card to include icons
const cardRegex = /<div className="rsp-card-img-wrap">/;
if (!newContent.includes('handleToggleHide(item)')) {
  const insertIcons = `
                        <div className="rsp-card-img-wrap">
                          {isManager && (
                            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
                              <button
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleToggleHide(item); }}
                                style={{ width: 32, height: 32, borderRadius: 0, border: '2px solid var(--earth)', background: 'rgba(255,255,255,0.95)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(141,110,99,0.3)' }}
                                title={item.is_active === false ? "Show Product" : "Hide from Public"}
                              >
                                {item.is_active === false ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingProduct({...item, price: priceVal, stock: stockVal}); }}
                                style={{ width: 32, height: 32, borderRadius: 0, border: '2px solid var(--earth)', background: 'rgba(255,255,255,0.95)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(141,110,99,0.3)' }}
                                title="Update Product"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }}
                                style={{ width: 32, height: 32, borderRadius: 0, border: '2px solid #D32F2F', background: '#F44336', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(211,47,47,0.3)' }}
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
`;
  newContent = newContent.replace(cardRegex, insertIcons.trim());
}

// 5. Add opacity to card if not active
newContent = newContent.replace(
  /<div key=\{item\.id\} className="rsp-card" style=\{\{ animationDelay: idx \* 0\.04 \+ 's' \}\}>/g,
  '<div key={item.id} className="rsp-card" style={{ animationDelay: idx * 0.04 + \'s\', opacity: item.is_active === false ? 0.6 : 1 }}>'
);

// 6. Add modal UI at the bottom
const modalRegex = /\{\/\* Void Modal \*\/\}/;
if (!newContent.includes('Edit Product Modal')) {
  const insertModal = `
      {/* Edit Product Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#F5F5F5', width: 500, border: '2px solid var(--earth)', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 0px rgba(141,110,99,0.3)', maxHeight: '90vh' }}>
            
            <div style={{ padding: '16px 24px', background: 'var(--dark)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--earth)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={20} /> Update Product
              </h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto' }}>
              <form id="update-prod-form" onSubmit={handleUpdateProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase' }}>Product Name</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--sage)', borderRadius: 0, fontSize: 15, background: 'white', outline: 'none' }}
                    onFocus={(e) => e.target.style.border = '2px solid var(--primary)'}
                    onBlur={(e) => e.target.style.border = '1px solid var(--sage)'}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase' }}>Price (ETB)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''}
                      onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--sage)', borderRadius: 0, fontSize: 15, background: 'white', outline: 'none' }}
                      onFocus={(e) => e.target.style.border = '2px solid var(--primary)'}
                      onBlur={(e) => e.target.style.border = '1px solid var(--sage)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase' }}>Stock</label>
                    <input
                      required
                      type="number"
                      value={editingProduct.stock || ''}
                      onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--sage)', borderRadius: 0, fontSize: 15, background: 'white', outline: 'none' }}
                      onFocus={(e) => e.target.style.border = '2px solid var(--primary)'}
                      onBlur={(e) => e.target.style.border = '1px solid var(--sage)'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase' }}>Reorder Level</label>
                  <input
                    required
                    type="number"
                    value={editingProduct.reorder_level || ''}
                    onChange={e => setEditingProduct({...editingProduct, reorder_level: e.target.value})}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--sage)', borderRadius: 0, fontSize: 15, background: 'white', outline: 'none' }}
                    onFocus={(e) => e.target.style.border = '2px solid var(--primary)'}
                    onBlur={(e) => e.target.style.border = '1px solid var(--sage)'}
                  />
                </div>
              </form>
            </div>
            
            <div style={{ padding: 24, borderTop: '2px solid var(--earth)', display: 'flex', gap: 12, background: 'white' }}>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ flex: 1, padding: '12px', border: '2px solid var(--earth)', background: '#F5F5F5', color: 'var(--text-main)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="update-prod-form"
                disabled={savingProduct}
                style={{ flex: 1, padding: '12px', border: '2px solid var(--primary)', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', cursor: savingProduct ? 'not-allowed' : 'pointer', opacity: savingProduct ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 0 }}
              >
                <Save size={18} /> {savingProduct ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Void Modal */}
`;
  newContent = newContent.replace(modalRegex, insertModal.trim());
}

fs.writeFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', newContent);
console.log('Modified RetailPOS.jsx');
