// Attendance SRS alignment — Biometric & Card-Based Attendance
// Adds authentication method + terminal ip to etp_daily_attendance (SRS 5.1)
exports.up = async (knex) => {
  const hasTable = await knex.schema.hasTable('etp_daily_attendance');
  if (hasTable) {
    const hasMethod = await knex.schema.hasColumn('etp_daily_attendance', 'auth_method');
    if (!hasMethod) {
      await knex.schema.alterTable('etp_daily_attendance', (t) => {
        t.enu('auth_method', ['ashara', 'card', 'face']).nullable();
      });
    }
    const hasIp = await knex.schema.hasColumn('etp_daily_attendance', 'terminal_ip');
    if (!hasIp) {
      await knex.schema.alterTable('etp_daily_attendance', (t) => {
        t.string('terminal_ip', 45).nullable();
      });
    }
    await knex('etp_daily_attendance').whereNull('auth_method').update({ auth_method: 'ashara' });
  }
};

exports.down = async (knex) => {
  const hasTable = await knex.schema.hasTable('etp_daily_attendance');
  if (hasTable) {
    const hasMethod = await knex.schema.hasColumn('etp_daily_attendance', 'auth_method');
    if (hasMethod) await knex.schema.alterTable('etp_daily_attendance', (t) => t.dropColumn('auth_method'));
    const hasIp = await knex.schema.hasColumn('etp_daily_attendance', 'terminal_ip');
    if (hasIp) await knex.schema.alterTable('etp_daily_attendance', (t) => t.dropColumn('terminal_ip'));
  }
};