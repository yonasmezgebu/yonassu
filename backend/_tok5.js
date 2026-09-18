require('dotenv').config({ path: 'D:/SUTANA/backend/.env' });
const jwt = require('jsonwebtoken');
const config = require('./src/config/env');
const { db } = require('./src/config/database');
(async () => {
  const u = await db('users as u')
    .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
    .leftJoin('roles as r', 'r.id', 'ur.role_id')
    .where('r.name', 'Accountant')
    .whereNull('u.deleted_at')
    .select('u.id')
    .first();
  if (!u) { console.log('NO_ACCOUNTANT'); return; }
  const token = jwt.sign({ userId: u.id, email: 'acct' }, config.jwt.secret, { expiresIn: 300, algorithm: config.jwt.algorithm || 'HS256', issuer: 'sutana-ems', audience: 'sutana-frontend' });
  console.log(token);
  await db.destroy();
})();
