import React, { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';

const StockMovements = () => {
  const [selectedDoc, setSelectedDoc] = useState(1);

  // Mock list of transfers
  const transfers = [
    { id: 1, transferNo: 'TRN-2026-001', date: '2026-07-01', from: 'Main Store', to: 'Pharmacy Store', status: 'Completed', approvedBy: 'Dr. Sarah', remarks: 'Routine restocking' },
    { id: 2, transferNo: 'TRN-2026-002', date: '2026-07-02', from: 'Main Store', to: 'Laboratory', status: 'Draft', approvedBy: '', remarks: 'Urgent lab supplies' },
  ];

  const activeTransfer = transfers.find(t => t.id === selectedDoc) || transfers[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      
      {/* LEFT PANEL - List */}
      <div style={{ width: '350px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Stock Transfers</h2>
            <button style={{ backgroundColor: '#009ca6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
              <Plus size={16} /> New
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input 
              type="text" 
              placeholder="Search transfers..." 
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {transfers.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => setSelectedDoc(doc.id)}
              style={{ 
                padding: '15px 20px', 
                borderBottom: '1px solid #f1f5f9', 
                cursor: 'pointer',
                backgroundColor: selectedDoc === doc.id ? '#f0fdfa' : 'white',
                borderLeft: selectedDoc === doc.id ? '4px solid #009ca6' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{doc.transferNo}</span>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  backgroundColor: doc.status === 'Completed' ? '#dcfce7' : '#fef08a',
                  color: doc.status === 'Completed' ? '#166534' : '#854d0e',
                  fontWeight: '500'
                }}>
                  {doc.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
                <span>{doc.date}</span>
                <span>{doc.to}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - Blue Paper Design */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e2e8f0', padding: '30px' }}>
        
        {/* Toolbar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', maxWidth: '850px', margin: '0 auto 20px auto' }}>
          <button onClick={handlePrint} style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Print Document
          </button>
        </div>

        {/* The Paper Component matching the blue design */}
        <div style={{ 
          backgroundColor: '#009ca6', 
          padding: '20px', 
          margin: '0 auto',
          maxWidth: '850px',
          display: 'flex',
          justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            width: '100%', 
            padding: '40px',
            minHeight: '800px',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            
            {/* Header / Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', position: 'relative', marginTop: '10px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#009ca6', zIndex: 1 }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '15%', transform: 'translateY(-50%) rotate(45deg)', width: '10px', height: '10px', border: '1.5px solid #009ca6', background: 'white', zIndex: 2 }}></div>
              <div style={{ position: 'absolute', top: '50%', right: '15%', transform: 'translateY(-50%) rotate(45deg)', width: '10px', height: '10px', border: '1.5px solid #009ca6', background: 'white', zIndex: 2 }}></div>
              <div style={{ textAlign: 'center', background: 'white', padding: '0 20px', zIndex: 2, position: 'relative' }}>
                <div style={{ fontFamily: '"Brush Script MT", "Great Vibes", cursive', fontSize: '52px', marginBottom: '-15px', color: '#111', fontWeight: 'normal' }}>Stock</div>
                <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '38px', fontWeight: 'normal', letterSpacing: '2px', textTransform: 'uppercase', color: '#111' }}>TRANSFER FORM</div>
              </div>
            </div>

            {/* Meta Fields Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '14px' }}>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>Transfer No:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.transferNo}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>Transfer Date:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.date}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>From Warehouse:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.from}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>To Warehouse:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.to}</span>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#009ca6', color: 'white', padding: '14px 8px', fontWeight: 'normal', borderRight: '2px solid white', fontSize: '14px', width: '8%' }}>No.</th>
                  <th style={{ backgroundColor: '#009ca6', color: 'white', padding: '14px 8px', fontWeight: 'normal', borderRight: '2px solid white', fontSize: '14px', width: '50%', textAlign: 'left' }}>Item</th>
                  <th style={{ backgroundColor: '#009ca6', color: 'white', padding: '14px 8px', fontWeight: 'normal', borderRight: '2px solid white', fontSize: '14px', width: '20%' }}>Quantity</th>
                  <th style={{ backgroundColor: '#009ca6', color: 'white', padding: '14px 8px', fontWeight: 'normal', fontSize: '14px', width: '22%' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'left' }}>Amoxicillin 500mg Capsules</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>500</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>Box</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>2</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'left' }}>Paracetamol 500mg Tablets</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>1000</td>
                  <td style={{ border: '1px solid #000', padding: '12px 10px', fontSize: '14px', textAlign: 'center' }}>Blister Pack</td>
                </tr>
                {[...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #000', padding: '12px 10px' }}><br/></td>
                    <td style={{ border: '1px solid #000', padding: '12px 10px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '12px 10px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '12px 10px' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '50px', fontSize: '14px' }}>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>Approved By:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.approvedBy}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '5px' }}>
                <strong>Remarks:</strong> <span style={{ marginLeft: '10px' }}>{activeTransfer.remarks}</span>
              </div>
            </div>

          </div>
        </div>
        
        {/* Style injection for printing the component */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .no-print { display: none !important; }
            #root { background: white !important; }
            .page-container, .page-container * { visibility: visible; }
            .page-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: #009ca6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
      </div>
    </div>
  );
};

export default StockMovements;
