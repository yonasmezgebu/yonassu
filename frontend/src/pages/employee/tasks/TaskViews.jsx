import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { Clock, PlayCircle, CheckCircle, PlusCircle, AlertTriangle, MessageSquare, Download } from 'lucide-react';

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6'
};

// --- Shared Task Card Component ---
const TaskCard = ({ task, onStart, onComplete, onUpdate }) => {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>{task.task_number}</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>{task.title}</h3>
          <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px', maxWidth: '600px' }}>{task.description}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: `${priorityColors[task.priority]}15`, color: priorityColors[task.priority] }}>
            {task.priority} Priority
          </span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: task.status === 'overdue' ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Due: {task.deadline}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Status: <strong style={{ color: task.status === 'overdue' ? '#ef4444' : '#0f172a' }}>{task.status.replace('_', ' ')}</strong>
          </span>
          {task.status === 'in_progress' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
              <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${task.progress_pct}%`, backgroundColor: '#3b82f6' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{task.progress_pct}%</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.status === 'pending' && (
            <button onClick={() => onStart(task.id)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <PlayCircle size={16} /> Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <>
              <button onClick={() => onUpdate(task.id)} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <PlusCircle size={16} /> Update Progress
              </button>
              <button onClick={() => onComplete(task.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <CheckCircle size={16} /> Mark Complete
              </button>
            </>
          )}
          {task.status === 'completed' && (
             <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <CheckCircle size={16} /> Completed on {task.completed_at?.split('T')[0]}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Shared Layout ---
const PageHeader = ({ title, description, count }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {title} {count !== undefined && <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 10px', borderRadius: '20px', fontSize: '14px' }}>{count}</span>}
    </h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

// --- Task Update Modal ---
const ProgressModal = ({ task, onClose, onSave }) => {
  const [pct, setPct] = useState(task.progress_pct);
  const [note, setNote] = useState('');
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Update Progress: {task.task_number}</h3>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Progress (%)</label>
        <input type="number" min="0" max="100" value={pct} onChange={e => setPct(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '16px' }} />
        
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Note (optional)</label>
        <textarea rows="3" value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '24px', fontFamily: 'inherit' }} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={() => onSave(pct, note)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Update</button>
        </div>
      </div>
    </div>
  );
};


// --- The 4 Task Views ---

export const TodayTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [modalTask, setModalTask] = useState(null);

  const fetch = () => setTasks(employeePortalState.getTasksToday(SESSION_EMPLOYEE_ID));
  useEffect(() => {
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleStart = (id) => employeePortalState.updateTaskStatus(SESSION_EMPLOYEE_ID, id, 'start');
  const handleComplete = (id) => employeePortalState.updateTaskStatus(SESSION_EMPLOYEE_ID, id, 'complete');
  const handleUpdate = (pct, note) => {
    employeePortalState.addProgressNote(SESSION_EMPLOYEE_ID, modalTask.id, pct, note);
    setModalTask(null);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Today's Tasks" description="Tasks due today or currently in progress." count={tasks.length} />
      {tasks.length === 0 ? <p style={{ color: '#64748b' }}>No tasks for today. Excellent!</p> : tasks.map(t => (
        <TaskCard key={t.id} task={t} onStart={handleStart} onComplete={handleComplete} onUpdate={() => setModalTask(t)} />
      ))}
      {modalTask && <ProgressModal task={modalTask} onClose={() => setModalTask(null)} onSave={handleUpdate} />}
    </div>
  );
};

export const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [modalTask, setModalTask] = useState(null);

  const fetch = () => setTasks(employeePortalState.getAllTasks(SESSION_EMPLOYEE_ID).filter(t => t.status !== 'completed'));
  useEffect(() => {
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleStart = (id) => employeePortalState.updateTaskStatus(SESSION_EMPLOYEE_ID, id, 'start');
  const handleComplete = (id) => employeePortalState.updateTaskStatus(SESSION_EMPLOYEE_ID, id, 'complete');
  const handleUpdate = (pct, note) => {
    employeePortalState.addProgressNote(SESSION_EMPLOYEE_ID, modalTask.id, pct, note);
    setModalTask(null);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="My Active Tasks" description="All pending and active tasks assigned to you." count={tasks.length} />
      {tasks.length === 0 ? <p style={{ color: '#64748b' }}>No active tasks.</p> : tasks.map(t => (
        <TaskCard key={t.id} task={t} onStart={handleStart} onComplete={handleComplete} onUpdate={() => setModalTask(t)} />
      ))}
      {modalTask && <ProgressModal task={modalTask} onClose={() => setModalTask(null)} onSave={handleUpdate} />}
    </div>
  );
};

export const InProgressTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [modalTask, setModalTask] = useState(null);

  const fetch = () => setTasks(employeePortalState.getTasksInProgress(SESSION_EMPLOYEE_ID));
  useEffect(() => {
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleComplete = (id) => employeePortalState.updateTaskStatus(SESSION_EMPLOYEE_ID, id, 'complete');
  const handleUpdate = (pct, note) => {
    employeePortalState.addProgressNote(SESSION_EMPLOYEE_ID, modalTask.id, pct, note);
    setModalTask(null);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="In Progress" description="Tasks you are actively working on." count={tasks.length} />
      {tasks.length === 0 ? <p style={{ color: '#64748b' }}>You are not currently working on any tasks.</p> : tasks.map(t => (
        <TaskCard key={t.id} task={t} onStart={() => {}} onComplete={handleComplete} onUpdate={() => setModalTask(t)} />
      ))}
      {modalTask && <ProgressModal task={modalTask} onClose={() => setModalTask(null)} onSave={handleUpdate} />}
    </div>
  );
};

export const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);

  const fetch = () => setTasks(employeePortalState.getTasksCompleted(SESSION_EMPLOYEE_ID));
  useEffect(() => {
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Completed Tasks" description="Read-only history of completed assignments." count={tasks.length} />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Task #</th>
              <th>Title</th>
              <th>Completed Date</th>
              <th>Approval Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{t.task_number}</td>
                <td style={{ color: '#475569', fontSize: '14px' }}>{t.title}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{t.completed_at?.split('T')[0]}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                    backgroundColor: t.submission_status === 'approved' ? '#ecfdf5' : (t.submission_status === 'rejected' ? '#fef2f2' : '#f8fafc'),
                    color: t.submission_status === 'approved' ? '#10b981' : (t.submission_status === 'rejected' ? '#ef4444' : '#64748b')
                  }}>
                    {t.submission_status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No completed tasks yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
