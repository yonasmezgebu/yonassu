import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

const SalesDataTable = ({ columns, data, keyField = 'id', onRowClick = null, searchable = true, searchField = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Searching & Sorting logic
  const processedData = useMemo(() => {
    let filteredData = [...data];

    if (searchable && searchTerm) {
      filteredData = filteredData.filter(item => {
        // Simple generic search across all values if searchField is not provided
        if (!searchField) {
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        // Specific field search
        return String(item[searchField] || '').toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, searchField, searchable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 0, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toolbar */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        {searchable && (
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={`Search...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 0, border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ fontSize: '13px', color: '#64748b' }}>Show</span>
           <select 
             value={itemsPerPage} 
             onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
             style={{ padding: '6px 12px', borderRadius: 0, border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '13px' }}
           >
             <option value={10}>10</option>
             <option value={25}>25</option>
             <option value={50}>50</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  style={{ 
                    padding: '12px 16px', 
                    color: '#475569', 
                    fontWeight: '600', 
                    cursor: col.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => col.sortable && requestSort(col.key || col.field)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.label}
                    {col.sortable && sortConfig.key === (col.key || col.field) && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr 
                  key={row[keyField]} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9', 
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                  onMouseEnter={(e) => { if(onRowClick) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { if(onRowClick) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} style={{ padding: '12px 16px', color: '#1e293b' }}>
                      {col.render ? col.render(row) : row[col.field]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '6px', borderRadius: 0, border: '1px solid #e2e8f0', backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: currentPage === 1 ? '#cbd5e1' : '#475569' }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', fontWeight: '500', color: '#334155' }}>
              {currentPage} / {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px', borderRadius: 0, border: '1px solid #e2e8f0', backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: currentPage === totalPages ? '#cbd5e1' : '#475569' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDataTable;
