import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import hrService from '../../services/hrService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './HRAttendanceReports.module.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

const HRAttendanceReports = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await hrService.getAttendanceReportsDashboard(startDate, endDate);
      setReportData(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to fetch attendance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading && !reportData) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <SegmentedSpinner size={28} color="#2563EB" />
          <div className={styles.loadingText}>Generating report…</div>
        </div>
      </div>
    );
  }

  const { summary, daily_trends, absence_reasons } = reportData || {};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Attendance Reports</h1>
          <p className={styles.pageSubtitle}>Analyze attendance trends, lateness, and absence reasons.</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.datePicker}>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className={styles.dateInput}
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className={styles.dateInput}
            />
          </div>
          <button className={styles.exportBtn} onClick={handleExportPDF}>
            Export to PDF
          </button>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles['summaryCard--primary']}`}>
          <h3>Total Employees</h3>
          <div className={styles.summaryValue}>{summary?.total_employees || 0}</div>
        </div>
        <div className={`${styles.summaryCard} ${styles['summaryCard--success']}`}>
          <h3>Avg Attendance Rate</h3>
          <div className={styles.summaryValue}>{summary?.avg_attendance || 0}%</div>
        </div>
        <div className={`${styles.summaryCard} ${styles['summaryCard--danger']}`}>
          <h3>Total Absences (Period)</h3>
          <div className={styles.summaryValue}>{summary?.total_absences || 0}</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Daily Attendance Trends (On-time vs Late vs Absent)</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_trends || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12, padding: '8px 12px' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#6B7280' }} />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10b981" />
                <Bar dataKey="late" name="Late" stackId="a" fill="#f59e0b" />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Absence Reasons Breakdown</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={absence_reasons || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(absence_reasons || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12, padding: '8px 12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.overlayLoading}>
          <SegmentedSpinner size={16} color="#fff" />
          <span>Refreshing…</span>
        </div>
      )}
    </div>
  );
};

export default HRAttendanceReports;
