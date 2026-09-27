import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLocationContext, useSnackbar } from '../../contexts';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { WhatsAppIcon } from '../../components/common';
import { generateOrderId, buildQuickOrderWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import { getGoogleMapsNavigationUrl } from '../../lib/geocoding';
import { validateOrderInput } from '../../lib/validation';
import { dispatchOrderWebhook } from '../../lib/webhookPipeline';
import { uploadImageFile } from '../../lib/uploadImage';
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
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode: 'photo' (Send Photo to Order) or 'text' (Type/Paste List)
  const [orderMode, setOrderMode] = useState<'photo' | 'text'>('photo');

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

    const isPhoto = orderMode === 'photo';
    const hasAttachedImage = isPhoto || Boolean(listImageFile || listImagePreview);

    const validation = validateOrderInput({
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      deliveryAddress: formData.delivery_address,
      shoppingList: isPhoto ? undefined : formData.shopping_list,
      hasImage: hasAttachedImage,
    });

    if (!validation.isValid) {
      showSnackbar(validation.error || 'Please check your inputs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      const finalCustomerName = validation.cleanedName!;
      const finalCustomerPhone = validation.cleanedPhone!;
      const finalDeliveryAddress = validation.cleanedAddress!;
      let finalShoppingList = isPhoto 
        ? (formData.shopping_list ? `[Handwritten List Photo] Notes: ${formData.shopping_list}` : '[Handwritten List Photo]')
        : (validation.cleanedList || '');

      // Upload image to storage if a file was provided (non-blocking fallback)
      let uploadedImageUrl: string | null = null;
      if (listImageFile) {
        try {
          uploadedImageUrl = await uploadImageFile(listImageFile);
          if (uploadedImageUrl && !uploadedImageUrl.startsWith('data:')) {
            finalShoppingList = `${finalShoppingList}\n[Photo URL: ${uploadedImageUrl}]`.trim();
          }
        } catch (uploadErr) {
          console.warn('Image upload skipped or timed out, will share via WhatsApp:', uploadErr);
        }
      }

      // 1. Persist the quick order to Supabase if configured (non-blocking)
      if (isSupabaseConfigured) {
        try {
          await withTimeout(
            supabase.from('orders').insert({
              id: orderId,
              customer_name: finalCustomerName,
              customer_phone: finalCustomerPhone,
              delivery_address: finalDeliveryAddress,
              map_link: formData.map_link || null,
              subtotal_amount: 0,
              delivery_fee: settings?.flat_fee || 0,
              total_amount: settings?.flat_fee || 0,
              status: 'pending',
              is_quick_order: true,
              quick_order_text: finalShoppingList,
            }),
            3000
          );
        } catch (dbErr) {
          console.warn('Database save skipped or timed out, proceeding to WhatsApp:', dbErr);
        }
      }

      // Non-blocking outbound order webhook pipeline
      dispatchOrderWebhook({
        id: orderId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        delivery_address: finalDeliveryAddress,
        map_link: formData.map_link || null,
        subtotal: 0,
        delivery_fee: settings?.flat_fee || 0,
        total: settings?.flat_fee || 0,
        items: [],
        is_quick_order: true,
        quick_order_text: finalShoppingList,
      }).catch(() => {});

      // 2. Build WhatsApp message (NO EMOJIS, NO ORDER NUMBER, LINE-BY-LINE FORMAT)
      const message = buildQuickOrderWhatsAppMessage({
        orderId,
        shoppingList: isPhoto ? formData.shopping_list : finalShoppingList,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        deliveryAddress: finalDeliveryAddress,
        mapLink: formData.map_link || null,
        isPhotoOrder: isPhoto,
        hasAttachedImage: Boolean(listImageFile || listImagePreview),
      });

      // 3. Open WhatsApp
      openWhatsApp(storeWhatsAppNumber, message);

      // 4. Redirect to confirmation
      navigate(`/order/${orderId}`);

    } catch (error) {
      console.error('Error processing quick order:', error);
      showSnackbar('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-container quick-order-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta 
          name="description" 
          content="Type, paste, or send a photo of your handwritten grocery shopping list for fast home delivery from Sai Darshan Shopping Mart Jabalpur." 
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
          {/* Top Mode Selector Tabs: Send Photo vs Type List */}
          <div className="quick-order-mode-tabs" role="tablist" aria-label="Select Quick Order Mode">
            <button
              type="button"
              role="tab"
              aria-selected={orderMode === 'photo'}
              className={`quick-order-mode-tab ${orderMode === 'photo' ? 'quick-order-mode-tab--active' : ''}`}
              onClick={() => setOrderMode('photo')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
              <span>Send Photo to Order</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={orderMode === 'text'}
              className={`quick-order-mode-tab ${orderMode === 'text' ? 'quick-order-mode-tab--active' : ''}`}
              onClick={() => setOrderMode('text')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>format_list_bulleted</span>
              <span>Type or Paste List</span>
            </button>
          </div>

          <form className="checkout-form" id="quick-order-form" onSubmit={handleSubmit}>
            
            {/* OPTION 1: Send Photo to Order Card */}
            {orderMode === 'photo' && (
              <div className="manual-list-card">
                <div className="manual-list-card__title-row">
                  <div className="manual-list-card__icon-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>photo_camera</span>
                  </div>
                  <div>
                    <h2 className="manual-list-card__heading">Send Photo of Handwritten List</h2>
                    <p className="manual-list-card__subtext">
                      Wrote your list on a paper slip or notepad? Snap a photo below, or send it directly after WhatsApp opens.
                    </p>
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

                {/* Buttons to capture/upload */}
                {!listImagePreview ? (
                  <div className="manual-list-buttons">
                    <button
                      type="button"
                      className="manual-capture-btn manual-capture-btn--camera"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      <span>Take Photo (Camera)</span>
                    </button>

                    <button
                      type="button"
                      className="manual-capture-btn manual-capture-btn--gallery"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined">add_photo_alternate</span>
                      <span>Upload from Gallery</span>
                    </button>
                  </div>
                ) : (
                  /* Preview State when Image is attached */
                  <div className="manual-preview-container">
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
                          Handwritten List Attached
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
                        <span>View Full Image</span>
                      </button>

                      <button
                        type="button"
                        className="manual-capture-btn--camera manual-preview-action-btn"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span>
                        <span>Retake</span>
                      </button>

                      <button
                        type="button"
                        className="manual-preview-action-btn manual-preview-action-btn--delete"
                        onClick={handleRemovePhoto}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                    Extra Note / Brand Preferences (Optional):
                  </label>
                  <input
                    type="text"
                    name="shopping_list"
                    value={formData.shopping_list}
                    onChange={handleChange}
                    placeholder="E.g., Please send fresh packet milk and Fortune brand oil..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.15))',
                      background: 'var(--md-sys-color-surface, #fff)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* OPTION 2: Type or Paste List Card */}
            {orderMode === 'text' && (
              <div className="quick-order-card">
                <div className="quick-order-card__header">
                  <div className="quick-order-card__title-group">
                    <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary, #1E8E3E)', fontSize: '20px' }}>format_list_bulleted</span>
                    <h2 className="quick-order-card__title">Type or Paste Your List</h2>
                  </div>

                  <div className="quick-order-actions-bar">
                    <button
                      type="button"
                      className="quick-paste-btn"
                      onClick={handleQuickPaste}
                      title="Paste text from clipboard"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_paste</span>
                      <span>Quick Paste</span>
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

                <textarea
                  ref={textareaRef}
                  className="quick-order-textarea"
                  placeholder="E.g.,&#10;2kg Sugar&#10;1 packet Amul Butter&#10;500g Toor Dal&#10;5kg Aashirvaad Atta..."
                  name="shopping_list"
                  value={formData.shopping_list}
                  onChange={handleChange}
                  required={orderMode === 'text'}
                  aria-label="Shopping list items"
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
            )}

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
                  className="sdm-btn sdm-btn--outlined"
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
                <strong>{orderMode === 'photo' ? 'Photo / List' : 'Typed List'}</strong>: {orderMode === 'photo' ? 'Snap your paper list and fill details.' : 'Type your grocery items and fill details.'}
              </li>
              <li>
                <strong>Open WhatsApp</strong>: Click below to open WhatsApp with your address and location.
              </li>
              <li>
                <strong>Send Photo / Chat</strong>: {orderMode === 'photo' ? 'Send the message and share your paper list photo in the chat.' : 'Send the pre-typed list directly in the chat.'}
              </li>
              <li>
                <strong>Packing &amp; Delivery</strong>: We pack items, confirm your total, and deliver to your doorstep.
              </li>
            </ol>
          </div>

          <div style={{ marginTop: '8px' }}>
            <button 
              className="sdm-btn sdm-btn--whatsapp checkout-page__submit-btn"
              type="submit"
              form="quick-order-form"
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={20} />
              <span>
                {isSubmitting 
                  ? 'Opening WhatsApp...' 
                  : orderMode === 'photo' 
                    ? 'Send Photo to Order via WhatsApp' 
                    : 'Send List via WhatsApp'}
              </span>
            </button>
            <p className="checkout-page__whatsapp-notice">
              {orderMode === 'photo'
                ? 'WhatsApp will open with your details. Send your handwritten list photo in the chat!'
                : 'WhatsApp will open with your full list and delivery details.'}
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
