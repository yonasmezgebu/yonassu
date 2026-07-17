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

// ─── Tender Auto-Close Job — Runs every minute ───────────────────────────
// Per SRS Flow 2 Section 6: Tender closing MUST be server-side, not client-triggered.
const notificationService = require('./notification.service');

cron.schedule('* * * * *', async () => {
  try {
    // Find all OPEN tenders whose closing_at has passed
    const expiredTenders = await db('tenders')
      .where('status', 'OPEN')
      .where('deadline', '<=', new Date());

    if (expiredTenders.length === 0) return;

    for (const tender of expiredTenders) {
      // Count valid bids
      const validBids = await db('bids')
        .where({ tender_id: tender.id, is_valid: true })
        .orderBy('total_cost', 'asc');

      if (validBids.length === 0) {
        // No valid bids → EXPIRED
        await db('tenders').where({ id: tender.id }).update({ status: 'EXPIRED', updated_at: new Date() });
        await db('audit_logs').insert({
          entity_type: 'tenders',
          entity_id: tender.id,
          action: 'AUTO_EXPIRE',
          actor_id: 0, // system
          before_state: JSON.stringify({ status: 'OPEN' }),
          after_state: JSON.stringify({ status: 'EXPIRED' }),
        });

        await notificationService.sendNotification('CEO', null, {
          type: 'TENDER_EXPIRED',
          title: 'Tender Expired — No Valid Bids',
          message: `Tender ${tender.tender_code} closed with no valid bids. It must be reissued.`,
          related_entity_id: tender.id,
          link: `/ceo/purchase-flow/tenders/${tender.id}`,
        });
        await notificationService.sendNotification('Purchase Manager', null, {
          type: 'TENDER_EXPIRED',
          title: 'Tender Expired',
          message: `Tender ${tender.tender_code} expired with no valid bids. Please reissue a new tender.`,
          related_entity_id: tender.id,
          link: `/purchase/tenders/${tender.id}`,
        });
      } else {
        // Has valid bids → CLOSED, bids are already sorted low-to-high at read time
        await db('tenders').where({ id: tender.id }).update({ status: 'CLOSED', updated_at: new Date() });
        await db('audit_logs').insert({
          entity_type: 'tenders',
          entity_id: tender.id,
          action: 'AUTO_CLOSE',
          actor_id: 0,
          before_state: JSON.stringify({ status: 'OPEN' }),
          after_state: JSON.stringify({ status: 'CLOSED', valid_bid_count: validBids.length }),
        });

        const lowestBid = validBids[0];
        await notificationService.sendNotification('CEO', null, {
          type: 'TENDER_CLOSED',
          title: 'Tender Closed — Awaiting Award Decision',
          message: `Tender ${tender.tender_code} has closed with ${validBids.length} valid bid(s). Lowest bid: ETB ${lowestBid.total_cost}. Please review and award.`,
          related_entity_id: tender.id,
          link: `/ceo/purchase-flow/tenders/${tender.id}`,
        });
        await notificationService.sendNotification('Purchase Manager', null, {
          type: 'TENDER_CLOSED',
          title: 'Tender Closed',
          message: `Tender ${tender.tender_code} has closed with ${validBids.length} valid bid(s). Awaiting CEO award decision.`,
          related_entity_id: tender.id,
          link: `/purchase/tenders/${tender.id}`,
        });
      }
    }
  } catch (error) {
    console.error('Error in tender auto-close cron job:', error);
  }
});
