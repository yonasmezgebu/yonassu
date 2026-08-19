const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

const EmployeeReportsController = {
  submitReport: catchAsync(async (req, res) => {
    const { report_text, document_url, document_name, department } = req.body;
    const user_id = req.user.id;
    const employee_name = req.user.full_name || req.user.fullName || req.user.username;

    const [id] = await db('employee_reports').insert({
      employee_id: user_id,
      employee_name,
      department: department || 'general',
      report_text,
      document_url,
      document_name
    });

    const report = await db('employee_reports').where({ id }).first();
    res.status(201).json(report);
  }),

  getDepartmentReports: catchAsync(async (req, res) => {
    const { dept } = req.params;
    const reports = await db('employee_reports')
      .where('department', dept)
      .orderBy('created_at', 'desc');
    res.json(reports);
  }),

  getMyReports: catchAsync(async (req, res) => {
    const reports = await db('employee_reports')
      .where('employee_id', req.user.id)
      .orderBy('created_at', 'desc');
    res.json(reports);
  })
};

module.exports = EmployeeReportsController;
