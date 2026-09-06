const { db } = require('../config/database');
const { sendCustomerNotification } = require('./notification.service');
const { logger } = require('../config/logger');

// True when the machine can genuinely be reserved again: availability is back to
// 'Available' AND no order is still holding it (pending/approved/confirmed/active).
const isTractorActuallyFree = async (tractorId) => {
  try {
    const tractor = await db('tractors').where({ id: tractorId }).first();
    if (!tractor) return false;
    if (tractor.availability && tractor.availability !== 'Available') return false;
    const conflict = await db('agrirent_orders')
      .where({ tractor_id: tractorId })
      .whereIn('status', ['pending', 'approved', 'confirmed', 'active'])
      .whereNull('deleted_at')
      .select('id')
      .first();
    return !conflict;
  } catch (e) {
    logger.error('Failed to check waitlist availability:', e.message);
    return false;
  }
};

/**
 * A machine has just returned to 'Available'. Mark every still-waiting
 * waitlist entry for it as 'notified' and tell the customers (and, in one
 * combined call, the Car Renting / Agri Rental manager dashboard).
 */
const notifyWaitlistForTractor = async (tractorId, io = null) => {
  try {
    if (!tractorId) return 0;
    if (!(await isTractorActuallyFree(tractorId))) return 0;

    const tractor = await db('tractors').where({ id: tractorId }).first();
    const entries = await db('agrirent_waitlist')
      .where({ tractor_id: tractorId, status: 'waiting' })
      .orderBy('created_at', 'asc')
      .select('*');

    if (!entries.length) return 0;

    for (const entry of entries) {
      await db('agrirent_waitlist').where({ id: entry.id }).update({
        status: 'notified',
        notified_at: new Date(),
        updated_at: new Date()
      });

      if (entry.user_id) {
        try {
          await sendCustomerNotification({
            user_id: entry.user_id,
            title: `🚜 ${tractor ? tractor.name : 'Your machine'} is available`,
            message: `Good news! The machine you asked about is now free. Reserve it now or we can call you back.`,
            type: 'agri',
            link: '/services/farming'
          }, io);
        } catch (e) { /* non-fatal */ }
      }
    }

    try {
      const notificationRepository = require('../repositories/notification.repository');
      await notificationRepository.create({
        roleTarget: 'Car Renting Manager',
        title: '💚 Machine is available again',
        message: `${tractor ? tractor.name : 'A machine'} just returned to the yard. ${entries.length} customer(s) on the availability list should be contacted / converted to a walk-in order.`,
        type: 'general',
        link: '/car-renting/manager/agri-orders'
      });
    } catch (e) { /* non-fatal */ }

    logger.info(`Waitlist: notified ${entries.length} customer(s) — machine #${tractorId} available`);
    return entries.length;
  } catch (e) {
    logger.error('Failed to notify waitlist for tractor:', e.message);
    return 0;
  }
};

module.exports = { notifyWaitlistForTractor, isTractorActuallyFree };