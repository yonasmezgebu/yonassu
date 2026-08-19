import React from 'react';
import ManagerTaskPanel from '../../components/shared/ManagerTaskPanel';

const PurchaseTasks = () => {
  return (
    <div style={{ height: '100%' }}>
      <ManagerTaskPanel department="purchase" title="Purchase Tasks & Assignments" />
    </div>
  );
};

export default PurchaseTasks;
