const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../frontend/src/pages/pharmacy/PharmacySalesForm.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Find the exact split point
const marker = "<div style={{ margin: '-2rem', minHeight: 'calc(100vh - 72px)'";
const idx = content.indexOf(marker);

if (idx === -1) {
    console.error("Marker not found in the original file!");
    process.exit(1);
}

// Find the "return (" before the marker
const returnIdx = content.lastIndexOf("return (", idx);
if (returnIdx === -1) {
    console.error("Return not found before marker!");
    process.exit(1);
}

// Keep everything before the return
const originalPreReturn = content.substring(0, returnIdx);

// Keep the import addition
let finalContent = originalPreReturn;
if (!finalContent.includes("import styles from './PharmacySalesForm.module.css';")) {
    finalContent = finalContent.replace(
        "import SegmentedSpinner from '../../components/ui/SegmentedSpinner';", 
        "import SegmentedSpinner from '../../components/ui/SegmentedSpinner';\nimport styles from './PharmacySalesForm.module.css';"
    );
}

const newJSX = `return (
    <>
      <div className={styles.pageWrapper}>
        <ToastContainer />

        {/* ── PREMIUM HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            {/* Left: Title + Badge */}
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Pharmacy Sales</h1>
              <div className={styles.salesBubble}>
                <span className={styles.salesBubbleCount}>{sales.length}</span>
                <span className={styles.salesBubbleLabel}>sales</span>
              </div>
            </div>

            {/* Right: Refresh + New Sale */}
            <div className={styles.headerRight}>
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                title="Refresh sales"
                className={styles.refreshBtn}
              >
                {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={14} />}
                {refreshing ? 'Loading...' : 'Refresh'}
              </button>

              <button
                onClick={() => { setShowAudit(false); setTab('walkin'); resetForm(); }}
                className={styles.newSaleBtn}
              >
                <Plus size={18} /> New Sale
              </button>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div className={styles.tabBar}>
            {[
              { key: 'walkin',  icon: ShoppingCart, label: 'WALK-IN' },
              { key: 'online',  icon: Smartphone,   label: 'ONLINE' },
              { key: 'list',    icon: List,         label: 'SALES' },
              { key: 'audit',   icon: History,      label: 'AUDIT TRAIL' },
            ].map((t) => {
              const active = t.key === 'audit' ? showAudit : (tab === t.key && !showAudit);
              const TabIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === 'audit') {
                      setShowAudit(true); setTab('walkin'); loadAuditTrail();
                    } else {
                      setShowAudit(false); setTab(t.key);
                      if (t.key === 'walkin') setShowCart(false);
                      if (t.key === 'list') loadSales();
                      if (t.key === 'online') loadPendingOrders();
                    }
                  }}
                  className={active ? styles.tabActive : styles.tab}
                >
                  <TabIcon size={16} />
                  {t.label}

                  {/* Cart badge on Walk-In tab */}
                  {t.key === 'walkin' && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setShowCart(c => !c); }}
                      title="Open Cart"
                      className={posCart.length > 0 ? styles.cartBadgeActive : styles.cartBadge}
                    >
                      <ShoppingCart size={12} />
                      {posCart.length}
                    </div>
                  )}

                  {/* Notification badge on ONLINE tab */}
                  {t.key === 'online' && pendingOrders.length > 0 && (
                    <div
                      title={\`\${pendingOrders.length} Pending Orders\`}
                      className={styles.pendingBadge}
                    >
                      {pendingOrders.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>

          {/* WALK-IN TAB */}
          {tab === 'walkin' && !showAudit && (
            <div className={styles.card}>
              {!showCart ? (
                <div className={styles.cardBody}>
                  <div className={styles.productGrid}>
                    {/* Product Grid */}
                    {products
                      .filter(i => !navSearch || (i.name && i.name.toLowerCase().includes(navSearch.toLowerCase())))
                      .map((item, idx) => {
                        const inCart = posCart.find(c => c.id === item.id);
                        const stockVal = item.stock !== undefined ? item.stock : (item.quantity || 0);
                        const stockLabel = stockVal <= 0 ? 'Oos' : stockVal <= (item.reorder_level || 10) ? 'Low' : 'Normal';
                        const stockText = stockVal <= 0 ? '0 Out of Stock' : stockVal <= (item.reorder_level || 10) ? \`\${stockVal} Low Stock\` : \`\${stockVal} In Stock\`;
                        const priceVal = item.price || item.selling_price || item.unit_price || 0;
                        
                        const imgSrc = (url) => {
                          if (!url) return null;
                          return url.startsWith('http') ? url : 'http://localhost:5000' + url;
                        };
                        
                        return (
                          <div key={item.id} className={inCart ? styles.productCardInCart : styles.productCard}>
                            <div className={styles.productImgWrap}>
                              {(() => {
                                const imgs = [item.product_image, item.drug_image, item.cover_image].filter(Boolean);
                                const uniqueImgs = [...new Set(imgs)];
                                if (uniqueImgs.length === 0) return <Package size={36} color="#cbd5e1" />;
                                if (uniqueImgs.length === 1) return <img src={imgSrc(uniqueImgs[0])} className={styles.productImg} alt={item.name} />;
                                return (
                                  <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                                    <img src={imgSrc(uniqueImgs[0])} className={styles.productImg} alt={item.name} style={{ width: '50%', borderRight: '1px solid #E5E7EB' }} />
                                    <img src={imgSrc(uniqueImgs[1])} className={styles.productImg} alt={item.name} style={{ width: '50%' }} />
                                  </div>
                                );
                              })()}
                              {(item.category || item.category_name) && <div className={styles.productCategoryBadge}>{item.category || item.category_name}</div>}
                              {stockVal <= 0 && <div className={styles.oosOverlay}>OUT OF STOCK</div>}
                            </div>
                            <div className={styles.productBody}>
                              <h3 className={styles.productName}>{item.name}</h3>
                              <span className={styles['stock' + stockLabel]}>
                                📦 {stockText}
                              </span>
                              
                              {item.description && (
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <p className={expandedCards[item.id] ? styles.productDescExpanded : styles.productDesc}>
                                    {item.description}
                                  </p>
                                  {item.description.length > 80 && (
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setExpandedCards(prev => ({...prev, [item.id]: !prev[item.id]})); }}
                                      className={styles.expandBtn}
                                    >
                                      <ChevronDown size={14} style={{ transform: expandedCards[item.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              <div className={styles.productFooter}>
                                <div className={styles.productPrice}>{parseFloat(priceVal).toLocaleString()} ETB</div>
                                <button
                                  type="button"
                                  className={inCart ? styles.addBtnInCart : styles.addBtn}
                                  disabled={stockVal <= 0}
                                  onClick={(e) => { e.stopPropagation(); addToCart({...item, price: priceVal, stock: stockVal}); }}
                                >
                                  <ShoppingCart size={13} /> {inCart ? \`\${inCart.qty} added\` : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              ) : (
                <div className={styles.cardBody}>
                   <div className={styles.cartHeader}>
                     <h2 className={styles.cartTitle}>🛍️ Cart & Checkout</h2>
                     <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }} className={styles.btnSecondary}>
                       ← Back to Products
                     </button>
                   </div>

                   {/* ── Online Order Banner ── */}
                   {activeOnlineOrder && (
                     <div className={styles.onlineBanner}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <div className={styles.onlineBannerIcon}>📦</div>
                         <div>
                           <div className={styles.onlineBannerLabel}>🌐 Online Order — Auto-Filled</div>
                           <div className={styles.onlineBannerCode}>{activeOnlineOrder.sale_code || \`Order #\${activeOnlineOrder.id}\`}</div>
                           <div className={styles.onlineBannerSub}>👤 {activeOnlineOrder.customer_name || 'Guest'} &nbsp;·&nbsp; 📱 {activeOnlineOrder.customer_phone || '—'}</div>
                         </div>
                       </div>
                       <div className={styles.onlineBannerTotal}>
                         <div className={styles.onlineBannerTotalLabel}>Total</div>
                         <div className={styles.onlineBannerTotalValue}>{parseFloat(activeOnlineOrder.total_amount || 0).toFixed(2)} ETB</div>
                       </div>
                     </div>
                   )}

                   {posStep === 1 || posStep === 2 || posStep === 3 ? (
                     <>
                       {/* Items List */}
                       <div className={styles.cartItemsCard}>
                         <div className={styles.cartItemsHead}>Cart Items ({posCart.length})</div>
                         <div className={styles.cartItemsBody}>
                           {posCart.length === 0 ? (
                             <div className={styles.cartEmpty}>Cart is empty</div>
                           ) : (
                             posCart.map(item => (
                               <div key={item.id} className={styles.cartItem}>
                                 <div>
                                   <div className={styles.cartItemName}>{item.name}</div>
                                   <div className={styles.cartItemSub}>{item.price} ETB each</div>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                   <div className={styles.qtyControl}>
                                     <button onClick={() => updateQty(item.id, item.qty - 1)} className={styles.qtyBtn}><Minus size={14}/></button>
                                     <span className={styles.qtyNum}>{item.qty}</span>
                                     <button onClick={() => updateQty(item.id, item.qty + 1)} className={styles.qtyBtn}><Plus size={14}/></button>
                                   </div>
                                   <div className={styles.cartItemTotal}>{(item.price * item.qty).toFixed(2)} ETB</div>
                                   <button onClick={() => setPosCart(posCart.filter(c => c.id !== item.id))} className={styles.btnDanger} style={{ padding: '8px' }}><Trash2 size={16}/></button>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                         {posCart.length > 0 && (
                           <div className={styles.cartFooter}>
                             <button onClick={() => setPosCart([])} className={styles.btnDanger}><X size={16}/> Clear Cart</button>
                             <div className={styles.cartTotal}>Total: <span className={styles.cartTotalAmount}>{posCartTotal.toFixed(2)} ETB</span></div>
                           </div>
                         )}
                       </div>

                       {posCart.length > 0 && (
                         <>
                           {/* Payment Method */}
                           <div className={styles.mb20}>
                             <label className={styles.sectionLabel}>Payment Method *</label>
                             <div className={styles.paymentMethods}>
                               {PAYMENT_METHODS.map(pm => (
                                 <label key={pm.value} className={posPaymentMethod === pm.value ? styles.paymentMethodOptActive : styles.paymentMethodOpt}>
                                   <input type="radio" name="posPaymentMethod" value={pm.value} checked={posPaymentMethod === pm.value}
                                     onChange={() => setPosPaymentMethod(pm.value)} style={{ display: 'none' }} />
                                   {pm.icon} {pm.label}
                                 </label>
                               ))}
                             </div>
                           </div>

                           {/* Payment Detail Fields — CASH */}
                           {posPaymentMethod === 'CASH' && (
                             <div className={styles.payPanelCash}>
                               <h3 className={styles.payPanelTitle}>
                                 <DollarSign size={16} color="#D97706" /> Cash Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Recipient Full Name *</label>
                                   <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                                     placeholder="Who received cash" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Recipient Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? \`(\${autoFilledWorker.sub_role})\` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Detail Fields — BANK TRANSFER */}
                           {posPaymentMethod === 'BANK_TRANSFER' && (
                             <div className={styles.payPanelBank}>
                               <h3 className={styles.payPanelTitle}>
                                 <CreditCard size={16} color="#2563EB" /> Bank Transfer Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Finance Account (Auto-fill)</label>
                                   <select className={styles.formInput} onChange={(e) => {
                                     const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                     if (acc) {
                                       setBankName(acc.bank_provider || '');
                                       setAccountHolder(acc.account_name || '');
                                       setAccountNumber(acc.account_number || '');
                                     }
                                   }}>
                                     <option value="">— Select Account —</option>
                                     {financeAccounts.filter(a => a.account_type === 'Bank').map(a => (
                                       <option key={a.id} value={a.id}>{a.account_name} ({a.bank_provider}) - {a.account_number}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Bank Name *</label>
                                   <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                                     placeholder="e.g. CBE" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Account Holder *</label>
                                   <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                                     placeholder="Full name on account" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Account Number *</label>
                                   <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                                     placeholder="Account number" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? \`(\${autoFilledWorker.sub_role})\` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Detail Fields — TELBIR */}
                           {posPaymentMethod === 'TELBIR' && (
                             <div className={styles.payPanelTelbir}>
                               <h3 className={styles.payPanelTitle}>
                                 <Smartphone size={16} color="#7C3AED" /> Telbir Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Telebirr Account (Auto-fill)</label>
                                   <select className={styles.formInput} onChange={(e) => {
                                     const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                     if (acc) {
                                       setTelbirNumber(acc.account_number || '');
                                       setPayerName(acc.account_name || '');
                                     }
                                   }}>
                                     <option value="">— Select Telebirr —</option>
                                     {financeAccounts.filter(a => a.bank_provider === 'telebirr' || a.account_type === 'Mobile Wallet').map(a => (
                                       <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Telbir Number *</label>
                                   <input type="text" value={telbirNumber} onChange={e => setTelbirNumber(e.target.value)}
                                     placeholder="Telbir number" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Full Name *</label>
                                   <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                                     placeholder="Sender full name" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? \`(\${autoFilledWorker.sub_role})\` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Status Buttons A14 */}
                           <div className={styles.mb20}>
                             <label className={styles.sectionLabel}>Payment Status (A14) *</label>
                             <div className={styles.payStatusRow}>
                               <button type="button" onClick={() => setPaymentStatus('PAID')}
                                 className={paymentStatus === 'PAID' ? styles.payStatusBtnPaid : styles.payStatusBtn}>
                                 <CheckCircle size={20} /> PAID
                               </button>
                               <button type="button" onClick={() => setPaymentStatus('CASHOUT')}
                                 className={paymentStatus === 'CASHOUT' ? styles.payStatusBtnCashout : styles.payStatusBtn}>
                                 <Banknote size={20} /> CASHOUT
                               </button>
                             </div>
                           </div>

                           {/* Submit */}
                           <button type="button" disabled={loading || !posPaymentMethod || !paymentStatus}
                             onClick={handleProcessPayment}
                             className={styles.recordSaleBtn}>
                             <ShoppingCart size={18} /> {loading ? 'Processing...' : \`Record Sale — \${posCartTotal > 0 ? posCartTotal.toFixed(2) : '0.00'} ETB\`}
                           </button>
                         </>
                       )}
                     </>
                   ) : posStep === 4 ? (
                      <div className={styles.successScreen}>
                        <CheckCircle size={64} color='#16A34A' style={{ marginBottom: 16 }} />
                        <h3 className={styles.successTitle}>Transaction Complete!</h3>
                        {completedSale && (
                          <div className={styles.successReceipt}>
                            <div className={styles.receiptNo}>Receipt: {completedSale.receipt_no}</div>
                            <div className={styles.receiptRow}>Branch: <strong>{completedSale.branch}</strong></div>
                            <div className={styles.receiptRow}>Cashier: <strong>{completedSale.worker}</strong></div>
                            <div className={styles.receiptRow}>Customer: <strong>{completedSale.recipient_name}</strong></div>
                            <div className={styles.receiptTotal}>Total: {completedSale.total.toFixed(2)} ETB</div>
                          </div>
                        )}
                        <p className={styles.successSub}>Inventory updated. CRV and Model 22 generated.</p>
                        <div className={styles.successActions}>
                          <button type='button' onClick={printReceipt} className={styles.btnSecondary} style={{ flex: 1, height: '44px' }}>
                            <Printer size={18} /> Print Receipt
                          </button>
                          <button type='button' onClick={() => { setTab('list'); setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); }} className={styles.btnSecondary} style={{ flex: 1, height: '44px' }}>
                            <List size={18} /> View Sales
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); setCompletedSale(null); resetForm(); }}
                          className={styles.btnPrimary} style={{ width: '100%', maxWidth: '400px', height: '44px', background: 'transparent', border: '2px solid #2563EB', color: '#2563EB' }}
                        >Start New Transaction</button>
                      </div>
                   ) : null}
                </div>
              )}
            </div>
          )}

          {/* SALES LIST TAB */}
          {tab === 'list' && !showAudit && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                 <h2 className={styles.cardHeaderTitle}><List size={18} color="#2563EB"/> All Sales</h2>
              </div>
              <div className={styles.cardBody}>
                 {sales.length === 0 ? (
                   <div className={styles.emptyState}>
                      <span className={styles.emptyEmoji}>📭</span>
                      <h3 className={styles.emptyTitle}>No sales recorded</h3>
                      <p className={styles.emptyText}>Sales data will appear here.</p>
                   </div>
                 ) : (
                   <div className={styles.tableWrap}>
                     <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Receipt No</th>
                            <th className={styles.th}>Date</th>
                            <th className={styles.th}>Type</th>
                            <th className={styles.th}>Branch</th>
                            <th className={styles.th}>Worker</th>
                            <th className={styles.th}>Payment</th>
                            <th className={styles.th} style={{ textAlign: 'right' }}>Total Amount</th>
                            <th className={styles.th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map(sale => {
                            const resolvedBranch = sale.branch_name ||
                              branches.find(b => String(b.id) === String(sale.branch_id))?.name ||
                              (sale.branch_id ? \`Branch #\${sale.branch_id}\` : '—');
                            const resolvedWorker = sale.worker_name ||
                              workers.find(w => String(w.id) === String(sale.worker_id))?.name ||
                              (sale.worker_id ? \`Worker #\${sale.worker_id}\` : '—');
                            return (
                            <tr key={sale.id} className={styles.tr}>
                               <td className={styles.tdMono}>{sale.receipt_no || sale.sale_no || \`REC-\${sale.id}\`}</td>
                               <td className={styles.td}>{new Date(sale.created_at).toLocaleString()}</td>
                               <td className={styles.td}>
                                 <span className={sale.sale_type === 'ONLINE' ? styles.badgeOnline : styles.badgeWalkin}>
                                   {sale.sale_type === 'ONLINE' ? '🌐 ONLINE' : '🛒 WALK-IN'}
                                 </span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeBranch}>{resolvedBranch}</span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeWorker}>{resolvedWorker}</span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeMethod}>{sale.payment_method || 'CASH'}</span>
                               </td>
                               <td className={styles.tdAmount}>{parseFloat(sale.total_amount || 0).toFixed(2)} ETB</td>
                               <td className={styles.td}>
                                 <button onClick={() => viewSaleDetail(sale)} className={styles.viewBtn}>View</button>
                               </td>
                            </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className={styles.tfoot}>
                          <tr>
                            <td colSpan="6" className={styles.tfootTd} style={{ textAlign: 'right' }}>TOTAL TRANSACTIONS: {sales.length}</td>
                            <td colSpan="2" className={styles.tfootAmount}>
                              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
                            </td>
                          </tr>
                        </tfoot>
                     </table>
                   </div>
                 )}

                 {sales.length > 0 && (
                   <div className={styles.summaryRow}>
                     <div className={styles.summaryText}>
                        <strong className={styles.summaryStrong}>{sales.length}</strong> transactions · <strong className={styles.summaryGreen}>{sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB</strong> total
                     </div>
                     <button 
                       onClick={() => setShowSubmitConfirm(true)}
                       disabled={loading}
                       className={styles.btnSuccess}
                     >
                       <CheckCircle size={16} />
                       {loading ? 'Submitting...' : 'Submit to Manager'}
                     </button>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* ONLINE TAB */}
          {tab === 'online' && !showAudit && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}><Package size={18} color="#2563EB" /> Pending Online Orders</h2>
                <button onClick={loadPendingOrders} disabled={loadingPendingOrders} className={styles.btnSecondary}>
                  {loadingPendingOrders ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
              <div className={styles.cardBody}>
                {loadingPendingOrders ? (
                  <div className={styles.loadingCenter}><SegmentedSpinner size={24} /> Loading online orders...</div>
                ) : pendingOrders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📭</span>
                    <h3 className={styles.emptyTitle}>No pending orders</h3>
                    <p className={styles.emptyText}>All online customer orders have been processed.</p>
                  </div>
                ) : (
                  <div className={styles.ordersGrid}>
                    {pendingOrders.map(order => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderCardTop}>
                          <span className={styles.orderCode}>{order.sale_code || \`ORD-\${order.id}\`}</span>
                          <span className={styles.badgeOnline}>ONLINE</span>
                        </div>
                        <div className={styles.orderCustomer}>
                          👤 <strong>{order.customer_name || 'Guest Customer'}</strong>
                          {order.customer_phone && <span className={styles.orderPhone}>· {order.customer_phone}</span>}
                        </div>
                        {order.prescription_ref && (
                          <div className={styles.orderRx}>📋 Rx: {order.prescription_ref}</div>
                        )}
                        <div className={styles.orderItems}>
                          {(order.items || []).map(item => (
                            <div key={item.id || item.drug_id} className={styles.orderItemRow}>
                              <span>💊 {item.drug_name} × {item.quantity}</span>
                              <span className={styles.orderItemAmt}>{parseFloat(item.line_total || (item.quantity * item.unit_price)).toFixed(2)} ETB</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderFooter}>
                          <div>
                            <div className={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</div>
                            <div className={styles.orderTotal}>{parseFloat(order.total_amount).toFixed(2)} ETB</div>
                          </div>
                          <button onClick={() => processOnlineOrder(order)} className={styles.processBtn}>
                            Process Payment →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIT TRAIL TAB */}
          {showAudit && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}><History size={18} color="#2563EB" /> Audit Trail</h2>
                <button onClick={() => setShowAudit(false)} className={styles.btnSecondary}>
                  Close Audit Trail
                </button>
              </div>
              <div className={styles.cardBody}>
                {auditTrail.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📭</span>
                    <h3 className={styles.emptyTitle}>No pending audit logs</h3>
                    <p className={styles.emptyText}>All audit logs have been submitted or none exist.</p>
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.auditTable}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Date</th>
                          <th className={styles.th}>Action</th>
                          <th className={styles.th}>Details</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditTrail.map((log) => (
                          <tr key={log.id} className={styles.tr}>
                            <td className={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                            <td className={styles.td} style={{ fontWeight: 700, color: log.action === 'RETURN' ? '#DC2626' : '#16A34A' }}>
                              {log.action}
                            </td>
                            <td className={styles.td}>{log.recipient}</td>
                            <td className={styles.tdAmount} style={{ color: parseFloat(log.amount) < 0 ? '#DC2626' : '#16A34A' }}>
                              {parseFloat(log.amount || 0).toFixed(2)} ETB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAIL TAB */}
          {tab === 'detail' && detail && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardHeaderTitle}>
                  <Eye size={18} color="#2563EB" /> Sale Detail
                </h3>
                <button onClick={() => setTab('list')} className={styles.btnSecondary}>
                  Back to List
                </button>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.detailGrid3}>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Sale #</div>
                    <div className={styles.detailCellValue}>{detail.sale_no || detail.id}</div>
                  </div>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Type</div>
                    <div className={styles.detailCellValue}>{detail.sale_type || '—'}</div>
                  </div>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Total Amount</div>
                    <div className={styles.detailCellGreen}>
                      {parseFloat(detail.payment?.amount || detail.total_amount || 0).toFixed(2)} ETB
                    </div>
                  </div>
                </div>

                <div className={styles.detailGrid2}>
                  <div className={styles.detailPanel}>
                    <h4 className={styles.detailPanelTitle}>
                      <User size={16} color="#2563EB" /> Recipient
                    </h4>
                    <div className={styles.detailRow}><strong>{detail.payment?.recipient_name || detail.recipient_name || '—'}</strong></div>
                    <div className={styles.detailRowMuted}>{detail.payment?.recipient_phone || ''}</div>
                  </div>
                  <div className={styles.detailPanel}>
                    <h4 className={styles.detailPanelTitle}>
                      <DollarSign size={16} color="#2563EB" /> Payment
                    </h4>
                    <div className={styles.detailRow}>
                      <strong>Method:</strong> {detail.payment?.method || '—'}
                    </div>
                    <div className={styles.detailRow}>
                      <strong>Status:</strong>{' '}
                      <span className={detail.payment?.status === 'PAID' ? styles.badgePaid : styles.badgeCashout}>
                        {detail.payment?.status || '—'}
                      </span>
                    </div>
                    <div className={styles.detailRowMuted}>
                      {detail.payment?.bank_name && <div>Bank: {detail.payment.bank_name}</div>}
                      {detail.payment?.account_holder && <div>Account: {detail.payment.account_holder}</div>}
                      {detail.payment?.telbir_number && <div>Telbir: {detail.payment.telbir_number}</div>}
                      {detail.payment?.branch_name && <div>Branch: {detail.payment.branch_name}</div>}
                      {detail.payment?.worker_name && <div>Worker: {detail.payment.worker_name}</div>}
                    </div>
                  </div>
                </div>

                <div className={styles.mb20}>
                  <h4 className={styles.detailPanelTitle}>Items</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th} style={{ width: '50%' }}>Drug</th>
                          <th className={styles.th} style={{ textAlign: 'center' }}>Qty</th>
                          <th className={styles.th} style={{ textAlign: 'center' }}>Unit Price</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.items || [detail]).map((it, idx) => {
                          const itemQty = parseFloat(it.quantity) || 0;
                          const itemPrice = parseFloat(it.unit_price) || 0;
                          const itemTotal = itemQty * itemPrice;
                          return (
                            <tr key={idx} className={styles.tr}>
                              <td className={styles.td}>{it.drug_name}</td>
                              <td className={styles.td} style={{ textAlign: 'center' }}>{itemQty}</td>
                              <td className={styles.td} style={{ textAlign: 'center' }}>{itemPrice.toFixed(2)} ETB</td>
                              <td className={styles.tdAmount}>{itemTotal.toFixed(2)} ETB</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit to Manager Confirmation Modal */}
      {showSubmitConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <CheckCircle size={32} color="#16A34A" />
            </div>
            <h3 className={styles.modalTitle}>Submit Daily Sales?</h3>
            <p className={styles.modalBody}>
              You are about to submit <strong style={{ color: '#111827' }}>{sales.length} transaction{sales.length !== 1 ? 's' : ''}</strong> totalling
            </p>
            <p className={styles.modalAmount}>
              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
            </p>
            <p className={styles.modalNote}>
              This will be recorded in the audit log and sent to the Pharmacy Manager. The sales list will be cleared after submission.
            </p>
            <div className={styles.modalBtns}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
                className={styles.btnSecondary}
                style={{ flex: 1, height: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await apiClient.post('/pharmacy/sales/submit-daily', {});
                    setShowSubmitConfirm(false);
                    submitNotification('Sales Submitted', \`\${sales.length} transaction(s) totalling \${sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB submitted to the Pharmacy Manager.\`);
                    showToast('✅ Full day data submitted to Manager', 'success');
                    loadSales();
                  } catch (err) {
                    setShowSubmitConfirm(false);
                    showToast(err.message || 'Failed to submit data', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={styles.btnSuccess}
                style={{ flex: 1, height: '44px' }}
              >
                <CheckCircle size={18} />
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
`;

finalContent += newJSX;

fs.writeFileSync(targetPath, finalContent, 'utf8');
console.log('File patched successfully using exact target index!');
