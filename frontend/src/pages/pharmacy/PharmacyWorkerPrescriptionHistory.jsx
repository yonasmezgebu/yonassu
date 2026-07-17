import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import {
  Archive, RefreshCw, Filter, CheckCircle, XCircle, Search,
  Calendar, User, Pill, Building2, ChevronDown, Loader, ClipboardList
} from 'lucide-react';

const STATUS_OPTS = [
  { value: '', label: 'All Completed' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusStyle = (status) => {
  if (status === 'PICKED_UP') return { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' };
  if (status === 'CANCELLED') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
};

const statusIcon = (status) => {
  if (status === 'PICKED_UP') return <CheckCircle size={12} />;
  if (status === 'CANCELLED') return <XCircle size={12} />;
  return null;
};

export default function PharmacyWorkerPrescriptionHistory() {
  const { showToast, ToastContainer } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch PICKED_UP and CANCELLED prescriptions from the backend
      const status = statusFilter || 'PICKED_UP,CANCELLED';
      const res = await apiClient.get(`/pharmacy/prescriptions?status=${status}`);
      setRecords(res?.data || []);
    } catch (e) {
      showToast('Failed to load prescription history', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Client-side filtering by search & dates
  const filtered = records.filter(rx => {
    const matchSearch = !search
      || (rx.customer_name || '').toLowerCase().includes(search.toLowerCase())
      || (rx.drug_name || '').toLowerCase().includes(search.toLowerCase())
      || (rx.reference_no || '').toLowerCase().includes(search.toLowerCase());

    const date = rx.updated_at ? new Date(rx.updated_at) : new Date(rx.created_at);
    const matchFrom = !dateFrom || date >= new Date(dateFrom);
    const matchTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchFrom && matchTo;
  });

  const pickedUpCount = records.filter(r => r.status === 'PICKED_UP').length;
  const cancelledCount = records.filter(r => r.status === 'CANCELLED').length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Archive size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Prescription History
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
              All completed and cancelled prescription records
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Records" value={records.length} icon={<ClipboardList size={18} />} color="#6366f1" bg="#eef2ff" />
        <StatCard label="Picked Up" value={pickedUpCount} icon={<CheckCircle size={18} />} color="#059669" bg="#ecfdf5" />
        <StatCard label="Cancelled" value={cancelledCount} icon={<XCircle size={18} />} color="#e11d48" bg="#fff1f2" />
      </div>

      {/* Filters Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Filter size={14} color="#6366f1" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Filter Records</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
          {/* Search */}
          <div>
            <label style={labelStyle}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, drug or reference..."
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '9px 32px 9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, appearance: 'none', outline: 'none', fontFamily: 'inherit', background: 'white' }}
              >
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
          {/* From */}
          <div>
            <label style={labelStyle}>From Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          {/* To */}
          <div>
            <label style={labelStyle}>To Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>
        {(search || statusFilter || dateFrom || dateTo) && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} of {records.length} records shown</span>
            <button onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }} style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
            <Loader size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 13 }}>Loading prescription history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Archive size={48} color="#d1d5db" />
            <h3 style={{ fontWeight: 700, color: '#374151', margin: '12px 0 6px' }}>No records found</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={th}>Reference #</th>
                  <th style={th}>Customer</th>
                  <th style={th}>Drug & Qty</th>
                  <th style={th}>Source</th>
                  <th style={th}>Pickup Branch</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rx, idx) => (
                  <tr
                    key={rx.id}
                    style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                  >
                    <td style={td}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                        #{rx.reference_no || String(rx.id).padStart(5, '0')}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color="white" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{rx.customer_name || '—'}</div>
                          {rx.customer_phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{rx.customer_phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#0f172a' }}>
                        <Pill size={13} color="#059669" /> {rx.drug_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Qty: {rx.quantity}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#64748b' }}>
                      {rx.source || rx.intake_source || '—'}
                    </td>
                    <td style={td}>
                      {rx.branch_pickup ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                          <Building2 size={12} /> {rx.branch_pickup}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ ...statusStyle(rx.status), padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {statusIcon(rx.status)}
                        {rx.status === 'PICKED_UP' ? 'Picked Up' : rx.status === 'CANCELLED' ? 'Cancelled' : rx.status}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 11, color: '#94a3b8' }}>
                      {rx.updated_at
                        ? new Date(rx.updated_at).toLocaleString()
                        : rx.created_at
                          ? new Date(rx.created_at).toLocaleString()
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 };
const th = { padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const td = { padding: '14px 16px', color: '#1e293b', verticalAlign: 'middle' };
