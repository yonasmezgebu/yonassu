import React, { useState } from 'react';
import { GitCommit, RefreshCcw, Eye } from 'lucide-react';
import { printingState, addFileVersion } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingVersionControl = () => {
  const [files, setFiles] = useState(printingState.files.filter(f => f.jobId));
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSimulateUploadNewVersion = (f) => {
    addFileVersion(f.id, 'Designer (Sara T.)', 'Updated bleed margins');
    playSound('success');
    setFiles([...printingState.files.filter(x => x.jobId)]);
    if(selectedFile && selectedFile.id === f.id) {
      setSelectedFile(printingState.files.find(x => x.id === f.id));
    }
  };

  const handleRestore = (f, oldVer) => {
    if(window.confirm(`Restore version ${oldVer.version} as the active version?`)) {
      addFileVersion(f.id, 'Supervisor', `Restored from v${oldVer.version}`);
      playSound('success');
      setFiles([...printingState.files.filter(x => x.jobId)]);
      setSelectedFile(printingState.files.find(x => x.id === f.id));
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <GitCommit color="#0ea5e9" size={28} /> VERSION CONTROL
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Immutable audit and rollback history for all job files.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* File List */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job #</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>File Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Cur. Version</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} onClick={() => setSelectedFile(f)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedFile?.id === f.id ? '#e0f2fe' : 'white' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{f.jobId}</td>
                  <td style={{ padding: '12px 14px', color: '#3b82f6', fontWeight: 500 }}>{f.name}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0ea5e9' }}>v{f.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Version History Panel */}
        {selectedFile ? (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 18 }}>{selectedFile.name}</h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>Linked to Job: <strong>{selectedFile.jobId}</strong></div>
              </div>
              <button onClick={() => handleSimulateUploadNewVersion(selectedFile)} style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Simulate Upload New Version</button>
            </div>

            <div style={{ borderLeft: '2px solid #e2e8f0', marginLeft: 8, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current Version */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -31, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#0ea5e9', border: '2px solid white' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Version {selectedFile.version} (Active)</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{selectedFile.date} • By: <strong>{selectedFile.uploader}</strong></div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Eye size={14} /> View</button>
                </div>
              </div>

              {/* History Log */}
              {[...selectedFile.history].reverse().map((h, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -31, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#cbd5e1', border: '2px solid white' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Version {h.version}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{h.date} • By: <strong>{h.uploader}</strong></div>
                    </div>
                    <button onClick={() => handleRestore(selectedFile, h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><RefreshCcw size={14} /> Restore</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Select a file to view version history
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingVersionControl;
