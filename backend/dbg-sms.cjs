const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' });
  const [s] = await c.query("SELECT integration_key, username_cfg FROM (SELECT integration_key, JSON_EXTRACT(config, '$.username') AS username_cfg FROM integration_settings) t WHERE integration_key='sms'");
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });