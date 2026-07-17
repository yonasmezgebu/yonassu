const fs = require('fs');
const f = 'd:/SUTANA/frontend/src/pages/pharmacy/PharmacyStaff.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add handleUnassign function to PharmacyStaff component
const loadAllStr = `  useEffect(() => { loadAll(); }, [loadAll]);`;
const handleUnassignStr = `
  const handleUnassign = async (w) => {
    if (!window.confirm(\`Are you sure you want to unassign \${w.full_name}?\`)) return;
    try {
      await apiClient.delete('/users/' + w.id + '/roles/20');
      handleSuccess(\`\${w.full_name} unassigned successfully\`);
    } catch (err) {
      alert('Failed to unassign worker');
    }
  };
`;
if (!c.includes('handleUnassign = async')) {
  c = c.replace(loadAllStr, loadAllStr + handleUnassignStr);
}

// 2. Add state for editingWorker
const stateStr = `  const [selectedWorkerForTasks, setSelectedWorkerForTasks] = useState(null);`;
if (!c.includes('const [editingWorker, setEditingWorker]')) {
  c = c.replace(stateStr, stateStr + `\n  const [editingWorker, setEditingWorker] = useState(null);`);
}

// 3. Add UI buttons for Edit and Unassign
// Old: <button onClick={() => loadTasks(w)} ...>Manage Tasks</button>
// New: <div style={{display:'flex', gap: 6}}> <button onClick={loadTasks}>Tasks</button> <button onClick={edit}>Edit</button> <button onClick={unassign}>Unassign</button> </div>
const actionTdStr = `<td style={td}>
                        <button 
                          onClick={() => loadTasks(w)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#2563eb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                        >
                          Manage Tasks
                        </button>
                      </td>`;
const newActionTdStr = `<td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => loadTasks(w)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#2563eb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tasks</button>
                          <button onClick={() => setEditingWorker(w)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#0f766e', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleUnassign(w)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Unassign</button>
                        </div>
                      </td>`;
c = c.replace(actionTdStr, newActionTdStr);

// 4. Update AssignModal rendering to handle editingWorker
// Find: {showAssignModal && (
//         <AssignModal
const assignModalRenderStr = `{showAssignModal && (
        <AssignModal
          unassigned={unassigned}
          branches={branches}
          onClose={() => setShowAssignModal(false)}
          onRefresh={() => handleSuccess('Worker assigned successfully')}
        />
      )}`;
const newAssignModalRenderStr = `{(showAssignModal || editingWorker) && (
        <AssignModal
          unassigned={editingWorker ? [editingWorker] : unassigned}
          branches={branches}
          preSelectedWorker={editingWorker}
          onClose={() => { setShowAssignModal(false); setEditingWorker(null); }}
          onRefresh={() => handleSuccess(editingWorker ? 'Worker updated successfully' : 'Worker assigned successfully')}
        />
      )}`;
c = c.replace(assignModalRenderStr, newAssignModalRenderStr);

// 5. Update AssignModal definition to accept preSelectedWorker
const modalDefStr = `const AssignModal = ({ unassigned, branches, onClose, onRefresh }) => {`;
const newModalDefStr = `const AssignModal = ({ unassigned, branches, preSelectedWorker, onClose, onRefresh }) => {`;
c = c.replace(modalDefStr, newModalDefStr);

// 6. Pre-fill state in AssignModal
const modalStateStr = `  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSubRole, setSelectedSubRole] = useState('Worker');`;
const newModalStateStr = `  const [selectedUserId, setSelectedUserId] = useState(preSelectedWorker ? preSelectedWorker.id : '');
  const [selectedBranchId, setSelectedBranchId] = useState(preSelectedWorker ? (preSelectedWorker.branch_id || '') : '');
  const [selectedSubRole, setSelectedSubRole] = useState(preSelectedWorker ? (preSelectedWorker.sub_role || 'Worker') : 'Worker');`;
c = c.replace(modalStateStr, newModalStateStr);

// 7. Update Modal Title
const modalTitleStr = `<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Assign Pharmacy Worker</h2>`;
const newModalTitleStr = `<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{preSelectedWorker ? 'Edit Worker Role' : 'Assign Pharmacy Worker'}</h2>`;
c = c.replace(modalTitleStr, newModalTitleStr);

fs.writeFileSync(f, c, 'utf8');
console.log('PharmacyStaff.jsx updated successfully.');
