import React from 'react';
import ManagerTaskPanel from '../../components/shared/ManagerTaskPanel';

const PharmacyTasks = () => {
  return (
    <div style={{ height: '100%' }}>
      <ManagerTaskPanel department="pharmacy" title="Pharmacy Tasks & Assignments" />
    </div>
  );
};

export default PharmacyTasks;
