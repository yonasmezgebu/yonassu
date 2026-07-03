// frontend/src/utils/pharmacyNotifications.js
import infoAudio from '../assets/notification/info.mp3';
import successAudio from '../assets/notification/sucsesse.mp3';

// Only called directly for cross-dashboard RECEIVE events (info.mp3)
// or from submitNotification (sucsesse.mp3)
export const playNotification = (type = 'info') => {
  try {
    const audio = new Audio(type === 'success' ? successAudio : infoAudio);
    audio.play().catch(e => console.error('Audio play failed:', e));
  } catch (error) {
    console.error('Audio error:', error);
  }
};

// Use this ONLY for actual SUBMIT / COMPLETE actions — plays sucsesse.mp3
export const submitNotification = (title, message) => {
  playNotification('success');
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
  // NO AUDIO for general info triggers
  if (type === 'success') {
    // If accidentally called with success, play it
    playNotification('success');
  }
  console.log(`[NOTIFICATION] ${title}: ${message}`);
};

