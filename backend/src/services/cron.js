const cron = require('node-cron');
const { db } = require('../config/database');
const { logger, audit } = require('../config/logger');

// ─── Daily Cleanup — Runs every day at midnight ───────────────────────────────
cron.schedule('0 0 * * *', async () => {
  logger.info('Running auto-cleanup job...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // FIX: select only 'id' — no need to load full user rows (passwords etc.)
    // into memory just to get the IDs for deletion.
    const deletedUsers = await db('users')
      .whereNotNull('deleted_at')
      .andWhere('deleted_at', '<', thirtyDaysAgo)
      .select('id');

    if (deletedUsers.length > 0) {
      const userIds = deletedUsers.map(u => u.id);

      // FIX: wrap all deletes in a transaction so they are atomic —
      // if any step fails, nothing is partially deleted.
      await db.transaction(async (trx) => {
        await trx('sessions').whereIn('user_id', userIds).delete();
        await trx('user_roles').whereIn('user_id', userIds).delete();
        await trx('password_history').whereIn('user_id', userIds).delete();
        const deletedCount = await trx('users').whereIn('id', userIds).delete();

        await audit('SYSTEM_CLEANUP', null, {
          ip: '127.0.0.1',
          details: { action: 'permanent_delete', count: deletedCount, users: userIds }
        });
        logger.info(`Auto-cleanup: permanently deleted ${deletedCount} user(s).`);
      });
    } else {
      logger.info('Auto-cleanup: no expired soft-deleted users found.');
    }
  } catch (error) {
    logger.error('Error during auto-cleanup:', error.message);
  }
});

// ─── Tender Deadline Notification — Runs every 5 minutes (was every minute) ──
// FIX: changed from '* * * * *' to '*/5 * * * *'. Running every minute added
// constant DB load with no benefit — tenders don't expire to-the-second.
const notificationService = require('./notification.service');

cron.schedule('*/5 * * * *', async () => {
  try {
    // FIX: added LIMIT 50 to prevent one huge batch from blocking the event loop.
    const expiredTenders = await db('tenders')
      .where('status', 'open')
      .where('deadline_notified', false)
      .where('deadline', '<=', new Date())
      .select('id', 'reference_number')
      .limit(50);

    if (expiredTenders.length === 0) return;

    for (const tender of expiredTenders) {
      await db('tenders').where({ id: tender.id }).update({
        deadline_notified: true,
        updated_at: db.fn.now()
      });

      const msg = `Tender ${tender.reference_number || tender.id} has reached its deadline. Please review the bids and manually close or extend it.`;

      await notificationService.sendNotification('CEO', null, {
        type: 'TENDER_DEADLINE_REACHED',
        title: 'Tender Deadline Reached',
        message: msg,
        related_entity_id: tender.id,
      });

      await notificationService.sendNotification('Sales Manager', null, {
        type: 'TENDER_DEADLINE_REACHED',
        title: 'Tender Deadline Reached',
        message: msg,
        related_entity_id: tender.id,
      });
    }
    logger.info(`Tender cron: notified for ${expiredTenders.length} expired tender(s).`);
  } catch (error) {
    logger.error('Error in tender deadline notification job:', error.message);
  }
});

// ─── Public Smart-Tender Closing-Date Reminder — Runs every 5 minutes ────────
cron.schedule('*/5 * * * *', async () => {
  try {
    // FIX: added .select() with only needed columns + LIMIT to cap batch size.
    const expiredOpenTenders = await db('public_tenders')
      .where('status', 'published')
      .whereNotNull('closing_date')
      .where('closing_date', '<=', new Date())
      .select('id', 'tender_number', 'title')
      .limit(50);

    if (expiredOpenTenders.length === 0) return;

    for (const tender of expiredOpenTenders) {
      await notificationService.sendNotification('Purchase Manager', null, {
        type: 'TENDER_CLOSING_DATE_PASSED',
        title: '⏰ Tender Closing Date Passed — Still Open',
        message: `Tender ${tender.tender_number || `TND-${tender.id}`} "${tender.title}" has passed its closing date and is still open for bids. Please evaluate the bids and CLOSE it, or UPDATE its opening/closing dates to keep it open.`,
        related_entity_id: tender.id,
        link: `/purchase/smart-tenders?viewTender=${tender.id}`
      });
    }

    logger.info(`Running finance cron tasks... sent closing-date reminders for ${expiredOpenTenders.length} open smart tender(s).`);
  } catch (error) {
    logger.error('Error during finance cron tasks:', error.message);
  }
});
