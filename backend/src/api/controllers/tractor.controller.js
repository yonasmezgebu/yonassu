const tractorRepository = require('../../repositories/tractor.repository');
const TractorModel = require('../../models/Tractor.model');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');

exports.getAllTractorsPublic = async (req, res) => {
  try {
    const { db } = require('../../config/database');
    const tractors = await db('tractors').whereNull('deleted_at').orderBy('created_at', 'desc');

    // Release dates come from the active AgriRent orders (the same schedule the
    // Car Renting/AgriRent manager dashboard tracks). For each Booked machine we
    // surface the latest hire end date so customers see when it will be free.
    const releaseRows = await db('agrirent_orders')
      .whereNull('deleted_at')
      .whereNotIn('status', ['completed', 'cancelled', 'rejected'])
      .whereIn('tractor_id', tractors.map(t => t.id))
      .select('tractor_id')
      .max('end_date as release_date')
      .groupBy('tractor_id');
    const releaseByTractor = {};
    releaseRows.forEach(r => { releaseByTractor[r.tractor_id] = r.release_date; });

    const TractorModel = require('../../models/Tractor.model');
    const data = tractors.map(t => {
      const json = TractorModel.fromDatabase(t).toJSON();
      json.bookingEndDate = releaseByTractor[t.id] || null;
      return json;
    });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    logger.error('Error fetching public tractors:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tractors' });
  }
};

exports.getAllTractorsManager = async (req, res) => {
  try {
    const tractors = await tractorRepository.findAll({});
    res.status(200).json({
      status: 'success',
      data: tractors.map(t => t.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching manager tractors:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tractors' });
  }
};

exports.createTractor = async (req, res) => {
  try {
    const tractorModel = TractorModel.fromRequest(req.body);
    
    if (req.files) {
      if (req.files.image1) tractorModel.image1 = `/uploads/cars/${req.files.image1[0].filename}`;
      if (req.files.image2) tractorModel.image2 = `/uploads/cars/${req.files.image2[0].filename}`;
      if (req.files.image3) tractorModel.image3 = `/uploads/cars/${req.files.image3[0].filename}`;
      if (req.files.image4) tractorModel.image4 = `/uploads/cars/${req.files.image4[0].filename}`;
    }

    const validation = tractorModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToInsert = {
      name: tractorModel.name,
      daily_rate: tractorModel.dailyRate,
      transmission: tractorModel.transmission,
      fuel_type: tractorModel.fuelType,
      tractor_type: tractorModel.tractorType,
      description: tractorModel.description,
      availability: tractorModel.availability,
      image1: tractorModel.image1,
      image2: tractorModel.image2,
      image3: tractorModel.image3,
      image4: tractorModel.image4,
      deleted_at: req.body.visibility === 'internal' ? new Date() : null
    };

    const newTractor = await tractorRepository.createAndReturn(dataToInsert);
    carRentalAudit.log(req, 'Tractor Created', newTractor.name || `Tractor #${newTractor.id}`, null, dataToInsert);
    res.status(201).json({ status: 'success', data: TractorModel.fromDatabase(newTractor).toJSON() });
  } catch (error) {
    logger.error('Error creating tractor:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create tractor' });
  }
};

exports.updateTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTractor = await tractorRepository.findById(id);
    if (!existingTractor) {
      return res.status(404).json({ status: 'error', message: 'Tractor not found' });
    }

    const tractorModel = TractorModel.fromRequest({ ...existingTractor.toJSON(), ...req.body });

    if (req.files) {
      if (req.files.image1) tractorModel.image1 = `/uploads/cars/${req.files.image1[0].filename}`;
      if (req.files.image2) tractorModel.image2 = `/uploads/cars/${req.files.image2[0].filename}`;
      if (req.files.image3) tractorModel.image3 = `/uploads/cars/${req.files.image3[0].filename}`;
      if (req.files.image4) tractorModel.image4 = `/uploads/cars/${req.files.image4[0].filename}`;
    }

    const validation = tractorModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToUpdate = {
      name: tractorModel.name,
      daily_rate: tractorModel.dailyRate,
      transmission: tractorModel.transmission,
      fuel_type: tractorModel.fuelType,
      tractor_type: tractorModel.tractorType,
      description: tractorModel.description,
      availability: tractorModel.availability,
      ...(tractorModel.image1 && { image1: tractorModel.image1 }),
      ...(tractorModel.image2 && { image2: tractorModel.image2 }),
      ...(tractorModel.image3 && { image3: tractorModel.image3 }),
      ...(tractorModel.image4 && { image4: tractorModel.image4 })
    };

    const updatedTractor = await tractorRepository.updateAndReturn(id, dataToUpdate);
    carRentalAudit.log(req, 'Tractor Updated', existingTractor.name || `Tractor #${id}`, existingTractor.toJSON(), updatedTractor.toJSON());
    res.status(200).json({ status: 'success', data: TractorModel.fromDatabase(updatedTractor).toJSON() });
  } catch (error) {
    logger.error('Error updating tractor:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update tractor' });
  }
};

exports.deleteTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTractor = await tractorRepository.findById(id);
    if (!existingTractor) {
      return res.status(404).json({ status: 'error', message: 'Tractor not found' });
    }

    await tractorRepository.softDelete(id);
    carRentalAudit.log(req, 'Tractor Deleted', existingTractor.name || `Tractor #${id}`, existingTractor.toJSON(), null);
    res.status(200).json({ status: 'success', message: 'Tractor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting tractor:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete tractor' });
  }
};

exports.restoreTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTractor = await tractorRepository.findById(id);
    await tractorRepository.restore(id);
    carRentalAudit.log(req, 'Tractor Restored', existingTractor?.name || `Tractor #${id}`, null, { restored: true });
    res.status(200).json({ status: 'success', message: 'Tractor restored successfully' });
  } catch (error) {
    logger.error('Error restoring tractor:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore tractor' });
  }
};

exports.hardDeleteTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTractor = await tractorRepository.findById(id);
    if (!existingTractor) {
      return res.status(404).json({ status: 'error', message: 'Tractor not found' });
    }
    await tractorRepository.delete(id);
    carRentalAudit.log(req, 'Tractor Permanently Deleted', existingTractor.name || `Tractor #${id}`, existingTractor.toJSON(), null);
    res.status(200).json({ status: 'success', message: 'Tractor permanently deleted' });
  } catch (error) {
    logger.error('Error in hardDeleteTractor:', error);
    res.status(500).json({ status: 'error', message: 'Failed to permanently delete tractor' });
  }
};

exports.updateAssetValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_value } = req.body;
    
    if (asset_value === undefined) {
      return res.status(400).json({ status: 'error', message: 'asset_value is required' });
    }

    const { db } = require('../../config/database');
    const existingTractor = await db('tractors').where({ id }).first();
    await db('tractors').where({ id }).update({ asset_value, updated_at: new Date() });
    carRentalAudit.log(req, 'Tractor Asset Value Updated', existingTractor?.name || `Tractor #${id}`, { asset_value: existingTractor?.asset_value ?? null }, { asset_value });
    
    res.status(200).json({ status: 'success', message: 'Asset value updated successfully' });
  } catch (error) {
    logger.error('Error updating asset value:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update asset value' });
  }
};
