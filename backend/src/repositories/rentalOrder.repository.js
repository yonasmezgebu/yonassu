const BaseRepository = require('./base.repository');
const RentalOrder = require('../models/RentalOrder.model');
const { db } = require('../config/database');

class RentalOrderRepository extends BaseRepository {
  constructor() {
    super('rental_orders');
  }

  async findAll(options = {}) {
    const { filters = {}, status, archived } = options;
    try {
      let query = db('rental_orders as ro')
        .leftJoin('cars as c', 'ro.car_id', 'c.id')
        .select(
          'ro.*',
          'c.name as car_name',
          'c.image1 as car_image',
          'c.fuel_type as car_fuel_type',
          'c.transmission as car_transmission',
          'c.seats as car_seats'
        )
        .whereNull('ro.deleted_at')
        .modify((q) => {
          if (archived) q.whereNotNull('ro.archived_at');
          else q.whereNull('ro.archived_at');
        })
        .orderBy('ro.created_at', 'desc');

      if (status) query = query.where('ro.status', status);
      if (filters.paymentStatus) {
        if (Array.isArray(filters.paymentStatus)) {
          query = query.whereIn('ro.payment_status', filters.paymentStatus);
        } else {
          query = query.where('ro.payment_status', filters.paymentStatus);
        }
      }
      if (filters.customerId || filters.customerEmail) {
        query = query.where(function () {
          if (filters.customerId) this.where('ro.customer_id', filters.customerId);
          if (filters.customerEmail) this.orWhere('ro.customer_email', filters.customerEmail);
        });
      }

      const rows = await query;
      return rows.map(r => RentalOrder.fromDatabase(r));
    } catch (err) {
      throw err;
    }
  }

  async findPendingFinanceActions() {
    try {
      const rows = await db('rental_orders as ro')
        .leftJoin('cars as c', 'ro.car_id', 'c.id')
        .select('ro.*', 'c.name as car_name', 'c.image1 as car_image')
        .whereNull('ro.deleted_at')
        .andWhere(function() {
          this.where(function() {
            this.where('ro.status', 'APPROVED')
              .whereIn('ro.payment_status', ['UNPAID', 'PENDING_VERIFICATION']);
          })
          .orWhere('ro.additional_owed', '>', 0)
          .orWhere('ro.refund_amount', '>', 0);
        })
        .orderBy('ro.created_at', 'desc');
        
      return rows.map(r => RentalOrder.fromDatabase(r));
    } catch (err) {
      throw err;
    }
  }

  async findById(id, options = {}) {
    const row = await db('rental_orders as ro')
      .leftJoin('cars as c', 'ro.car_id', 'c.id')
      .select(
        'ro.*',
        'c.name as car_name',
        'c.image1 as car_image',
        'c.fuel_type as car_fuel_type',
        'c.transmission as car_transmission',
        'c.seats as car_seats'
      )
      .where('ro.id', id)
      .modify((q) => {
        if (options.includeArchived) q.whereNull('ro.deleted_at');
        else q.whereNull('ro.deleted_at').whereNull('ro.archived_at');
      })
      .first();
    return row ? RentalOrder.fromDatabase(row) : null;
  }

  async create(data) {
    const [id] = await db('rental_orders').insert(data);
    return this.findById(id);
  }

  async updateStatus(id, status, extraData = {}) {
    await db('rental_orders').where('id', id).update({ status, ...extraData, updated_at: db.fn.now() });
    return this.findById(id);
  }

  async update(id, data) {
    await db('rental_orders').where('id', id).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id);
  }
}

module.exports = new RentalOrderRepository();
