const fs = require('fs');
let content = fs.readFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', 'utf8');

// 1. Remove the old manager icons and category from img-wrap
const oldIconsRegex = /\{isManager && \(\s*<div style=\{\{ position: 'absolute'[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(oldIconsRegex, '');

const oldCategoryRegex = /\{\(item\.category \|\| item\.category_name\) && <div className="rsp-card-badge">\{item\.category \|\| item\.category_name\}<\/div>\}/;
content = content.replace(oldCategoryRegex, '');

// 2. Add line clamp to description
const descRegex = /<p className="rsp-card-desc">\s*\{item\.description\}\s*<\/p>/;
content = content.replace(descRegex, '<p className="rsp-card-desc" style={{ display: \'-webkit-box\', WebkitLineClamp: 4, WebkitBoxOrient: \'vertical\', overflow: \'hidden\', textOverflow: \'ellipsis\', margin: 0 }}>{item.description}</p>');

// 3. Add the manager row at the bottom of the card body
const cardFooterRegex = /<div className="rsp-card-footer">\s*<div>[\s\S]*?<\/button>\s*<\/div>/;
const match = content.match(cardFooterRegex);
if (match) {
  const newFooter = match[0] + `
                          {isManager && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                {item.category || item.category_name || 'Uncategorized'}
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); handleToggleHide(item); }}
                                  style={{ width: 28, height: 28, borderRadius: 0, border: '2px solid var(--earth)', background: 'rgba(255,255,255,0.95)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(141,110,99,0.3)' }}
                                  title={item.is_active === false ? "Show Product" : "Hide from Public"}
                                >
                                  {item.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingProduct({...item, price: priceVal, stock: stockVal}); }}
                                  style={{ width: 28, height: 28, borderRadius: 0, border: '2px solid var(--earth)', background: 'rgba(255,255,255,0.95)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(141,110,99,0.3)' }}
                                  title="Update Product"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }}
                                  style={{ width: 28, height: 28, borderRadius: 0, border: '2px solid #D32F2F', background: '#F44336', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(211,47,47,0.3)' }}
                                  title="Delete Product"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}`;
  content = content.replace(cardFooterRegex, newFooter);
}

// 4. Disable stock input in modal
const stockInputRegex = /<label style=\{\{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var\(--text-main\)', marginBottom: 6, textTransform: 'uppercase' \}\}>Stock<\/label>\s*<input\s*required\s*type="number"\s*value=\{editingProduct\.stock \|\| ''\}\s*onChange=\{e => setEditingProduct\(\{\.\.\.editingProduct, stock: e\.target\.value\}\)\}\s*style=\{\{ width: '100%', padding: '12px 14px', border: '1px solid var\(--sage\)', borderRadius: 0, fontSize: 15, background: 'white', outline: 'none' \}\}/;

const disabledStockInput = `<label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase' }}>Stock <span style={{fontSize: 10, color: 'var(--earth)', fontWeight: 'normal'}}>(Update via Store)</span></label>
                    <input
                      disabled
                      type="number"
                      value={editingProduct.stock || ''}
                      title="Update stock via Store Inventory instead"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 0, fontSize: 15, background: '#EEEEEE', outline: 'none', cursor: 'not-allowed', color: '#777' }}`;

content = content.replace(stockInputRegex, disabledStockInput);

fs.writeFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', content);
console.log('Modified RetailPOS.jsx');
