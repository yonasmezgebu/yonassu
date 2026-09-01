// frontend/src/utils/pharmacyNotifications.js
import infoAudio from '../assets/notification/info.mp3';

// Only called directly for cross-dashboard RECEIVE events (info.mp3)
export const playNotification = (type = 'info') => {
  if (type === 'success') return; // Silence success sounds
  try {
    const audio = new Audio(infoAudio);
    audio.play().catch(e => console.error('Audio play failed:', e));
  } catch (error) {
    console.error('Audio error:', error);
  }
};

// Use this ONLY for actual SUBMIT / COMPLETE actions — no audio
export const submitNotification = (title, message) => {
  // No sound on submit/complete
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body: message });
    });
  }
  console.log(`[SUBMIT] ${title}: ${message}`);
};

// Use this ONLY when the OTHER side RECEIVES something — plays info.mp3
export const receiveNotification = (title, message) => {
  playNotification('info');
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body: message });
    });
  }
  console.log(`[RECEIVE] ${title}: ${message}`);
};

// Silent — no audio. Use for minor UI feedback (exports, prints, view, filters)
export const triggerNotification = (title, message, type = 'info') => {
  console.log(`[NOTIFICATION] ${title}: ${message}`);
};

