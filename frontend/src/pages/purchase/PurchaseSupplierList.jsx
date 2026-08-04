import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import {
  Users, UserPlus, BarChart2, FileText, Search, RefreshCw,
  Mail, Phone, Building2, Tag, Calendar, CheckCircle2, XCircle,
  Download, Send, ChevronDown, Loader2, AlertCircle, Truck,
  Filter, Check, Square, CheckSquare
} from 'lucide-react';

/* ─── Styles ─────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .psl-page { padding: 28px; background: #F5F5F5; min-height: 100vh; font-family: 'Inter', sans-serif; box-sizing: border-box; }
  @media (max-width:768px){ .psl-page { padding: 16px; } }

  .psl-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .psl-title { font-size:2rem; font-weight:800; color:#1B5E20; margin:0; letter-spacing:-0.02em; }
  .psl-sub { font-size:0.875rem; color:#6B8E23; margin:4px 0 0; font-weight:600; }

  /* Tabs */
  .psl-tabs { display:flex; gap:4px; background:#fff; border:1px solid #E0E0E0; border-radius:12px; padding:5px; margin-bottom:24px; max-width:460px; }
  .psl-tab {
    flex:1; padding:10px 16px; border:none; border-radius:8px;
    font-size:0.85rem; font-weight:600; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all 0.2s; background:transparent; color:#888;
    font-family:'Inter',sans-serif;
  }
  .psl-tab.active { background:#1B5E20; color:#fff; box-shadow:0 2px 8px rgba(27,94,32,0.3); }
  .psl-tab:not(.active):hover { background:#F1F8F1; color:#1B5E20; }
  .psl-tab-count {
    background:rgba(255,255,255,0.25); border-radius:20px;
    padding:1px 7px; font-size:0.75rem; font-weight:700;
  }
  .psl-tab:not(.active) .psl-tab-count { background:#E8F5E9; color:#1B5E20; }

  /* Stats row */
  .psl-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:14px; margin-bottom:20px; }
  .psl-stat { background:#fff; border:1px solid #E0E0E0; border-radius:12px; padding:18px 20px; }
  .psl-stat-num { font-size:1.8rem; font-weight:800; color:#1B5E20; margin:0 0 4px; }
  .psl-stat-label { font-size:0.75rem; font-weight:700; color:#6B8E23; text-transform:uppercase; letter-spacing:0.08em; }

  /* Toolbar */
  .psl-toolbar { display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
  .psl-search-wrap { position:relative; flex:1; min-width:200px; }
  .psl-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#999; pointer-events:none; }
  .psl-search { width:100%; box-sizing:border-box; padding:10px 12px 10px 38px; border:1px solid #8D6E63; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
  .psl-search:focus { border-color:#2E8B57; box-shadow:0 0 0 3px rgba(46,139,87,0.1); }
  .psl-select { padding:10px 12px; border:1px solid #8D6E63; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; color:#333; cursor:pointer; }
  .psl-select:focus { border-color:#2E8B57; }

  /* Bulk action bar */
  .psl-bulk-bar {
    background:linear-gradient(135deg, #1B5E20, #2E8B57);
    border-radius:10px; padding:12px 20px;
    display:flex; align-items:center; gap:16px; margin-bottom:16px;
    color:#fff; flex-wrap:wrap;
  }
  .psl-bulk-count { font-size:0.875rem; font-weight:700; flex:1; }
  .psl-btn-gmail {
    background:#fff; color:#1B5E20; border:none; border-radius:8px;
    padding:9px 20px; font-weight:700; font-size:0.875rem;
    cursor:pointer; display:flex; align-items:center; gap:8px;
    font-family:'Inter',sans-serif;
    transition:transform 0.15s, box-shadow 0.15s;
  }
  .psl-btn-gmail:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
  .psl-btn-deselect {
    background:rgba(255,255,255,0.15); color:#fff; border:1.5px solid rgba(255,255,255,0.3);
    border-radius:8px; padding:9px 16px; font-weight:600; font-size:0.85rem;
    cursor:pointer; font-family:'Inter',sans-serif;
  }

  /* Table */
  .psl-card { background:#fff; border:1px solid #E0E0E0; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
  .psl-table { width:100%; border-collapse:collapse; font-size:0.875rem; }
  .psl-table thead th { background:#F9FBF9; border-bottom:2px solid #E8F5E9; padding:12px 14px; text-align:left; font-size:0.72rem; font-weight:700; color:#6B8E23; text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap; }
  .psl-table tbody tr { border-bottom:1px solid #F5F5F5; transition:background 0.15s; }
  .psl-table tbody tr:hover { background:#FAFFF9; }
  .psl-table tbody tr.selected { background:#F1F8F1; }
  .psl-table td { padding:12px 14px; vertical-align:middle; }
  .psl-name { font-weight:700; color:#1B5E20; }
  .psl-email { color:#87CEEB; font-size:0.82rem; }
  .psl-phone { color:#555; font-size:0.82rem; }
  .psl-company { color:#555; font-size:0.82rem; }
  .psl-cat-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700; background:#E8F5E9; color:#2E7D32; }
  .psl-status-active { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; background:#E8F5E9; color:#2E7D32; }
  .psl-status-inactive { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; background:#FFF3E0; color:#E65100; }
  .psl-date { color:#999; font-size:0.78rem; }
  .psl-checkbox { width:18px; height:18px; cursor:pointer; accent-color:#2E8B57; }

  /* Mobile cards */
  @media (max-width:640px) {
    .psl-table { display:none; }
    .psl-mob-cards { display:flex !important; flex-direction:column; gap:12px; padding:12px; }
    .psl-mob-card { background:#fff; border:1px solid #E0E0E0; border-radius:10px; padding:16px; position:relative; }
    .psl-mob-card.selected { border-color:#2E8B57; background:#F1F8F1; }
    .psl-mob-card h4 { margin:0 0 4px; color:#1B5E20; font-size:0.95rem; }
    .psl-mob-card p { margin:0 0 4px; font-size:0.8rem; color:#555; }
  }
  @media (min-width:641px) { .psl-mob-cards { display:none; } }

  /* Empty */
  .psl-empty { text-align:center; padding:60px 24px; color:#aaa; }
  .psl-empty h3 { margin:16px 0 8px; color:#555; font-size:1.1rem; }
  .psl-empty p { margin:0; font-size:0.875rem; }

  /* Buttons */
  .psl-btn { display:flex; align-items:center; gap:6px; padding:10px 16px; border-radius:8px; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; border:none; }
  .psl-btn-green { background:#2E8B57; color:#fff; }
  .psl-btn-green:hover { background:#1B5E20; }
  .psl-btn-outline { background:#fff; color:#555; border:1px solid #8D6E63; }
  .psl-btn-outline:hover { background:#F5F5F5; }

  /* Select All row */
  .psl-select-all { background:#E8F5E9; border-bottom:1px solid #C8E6C9; }
  .psl-select-all td { padding:8px 14px; font-size:0.8rem; color:#2E7D32; font-weight:600; }

  /* Toast */
  .psl-toast { position:fixed; bottom:24px; right:24px; z-index:9999; padding:14px 20px; border-radius:12px; font-size:0.875rem; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,0.15); animation:psl-slide 0.3s ease; }
  .psl-toast-success { background:#1B5E20; color:#fff; }
  .psl-toast-error { background:#C62828; color:#fff; }
  @keyframes psl-slide { from { transform:translateX(110%); opacity:0; } to { transform:translateX(0); opacity:1; } }
`;

const COMPANY_NAME = 'SUTANA Trading PLC';

const PurchaseSupplierList = () => {
  const navigate = useNavigate();

  // Tab: 'registered' = self-registered supplier directory | 'internal' = procurement suppliers
  const [activeTab, setActiveTab] = useState('registered');

  // Self-registered suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);

      const res = await apiClient.get(`/suppliers?${params.toString()}`);
      setSuppliers(res.data?.data || []);
    } catch (err) {
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => {
    if (activeTab === 'registered') {
      fetchSuppliers();
    }
  }, [activeTab, fetchSuppliers]);

  // Toggle one
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Select all visible
  const toggleSelectAll = () => {
    if (selected.size === suppliers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suppliers.map(s => s.id)));
    }
  };

  // Build Gmail compose URL and open it
  const handleEmailSelected = () => {
    const selectedSuppliers = suppliers.filter(s => selected.has(s.id));
    if (selectedSuppliers.length === 0) {
      showToast('Please select at least one supplier.', 'error');
      return;
    }

    const bcc = selectedSuppliers.map(s => s.email).filter(Boolean).join(',');
    const subject = encodeURIComponent(`Purchase Inquiry — ${COMPANY_NAME}`);
    const body = encodeURIComponent(
      `Dear Supplier,\n\nWe are ${COMPANY_NAME}, and we are interested in your products and services.\n\nWe would like to discuss potential procurement opportunities with you. Please contact us with your pricing, availability, and any relevant catalogues.\n\nKindly reply to this email or contact our Purchase Department directly.\n\nBest regards,\nPurchase Department\n${COMPANY_NAME}`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    showToast(`Gmail opened with ${selectedSuppliers.length} supplier(s) in Bcc.`);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Category', 'Address', 'Status', 'Registered'];
    const rows = suppliers.map(s => [
      s.full_name, s.email, s.phone,
      s.company_name || 'Individual',
      s.category, s.business_address, s.status,
      s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'supplier_directory.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Supplier list exported as CSV.');
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const activeCount = suppliers.filter(s => s.status === 'Active').length;

  const uniqueCategories = [...new Set(suppliers.map(s => s.category).filter(Boolean))].sort();

  return (
    <>
      <style>{STYLES}</style>
      <div className="psl-page">
        {/* Header */}
        <div className="psl-header">
          <div>
            <h1 className="psl-title">Supplier Management</h1>
            <p className="psl-sub">Supplier directory & bulk outreach</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="psl-btn psl-btn-green" onClick={() => navigate('/purchase/suppliers/add')}>
              <UserPlus size={16} /> Add Internal Supplier
            </button>
            <button className="psl-btn psl-btn-outline" onClick={() => navigate('/purchase/supplier-performance')}>
              <BarChart2 size={16} /> Performance
            </button>
            <button className="psl-btn psl-btn-outline" onClick={() => navigate('/purchase/contracts')}>
              <FileText size={16} /> Contracts
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="psl-tabs">
          <button
            className={`psl-tab ${activeTab === 'registered' ? 'active' : ''}`}
            onClick={() => setActiveTab('registered')}
          >
            <Truck size={15} /> Self-Registered
            <span className="psl-tab-count">{suppliers.length}</span>
          </button>
          <button
            className={`psl-tab ${activeTab === 'internal' ? 'active' : ''}`}
            onClick={() => setActiveTab('internal')}
          >
            <Users size={15} /> Internal Suppliers
          </button>
        </div>

        {activeTab === 'registered' ? (
          <>
            {/* Stats */}
            <div className="psl-stats">
              <div className="psl-stat">
                <p className="psl-stat-num">{suppliers.length}</p>
                <p className="psl-stat-label">Total Registered</p>
              </div>
              <div className="psl-stat">
                <p className="psl-stat-num">{activeCount}</p>
                <p className="psl-stat-label">Active</p>
              </div>
              <div className="psl-stat">
                <p className="psl-stat-num">{selected.size}</p>
                <p className="psl-stat-label">Selected</p>
              </div>
              <div className="psl-stat">
                <p className="psl-stat-num">{uniqueCategories.length}</p>
                <p className="psl-stat-label">Categories</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="psl-toolbar">
              <div className="psl-search-wrap">
                <Search size={15} className="psl-search-icon" />
                <input
                  className="psl-search"
                  placeholder="Search by name, email, company, category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="psl-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="psl-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="psl-btn psl-btn-outline" onClick={fetchSuppliers} title="Refresh">
                <RefreshCw size={15} />
              </button>
              <button className="psl-btn psl-btn-outline" onClick={handleExport}>
                <Download size={15} /> Export CSV
              </button>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="psl-bulk-bar">
                <p className="psl-bulk-count">
                  <CheckSquare size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {selected.size} supplier{selected.size > 1 ? 's' : ''} selected
                </p>
                <button className="psl-btn-gmail" onClick={handleEmailSelected}>
                  <Mail size={16} /> Email Selected via Gmail
                </button>
                <button className="psl-btn-deselect" onClick={() => setSelected(new Set())}>
                  Clear Selection
                </button>
              </div>
            )}

            {/* Table */}
            <div className="psl-card">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, gap: 12, color: '#2E8B57' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontWeight: 600 }}>Loading suppliers...</span>
                </div>
              ) : error ? (
                <div className="psl-empty">
                  <AlertCircle size={40} color="#C62828" />
                  <h3>Error Loading Suppliers</h3>
                  <p>{error}</p>
                  <button className="psl-btn psl-btn-green" style={{ margin: '16px auto 0', display: 'inline-flex' }} onClick={fetchSuppliers}>
                    <RefreshCw size={14} /> Try Again
                  </button>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="psl-empty">
                  <Truck size={48} color="#C8E6C9" />
                  <h3>No Suppliers Registered Yet</h3>
                  <p>Customers who register as suppliers will appear here automatically.</p>
                </div>
              ) : (
                <>
                  <table className="psl-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            className="psl-checkbox"
                            checked={selected.size === suppliers.length && suppliers.length > 0}
                            onChange={toggleSelectAll}
                            title="Select all"
                          />
                        </th>
                        <th>Supplier</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Category</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s.id} className={selected.has(s.id) ? 'selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="psl-checkbox"
                              checked={selected.has(s.id)}
                              onChange={() => toggleSelect(s.id)}
                            />
                          </td>
                          <td className="psl-name">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {s.profile_photo ? (
                                <img src={s.profile_photo} alt={s.full_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                  {s.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{s.full_name}</span>
                            </div>
                          </td>
                          <td>
                            <a href={`mailto:${s.email}`} className="psl-email" style={{ textDecoration: 'none' }}>
                              {s.email}
                            </a>
                          </td>
                          <td className="psl-phone">{s.phone || '—'}</td>
                          <td className="psl-company">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Building2 size={13} color="#aaa" />
                              {s.company_name || <em style={{ color: '#aaa' }}>Individual</em>}
                            </span>
                          </td>
                          <td>
                            <span className="psl-cat-badge">{s.category}</span>
                          </td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666', fontSize: '0.8rem' }}>
                            {s.business_address || '—'}
                          </td>
                          <td>
                            {s.status === 'Active'
                              ? <span className="psl-status-active"><CheckCircle2 size={12} />Active</span>
                              : <span className="psl-status-inactive"><XCircle size={12} />Inactive</span>
                            }
                          </td>
                          <td className="psl-date">{fmtDate(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="psl-mob-cards">
                    {suppliers.map(s => (
                      <div key={s.id} className={`psl-mob-card ${selected.has(s.id) ? 'selected' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {s.profile_photo ? (
                              <img src={s.profile_photo} alt={s.full_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {s.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <h4>{s.full_name}</h4>
                          </div>
                          <input type="checkbox" className="psl-checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                        </div>
                        <p><Mail size={12} color="#6B8E23" style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.email}</p>
                        <p><Phone size={12} color="#6B8E23" style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.phone || '—'}</p>
                        <p><Tag size={12} color="#6B8E23" style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.category}</p>
                        <div style={{ marginTop: 8 }}>
                          {s.status === 'Active'
                            ? <span className="psl-status-active"><CheckCircle2 size={11} />Active</span>
                            : <span className="psl-status-inactive"><XCircle size={11} />Inactive</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer note about Gmail */}
            <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
              💡 <strong>Gmail note:</strong> Emails are sent from whichever Google account the Purchase Manager is logged into in their browser. Suppliers are placed in <strong>Bcc</strong> so they cannot see each other's addresses.
            </p>
          </>
        ) : (
          /* ── Internal procurement suppliers tab ── */
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#555' }}>
            <Users size={48} color="#C8E6C9" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#1B5E20', margin: '0 0 8px' }}>Internal Procurement Suppliers</h3>
            <p style={{ margin: '0 0 20px', color: '#888' }}>
              View and manage internal procurement suppliers — used for purchase orders, quotations, and contracts.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="psl-btn psl-btn-green" onClick={() => navigate('/purchase/suppliers/add')}>
                <UserPlus size={15} /> Add New Supplier
              </button>
              <button className="psl-btn psl-btn-outline" onClick={() => navigate('/purchase/supplier-performance')}>
                <BarChart2 size={15} /> Supplier Performance
              </button>
              <button className="psl-btn psl-btn-outline" onClick={() => navigate('/purchase/contracts')}>
                <FileText size={15} /> Supplier Contracts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`psl-toast psl-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default PurchaseSupplierList;
