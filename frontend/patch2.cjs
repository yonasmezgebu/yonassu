const fs = require('fs');
let content = fs.readFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', 'utf8');

// 1. Remove the misplaced states and handlers from the end of the file
const badStateIndex = content.indexOf('const [editingProduct, setEditingProduct] = useState(null);');
if (badStateIndex > 1500) {
  content = content.slice(0, badStateIndex); // everything after this is the wrongly injected stuff from indexOf == -1
}

// 2. Insert state correctly after navSearch
const insertState = `
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
`;
const navSearchIndex = content.indexOf('const [navSearch, setNavSearch]');
if (navSearchIndex !== -1 && !content.slice(0, navSearchIndex).includes('editingProduct')) {
  content = content.slice(0, navSearchIndex) + insertState + content.slice(navSearchIndex);
}

// 3. Insert handlers correctly before addToCart
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
const addToCartIndex = content.indexOf('const addToCart');
if (addToCartIndex !== -1 && !content.slice(0, addToCartIndex).includes('handleUpdateProductSubmit')) {
  content = content.slice(0, addToCartIndex) + insertHandlers + '\n  ' + content.slice(addToCartIndex);
}

fs.writeFileSync('D:/SUTANA/frontend/src/pages/sales/RetailPOS.jsx', content);
console.log('Fixed RetailPOS.jsx');
