import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import {
  EyeOff, Search, Pill, Calendar, Shield, Globe, Bell, X,
  CheckCircle, List, RefreshCw, AlertTriangle, Lock
} from 'lucide-react';

const HIDE_TYPES = [
  { value: 'temporary', label: 'Hide temporarily' },
  { value: 'permanent', label: 'Hide permanently' },
  { value: 'internal_only', label: 'Hide only from public, keep in internal system' },
];

export default function DrugHideForm() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('hide');
  const [loading, setLoading] = useState(false);
  const [hiddenDrugs, setHiddenDrugs] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugSuggestions, setDrugSuggestions] = useState([]);
  const [reason, setReason] = useState('');
  const [hideType, setHideType] = useState('temporary');
  const [autoShowDate, setAutoShowDate] = useState('');
  const [notifyCEO, setNotifyCEO] = useState(true);

  useEffect(() => {
    if (tab === 'list') fetchHiddenDrugs();
  }, [tab]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      searchDrugs(searchQuery);
    } else {
      setDrugSuggestions([]);
    }
  }, [searchQuery]);

  const searchDrugs = async (query) => {
    try {
      const res = await apiClient.get(`/pharmacy/products?search=${encodeURIComponent(query)}`);
      setDrugSuggestions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const selectDrug = (drug) => {
    setSelectedDrug(drug);
    setSearchQuery(drug.name || drug.drug_name);
    setDrugSuggestions([]);
  };

  const clearSelection = () => {
    setSelectedDrug(null);
    setSearchQuery('');
    setReason('');
    setHideType('temporary');
    setAutoShowDate('');
    setNotifyCEO(true);
  };

  const fetchHiddenDrugs = async () => {
    setListLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/drug-hide');
      setHiddenDrugs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDrug) { showToast('Please select a drug to hide', 'warning'); return; }
    if (!reason.trim()) { showToast('Please provide a reason', 'warning'); return; }

    setLoading(true);
    try {
      const payload = {
        drug_id: selectedDrug.id,
        drug_name: selectedDrug.name || selectedDrug.drug_name,
        reason,
        hide_type: hideType,
        auto_show_date: hideType === 'temporary' ? autoShowDate : null,
        notify_ceo: notifyCEO,
      };
      const res = await apiClient.post('/pharmacy/drug-hide', payload);
      if (res.status === 'success') {
        showToast('Drug hidden successfully', 'success');
        clearSelection();
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to hide drug', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <EyeOff size={22} color="#8B5CF6" /> Hide Drug from Public (B5)
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Manager tool to restrict drug visibility</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setTab('hide'); clearSelection(); }} style={tabBtn(tab === 'hide')}>
          <EyeOff size={15} /> Hide Drug
        </button>
        <button onClick={() => { setTab('list'); fetchHiddenDrugs(); }} style={tabBtn(tab === 'list')}>
          <List size={15} /> Hidden Drugs ({hiddenDrugs.length})
        </button>
      </div>

      {tab === 'hide' && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#224f94', color: 'white', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 8 }}>SUTANA</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Hide Drug</h2>
                  <p style={{ margin: 0, fontSize: 10, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Flow 4 — Hide Drug from Public (B5)</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 150, height: 150, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.6 }}></div>
              <div style={{ position: 'absolute', bottom: -8, right: 80, width: 50, height: 50, background: '#1c3d70', borderRadius: '12px' }}></div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}><Search size={13} /> Search Drug *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Type drug name to search..." style={inputStyle()} />
                  {drugSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #E2E8F0', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflow: 'auto', marginTop: 4 }}>
                      {drugSuggestions.map(d => (
                        <div key={d.id} onMouseDown={() => selectDrug(d)}
                          style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{d.name || d.drug_name}</span>
                          <span style={{ color: '#64748B', fontSize: 12 }}>{d.stock_quantity || 0} in stock</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedDrug && (
                <div style={{ marginBottom: 20, background: '#F0FDF4', borderRadius: 8, padding: '12px 16px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Pill size={18} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46' }}>{selectedDrug.name || selectedDrug.drug_name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{selectedDrug.stock_quantity || 0} units in stock</div>
                    </div>
                  </div>
                  <button type="button" onClick={clearSelection}
                    style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#EF4444', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}><AlertTriangle size={13} /> Reason *</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Why is this drug being hidden?"
                  rows={3} style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}><Lock size={13} /> Hide Type *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {HIDE_TYPES.map(ht => (
                    <label key={ht.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                      border: `2px solid ${hideType === ht.value ? '#059669' : '#E2E8F0'}`,
                      borderRadius: 8, cursor: 'pointer', background: hideType === ht.value ? '#ECFDF5' : 'white',
                      fontWeight: 600, fontSize: 13, color: hideType === ht.value ? '#065F46' : '#475569',
                    }}>
                      <input type="radio" name="hideType" value={ht.value} checked={hideType === ht.value}
                        onChange={() => setHideType(ht.value)} style={{ display: 'none' }} />
                      {ht.value === 'temporary' && <Calendar size={16} />}
                      {ht.value === 'permanent' && <EyeOff size={16} />}
                      {ht.value === 'internal_only' && <Shield size={16} />}
                      {ht.label}
                    </label>
                  ))}
                </div>
              </div>

              {hideType === 'temporary' && (
                <div style={{ marginBottom: 20, background: '#FFFBEB', borderRadius: 8, padding: '12px 16px', border: '1px solid #FDE68A' }}>
                  <label style={labelStyle}><Calendar size={13} /> Auto-show Date *</label>
                  <input type="date" value={autoShowDate} onChange={e => setAutoShowDate(e.target.value)}
                    style={inputStyle()} />
                </div>
              )}

              <div style={{ marginBottom: 20, background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  <input type="checkbox" checked={notifyCEO} onChange={e => setNotifyCEO(e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  <Bell size={14} /> Notify CEO about this hide
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={clearSelection}
                  style={{
                    flex: 1, padding: '14px 24px', background: 'white', color: '#475569', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading || !selectedDrug}
                  style={{
                    flex: 2, padding: '14px 24px', background: !selectedDrug ? '#94A3B8' : '#8B5CF6', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading || !selectedDrug ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                  }}>
                  <EyeOff size={18} /> {loading ? 'Hiding...' : 'Confirm Hide'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EyeOff size={16} color="#8B5CF6" /> Hidden Drugs
            </h3>
            <button onClick={fetchHiddenDrugs} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {listLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
          ) : hiddenDrugs.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No hidden drugs.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Drug</th>
                  <th style={thStyle}>Hide Type</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Auto-show</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {hiddenDrugs.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{h.drug_name}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: h.hide_type === 'permanent' ? '#FEE2E2' : h.hide_type === 'temporary' ? '#FFFBEB' : '#EFF6FF',
                        color: h.hide_type === 'permanent' ? '#991B1B' : h.hide_type === 'temporary' ? '#92400E' : '#1E40AF',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>
                        {h.hide_type === 'temporary' ? 'Temporary' : h.hide_type === 'permanent' ? 'Permanent' : 'Internal Only'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{h.reason || '—'}</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      {h.auto_show_date ? new Date(h.auto_show_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: h.status === 'ACTIVE' ? '#FEE2E2' : h.status === 'SCHEDULED' ? '#FFFBEB' : '#D1FAE5',
                        color: h.status === 'ACTIVE' ? '#991B1B' : h.status === 'SCHEDULED' ? '#92400E' : '#065F46',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>
                        {h.status || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
