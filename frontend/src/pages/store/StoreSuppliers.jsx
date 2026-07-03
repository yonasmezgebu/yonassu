import React, { useState } from 'react';
import { Users, Plus, Download, Edit2, Activity } from 'lucide-react';
import { storeSuccess } from '../../utils/storeNotifications';

const mockSuppliers = [
  { id: 'SUP-001', name: 'ABC Pharma Distributors', contact: 'John Doe', phone: '+1234567890', email: 'john@abcpharma.com', address: '123 Health St, City', taxId: 'TAX12345', terms: 'Net 30', status: 'Active', deliveries: 12, balance: '$5,400' },
  { id: 'SUP-002', name: 'Global Med Supplies', contact: 'Jane Smith', phone: '+0987654321', email: 'jane@globalmed.com', address: '456 Care Ave, City', taxId: 'TAX67890', terms: 'Net 15', status: 'Active', deliveries: 8, balance: '$2,100' },
  { id: 'SUP-003', name: 'Office Essentials Ltd', contact: 'Mike Johnson', phone: '+1122334455', email: 'mike@officeessentials.com', address: '789 Paper Rd, City', taxId: 'TAX11223', terms: 'CIA', status: 'Inactive', deliveries: 3, balance: '$0' },
];

const StoreSuppliers = () => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', terms: 'Net 30' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setSuppliers(s => s.map(sup => sup.id === editingId ? { ...sup, ...formData } : sup));
      storeSuccess('📦 Supplier Updated', '📦 Supplier Record Changed', `${formData.name} details have been updated.`);
    } else {
      const newSup = { ...formData, id: `SUP-00${suppliers.length + 1}`, status: 'Active', deliveries: 0, balance: '$0' };
      setSuppliers([...suppliers, newSup]);
      storeSuccess('📦 Supplier Added', '📦 Supplier Record Changed', `${formData.name} has been added to the system.`);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', terms: 'Net 30' });
  };

  const handleEdit = (sup) => {
    setFormData({ name: sup.name, contact: sup.contact, phone: sup.phone, email: sup.email, address: sup.address, taxId: sup.taxId, terms: sup.terms });
    setEditingId(sup.id);
    setShowForm(true);
  };

  const toggleStatus = (id) => {
    setSuppliers(s => s.map(sup => {
      if (sup.id === id) {
        const newStatus = sup.status === 'Active' ? 'Inactive' : 'Active';
        storeSuccess(`📦 Supplier marked as ${newStatus}`, '📦 Supplier Record Changed', `${sup.name} is now ${newStatus}.`);
        return { ...sup, status: newStatus };
      }
      return sup;
    }));
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users color="#3b82f6" size={28} /> SUPPLIERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Supplier Record</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
          <button onClick={() => { setEditingId(null); setFormData({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', terms: 'Net 30' }); setShowForm(!showForm); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <Plus size={15} /> Add Supplier
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #bfdbfe', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#1d4ed8' }}>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Supplier Name *</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Contact Person *</label>
                <input required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone *</label>
                <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Tax ID</label>
                <input value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Payment Terms *</label>
                <select required value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 60</option>
                  <option>CIA</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Address *</label>
                <input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 24px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save Supplier</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Supplier Name', 'Contact Info', 'Address', 'Tax ID', 'Terms', 'History (Deliveries | Bal)', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: s.status === 'Inactive' ? '#f8fafc' : 'white' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{s.id}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 500 }}>{s.contact}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.phone}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.email}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569', maxWidth: 200 }}>{s.address}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748b' }}>{s.taxId}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{s.terms}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ color: '#0f172a' }}><strong>{s.deliveries}</strong> deliveries</div>
                  <div style={{ color: '#b91c1c', fontWeight: 600 }}>Bal: {s.balance}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'Active' ? '#dcfce7' : '#fee2e2', color: s.status === 'Active' ? '#166534' : '#991b1b' }}>{s.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(s)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => toggleStatus(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      <Activity size={13} /> {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreSuppliers;
