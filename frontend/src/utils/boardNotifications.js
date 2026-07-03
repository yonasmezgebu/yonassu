export const BOARD_NOTIFICATIONS = {
  // Alerts
  ALERT_CREATED: { sound: 'info', toast: '🚨 New Alert', type: 'warning' },

  // Approval Item Submissions
  NEW_BUDGET: { sound: 'info', toast: '💵 Budget Ready', type: 'info' },
  NEW_CEO_DECISION: { sound: 'info', toast: '👔 Decision', type: 'info' },
  NEW_INVESTMENT: { sound: 'info', toast: '💡 Investment', type: 'info' },
  NEW_POLICY: { sound: 'info', toast: '📜 Policy', type: 'info' },

  // Approval Actions
  APPROVE: { sound: 'success', toast: '✅ Approved', type: 'success' },
  REJECT: { sound: 'info', toast: '❌ Rejected', type: 'error' },
  HOLD: { sound: 'info', toast: '⏸️ Placed on Hold', type: 'warning' },
  AMEND: { sound: 'info', toast: '📝 Amended', type: 'info' },

  // System
  PAGE_LOAD: { sound: null, toast: null },
  ERROR: { sound: 'error', toast: 'An error occurred', type: 'error' }
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
