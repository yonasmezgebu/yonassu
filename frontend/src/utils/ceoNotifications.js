// frontend/src/utils/ceoNotifications.js
import infoAudio from '../assets/notification/info.mp3';
import successAudio from '../assets/notification/approved.ogg';

export const playNotification = (type = 'info') => {
  try {
    const audio = new Audio(type === 'success' ? successAudio : infoAudio);
    audio.play().catch(e => console.error('Audio play failed:', e));
  } catch (error) {
    console.error('Audio error:', error);
  }
};

// Use for APPROVALS, AWARDS, CONFIRMATIONS
export const submitNotification = (title, message) => {
  playNotification('success');
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body: message });
    });
  }
  console.log(`[CEO SUCCESS] ${title}: ${message}`);
};

// Use for ALERTS, NEW REQUESTS, PENDING ITEMS, REJECTIONS
export const receiveNotification = (title, message) => {
  playNotification('info');
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body: message });
    });
  }
  console.log(`[CEO INFO] ${title}: ${message}`);
};

// Use for SILENT actions (Export, View, Filters)
export const triggerNotification = (title, message) => {
  console.log(`[SILENT UI EVENT] ${title}: ${message}`);
};
