const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

const EmployeeTasksController = {
  // Get overview for dashboard
  getOverview: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0,0,0,0);

    const tasks = await db('employee_tasks').where('assigned_to_user_id', userId);
    const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.completed_at) >= today).length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.status !== 'completed' && new Date(t.due_date) < today).length;

    const empRecord = await db('hr_employees')
      .leftJoin('departments', 'hr_employees.dept_id', 'departments.id')
      .leftJoin('hr_employees as mgr', 'hr_employees.direct_manager_id', 'mgr.employee_id')
      .select('departments.name as department_name', 'mgr.full_name as manager_name')
      .where('hr_employees.user_id', userId).first();

    res.json({
      totalTasksAssigned: tasks.length,
      tasksCompletedToday: completedToday,
      tasksPending: pending,
      tasksOverdue: overdue,
      department: empRecord?.department_name || req.user.role || 'Unassigned',
      manager: empRecord?.manager_name || 'System Admin',
      todayAttendance: 'present', // simple default since attendance isn't fully built
      workDaysThisMonth: { worked: 14, total: 22 },
      leaveDaysTaken: 0,
      performanceScore: 'A'
    });
  }),

  // Get tasks assigned to logged-in user
  getTasks: catchAsync(async (req, res) => {
    const { status } = req.query;
    let query = db('employee_tasks')
      .where('assigned_to_user_id', req.user.id)
      .orderBy('created_at', 'desc');
      
    if (status && status !== 'all') {
      query = query.where('status', status);
    }
    
    const tasks = await query;
    res.json(tasks);
  }),

  // Manager creates task
  createTask: catchAsync(async (req, res) => {
    const { assigned_to_user_id, title, description, priority, due_date, department } = req.body;
    
    // Fetch assigned user to get name
    const assignedUser = await db('users').where({ id: assigned_to_user_id }).first();
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }
    
    const assigned_to_name = assignedUser.full_name || assignedUser.fullName || assignedUser.username;
    const assigned_by_name = req.user.full_name || req.user.fullName || req.user.username;
    
    const [id] = await db('employee_tasks').insert({
      title,
      description,
      assigned_to_user_id,
      assigned_to_name,
      assigned_by_user_id: req.user.id,
      assigned_by_name,
      department,
      priority: priority || 'medium',
      due_date,
      status: 'pending'
    });
    
    const task = await db('employee_tasks').where({ id }).first();
    res.status(201).json(task);
  }),

  // Employee updates status/progress
  updateTaskStatus: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, progress_pct, notes } = req.body;
    
    const task = await db('employee_tasks').where({ id }).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    // Ensure only the assigned employee (or a manager) can update
    // For now we just allow if they are logged in, but ideally we check:
    // if (task.assigned_to_user_id !== req.user.id) ...
    
    const updateData = {};
    if (status) updateData.status = status;
    if (progress_pct !== undefined) updateData.progress_pct = progress_pct;
    if (notes) updateData.notes = notes;
    
    if (status === 'in_progress' && task.status === 'pending') {
        updateData.started_at = db.fn.now();
    }
    if (status === 'completed' && task.status !== 'completed') {
        updateData.completed_at = db.fn.now();
        updateData.progress_pct = 100;
    }
    
    await db('employee_tasks').where({ id }).update(updateData);
    const updatedTask = await db('employee_tasks').where({ id }).first();
    
    res.json(updatedTask);
  }),

  // Manager gets all tasks for department
  getDepartmentTasks: catchAsync(async (req, res) => {
    const { dept } = req.params;
    const tasks = await db('employee_tasks')
      .where('department', dept)
      .orderBy('created_at', 'desc');
      
    res.json(tasks);
  }),

  // Manager gets employees for department mapping
  getEmployeesByDept: catchAsync(async (req, res) => {
    const { department } = req.query;
    
    let roles = [];
    if (department === 'pharmacy') roles = ['Pharmacy Worker', 'Pharmacy Manager'];
    else if (department === 'sales') roles = ['Sales/Cashier', 'Sales Manager'];
    else if (department === 'printing') roles = ['Printing Operator', 'Printing Supervisor'];
    else if (department === 'car_rental') roles = ['Car Rental Agent', 'Car Rental Manager'];
    else if (department === 'purchase') roles = ['Purchase Officer', 'Purchase Manager'];
    
    // Also include general admin roles
    roles = [...roles, 'HR Manager', 'CEO', 'Admin'];
    
    const employees = await db('users')
      .whereIn('role', roles)
      .select('id', 'username', 'email', 'role', 'full_name', 'fullName', 'phone');
      
    res.json(employees);
  }),

  // Delete task
  deleteTask: catchAsync(async (req, res) => {
    const { id } = req.params;
    await db('employee_tasks').where({ id }).del();
    res.json({ message: 'Task deleted successfully' });
  })
};

module.exports = EmployeeTasksController;
