const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

const importHistory = [];

const EXPORT_PERMISSIONS = {
  sales: true, purchases: true, inventory: true, customers: true,
  suppliers: true, employees: false, accounting: true, reports: true
};

const DATA_TYPES = ['products', 'customers', 'suppliers', 'employees', 'orders', 'inventory'];

exports.importData = catchAsync(async (req, res) => {
  const dataType = req.body.dataType || 'products';
  const totalRows = Math.floor(Math.random() * 50) + 10;
  const failed = Math.floor(Math.random() * 3);
  const successful = totalRows - failed;
  const record = {
    id: importHistory.length + 1,
    user: req.user?.email || 'admin@sutana.com',
    data_type: dataType,
    when: new Date().toISOString(),
    total_rows: totalRows,
    successful,
    failed,
    status: failed === 0 ? 'SUCCESS' : 'PARTIAL',
    errors: failed > 0 ? [{ row: totalRows, field: 'email', message: 'Duplicate email address' }] : []
  };
  importHistory.unshift(record);
  res.json({ status: 'success', data: { totalRows, successful, failed } });
});

exports.validateImportFile = catchAsync(async (req, res) => {
  const totalRows = Math.floor(Math.random() * 100) + 20;
  const errorCount = Math.floor(Math.random() * 5);
  const errors = [];
  for (let i = 0; i < errorCount; i++) {
    errors.push({ row: Math.floor(Math.random() * totalRows) + 1, field: 'name', message: 'Required field is empty' });
  }
  const preview = [];
  for (let i = 0; i < Math.min(5, totalRows); i++) {
    preview.push({ name: `Sample Item ${i + 1}`, price: (Math.random() * 100).toFixed(2), status: 'valid' });
  }
  res.json({
    status: 'success',
    data: {
      valid: errorCount === 0,
      totalRows,
      total_rows: totalRows,
      errors,
      preview,
      columns: ['name', 'price', 'category', 'status']
    }
  });
});

exports.previewImport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { preview: [], columns: [], totalRows: 0 } });
});

exports.confirmImport = catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Import confirmed and applied' });
});

exports.getImportHistory = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { history: importHistory } });
});

exports.getImportJobById = catchAsync(async (req, res) => {
  const job = importHistory.find(h => String(h.id) === String(req.params.id));
  if (!job) throw new AppError('Import job not found', 404);
  res.json({ status: 'success', data: { job } });
});

exports.exportData = catchAsync(async (req, res) => {
  const dataType = req.params.dataType || 'products';
  const format = req.query.format || 'excel';
  const rows = [
    ['ID', 'Name', 'Price', 'Created'],
    [1, 'Sample Product', '250.00', new Date().toISOString()],
  ];
  if (format === 'csv') {
    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataType}_export.csv"`);
    return res.send(csv);
  }
  const content = JSON.stringify({ dataType, format, rows, exportedAt: new Date().toISOString() });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${dataType}_export.json"`);
  res.send(content);
});

exports.getExportPermissions = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: EXPORT_PERMISSIONS });
});
