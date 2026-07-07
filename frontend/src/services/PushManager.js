import { io } from 'socket.io-client';
// Use the existing playSound from their notificationManager to avoid audio context issues
import { playSound } from './notificationManager';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BOk-bTz6T7Z2n_eYl1E4M5Jm4X5-w5pD9Y9T7B2q4y0=';

class PushManager {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.userRole = null;
  }

  init(userId, userRole) {
    this.userId = userId;
    this.userRole = userRole;

    // Init Socket for in-app real-time notifications
    this.initSocket();

    // Init Service Worker & Web Push for true background notifications
    this.initPush();
  }

  initSocket() {
    if (this.socket) return;
    this.socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', ''));
    
    this.socket.on('connect', () => {
      this.socket.emit('join', { id: this.userId, role: this.userRole });
    });

    this.socket.on('notification', (payload) => {
      // Map payload type to their existing sound names ('success', 'info')
      const sound = payload.type.includes('COMPLETED') || payload.type.includes('APPROVED') ? 'success' : 'info';
      playSound(sound);
      
      // Dispatch event to update dashboard tables live
      window.dispatchEvent(new CustomEvent('new-notification', { detail: payload }));
    });
  }

  async initPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
          });
          
          // Send subscription to backend
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/transfer-requests/push-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: this.userId,
              subscription: subscription
            })
          });
        }
      } catch (err) {
        console.error('Service Worker Error', err);
      }
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushManager();
