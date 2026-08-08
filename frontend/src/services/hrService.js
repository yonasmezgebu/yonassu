import apiClient from './apiClient';

const hrService = {
  // --- Legacy HR methods (old system, kept for backward compat) ---
  login: async (employeeId, password) =>
    apiClient.post('/hr/auth/login', { employeeId, password }),
  getSummary: async () =>
    apiClient.get('/hr/summary'),
  getEmployees: async (params) =>
    apiClient.get('/hr/employees', { params }),
  getEmployeeById: async (id) =>
    apiClient.get(`/hr/employees/${id}`),
  createEmployee: async (data) =>
    apiClient.post('/hr/employees', data),
  updateEmployee: async (id, data) =>
    apiClient.put(`/hr/employees/${id}`, data),
  clockIn: async (employeeId, computerId) =>
    apiClient.post('/hr/clock-in', { employeeId, computerId }),
  clockOut: async (employeeId, computerId) =>
    apiClient.post('/hr/clock-out', { employeeId, computerId }),
  getMyAttendance: async (employeeId) =>
    apiClient.get('/hr/my-attendance', { params: { employeeId } }),
  getMonthlyAttendance: async (employeeId, month) =>
    apiClient.get(`/hr/attendance/monthly/${employeeId}`, { params: { month } }),
  getDailyAttendances: async (date) =>
    apiClient.get('/hr/attendance/daily', { params: { date } }),
  getComputers: async () =>
    apiClient.get('/hr/computers'),
  registerComputer: async (data) =>
    apiClient.post('/hr/computers', data),
  createLeaveRequest: async (data) =>
    apiClient.post('/hr/leaves', data),
  getLeaveRequests: async (params) =>
    apiClient.get('/hr/leaves', { params }),
  reviewLeave: async (id, approved, rejectionReason) =>
    apiClient.post(`/hr/leaves/${id}/review`, { approved, rejectionReason }),
  calculatePayroll: async (month) =>
    apiClient.post('/hr/payroll/calculate', { month }),
  getPayroll: async (month) =>
    apiClient.get(`/hr/payroll/${month}`),
  sendPayrollToFinance: async (month) =>
    apiClient.post(`/hr/payroll/${month}/send`),
  approvePayrollFinance: async (month) =>
    apiClient.post(`/hr/payroll/${month}/approve`),
  markPayrollPaid: async (month, paymentMethod) =>
    apiClient.post(`/hr/payroll/${month}/pay`, { paymentMethod }),
  getManagerAccuracy: async () =>
    apiClient.get('/hr/manager-accuracy'),

  // ---- NEW HR DASHBOARD ENDPOINTS ----
  getTodayActivities: async () => apiClient.get('/hr/activities/today'),
  getDepartmentsDashboard: async () => apiClient.get('/hr/departments'),
  createDepartmentDashboard: async (data) => apiClient.post('/hr/departments', data),
  updateDepartmentDashboard: async (id, data) => apiClient.put(`/hr/departments/${id}`, data),
  updateEmployeeStatus: async (id, status) => apiClient.put(`/hr/employees/${id}/status`, { status }),
  getAttendanceHistory: async (params) => apiClient.get('/hr/attendance/history', { params }),
  getAbsences: async (params) => apiClient.get('/hr/absences', { params }),
  createAbsence: async (data) => apiClient.post('/hr/absences', data),
  rejectLeaveDashboard: async (id, reason) => apiClient.put(`/hr/leaves/${id}/reject`, { reason }),
  getReports: async (params) => apiClient.get('/hr/reports', { params }),
  getExportUrl: (module) => `${apiClient.defaults.baseURL}/hr/export/${module}`,

  // ---- EXTENDED HR DASHBOARD ROUTES (Menus 12-22) ----
  // Payroll
  getSalaries: async (params) => apiClient.get('/hr/payroll/salaries', { params }),
  updateSalary: async (id, data) => apiClient.put(`/hr/payroll/salaries/${id}`, data),
  getPayrollPeriods: async () => apiClient.get('/hr/payroll/periods'),
  processPayrollDash: async (data) => apiClient.post('/hr/payroll/process', data),
  approvePayrollProcess: async (id) => apiClient.put(`/hr/payroll/${id}/approve`),
  finalizePayrollProcess: async (id) => apiClient.put(`/hr/payroll/${id}/finalize`),
  getDeductions: async (params) => apiClient.get('/hr/payroll/deductions', { params }),
  createDeduction: async (data) => apiClient.post('/hr/payroll/deductions', data),
  updateDeduction: async (id, data) => apiClient.put(`/hr/payroll/deductions/${id}`, data),
  deleteDeduction: async (id) => apiClient.delete(`/hr/payroll/deductions/${id}`),
  getPayslips: async (params) => apiClient.get('/hr/payroll/payslips', { params }),
  generatePayslips: async (data) => apiClient.post('/hr/payroll/payslips/generate', data),
  getPayslipPdfUrl: (id) => `${apiClient.defaults.baseURL}/hr/payroll/payslips/${id}/pdf`,
  emailPayslip: async (id) => apiClient.post(`/hr/payroll/payslips/${id}/email`),

  // Recruitment
  getJobPosts: async (params) => apiClient.get('/hr/recruitment/jobs', { params }),
  createJobPost: async (data) => apiClient.post('/hr/recruitment/jobs', data),
  updateJobPost: async (id, data) => apiClient.put(`/hr/recruitment/jobs/${id}`, data),
  getApplications: async (params) => apiClient.get('/hr/recruitment/applications', { params }),
  updateApplicationStatus: async (id, data) => apiClient.put(`/hr/recruitment/applications/${id}/status`, data),
  getInterviews: async (params) => apiClient.get('/hr/recruitment/interviews', { params }),
  createInterview: async (data) => apiClient.post('/hr/recruitment/interviews', data),
  updateInterview: async (id, data) => apiClient.put(`/hr/recruitment/interviews/${id}`, data),
  getRecruitmentPipeline: async (params) => apiClient.get('/hr/recruitment/pipeline', { params }),
  hireCandidate: async (applicationId) => apiClient.post(`/hr/recruitment/hire/${applicationId}`),

  // Performance
  getEvaluations: async (params) => apiClient.get('/hr/performance/evaluations', { params }),
  createEvaluation: async (data) => apiClient.post('/hr/performance/evaluations', data),
  getReviews: async (params) => apiClient.get('/hr/performance/reviews', { params }),
  approveReview: async (id) => apiClient.put(`/hr/performance/reviews/${id}/approve`),
  getFeedback: async (params) => apiClient.get('/hr/performance/feedback', { params }),
  submitFeedback: async (data) => apiClient.post('/hr/performance/feedback', data),
  acknowledgeFeedback: async (id) => apiClient.put(`/hr/performance/feedback/${id}/acknowledge`),

  // ---- FINAL HR DASHBOARD ROUTES (Menus 23-28) ----
  // Contracts
  getContracts: async (params) => apiClient.get('/hr/contracts', { params }),
  createContract: async (data) => apiClient.post('/hr/contracts', data),
  approveContract: async (id) => apiClient.put(`/hr/contracts/${id}/approve`),
  renewContract: async (id, data) => apiClient.put(`/hr/contracts/${id}/renew`, data),
  terminateContract: async (id, data) => apiClient.put(`/hr/contracts/${id}/terminate`, data),
  getContractDocumentUrl: (id) => `${apiClient.defaults.baseURL}/hr/contracts/${id}/document`,

  // Files
  getEmployeeFiles: async (params) => apiClient.get('/hr/files', { params }),
  uploadEmployeeFile: async (data) => apiClient.post('/hr/files/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' } // Adjust if mocking vs real upload
  }),
  downloadEmployeeFileUrl: (id) => `${apiClient.defaults.baseURL}/hr/files/${id}/download`,
  deleteEmployeeFile: async (id) => apiClient.delete(`/hr/files/${id}`),
  archiveEmployeeFile: async (id) => apiClient.put(`/hr/files/${id}/archive`),

  // Policies
  getPolicies: async (params) => apiClient.get('/hr/policies', { params }),
  createPolicy: async (data) => apiClient.post('/hr/policies', data),
  updatePolicy: async (id, data) => apiClient.put(`/hr/policies/${id}`, data),
  publishPolicy: async (id) => apiClient.put(`/hr/policies/${id}/publish`),
  archivePolicy: async (id) => apiClient.put(`/hr/policies/${id}/archive`),
  sendPolicyToAll: async (id) => apiClient.post(`/hr/policies/${id}/send-to-all`),
  acknowledgePolicy: async (id) => apiClient.post(`/hr/policies/${id}/acknowledge`),

  // Announcements
  getAnnouncements: async (params) => apiClient.get('/hr/announcements', { params }),
  createAnnouncement: async (data) => apiClient.post('/hr/announcements', data),
  updateAnnouncement: async (id, data) => apiClient.put(`/hr/announcements/${id}`, data),
  deleteAnnouncement: async (id) => apiClient.delete(`/hr/announcements/${id}`),
  retractAnnouncement: async (id) => apiClient.put(`/hr/announcements/${id}/retract`),
  readAnnouncement: async (id) => apiClient.post(`/hr/announcements/${id}/read`),

  // Internal Notices
  getNotices: async (params) => apiClient.get('/hr/notices', { params }),
  createNotice: async (data) => apiClient.post('/hr/notices', data),
  publishNotice: async (id) => apiClient.put(`/hr/notices/${id}/publish`),
  deleteNotice: async (id) => apiClient.delete(`/hr/notices/${id}`),

  // HR Messages
  getInboxMessages: async () => apiClient.get('/hr/messages/inbox'),
  getSentMessages: async () => apiClient.get('/hr/messages/sent'),
  sendMessage: async (data) => apiClient.post('/hr/messages/send', data),
  readMessage: async (id) => apiClient.put(`/hr/messages/${id}/read`),
  replyMessage: async (id, data) => apiClient.put(`/hr/messages/${id}/reply`, data),
  deleteMessage: async (id) => apiClient.delete(`/hr/messages/${id}`),


  // ========== NEW ETP HR Methods ==========
  etp: {
    // Overview
    getOverview: () => apiClient.get('/hr/etp/overview'),

    // Departments
    getDepartments: () => apiClient.get('/hr/etp/departments'),

    // Positions
    getPositions: () => apiClient.get('/hr/etp/positions'),

    // Employees
    listEmployees: (params) => apiClient.get('/hr/etp/employees', { params }),
    getEmployee: (id) => apiClient.get(`/hr/etp/employees/${id}`),
    createEmployee: (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '' && !(v instanceof File)) {
          fd.append(k, v);
        }
      });
      if (data.id_photo_front instanceof File) fd.append('id_photo_front', data.id_photo_front);
      if (data.id_photo_back  instanceof File) fd.append('id_photo_back',  data.id_photo_back);
      if (data.document_file  instanceof File) fd.append('document_file',  data.document_file);
      return apiClient.post('/hr/etp/employees', fd);
    },
    updateEmployee: (id, data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined && !(v instanceof File)) {
          fd.append(k, v);
        }
      });
      if (data.id_photo_front instanceof File) fd.append('id_photo_front', data.id_photo_front);
      if (data.id_photo_back  instanceof File) fd.append('id_photo_back',  data.id_photo_back);
      if (data.document_file  instanceof File) fd.append('document_file',  data.document_file);
      return apiClient.put(`/hr/etp/employees/${id}`, fd);
    },
    terminateEmployee: (id, data) => apiClient.patch(`/hr/etp/employees/${id}/terminate`, data),
    completeRegistration: (id) => apiClient.patch(`/hr/etp/employees/${id}/complete-registration`),

    // Attendance
    getDailyAttendance: (date) => apiClient.get('/hr/etp/attendance/daily', { params: { date } }),
    getMonthlyAttendance: (params) => apiClient.get('/hr/etp/attendance/monthly', { params }),
    calculateDailyAttendance: () => apiClient.post('/hr/etp/attendance/calculate-daily'),
    getWeeklySummary: () => apiClient.get('/hr/etp/attendance/weekly'),

    // Manual entry
    submitManualEntry: (data) => apiClient.post('/hr/etp/manual-entry', data),

    // Payroll
    getPayrollSummary: (month, year) => apiClient.get(`/hr/etp/payroll/summary/${month}/${year}`),
    calculatePayroll: (data) => apiClient.post('/hr/etp/payroll/calculate', data),
    approvePayroll: (data) => apiClient.post('/hr/etp/payroll/approve', data),
    markPayrollPaid: (data) => apiClient.post('/hr/etp/payroll/mark-paid', data),

    // Leaves
    getLeaves: (params) => apiClient.get('/hr/etp/leaves', { params }),
    createLeave: (data) => apiClient.post('/hr/etp/leaves', data),
    reviewLeave: (id, data) => apiClient.post(`/hr/etp/leaves/${id}/review`, data),

    // Employee Self-Service
    getMyProfile: () => apiClient.get('/hr/etp/my-profile'),
    getMyAttendancePortal: () => apiClient.get('/hr/etp/my-attendance'),
    getMyLeaves: () => apiClient.get('/hr/etp/my-leaves'),
    getMyDocuments: () => apiClient.get('/hr/etp/my-documents'),

    // Notifications
    getNotifications: (params) => apiClient.get('/hr/etp/notifications', { params }),
    acknowledgeNotification: (id) => apiClient.patch(`/hr/etp/notifications/${id}`),
  },
};

export default hrService;
