import React, { useEffect } from 'react';
import axios from '../../../services/apiClient';
import { sendBrowserNotification } from '../../../services/notificationManager';

const OverdueNotifier = () => {

  useEffect(() => {
    let intervalId;

    const checkOverdueOrders = async () => {
      try {
        const { data: rentalData } = await axios.get('/rental-orders');
        const { data: agriData } = await axios.get('/agrirent-orders?limit=100');

        const now = new Date();

        const overdueCars = (rentalData?.data || []).filter(order => 
          order.status === 'ACTIVE' && new Date(order.returnDate || order.return_date) < now
        );

        const overdueAgri = (agriData?.data?.orders || []).filter(order => 
          order.status === 'active' && new Date(order.end_date) < now
        );

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

      } catch (err) {
        console.error('Failed to check overdue orders', err);
      }
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
