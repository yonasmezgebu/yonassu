const cron = require('node-cron');
const { db } = require('../config/database');
const { audit } = require('../config/logger');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cleanup cron job...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Hard delete users soft-deleted more than 30 days ago
    const deletedUsers = await db('users')
      .whereNotNull('deleted_at')
      .andWhere('deleted_at', '<', thirtyDaysAgo);

    if (deletedUsers.length > 0) {
      const userIds = deletedUsers.map(u => u.id);
      
      // Delete their dependencies first (or rely on CASCADE if setup)
      await db('sessions').whereIn('user_id', userIds).delete();
      await db('user_roles').whereIn('user_id', userIds).delete();
      await db('password_history').whereIn('user_id', userIds).delete();
      
      // Finally delete the users
      const deletedCount = await db('users').whereIn('id', userIds).delete();
      
      await audit('SYSTEM_CLEANUP', null, { 
        ip: '127.0.0.1', 
        details: { action: 'permanent_delete', count: deletedCount, users: userIds } 
      });
      console.log(`Permanently deleted ${deletedCount} users.`);
    }
  } catch (error) {
    console.error('Error in daily cleanup cron job:', error);
  }
});

// ─── Tender Deadline Notification Job — Runs every minute ───────────────────────────
const notificationService = require('./notification.service');

cron.schedule('* * * * *', async () => {
  try {
    // Find all 'open' tenders whose deadline has passed and haven't been notified yet
    const expiredTenders = await db('tenders')
      .where('status', 'open')
      .where('deadline_notified', false)
      .where('deadline', '<=', new Date());

    if (expiredTenders.length === 0) return;

    for (const tender of expiredTenders) {
      // Mark as notified so we don't spam
      await db('tenders').where({ id: tender.id }).update({ deadline_notified: true, updated_at: db.fn.now() });

      await notificationService.sendNotification('CEO', null, {
        type: 'TENDER_DEADLINE_REACHED',
        title: 'Tender Deadline Reached',
        message: `Tender ${tender.reference_number || tender.id} has reached its deadline. Please review the bids and manually close or extend it.`,
        related_entity_id: tender.id,
      });

      await notificationService.sendNotification('Sales Manager', null, {
        type: 'TENDER_DEADLINE_REACHED',
        title: 'Tender Deadline Reached',
        message: `Tender ${tender.reference_number || tender.id} has reached its deadline. Please review the bids and manually close or extend it.`,
        related_entity_id: tender.id,
      });
    }
  } catch (error) {
    console.error('Error in tender deadline notification job:', error);
  }
});

// ─── Public Smart-Tender Closing-Date Reminder — Runs every 5 minutes ───────
// Owned by the Purchase Manager (Tender & Bid Hub). Unlike the job above, this
// keeps re-notifying while the tender is still open past its closing date until
// the manager CLOSES it or UPDATES its dates.
cron.schedule('*/5 * * * *', async () => {
  try {
    const expiredOpenTenders = await db('public_tenders')
      .where('status', 'published')
      .whereNotNull('closing_date')
      .where('closing_date', '<=', new Date());

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

    console.log(`Sent closing-date reminders for ${expiredOpenTenders.length} open smart tender(s).`);
  } catch (error) {
    console.error('Error in public tender closing-date reminder job:', error);
  }
});
