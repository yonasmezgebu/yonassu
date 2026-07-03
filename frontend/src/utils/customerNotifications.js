export const CUSTOMER_NOTIFICATIONS = {
  // Success sounds (Money / Commitments)
  ORDER_PLACED: { sound: 'success', toast: '📝 Order Placed', type: 'success' },
  PAYMENT_RECEIVED: { sound: 'success', toast: '💳 Payment Received', type: 'success' },

  // Info sounds (State changes, updates, reports)
  ORDER_HISTORY: { sound: 'info', toast: '📋 Order History Ready', type: 'info' },
  ORDER_STATUS: { sound: 'info', toast: '🚚 Order Status Updated', type: 'info' },
  INVOICE_READY: { sound: 'info', toast: '🧾 Invoice Ready', type: 'info' },
  RECEIPT_READY: { sound: 'info', toast: '📄 Receipt Ready', type: 'info' },
  PAYMENT_HISTORY: { sound: 'info', toast: '📊 Payment History Ready', type: 'info' },
  SUPPORT_SENT: { sound: 'info', toast: '📧 Support Request Sent', type: 'info' },
  SUPPORT_HISTORY: { sound: 'info', toast: '💬 Support History Ready', type: 'info' },

  // System
  PAGE_LOAD: { sound: null, toast: null },
  ERROR: { sound: 'error', toast: 'An error occurred', type: 'error' },
  INFO: { sound: 'info', toast: 'Action recorded', type: 'info' }
};

let soundTimeout = null;

export const playSound = (type) => {
  if (!type || typeof window === 'undefined') return;
  if (soundTimeout) clearTimeout(soundTimeout);

  soundTimeout = setTimeout(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'error') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'info') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }, 300);
};
