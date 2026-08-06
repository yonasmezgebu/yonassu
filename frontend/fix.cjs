const fs = require('fs');

const path = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\car-renting\\\\CarRentingDashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import FleetOperations from './FleetOperations';\nimport ManagerChat from '../../components/ManagerChat';",
  "import FleetManager from './FleetManager';\nimport ManagerChat from '../../components/ManagerChat';"
);

c = c.replace(
  "{ label: 'Contact Settings', icon: 'phone-call', color: '#228B22', children: [\n          { label: 'Setting Contact', path: '/car-renting/manager/contact', icon: 'settings' },\n          { label: 'Chat', path: '/car-renting/manager/chat', icon: 'message-circle', color: '#6B8E23' }\n        ] },",
  "{ label: 'Rental Post & Vehicle', path: '/car-renting/manager/fleet',         icon: 'car',   color: '#228B22' },"
);

c = c.replace(
  "{ label: 'Contact Settings',   path: '/car-renting/manager/contact',             icon: 'phone-call',   color: '#228B22' },",
  "{ label: 'Contact Settings', icon: 'phone-call', color: '#228B22', children: [ { label: 'Setting Contact', path: '/car-renting/manager/contact', icon: 'settings' }, { label: 'Chat', path: '/car-renting/manager/chat', icon: 'message-circle', color: '#6B8E23' } ] },"
);

c = c.replace(
  '<Route path="manager/fleet"         element={<FleetOperations />} />',
  '<Route path="manager/fleet"         element={<FleetManager />} />'
);

c = c.replace(
  '<Route path="contact" element={<RentalContact />} />\n            <Route path="chat" element={<ManagerChat />} />',
  ''
);

// We need to add the correct routing near the bottom.
c = c.replace(
  '<Route path="manager/contact" element={<RentalContact />} />\n          <Route path="manager/chat" element={<ManagerChat />} />',
  '<Route path="manager/contact" element={<RentalContact />} />\n          <Route path="manager/chat" element={<ManagerChat />} />'
);

if (!c.includes('<Route path="manager/chat" element={<ManagerChat />} />')) {
  c = c.replace(
    '<Route path="manager/contact" element={<RentalContact />} />',
    '<Route path="manager/contact" element={<RentalContact />} />\n          <Route path="manager/chat" element={<ManagerChat />} />'
  );
}


fs.writeFileSync(path, c);

const bPath = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\board\\\\BoardDashboard.jsx';
let bc = fs.readFileSync(bPath, 'utf8');
if (!bc.includes('ManagerChat')) {
  bc = bc.replace(
    "import styles from './BoardDashboard.module.css';",
    "import ManagerChat from '../../components/ManagerChat';\nimport styles from './BoardDashboard.module.css';"
  );
  bc = bc.replace(
    "      ] }\n  ];",
    "      ] },\n    { type: 'divider' },\n    { label: 'Setting Contact', icon: 'settings', children: [{ label: 'Chat', path: '/board/chat', icon: 'message-circle', color: '#6B8E23' }] }\n  ];"
  );
  bc = bc.replace(
    '<Route path="/" element={<Navigate to="overview" replace />} />',
    '<Route path="chat" element={<ManagerChat />} />\n            <Route path="/" element={<Navigate to="overview" replace />} />'
  );
  fs.writeFileSync(bPath, bc);
}

const gPath = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\general-store\\\\StoreDashboard.jsx';
let gc = fs.readFileSync(gPath, 'utf8');
if (!gc.includes('ManagerChat')) {
  gc = gc.replace(
    "import StoreProfile from './StoreProfile';",
    "import StoreProfile from './StoreProfile';\nimport ManagerChat from '../../components/ManagerChat';"
  );
  gc = gc.replace(
    "{ label: 'Profile',         path: '/general-store/profile',      icon: 'user' },\n  ];",
    "{ label: 'Profile',         path: '/general-store/profile',      icon: 'user' },\n    { type: 'divider' },\n    { label: 'Setting Contact', icon: 'settings', children: [{ label: 'Chat', path: '/general-store/chat', icon: 'message-circle', color: '#6B8E23' }] }\n  ];"
  );
  gc = gc.replace(
    '<Route path="/" element={<Navigate to="overview" replace />} />',
    '<Route path="chat" element={<ManagerChat />} />\n            <Route path="/" element={<Navigate to="overview" replace />} />'
  );
  fs.writeFileSync(gPath, gc);
}

const phPath = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\pharmacy-store\\\\StoreDashboard.jsx';
let phc = fs.readFileSync(phPath, 'utf8');
if (!phc.includes('ManagerChat')) {
  phc = phc.replace(
    "import StoreProfile from './StoreProfile';",
    "import StoreProfile from './StoreProfile';\nimport ManagerChat from '../../components/ManagerChat';"
  );
  phc = phc.replace(
    "{ label: 'Profile',         path: '/pharmacy-store/profile',      icon: 'user' },\n  ];",
    "{ label: 'Profile',         path: '/pharmacy-store/profile',      icon: 'user' },\n    { type: 'divider' },\n    { label: 'Setting Contact', icon: 'settings', children: [{ label: 'Chat', path: '/pharmacy-store/chat', icon: 'message-circle', color: '#6B8E23' }] }\n  ];"
  );
  phc = phc.replace(
    '<Route path="/" element={<Navigate to="overview" replace />} />',
    '<Route path="chat" element={<ManagerChat />} />\n            <Route path="/" element={<Navigate to="overview" replace />} />'
  );
  fs.writeFileSync(phPath, phc);
}

const aPath = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\admin\\\\AdminDashboard.jsx';
let ac = fs.readFileSync(aPath, 'utf8');
if (!ac.includes('ManagerChat')) {
  ac = ac.replace(
    "import styles from './AdminDashboard.module.css';",
    "import ManagerChat from '../../components/ManagerChat';\nimport styles from './AdminDashboard.module.css';"
  );
  ac = ac.replace(
    "{ label: 'Contact Messages', path: '/admin/contact-messages', icon: 'message-circle' },",
    "{ label: 'Contact', icon: 'message-circle', children: [\n      { label: 'Contact Messages', path: '/admin/contact-messages', icon: 'inbox' },\n      { label: 'Chat', path: '/admin/chat', icon: 'message-square', color: '#6B8E23' }\n    ] },"
  );
  ac = ac.replace(
    '<Route path="contact-messages" element={<ContactMessages />} />',
    '<Route path="contact-messages" element={<ContactMessages />} />\n            <Route path="chat" element={<ManagerChat />} />'
  );
  fs.writeFileSync(aPath, ac);
}

const hPath = 'd:\\\\SUTANA\\\\frontend\\\\src\\\\pages\\\\hr\\\\HRDashboard.jsx';
let hc = fs.readFileSync(hPath, 'utf8');
if (!hc.includes('ManagerChat')) {
  hc = hc.replace(
    "import HRContact from './HRContact';",
    "import HRContact from './HRContact';\nimport ManagerChat from '../../components/ManagerChat';"
  );
  hc = hc.replace(
    "{ label: 'Setting Contact',  path: '/hr/settings-contact', icon: 'settings' },",
    "{ label: 'Setting Contact', icon: 'settings', children: [\n      { label: 'Contact Settings', path: '/hr/settings-contact', icon: 'settings' },\n      { label: 'Chat', path: '/hr/chat', icon: 'message-circle', color: '#6B8E23' }\n    ] },"
  );
  hc = hc.replace(
    '<Route path="settings-contact"    element={<HRContact />} />',
    '<Route path="settings-contact"    element={<HRContact />} />\n      <Route path="chat"                element={<ManagerChat />} />'
  );
  hc = hc.replace(
    "'/hr/settings-contact',",
    "'/hr/settings-contact',\n    '/hr/chat',"
  );
  fs.writeFileSync(hPath, hc);
}

console.log('Fixed scripts via js');
