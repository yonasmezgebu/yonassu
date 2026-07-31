
// === NEW CART WORKFLOW ENDPOINTS ===

exports.submitCartToFinance = async (req, res) => {
  try {
    const { cart_code, payment_method, payment_amount, payment_reference, bank_name, account_number, telbir_number, txn_id, total_amount, items, customer_name, customer_phone } = req.body;
    
    // Create finance live income submission
    const [financeId] = await db('finance_income_submissions').insert({
      department: 'Retail POS',
      submitted_by: req.user.fullName || req.user.name || 'Retail Cashier',
      amount: total_amount,
      reference_no: payment_reference || txn_id || cart_code,
      description: `Retail POS Cart ${cart_code} - ${customer_name || 'Walk-in'}`,
      status: 'Pending',
      manual_details: JSON.stringify({
        paymentMethod: payment_method,
        paymentReference: payment_reference || txn_id,
        amount: total_amount,
        receivedFrom: customer_name || 'Walk-in'
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    const [cartId] = await db('retail_pos_carts').insert({
      cart_code,
      cashier_id: req.user.id,
      cashier_name: req.user.fullName || req.user.name,
      customer_name,
      customer_phone,
      payment_method,
      payment_amount,
      payment_reference,
      bank_name,
      account_number,
      telbir_number,
      txn_id,
      total_amount,
      items: JSON.stringify(items),
      finance_submission_id: financeId,
      status: 'PENDING_FINANCE',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.json({ status: 'success', data: { cart_id: cartId, cart_code } });
  } catch (error) {
    console.error('Error submitting cart to finance:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.financeApproveCart = async (req, res) => {
  // Can be done in Finance portal, but if we need an endpoint
};

exports.signAndRequestStore = async (req, res) => {
  try {
    const { cart_code, customer_name, customer_phone, signature, notes, items, total_amount, payment_method, payment_amount, txn_id, cashier_name } = req.body;
    
    // Create the store request
    const request_code = `SSR-${Date.now().toString(36).toUpperCase()}`;
    const [storeReqId] = await db('store_sales_requests').insert({
      request_code,
      store_module: 'general_store',
      product_name: 'Retail Cart Items', // generic name since multiple
      quantity_requested: 1, // pseudo qty
      customer_name: customer_name,
      customer_phone: customer_phone,
      requested_by_id: req.user.id,
      requested_by_name: req.user.fullName || req.user.name,
      digital_signature: signature,
      signature_timestamp: new Date(),
      notes: notes,
      status: 'Pending',
      cart_items: JSON.stringify(items) // Important: store all items here
    });

    // We can also create a retail_pos_carts record if it was cash (skipped finance)
    let cartId = null;
    const existing = await db('retail_pos_carts').where('cart_code', cart_code).first();
    if (existing) {
      await db('retail_pos_carts').where('id', existing.id).update({
        store_request_id: storeReqId,
        sales_manager_signature: signature,
        signature_timestamp: new Date(),
        status: 'PENDING_STORE',
        updated_at: new Date()
      });
      cartId = existing.id;
    } else {
      // Cash payment - skips finance
      const [newCartId] = await db('retail_pos_carts').insert({
        cart_code,
        cashier_id: req.user.id,
        cashier_name: cashier_name || req.user.fullName || req.user.name,
        customer_name,
        customer_phone,
        payment_method,
        payment_amount,
        txn_id,
        total_amount,
        items: JSON.stringify(items),
        store_request_id: storeReqId,
        sales_manager_signature: signature,
        signature_timestamp: new Date(),
        status: 'PENDING_STORE',
        created_at: new Date(),
        updated_at: new Date()
      });
      cartId = newCartId;
    }

    res.json({ status: 'success', data: { store_request_id: storeReqId, cart_id: cartId } });
  } catch (error) {
    console.error('Error signing and requesting store:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getPendingCartsByStatus = async (req, res) => {
  try {
    const carts = await db('retail_pos_carts').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: carts });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.storeReleaseCart = async (req, res) => {
  // Handled inside store keeper's panel typically.
};
