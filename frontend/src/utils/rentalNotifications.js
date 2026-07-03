export const RENTAL_NOTIFICATIONS = {
  // Success sounds (Money or new inventory)
  PICKUP_SUCCESS: { sound: 'success', toast: '💳 New Pickup Processed', type: 'success' },
  ADD_ASSET: { sound: 'success', toast: '➕ New Asset Added', type: 'success' },
  RETURN_SUCCESS: { sound: 'success', toast: '✅ Return Processed', type: 'success' },

  // Info sounds (State changes, updates, reports)
  NEW_ORDER: { sound: 'info', toast: '📝 New Rental Order', type: 'info' },
  ORDER_UPDATED: { sound: 'info', toast: '📋 Rental Order Updated', type: 'info' },
  TRACKING_UPDATED: { sound: 'info', toast: '📊 Order Tracking Updated', type: 'info' },
  FLEET_OVERVIEW: { sound: 'info', toast: '🚗 Fleet Overview Ready', type: 'info' },
  ASSET_REGISTER: { sound: 'info', toast: '🚗 Asset Register Updated', type: 'info' },
  MAINTENANCE_REQ: { sound: 'info', toast: '🔧 Maintenance Required', type: 'info' },
  MAINTENANCE_UPDATED: { sound: 'info', toast: '🔧 Maintenance Record Updated', type: 'info' },
  UTILIZATION_READY: { sound: 'info', toast: '📊 Utilization Report Ready', type: 'info' },
  CALENDAR_UPDATED: { sound: 'info', toast: '📅 Calendar Updated', type: 'info' },
  HISTORY_READY: { sound: 'info', toast: '🔄 Status History Ready', type: 'info' },
  
  RENTAL_REPORT: { sound: 'info', toast: '📊 Rental Report Ready', type: 'info' },
  REVENUE_REPORT: { sound: 'info', toast: '💰 Revenue Report Ready', type: 'info' },
  PERFORMANCE_REPORT: { sound: 'info', toast: '📈 Performance Report Ready', type: 'info' },

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
