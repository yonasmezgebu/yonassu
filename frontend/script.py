import re
with open('src/pages/LandingPage/FarmingServicePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    \"import PrescriptionViewer from '../shared/PrescriptionViewer';\",
    \"import RentalAgreementModal from './RentalAgreementModal';\\nimport carService from '../../services/carService';\"
)

# 2. State
content = content.replace(
    \"const [orderQuantity, setOrderQuantity] = useState(1);\",
    \"const [reserveModalOpen, setReserveModalOpen] = useState(false);\\n  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });\"
)

# 3. Toast function and handleReserve
old_order_logic = \"\"\"  const handleRequestOrder = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/farming', orderProduct: product } });
    } else {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await axios.post('/farming/orders', {
        items: [{ product_id: selectedProduct.id, quantity: orderQuantity }],
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryOption,
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress : '',
        delivery_fee: deliveryOption === 'delivery' ? 50 : 0
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false); setSubmitSuccess(false); setOrderQuantity(1);
        setCustomerName(''); setCustomerPhone('');
        setDeliveryOption('pickup'); setDeliveryAddress('');
      }, 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };\"\"\"

new_order_logic = \"\"\"  const showToast = (type, title, message, redirectDelay = 0) => {
    setToast({ show: true, type, title, message });
    if (redirectDelay) {
      setTimeout(() => navigate('/customer'), redirectDelay);
    } else {
      setTimeout(() => setToast({ show: false, type: '', title: '', message: '' }), 5000);
    }
  };

  const handleReserve = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    } else {
      setSelectedProduct({
        id: product.id,
        name: product.name,
        dailyRate: product.price,
        image1: product.product_image,
        availability: product.stock_quantity > 0 ? 'Available' : 'Out of Stock'
      });
      setReserveModalOpen(true);
    }
  };

  const handleReservationSuccess = (orderData) => {
    setReserveModalOpen(false);
    showToast(
      'success',
      '?? Reservation Confirmed!',
      Your machinery rental # has been submitted.,
      3000
    );
  };\"\"\"
content = content.replace(old_order_logic, new_order_logic)

# 4. Filter categories and products
# We only want "product machines" - let's just make it so all products fetched are displayed as machines, but we remove the Categories and Info sections completely for a cleaner look.
main_content_old = \"\"\"      {/* Main Content */}
      <section className={styles.mainContent}>
        {/* Categories */}
        <div className={styles.categoriesSection}>\"\"\"
main_content_new = \"\"\"      {/* Toast Notification Banner */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, minWidth: '340px', maxWidth: '560px',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: 1.5px solid ,
          borderRadius: '12px', padding: '1rem 1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: toast.type === 'success' ? '#15803d' : '#dc2626' }}>
            {toast.title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: toast.type === 'success' ? '#166534' : '#991b1b' }}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Main Content */}
      <section className={styles.mainContent}>
        {/* Categories */}
        <div className={styles.categoriesSection} style={{display: 'none'}}>\"\"\"
content = content.replace(main_content_old, main_content_new)

info_sections_old = \"\"\"        {/* Info Sections */}
        <div className={styles.infoGrid}>\"\"\"
info_sections_new = \"\"\"        {/* Info Sections */}
        <div className={styles.infoGrid} style={{display: 'none'}}>\"\"\"
content = content.replace(info_sections_old, info_sections_new)

# 5. Fix card style (replace Order Now with Reserve)
card_btn_old = \"\"\"                      <button className={styles.orderBtn} onClick={() => handleRequestOrder(product)} disabled={product.stock_quantity <= 0}>
                        <ShoppingCart size={16} /> {product.stock_quantity > 0 ? 'Order Now' : 'Unavailable'}
                      </button>\"\"\"
card_btn_new = \"\"\"                      <button className={styles.orderBtn} onClick={() => handleReserve(product)} disabled={product.stock_quantity <= 0}>
                        <ShoppingCart size={16} /> {product.stock_quantity > 0 ? 'Reserve Machine' : 'Unavailable'}
                      </button>\"\"\"
content = content.replace(card_btn_old, card_btn_new)

# 6. Change price tag to /per day
price_old = \"\"\"                      <div className={styles.priceTag}>
                        <span className={styles.priceCurrency}>ETB</span>
                        <span className={styles.priceValue}>{parseFloat(product.price).toFixed(2)}</span>
                      </div>\"\"\"
price_new = \"\"\"                      <div className={styles.priceTag}>
                        <span className={styles.priceCurrency}>ETB</span>
                        <span className={styles.priceValue}>{parseFloat(product.price).toFixed(2)}</span>
                        <span style={{fontSize: '11px', opacity: 0.8, marginLeft: '4px'}}>/day</span>
                      </div>\"\"\"
content = content.replace(price_old, price_new)

# 7. Change title in Hero
hero_title_old = \"\"\"<h1>SUTANA Agricultural <span className={styles.goldText}>Supplies</span></h1>
          <p>Seeds, Fertilizers, and Tools for Modern Farming</p>\"\"\"
hero_title_new = \"\"\"<h1>SUTANA Agri<span className={styles.goldText}>Rent</span></h1>
          <p>Tractors, Dozers, and Machineries for Modern Farming</p>\"\"\"
content = content.replace(hero_title_old, hero_title_new)

# 8. Modals
modals_old = \"\"\"      {/* Order Modal */}
      {isModalOpen && selectedProduct && (\"\"\"

# We need to replace the entire order modal with the RentalAgreementModal
content = re.sub(r'\\{\\/\\* Order Modal \\*\\/\\}.*?\\{\\viewImage && <PrescriptionViewer imageUrl=\\{viewImage\\.url\\} onClose=\\{handleCloseViewer\\} \\/\\>\\}', 
\"\"\"{reserveModalOpen && selectedProduct && (
        <RentalAgreementModal 
          car={selectedProduct} 
          isOpen={reserveModalOpen} 
          onClose={() => setReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}\"\"\", content, flags=re.DOTALL)

with open('src/pages/LandingPage/FarmingServicePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Script finished')
