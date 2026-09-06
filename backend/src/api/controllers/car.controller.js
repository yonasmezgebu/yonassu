const carRepository = require('../../repositories/car.repository');
const CarModel = require('../../models/Car.model');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');

exports.getAllCarsPublic = async (req, res) => {
  try {
    const { db } = require('../../config/database');
    const cars = await db('cars').whereNull('deleted_at').orderBy('created_at', 'desc');

    // Release dates come from the current rentals (the same schedule the Car
    // Rental manager dashboard tracks). For each damaged-out/booked car we
    // surface the latest expected return date so customers see when it frees up.
    const releaseRows = await db('rental_orders')
      .whereNull('deleted_at')
      .whereNotIn('status', ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED', 'ABANDONED'])
      .whereIn('car_id', cars.map(c => c.id))
      .select('car_id', db.raw('MAX(COALESCE(extended_return_date, return_date)) as release_date'))
      .groupBy('car_id');
    const releaseByCar = {};
    releaseRows.forEach(r => { releaseByCar[r.car_id] = r.release_date; });

    const CarModel = require('../../models/Car.model');
    const data = cars.map(car => {
      const json = CarModel.fromDatabase(car).toJSON();
      json.bookingEndDate = releaseByCar[car.id] || null;
      return json;
    });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    logger.error('Error fetching public cars:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch vehicles' });
  }
};

exports.getAllCarsManager = async (req, res) => {
  try {
    const cars = await carRepository.findAll({});
    res.status(200).json({
      status: 'success',
      data: cars.map(car => car.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching manager cars:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch vehicles' });
  }
};

exports.createCar = async (req, res) => {
  try {
    const carModel = CarModel.fromRequest(req.body);
    
    if (req.files) {
      if (req.files.image1) carModel.image1 = `/uploads/cars/${req.files.image1[0].filename}`;
      if (req.files.image2) carModel.image2 = `/uploads/cars/${req.files.image2[0].filename}`;
      if (req.files.image3) carModel.image3 = `/uploads/cars/${req.files.image3[0].filename}`;
      if (req.files.image4) carModel.image4 = `/uploads/cars/${req.files.image4[0].filename}`;
    }

    const validation = carModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToInsert = {
      name: carModel.name,
      daily_rate: carModel.dailyRate,
      seats: carModel.seats,
      transmission: carModel.transmission,
      fuel_type: carModel.fuelType,
      car_type: carModel.carType,
      description: carModel.description,
      availability: carModel.availability,
      image1: carModel.image1,
      image2: carModel.image2,
      image3: carModel.image3,
      image4: carModel.image4,
      deleted_at: req.body.visibility === 'internal' ? new Date() : null
    };

    const newCar = await carRepository.createAndReturn(dataToInsert);
    carRentalAudit.log(req, 'Car Created', newCar.name || `Car #${newCar.id}`, null, dataToInsert);
    res.status(201).json({ status: 'success', data: CarModel.fromDatabase(newCar).toJSON() });
  } catch (error) {
    logger.error('Error creating car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create vehicle' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    if (!existingCar) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const carModel = CarModel.fromRequest({ ...existingCar.toJSON(), ...req.body });

    if (req.files) {
      if (req.files.image1) carModel.image1 = `/uploads/cars/${req.files.image1[0].filename}`;
      if (req.files.image2) carModel.image2 = `/uploads/cars/${req.files.image2[0].filename}`;
      if (req.files.image3) carModel.image3 = `/uploads/cars/${req.files.image3[0].filename}`;
      if (req.files.image4) carModel.image4 = `/uploads/cars/${req.files.image4[0].filename}`;
    }

    const validation = carModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToUpdate = {
      name: carModel.name,
      daily_rate: carModel.dailyRate,
      seats: carModel.seats,
      transmission: carModel.transmission,
      fuel_type: carModel.fuelType,
      car_type: carModel.carType,
      description: carModel.description,
      availability: carModel.availability,
      ...(carModel.image1 && { image1: carModel.image1 }),
      ...(carModel.image2 && { image2: carModel.image2 }),
      ...(carModel.image3 && { image3: carModel.image3 }),
      ...(carModel.image4 && { image4: carModel.image4 })
    };

    const updatedCar = await carRepository.updateAndReturn(id, dataToUpdate);
    carRentalAudit.log(req, 'Car Updated', existingCar.name || `Car #${id}`, existingCar.toJSON(), updatedCar.toJSON());
    res.status(200).json({ status: 'success', data: CarModel.fromDatabase(updatedCar).toJSON() });
  } catch (error) {
    logger.error('Error updating car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update vehicle' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    if (!existingCar) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    await carRepository.softDelete(id);
    carRentalAudit.log(req, 'Car Deleted', existingCar.name || `Car #${id}`, existingCar.toJSON(), null);
    res.status(200).json({ status: 'success', message: 'Vehicle deleted successfully' });
  } catch (error) {
    logger.error('Error deleting car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete vehicle' });
  }
};

exports.restoreCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    await carRepository.restore(id);
    carRentalAudit.log(req, 'Car Restored', existingCar?.name || `Car #${id}`, null, { restored: true });
    res.status(200).json({ status: 'success', message: 'Vehicle restored successfully' });
  } catch (error) {
    logger.error('Error restoring car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore vehicle' });
  }
};

exports.hardDeleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    if (!existingCar) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }
    await carRepository.delete(id);
    carRentalAudit.log(req, 'Car Permanently Deleted', existingCar.name || `Car #${id}`, existingCar.toJSON(), null);
    res.status(200).json({ status: 'success', message: 'Vehicle permanently deleted' });
  } catch (error) {
    logger.error('Error in hardDeleteCar:', error);
    res.status(500).json({ status: 'error', message: 'Failed to permanently delete car' });
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
    const existingCar = await db('cars').where({ id }).first();
    await db('cars').where({ id }).update({ asset_value, updated_at: new Date() });
    carRentalAudit.log(req, 'Car Asset Value Updated', existingCar?.name || `Car #${id}`, { asset_value: existingCar?.asset_value ?? null }, { asset_value });
    
    res.status(200).json({ status: 'success', message: 'Asset value updated successfully' });
  } catch (error) {
    logger.error('Error updating asset value:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update asset value' });
  }
};
