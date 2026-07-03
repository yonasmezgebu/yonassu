import infoSrc from '../assets/notification/info.mp3';
import successSrc from '../assets/notification/success.mp3';

const SOUNDS = {
  info: infoSrc,
  success: successSrc,
};

const audioCache = {};

const playSound = (soundName) => {
  try {
    const src = SOUNDS[soundName] || SOUNDS.info;
    if (!audioCache[src]) {
      audioCache[src] = new Audio(src);
      audioCache[src].volume = 0.7;
    }
    const clone = audioCache[src].cloneNode();
    clone.volume = 0.7;
    clone.play().catch(() => {});
  } catch (e) {
    console.warn('Sound notification failed:', e.message);
  }
};

const requestPushPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

const sendPushNotification = (title, body, url) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      requireInteraction: true,
      tag: 'pharmacy-transfer',
    });
    notification.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
    };
  }
};

const sendBrowserNotification = (title, message, type, link) => {
  const soundMap = {
    approved: 'success', rejected: 'info', new_drug: 'info',
    tender: 'info', tender_closed: 'info', fund: 'info',
    fund_approved: 'success', payment: 'success', received: 'info',
    shipped: 'info', direct: 'info', ceo_confirm: 'success',
    new_drug_added: 'success', wait: 'info',
    sale_created: 'success', sales_report: 'info',
    income_recorded: 'success', report_rejected: 'info',
    expired_drug: 'info', prescription: 'info',
  };
  playSound(soundMap[type] || 'info');
  sendPushNotification(title, message, link);
};

const requestPermission = () => {
  requestPushPermission();
};

export { playSound, sendPushNotification, sendBrowserNotification, requestPermission };