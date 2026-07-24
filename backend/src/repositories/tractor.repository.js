const BaseRepository = require('./base.repository');
const TractorModel = require('../models/Tractor.model');

class TractorRepository extends BaseRepository {
  constructor() {
    super('tractors');
  }

  async findAll(options = {}) {
    const result = await super.findAll({ ...options, orderBy: 'created_at', orderDirection: 'desc' });
    return result.map(tractor => TractorModel.fromDatabase(tractor));
  }

  async findById(id) {
    const tractor = await super.findById(id);
    return tractor ? TractorModel.fromDatabase(tractor) : null;
  }
}

module.exports = new TractorRepository();
