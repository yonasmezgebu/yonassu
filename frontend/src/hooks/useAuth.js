import { useState, useEffect } from 'react';
import authService from '../services/authService';
export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(authService.getCurrentUser());
      setIsAuthenticated(authService.isAuthenticated());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const login = async (credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
    setIsAuthenticated(true);
    return user;
  };
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };
  const updateUser = (partialData) => {
    const current = authService.getCurrentUser() || {};
    const updated = { ...current, ...partialData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };
  return {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole: authService.hasRole,
    hasPermission: authService.hasPermission
  };
};

