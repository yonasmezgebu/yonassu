require('dotenv').config({ path: 'D:/SUTANA/backend/.env' });
const jwt = require('jsonwebtoken');
const config = require('./src/config/env');
const { db } = require('./src/config/database');
(async () => {
  try {
    const rows = await db('users as u')
      .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .whereNull('u.deleted_at')
      .where(function () {
        this.whereRaw("r.permissions LIKE '%purchase_orders:read%'")
          .orWhereLiteral ?? this;
      })
      .groupBy('u.id')
      .select('u.id', 'u.full_name', db.raw('GROUP_CONCAT(r.name) as roles'))
      .limit(3);
    console.log('candidates:', JSON.stringify(rows));
    const user = rows[0];
    if (!user) { console.log('NO USER'); return; }
    const token = jwt.sign({ userId: user.id, email: user.email, roles: [], permissions: [] }, config.jwt.secret, {
      expiresIn: 60, algorithm: config.jwt.algorithm || 'HS256', issuer: 'sutana-ems', audience: 'sutana-frontend'
    });
    console.log('TOKEN=' + token);
  } catch (e) { console.error('ERR', e.message); }
  await db.destroy();
})();
