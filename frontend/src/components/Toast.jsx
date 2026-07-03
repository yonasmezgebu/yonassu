import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info, Truck, Package } from 'lucide-react';

const ICON_MAP = {
  success: <CheckCircle size={20} color="#10B981" />,
  error: <AlertCircle size={20} color="#EF4444" />,
  warning: <AlertCircle size={20} color="#F59E0B" />,
  info: <Info size={20} color="#3B82F6" />,
  approved: <CheckCircle size={20} color="#10B981" />,
  rejected: <AlertCircle size={20} color="#EF4444" />,
  shipment: <Truck size={20} color="#8B5CF6" />,
  completed: <Package size={20} color="#059669" />,
};

const BG_MAP = {
  success: '#ECFDF5',
  error: '#FEF2F2',
  warning: '#FFFBEB',
  info: '#EFF6FF',
  approved: '#ECFDF5',
  rejected: '#FEF2F2',
  shipment: '#F5F3FF',
  completed: '#ECFDF5',
};

const BORDER_MAP = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  shipment: '#8B5CF6',
  completed: '#059669',
};

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: 10,
      background: BG_MAP[type] || BG_MAP.info,
      border: `1px solid ${BORDER_MAP[type] || BORDER_MAP.info}40`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      maxWidth: 420, animation: 'toastSlideIn 0.3s ease-out',
      fontFamily: 'Inter, sans-serif'
    }}>
      {ICON_MAP[type] || ICON_MAP.info}
      <span style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.4, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}>
        <X size={16} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} duration={t.duration} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};

export default Toast;
