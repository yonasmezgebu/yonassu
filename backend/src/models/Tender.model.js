class TenderModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tenderNumber = data.tender_number || data.tenderNumber || '';
    this.title = data.title || '';
    this.category = data.category || '';
    this.description = data.description || '';
    this.openingDate = data.opening_date || data.openingDate || null;
    this.closingDate = data.closing_date || data.closingDate || null;
    this.status = data.status || 'draft';
    this.createdBy = data.created_by || data.createdBy || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.contactPhone1 = data.contact_phone1 || data.contactPhone1 || '';
    this.contactPhone2 = data.contact_phone2 || data.contactPhone2 || '';
    this.contactEmail = data.contact_email || data.contactEmail || '';
    this.items = data.items || [];
  }

  validate() {
    const errors = [];
    if (!this.title) errors.push('Title is required');
    if (!this.items || this.items.length === 0) {
      errors.push('At least one item is required in the tender');
    }
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.objectType) errors.push(`Item ${i + 1}: Object type is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${i + 1}: Quantity must be greater than 0`);
    }
    return { isValid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id: this.id,
      tenderNumber: this.tenderNumber,
      title: this.title,
      category: this.category,
      description: this.description,
      openingDate: this.openingDate,
      closingDate: this.closingDate,
      status: this.status,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      contactPhone1: this.contactPhone1,
      contactPhone2: this.contactPhone2,
      contactEmail: this.contactEmail,
      items: this.items.map(item => ({
        id: item.id,
        tenderId: item.tenderId || item.tender_id,
        objectType: item.objectType || item.object_type,
        unit: item.unit,
        quantity: item.quantity
      }))
    };
  }

  static fromDatabase(data) {
    const tender = new TenderModel(data);
    if (data.items && typeof data.items === 'string') {
      try { tender.items = JSON.parse(data.items); }
      catch { tender.items = []; }
    }
    return tender;
  }

  static fromRequest(data) {
    return new TenderModel({
      tenderNumber: data.tenderNumber,
      title: data.title,
      category: data.category,
      description: data.description,
      openingDate: data.openingDate,
      closingDate: data.closingDate,
      contactPhone1: data.contactPhone1,
      contactPhone2: data.contactPhone2,
      contactEmail: data.contactEmail,
      items: data.items || []
    });
  }

  // Auto-generate tender number: TND-YYYY-NNNN
  static generateNumber(sequenceId) {
    const year = new Date().getFullYear();
    return `TND-${year}-${String(sequenceId).padStart(4, '0')}`;
  }
}

module.exports = TenderModel;
