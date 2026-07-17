const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const envPath = path.join(__dirname, '../.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (!envContent.includes('VAPID_PUBLIC_KEY')) {
  envContent += `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('VAPID keys generated and appended to .env');
} else {
  console.log('VAPID keys already exist in .env');
}
