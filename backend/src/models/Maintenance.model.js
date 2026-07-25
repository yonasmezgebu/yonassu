const { db } = require('../config/database');

class Maintenance {
  static get tableName() {
    return 'car_renting_maintenance';
  }

  static async create(data) {
    const [id] = await db(this.tableName).insert(data);
    return this.findById(id);
  }

  static async findAll() {
    return db(this.tableName).orderBy('created_at', 'desc');
  }

  static async findById(id) {
    return db(this.tableName).where({ id }).first();
  }

  static async updateStatus(id, status) {
    await db(this.tableName).where({ id }).update({ status, updated_at: db.fn.now() });
    return this.findById(id);
  }
}

module.exports = Maintenance;
