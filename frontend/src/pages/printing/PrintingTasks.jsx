import React from 'react';
import ManagerTaskPanel from '../../components/shared/ManagerTaskPanel';

const PrintingTasks = () => {
  return (
    <div style={{ height: '100%' }}>
      <ManagerTaskPanel department="printing" title="Printing Tasks & Assignments" />
    </div>
  );
};

export default PrintingTasks;
