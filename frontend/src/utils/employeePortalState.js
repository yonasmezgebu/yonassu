let soundTimeout = null;
const playSound = (type) => {
  if (typeof window === 'undefined') return;
  if (soundTimeout) clearTimeout(soundTimeout);
  soundTimeout = setTimeout(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = type === 'success' ? 'sine' : 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 523.25 : 440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }, 300);
};

export const notificationService = {
  showToast: (message, type = 'info') => {
    playSound(type);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
};

// Mock session employee ID - in a real app this comes from JWT/Context
export const SESSION_EMPLOYEE_ID = 'EMP-001';

class EmployeePortalState extends EventTarget {
  constructor() {
    super();
    this._loadState();
  }

  _loadState() {
    const stored = localStorage.getItem('sutana_employee_portal_v2');
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this._seedData();
    }
  }

  _saveState() {
    localStorage.setItem('sutana_employee_portal_v2', JSON.stringify(this.data));
    this.dispatchEvent(new Event('change'));
  }

  _seedData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    this.data = {
      employees: [
        { id: 'EMP-001', name: 'John Doe', department_id: 'DEPT-IT', manager_id: 'MGR-001', job_title: 'Software Engineer', hire_date: '2023-01-15' },
        { id: 'EMP-002', name: 'Jane Smith', department_id: 'DEPT-HR', manager_id: 'MGR-002', job_title: 'HR Specialist', hire_date: '2022-06-01' }
      ],
      tasks: [
        { id: 'TSK-1001', task_number: 'TSK-1001', title: 'Update Dashboard UI', description: 'Implement new layout components.', department_id: 'DEPT-IT', assigned_to: 'EMP-001', assigned_by: 'MGR-001', priority: 'high', deadline: today, status: 'pending', progress_pct: 0, started_at: null, completed_at: null, created_at: yesterday },
        { id: 'TSK-1002', task_number: 'TSK-1002', title: 'Write Tests for API', description: 'Coverage needs to be 80%.', department_id: 'DEPT-IT', assigned_to: 'EMP-001', assigned_by: 'MGR-001', priority: 'medium', deadline: tomorrow, status: 'in_progress', progress_pct: 40, started_at: today, completed_at: null, created_at: yesterday },
        { id: 'TSK-1003', task_number: 'TSK-1003', title: 'Optimize Database Queries', description: 'Review slow queries in postgres.', department_id: 'DEPT-IT', assigned_to: 'EMP-001', assigned_by: 'MGR-001', priority: 'low', deadline: yesterday, status: 'pending', progress_pct: 0, started_at: null, completed_at: null, created_at: '2024-01-01' }, // Overdue
        { id: 'TSK-1004', task_number: 'TSK-1004', title: 'Server Maintenance', description: 'Monthly reboot.', department_id: 'DEPT-IT', assigned_to: 'EMP-001', assigned_by: 'system', priority: 'high', deadline: yesterday, status: 'completed', progress_pct: 100, started_at: yesterday, completed_at: yesterday, created_at: yesterday },
        { id: 'TSK-1005', task_number: 'TSK-1005', title: 'HR Policy Update', description: 'Draft 2024 handbook.', department_id: 'DEPT-HR', assigned_to: 'EMP-002', assigned_by: 'MGR-002', priority: 'medium', deadline: tomorrow, status: 'pending', progress_pct: 0, started_at: null, completed_at: null, created_at: yesterday }
      ],
      taskProgressNotes: [
        { id: 'N-1', task_id: 'TSK-1002', note: 'Started writing unit tests for auth module.', progress_pct_at_time: 40, created_at: new Date().toISOString() }
      ],
      workSubmissions: [
        { id: 'WS-1', submission_number: 'WS-0001', task_id: 'TSK-1004', employee_id: 'EMP-001', description: 'Maintenance complete.', attachments: [], duration_value: 2, duration_unit: 'hours', notes: 'No issues.', status: 'approved', reviewed_by: 'MGR-001', reviewed_at: `${yesterday}T17:00:00.000Z`, feedback: 'Good job', submitted_at: `${yesterday}T16:30:00.000Z` }
      ],
      dailyReports: [
        { id: 'DR-1', employee_id: 'EMP-001', report_date: yesterday, tasks_completed_count: 1, tasks_in_progress_count: 1, issues_challenges: 'None', planned_tomorrow: 'Finish UI', additional_notes: '', submitted_at: `${yesterday}T17:30:00.000Z` }
      ],
      attendanceRecords: [
        { id: 'ATT-1', employee_id: 'EMP-001', date: yesterday, check_in_at: `${yesterday}T09:00:00.000Z`, check_out_at: `${yesterday}T17:00:00.000Z`, breaks: [], status: 'present' },
        { id: 'ATT-2', employee_id: 'EMP-001', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], check_in_at: null, check_out_at: null, breaks: [], status: 'absent' },
        { id: 'ATT-3', employee_id: 'EMP-001', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], check_in_at: null, check_out_at: null, breaks: [], status: 'on_leave' }
      ],
      leaveRequests: [
        { id: 'LR-1', employee_id: 'EMP-001', leave_type: 'sick', start_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], end_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], reason: 'Flu', status: 'approved', requested_at: '2024-01-01' }
      ],
      leaveBalances: [
        { employee_id: 'EMP-001', leave_type: 'annual', days_allocated: 20, days_used: 5, updated_at: today },
        { employee_id: 'EMP-001', leave_type: 'sick', days_allocated: 10, days_used: 1, updated_at: today }
      ],
      notifications: [
        { id: 'NOT-1', employee_id: 'EMP-001', type: 'task_assigned', title: 'New Task', body: 'Update Dashboard UI has been assigned.', related_entity_type: 'Task', related_entity_id: 'TSK-1001', is_read: false, created_at: today }
      ],
      assignedMaterials: [
        { id: 'AM-1', item_name: 'MacBook Pro M2', category: 'electronics', quantity: 1, employee_id: 'EMP-001', assigned_by: 'MGR-001', assigned_date: '2023-01-20', condition_at_assignment: 'new', return_by_date: null, status: 'active', photos: [] },
        { id: 'AM-2', item_name: 'Office Chair', category: 'furniture', quantity: 1, employee_id: 'EMP-001', assigned_by: 'MGR-002', assigned_date: '2023-02-01', condition_at_assignment: 'good', return_by_date: null, status: 'active', photos: [] },
        { id: 'AM-3', item_name: 'Loaner iPad', category: 'electronics', quantity: 1, employee_id: 'EMP-001', assigned_by: 'MGR-001', assigned_date: yesterday, condition_at_assignment: 'good', return_by_date: yesterday, status: 'active', photos: [] } // Overdue
      ],
      materialRequests: [
        { id: 'MR-1', request_number: 'REQ-1001', employee_id: 'EMP-001', item_name: 'Ergonomic Mouse', category: 'electronics', quantity_required: 1, purpose: 'Wrist pain', required_date: tomorrow, urgency: 'normal', additional_notes: '', status: 'pending', decided_by: null, decided_at: null, submitted_at: today },
        { id: 'MR-2', request_number: 'REQ-1002', employee_id: 'EMP-001', item_name: 'Notepad', category: 'office_supplies', quantity_required: 5, purpose: 'Meeting notes', required_date: today, urgency: 'normal', additional_notes: '', status: 'approved', decided_by: 'MGR-002', decided_at: yesterday, submitted_at: yesterday }
      ],
      materialReturns: [
        { id: 'RET-1', return_number: 'RET-1001', assigned_material_id: 'AM-2', employee_id: 'EMP-001', quantity_returned: 1, condition: 'damaged', return_date: today, notes: 'Wheel broke', photos: ['chair_wheel.jpg'], status: 'pending', reviewed_by: null, reviewed_at: null, submitted_at: today }
      ],
      messages: [
        { id: 'MSG-1', thread_id: 'TH-1', sender_id: 'MGR-001', sender_type: 'manager', recipient_id: 'EMP-001', subject: 'Project Kickoff', body: 'Let us meet tomorrow.', attachments: [], is_read: false, sent_at: yesterday, deleted_by_sender: false, deleted_by_recipient: false },
        { id: 'MSG-2', thread_id: 'TH-1', sender_id: 'EMP-001', sender_type: 'employee', recipient_id: 'MGR-001', subject: 'Re: Project Kickoff', body: 'Sounds good. I will prepare the slides.', attachments: [], is_read: true, sent_at: today, deleted_by_sender: false, deleted_by_recipient: false }
      ],
      supervisorNotes: [
        { id: 'SN-1', note_number: 'SN-1001', employee_id: 'EMP-001', authored_by: 'MGR-001', subject: 'Great presentation', content: 'The client loved the new design.', priority: 'normal', action_required: false, is_read: false, acknowledged_at: null, created_at: yesterday },
        { id: 'SN-2', note_number: 'SN-1002', employee_id: 'EMP-001', authored_by: 'MGR-001', subject: 'Compliance Training Overdue', content: 'Please complete your security training immediately.', priority: 'urgent', action_required: true, is_read: true, acknowledged_at: yesterday, created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
      ],
      announcements: [
        { id: 'ANN-1', title: 'Q3 Townhall', content: 'Join us for the Q3 review in the main hall.', posted_by: 'CEO', scope: 'company', department_id: null, importance: 'important', publish_date: yesterday, expiry_date: tomorrow, created_at: yesterday },
        { id: 'ANN-2', title: 'IT Dept Meeting', content: 'Monthly sync for all IT staff.', posted_by: 'IT Lead', scope: 'department', department_id: 'DEPT-IT', importance: 'normal', publish_date: today, expiry_date: tomorrow, created_at: today },
        { id: 'ANN-3', title: 'Expired Alert', content: 'This should not show up.', posted_by: 'HR', scope: 'company', department_id: null, importance: 'normal', publish_date: '2020-01-01', expiry_date: '2020-01-02', created_at: '2020-01-01' }
      ],
      announcementReadReceipts: [
        { id: 'ARR-1', announcement_id: 'ANN-1', employee_id: 'EMP-001', read_at: yesterday }
      ]
    };
    this._saveState();
  }

  subscribe(listener) {
    const callback = () => listener();
    this.addEventListener('change', callback);
    return () => this.removeEventListener('change', callback);
  }

  // --- Utility & Scoping ---
  _enforceOwnership(employeeId) {
    if (employeeId !== SESSION_EMPLOYEE_ID) {
      throw new Error(`404: Not Found (Access Denied for ID ${employeeId})`);
    }
  }

  _computeTaskState(t) {
    const now = new Date().toISOString().split('T')[0];
    const isOverdue = t.deadline < now && t.status !== 'completed';
    return { ...t, status: isOverdue ? 'overdue' : t.status };
  }

  // --- Notifications ---
  notifyEmployee(employeeId, type, payload) {
    if (employeeId !== SESSION_EMPLOYEE_ID) return; // Silent if not for logged in user

    const notification = {
      id: `NOT-${Date.now()}`,
      employee_id: employeeId,
      type,
      title: payload.title || 'Notification',
      body: payload.body || '',
      related_entity_type: payload.entityType || null,
      related_entity_id: payload.entityId || null,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.unshift(notification);
    this._saveState();

    // Browser toast integration
    notificationService.showToast(notification.title, 'info');
  }

  getNotifications(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.notifications.filter(n => n.employee_id === employeeId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  markNotificationRead(employeeId, notifId) {
    this._enforceOwnership(employeeId);
    const n = this.data.notifications.find(x => x.id === notifId && x.employee_id === employeeId);
    if (n) {
      n.is_read = true;
      this._saveState();
    }
  }

  markAllNotificationsRead(employeeId) {
    this._enforceOwnership(employeeId);
    this.data.notifications.forEach(n => {
      if (n.employee_id === employeeId) n.is_read = true;
    });
    this._saveState();
  }

  clearNotifications(employeeId) {
    this._enforceOwnership(employeeId);
    // Soft delete/archive simulated by removing from active array
    this.data.notifications = this.data.notifications.filter(n => n.employee_id !== employeeId);
    this._saveState();
  }

  // --- Dashboard Summary ---
  getDashboardSummary(employeeId) {
    this._enforceOwnership(employeeId);
    const employee = this.data.employees.find(e => e.id === employeeId);
    if (!employee) throw new Error("404: Employee not found");

    const myTasks = this.data.tasks.filter(t => t.assigned_to === employeeId).map(t => this._computeTaskState(t));
    const today = new Date().toISOString().split('T')[0];

    const todayAttendance = this.data.attendanceRecords.find(a => a.employee_id === employeeId && a.date === today);

    // Naive count for "this month"
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const workedThisMonth = this.data.attendanceRecords.filter(a => a.employee_id === employeeId && a.status === 'present' && a.date.startsWith(thisMonth)).length;

    const leaveUsed = this.data.leaveBalances.filter(b => b.employee_id === employeeId).reduce((sum, b) => sum + b.days_used, 0);

    return {
      date: today,
      totalTasksAssigned: myTasks.length,
      tasksCompletedToday: myTasks.filter(t => t.status === 'completed' && t.completed_at && t.completed_at.startsWith(today)).length,
      tasksPending: myTasks.filter(t => t.status === 'pending').length,
      tasksOverdue: myTasks.filter(t => t.status === 'overdue').length,
      todayAttendance: todayAttendance ? (todayAttendance.check_in_at ? 'present' : todayAttendance.status) : 'not_marked',
      department: employee.department_id,
      manager: employee.manager_id,
      workDaysThisMonth: { worked: workedThisMonth, total: 22 }, // Assuming ~22 working days
      leaveDaysTaken: leaveUsed,
      performanceScore: null // "Return null unless there's a real defined source"
    };
  }

  // --- Tasks ---
  getAllTasks(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.tasks.filter(t => t.assigned_to === employeeId).map(t => this._computeTaskState(t));
  }

  getTasksToday(employeeId) {
    const tasks = this.getAllTasks(employeeId);
    const today = new Date().toISOString().split('T')[0];
    // "deadline falls today OR status IN ('pending','in_progress') and were assigned for today"
    return tasks.filter(t => {
      const isDueToday = t.deadline === today;
      const isOpen = t.status === 'pending' || t.status === 'in_progress';
      return (isDueToday && isOpen) || (t.status === 'in_progress'); // Simplified filter logic
    }).sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority] || new Date(a.deadline) - new Date(b.deadline);
    });
  }

  getTasksInProgress(employeeId) {
    return this.getAllTasks(employeeId).filter(t => t.status === 'in_progress');
  }

  getTasksCompleted(employeeId) {
    return this.getAllTasks(employeeId).filter(t => t.status === 'completed').map(t => {
      // Find linked submission
      const sub = this.data.workSubmissions.find(w => w.task_id === t.id && w.employee_id === employeeId);
      return {
        ...t,
        submission_status: sub ? sub.status : 'no review required',
        approved_by: sub ? sub.reviewed_by : null
      };
    });
  }

  updateTaskStatus(employeeId, taskId, action) {
    this._enforceOwnership(employeeId);
    const task = this.data.tasks.find(t => t.id === taskId && t.assigned_to === employeeId);
    if (!task) throw new Error("404: Task not found");

    if (action === 'start' && task.status === 'pending') {
      task.status = 'in_progress';
      task.started_at = new Date().toISOString();
      notificationService.showToast("📝 Task Updated", 'info');
    } else if (action === 'complete' && (task.status === 'in_progress' || task.status === 'pending')) {
      task.status = 'completed';
      task.completed_at = new Date().toISOString();
      task.progress_pct = 100;
      notificationService.showToast("✅ Task Completed", 'success');
    }
    this._saveState();
  }

  addProgressNote(employeeId, taskId, pct, note) {
    this._enforceOwnership(employeeId);
    const task = this.data.tasks.find(t => t.id === taskId && t.assigned_to === employeeId);
    if (!task) throw new Error("404: Task not found");

    if (task.status !== 'in_progress') throw new Error("Task must be in progress to add notes.");

    task.progress_pct = pct;
    this.data.taskProgressNotes.push({
      id: `N-${Date.now()}`,
      task_id: taskId,
      note,
      progress_pct_at_time: pct,
      created_at: new Date().toISOString()
    });
    notificationService.showToast("⏳ Progress", 'info');
    this._saveState();
  }

  getTaskProgressNotes(taskId) {
    return this.data.taskProgressNotes.filter(n => n.task_id === taskId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // --- Work Submissions ---
  submitWork(employeeId, payload) {
    this._enforceOwnership(employeeId);
    // Validate task ownership
    const task = this.data.tasks.find(t => t.id === payload.task_id && t.assigned_to === employeeId);
    if (!task) throw new Error("404: Task not found");

    // Check if pending submission already exists
    const existing = this.data.workSubmissions.find(w => w.task_id === payload.task_id && w.employee_id === employeeId && w.status !== 'rejected');
    if (existing) throw new Error("Task already has an active submission.");

    const sub = {
      id: `WS-${Date.now()}`,
      submission_number: `WS-${Math.floor(Math.random()*10000)}`,
      task_id: payload.task_id,
      employee_id: employeeId,
      description: payload.description,
      attachments: payload.attachments || [],
      duration_value: payload.duration_value,
      duration_unit: payload.duration_unit,
      notes: payload.notes,
      status: 'pending_review',
      reviewed_by: null,
      reviewed_at: null,
      feedback: null,
      submitted_at: new Date().toISOString()
    };
    this.data.workSubmissions.push(sub);
    notificationService.showToast("📤 Work Submitted", 'info');
    this._saveState();
    return sub;
  }

  getWorkHistory(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.workSubmissions.filter(w => w.employee_id === employeeId).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }

  // --- Daily Reports ---
  getDailyReports(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.dailyReports.filter(d => d.employee_id === employeeId).sort((a,b) => new Date(b.report_date) - new Date(a.report_date));
  }

  submitDailyReport(employeeId, payload) {
    this._enforceOwnership(employeeId);
    const existing = this.data.dailyReports.find(d => d.employee_id === employeeId && d.report_date === payload.report_date);
    if (existing) {
      // Update instead of duplicate
      Object.assign(existing, payload);
      existing.submitted_at = new Date().toISOString();
    } else {
      this.data.dailyReports.push({
        id: `DR-${Date.now()}`,
        employee_id: employeeId,
        ...payload,
        submitted_at: new Date().toISOString()
      });
    }
    notificationService.showToast("📅 Report Sent", 'info');
    this._saveState();
  }

  // --- Attendance & Leave ---
  getAttendanceRecord(employeeId, dateStr) {
    this._enforceOwnership(employeeId);
    return this.data.attendanceRecords.find(a => a.employee_id === employeeId && a.date === dateStr);
  }

  getAllAttendance(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.attendanceRecords.filter(a => a.employee_id === employeeId).sort((a,b) => new Date(b.date) - new Date(a.date));
  }

  checkIn(employeeId) {
    this._enforceOwnership(employeeId);
    const today = new Date().toISOString().split('T')[0];
    let record = this.getAttendanceRecord(employeeId, today);
    if (record && record.check_in_at) {
      throw new Error("409: Already checked in today.");
    }
    if (!record) {
      record = { id: `ATT-${Date.now()}`, employee_id: employeeId, date: today, check_in_at: null, check_out_at: null, breaks: [], status: 'absent' };
      this.data.attendanceRecords.push(record);
    }
    record.check_in_at = new Date().toISOString();
    record.status = 'present';
    notificationService.showToast("📋 Attendance Check-In", 'info');
    this._saveState();
  }

  checkOut(employeeId) {
    this._enforceOwnership(employeeId);
    const today = new Date().toISOString().split('T')[0];
    let record = this.getAttendanceRecord(employeeId, today);
    if (!record || !record.check_in_at) {
      throw new Error("400: Cannot check out before checking in.");
    }
    if (record.check_out_at) throw new Error("Already checked out.");
    
    // Auto-close open breaks
    const openBreak = record.breaks.find(b => !b.end_at);
    if (openBreak) openBreak.end_at = new Date().toISOString();

    record.check_out_at = new Date().toISOString();
    notificationService.showToast("📋 Attendance Check-Out", 'info');
    this._saveState();
  }

  startBreak(employeeId) {
    this._enforceOwnership(employeeId);
    const today = new Date().toISOString().split('T')[0];
    let record = this.getAttendanceRecord(employeeId, today);
    if (!record || !record.check_in_at) throw new Error("Must check in first.");
    if (record.breaks.some(b => !b.end_at)) throw new Error("Already on break.");

    record.breaks.push({ start_at: new Date().toISOString(), end_at: null });
    this._saveState();
  }

  endBreak(employeeId) {
    this._enforceOwnership(employeeId);
    const today = new Date().toISOString().split('T')[0];
    let record = this.getAttendanceRecord(employeeId, today);
    if (!record) return;
    const openBreak = record.breaks.find(b => !b.end_at);
    if (!openBreak) throw new Error("No active break.");
    openBreak.end_at = new Date().toISOString();
    this._saveState();
  }

  requestLeave(employeeId, payload) {
    this._enforceOwnership(employeeId);
    this.data.leaveRequests.push({
      id: `LR-${Date.now()}`,
      employee_id: employeeId,
      ...payload,
      status: 'pending',
      requested_at: new Date().toISOString()
    });
    notificationService.showToast("🗓️ Leave Requested", 'info');
    this._saveState();
  }

  getLeaveBalances(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.leaveBalances.filter(b => b.employee_id === employeeId);
  }
  
  getLeaveRequests(employeeId) {
      this._enforceOwnership(employeeId);
      return this.data.leaveRequests.filter(r => r.employee_id === employeeId).sort((a,b) => new Date(b.requested_at) - new Date(a.requested_at));
  }

  // --- Assigned Materials ---
  _computeMaterialState(m) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = m.return_by_date && m.return_by_date < today && m.status !== 'returned';
    return { ...m, status: isOverdue ? 'overdue' : m.status };
  }

  getAssignedMaterials(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.assignedMaterials
      .filter(m => m.employee_id === employeeId)
      .map(m => this._computeMaterialState(m));
  }

  requestMaterials(employeeId, payload) {
    this._enforceOwnership(employeeId);
    this.data.materialRequests.push({
      id: `MR-${Date.now()}`,
      request_number: `REQ-${Math.floor(Math.random() * 10000)}`,
      employee_id: employeeId,
      ...payload,
      status: 'pending',
      decided_by: null,
      decided_at: null,
      submitted_at: new Date().toISOString()
    });
    this.notifyEmployee(employeeId, 'material_requested', { title: '📝 Request Submitted', body: 'Your material request is pending.' });
  }

  cancelMaterialRequest(employeeId, requestId) {
    this._enforceOwnership(employeeId);
    const req = this.data.materialRequests.find(r => r.id === requestId && r.employee_id === employeeId);
    if (!req) throw new Error("404: Request not found");
    if (req.status !== 'pending') throw new Error("Cannot cancel a request that is not pending.");
    req.status = 'cancelled';
    this._saveState();
  }

  getMaterialRequests(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.materialRequests.filter(r => r.employee_id === employeeId).sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }

  returnMaterial(employeeId, payload) {
    this._enforceOwnership(employeeId);
    const material = this.data.assignedMaterials.find(m => m.id === payload.assigned_material_id && m.employee_id === employeeId);
    if (!material) throw new Error("404: Material not found");

    const existingReturn = this.data.materialReturns.find(r => r.assigned_material_id === payload.assigned_material_id && r.status === 'pending');
    if (existingReturn) throw new Error("A return request for this material is already pending.");

    if ((payload.condition === 'damaged' || payload.condition === 'lost') && (!payload.photos || payload.photos.length === 0)) {
      throw new Error("400: Photo evidence is required for damaged or lost items.");
    }

    this.data.materialReturns.push({
      id: `RET-${Date.now()}`,
      return_number: `RET-${Math.floor(Math.random() * 10000)}`,
      employee_id: employeeId,
      ...payload,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      submitted_at: new Date().toISOString()
    });
    this.notifyEmployee(employeeId, 'material_returned', { title: '🔄 Return Submitted', body: 'Your return has been logged.' });
  }

  getMaterialReturns(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.materialReturns.filter(r => r.employee_id === employeeId).sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }

  // --- Messages ---
  getMessages(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.messages.filter(m => {
      if (m.sender_id === employeeId) return !m.deleted_by_sender;
      if (m.recipient_id === employeeId) return !m.deleted_by_recipient;
      return false;
    }).sort((a,b) => new Date(b.sent_at) - new Date(a.sent_at));
  }

  sendMessage(employeeId, payload) {
    this._enforceOwnership(employeeId);
    // Simple validation that recipient is a manager/supervisor
    if (!payload.recipient_id.startsWith('MGR-')) {
      throw new Error("403: You can only message your supervisor or manager.");
    }
    const msg = {
      id: `MSG-${Date.now()}`,
      thread_id: payload.thread_id || `TH-${Date.now()}`,
      sender_id: employeeId,
      sender_type: 'employee',
      ...payload,
      is_read: false,
      sent_at: new Date().toISOString(),
      deleted_by_sender: false,
      deleted_by_recipient: false
    };
    this.data.messages.push(msg);
    this._saveState();
  }

  deleteMessage(employeeId, messageId) {
    this._enforceOwnership(employeeId);
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) throw new Error("404: Message not found");
    if (msg.sender_id === employeeId) msg.deleted_by_sender = true;
    if (msg.recipient_id === employeeId) msg.deleted_by_recipient = true;
    this._saveState();
  }

  markMessageRead(employeeId, messageId) {
    this._enforceOwnership(employeeId);
    const msg = this.data.messages.find(m => m.id === messageId && m.recipient_id === employeeId);
    if (msg) {
      msg.is_read = true;
      this._saveState();
    }
  }

  // --- Supervisor Notes ---
  getSupervisorNotes(employeeId) {
    this._enforceOwnership(employeeId);
    return this.data.supervisorNotes.filter(n => n.employee_id === employeeId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }

  markSupervisorNoteRead(employeeId, noteId) {
    this._enforceOwnership(employeeId);
    const note = this.data.supervisorNotes.find(n => n.id === noteId && n.employee_id === employeeId);
    if (note && !note.is_read) {
      note.is_read = true;
      this._saveState();
    }
  }

  acknowledgeSupervisorNote(employeeId, noteId) {
    this._enforceOwnership(employeeId);
    const note = this.data.supervisorNotes.find(n => n.id === noteId && n.employee_id === employeeId);
    if (note) {
      note.acknowledged_at = new Date().toISOString();
      this._saveState();
    }
  }

  // --- Announcements ---
  getAnnouncements(employeeId) {
    this._enforceOwnership(employeeId);
    const employee = this.data.employees.find(e => e.id === employeeId);
    const today = new Date().toISOString().split('T')[0];

    const activeAnnouncements = this.data.announcements.filter(a => {
      const notExpired = !a.expiry_date || a.expiry_date >= today;
      const isScopeValid = a.scope === 'company' || (a.scope === 'department' && a.department_id === employee.department_id);
      return notExpired && isScopeValid;
    });

    return activeAnnouncements.map(a => {
      const receipt = this.data.announcementReadReceipts.find(r => r.announcement_id === a.id && r.employee_id === employeeId);
      return { ...a, is_read: !!receipt, read_at: receipt?.read_at };
    }).sort((a,b) => new Date(b.publish_date) - new Date(a.publish_date));
  }

  markAnnouncementRead(employeeId, announcementId) {
    this._enforceOwnership(employeeId);
    const existing = this.data.announcementReadReceipts.find(r => r.announcement_id === announcementId && r.employee_id === employeeId);
    if (!existing) {
      this.data.announcementReadReceipts.push({
        id: `ARR-${Date.now()}`,
        announcement_id: announcementId,
        employee_id: employeeId,
        read_at: new Date().toISOString()
      });
      this._saveState();
    }
  }
}

export const employeePortalState = new EmployeePortalState();
