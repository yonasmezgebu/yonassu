import React, { useState, useEffect } from 'react';
import { Eye, Check, X, MessageSquare } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingFileReview = () => {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState({});

  const refresh = () => setFiles([...printingState.files.filter(f => f.status === 'Pending Review')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "📄 File Awaiting Review"
  }, []);

  const handleAction = (id, action) => {
    const f = printingState.files.find(x => x.id === id);
    if (!f) return;
    
    if (action === 'Approve') {
      if(window.confirm('Approve this file for production?')) {
        f.status = 'Approved';
        playSound('success');
        refresh();
      }
    } else {
      if (!notes[id]) { alert('Notes/Comments are mandatory for Rejections/Change Requests.'); return; }
      if(window.confirm(`${action} this file?`)) {
        f.status = action === 'Reject' ? 'Rejected' : 'Changes Requested';
        playSound('success');
        setNotes(p => ({...p, [id]: ''}));
        refresh();
      }
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Eye color="#8b5cf6" size={28} /> FILE REVIEW / APPROVAL
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Formal review gate for designs to ensure they meet client brief.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'File Name', 'Uploader', 'Date', 'Status', 'Review Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{f.jobId}</td>
                <td style={{ padding: '12px 14px', color: '#3b82f6', fontWeight: 500 }}>{f.name}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{f.uploader}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{f.date}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>{f.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAction(f.id, 'Approve')} style={{ flex: 1, padding: '6px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Check size={14} /> Approve</button>
                      <button onClick={() => handleAction(f.id, 'Request Changes')} style={{ flex: 1, padding: '6px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Req. Changes</button>
                      <button onClick={() => handleAction(f.id, 'Reject')} style={{ flex: 1, padding: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><X size={14} /> Reject</button>
                    </div>
                    <input 
                      placeholder="Mandatory notes for rejection/changes..." 
                      value={notes[f.id] || ''} 
                      onChange={e => setNotes(p => ({...p, [f.id]: e.target.value}))} 
                      style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No files pending review.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingFileReview;
