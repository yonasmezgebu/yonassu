import React from 'react';
import ManagerTaskPanel from '../../components/shared/ManagerTaskPanel';

const SalesTasks = () => {
  return (
    <div style={{ height: '100%' }}>
      <ManagerTaskPanel department="sales" title="Sales Tasks & Assignments" />
    </div>
  );
};

export default SalesTasks;
