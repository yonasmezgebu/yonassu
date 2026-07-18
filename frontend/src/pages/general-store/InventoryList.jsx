import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { formatNumber, formatCurrency, formatDate } from '../../utils/formatters';
import AddProductModal from './AddProductModal';
import { Package, AlertTriangle, XCircle, DollarSign, Plus, Search, Printer, Download, Eye, Edit2, Barcode } from 'lucide-react';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [stockLevelFilter, setStockLevelFilter] = useState('All'); // All, Low Stock, Out of Stock
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchInventory(), fetchStatistics()]);
    setLoading(false);
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getInventory();
      setItems(response?.data?.products || response?.products || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await inventoryService.getStatistics();
      setStats(response?.data || null);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Derive categories for filter
  const categories = ['All', ...new Set(items.map(i => i.category_name).filter(Boolean))];

  // Filtering logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category
      const matchesCategory = categoryFilter === 'All' || item.category_name === categoryFilter;
      
      // Warehouse (always Main Store in this mock, but let's just pass true for All)
      const matchesWarehouse = warehouseFilter === 'All' || warehouseFilter === 'Main Store';

      // Stock Level
      let matchesStockLevel = true;
      if (stockLevelFilter === 'Low Stock') {
        matchesStockLevel = item.current_stock > 0 && item.current_stock <= item.reorder_level;
      } else if (stockLevelFilter === 'Out of Stock') {
        matchesStockLevel = item.current_stock <= 0;
      }

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStockLevel;
    });
  }, [items, searchQuery, categoryFilter, warehouseFilter, stockLevelFilter]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inventory List</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #111; background-color: #009ca6; }
    .page { 
      background: white; 
      margin: 0 auto; 
      padding: 40px; 
      max-width: 800px; 
      min-height: 1000px; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
    }
    .header-wrap { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin-bottom: 30px; 
      position: relative; 
      margin-top: 10px;
    }
    .title-container { 
      text-align: center; 
      background: white; 
      padding: 0 20px; 
      z-index: 2; 
      position: relative; 
    }
    .title-cursive { 
      font-family: 'Brush Script MT', 'Great Vibes', cursive; 
      font-size: 52px; 
      margin-bottom: -15px; 
      color: #111; 
      font-weight: normal;
    }
    .title-serif { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 42px; 
      font-weight: normal; 
      letter-spacing: 2px; 
      text-transform: uppercase;
    }
    .deco-line { 
      position: absolute; 
      top: 50%; 
      left: 0; 
      right: 0; 
      height: 1px; 
      background: #009ca6; 
      z-index: 1; 
    }
    .deco-diamond { 
      position: absolute; 
      top: 50%; 
      transform: translateY(-50%) rotate(45deg); 
      width: 10px; 
      height: 10px; 
      border: 1.5px solid #009ca6; 
      background: white; 
      z-index: 2;
    }
    .deco-left { left: 15%; }
    .deco-right { right: 15%; }
    
    .date-row { 
      margin-bottom: 15px; 
      font-size: 15px; 
      color: #333;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 40px; 
    }
    th { 
      background-color: #009ca6; 
      color: white; 
      padding: 14px 8px; 
      font-weight: normal; 
      border-right: 2px solid white;
      font-size: 14px;
    }
    th:last-child { border-right: none; }
    td { 
      border: 1px solid #000; 
      padding: 12px 10px; 
      font-size: 14px; 
      text-align: center; 
      color: #111;
    }
    .text-left { text-align: left; }
    
    @media print { 
      body { background: white; padding: 0; } 
      .page { margin: 0; padding: 20px; box-shadow: none; width: 100%; max-width: none; min-height: auto; } 
      .no-print { display: none; } 
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right; padding-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print Document</button>
  </div>
  <div class="page">
    
    <div class="header-wrap">
      <div class="deco-line"></div>
      <div class="deco-diamond deco-left"></div>
      <div class="deco-diamond deco-right"></div>
      <div class="title-container">
        <div class="title-cursive">Product</div>
        <div class="title-serif">INVENTORY</div>
      </div>
    </div>
    
    <div class="date-row">Date : ..............................................</div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">No.</th>
          <th class="text-left" style="width: 40%;">Product Name</th>
          <th style="width: 17%;">Quantity</th>
          <th style="width: 17%;">Cost</th>
          <th style="width: 18%;">Location</th>
        </tr>
      </thead>
      <tbody>
        ${filteredItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="text-left">${item.name} (${item.sku})</td>
            <td>${formatNumber(item.current_stock)} ${item.unit_abbr || item.unit || ''}</td>
            <td>${formatCurrency(item.average_cost)}</td>
            <td>Main Store</td>
          </tr>
        `).join('')}
        ${[...Array(Math.max(0, 20 - filteredItems.length))].map(() => `
          <tr><td><br></td><td></td><td></td><td></td><td></td></tr>
        `).join('')}
      </tbody>
    </table>

  </div>
  <script>setTimeout(() => { window.print(); }, 500);</script>
</body>
</html>`);
    w.document.close();
  };

  // KPIs
  const totalItemsCount = items.length;
  const outOfStockCount = items.filter(i => i.current_stock <= 0).length;
  const lowStockCount = items.filter(i => i.current_stock > 0 && i.current_stock <= i.reorder_level).length;
  const totalStockValue = items.reduce((sum, item) => sum + (item.current_stock * (item.average_cost || 0)), 0);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SummaryCard icon={Package} label="Total Items" value={formatNumber(totalItemsCount)} color="#3b82f6" bg="#eff6ff" />
        <SummaryCard icon={DollarSign} label="Total Stock Value" value={formatCurrency(totalStockValue)} color="#10b981" bg="#ecfdf5" />
        <SummaryCard icon={AlertTriangle} label="Low Stock Items" value={formatNumber(lowStockCount)} color="#f59e0b" bg="#fffbeb" />
        <SummaryCard icon={XCircle} label="Out of Stock Items" value={formatNumber(outOfStockCount)} color="#ef4444" bg="#fef2f2" />
      </div>

      {/* Filters & Toolbar */}
      <div style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Search Code / Name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Category: All' : c}</option>)}
          </select>
          <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} style={selectStyle}>
            <option value="All">Warehouse: All</option>
            <option value="Main Store">Main Store</option>
          </select>
          <select value={stockLevelFilter} onChange={e => setStockLevelFilter(e.target.value)} style={selectStyle}>
            <option value="All">Stock Level: All</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsModalOpen(true)} style={{ ...btnStyle, background: '#059669', color: 'white', border: 'none' }}><Plus size={16} /> Add Item</button>
          <button onClick={handlePrint} style={btnStyle}><Printer size={16} /> Print</button>
          <button style={btnStyle}><Download size={16} /> Export (Excel/PDF)</button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={thStyle}>Item Code</th>
                <th style={thStyle}>Item Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Warehouse</th>
                <th style={thStyle}>Unit</th>
                <th style={{...thStyle, textAlign: 'right'}}>Available Qty</th>
                <th style={{...thStyle, textAlign: 'right'}}>Unit Cost</th>
                <th style={{...thStyle, textAlign: 'right'}}>Total Value</th>
                <th style={{...thStyle, textAlign: 'right'}}>Reorder Level</th>
                <th style={{...thStyle, textAlign: 'center'}}>Status</th>
                <th style={{...thStyle, textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>No items found matching your filters.</td></tr>
              ) : filteredItems.map(item => {
                const stockValue = item.current_stock * (item.average_cost || 0);
                const isOutOfStock = item.current_stock <= 0;
                const isLowStock = !isOutOfStock && item.current_stock <= item.reorder_level;
                
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#475569' }}>{item.sku}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{item.name}</td>
                    <td style={tdStyle}>{item.category_name || '—'}</td>
                    <td style={tdStyle}>Main Store</td>
                    <td style={tdStyle}>{item.unit_abbr || item.unit || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', color: isOutOfStock ? '#EF4444' : isLowStock ? '#D97706' : '#1E293B' }}>
                      {formatNumber(item.current_stock)}
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>{formatCurrency(item.average_cost)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, textAlign: 'right' }}>{formatCurrency(stockValue)}</td>
                    <td style={{...tdStyle, textAlign: 'right'}}>{formatNumber(item.reorder_level)}</td>
                    <td style={{...tdStyle, textAlign: 'center'}}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: isOutOfStock ? '#FEF2F2' : isLowStock ? '#FFFBEB' : '#ECFDF5',
                        color: isOutOfStock ? '#DC2626' : isLowStock ? '#D97706' : '#059669'
                      }}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button title="View" style={iconBtnStyle}><Eye size={15} /></button>
                        <button title="Edit" style={iconBtnStyle}><Edit2 size={15} /></button>
                        <button title="Barcode" style={iconBtnStyle}><Barcode size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); loadAll(); }} />
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color, bg }) => (
  <div style={{ background: 'white', padding: '1.25rem', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
    <div style={{ background: bg, color: color, padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={24} />
    </div>
    <div>
      <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#1E293B', fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  </div>
);

const selectStyle = { padding: '8px 24px 8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: 'white', color: '#1E293B', fontSize: 13 };
const btnStyle = { padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', color: '#334155', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const thStyle = { padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '14px 16px', color: '#1E293B' };
const iconBtnStyle = { padding: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default InventoryList;
