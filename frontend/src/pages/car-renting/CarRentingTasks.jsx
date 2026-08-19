import React from 'react';
import ManagerTaskPanel from '../../components/shared/ManagerTaskPanel';

const CarRentingTasks = () => {
  return (
    <div style={{ height: '100%' }}>
      <ManagerTaskPanel department="car_rental" title="Car Rental Tasks & Assignments" />
    </div>
  );
};

export default CarRentingTasks;
