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
    border-bottom: 3px solid #228B22;
    flex-shrink: 0;
    overflow: hidden;
  }
  .hr-tab-btn {
    flex: 1;
    padding: 0;
    border: none;
    border-right: 1px solid #A5D6A7;
    background: #FFFFFF;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6B8E23;
    height: 54px;
    position: relative;
    transition: background 0.15s, color 0.15s;
    border-radius: 0 !important;
  }
  .hr-tab-btn:last-child { border-right: none; }
  .hr-tab-btn::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: transparent;
    transition: background 0.15s;
  }
  .hr-tab-btn.active {
    background: #1B5E20;
    color: #FFFFFF;
  }
  .hr-tab-btn.active::after {
    background: #8BC34A;
  }
  .hr-tab-btn:not(.active):hover {
    background: #F5F5F5;
    color: #228B22;
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
                color={active ? '#8BC34A' : '#6B8E23'}
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
