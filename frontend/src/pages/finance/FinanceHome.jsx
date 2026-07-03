import React, { useState, useEffect } from 'react';
import { getMTDSummary, financeState } from '../../utils/financeTransactionService';
import FinancialSummaryCard from './FinancialSummaryCard';
import ReceivablePayableCard from './ReceivablePayableCard';
import { Wallet, Landmark, ArrowDownToLine, ArrowUpFromLine, Banknote, Clock, TrendingUp, TrendingDown, Activity, Users, Truck } from 'lucide-react';

const FinanceHome = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // In a real app this would be an async fetch
    setSummary(getMTDSummary());
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!summary) return null;

  const fmt = (amount) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount);

  // Calculate overdue counts for the cards
  const overdueInvoices = financeState.customerInvoices.filter(i => i.status === 'Overdue').length;
  const overdueBills = financeState.supplierBills.filter(b => b.status === 'Overdue').length;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Finance Dashboard</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 15 }}>
          Welcome back, Finance Manager • {today} • Department: Finance
        </p>
      </div>

      {/* Shared Financial Summary Cards (3x) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        <FinancialSummaryCard 
          title="Total Income (MTD)"
          amount={summary.totalIncome}
          period="MTD"
          comparisonAmount={115000}
          trendDirection="up"
          colorMode="favorable-high"
        />
        <FinancialSummaryCard 
          title="Total Expenses (MTD)"
          amount={summary.totalExpenses}
          period="MTD"
          comparisonAmount={95000}
          trendDirection="down"
          colorMode="favorable-low"
        />
        <FinancialSummaryCard 
          title="Net Profit/Loss"
          amount={summary.netProfitLoss}
          period="MTD"
          trendDirection={summary.netProfitLoss >= 0 ? "up" : "down"}
          colorMode="signed"
        />
      </div>

      {/* AR/AP Summary Cards (4x using ReceivablePayableCard) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <ReceivablePayableCard
          title="Total Receivables"
          amount={summary.totalReceivables}
          outstandingSubAmount={summary.outstandingReceivables}
          overdueCount={overdueInvoices}
          colorMode="receivable"
        />
        <ReceivablePayableCard
          title="Outstanding Receivables"
          amount={summary.outstandingReceivables}
          outstandingSubAmount={summary.outstandingReceivables}
          overdueCount={overdueInvoices}
          colorMode="receivable"
        />
        <ReceivablePayableCard
          title="Total Payables"
          amount={summary.totalPayables}
          outstandingSubAmount={summary.outstandingPayables}
          overdueCount={overdueBills}
          colorMode="payable"
        />
        <ReceivablePayableCard
          title="Outstanding Payables"
          amount={summary.outstandingPayables}
          outstandingSubAmount={summary.outstandingPayables}
          overdueCount={overdueBills}
          colorMode="payable"
        />
      </div>

      {/* Quick Finance Summary Widget */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: '0 0 20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} color="#3b82f6" /> Quick Finance Summary
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Cash in Hand', value: fmt(summary.cashInHand), icon: <Wallet size={18} color="#059669" />, bg: '#dcfce7' },
            { label: 'Bank Balance', value: fmt(summary.bankBalance), icon: <Landmark size={18} color="#2563eb" />, bg: '#dbeafe' },
            { label: "Today's Receipts", value: fmt(summary.todayReceipts), icon: <ArrowDownToLine size={18} color="#059669" />, bg: '#dcfce7' },
            { label: "Today's Payments", value: fmt(summary.todayPayments), icon: <ArrowUpFromLine size={18} color="#ea580c" />, bg: '#ffedd5' },
            
            { label: 'Total Receivables', value: fmt(summary.totalReceivables), icon: <Users size={18} color="#0284c7" />, bg: '#e0f2fe' },
            { label: 'Outstanding Receivables', value: fmt(summary.outstandingReceivables), icon: <Users size={18} color="#0369a1" />, bg: '#bae6fd' },
            { label: 'Total Payables', value: fmt(summary.totalPayables), icon: <Truck size={18} color="#ea580c" />, bg: '#ffedd5' },
            { label: 'Outstanding Payables', value: fmt(summary.outstandingPayables), icon: <Truck size={18} color="#c2410c" />, bg: '#fed7aa' },
            
            { label: 'Petty Cash Balance', value: fmt(summary.pettyCashBalance), icon: <Banknote size={18} color="#7c3aed" />, bg: '#f3e8ff' },
            { label: 'Pending Approvals', value: summary.pendingApprovals, icon: <Clock size={18} color="#d97706" />, bg: '#fef3c7' },
            
            { label: 'Total Income (MTD)', value: fmt(summary.totalIncome), icon: <TrendingUp size={18} color="#059669" />, bg: '#dcfce7' },
            { label: 'Total Expenses (MTD)', value: fmt(summary.totalExpenses), icon: <TrendingDown size={18} color="#ea580c" />, bg: '#ffedd5' },
            { label: 'Net Profit/Loss', value: fmt(summary.netProfitLoss), icon: <Activity size={18} color={summary.netProfitLoss >= 0 ? "#059669" : "#dc2626"} />, bg: summary.netProfitLoss >= 0 ? '#dcfce7' : '#fee2e2', valueColor: summary.netProfitLoss >= 0 ? '#166534' : '#991b1b' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: item.valueColor || '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FinanceHome;
