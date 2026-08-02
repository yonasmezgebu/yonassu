exports.up = async function(knex) {
  // Check if standard accounts exist
  const existing = await knex('chart_of_accounts').first();
  if (existing) {
    return; // Already seeded
  }

  // Insert standard COA
  const standardAccounts = [
    // ASSETS
    { account_code: '1000', account_name: 'Cash and Cash Equivalents', account_type: 'asset', is_active: true },
    { account_code: '1200', account_name: 'Accounts Receivable', account_type: 'asset', is_active: true },
    { account_code: '1500', account_name: 'Inventory', account_type: 'asset', is_active: true },
    // LIABILITIES
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'liability', is_active: true },
    { account_code: '2100', account_name: 'Short-Term Loans', account_type: 'liability', is_active: true },
    { account_code: '2200', account_name: 'Taxes Payable', account_type: 'liability', is_active: true },
    // EQUITY
    { account_code: '3000', account_name: 'Owner\'s Capital', account_type: 'equity', is_active: true },
    { account_code: '3100', account_name: 'Retained Earnings', account_type: 'equity', is_active: true },
    // REVENUE
    { account_code: '4000', account_name: 'Sales Revenue', account_type: 'revenue', is_active: true },
    { account_code: '4100', account_name: 'Service Revenue', account_type: 'revenue', is_active: true },
    // EXPENSES
    { account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'expense', is_active: true },
    { account_code: '6000', account_name: 'Operating Expenses', account_type: 'expense', is_active: true },
    { account_code: '6100', account_name: 'Salaries and Wages', account_type: 'expense', is_active: true },
    { account_code: '6200', account_name: 'Tax Expense', account_type: 'expense', is_active: true }
  ];

  await knex('chart_of_accounts').insert(standardAccounts);
};

exports.down = async function(knex) {
  // Only remove if they are the exact ones we added (simplest is to do nothing to avoid breaking existing references, but we can delete by code)
  await knex('chart_of_accounts').whereIn('account_code', ['1000', '1200', '1500', '2000', '2100', '2200', '3000', '3100', '4000', '4100', '5000', '6000', '6100', '6200']).del();
};
