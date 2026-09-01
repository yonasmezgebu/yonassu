import React, { useEffect, useRef, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { playSound, sendPushNotification, requestPermission } from '../services/notificationManager';

const NotificationContext = createContext(null);

export const useNotifier = () => useContext(NotificationContext);

export const NotificationProvider = ({ children, showToast }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', ''), { transports: ['websocket', 'polling'], withCredentials: true });
    socketRef.current = socket;

    socket.on('pharmacy-transfer', (data) => {
      const { title, message, type, link } = data || {};
      // No sound for sale/pos events
      const silentTypes = ['sale_created', 'pos', 'pharmacy', 'prescription', 'sales_report'];
      if (!silentTypes.includes(type)) {
        const soundMap = { approved: 'info', rejected: 'info', completed: 'success', shipment: 'success', report_rejected: 'info', expired_drug: 'info' };
        const soundType = soundMap[type] || 'info';
        playSound(soundType);
      }
      sendPushNotification(title || 'Pharmacy Transfer', message || '', link || '');
      if (showToast && title) {
        showToast(`${title}: ${message}`, type);
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [showToast]);

  const notify = (title, message, type = 'notification', link = '') => {
    // No sound for sale/pos events
    const silentTypes = ['sale_created', 'pos', 'pharmacy', 'prescription', 'sales_report'];
    if (!silentTypes.includes(type)) {
      const soundMap = { approved: 'info', rejected: 'info', completed: 'success', shipment: 'success', report_rejected: 'info', expired_drug: 'info' };
      playSound(soundMap[type] || 'info');
    }
    sendPushNotification(title, message, link);
    if (showToast) {
      showToast(`${title}: ${message}`, type);
    }
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
