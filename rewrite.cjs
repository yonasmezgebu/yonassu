const fs = require('fs');

const path = 'frontend/src/pages/LandingPage/TenderDetailPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startLineIndex = 357; // Line 358 is index 357
const endLineIndex = 1099; // Line 1100 is index 1099

const prefix = lines.slice(0, startLineIndex).join('\n');
const suffix = lines.slice(endLineIndex + 1).join('\n');

const replacement = `      <div className="tdp-container">
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="tdp-card" style={{ height: 180, marginBottom: '1rem', background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)', backgroundSize: '400px', animation: 'tdpShimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : !tender ? (
          <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'hsl(var(--muted-foreground))' }}>
            <p style={{ fontSize: '1.125rem' }}>Tender not found.</p>
            <button onClick={() => navigate('/tenders')} className="tdp-btn-primary" style={{ width: 'auto', marginTop: '1rem' }}>Back to Tenders</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/tenders/buy')} className="tdp-btn-back">
              <ArrowLeft size={16} /> All Tenders
            </button>
            
            <div className="tdp-layout">
              {/* Hero Section */}
              <div className="tdp-hero-section">
                {coverImg && (
                  <img
                    className="tdp-cover-img"
                    src={\`\${API_ORIGIN}/uploads/tenders/\${coverImg}\`}
                    alt={tender.title}
                    onError={() => setCoverImgIdx(i => i + 1)}
                  />
                )}

                <div className="tdp-header-content">
                  <div className="tdp-header-row">
                    <span className="tdp-ref">{tender.reference_number}</span>
                    <span className={\`tdp-status \${tender.status}\`}>
                      {tender.status === 'open' && <span className="tdp-live-dot" />}
                      {tender.status.replace('_', ' ')}
                    </span>
                    {tender.category && (
                      <span className="tdp-badge">{tender.category}</span>
                    )}
                  </div>

                  <h1 className="tdp-title">{tender.title}</h1>

                  {/* Countdown */}
                  {isOpen && (
                    <div className="tdp-countdown-box">
                      <Flame size={24} color="#92400e" />
                      <div>
                        <div className="tdp-countdown-label">Time Remaining</div>
                        <div className="tdp-countdown-value"><Countdown deadline={tender.deadline} /></div>
                      </div>
                    </div>
                  )}

                  <div className="tdp-meta-list">
                    <div className="tdp-meta-row">
                      <span className="tdp-meta-key"><Calendar size={16} /> Published</span>
                      <span className="tdp-meta-val">{new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="tdp-meta-row">
                      <span className="tdp-meta-key"><Clock size={16} /> Deadline</span>
                      <span className="tdp-meta-val">{tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="tdp-meta-row">
                      <span className="tdp-meta-key"><Tag size={16} /> Category</span>
                      <span className="tdp-meta-val">{tender.category || '—'}</span>
                    </div>
                    {(() => {
                      let parsedItems = [];
                      try { parsedItems = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                      if (parsedItems.length > 0) {
                        return (
                          <div className="tdp-meta-row">
                            <span className="tdp-meta-key"><Package size={16} /> Tender Type</span>
                            <span className="tdp-meta-val">Multi-Item Tender ({parsedItems.length} items)</span>
                          </div>
                        );
                      }
                      return (
                        <>
                          {tender.item_name && (
                            <div className="tdp-meta-row">
                              <span className="tdp-meta-key"><Package size={16} /> Item</span>
                              <span className="tdp-meta-val">{tender.item_name}</span>
                            </div>
                          )}
                          <div className="tdp-meta-row">
                            <span className="tdp-meta-key"><Package size={16} /> Quantity</span>
                            <span className="tdp-meta-val">{tender.quantity}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="tdp-meta-row">
                      <span className="tdp-meta-key"><TrendingUp size={16} /> Min. Price</span>
                      <span className="tdp-meta-val primary">{parseFloat(tender.starting_bid_price || 0).toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="tdp-section">
                <h3 className="tdp-section-title"><FileText size={20} /> Description</h3>
                <p className="tdp-section-body">{tender.description}</p>
              </div>

              {/* Items Table (for multiple-product tenders) */}
              {(() => {
                let items = [];
                try { items = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                if (!items.length) return null;
                return (
                  <div className="tdp-section">
                    <h3 className="tdp-section-title"><Package size={20} /> Tender Items</h3>
                    {isOpen && isCustomerBidder && (
                      <div className="tdp-alert info">
                        📍 Enter your bid price for each item below, then click <strong>Submit Multi-Item Bid</strong>.
                      </div>
                    )}
                    <form onSubmit={e => handleMultiItemBidSubmit(e, items)}>
                      <div className="tdp-table-wrapper">
                        <table className="tdp-table">
                          <thead>
                            <tr>
                              {['No', 'Item / Object Type', 'Unit', 'Qty', 'Start Price (ETB)', 'Your Bid / Unit (Birr)', 'Your Bid / Unit (Cent)', 'Total'].map((h, i) => (
                                <th key={i} className={i >= 3 ? 'right' : ''} style={{ fontStyle: i >= 5 ? 'italic' : 'normal' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => {
                              const birr = parseFloat(itemBids[\`birr_\${idx}\`] || 0);
                              const cent = parseFloat(itemBids[\`cent_\${idx}\`] || 0);
                              const totalBirr = (birr + cent / 100) * parseFloat(item.quantity || 1);
                              const isError = itemBids[\`birr_\${idx}\`] && parseFloat(itemBids[\`birr_\${idx}\`]) < parseFloat(item.startPrice || 0);
                              return (
                                <tr key={idx} className={idx % 2 === 0 ? 'alt' : ''}>
                                  <td style={{ fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{idx + 1}</td>
                                  <td style={{ fontWeight: 600 }}>{item.objectType || item.object_type || '—'}</td>
                                  <td>{item.unit || '—'}</td>
                                  <td className="right" style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{item.quantity}</td>
                                  <td className="right" style={{ fontWeight: 800 }}>
                                    {item.startPrice ? parseFloat(item.startPrice).toLocaleString() + ' ETB' : '—'}
                                  </td>
                                  <td className="right">
                                    {isOpen && isCustomerBidder ? (
                                      <input
                                        type="number" step="0.01"
                                        min={item.startPrice ? parseFloat(item.startPrice) : 0}
                                        required
                                        value={itemBids[\`birr_\${idx}\`] || ''}
                                        onChange={e => setItemBids(prev => ({ ...prev, [\`birr_\${idx}\`]: e.target.value }))}
                                        placeholder={item.startPrice ? \`Min: \${parseFloat(item.startPrice).toLocaleString()}\` : '0'}
                                        className={\`tdp-input-table \${isError ? 'error' : ''}\`}
                                      />
                                    ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                                  </td>
                                  <td className="right">
                                    {isOpen && isCustomerBidder ? (
                                      <input
                                        type="number" min="0" max="99" step="1"
                                        value={itemBids[\`cent_\${idx}\`] || ''}
                                        onChange={e => setItemBids(prev => ({ ...prev, [\`cent_\${idx}\`]: e.target.value }))}
                                        placeholder="0"
                                        className="tdp-input-table"
                                      />
                                    ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                                  </td>
                                  <td className="right" style={{ fontWeight: 700, color: totalBirr > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                                    {totalBirr > 0 ? totalBirr.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ETB' : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* VAT Summary */}
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        {items.map((item, idx) => {
                          const birr = parseFloat(itemBids[\`birr_\${idx}\`] || 0);
                          const cent = parseFloat(itemBids[\`cent_\${idx}\`] || 0);
                          const qty = parseFloat(item.quantity || 1);
                          const unitBid = (birr || parseFloat(item.startPrice || 0)) + cent / 100;
                          const v = getVatForItem(vatCtx, 'tender_sell', item.id != null ? item.id : idx, unitBid * qty);
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0', color: 'hsl(var(--foreground))' }}>
                              <span>{item.objectType || item.object_type || \`Item \${idx + 1}\`} — VAT ({fmtPct(v.rate)})</span>
                              <span style={{ fontWeight: 600 }}>{v.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                            </div>
                          );
                        })}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, borderTop: '1px solid hsl(var(--border))', marginTop: '0.5rem', paddingTop: '0.5rem', color: 'hsl(var(--foreground))' }}>
                          <span>Grand Total (incl. VAT)</span>
                          <span>{items.reduce((sum, item, idx) => {
                            const birr = parseFloat(itemBids[\`birr_\${idx}\`] || 0);
                            const cent = parseFloat(itemBids[\`cent_\${idx}\`] || 0);
                            const qty = parseFloat(item.quantity || 1);
                            const unitBid = (birr || parseFloat(item.startPrice || 0)) + cent / 100;
                            return sum + getVatForItem(vatCtx, 'tender_sell', item.id != null ? item.id : idx, unitBid * qty).total;
                          }, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                        </div>
                      </div>

                      {isOpen && isCustomerBidder && (
                        <div style={{ marginTop: '3rem' }}>
                          <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', fontFamily: 'var(--font-display)' }}>Competitor Details</h4>
                          
                          <div className="tdp-form-group">
                            <label className="tdp-label">Competitor Name (Fill Part) *</label>
                            <input required type="text"
                              placeholder="Enter company / person name"
                              className="tdp-input"
                              value={form.bidder_full_name}
                              onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label className="tdp-label">Email Address</label>
                              <input type="email" placeholder="example@email.com"
                                className="tdp-input"
                                value={form.bidder_email} onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))} />
                            </div>
                            <div>
                              <label className="tdp-label">Phone Number</label>
                              <input type="tel" placeholder="0900000000"
                                className="tdp-input"
                                value={form.bidder_phone} onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))} />
                            </div>
                          </div>

                          <div className="tdp-form-group">
                            <label className="tdp-label">Digital Signature *</label>
                            <input required type="text"
                              placeholder="Type your signature..."
                              className="tdp-input"
                              value={form.digital_signature}
                              onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                            />
                            <div className={\`tdp-signature \${!form.digital_signature ? 'empty' : ''}\`}>
                              {form.digital_signature || 'Signature preview will appear here'}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                              <label className="tdp-label">Proposed Pickup Date</label>
                              <input type="date" value={itemBids.proposed_pickup_date || ''} onChange={e => setItemBids(p => ({ ...p, proposed_pickup_date: e.target.value }))}
                                className="tdp-input" />
                            </div>
                            <div>
                              <label className="tdp-label">Notes / Cover Letter</label>
                              <input value={itemBids.notes || ''} onChange={e => setItemBids(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Describe your offer..."
                                className="tdp-input" />
                            </div>
                          </div>

                          {/* Payment Method selector for multi-item tenders */}
                          {(() => {
                            const telebirrAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Mobile Wallet');
                            const bankAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Bank');
                            const selectedAccObj = financeAccounts.find(a => paymentMethod && paymentMethod === \`\${a.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Bank Transfer'}::\${a.id}\`);
                            return (
                              <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                <label className="tdp-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                  Payment Method &amp; Account *
                                </label>
                                <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="tdp-input">
                                  <option value="">-- Select Account to Pay Into --</option>
                                  {telebirrAccounts.length > 0 && (
                                    <optgroup label="📱 Telebirr Accounts">
                                      {telebirrAccounts.map(acc => (
                                        <option key={acc.id} value={\`Telebirr::\${acc.id}\`}>📱 Telebirr ({acc.account_number}) — {acc.account_name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {bankAccounts.length > 0 && (
                                    <optgroup label="🏦 Bank Transfer Accounts">
                                      {bankAccounts.map(acc => (
                                        <option key={acc.id} value={\`Bank Transfer::\${acc.id}\`}>🏦 Bank ({acc.account_number}) — {acc.account_name}{acc.bank_provider ? \` (\${acc.bank_provider})\` : ''}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                                {selectedAccObj && (
                                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>Transfer Payment To</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: 600, minWidth: '90px' }}>Account Name:</span>
                                        <span>{selectedAccObj.account_name}</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, minWidth: '90px' }}>Account No:</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedAccObj.account_number}</span>
                                      </div>
                                      {selectedAccObj.bank_provider && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'baseline' }}>
                                          <span style={{ fontWeight: 600, minWidth: '90px' }}>Provider:</span>
                                          <span>{selectedAccObj.bank_provider}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {!isOpen && <div className="tdp-alert warning" style={{marginTop: '2rem'}}>This tender is closed. No new bids can be submitted.</div>}

                      {/* CTA Section */}
                      {isOpen && (!user || isCustomerBidder) && (
                        <div className="tdp-bid-box" style={{ marginTop: '2rem', textAlign: 'center' }}>
                          <h3 className="tdp-section-title" style={{ justifyContent: 'center' }}>Ready to Submit Your Bid?</h3>
                          <p style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>
                            {user
                              ? \`You are signed in as \${user?.name || user?.full_name || user?.email}. Fill in your prices above and click submit.\`
                              : 'Sign in to your account or create a free account to participate in this tender.'}
                          </p>
                          
                          {!user ? (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <Link
                                to={\`/login?redirect=/tenders/\${tender.id}\`}
                                className="tdp-btn-primary"
                              >
                                <Lock size={16} /> Sign In to Bid
                              </Link>
                              <Link
                                to="/auth/register"
                                className="tdp-btn-outline"
                              >
                                Create Free Account
                              </Link>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '100%', margin: '0 auto' }}>
                              {message && (
                                <div className={\`tdp-alert \${message.type}\`}>
                                  {message.text}
                                </div>
                              )}
                              
                              {/* Terms Display */}
                              <div style={{ textAlign: 'left', background: 'hsl(var(--muted))', padding: '1.5rem', border: '1px solid hsl(var(--border))' }}>
                                <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Terms &amp; Conditions</h4>
                                <div style={{ fontSize: '1rem', color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                                  {tender.terms_conditions || 'Standard SUTANA bidding terms apply.'}
                                </div>
                              </div>
                              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
                                <input
                                  type="checkbox"
                                  checked={agreedToTerms}
                                  onChange={e => setAgreedToTerms(e.target.checked)}
                                  style={{ marginTop: '0.25rem', width: 18, height: 18 }}
                                />
                                <span>
                                  I have read and I agree to the <strong>Terms &amp; Conditions</strong> above. I understand that my bid is a binding offer.
                                </span>
                              </label>

                              <button type="submit" disabled={submitting || !agreedToTerms} className="tdp-btn-primary">
                                {submitting ? 'Submitting...' : 'Submit Multi-Item Bid'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                );
              })()}

              {/* Images Gallery */}
              {images.length > 0 && (
                <div className="tdp-section">
                  <h3 className="tdp-section-title"><Star size={20} /> Attachments ({images.length})</h3>
                  <div className="tdp-images-grid">
                    {images.map((f, i) => (
                      <div key={i} onClick={() => setSelectedImage(\`\${API_ORIGIN}/uploads/tenders/\${f}\`)}>
                        <img className="tdp-img-thumb" src={\`\${API_ORIGIN}/uploads/tenders/\${f}\`} alt={\`Attachment \${i + 1}\`} />
                      </div>
                    ))}
                  </div>
                  {docs.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {docs.map((f, i) => (
                        <a key={i} href={\`\${API_ORIGIN}/uploads/tenders/\${f}\`} target="_blank" rel="noopener noreferrer" className="tdp-btn-outline">
                          <FileText size={16} /> {f} <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bid Form — Single Item Tender */}
              {!isMultiTender && isOpen && isCustomerBidder && (
                <div className="tdp-bid-box" id="bid-section">
                  <div className="tdp-bid-header">
                    <h2 className="tdp-bid-header-title">{myBid ? 'Update Your Bid' : 'Submit Your Offer'}</h2>
                  </div>

                  <div className="tdp-bid-body">
                    {myBid && (
                      <div className="tdp-alert info" style={{ marginBottom: '2rem' }}>
                        <CheckCircle size={16} />
                        <div>
                          <strong>Your current bid:</strong> {parseFloat(myBid.bid_price_per_unit).toLocaleString()} ETB/unit 
                          (Total: {parseFloat(myBid.total_bid_value || myBid.bid_price_per_unit * (tender.quantity || 1)).toLocaleString()} ETB)
                        </div>
                      </div>
                    )}

                    {message && (
                      <div className={\`tdp-alert \${message.type}\`}>
                        {message.text}
                      </div>
                    )}

                    <form onSubmit={handleBidSubmit}>
                      <div className="tdp-form-group">
                        <label className="tdp-label">Full Name *</label>
                        <input className="tdp-input" required type="text"
                          value={form.bidder_full_name}
                          onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                          <label className="tdp-label">Email *</label>
                          <input className="tdp-input" required type="email"
                            value={form.bidder_email}
                            onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label className="tdp-label">Phone *</label>
                          <input className="tdp-input" required type="tel"
                            value={form.bidder_phone}
                            onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))}
                            placeholder="+251..."
                          />
                        </div>
                      </div>
                      <div className="tdp-form-group">
                        <label className="tdp-label">Bid Price (ETB/unit) *</label>
                        <input className="tdp-input" required type="number" step="0.01" min={tender.starting_bid_price}
                          value={form.bid_price_per_unit}
                          onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))}
                          placeholder={\`Min: \${parseFloat(tender.starting_bid_price).toLocaleString()} ETB\`}
                        />
                      </div>
                      <div className="tdp-form-group">
                        <label className="tdp-label">Proposed Pickup Date</label>
                        <input className="tdp-input" type="date" value={form.proposed_pickup_date}
                          onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))}
                        />
                      </div>
                      <div className="tdp-form-group">
                        <label className="tdp-label">Notes / Cover Letter</label>
                        <textarea className="tdp-input tdp-textarea" value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Describe your offer, qualifications, delivery terms..."
                        />
                      </div>
                      {(() => {
                        const telebirrAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Mobile Wallet');
                        const bankAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Bank');
                        const selectedAccObj = financeAccounts.find(a => paymentMethod && paymentMethod === \`\${a.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Bank Transfer'}::\${a.id}\`);
                        
                        return (
                          <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                            <label className="tdp-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                              Payment Method &amp; Account *
                            </label>
                            <select
                              required
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                              className="tdp-input"
                            >
                              <option value="">-- Select Account to Pay Into --</option>
                              {telebirrAccounts.length > 0 && (
                                <optgroup label="📱 Telebirr Accounts">
                                  {telebirrAccounts.map(acc => (
                                    <option key={acc.id} value={\`Telebirr::\${acc.id}\`}>
                                      📱 Telebirr ({acc.account_number}) — {acc.account_name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {bankAccounts.length > 0 && (
                                <optgroup label="🏦 Bank Transfer Accounts">
                                  {bankAccounts.map(acc => (
                                    <option key={acc.id} value={\`Bank Transfer::\${acc.id}\`}>
                                      🏦 Bank ({acc.account_number}) — {acc.account_name}{acc.bank_provider ? \` (\${acc.bank_provider})\` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {telebirrAccounts.length === 0 && bankAccounts.length === 0 && (
                                <option value="" disabled>No accounts configured yet</option>
                              )}
                            </select>

                            {selectedAccObj && (
                              <div style={{ marginTop: '1rem', padding: '1rem', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>
                                  Transfer Payment To
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1rem' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: 500, minWidth: '100px' }}>Account Name:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedAccObj.account_name}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 500, minWidth: '100px' }}>Account No:</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                      {selectedAccObj.account_number}
                                    </span>
                                  </div>
                                  {selectedAccObj.bank_provider && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline' }}>
                                      <span style={{ fontWeight: 500, minWidth: '100px' }}>Bank:</span>
                                      <span style={{ fontWeight: 600 }}>{selectedAccObj.bank_provider}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <div className="tdp-form-group">
                        <label className="tdp-label">Digital Signature *</label>
                        <input className="tdp-input" required type="text"
                          value={form.digital_signature}
                          onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                          placeholder="Type your full name as signature"
                        />
                        <div className={\`tdp-signature \${!form.digital_signature ? 'empty' : ''}\`}>
                          {form.digital_signature || 'Signature preview will appear here'}
                        </div>
                      </div>

                      {/* ── Terms & Conditions ── */}
                      <div style={{ marginTop: '2rem' }}>
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: 'hsl(var(--muted))', padding: '1.5rem', border: '1px solid hsl(var(--border))' }}>
                          <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Terms &amp; Conditions</h4>
                          <div style={{ fontSize: '1rem', color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                            {tender.terms_conditions || 'Standard SUTANA bidding terms apply.'}
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            style={{ marginTop: '0.25rem', width: 18, height: 18 }}
                          />
                          <span>
                            I have read and I agree to the <strong>Terms &amp; Conditions</strong> above. I understand that my bid is a binding offer.
                          </span>
                        </label>
                      </div>

                      <button type="submit" className="tdp-btn-primary" disabled={submitting || !agreedToTerms} style={{ width: '100%' }}>
                        {submitting ? 'Submitting...' : myBid ? 'Update My Bid' : 'Submit Bid'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Sign In CTA - Not Logged In, Single Item */}
              {!user && isOpen && !isMultiTender && (
                <div className="tdp-signin-box">
                  <h3 className="tdp-signin-title">Ready to Bid?</h3>
                  <p className="tdp-signin-desc">
                    Sign in to your account to submit a bid on this tender and compete for this contract.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to={\`/login?redirect=/tenders/\${tender.id}\`} className="tdp-btn-primary" style={{ textDecoration: 'none' }}>
                      Sign In to Bid
                    </Link>
                    <Link to="/auth/register" className="tdp-btn-outline">
                      Create Free Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Tender Closed Notice */}
              {!isOpen && tender.status !== 'open' && (
                <div className="tdp-signin-box">
                  <h3 className="tdp-signin-title">
                    {tender.status === 'awarded' ? 'Tender Awarded' : tender.status === 'cancelled' ? 'Tender Cancelled' : 'Bidding Closed'}
                  </h3>
                  <p className="tdp-signin-desc">
                    {tender.status === 'awarded'
                      ? 'This tender has been awarded to a winning bidder.'
                      : tender.status === 'cancelled'
                      ? 'This tender has been cancelled by the issuing party.'
                      : 'The bidding window for this tender has closed.'}
                  </p>
                  
                  {winner && tender.status === 'awarded' && (
                    <div style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left', display: 'inline-block' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                        Winner Announced
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{winner.winner_name}</div>
                      <div style={{ fontSize: '1rem', color: 'hsl(var(--accent))', marginTop: '0.25rem', fontWeight: 600 }}>
                        Winning Bid: {parseFloat(winner.bid_price_per_unit).toLocaleString()} ETB/unit
                      </div>
                    </div>
                  )}

                  <div>
                    <button onClick={() => navigate('/tenders/buy')} className="tdp-btn-primary">
                      Browse Open Tenders
                    </button>
                  </div>
                </div>
              )}
              
              {/* Cancellation */}
              {tender.cancellation_reason && (
                <div className="tdp-alert error">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Cancellation Reason:</strong>
                    <p style={{ margin: '0.5rem 0 0' }}>{tender.cancellation_reason}</p>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>`;

const newContent = prefix + '\n' + replacement + '\n' + suffix;
fs.writeFileSync(path, newContent);
console.log('Successfully rewrote ' + path);
