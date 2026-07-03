import React, { useState } from 'react';
import { Clipboard, Download, Plus, FileText, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { purchaseState } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseDrugTenders = () => {
  const [tenders, setTenders] = useState([...purchaseState.m5Tenders]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Antibiotics');
  const [qty, setQty] = useState('');
  const [uom, setUom] = useState('Boxes');
  const [closingDate, setClosingDate] = useState('');
  const [terms, setTerms] = useState('');
  const [instructions, setInstructions] = useState('');

  const handlePostTender = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `M5-${Date.now().toString().slice(-4)}`,
      dateCreated: new Date().toISOString().slice(0, 10),
      item, category, qty: parseInt(qty, 10), uom, closingDate,
      terms, instructions,
      status: 'Open',
      ceoApproved: false
    };
    purchaseState.m5Tenders.push(newRecord);
    setTenders([...purchaseState.m5Tenders]);
    setShowModal(false);
    submitNotification('📋 New Tender Created', '📋 New Tender - Click to View', 'success.mp3');
  };

  const handleAction = (id, actionType) => {
    const idx = purchaseState.m5Tenders.findIndex(t => t.id === id);
    if (idx === -1) return;

    if (actionType === 'Submit') {
      submitNotification('⏳ Tender Submitted to CEO', '⏳ Awaiting CEO Approval', 'info.mp3');
      purchaseState.m5Tenders[idx].status = 'Awaiting CEO';
      setTenders([...purchaseState.m5Tenders]);
    } else if (actionType === 'Award') {
      if (!purchaseState.m5Tenders[idx].ceoApproved) {
        alert('Server Rejected: Cannot award tender without CEO Approval.');
        return;
      }
      purchaseState.m5Tenders[idx].status = 'Awarded';
      setTenders([...purchaseState.m5Tenders]);
      submitNotification('🏆 Tender Awarded', '🏆 Winner selected successfully', 'success.mp3');
    }
  };

  const filtered = tenders.filter(t => filterStatus === 'All' || t.status === filterStatus);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0891b2' }}>
            <Clipboard color="#0891b2" size={28} /> DRUG TENDERS (M5)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage public tenders for pharmaceuticals and medical supplies.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Post Tender
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Open</option><option>Awaiting CEO</option><option>Awarded</option><option>Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Tender #', 'Date Created', 'Item Name', 'Category', 'Quantity', 'Closing Date', 'CEO Approval', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Quantity' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{t.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.dateCreated}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{t.item}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.category}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{t.qty} {t.uom}</td>
                <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: 500 }}>{t.closingDate}</td>
                <td style={{ padding: '12px 14px' }}>
                  {t.ceoApproved ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7' }}><CheckCircle size={12} /> Approved</span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9' }}><ShieldAlert size={12} /> Pending</span>
                  )}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: t.status === 'Open' ? '#cffafe' : t.status === 'Awarded' ? '#dcfce7' : '#fef3c7', color: t.status === 'Open' ? '#0891b2' : t.status === 'Awarded' ? '#16a34a' : '#d97706' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {t.status === 'Open' && (
                      <button onClick={() => handleAction(t.id, 'Submit')} style={{ padding: '4px 8px', fontSize: 11, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Submit to CEO</button>
                    )}
                    {t.status === 'Awaiting CEO' && (
                      <button onClick={() => handleAction(t.id, 'Award')} style={{ padding: '4px 8px', fontSize: 11, background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Award Tender</button>
                    )}
                    {t.status === 'Awarded' && (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Completed</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No tenders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#0891b2' }}><FileText size={20} /> Create New Tender</h2>
            <form onSubmit={handlePostTender}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Drug/Item Name *</label>
                <input value={item} onChange={e => setItem(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }} required>
                  <option>Antibiotics</option><option>Analgesics</option><option>Equipment</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity *</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>UoM *</label>
                <input value={uom} onChange={e => setUom(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Closing Date *</label>
                <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Terms & Conditions</label>
                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Special Instructions</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <Send size={16} /> Post Tender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDrugTenders;
