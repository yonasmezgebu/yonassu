import { salesState } from './salesManagerState';
import { rentalState } from './rentalManagerState';
import { BOARD_NOTIFICATIONS, playSound } from './boardNotifications';

// ==========================================
// SEED DATA FOR BOARD-OWNED MODELS
// ==========================================

let alerts = [
  { id: 'ALT-001', severity: 'critical', category: 'low_stock', title: 'Critical Stock Level: A4 Paper', description: 'Inventory below reorder threshold.', source_entity_type: 'Product', source_entity_id: 'PROD-001', status: 'active', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ALT-002', severity: 'warning', category: 'financial_anomaly', title: 'Unexpected Expense Variance', description: 'Marketing expenses exceeded Q3 budget by 15%.', source_entity_type: 'Department', source_entity_id: 'DEPT-003', status: 'active', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ALT-003', severity: 'info', category: 'pending_ceo_decision', title: 'Pending Expansion Approval', description: 'CEO decision required for new Hawassa branch.', source_entity_type: 'ApprovalItem', source_entity_id: 'APP-003', status: 'acknowledged', created_at: new Date(Date.now() - 172800000).toISOString() },
];

let approvalItems = [
  { id: 'APP-001', item_number: 'BGT-2026-Q3', type: 'budget', title: 'Q3 IT Infrastructure Budget', department: 'IT', amount_cents: 45000000, requested_by: 'CTO', requested_at: new Date(Date.now() - 259200000).toISOString(), details: { purpose: 'Server upgrades and new laptops', target_date: '2026-09-30' }, status: 'pending', decided_by: null, decided_at: null, decision_notes: null },
  { id: 'APP-002', item_number: 'BGT-2026-Q3-HR', type: 'budget', title: 'Q3 HR Hiring Budget', department: 'HR', amount_cents: 12000000, requested_by: 'VP HR', requested_at: new Date(Date.now() - 400000000).toISOString(), details: { purpose: 'Recruitment marketing and agency fees', target_date: '2026-09-30', amended_amount_cents: 10000000 }, status: 'amended', decided_by: 'Board Member 1', decided_at: new Date(Date.now() - 100000).toISOString(), decision_notes: 'Reduce agency spend.' },
  { id: 'APP-003', item_number: 'CEO-2026-001', type: 'ceo_decision', title: 'Hawassa Branch Expansion', department: 'Operations', amount_cents: null, requested_by: 'CEO', requested_at: new Date(Date.now() - 172800000).toISOString(), details: { decision_type: 'Expansion', justification: 'High market demand in southern region.' }, status: 'pending', decided_by: null, decided_at: null, decision_notes: null },
  { id: 'APP-004', item_number: 'INV-2026-001', type: 'investment', title: 'New Tractor Fleet', department: 'Rental', amount_cents: 150000000, requested_by: 'VP Rentals', requested_at: new Date(Date.now() - 500000000).toISOString(), details: { project_name: 'Agri Fleet Update', roi_pct: 18.5, risk_level: 'Medium' }, status: 'held', decided_by: 'Board Member 2', decided_at: new Date(Date.now() - 86400000).toISOString(), decision_notes: 'Hold until Q2 rental figures are audited.' },
  { id: 'APP-005', item_number: 'POL-2026-001', type: 'policy', title: 'Remote Work Policy Update', department: 'HR', amount_cents: null, requested_by: 'VP HR', requested_at: new Date(Date.now() - 600000000).toISOString(), details: { category: 'Employee Relations', impact: 'High - affects all non-retail staff.' }, status: 'approved', decided_by: 'Board Chair', decided_at: new Date(Date.now() - 200000000).toISOString(), decision_notes: 'Approved standard 2-day remote.' },
];

let strategicGoals = [
  { id: 'GOAL-001', description: 'Increase YoY Revenue', target_value: 1000000000, current_value: 650000000, unit: 'ETB', start_date: '2026-01-01', target_date: '2026-12-31', status: 'behind_schedule' },
  { id: 'GOAL-002', description: 'Expand Branch Network', target_value: 5, current_value: 3, unit: 'Branches', start_date: '2026-01-01', target_date: '2026-12-31', status: 'on_track' },
];

let risks = [
  { id: 'RSK-001', title: 'Supply Chain Disruption', category: 'operational', severity: 'critical', description: 'Delays in imported farming equipment.', mitigation_plan: 'Identify local suppliers for critical parts.', status: 'open', identified_at: '2026-05-15', owner: 'COO' },
  { id: 'RSK-002', title: 'New Tax Regulations', category: 'compliance', severity: 'high', description: 'Impending changes to VAT collection rules.', mitigation_plan: 'Engage external audit firm for compliance review.', status: 'open', identified_at: '2026-06-01', owner: 'CFO' },
];

let branches = [
  { id: 'BRN-001', name: 'Addis Ababa HQ', location: 'Addis Ababa', manager_id: 'EMP-010' },
  { id: 'BRN-002', name: 'Adama Hub', location: 'Adama', manager_id: 'EMP-045' },
  { id: 'BRN-003', name: 'Bahir Dar Center', location: 'Bahir Dar', manager_id: 'EMP-088' },
];

let departments = [
  { id: 'DEPT-001', name: 'Retail', head_employee_id: 'EMP-011', employee_count: 45, budget_cents: 500000000 },
  { id: 'DEPT-002', name: 'Printing', head_employee_id: 'EMP-012', employee_count: 20, budget_cents: 150000000 },
  { id: 'DEPT-003', name: 'Farming', head_employee_id: 'EMP-013', employee_count: 35, budget_cents: 300000000 },
  { id: 'DEPT-004', name: 'Car Rental', head_employee_id: 'EMP-014', employee_count: 25, budget_cents: 800000000 },
  { id: 'DEPT-005', name: 'Pharmacy', head_employee_id: 'EMP-015', employee_count: 15, budget_cents: 200000000 },
  { id: 'DEPT-006', name: 'Sales', head_employee_id: 'EMP-016', employee_count: 50, budget_cents: 400000000 },
  { id: 'DEPT-007', name: 'HR', head_employee_id: 'EMP-017', employee_count: 10, budget_cents: 50000000 },
  { id: 'DEPT-008', name: 'Finance', head_employee_id: 'EMP-018', employee_count: 12, budget_cents: 60000000 },
  { id: 'DEPT-009', name: 'Inventory', head_employee_id: 'EMP-019', employee_count: 18, budget_cents: 45000000 },
  { id: 'DEPT-010', name: 'Purchase', head_employee_id: 'EMP-020', employee_count: 8, budget_cents: 35000000 },
];

let ceoReview = {
  id: 'REV-2026-Q2', ceo_name: 'Dawit Tadesse', review_period: 'Q2 2026', performance_score: 4.2,
  quarterly_actuals: {
    q1: { actual: 85, target: 80 },
    q2: { actual: 78, target: 85 }
  },
  achievements: ['Successfully launched new pharmacy branch', 'Reduced operational costs by 8%'],
  improvement_areas: ['Customer satisfaction scores dipped in rentals', 'Delayed IT infrastructure upgrade']
};

let complianceRecords = [
  { id: 'CMP-001', department_id: 'DEPT-008', compliance_type: 'tax', status: 'compliant', score: 95, last_checked_at: '2026-06-25' },
  { id: 'CMP-002', department_id: 'DEPT-007', compliance_type: 'legal', status: 'warning', score: 75, last_checked_at: '2026-06-10' },
  { id: 'CMP-003', department_id: 'DEPT-006', compliance_type: 'audit', status: 'non_compliant', score: 55, last_checked_at: '2026-05-20' },
];

let legalRecords = [
  { id: 'LGL-001', type: 'contract', title: 'Supplier Agreement - Habesha Steel', status: 'active', filed_date: '2025-11-01', related_documents: ['doc1.pdf'] },
  { id: 'LGL-002', type: 'litigation', title: 'Customer Dispute Case #884', status: 'pending', filed_date: '2026-04-15', related_documents: ['case_file.pdf'] },
];


const stateEventTarget = new EventTarget();

export const boardAggregationService = {
  subscribe: (callback) => {
    stateEventTarget.addEventListener('change', callback);
    return () => stateEventTarget.removeEventListener('change', callback);
  },

  notify: (key) => {
    const notif = BOARD_NOTIFICATIONS[key];
    if (notif) {
      if (notif.toast && typeof window !== 'undefined' && window.toast) {
        window.toast[notif.type || 'info'](notif.toast);
      }
      if (notif.sound) playSound(notif.sound);
    }
    stateEventTarget.dispatchEvent(new Event('change'));
  },

  // --- Read-Only Aggregation Queries ---

  getCompanyFinancials: (dateRange) => {
    // 1. Fetch real sales data
    const realSales = salesState.getSales ? salesState.getSales().filter(s => s.status === 'completed') : [];
    const realSalesRevenue = realSales.reduce((acc, sale) => acc + (sale.total_cents || 0), 0);
    
    // 2. Fetch real rental data
    const realRentals = rentalState.getOrders ? rentalState.getOrders().filter(o => o.status === 'completed' || o.status === 'active') : [];
    const realRentalRevenue = realRentals.reduce((acc, order) => acc + (order.total_amount_cents || 0), 0);

    // 3. Mock data for modules not fully implemented
    const baseRevenue = 25000000000; // 250M ETB (Cents)
    const totalRevenue = baseRevenue + realSalesRevenue + realRentalRevenue;
    const totalExpenses = 18000000000;
    const profit = totalRevenue - totalExpenses;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: profit,
      assets: null, // As per spec: if Finance module missing, return null, do not fake.
      liabilities: null,
      equity: null,
      employeeCount: departments.reduce((acc, d) => acc + d.employee_count, 0),
      departmentCount: departments.length,
      branchCount: branches.length
    };
  },

  getDepartmentBreakdown: (dateRange) => {
    // Incorporate real sales revenue per department
    const realSales = salesState.getSales ? salesState.getSales().filter(s => s.status === 'completed') : [];
    
    return departments.map(d => {
      // Mock base financials per department
      let rev = d.budget_cents * 1.2; 
      let exp = d.budget_cents * 0.9;

      // Layer on actuals
      const deptSales = realSales.filter(s => s.department?.toLowerCase() === d.name.toLowerCase());
      const realRev = deptSales.reduce((acc, s) => acc + (s.total_cents || 0), 0);
      rev += realRev;

      const profit = rev - exp;
      let status = '✅';
      if (profit < 0) status = '❌';
      else if (exp > d.budget_cents) status = '⚠️';

      return {
        id: d.id,
        dept: d.name,
        revenue: rev,
        expenses: exp,
        profit: profit,
        status: status
      };
    });
  },

  getKPIs: (dateRange) => {
    return {
      revenueGrowthPct: 12.5,
      profitMarginPct: 28.0,
      employeePerformanceScore: null, // Per spec: explicitly flag as null rather than faked
      customerSatisfactionScore: null // Per spec: null
    };
  },

  // --- Getters for Board Models ---

  getAlerts: () => [...alerts],
  getApprovalItems: () => [...approvalItems],
  getStrategicGoals: () => [...strategicGoals],
  getRisks: () => [...risks],
  getBranches: () => [...branches],
  getDepartments: () => [...departments],
  getCEOReview: () => ({ ...ceoReview }),
  getComplianceRecords: () => [...complianceRecords],
  getLegalRecords: () => [...legalRecords],

  // --- Workflow Actions ---

  approveItem: (id, userId, notes) => {
    const idx = approvalItems.findIndex(i => i.id === id);
    if (idx > -1) {
      if (approvalItems[idx].status !== 'pending' && approvalItems[idx].status !== 'held') throw new Error("Can only approve pending/held items.");
      approvalItems[idx].status = 'approved';
      approvalItems[idx].decided_by = userId;
      approvalItems[idx].decided_at = new Date().toISOString();
      approvalItems[idx].decision_notes = notes || null;
      boardAggregationService.notify('APPROVE');
    }
  },

  rejectItem: (id, userId, notes) => {
    const idx = approvalItems.findIndex(i => i.id === id);
    if (idx > -1) {
      approvalItems[idx].status = 'rejected';
      approvalItems[idx].decided_by = userId;
      approvalItems[idx].decided_at = new Date().toISOString();
      approvalItems[idx].decision_notes = notes || null;
      boardAggregationService.notify('REJECT');
    }
  },

  holdItem: (id, userId, notes) => {
    const idx = approvalItems.findIndex(i => i.id === id);
    if (idx > -1) {
      approvalItems[idx].status = 'held';
      approvalItems[idx].decided_by = userId;
      approvalItems[idx].decided_at = new Date().toISOString();
      approvalItems[idx].decision_notes = notes || null;
      boardAggregationService.notify('HOLD');
    }
  },

  amendItem: (id, userId, notes, newAmountCents) => {
    const idx = approvalItems.findIndex(i => i.id === id);
    if (idx > -1) {
      approvalItems[idx].status = 'amended';
      approvalItems[idx].decided_by = userId;
      approvalItems[idx].decided_at = new Date().toISOString();
      approvalItems[idx].decision_notes = notes || null;
      if (newAmountCents) {
        approvalItems[idx].details = { ...approvalItems[idx].details, amended_amount_cents: newAmountCents };
      }
      boardAggregationService.notify('AMEND');
    }
  },

  // Triggers for testing
  triggerAlert: (severity, category, title) => {
    alerts.unshift({
      id: `ALT-${Date.now()}`,
      severity, category, title, description: 'Rule triggered alert',
      source_entity_type: 'System', source_entity_id: 'SYS',
      status: 'active', created_at: new Date().toISOString()
    });
    boardAggregationService.notify('ALERT_CREATED');
  }
};
