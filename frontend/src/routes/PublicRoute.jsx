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
      'Purchase Manager': '/purchase',
      'Market Team': '/purchase',
      'Pharmacy Store Keeper': '/pharmacy-store',
      'Pharmacy Store': '/pharmacy-store',
      'General Store Keeper': '/general-store',
      'General Store': '/general-store',
      'Sales/Cashier': '/pharmacy-worker',
      'Printing Supervisor': '/printing-manager',
      'Printing Manager': '/printing-manager',
      'Pharmacy Worker': '/pharmacy-worker',
      'Pharmacy Manager': '/pharmacy',
      'Car Renting Manager': '/car-renting',
      'Rental Manager': '/car-renting',
      'Sales Manager': '/sales/overview',
      'HR Manager': '/hr',
      'HR': '/hr',
      'Employee': '/employee',
      'Customer': '/customer',
      'Board Member': '/board',
    };
    const rolePriority = [
      'Admin', 'CEO', 'Board Member', 'Finance', 'Finance Manager',
      'Purchase', 'Purchase Manager', 'Pharmacy Store', 'Pharmacy Store Keeper',
      'General Store', 'General Store Keeper',
      'Printing Supervisor', 'Printing Manager', 'Market Team',
      'Pharmacy Manager', 'Pharmacy Worker',
      'Sales/Cashier', 'Car Renting Manager', 'Rental Manager',
      'Sales Manager', 'HR', 'HR Manager', 'Employee', 'Customer'
    ];
    if (user?.roles) {
      const userRoles = user.roles.map(r => r.toLowerCase());
      for (const r of rolePriority) {
        if (userRoles.includes(r.toLowerCase())) {
          if (dashboardMap[r]) return <Navigate to={dashboardMap[r]} replace />;
        }
      }
    }
    // If authenticated but no recognized role, clear invalid auth and show login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return children;
  }
  return children;
};
export default PublicRoute;
