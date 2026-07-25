import React, { useEffect } from 'react';
import axios from '../../../services/apiClient';
import { sendBrowserNotification } from '../../../services/notificationManager';

const OverdueNotifier = () => {

  useEffect(() => {
    let intervalId;

    const checkOverdueOrders = async () => {
      const now = new Date();
      let overdueCars = [];
      let overdueAgri = [];

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isCarManager = user?.role === 'Car Renting Manager' || user?.role === 'Admin' || user?.role === 'CEO';
      const isAgriManager = user?.role === 'Agri Rental Manager' || user?.role === 'Admin' || user?.role === 'CEO';

      if (isCarManager) {
        try {
        const { data: rentalData } = await axios.get('/rental-orders');
        overdueCars = (rentalData?.data || []).filter(order => 
          order.status === 'ACTIVE' && new Date(order.returnDate || order.return_date) < now
        );
      } catch (err) {
        // Silently ignore 403s (user doesn't have role), only log actual errors
        if (err.response?.status !== 403) {
          console.error('Failed to check rental overdue orders', err);
        }
      }
      }

      if (isAgriManager) {
        try {
        const { data: agriData } = await axios.get('/agrirent-orders?limit=100');
        overdueAgri = (agriData?.data?.orders || []).filter(order => 
          order.status === 'active' && new Date(order.end_date) < now
        );
      } catch (err) {
        // Silently ignore 403s (user doesn't have role)
        if (err.response?.status !== 403) {
          console.error('Failed to check agrirent overdue orders', err);
        }
      }
      }

        overdueCars.forEach(order => {
          const endDate = new Date(order.returnDate || order.return_date).toLocaleDateString();
          const title = 'Car Rental Overdue!';
          const msg = `Order ${order.orderNumber || order.order_number} ended on ${endDate}. Please expand or mark as completed.`;
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'warning' } }));
          sendBrowserNotification(title, msg, 'warning');
        });

        overdueAgri.forEach(order => {
          const endDate = new Date(order.end_date).toLocaleDateString();
          const title = 'AgriRent Overdue!';
          const msg = `Order ${order.order_number} ended on ${endDate}. Please expand or mark as completed.`;
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'warning' } }));
          sendBrowserNotification(title, msg, 'warning');
        });
    };

    const initialTimeout = setTimeout(() => {
      checkOverdueOrders();
      intervalId = setInterval(checkOverdueOrders, 60000);
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default OverdueNotifier;
