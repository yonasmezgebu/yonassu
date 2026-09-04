export const STATUS_LABELS = {
  received:    'Received',
  in_queue:    'Job Queue',
  in_design:   'In Design',
  file_check:  'File Check',
  in_printing: 'In Printing',
  in_progress: 'Printing (Progress)',
  finishing:   'Finishing',
  ready:       'Ready for Delivery',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};

export const STATUS_COLORS = {
  received:    { bg: '#fffbeb', color: '#92400e' },
  in_queue:    { bg: '#eff6ff', color: '#1e40af' },
  in_design:   { bg: '#f5f3ff', color: '#5b21b6' },
  file_check:  { bg: '#fff7ed', color: '#92400e' },
  in_printing: { bg: '#ecfdf5', color: '#065f46' },
  in_progress: { bg: '#cffafe', color: '#155e75' },
  finishing:   { bg: '#f0fdf4', color: '#065f46' },
  ready:       { bg: '#dcfce7', color: '#14532d' },
  delivered:   { bg: '#d1fae5', color: '#14532d' },
  cancelled:   { bg: '#fef2f2', color: '#7f1d1d' },
};

export const getStatusStyle = (code) => STATUS_COLORS[code] || { bg: '#f1f5f9', color: '#475569' };

// Which status_codes belong to each of the 6 stage buttons.
export const STAGE_BUTTONS = [
  { id: 'queue',     label: 'Pending',   path: '/printing-manager/jobs/queue',    statuses: ['received', 'in_queue', 'in_design', 'file_check', 'in_printing', 'in_progress', 'finishing', 'ready', 'payment_confirmed'] },
  { id: 'design',    label: 'Design',    path: '/printing-manager/jobs/design',   statuses: ['in_design'] },
  { id: 'prepress',  label: 'Prepress',  path: '/printing-manager/jobs/prepress', statuses: ['file_check'] },
  { id: 'printing',  label: 'Printing',  path: '/printing-manager/jobs/printing', statuses: ['in_printing', 'in_progress'] },
  { id: 'finishing', label: 'Finishing', path: '/printing-manager/jobs/finishing', statuses: ['finishing'] },
  { id: 'delivery',  label: 'Delivery',  path: '/printing-manager/jobs/delivery', statuses: ['ready'] },
];

// Next status for advancing an order one stage forward.
export const NEXT_STATUS = {
  received:    'in_queue',
  in_queue:    'in_design',
  in_design:   'file_check',
  file_check:  'in_printing',
  in_printing: 'finishing',
  in_progress: 'finishing',
  finishing:   'ready',
  ready:       'delivered',
};

// The status_codes each stage page displays.
export const STAGE_DISPLAY = {
  design:    ['in_design'],
  prepress:  ['file_check'],
  printing:  ['in_printing', 'in_progress'],
  finishing: ['finishing'],
  delivery:  ['ready'],
};