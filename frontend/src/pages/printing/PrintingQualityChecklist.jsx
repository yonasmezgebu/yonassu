import React, { useState, useEffect } from 'react';
import { ListChecks, Plus, Trash2, Download, Save } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const JOB_TYPES = ['Business Cards', 'Flyers/Brochures', 'Posters/Banners', 'Books/Magazines', 'Labels/Stickers', 'Packaging'];
const STAGES = ['File Preparation', 'Color Matching', 'Proofing', 'Printing', 'Finishing', 'Packaging'];
const DEFAULT_ITEMS = ['Color Accuracy', 'Print Quality', 'Registration', 'Paper Quality', 'Cutting Accuracy', 'Binding/Finishing', 'Quantity', 'Packaging'];

const PrintingQualityChecklist = () => {
  const [selectedType, setSelectedType] = useState('Business Cards');
  const [selectedStage, setSelectedStage] = useState('Printing');
  const [checklists, setChecklists] = useState({});
  const [newItem, setNewItem] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load from mock state, fill gaps with defaults
    const loaded = {};
    JOB_TYPES.forEach(t => {
      const existing = printingState.qualityChecklists.find(c => c.type === t);
      loaded[t] = existing ? { ...existing.stages } : {};
      STAGES.forEach(s => {
        if (!loaded[t][s]) loaded[t][s] = [...DEFAULT_ITEMS];
      });
    });
    setChecklists(loaded);
    playSound('info');
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const currentItems = checklists[selectedType]?.[selectedStage] || [];

  const handleToggleItem = (idx) => {
    const updated = { ...checklists };
    const cur = [...(updated[selectedType][selectedStage] || [])];
    // Items are strings — we'll track checked state separately
    setChecklists(updated);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    const updated = { ...checklists };
    updated[selectedType] = { ...updated[selectedType] };
    updated[selectedType][selectedStage] = [...(updated[selectedType][selectedStage] || []), newItem.trim()];
    setChecklists(updated);
    setNewItem('');
  };

  const handleRemoveItem = (idx) => {
    const updated = { ...checklists };
    updated[selectedType] = { ...updated[selectedType] };
    const items = [...updated[selectedType][selectedStage]];
    items.splice(idx, 1);
    updated[selectedType][selectedStage] = items;
    setChecklists(updated);
  };

  const handleSave = () => {
    // Persist back to mock state
    JOB_TYPES.forEach(t => {
      const idx = printingState.qualityChecklists.findIndex(c => c.type === t);
      const entry = { type: t, stages: checklists[t], items: Object.values(checklists[t]).flat() };
      if (idx >= 0) printingState.qualityChecklists[idx] = entry;
      else printingState.qualityChecklists.push(entry);
    });
    playSound('info');
    showToast('📋 Quality Checklist Updated.');
  };

  const handlePrint = () => {
    playSound('success');
    const win = window.open('', '_blank');
    const items = currentItems.map(i => `<li style="padding:6px 0;">${i}</li>`).join('');
    win.document.write(`
      <html><body style="font-family:sans-serif;padding:40px">
        <h1>SUTANA PRINTING — Quality Checklist</h1>
        <h2>${selectedType} · ${selectedStage}</h2>
        <p>Generated: ${new Date().toLocaleString()}</p><hr/>
        <ul style="line-height:2">${items}</ul>
        <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '14px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <ListChecks color="#10b981" size={28} /> QUALITY CHECKLIST TEMPLATES
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage reusable checklist templates per job type and production stage.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Sidebar: Job Types */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Job Types</div>
          {JOB_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedType(t)} style={{ display: 'block', width: '100%', padding: '12px 14px', textAlign: 'left', background: selectedType === t ? '#eff6ff' : 'transparent', color: selectedType === t ? '#2563eb' : '#475569', border: 'none', borderLeft: `3px solid ${selectedType === t ? '#2563eb' : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 13, fontWeight: selectedType === t ? 700 : 400 }}>
              {t}
            </button>
          ))}
        </div>

        {/* Main: Stage + Checklist */}
        <div>
          {/* Stage Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => setSelectedStage(s)} style={{ padding: '6px 14px', background: selectedStage === s ? '#10b981' : 'white', color: selectedStage === s ? 'white' : '#475569', border: `1px solid ${selectedStage === s ? '#10b981' : '#e2e8f0'}`, borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
                <span style={{ color: '#10b981' }}>{selectedType}</span> — {selectedStage}
              </h3>
              <span style={{ fontSize: 13, color: '#64748b' }}>{currentItems.length} items</span>
            </div>

            {/* Checklist Items */}
            <div style={{ marginBottom: 20 }}>
              {currentItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid #10b981', borderRadius: 4, flexShrink: 0 }}></div>
                  <span style={{ flex: 1, fontSize: 13, color: '#0f172a' }}>{item}</span>
                  <button onClick={() => handleRemoveItem(idx)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Item */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} placeholder="Add new checklist item..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }} />
              <button onClick={handleAddItem} style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Save size={16} /> Save All Checklists
              </button>
              <button onClick={handlePrint} style={{ flex: 1, padding: '10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={16} /> Print Checklist (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingQualityChecklist;
