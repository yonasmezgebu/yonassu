const { db } = require('../../config/database');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');
const { notifyWaitlistForTractor } = require('../../services/agriRentWaitlist.service');
const { sendCustomerNotification } = require('../../services/notification.service');

const VALID_STATUSES = ['waiting', 'notified', 'converted', 'removed'];

const normalizePhone = (p) => String(p || '').replace(/\D/g, '');
const isValidPhone = (p) => /^09\d{8}$/.test(normalizePhone(p));

// ── PUBLIC (authenticated customer): join the waitlist ────────────────────────
exports.joinWaitlist = async (req, res) => {
  try {
    const {
      tractorId, customerName, customerPhone, customerEmail, fieldLocation,
      fieldSizeHectares, farmingPurpose, preferredStartDate, preferredEndDate, message
    } = req.body;

    if (!tractorId) return res.status(400).json({ status: 'error', message: 'Please select a machine.' });
    const tractor = await db('tractors').where({ id: tractorId }).first();
    if (!tractor) return res.status(400).json({ status: 'error', message: 'The selected machine was not found.' });

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Your full name is required.' });
    }
    if (!customerPhone || !isValidPhone(customerPhone)) {
      return res.status(400).json({ status: 'error', message: 'A valid Ethiopian phone number (09xxxxxxxx) is required so we can call you.' });
    }

    // You can only join the list when the machine is NOT free — if it's bookable,
    // reserve it directly instead.
    if (tractor.availability === 'Available') {
      const freeNow = !(await db('agrirent_orders')
        .where({ tractor_id: tractorId })
        .whereIn('status', ['pending', 'approved', 'confirmed', 'active'])
        .whereNull('deleted_at')
        .select('id')
        .first());
      if (freeNow) {
        return res.status(400).json({ status: 'error', message: `"${tractor.name}" is available right now — please reserve it directly.` });
      }
    }

    // One active request per customer + machine.
    const dup = await db('agrirent_waitlist')
      .where({ user_id: req.user.id, tractor_id: tractorId, status: 'waiting' })
      .first();
    if (dup) {
      return res.status(400).json({ status: 'error', message: `You are already on the availability list for "${tractor.name}". We will notify you as soon as it is free.` });
    }

    const [id] = await db('agrirent_waitlist').insert({
      tractor_id: tractorId,
      user_id: req.user.id,
      customer_name: String(customerName).trim(),
      customer_phone: normalizePhone(customerPhone),
      customer_email: customerEmail || req.user.email || null,
      field_location: fieldLocation || null,
      field_size_hectares: fieldSizeHectares || null,
      farming_purpose: farmingPurpose || null,
      preferred_start_date: preferredStartDate || null,
      preferred_end_date: preferredEndDate || null,
      message: message || null,
      status: 'waiting',
      created_at: new Date(),
      updated_at: new Date()
    });

    try {
      carRentalAudit.log(req, 'AgriRent waitlist join', tractor.id,
        null, { tractor: tractor.name, customer: String(customerName).trim() });
    } catch (e) { /* non-fatal */ }

    try {
      const notificationRepository = require('../../repositories/notification.repository');
      await notificationRepository.create({
        roleTarget: 'Car Renting Manager',
        title: '🔔 New availability request',
        message: `${String(customerName).trim()} wants "${tractor.name}" (${normalizePhone(customerPhone)}${customerEmail ? ', ' + customerEmail : ''}). ${message ? `Message: ${message}` : 'No message.'}`,
        type: 'general',
        link: '/car-renting/manager/agri-orders'
      });
    } catch (e) { console.error('[WAITLIST NOTIFY]', e.message); }

    res.status(201).json({
      status: 'success',
      message: 'You have been added to the availability list. We will call and notify you the moment the machine is free.',
      data: { id, status: 'waiting', tractorName: tractor.name }
    });
  } catch (error) {
    logger.error('Error joining AgriRent waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add you to the availability list' });
  }
};

// ── CUSTOMER: my waitlist entries ─────────────────────────────────────────────
exports.myWaitlist = async (req, res) => {
  try {
    const rows = await db('agrirent_waitlist as w')
      .leftJoin('tractors as t', 'w.tractor_id', 't.id')
      .where('w.user_id', req.user.id)
      .whereNot('w.status', 'removed')
      .orderBy('w.created_at', 'desc')
      .select(
        'w.id', 'w.tractor_id', 'w.customer_name', 'w.customer_phone', 'w.customer_email',
        'w.field_location', 'w.field_size_hectares', 'w.farming_purpose',
        'w.preferred_start_date', 'w.preferred_end_date', 'w.message',
        'w.status', 'w.notified_at', 'w.converted_at', 'w.created_at',
        't.name as tractor_name'
      );
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    logger.error('Error fetching my AgriRent waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load your availability list' });
  }
};

// ── MANAGER: list waitlist entries ────────────────────────────────────────────
exports.listWaitlist = async (req, res) => {
  try {
    const { status, tractorId, search } = req.query;

    let q = db('agrirent_waitlist as w')
      .leftJoin('tractors as t', 'w.tractor_id', 't.id')
      .whereNot('w.status', 'removed')
      .orderByRaw(`array_position(ARRAY['waiting', 'notified', 'converted'], w.status) ASC, w.created_at DESC`);

    if (status && VALID_STATUSES.includes(status)) q = q.where('w.status', status);
    if (tractorId) q = q.where('w.tractor_id', tractorId);
    if (search) {
      q = q.where((b) => {
        b.where('w.customer_name', 'like', `%${search}%`)
          .orWhere('w.customer_phone', 'like', `%${search}%`)
          .orWhere('w.customer_email', 'like', `%${search}%`)
          .orWhere('w.message', 'like', `%${search}%`)
          .orWhere('t.name', 'like', `%${search}%`);
      });
    }

    const rows = await q.limit(200).select(
      'w.id', 'w.tractor_id', 'w.user_id', 'w.customer_name', 'w.customer_phone', 'w.customer_email',
      'w.field_location', 'w.field_size_hectares', 'w.farming_purpose',
      'w.preferred_start_date', 'w.preferred_end_date', 'w.message',
      'w.status', 'w.notified_at', 'w.converted_at', 'w.converted_order_id',
      'w.created_at', 't.name as tractor_name', 't.availability as tractor_availability',
      't.asset_value as tractor_asset_value'
    );

    const counts = await db('agrirent_waitlist').whereNot('status', 'removed')
      .select('status').count('* as total').groupBy('status')
      .then(rows2 => rows2.reduce((a, r) => ({ ...a, [r.status]: Number(r.total) }), {}));
    const waitingTotal = Number(counts.waiting || 0);

    res.status(200).json({ status: 'success', data: rows, counts: { waiting: waitingTotal } });
  } catch (error) {
    logger.error('Error listing AgriRent waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load availability requests' });
  }
};

// ── MANAGER: update an entry (notify / convert / remove) ──────────────────────
exports.updateWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, convertedOrderId, convertedOrderNumber } = req.body;

    const entry = await db('agrirent_waitlist').where({ id }).first();
    if (!entry) return res.status(404).json({ status: 'error', message: 'Availability request not found' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const updateData = { status, updated_at: new Date() };
    if (status === 'notified') updateData.notified_at = new Date();
    if (status === 'converted') {
      updateData.converted_at = new Date();
      if (convertedOrderId) updateData.converted_order_id = convertedOrderId;
    }
    if (status === 'removed') updateData.removed_at = new Date();

    await db('agrirent_waitlist').where({ id }).update(updateData);

    // Customer hears about it when the manager converts / manually notifies.
    if (entry.user_id && ['notified', 'converted'].includes(status)) {
      try {
        const tractor = await db('tractors').where({ id: entry.tractor_id }).first();
        await sendCustomerNotification({
          user_id: entry.user_id,
          title: status === 'converted' ? '✅ Your machine is reserved' : `🚜 ${tractor ? tractor.name : 'Your machine'} is available`,
          message: status === 'converted'
            ? `Great news — your reservation order ${convertedOrderNumber ? `(${convertedOrderNumber}) ` : ''}has been created for ${tractor ? tractor.name : 'your machine'}.`
            : `The machine you asked about is now free. Our team is reaching out, or reserve it online now.`,
          type: 'agri',
          link: status === 'converted' ? '/customer/farming-orders' : '/services/farming'
        }, req.app?.get('io'));
      } catch (e) { /* non-fatal */ }
    }

    try {
      carRentalAudit.log(req, `AgriRent waitlist ${status}`, entry.id,
        { status: entry.status }, { status, convertedOrderId: convertedOrderId || null });
    } catch (e) { /* non-fatal */ }

    const updated = await db('agrirent_waitlist').where({ id }).first();
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating AgriRent waitlist entry:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update availability request' });
  }
};

// ── MANAGER: delete an entry ──────────────────────────────────────────────────
exports.deleteWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await db('agrirent_waitlist').where({ id }).first();
    if (!entry) return res.status(404).json({ status: 'error', message: 'Availability request not found' });

    await db('agrirent_waitlist').where({ id }).del();

    try {
      carRentalAudit.log(req, 'AgriRent waitlist delete', entry.id,
        { status: entry.status }, null);
    } catch (e) { /* non-fatal */ }

    res.status(200).json({ status: 'success', message: 'Availability request removed' });
  } catch (error) {
    logger.error('Error deleting AgriRent waitlist entry:', error);
    res.status(500).json({ status: 'error', message: 'Failed to remove availability request' });
  }
};