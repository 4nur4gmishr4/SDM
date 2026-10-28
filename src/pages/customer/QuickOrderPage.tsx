import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLocationContext, useSnackbar } from '../../contexts';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { WhatsAppIcon } from '../../components/common';
import { 
  generateOrderId, 
  buildQuickOrderWhatsAppMessage, 
  openWhatsApp, 
  STORE_WHATSAPP_NUMBER,
  STORE_UPI_ID,
  STORE_UPI_NUMBER,
  STORE_LEGAL_NAME,
  getUpiPaymentUrl 
} from '../../lib/orderUtils';
import { getGoogleMapsNavigationUrl } from '../../lib/geocoding';
import { validateOrderInput } from '../../lib/validation';
import { uploadImageFile } from '../../lib/uploadImage';
import { haptics } from '../../lib/haptics';
import type { QuickOrderFormData } from '../../types/order';
import './CheckoutPage.css';
import './QuickOrderPage.css';

// Popular quick essentials for 1-tap addition
const QUICK_SUGGESTIONS = [
  '2kg Sugar',
  '5kg Aashirvaad Atta',
  '1L Amul Gold Milk',
  '1L Fortune Sunflower Oil',
  '1kg Toor Dal',
  'Tata Salt 1kg',
  'Maggi 4-Pack',
  'Amul Butter 100g',
];

export function QuickOrderPage() {
  const { location, openModal } = useLocationContext();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-submission 3 payment options states (Zero admin db insertion)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<'upi_app' | 'upi_qr' | 'cod'>('upi_app');
  const [codConfirmed, setCodConfirmed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Handwritten / manual list photo states
  const [listImageFile, setListImageFile] = useState<File | null>(null);
  const [listImagePreview, setListImagePreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pageTitle = 'Quick Order via Shopping List | Sai Darshan Shopping Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const [formData, setFormData] = useState<QuickOrderFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: location.formattedAddress || '',
    map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
    shopping_list: '',
  });

  // Handle Web Share Target API payload from WhatsApp / other apps
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sharedText = searchParams.get('text') || searchParams.get('shopping_list') || searchParams.get('title');
      if (sharedText && sharedText.trim()) {
        setFormData(prev => ({
          ...prev,
          shopping_list: sharedText.trim()
        }));
        showSnackbar('Shared grocery list loaded automatically!');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (location.formattedAddress) {
      setFormData(prev => ({
        ...prev,
        delivery_address: location.formattedAddress,
        map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
      }));
    }
  }, [location]);

  const { settings } = useDeliverySettings();
  const storeWhatsAppNumber = STORE_WHATSAPP_NUMBER;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Quick Paste functionality from clipboard
  const handleQuickPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          setFormData(prev => ({
            ...prev,
            shopping_list: prev.shopping_list 
              ? `${prev.shopping_list.trim()}\n${text.trim()}`
              : text.trim(),
          }));
          showSnackbar('Pasted grocery list from clipboard!');
          textareaRef.current?.focus();
          return;
        }
      }
    } catch {
      // Permission denied or clipboard empty
    }
    textareaRef.current?.focus();
    showSnackbar('Tap the box and use paste (Ctrl+V or long-press) to insert your list.');
  };

  // Clear typed list
  const handleClearList = () => {
    setFormData(prev => ({ ...prev, shopping_list: '' }));
    showSnackbar('Shopping list cleared.');
  };

  // Add suggestion chip to list
  const handleAddChip = (item: string) => {
    setFormData(prev => ({
      ...prev,
      shopping_list: prev.shopping_list ? `${prev.shopping_list.trim()}\n• ${item}` : `• ${item}`,
    }));
    showSnackbar(`Added ${item} to list`);
  };

  // Handle image capture or selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select a valid image file.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showSnackbar('Image size is too large (max 15MB).');
        return;
      }

      setListImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setListImagePreview(previewUrl);
      showSnackbar('Handwritten list photo attached successfully!');
    }
    e.target.value = '';
  };

  // Remove photo
  const handleRemovePhoto = () => {
    if (listImagePreview && listImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(listImagePreview);
    }
    setListImageFile(null);
    setListImagePreview(null);
    showSnackbar('List photo removed.');
  };

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (listImagePreview && listImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(listImagePreview);
      }
    };
  }, [listImagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!navigator.onLine) {
      showSnackbar('You are currently offline. Please reconnect to the internet to place your order.');
      return;
    }

    const hasAttachedImage = Boolean(listImageFile || listImagePreview);

    const validation = validateOrderInput({
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      deliveryAddress: formData.delivery_address,
      shoppingList: formData.shopping_list,
      hasImage: hasAttachedImage,
    });

    if (!validation.isValid) {
      showSnackbar(validation.error || 'Please enter items or attach a photo of your list.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      const finalCustomerName = validation.cleanedName!;
      const finalCustomerPhone = validation.cleanedPhone!;
      const finalDeliveryAddress = validation.cleanedAddress!;

      // Upload image to storage if provided so a permanent public URL is generated
      let uploadedImageUrl: string | null = null;
      if (listImageFile) {
        try {
          showSnackbar('Uploading parchi photo...');
          uploadedImageUrl = await uploadImageFile(listImageFile, { folder: 'order-lists' });
        } catch (uploadErr) {
          console.warn('Image upload skipped or timed out, will share via WhatsApp:', uploadErr);
        }
      }

      // Build WhatsApp message with direct public photo link
      const message = buildQuickOrderWhatsAppMessage({
        orderId,
        shoppingList: formData.shopping_list || '',
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        deliveryAddress: finalDeliveryAddress,
        mapLink: formData.map_link || null,
        isPhotoOrder: hasAttachedImage,
        hasAttachedImage,
        imageUrl: uploadedImageUrl && !uploadedImageUrl.startsWith('data:') ? uploadedImageUrl : null,
      });

      // Haptic success vibration & Open WhatsApp directly
      haptics.success();
      openWhatsApp(storeWhatsAppNumber, message);

      // ADMIN BYPASS: DO NOT insert into 'orders' table in Supabase!
      // Admin orders page will not receive quick orders as requested by user.
      // All order details and photos are shared directly via WhatsApp.

      // Transition immediately to the 3 Payment Options view (NO redirect to confirmation page)
      setSubmittedOrderId(orderId);
      setSubmittedMessage(message);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error processing quick order:', error);
      showSnackbar('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate 3 Payment Options view after WhatsApp order send
  if (isSubmitted) {
    return (
      <div className="layout-container quick-order-page quick-order-success-screen">
        <Helmet>
          <title>Order Sent on WhatsApp — Payment Options | Sai Darshan Shopping Mart</title>
        </Helmet>

        {/* Success Banner */}
        <div className="qo-success-banner">
          <div className="qo-success-icon-wrap">
            <WhatsAppIcon size={32} />
            <span className="material-symbols-outlined qo-success-check-badge">check_circle</span>
          </div>
          <h1 className="qo-success-title">Order WhatsApp Par Bhej Diya Gaya Hai!</h1>
          <p className="qo-success-subtitle">
            Aapki parchi photo aur order details Sai Darshan Mart ke WhatsApp par share ho gayi hain. Ab payment ka tareeka chuniye:
          </p>
          <div className="qo-success-ref">Ref: <strong>{submittedOrderId}</strong></div>
        </div>

        {/* 3 Payment Options Tabs */}
        <div className="qo-payment-box">
          <div className="qo-payment-tabs">
            <button
              type="button"
              className={`qo-payment-tab ${selectedPaymentTab === 'upi_app' ? 'qo-payment-tab--active' : ''}`}
              onClick={() => setSelectedPaymentTab('upi_app')}
            >
              <span className="material-symbols-outlined">payments</span>
              <span>1. Pay via UPI App</span>
            </button>
            <button
              type="button"
              className={`qo-payment-tab ${selectedPaymentTab === 'upi_qr' ? 'qo-payment-tab--active' : ''}`}
              onClick={() => setSelectedPaymentTab('upi_qr')}
            >
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <span>2. Scan QR Code</span>
            </button>
            <button
              type="button"
              className={`qo-payment-tab ${selectedPaymentTab === 'cod' ? 'qo-payment-tab--active' : ''}`}
              onClick={() => setSelectedPaymentTab('cod')}
            >
              <span className="material-symbols-outlined">local_shipping</span>
              <span>3. Cash on Delivery</span>
            </button>
          </div>

          {/* Option 1: Pay with UPI App */}
          {selectedPaymentTab === 'upi_app' && (
            <div className="qo-tab-content">
              <div className="qo-tab-lead">
                <span className="material-symbols-outlined" style={{ color: '#1E8E3E', fontSize: '28px' }}>mobile_friendly</span>
                <div>
                  <h3 className="qo-tab-heading">1-Tap Direct UPI Payment</h3>
                  <p className="qo-tab-desc">Neeche diye button par tap karein, aapke mobile me PhonePe / GPay / Paytm seedha khul jayega.</p>
                </div>
              </div>

              <button
                type="button"
                className="sdsm-btn sdsm-btn--primary qo-upi-app-btn"
                onClick={() => {
                  const upiUrl = getUpiPaymentUrl({ orderId: submittedOrderId, note: `Quick Order ${submittedOrderId}` });
                  window.location.href = upiUrl;
                }}
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>Open UPI App to Pay</span>
              </button>

              <div className="qo-upi-app-logos">
                <span className="qo-app-pill">Google Pay</span>
                <span className="qo-app-pill">PhonePe</span>
                <span className="qo-app-pill">Paytm</span>
                <span className="qo-app-pill">BHIM UPI</span>
                <span className="qo-app-pill">CRED</span>
              </div>
            </div>
          )}

          {/* Option 2: Scan QR Code */}
          {selectedPaymentTab === 'upi_qr' && (
            <div className="qo-tab-content qo-tab-content--qr">
              <h3 className="qo-tab-heading">{STORE_LEGAL_NAME}</h3>
              <p className="qo-tab-desc">Kisi bhi UPI app se scanner kholkar neeche diya official QR code scan karein:</p>
              
              <div className="qo-qr-image-wrapper">
                <img
                  src="/sai-darshan-upi-qr.png"
                  alt="Sai Darshan Shopping Mart UPI QR Code"
                  className="qo-qr-image"
                />
                <div className="qo-qr-merchant-info">
                  <strong>Sai Darshan Shopping Mart</strong>
                  <span>UPI ID: <code>{STORE_UPI_ID}</code></span>
                  <span>Phone / Number: <code>+91 {STORE_UPI_NUMBER}</code></span>
                </div>
              </div>

              <div className="qo-copy-row">
                <button
                  type="button"
                  className="sdsm-btn sdsm-btn--outlined"
                  onClick={() => {
                    navigator.clipboard.writeText(STORE_UPI_ID);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                >
                  <span className="material-symbols-outlined">{copiedUpi ? 'check' : 'content_copy'}</span>
                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
                </button>
                <a
                  href="/sai-darshan-upi-qr.png"
                  download="Sai-Darshan-Mart-QR.png"
                  className="sdsm-btn sdsm-btn--tonal"
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Download QR</span>
                </a>
              </div>
            </div>
          )}

          {/* Option 3: Cash on Delivery (COD) */}
          {selectedPaymentTab === 'cod' && (
            <div className="qo-tab-content">
              <div className="qo-tab-lead">
                <span className="material-symbols-outlined" style={{ color: '#F9AB00', fontSize: '32px' }}>home_pin</span>
                <div>
                  <h3 className="qo-tab-heading">Cash on Delivery (COD) / Pay at Doorstep</h3>
                  <p className="qo-tab-desc">Ghar par delivery partner ke pahunchne par cash ya QR scanner se payment karein.</p>
                </div>
              </div>

              {codConfirmed ? (
                <div className="qo-cod-confirmed-banner">
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1E8E3E' }}>task_alt</span>
                  <div>
                    <strong>✓ Cash on Delivery (COD) Confirm Ho Gaya!</strong>
                    <p>Hamara delivery rider aapka rashan pack karke aapke address par deliver karega. Doorstep par payment cash ya scanner se karein.</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="sdsm-btn sdsm-btn--primary qo-cod-confirm-btn"
                  onClick={() => {
                    setCodConfirmed(true);
                    haptics.success();
                    showSnackbar('Cash on Delivery confirmed!');
                  }}
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Confirm Cash on Delivery</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Helpful Bottom Actions */}
        <div className="qo-bottom-actions">
          <button
            type="button"
            className="sdsm-btn sdsm-btn--whatsapp"
            onClick={() => openWhatsApp(storeWhatsAppNumber, submittedMessage)}
          >
            <WhatsAppIcon size={18} />
            <span>Open WhatsApp Chat Again</span>
          </button>
          <Link to="/" className="sdsm-btn sdsm-btn--tonal">
            <span className="material-symbols-outlined">home</span>
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container quick-order-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta 
          name="description" 
          content="Type, paste, or send a photo of your handwritten grocery shopping list for fast home delivery from Sai Darshan Shopping Mart Jabalpur. &quot;There is only one Boss: The Customer.&quot;" 
        />
      </Helmet>

      <header className="quick-order-page__header">
        <h1 className="quick-order-page__title">
          <span className="material-symbols-outlined quick-order-page__title-icon">edit_note</span>
          <span>Quick Order</span>
        </h1>
        <p className="quick-order-page__subtitle">
          Don&apos;t want to browse? Send a photo of your handwritten list or type your items, and we&apos;ll pack and deliver directly to your doorstep.
        </p>
      </header>

      <div className="quick-order-page__content">
        <div className="quick-order-page__form-section">


          <form className="checkout-form" id="quick-order-form" onSubmit={handleSubmit}>
            

            {/* Unified Shopping List & Photo Upload Card */}
            <div className="quick-order-card">
              <div className="quick-order-card__header">
                <div className="quick-order-card__title-group">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary, #1E8E3E)', fontSize: '22px' }}>
                    edit_note
                  </span>
                  <div>
                    <h2 className="quick-order-card__title" style={{ margin: 0 }}>Your Grocery List or Paper Slip</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Type items below, paste from clipboard, or snap a photo of your handwritten slip.
                    </p>
                  </div>
                </div>

                <div className="quick-order-actions-bar">
                  <button
                    type="button"
                    className="quick-paste-btn"
                    onClick={() => cameraInputRef.current?.click()}
                    title="Take photo of handwritten slip"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    className="quick-paste-btn"
                    onClick={() => galleryInputRef.current?.click()}
                    title="Upload photo from gallery"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_photo_alternate</span>
                    <span>Gallery</span>
                  </button>

                  <button
                    type="button"
                    className="quick-paste-btn"
                    onClick={handleQuickPaste}
                    title="Paste text from clipboard"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_paste</span>
                    <span>Paste</span>
                  </button>

                  {formData.shopping_list && (
                    <button
                      type="button"
                      className="quick-clear-btn"
                      onClick={handleClearList}
                      title="Clear text"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>clear</span>
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden File Inputs */}
              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
                style={{ display: 'none' }} 
                onChange={handleImageChange}
                aria-label="Capture handwritten list with camera"
              />
              <input 
                ref={galleryInputRef}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageChange}
                aria-label="Upload handwritten list from gallery"
              />

              {/* Attached Photo Preview if present */}
              {listImagePreview && (
                <div className="manual-preview-container" style={{ margin: '10px 0 14px 0' }}>
                  <div className="manual-preview-main">
                    <div 
                      className="manual-preview-thumb-wrapper" 
                      onClick={() => setIsModalOpen(true)}
                      role="button"
                      tabIndex={0}
                      title="Click to view full photo"
                    >
                      <img 
                        src={listImagePreview} 
                        alt="Handwritten shopping list preview" 
                        className="manual-preview-thumb" 
                      />
                    </div>
                    <div className="manual-preview-meta">
                      <span className="manual-preview-badge">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                        Paper Slip Photo Attached
                      </span>
                      <span className="manual-preview-filename">
                        {listImageFile?.name || 'Handwritten_list_photo.jpg'}
                      </span>
                      <span className="manual-preview-filesize">
                        {listImageFile ? `${(listImageFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Ready to send'}
                      </span>
                    </div>
                  </div>

                  <div className="manual-preview-actions">
                    <button
                      type="button"
                      className="manual-preview-action-btn"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      className="manual-preview-action-btn"
                      style={{ color: 'var(--md-sys-color-error, #ba1a1a)' }}
                      onClick={handleRemovePhoto}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}

              <textarea
                ref={textareaRef}
                className="quick-order-textarea"
                placeholder="Type or paste items here...&#10;E.g.,&#10;2kg Sugar&#10;1 packet Amul Butter&#10;500g Toor Dal&#10;5kg Aashirvaad Atta..."
                name="shopping_list"
                value={formData.shopping_list}
                onChange={handleChange}
                aria-label="Shopping list items"
                rows={4}
              />

              {/* 1-Tap Quick Suggestions */}
              <div className="quick-chips-wrapper">
                <span className="quick-chips-label">1-Tap Fast Essentials:</span>
                <div className="quick-chips-container">
                  {QUICK_SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="quick-chip"
                      onClick={() => handleAddChip(item)}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Details Card (Shared for both Photo & Text modes) */}
            <div className="quick-order-card">
              <div className="quick-order-card__title-group">
                <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary, #1E8E3E)', fontSize: '20px' }}>local_shipping</span>
                <h2 className="quick-order-card__title">Delivery Address &amp; Contact Details</h2>
              </div>
              
              <md-outlined-text-field
                className="checkout-form__field"
                label="Full Name"
                name="customer_name"
                required
                value={formData.customer_name}
                onInput={handleChange}
              >
                <md-icon slot="leading-icon">person</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                className="checkout-form__field"
                label="Phone Number (WhatsApp)"
                name="customer_phone"
                type="tel"
                required
                value={formData.customer_phone}
                onInput={handleChange}
              >
                <md-icon slot="leading-icon">phone</md-icon>
              </md-outlined-text-field>

              {/* Live GPS Pinned Address Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-primary-container, #CEEAD6)',
                color: 'var(--md-sys-color-on-primary-container, #0D652D)',
                border: '1px solid rgba(30, 142, 62, 0.2)',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', flexShrink: 0 }}>location_on</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>
                      GPS Location: {location.area || 'Jabalpur'}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {location.formattedAddress}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="sdsm-btn sdsm-btn--outlined"
                  style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0, background: 'var(--md-sys-color-surface, #fff)' }}
                  onClick={openModal}
                >
                  Change on Map
                </button>
              </div>

              <div style={{ width: '100%' }}>
                <textarea
                  className="checkout-form__field"
                  placeholder="Complete Delivery Address with Landmark *"
                  name="delivery_address"
                  required
                  value={formData.delivery_address}
                  onChange={handleChange}
                  style={{
                    minHeight: '90px',
                    padding: '14px 16px',
                    border: '1.5px solid var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.15))',
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ width: '100%' }}>
                <md-outlined-text-field
                  className="checkout-form__field"
                  label="Google Maps Link (Optional)"
                  name="map_link"
                  type="url"
                  value={formData.map_link || ''}
                  onInput={handleChange}
                >
                  <md-icon slot="leading-icon">location_on</md-icon>
                </md-outlined-text-field>
                <p className="checkout-form__helper-text">
                  Pasting a Google Maps link helps our delivery rider reach you directly.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Info & Order Submit Button */}
        <div className="quick-order-page__sidebar">
          <DeliveryInfo rulesText={settings?.rules_text} />

          <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: '18px', borderRadius: '16px' }}>
            <h3 className="typescale-title-medium" style={{ marginBottom: '10px', fontWeight: 700 }}>
              How Quick Order Works
            </h3>
            <ol style={{ paddingLeft: '18px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>List or Photo</strong>: Type items or snap a photo of your handwritten paper slip.
              </li>
              <li>
                <strong>Address &amp; Location</strong>: Confirm your delivery address and name.
              </li>
              <li>
                <strong>WhatsApp Send</strong>: Click below to launch WhatsApp with your ready order.
              </li>
              <li>
                <strong>Doorstep Delivery</strong>: We pack items, confirm total, and deliver fast.
              </li>
            </ol>
          </div>

          <div style={{ marginTop: '8px' }}>
            <button 
              className="sdsm-btn sdsm-btn--whatsapp checkout-page__submit-btn"
              type="submit"
              form="quick-order-form"
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={20} />
              <span>
                {isSubmitting 
                  ? 'Opening WhatsApp...' 
                  : listImageFile || listImagePreview
                    ? 'Send Photo Order via WhatsApp' 
                    : 'Send Quick Order via WhatsApp'}
              </span>
            </button>
            <p className="checkout-page__whatsapp-notice">
              WhatsApp will open with your order details and delivery GPS location.
            </p>
          </div>
        </div>
      </div>

      {/* Enlarged Photo Modal View */}
      {isModalOpen && listImagePreview && (
        <div 
          className="manual-photo-modal-overlay" 
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="manual-photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="manual-photo-modal-close" 
              onClick={() => setIsModalOpen(false)}
              aria-label="Close enlarged photo"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img 
              src={listImagePreview} 
              alt="Enlarged handwritten shopping list" 
              className="manual-photo-modal-img" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
