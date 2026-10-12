class RentalOrder {
  constructor(data = {}) {
    this.id = data.id || null;
    this.carId = data.car_id || data.carId || null;
    this.customerId = data.customer_id || data.customerId || null;
    this.orderNumber = data.order_number || data.orderNumber || null;
    this.customerName = data.customer_name || data.customerName || '';
    this.customerEmail = data.customer_email || data.customerEmail || '';
    this.customerPhone = data.customer_phone || data.customerPhone || '';
    this.driverName = data.driver_name || data.driverName || '';
    this.driverLicense = data.driver_license || data.driverLicense || '';
    this.pickupDate = data.pickup_date || data.pickupDate || null;
    this.returnDate = data.return_date || data.returnDate || null;
    this.totalDays = data.total_days || data.totalDays || 0;
    this.dailyRate = parseFloat(data.daily_rate || data.dailyRate || 0);
    this.rentalAmount = parseFloat(data.rental_amount || data.rentalAmount || 0);
    this.subtotal = parseFloat(data.subtotal || data.subtotal || 0);
    this.vatAmount = parseFloat(data.vat_amount || data.vatAmount || 0);
    this.securityDeposit = parseFloat(data.security_deposit || data.securityDeposit || 5000);
    this.totalAmount = parseFloat(data.total_amount || data.totalAmount || 0);
    this.paymentMethod = data.payment_method || data.paymentMethod || 'Cash';
    this.status = data.status || 'PENDING_APPROVAL';
    this.isManual = !!(data.is_manual || data.isManual);
    this.paymentStatus = data.payment_status || data.paymentStatus || 'UNPAID';
    this.paymentProofUrl = data.payment_proof_url || data.paymentProofUrl || null;
    this.paymentReference = data.payment_reference || data.paymentReference || '';
    this.financeNotes = data.finance_notes || data.financeNotes || '';
    this.verifiedAmount = data.verified_amount ? parseFloat(data.verified_amount) : null;
    this.verifiedBy = data.verified_by || data.verifiedBy || null;
    this.specialRequests = data.special_requests || data.specialRequests || '';
    this.managerNote = data.manager_note || data.managerNote || '';
    this.carCondition = data.car_condition || data.carCondition || null;
    this.conditionReason = data.condition_reason || data.conditionReason || null;
    this.pickupRemarks = data.pickup_remarks || data.pickupRemarks || '';
    this.pickupLocation = data.pickup_location || data.pickupLocation || '';
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.rejectedAt = data.rejected_at || data.rejectedAt || null;
    this.rentalStartTime = data.rental_start_time || data.rentalStartTime || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    // joined car info
    this.carName = data.car_name || data.carName || '';
    this.carImage = data.car_image || data.carImage || '';
    this.carBrand = data.car_brand || data.carBrand || '';
    this.carModel = data.car_model || data.carModel || '';
    this.carLicensePlate = data.car_license_plate || data.carLicensePlate || '';
    this.carFuelType = data.car_fuel_type || data.carFuelType || '';
    this.carTransmission = data.car_transmission || data.carTransmission || '';
    this.carSeats = data.car_seats || data.carSeats || null;
    if (!this.carName && (this.carBrand || this.carModel)) {
      this.carName = `${this.carBrand} ${this.carModel}`.trim();
    }
    // Lifecycle fields
    this.isCancellationRequested = !!(data.is_cancellation_requested || data.isCancellationRequested);
    this.cancellationReason = data.cancellation_reason || data.cancellationReason || null;
    this.pendingExtensionDays = data.pending_extension_days || data.pendingExtensionDays || null;
    this.extensionFee = parseFloat(data.extension_fee || data.extensionFee || 0);
    this.damageFee = parseFloat(data.damage_fee || data.damageFee || 0);
    this.fuelFee = parseFloat(data.fuel_fee || data.fuelFee || 0);
    this.lateFee = parseFloat(data.late_fee || data.lateFee || 0);
    this.refundAmount = parseFloat(data.refund_amount || data.refundAmount || 0);
    this.additionalOwed = parseFloat(data.additional_owed || data.additionalOwed || 0);
    this.actualReturnTime = data.actual_return_time || data.actualReturnTime || null;
    this.actualReturnOdometer = data.actual_return_odometer || data.actualReturnOdometer || null;
    this.extendedReturnDate = data.extended_return_date || data.extendedReturnDate || null;
    this.archivedAt = data.archived_at || data.archivedAt || null;
    this.isDeletedByCustomer = !!(data.is_deleted_by_customer || data.isDeletedByCustomer);
  }

  static generateOrderNumber() {
    const now = new Date();
    const date = now.toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `RNT-${date}-${rand}`;
  }

  toJSON() {
    return {
      id: this.id,
      carId: this.carId,
      customerId: this.customerId,
      orderNumber: this.orderNumber,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      driverName: this.driverName,
      driverLicense: this.driverLicense,
      pickupDate: this.pickupDate,
      returnDate: this.returnDate,
      totalDays: this.totalDays,
      dailyRate: this.dailyRate,
      rentalAmount: this.rentalAmount,
      subtotal: this.subtotal,
      vatAmount: this.vatAmount,
      securityDeposit: this.securityDeposit,
      totalAmount: this.totalAmount,
      paymentMethod: this.paymentMethod,
      status: this.status,
      isManual: this.isManual,
      paymentStatus: this.paymentStatus,
      paymentProofUrl: this.paymentProofUrl,
      paymentReference: this.paymentReference,
      financeNotes: this.financeNotes,
      verifiedAmount: this.verifiedAmount,
      verifiedBy: this.verifiedBy,
      specialRequests: this.specialRequests,
      managerNote: this.managerNote,
      carCondition: this.carCondition,
      conditionReason: this.conditionReason,
      pickupRemarks: this.pickupRemarks,
      pickupLocation: this.pickupLocation,
      approvedAt: this.approvedAt,
      rejectedAt: this.rejectedAt,
      rentalStartTime: this.rentalStartTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      carName: this.carName,
      carImage: this.carImage,
      carBrand: this.carBrand,
      carModel: this.carModel,
      carLicensePlate: this.carLicensePlate,
      carFuelType: this.carFuelType,
      carTransmission: this.carTransmission,
      carSeats: this.carSeats,
      isCancellationRequested: this.isCancellationRequested,
      cancellationReason: this.cancellationReason,
      pendingExtensionDays: this.pendingExtensionDays,
      extensionFee: this.extensionFee,
      damageFee: this.damageFee,
      fuelFee: this.fuelFee,
      lateFee: this.lateFee,
      refundAmount: this.refundAmount,
      additionalOwed: this.additionalOwed,
      actualReturnTime: this.actualReturnTime,
      actualReturnOdometer: this.actualReturnOdometer,
      extendedReturnDate: this.extendedReturnDate,
      archivedAt: this.archivedAt,
      isDeletedByCustomer: this.isDeletedByCustomer,
    };
  }

  static fromDatabase(data) { return new RentalOrder(data); }
}

module.exports = RentalOrder;
