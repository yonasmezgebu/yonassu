const { db } = require('../../config/database');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');
const { sendCustomerNotification } = require('../../services/notification.service');

const VALID_STATUSES = ['waiting', 'notified', 'converted', 'removed'];

const normalizePhone = (p) => String(p || '').replace(/\D/g, '');
const isValidPhone = (p) => /^09\d{8}$/.test(normalizePhone(p));

// ── PUBLIC (authenticated customer): join the waitlist ────────────────────────
exports.joinWaitlist = async (req, res) => {
  try {
    const {
      carId, customerName, customerPhone, customerEmail, driverName,
      driverLicense, pickupLocation, preferredStartDate, preferredEndDate, message
    } = req.body;

    if (!carId) return res.status(400).json({ status: 'error', message: 'Please select a vehicle.' });
    const car = await db('cars').where({ id: carId }).first();
    if (!car) return res.status(400).json({ status: 'error', message: 'The selected vehicle was not found.' });

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Your full name is required.' });
    }
    if (!customerPhone || !isValidPhone(customerPhone)) {
      return res.status(400).json({ status: 'error', message: 'A valid Ethiopian phone number (09xxxxxxxx) is required so we can call you.' });
    }

    // One active request per customer + car.
    const dup = await db('car_waitlist')
      .where({ user_id: req.user.id, car_id: carId, status: 'waiting' })
      .first();
    if (dup) {
      return res.status(400).json({ status: 'error', message: `You are already on the availability list for "${car.name}". We will notify you as soon as it is free.` });
    }

    const [id] = await db('car_waitlist').insert({
      car_id: carId,
      user_id: req.user.id,
      customer_name: String(customerName).trim(),
      customer_phone: normalizePhone(customerPhone),
      customer_email: customerEmail || req.user.email || null,
      driver_name: driverName || String(customerName).trim() || null,
      driver_license: driverLicense || null,
      pickup_location: pickupLocation || null,
      preferred_start_date: preferredStartDate || null,
      preferred_end_date: preferredEndDate || null,
      message: message || null,
      status: 'waiting',
      created_at: new Date(),
      updated_at: new Date()
    });

    try {
      carRentalAudit.log(req, 'Car Rental waitlist join', car.id,
        null, { car: car.name, customer: String(customerName).trim() });
    } catch (e) { /* non-fatal */ }

    try {
      const notificationRepository = require('../../repositories/notification.repository');
      await notificationRepository.create({
        roleTarget: 'Car Renting Manager',
        title: 'New availability request',
        message: `${String(customerName).trim()} wants "${car.name}" (${normalizePhone(customerPhone)}${customerEmail ? ', ' + customerEmail : ''}). ${message ? `Message: ${message}` : 'No message.'}`,
        type: 'general',
        link: '/car-renting/manager/orders'
      });
    } catch (e) { console.error('[CAR WAITLIST NOTIFY]', e.message); }

    res.status(201).json({
      status: 'success',
      message: car.availability === 'Available'
        ? `Your request for "${car.name}" was recorded. The vehicle is currently available — you can reserve it directly online too.`
        : 'You have been added to the availability list. We will call and notify you the moment the vehicle is free.',
      data: { id, status: 'waiting', carName: car.name, availability: car.availability }
    });
  } catch (error) {
    logger.error('Error joining car rental waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add you to the availability list' });
  }
};

// ── CUSTOMER: my waitlist entries ─────────────────────────────────────────────
exports.myWaitlist = async (req, res) => {
  try {
    const rows = await db('car_waitlist as w')
      .leftJoin('cars as c', 'w.car_id', 'c.id')
      .where('w.user_id', req.user.id)
      .whereNot('w.status', 'removed')
      .orderBy('w.created_at', 'desc')
      .select(
        'w.id', 'w.car_id', 'w.customer_name', 'w.customer_phone', 'w.customer_email',
        'w.driver_name', 'w.driver_license', 'w.pickup_location',
        'w.preferred_start_date', 'w.preferred_end_date', 'w.message',
        'w.status', 'w.notified_at', 'w.converted_at', 'w.created_at',
        'c.name as car_name', 'c.availability as car_availability',
        'c.daily_rate as car_daily_rate', 'c.image1 as car_image'
      );

    // Next free date — same schedule logic the fleet gallery shows
    // (latest expected return among live rentals).
    const releaseRows = await db('rental_orders')
      .whereNull('deleted_at')
      .whereNotIn('status', ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED', 'ABANDONED'])
      .whereIn('car_id', rows.map(r => r.car_id).filter(Boolean))
      .select('car_id', db.raw('MAX(COALESCE(extended_return_date, return_date)) as release_date'))
      .groupBy('car_id');
    const releaseByCar = {};
    releaseRows.forEach(r => { releaseByCar[r.car_id] = r.release_date; });

    const data = rows.map(r => ({ ...r,
      car_availability: r.car_availability || 'Available',
      bookingEndDate: releaseByCar[r.car_id] || null
    }));

    res.status(200).json({ status: 'success', data });
  } catch (error) {
    logger.error('Error fetching my car rental waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load your availability list' });
  }
};

// ── MANAGER: list waitlist entries ────────────────────────────────────────────
exports.listWaitlist = async (req, res) => {
  try {
    const { status, carId, search } = req.query;

    let q = db('car_waitlist as w')
      .leftJoin('cars as c', 'w.car_id', 'c.id')
      .whereNot('w.status', 'removed')
      .orderByRaw(`array_position(ARRAY['waiting', 'notified', 'converted'], w.status) ASC, w.created_at DESC`);

    if (status && VALID_STATUSES.includes(status)) q = q.where('w.status', status);
    if (carId) q = q.where('w.car_id', carId);
    if (search) {
      q = q.where((b) => {
        b.where('w.customer_name', 'like', `%${search}%`)
          .orWhere('w.customer_phone', 'like', `%${search}%`)
          .orWhere('w.customer_email', 'like', `%${search}%`)
          .orWhere('w.message', 'like', `%${search}%`)
          .orWhere('c.name', 'like', `%${search}%`);
      });
    }

    const rows = await q.limit(200).select(
      'w.id', 'w.car_id', 'w.user_id', 'w.customer_name', 'w.customer_phone', 'w.customer_email',
      'w.driver_name', 'w.driver_license', 'w.pickup_location',
      'w.preferred_start_date', 'w.preferred_end_date', 'w.message',
      'w.status', 'w.notified_at', 'w.converted_at', 'w.converted_order_id',
      'w.created_at', 'c.name as car_name', 'c.availability as car_availability',
      'c.daily_rate as car_daily_rate'
    );

    const counts = await db('car_waitlist').whereNot('status', 'removed')
      .select('status').count('* as total').groupBy('status')
      .then(rows2 => rows2.reduce((a, r) => ({ ...a, [r.status]: Number(r.total) }), {}));
    const waitingTotal = Number(counts.waiting || 0);

    res.status(200).json({ status: 'success', data: rows, counts: { waiting: waitingTotal } });
  } catch (error) {
    logger.error('Error listing car rental waitlist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load availability requests' });
  }
};

// ── MANAGER: update an entry (notify / convert / remove) ──────────────────────
exports.updateWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, convertedOrderId, convertedOrderNumber } = req.body;

    const entry = await db('car_waitlist').where({ id }).first();
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

    await db('car_waitlist').where({ id }).update(updateData);

    // Customer hears about it when the manager converts / manually notifies.
    if (entry.user_id && ['notified', 'converted'].includes(status)) {
      try {
        const car = await db('cars').where({ id: entry.car_id }).first();
        await sendCustomerNotification({
          user_id: entry.user_id,
          title: status === 'converted' ? 'Your car is reserved' : `${car ? car.name : 'Your vehicle'} is now available`,
          message: status === 'converted'
            ? `Great news — your reservation order ${convertedOrderNumber ? `(${convertedOrderNumber}) ` : ''}has been created for ${car ? car.name : 'your vehicle'}.`
            : `The vehicle you asked about is now free. Our team is reaching out, or reserve it online now.`,
          type: 'car',
          link: status === 'converted' ? '/customer' : '/cars'
        }, req.app?.get('io'));
      } catch (e) { /* non-fatal */ }
    }

    try {
      carRentalAudit.log(req, `Car Rental waitlist ${status}`, entry.id,
        { status: entry.status }, { status, convertedOrderId: convertedOrderId || null });
    } catch (e) { /* non-fatal */ }

    const updated = await db('car_waitlist').where({ id }).first();
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating car rental waitlist entry:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update availability request' });
  }
};

// ── MANAGER: delete an entry ──────────────────────────────────────────────────
exports.deleteWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await db('car_waitlist').where({ id }).first();
    if (!entry) return res.status(404).json({ status: 'error', message: 'Availability request not found' });

    await db('car_waitlist').where({ id }).del();

    try {
      carRentalAudit.log(req, 'Car Rental waitlist delete', entry.id,
        { status: entry.status }, null);
    } catch (e) { /* non-fatal */ }

    res.status(200).json({ status: 'success', message: 'Availability request removed' });
  } catch (error) {
    logger.error('Error deleting car rental waitlist entry:', error);
    res.status(500).json({ status: 'error', message: 'Failed to remove availability request' });
  }
};