// Extended Mock State for Printing Supervisor Dashboard (26 Menus)
export const printingState = {
  jobs: [
    {
      id: 'JOB-000101', date: '2026-06-25', customerName: 'Abebe Kebede', customerPhone: '+251911234567',
      jobType: 'Business Cards', paperType: '300gsm Matte', paperSize: 'Standard 3.5x2', color: 'Full Color',
      quantity: 1000, pagesCopies: 1, bindingType: 'None', finishingOptions: ['Cutting', 'Laminating'],
      specialInstructions: 'Double sided', priority: 'Normal', deadline: '2026-07-02T17:00',
      totalCost: 1500, depositPaid: 500, balanceDue: 1000, status: 'Printing',
      assignedDesigner: 'Sara T.', startedDesignDate: '2026-06-25', designProgress: 100,
      machineAssigned: 'Press A', operator: 'Dawit M.', printStarted: '2026-06-28', printProgress: 45,
      estimatedPrintCompletion: '2026-06-29T10:00', orderId: 'ORD-1001',
      auditTrail: [
        { stage: 'Pending', timestamp: '2026-06-25T10:00:00Z', user: 'System' },
        { stage: 'Design', timestamp: '2026-06-25T14:00:00Z', user: 'Supervisor' },
        { stage: 'Prepress', timestamp: '2026-06-27T09:00:00Z', user: 'Designer' },
        { stage: 'Printing', timestamp: '2026-06-28T08:00:00Z', user: 'Supervisor' }
      ]
    }
  ],
  files: [
    { id: 'F-001', name: 'design_v1.pdf', jobId: 'JOB-000101', type: 'PDF', size: '2.4MB', uploader: 'Sara T.', date: '2026-06-26', status: 'Approved', version: 1, history: [] }
  ],
  designRequests: [],
  templates: [],
  machines: [
    { id: 'M-01', name: 'Press A', type: 'Offset', status: 'In Use', currentJob: 'JOB-000101' },
    { id: 'M-02', name: 'Press B', type: 'Offset', status: 'Available', currentJob: null }
  ],
  materials: [],
  materialUsage: [],
  reprintRequests: [],

  // New Entities (Menus 19-26)
  orders: [
    { id: 'ORD-1001', customerName: 'Abebe Kebede', contact: '+251911234567', date: '2026-06-25', items: 'Business Cards (1000)', type: 'Walk-in', totalAmount: 1500, depositPaid: 500, balanceDue: 1000, deliveryDate: '2026-07-02', status: 'In Progress', jobId: 'JOB-000101' },
    { id: 'ORD-1002', customerName: 'XYZ Corp', contact: 'hello@xyz.com', date: '2026-07-01', items: 'Flyers (5000)', type: 'Online', totalAmount: 4000, depositPaid: 0, balanceDue: 4000, deliveryDate: '2026-07-10', status: 'New', jobId: null }
  ],
  customRequests: [
    { id: 'CR-500', customerName: 'Global Brands', type: 'Special Size', description: 'Oversized banner 10m x 5m with reinforced grommets', budget: '$500', date: '2026-07-01', deadline: '2026-07-15', priority: 'Urgent', status: 'Pending' }
  ],
  deliveryNotes: [
    { id: 'DN-900', jobId: 'JOB-000099', customerName: 'Old Client', items: 'Posters (500)', quantity: 500, totalAmount: 2000, balanceDue: 0, deliveryDate: '2026-06-20', method: 'Pickup', status: 'Delivered' }
  ],
  approvals: [
    { id: 'APP-1', type: 'Design', jobId: 'JOB-000101', approver: 'Supervisor', timestamp: '2026-06-26T14:00:00Z', decision: 'Approved', checklist: { brief: true, colors: true, fonts: true, layout: true, errors: true }, notes: '' }
  ],
  
  // New Entities (Menus 27-35)
  drivers: [
    { id: 'DRV-001', name: 'John Smith', license: 'DL-987654', phone: '+251911001122', vehicle: 'Van (Toyota Hiace - 12345)', status: 'Available', currentDeliveries: 0 },
    { id: 'DRV-002', name: 'Miki', license: 'DL-555444', phone: '+251911998877', vehicle: 'Truck (Isuzu - 54321)', status: 'Off', currentDeliveries: 0 }
  ],
  deliveries: [
    { id: 'DEL-5001', jobId: 'JOB-000099', driverId: 'DRV-001', scheduleDate: '2026-07-01T14:00', status: 'Delivered', weight: '15kg', dimensions: '1m x 1m', signature: 'Signed_Abebe.png' }
  ],

  // Quality Control Entities (Menus 36-39)
  inspections: [
    { id: 'INS-001', jobId: 'JOB-000099', inspector: 'Alem', date: '2026-06-29T10:00:00Z', status: 'PASS', notes: 'Perfect' }
  ],
  defectReports: [
    { id: 'DEF-100', jobId: 'JOB-000100', reportedBy: 'Sara T.', date: '2026-07-01T09:00:00Z', type: 'Color Mismatch', description: 'Logo is printing too dark', status: 'Pending Rework' }
  ],
  reworkJobs: [
    { id: 'RWK-50', defectId: 'DEF-100', originalJobId: 'JOB-000100', type: 'Re-print', assignedTo: 'Dawit M.', status: 'In Progress', expectedCompletion: '2026-07-02T12:00:00Z' }
  ],
  qualityChecklists: [
    { type: 'Business Cards', items: ['Color Accuracy', 'Print Quality', 'Registration', 'Paper Quality', 'Cutting Accuracy', 'Packaging Condition'] },
    { type: 'Posters/Banners', items: ['Color Accuracy', 'Print Quality', 'Registration', 'Material Quality', 'Grommet Placement', 'Packaging Condition'] }
  ]
};

// Utils
export const generateId = (prefix) => {
  return `${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

export const createJob = (jobData) => {
  const newJob = {
    ...jobData,
    id: generateId('JOB'),
    status: 'Pending',
    priority: jobData.priority || 'Normal',
    quantity: jobData.quantity || 1,
    files: jobData.files || [],
    finishingOptions: jobData.finishingOptions || [],
    balanceDue: (jobData.totalCost || 0) - (jobData.depositPaid || 0),
    auditTrail: [{ stage: 'Pending', timestamp: new Date().toISOString(), user: 'System' }]
  };
  printingState.jobs.push(newJob);
  return newJob;
};

export const updateJobStage = (jobId, newStage, user = 'Supervisor') => {
  const job = printingState.jobs.find(j => j.id === jobId);
  if (job) {
    job.status = newStage;
    if (newStage === 'Completed') job.completedDate = new Date().toISOString().split('T')[0];
    if (!job.auditTrail) job.auditTrail = [];
    job.auditTrail.push({ stage: newStage, timestamp: new Date().toISOString(), user });
  }
};

export const updateDesignProgress = (jobId, progress) => {
  const job = printingState.jobs.find(j => j.id === jobId);
  if (job) {
    job.designProgress = progress;
  }
};

export const getDashboardSummary = () => {
  const activeJobs = printingState.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled');
  return {
    totalActive: activeJobs.length,
    inDesign: activeJobs.filter(j => j.status === 'Design').length,
    inPrinting: activeJobs.filter(j => j.status === 'Printing').length,
    finishing: activeJobs.filter(j => j.status === 'Finishing').length,
    readyDelivery: activeJobs.filter(j => j.status === 'Delivery').length,
    completedToday: printingState.jobs.filter(j => j.status === 'Completed' && j.completedDate === new Date().toISOString().split('T')[0]).length,
    pendingApproval: printingState.jobs.filter(j => j.status === 'Prepress').length,
    totalRevenueMtd: printingState.jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0)
  };
};

export const linkFileToJob = (fileId, jobId) => {
  const file = printingState.files.find(f => f.id === fileId);
  if(file) { file.jobId = jobId; file.status = 'Pending Review'; }
};

export const addFileVersion = (fileId, uploader, summary) => {
  const file = printingState.files.find(f => f.id === fileId);
  if(file) {
    file.history.push({ version: file.version, date: file.date, uploader: file.uploader });
    file.version += 1;
    file.date = new Date().toISOString().split('T')[0];
    file.uploader = uploader;
    file.status = 'Pending Review';
  }
};

export const assignMachine = (jobId, machineId) => {
  const m = printingState.machines.find(x => x.id === machineId);
  if(m && m.status === 'Under Maintenance') throw new Error("Machine is under maintenance.");
  if(m) { m.status = 'In Use'; m.currentJob = jobId; }
  const job = printingState.jobs.find(j => j.id === jobId);
  if(job) job.machineAssigned = m.name;
};

export const logMaterialUsage = (data) => {
  printingState.materialUsage.push({ ...data, id: generateId('MU'), date: new Date().toISOString().split('T')[0] });
  const mat = printingState.materials.find(m => m.type === data.materialType);
  if(mat) mat.stock -= (data.quantity + (data.wastageQty || 0));
};

export const requestReprint = (originalJobId, reason, user) => {
  const orig = printingState.jobs.find(j => j.id === originalJobId);
  if(orig) {
    const isInternal = ['Machine Error', 'Misprint'].includes(reason);
    const rId = generateId('RR');
    printingState.reprintRequests.push({
      id: rId, originalJobId, reason, requestedBy: user, date: new Date().toISOString().split('T')[0], status: 'Pending', isBillable: !isInternal
    });
  }
};

export const approveReprint = (reqId) => {
  const req = printingState.reprintRequests.find(r => r.id === reqId);
  if(req) {
    req.status = 'Approved';
    const orig = printingState.jobs.find(j => j.id === req.originalJobId);
    if(orig) {
      const child = { ...orig, id: `${orig.id}-R1`, status: 'Printing', totalCost: req.isBillable ? orig.totalCost : 0, balanceDue: req.isBillable ? orig.totalCost : 0 };
      printingState.jobs.push(child);
    }
  }
};

// New Menu 19-26 Logic
export const convertOrderToJob = (orderId) => {
  const order = printingState.orders.find(o => o.id === orderId);
  if (order) {
    const match = String(order.items || '').match(/(\d[\d,]*)/);
    const jobData = {
      customerName: order.customerName,
      customerPhone: order.contact,
      jobType: order.items,
      quantity: match ? parseInt(match[1].replace(/,/g, ''), 10) : 1,
      priority: 'Normal',
      paperSize: order.paperType || 'A4',
      deadline: order.deliveryDate,
      totalCost: order.totalAmount || 0,
      depositPaid: order.depositPaid || 0,
      orderId: order.id
    };
    const job = createJob(jobData);
    order.jobId = job.id;
    order.status = 'In Progress';
    return job.id;
  }
};

export const logApproval = (type, jobId, decision, checklist, notes) => {
  printingState.approvals.push({
    id: generateId('APP'),
    type, jobId, approver: 'Supervisor',
    timestamp: new Date().toISOString(),
    decision, checklist, notes
  });
  
  if (decision === 'Approved') {
    if (type === 'Design') updateJobStage(jobId, 'Prepress');
    if (type === 'Print') updateJobStage(jobId, 'Printing');
    if (type === 'Completion') updateJobStage(jobId, 'Completed');
  }
};

export const createDeliveryNote = (data) => {
  const dn = { ...data, id: generateId('DN'), status: 'Pending' };
  printingState.deliveryNotes.push(dn);
  return dn;
};

export const assignDriver = (driverId, deliveryId, scheduleDate) => {
  const driver = printingState.drivers.find(d => d.id === driverId);
  const delivery = printingState.deliveries.find(d => d.id === deliveryId);
  if (driver && driver.status !== 'Off') {
    if (delivery) {
      delivery.driverId = driverId;
      delivery.scheduleDate = scheduleDate;
      delivery.status = 'Scheduled';
    } else {
      // Create new delivery record if assigning from dispatch queue
      printingState.deliveries.push({
        id: deliveryId, driverId, scheduleDate, status: 'Scheduled'
      });
    }
  } else {
    throw new Error('Driver is Off or not found.');
  }
};

export const checkDriverConflict = (driverId, newScheduleDate) => {
  const existing = printingState.deliveries.filter(d => d.driverId === driverId && d.status === 'Scheduled');
  const newDate = new Date(newScheduleDate).getTime();
  return existing.some(d => {
    const exDate = new Date(d.scheduleDate).getTime();
    return Math.abs(newDate - exDate) < 2 * 60 * 60 * 1000; // 2 hour window conflict
  });
};

export const approvePrepress = (jobId) => {
  const job = printingState.jobs.find(j => j.id === jobId);
  if (job) {
    if (!job.auditTrail) job.auditTrail = [];
    job.auditTrail.push({ stage: 'Prepress Approved', timestamp: new Date().toISOString(), user: 'Prepress Operator' });
  }
};

export const markDelivered = (jobId) => {
  const job = printingState.jobs.find(j => j.id === jobId);
  if (job) {
    if (job.balanceDue > 0) throw new Error("Balance must be cleared before delivery.");
    updateJobStage(jobId, 'Delivered');
    job.completedDate = new Date().toISOString().split('T')[0];
    
    printingState.deliveries.push({
      id: generateId('DEL'),
      jobId: job.id,
      driverId: null,
      scheduleDate: new Date().toISOString().split('T')[0],
      status: 'Delivered',
      signature: 'Walk-in / Verified'
    });
  }
};

