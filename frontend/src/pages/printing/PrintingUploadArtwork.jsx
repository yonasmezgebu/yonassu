import React, { useState, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, File } from 'lucide-react';
import { printingState, linkFileToJob, generateId } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingUploadArtwork = () => {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);

  const refresh = () => setFiles([...printingState.files.filter(f => f.status === 'Pending Link')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "📤 New Artwork Uploaded"
  }, []);

  const handleSimulateUpload = (e) => {
    e.preventDefault();
    setDrag(false);
    playSound('success');
    const newFile = {
      id: generateId('F'),
      name: 'new_client_artwork.ai',
      jobId: null, type: 'AI', size: '12MB',
      uploader: 'Client Portal', date: new Date().toISOString().split('T')[0],
      status: 'Pending Link', version: 1, history: []
    };
    printingState.files.push(newFile);
    alert('Simulated Upload Successful (Unsupported types would be rejected).');
    refresh();
  };

  const handleLink = (fileId) => {
    const jobInput = prompt('Enter Job # to link this file to (e.g., JOB-000101):');
    if(jobInput) {
      const exists = printingState.jobs.find(j => j.id === jobInput);
      if(!exists) { alert('Job # not found.'); return; }
      linkFileToJob(fileId, jobInput);
      playSound('success');
      alert(`File linked to ${jobInput} successfully.`);
      refresh();
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <UploadCloud color="#3b82f6" size={28} /> UPLOAD ARTWORK
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Intake point for client files. Must link to Job #.</p>
      </div>

      <div 
        onDragOver={(e) => {e.preventDefault(); setDrag(true);}}
        onDragLeave={() => setDrag(false)}
        onDrop={handleSimulateUpload}
        style={{ background: drag ? '#eff6ff' : 'white', border: `2px dashed ${drag ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 24, transition: 'all 0.2s', cursor: 'pointer' }}
        onClick={handleSimulateUpload}
      >
        <UploadCloud size={40} color={drag ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 18 }}>Drag & Drop Files Here</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Supported formats: AI, PSD, PDF, CDR, EPS, JPG, PNG</p>
      </div>

      <h3 style={{ fontSize: 16, color: '#0f172a', marginBottom: 16 }}>Pending Linkage ({files.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {files.map(f => (
          <div key={f.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8 }}><File color="#64748b" size={24} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{f.type} • {f.size} • Uploaded by {f.uploader} on {f.date}</div>
              </div>
            </div>
            <button onClick={() => handleLink(f.id)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><LinkIcon size={16} /> Link to Job Order</button>
          </div>
        ))}
        {files.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>No unlinked files.</div>}
      </div>
    </div>
  );
};

export default PrintingUploadArtwork;
