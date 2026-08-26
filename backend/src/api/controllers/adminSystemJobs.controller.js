const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// In-memory job store (jobs are ephemeral processes, not DB-stored in this schema)
const SYSTEM_JOBS = [
  { id: 1, name: 'Nightly Backup', description: 'Full database backup to cloud storage', type: 'Backup', status: 'SUCCESS', schedule: '0 2 * * *', last_run: new Date(Date.now() - 86400000).toISOString(), next_run: new Date(Date.now() + 86400000).toISOString() },
  { id: 2, name: 'Notification Dispatcher', description: 'Send queued email/SMS notifications', type: 'Notification', status: 'RUNNING', schedule: '*/5 * * * *', last_run: new Date(Date.now() - 300000).toISOString(), next_run: new Date(Date.now() + 300000).toISOString() },
  { id: 3, name: 'Inventory Sync', description: 'Sync pharmacy inventory with POS', type: 'Data Sync', status: 'SUCCESS', schedule: '0 */6 * * *', last_run: new Date(Date.now() - 21600000).toISOString(), next_run: new Date(Date.now() + 21600000).toISOString() },
  { id: 4, name: 'Monthly Payroll Report', description: 'Generate payroll summary for all employees', type: 'Report Generation', status: 'PAUSED', schedule: '0 8 1 * *', last_run: new Date(Date.now() - 2592000000).toISOString(), next_run: null },
  { id: 5, name: 'Expiry Alert Scanner', description: 'Scan pharmacy stock for expiring medications', type: 'Health Check', status: 'SUCCESS', schedule: '0 6 * * *', last_run: new Date(Date.now() - 43200000).toISOString(), next_run: new Date(Date.now() + 43200000).toISOString() },
  { id: 6, name: 'Audit Log Cleanup', description: 'Archive audit logs older than 90 days', type: 'Data Cleanup', status: 'FAILED', schedule: '0 3 * * 0', last_run: new Date(Date.now() - 86400000).toISOString(), next_run: new Date(Date.now() + 518400000).toISOString(), error: 'Connection timeout to archive storage' },
  { id: 7, name: 'File Processing Queue', description: 'Process uploaded documents and attachments', type: 'File Processing', status: 'SUCCESS', schedule: '*/15 * * * *', last_run: new Date(Date.now() - 600000).toISOString(), next_run: new Date(Date.now() + 300000).toISOString() },
  { id: 8, name: 'Daily Reminder Sender', description: 'Send task reminders to assigned employees', type: 'Scheduled Reminder', status: 'SUCCESS', schedule: '0 8 * * 1-5', last_run: new Date(Date.now() - 3600000).toISOString(), next_run: new Date(Date.now() + 82800000).toISOString() },
];

const jobHistory = {};
SYSTEM_JOBS.forEach(j => {
  jobHistory[j.id] = [
    { id: `${j.id}-1`, started_at: j.last_run, finished_at: new Date(new Date(j.last_run).getTime() + 15000).toISOString(), duration: '15s', status: 'SUCCESS' },
    { id: `${j.id}-2`, started_at: new Date(new Date(j.last_run).getTime() - 86400000).toISOString(), finished_at: new Date(new Date(j.last_run).getTime() - 86400000 + 12000).toISOString(), duration: '12s', status: 'SUCCESS' },
  ];
});

exports.getSystemJobs = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { jobs: SYSTEM_JOBS } });
});

exports.getSystemJobById = catchAsync(async (req, res) => {
  const job = SYSTEM_JOBS.find(j => j.id === parseInt(req.params.id));
  if (!job) throw new AppError('Job not found', 404);
  res.json({ status: 'success', data: { job } });
});

exports.retrySystemJob = catchAsync(async (req, res) => {
  const job = SYSTEM_JOBS.find(j => j.id === parseInt(req.params.id));
  if (!job) throw new AppError('Job not found', 404);
  job.status = 'RUNNING';
  job.last_run = new Date().toISOString();
  job.error = null;
  setTimeout(() => { job.status = 'SUCCESS'; }, 2000);
  res.json({ status: 'success', message: 'Job retry initiated' });
});

exports.pauseSystemJob = catchAsync(async (req, res) => {
  const job = SYSTEM_JOBS.find(j => j.id === parseInt(req.params.id));
  if (!job) throw new AppError('Job not found', 404);
  job.status = 'PAUSED';
  job.next_run = null;
  res.json({ status: 'success', message: 'Job paused' });
});

exports.resumeSystemJob = catchAsync(async (req, res) => {
  const job = SYSTEM_JOBS.find(j => j.id === parseInt(req.params.id));
  if (!job) throw new AppError('Job not found', 404);
  job.status = 'SUCCESS';
  job.next_run = new Date(Date.now() + 3600000).toISOString();
  res.json({ status: 'success', message: 'Job resumed' });
});

exports.getSystemJobHistory = catchAsync(async (req, res) => {
  const history = jobHistory[parseInt(req.params.id)] || [];
  res.json({ status: 'success', data: { history } });
});

exports.updateSystemJobSchedule = catchAsync(async (req, res) => {
  const job = SYSTEM_JOBS.find(j => j.id === parseInt(req.params.id));
  if (!job) throw new AppError('Job not found', 404);
  job.schedule = req.body.schedule || job.schedule;
  res.json({ status: 'success', message: 'Schedule updated' });
});
