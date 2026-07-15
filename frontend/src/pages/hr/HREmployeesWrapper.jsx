import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, UserPlus, IdCard, Calendar, Banknote } from 'lucide-react';
import HREmployees from './HREmployees';
import HRAddEmployee from './HRAddEmployee';
import HREmployeeStatus from './HREmployeeStatus';
import HRAttendanceSimple from './HRAttendanceSimple';
import HREditEmployee from './HREditEmployee';
import HRPayrollDashboard from './HRPayrollDashboard';

const TABS = [
  { key: 'list',       label: 'EMPLOYEE LIST',   Icon: Users },
  { key: 'add',        label: 'ADD EMPLOYEE',     Icon: UserPlus },
  { key: 'status',     label: 'EMPLOYEE INFO',    Icon: IdCard },
  { key: 'attendance', label: 'ATTENDANCE',        Icon: Calendar },
  { key: 'payroll',    label: 'PAYROLL',          Icon: Banknote },
];

const HREmployeesWrapper = () => {
  const location = useLocation();

  const getTabFromSearch = () => {
    const p = new URLSearchParams(location.search);
    return p.get('tab') || 'list';
  };

  const [activeTab, setActiveTab] = useState(getTabFromSearch);
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    setActiveTab(getTabFromSearch());
  }, [location.search]);

  const handleRegisterExisting = (employeeData) => {
    setPrefillData(employeeData);
    setActiveTab('add');
  };

  const handleEditEmployee = (employeeData) => {
    setPrefillData(employeeData);
    setActiveTab('edit');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      margin: 0,
      padding: 0,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── TAB BAR — exact CustomerPrescriptions design ── */}
      <div style={{
        display: 'flex',
        background: 'linear-gradient(180deg, #e8e4da 0%, #f0ede4 100%)',
        borderBottom: '1px solid #cbc6bb',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {TABS.map((tab, idx) => {
          const active = activeTab === tab.key;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '18px 20px',
                border: 'none',
                borderRight: idx < TABS.length - 1 ? '1px solid #cbc6bb' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                position: 'relative',
                transition: 'all 0.2s',
                background: active
                  ? 'linear-gradient(180deg, rgba(253,230,138,0.35) 0%, rgba(255,255,255,0.5) 100%)'
                  : 'transparent',
                color: active ? '#92400e' : '#78716c',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
              }}
            >
              {/* Gold glowing top-bar for active */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '15%',
                  right: '15%',
                  height: 4,
                  background: 'linear-gradient(90deg, transparent, #d97706, transparent)',
                  boxShadow: '0 2px 10px rgba(217,119,6,0.7)',
                  borderRadius: '0 0 4px 4px',
                }} />
              )}
              <TabIcon size={17} color={active ? '#b45309' : '#a8a29e'} strokeWidth={2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#ffffff' }}>
        {activeTab === 'list'       && <HREmployees onRegister={handleRegisterExisting} onEdit={handleEditEmployee} />}
        {activeTab === 'add'        && <HRAddEmployee />}
        {activeTab === 'status'     && <HREmployeeStatus onEdit={(emp) => { setPrefillData(emp); setActiveTab('edit'); }} />}
        {activeTab === 'edit'       && <HREditEmployee prefillData={prefillData} onCancel={() => { setActiveTab('list'); }} />}
        {activeTab === 'attendance' && <HRAttendanceSimple />}
        {activeTab === 'payroll'    && <HRPayrollDashboard />}
      </div>
    </div>
  );
};

export default HREmployeesWrapper;
