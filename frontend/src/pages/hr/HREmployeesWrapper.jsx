import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, UserPlus, Clock } from 'lucide-react';
import HREmployees from './HREmployees';
import HRAddEmployee from './HRAddEmployee';
import HREmployeeStatus from './HREmployeeStatus';
import HREditEmployee from './HREditEmployee';
import HREmployeesPending from './HREmployeesPending';

const TABS = [
  { key: 'list',    label: 'Employee List',    Icon: Users },
  { key: 'add',     label: 'Add Employee',     Icon: UserPlus },
];

const TAB_STYLES = `
  .hr-tabbar {
    display: flex;
    background: #FFFFFF;
    border-bottom: 2px solid #E5E7EB;
    flex-shrink: 0;
    overflow: hidden;
  }
  .hr-tab-btn {
    flex: 1;
    padding: 0;
    border: none;
    border-right: 1px solid #E5E7EB;
    background: #FFFFFF;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6B7280;
    height: 52px;
    position: relative;
    transition: background 150ms ease-in-out, color 150ms ease-in-out;
    border-radius: 0 !important;
  }
  .hr-tab-btn:last-child { border-right: none; }
  .hr-tab-btn::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: transparent;
    transition: background 150ms ease-in-out;
  }
  .hr-tab-btn.active {
    background: #EFF6FF;
    color: #2563EB;
  }
  .hr-tab-btn.active::after {
    background: #2563EB;
  }
  .hr-tab-btn:not(.active):hover {
    background: #FFFBEB;
    color: #B45309;
  }
  .hr-tab-btn:not(.active):hover::after {
    background: #F59E0B;
  }
  .hr-tab-icon { flex-shrink: 0; }
`;

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
      background: '#F5F5F5',
    }}>
      {/* Inject tab bar styles */}
      <style>{TAB_STYLES}</style>

      {/* ── TAB BAR ── */}
      <div className="hr-tabbar">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.key}
              className={`hr-tab-btn${active ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon
                className="hr-tab-icon"
                size={17}
                strokeWidth={active ? 2.5 : 2}
                color={active ? '#2563EB' : '#9CA3AF'}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#F5F5F5' }}>
        {activeTab === 'list'    && <HREmployees onRegister={handleRegisterExisting} onEdit={handleEditEmployee} />}
        {activeTab === 'add'     && <HRAddEmployee prefillData={prefillData} onRegistered={() => { setPrefillData(null); setActiveTab('list'); }} />}
        {activeTab === 'edit'    && <HREditEmployee prefillData={prefillData} onCancel={() => { setActiveTab('list'); }} />}
      </div>
    </div>
  );
};

export default HREmployeesWrapper;
