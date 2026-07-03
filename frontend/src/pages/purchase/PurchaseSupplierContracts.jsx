import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { contractsState, createContract, renewContract, getContractStatus } from '../../utils/purchaseTransactionService';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const statusColors = {
  Active: { bg: '#dcfce7', color: '#16a34a' },
  Expiring: { bg: '#fef3c7', color: '#d97706' },
  Expired: { bg: '#fee2e2', color: '#dc2626' }
};

const PurchaseSupplierContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [renewModal, setRenewModal] = useState(null); // holds contract being renewed
  const [newEndDate, setNewEndDate] = useState('');
  const [newValue, setNewValue] = useState('');

  // Form state for new contract
  const [form, setForm] = useState({ supplierName: '', startDate: '', endDate: '', value: '', scope: '', paymentTerms: 'Net 30', specialConditions: '' });
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const refreshContracts = () => {
    const enriched = contractsState.contracts.map(c => ({
      ...c,
      computedStatus: getContractStatus(c.endDate),
      daysLeft: Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    }));
    // Fire "Expiring Soon" info notification for contracts within 30 days
    enriched.filter(c => c.computedStatus === 'Expiring').forEach(c => {
      submitNotification(`⏰ Contract Expiring: ${c.supplierName} (${c.daysLeft} days left)`, '⏰ Contract Expiring Soon - Click to Review', 'info.mp3');
    });
    setContracts(enriched);
  };

  useEffect(() => { refreshContracts(); }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    createContract({ ...form, value: parseFloat(form.value) || 0 });
    setShowModal(false);
    setForm({ supplierName: '', startDate: '', endDate: '', value: '', scope: '', paymentTerms: 'Net 30', specialConditions: '' });
    refreshContracts();
    submitNotification('📄 Contract Created', '📄 Contract - Click to View', 'success.mp3');
  };

  const handleRenew = (e) => {
    e.preventDefault();
    renewContract(renewModal.id, newEndDate, parseFloat(newValue) || renewModal.value);
    setRenewModal(null); setNewEndDate(''); setNewValue('');
    refreshContracts();
    submitNotification('📄 Contract Renewed', '📄 Contract - Click to View', 'success.mp3');
  };

  const handleTerminate = (id) => {
    const reason = prompt('Enter reason for termination:');
    if (!reason) return;
    const c = contractsState.contracts.find(x => x.id === id);
    if (c) { c.terminationReason = reason; c.endDate = new Date().toISOString().slice(0, 10); }
    refreshContracts();
    submitNotification('🚫 Contract Terminated', '🚫 Supplier Contract Terminated', 'info.mp3');
  };

  const supplierNames = financeState.suppliers.map(s => s.name);

  const filtered = contracts.filter(c =>
    (filterStatus === 'All' || c.computedStatus === filterStatus) &&
    (!filterSupplier || c.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <FileText color="#0891b2" size={28} /> SUPPLIER CONTRACTS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Status computed automatically from contract end dates — no manual updates required.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> New Contract
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {['Active', 'Expiring', 'Expired'].map(s => (
          <div key={s} style={{ background: statusColors[s].bg, border: `1px solid ${statusColors[s].color}40`, borderRadius: 8, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: statusColors[s].color }}>{contracts.filter(c => c.computedStatus === s).length}</div>
            <div style={{ fontSize: 12, color: statusColors[s].color, fontWeight: 600 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Active</option><option>Expiring</option><option>Expired</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier</label>
          <input placeholder="Search supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Contract #', 'Supplier', 'Start Date', 'End Date', 'Days Left', 'Value', 'Scope', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Value' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: c.computedStatus === 'Expiring' ? '#fffbeb' : 'transparent' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                  {c.id}
                  {c.linkedPrior && <div style={{ fontSize: 10, color: '#64748b' }}>Renewed from {c.linkedPrior}</div>}
                </td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{c.supplierName}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{c.startDate}</td>
                <td style={{ padding: '12px 14px', color: c.computedStatus === 'Expiring' ? '#d97706' : c.computedStatus === 'Expired' ? '#dc2626' : '#64748b', fontWeight: c.computedStatus !== 'Active' ? 700 : 400 }}>{c.endDate}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: c.daysLeft < 0 ? '#dc2626' : c.daysLeft <= 30 ? '#d97706' : '#16a34a' }}>
                  {c.daysLeft < 0 ? 'Expired' : `${c.daysLeft}d`}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>${c.value.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13, maxWidth: 200 }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.scope}</div></td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...statusColors[c.computedStatus] }}>
                    {c.computedStatus === 'Expiring' && '⚠ '}{c.computedStatus}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {c.computedStatus !== 'Expired' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setRenewModal(c); setNewEndDate(''); setNewValue(c.value); }} style={{ padding: '4px 8px', fontSize: 11, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <RefreshCw size={11} /> Renew
                      </button>
                      <button onClick={() => handleTerminate(c.id)} style={{ padding: '4px 8px', fontSize: 11, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <XCircle size={11} /> Terminate
                      </button>
                    </div>
                  ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>Expired</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No contracts found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* New Contract Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 640 }}>
            <h2 style={{ margin: '0 0 20px', color: '#0891b2', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={20} /> New Supplier Contract</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Name *</label>
                <select value={form.supplierName} onChange={e => setForm(p => ({ ...p, supplierName: e.target.value }))} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option value="">Select supplier...</option>
                  {supplierNames.map(n => <option key={n}>{n}</option>)}
                </select></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Contract Value *</label>
                <input type="number" value={form.value} onChange={set('value')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Start Date *</label>
                <input type="date" value={form.startDate} onChange={set('startDate')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>End Date *</label>
                <input type="date" value={form.endDate} onChange={set('endDate')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Scope of Work *</label>
              <textarea value={form.scope} onChange={set('scope')} required rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Terms</label>
                <select value={form.paymentTerms} onChange={set('paymentTerms')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option>Net 30</option><option>Net 60</option><option>Cash on Delivery</option><option>Prepaid</option>
                </select></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Special Conditions</label>
                <input value={form.specialConditions} onChange={set('specialConditions')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Create Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {renewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 20px', color: '#0891b2', display: 'flex', alignItems: 'center', gap: 8 }}><RefreshCw size={20} /> Renew Contract — {renewModal.id}</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>A new contract will be created linked to <strong>{renewModal.id}</strong>. The original record is preserved for audit.</p>
            <form onSubmit={handleRenew}>
              <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>New End Date *</label>
              <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 24 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>New Contract Value (leave blank to keep ${renewModal.value?.toLocaleString()})</label>
              <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setRenewModal(null)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Create Renewed Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseSupplierContracts;
