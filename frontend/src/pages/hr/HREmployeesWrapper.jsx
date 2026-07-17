import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, UserPlus, IdCard, Calendar } from 'lucide-react';
import HREmployees from './HREmployees';
import HRAddEmployee from './HRAddEmployee';
import HREmployeeStatus from './HREmployeeStatus';
import HRAttendanceSimple from './HRAttendanceSimple';
import HREditEmployee from './HREditEmployee';

const TABS = [
  { key: 'list',       label: 'EMPLOYEE LIST',   Icon: Users },
  { key: 'add',        label: 'ADD EMPLOYEE',     Icon: UserPlus },
  { key: 'attendance', label: 'ATTENDANCE',        Icon: Calendar },
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
    if (location.state?.prefillData) {
      setPrefillData(location.state.prefillData);
      // Optional: clean up the state so it doesn't persist on refresh if not desired, 
      // but React Router handles state well enough.
    }
  }, [location.search, location.state]);

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
                padding: '16px 20px',
                margin: '8px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: active
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Rich gold gradient
                  : 'transparent',
                color: active ? '#ffffff' : '#b45309', // White text when active, dark gold when inactive
                fontWeight: active ? 900 : 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: active 
                  ? '0 8px 20px rgba(217, 119, 6, 0.3), inset 0 2px 4px rgba(255,255,255,0.4)' 
                  : 'none',
                transform: active ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <TabIcon size={18} color={active ? '#ffffff' : '#d97706'} strokeWidth={active ? 2.5 : 2} style={{ filter: active ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }} />
              <span style={{ textShadow: active ? '0 2px 4px rgba(0,0,0,0.15)' : 'none' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#ffffff' }}>
        {activeTab === 'list'       && <HREmployees onRegister={handleRegisterExisting} onEdit={handleEditEmployee} />}
        {activeTab === 'add'        && <HRAddEmployee />}
        {activeTab === 'edit'       && <HREditEmployee prefillData={prefillData} onCancel={() => { setActiveTab('list'); }} />}
        {activeTab === 'attendance' && <HRAttendanceSimple />}
      </div>
    </div>
  );
};

export default HREmployeesWrapper;
