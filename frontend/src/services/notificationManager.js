// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL NOTIFICATION SOUND SYSTEM
// Central registry of all sounds in src/assets/notification.
// Keyed by TASK MEANING — call playSound('approved') anywhere in the app.
// Aliases let you use intent names (e.g. 'payslip_ready', 'income_approved')
// which resolve to the right file automatically.
// ─────────────────────────────────────────────────────────────────────────────
import approvedSrc from '../assets/notification/approved.ogg';
import bidAwardedSrc from '../assets/notification/bid_awarded.ogg';
import ceoConfirmSrc from '../assets/notification/ceo_confirmation_needed.ogg';
import closedSrc from '../assets/notification/closed.mp3';
import clumpSrc from '../assets/notification/clump.mp3';
import errorSrc from '../assets/notification/error.m4a';
import expiredSrc from '../assets/notification/expired.mp3';
import infoSrc from '../assets/notification/info.mp3';
import postedSrc from '../assets/notification/posted.ogg';
import readySrc from '../assets/notification/ready.m4a';
import receivedSrc from '../assets/notification/received.ogg';
import rejectSrc from '../assets/notification/reject.mp3';
import rejectedSrc from '../assets/notification/rejected.ogg';
import successSrc from '../assets/notification/success.mp3';

// Fallbacks for missing files
const cashOutSrc = successSrc;
const requestSrc = infoSrc;
const waitedSrc = clumpSrc;

// Primary registry — one entry per sound file, named after its task
export const SOUNDS = {
  approved:               approvedSrc,   // approval granted (handover, EV, income...)
  bid_awarded:            bidAwardedSrc, // tender/bid won
  cash_out:               cashOutSrc,    // money paid out (EV, payroll, payments)
  ceo_confirmation_needed: ceoConfirmSrc,// action waiting on CEO confirmation
  closed:                 closedSrc,     // tender/period closed
  clump:                  clumpSrc,      // neutral blip (POS / minor events)
  error:                  errorSrc,      // failures
  expired:                expiredSrc,    // expiry alerts (drugs, deadlines)
  info:                   infoSrc,       // generic information
  posted:                 postedSrc,     // tender/order posted or published
  ready:                  readySrc,      // something is ready (payslip, review)
  received:               receivedSrc,   // shipment/payment received
  reject:                 rejectSrc,     // soft rejection warning
  rejected:               rejectedSrc,   // rejection final
  request:                requestSrc,    // new submission/request arrived
  waited:                 waitedSrc,     // decision put on hold (WAIT)
  success:                successSrc,    // general success
};

// Intent aliases — semantic event names any dashboard can use
const ALIASES = {
  task_assigned:        'info',
  payslip_ready:        'ready',
  salary_paid:          'cash_out',
  income_submitted:     'request',
  income_approved:      'approved',
  income_rejected:      'rejected',
  handover_approved:    'approved',
  handover_rejected:    'rejected',
  ev_submitted:         'request',
  payment_completed:    'cash_out',
  tender_posted:        'posted',
  tender_closed:        'closed',
  tender_awarded:       'bid_awarded',
  ceo_wait:             'waited',
  ceo_confirmation:     'ceo_confirmation_needed',
  stock_expired:        'expired',
  transfer_shipped:     'received',
  shipment_received:    'received',
};

// Backend/socket notification TYPE → sound (used by bell + socket handlers)
export const SOUND_FOR_TYPE = {
  finance:      'request',   // income submitted to finance
  task:         'info',      // new task assigned
  payslip:      'ready',     // payslip generated
  pharmacy:     'info',
  pos:          'clump',
  general:      'info',
  approved:     'success',
  rejected:     'rejected',
  completed:    'received',
  shipment:     'received',
  sale_created: 'clump',
  sales_report: 'info',
  report_rejected: 'rejected',
  expired_drug: 'expired',
  prescription: 'request',
  tender_approval: 'posted',
  new_bid: 'request',
  transfer_request: 'info',
  payroll_approved: 'approved',
  payroll_rejected: 'rejected',
  applicant_approved: 'approved',
  contact_message: 'request',
  printing_order: 'request',
  payment_confirmed: 'approved',
  payment_rejected: 'rejected',
  store_update: 'info',
  store_adjustment: 'clump',
  store_physical_count: 'info',
  manager_request: 'request',
  procurement_request: 'request',
  procurement: 'info',
  ev_approval: 'request',
  ev: 'cash_out',
  job_application: 'info',
  job_application_forwarded: 'info',
  TENDER_DEADLINE_REACHED: 'expired',
  PRINTING_MATERIAL_DISCREPANCY: 'error',
  PRINTING_MATERIAL_APPROVED: 'approved',
  PRINTING_MATERIAL_REJECTED: 'rejected',
};

// ─── Sound engine (Web Audio API) ───────────────────────────────────────────
// Files are fetched + decoded ONCE into in-memory AudioBuffers; playback uses
// BufferSourceNodes. This avoids HTMLAudioElement.cloneNode() re-hits on the
// HTTP disk cache, which can fail with ERR_CACHE_OPERATION_NOT_SUPPORTED when
// the same asset fires frequently (e.g. chat message blips).

let audioCtx = null;
const bufferCache = {};   // src -> AudioBuffer (decoded, ready)
const pendingLoads = {};  // src -> Promise (dedupe concurrent loads)

const getCtx = () => {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  // Autoplay policy: context may start suspended until a user gesture.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const loadBuffer = (src) => {
  if (bufferCache[src]) return Promise.resolve(bufferCache[src]);
  if (pendingLoads[src]) return pendingLoads[src];

  pendingLoads[src] = (async () => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = await res.arrayBuffer();
    const buf = await audioCtx.decodeAudioData(arr);
    bufferCache[src] = buf;
    delete pendingLoads[src];
    return buf;
  })().catch((e) => {
    delete pendingLoads[src]; // allow retry on next play attempt
    throw e;
  });

  return pendingLoads[src];
};

// Fallback for environments without Web Audio — one Audio per src, reused
const legacyCache = {};

const playLegacy = (src) => {
  try {
    if (!legacyCache[src]) {
      legacyCache[src] = new Audio(src);
      legacyCache[src].preload = 'auto';
    }
    const clone = legacyCache[src].cloneNode();
    clone.volume = 0.7;
    clone.play().catch(() => {});
  } catch (_) { /* silent */ }
};

const resolveSound = (name) => {
  if (!name) return SOUNDS.info;
  return SOUNDS[name] || SOUNDS[ALIASES[name]] || SOUNDS.info;
};

const playSound = (soundName) => {
  try {
    const src = resolveSound(soundName);

    if (!getCtx()) {           // no Web Audio support
      playLegacy(src);
      return;
    }

    if (bufferCache[src]) {
      // Instant path — buffer already in memory
      const node = audioCtx.createBufferSource();
      node.buffer = bufferCache[src];
      const gain = audioCtx.createGain();
      gain.gain.value = 0.7;
      node.connect(gain).connect(audioCtx.destination);
      node.start();
      return;
    }

    // First use — decode, then play once ready (subsequent plays are instant)
    loadBuffer(src)
      .then((buf) => {
        if (!bufferCache[src]) return;
        const node = audioCtx.createBufferSource();
        node.buffer = buf;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.7;
        node.connect(gain).connect(audioCtx.destination);
        node.start();
      })
      .catch(() => playLegacy(src)); // graceful degradation
  } catch (e) {
    console.warn('Sound notification failed:', e?.message || e);
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
  playSound(SOUND_FOR_TYPE[type] || resolveSound(type) || 'info');
  sendPushNotification(title, message, link);
};

const requestPermission = () => {
  requestPushPermission();
};

export { playSound, sendPushNotification, sendBrowserNotification, requestPermission };
