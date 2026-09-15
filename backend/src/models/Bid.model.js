class BidModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tenderId = data.tender_id || data.tenderId || null;
    this.competitorName = data.competitor_name || data.competitorName || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.deliveryTime = data.delivery_time || data.deliveryTime || '';
    this.paymentTerms = data.payment_terms || data.paymentTerms || '';
    this.paymentMethod = data.payment_method || data.paymentMethod || '';
    this.termsConditions = data.terms_conditions || data.termsConditions || '';
    this.digitalSignatureText = data.digital_signature_text || data.digitalSignatureText || '';
    this.handSignaturePath = data.hand_signature_path || data.handSignaturePath || '';
    this.bidStatus = data.bid_status || data.bidStatus || 'pending'; // pending, recommended, rejected, winner
    this.recommendationReason = data.recommendation_reason || data.recommendationReason || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.items = data.items || [];
  }

  validate() {
    const errors = [];
    if (!this.tenderId) errors.push('Tender ID is required');
    if (!this.competitorName) errors.push('Competitor name is required');
    if (!this.email) errors.push('Email is required');
    if (!this.phone) errors.push('Phone number is required');
    if (!this.items || this.items.length === 0) {
      errors.push('At least one bid item is required');
    }
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.tenderItemId) errors.push(`Item ${i + 1}: Tender item ID is required`);
      if (item.priceBirr < 0) errors.push(`Item ${i + 1}: Price in Birr cannot be negative`);
      if (item.priceCent < 0 || item.priceCent > 99) errors.push(`Item ${i + 1}: Price in Cent must be between 0 and 99`);
    }
    return { isValid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id: this.id,
      tenderId: this.tenderId,
      competitorName: this.competitorName,
      email: this.email,
      phone: this.phone,
      deliveryTime: this.deliveryTime,
      paymentTerms: this.paymentTerms,
      paymentMethod: this.paymentMethod,
      termsConditions: this.termsConditions,
      digitalSignatureText: this.digitalSignatureText,
      handSignaturePath: this.handSignaturePath,
      bidStatus: this.bidStatus,
      recommendationReason: this.recommendationReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this.items.map(item => ({
        id: item.id,
        bidId: item.bidId || item.bid_id,
        tenderItemId: item.tenderItemId || item.tender_item_id,
        priceBirr: item.priceBirr || item.price_birr || 0,
        priceCent: item.priceCent || item.price_cent || 0,
        totalBirr: item.totalBirr || item.total_birr || 0,
        totalCent: item.totalCent || item.total_cent || 0,
        checkup: item.checkup
      }))
    };
  }

  static fromDatabase(data) {
    const bid = new BidModel(data);
    if (data.items && typeof data.items === 'string') {
      try { bid.items = JSON.parse(data.items); }
      catch { bid.items = []; }
    }
    return bid;
  }

  static fromRequest(data) {
    return new BidModel({
      tenderId: data.tenderId,
      competitorName: data.competitorName,
      email: data.email,
      phone: data.phone,
      deliveryTime: data.deliveryTime,
      paymentTerms: data.paymentTerms,
      paymentMethod: data.paymentMethod,
      termsConditions: data.termsConditions,
      digitalSignatureText: data.digitalSignatureText,
      handSignaturePath: data.handSignaturePath,
      items: data.items || []
    });
  }
}

module.exports = BidModel;
