import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    const user = authService.getCurrentUser();
    const dashboardMap = {
      'Admin': '/admin',
      'CEO': '/ceo',
      'Finance Manager': '/finance',
      'Finance': '/finance',
      'Purchase': '/purchase',
      'Market Team': '/purchase',
      'Store Manager': '/store',
      'Sales/Cashier': '/pharmacy-worker',
      'Printing Supervisor': '/printing-manager',
      'Pharmacy Worker': '/pharmacy-worker',
      'Pharmacy Manager': '/pharmacy',
      'Car Renting Manager': '/car-renting',
      'HR Manager': '/hr',
      'Employee': '/employee',
      'Customer': '/customer'
    };
    const rolePriority = [
      'Admin', 'CEO', 'Finance', 'Finance Manager', 'Purchase', 'Store Manager',
      'Printing Supervisor', 'Market Team', 'Pharmacy Manager', 'Pharmacy Worker',
      'Sales/Cashier', 'Car Renting Manager', 'HR Manager', 'Employee', 'Customer'
    ];
    if (user?.roles) {
      for (const r of rolePriority) {
        if (user.roles.includes(r)) {
          if (dashboardMap[r]) return <Navigate to={dashboardMap[r]} replace />;
        }
      }
    }
    return <Navigate to="/" replace />;
  }
  return children;
};
export default PublicRoute;
