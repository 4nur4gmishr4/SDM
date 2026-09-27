import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../../contexts/CartContext';
import { formatPrice, STORE_NAME, STORE_WHATSAPP_CLEAN } from '../../lib/orderUtils';
import type { ProductVariant } from '../../types/product';
import { ProductDetailSkeleton, WatermarkBanner, WhatsAppIcon } from '../../components/common';
import { useProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import './ProductDetailPage.css';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  
  const { product, isLoading } = useProduct(id);
  const { categories } = useCategories();
  
  // Local state for quantity counter
  const [quantity, setQuantity] = useState(1);
  // Active selected pack / quantity option
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    // Reset quantity when product changes
    setQuantity(1);
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else if (product) {
      setSelectedVariant({
        id: 'default',
        unit_size: product.unit_size || '1 unit',
        price: product.price,
        mrp: product.mrp,
        is_available: product.is_available
      });
    }
  }, [id, product]);

  if (isLoading && !product) {
    return (
      <>
        <Helmet>
          <title>Loading Product - Sai Darshan Shopping Mart</title>
        </Helmet>
        <ProductDetailSkeleton />
      </>
    );
  }

  if (!product) {
    return (
      <div className="layout-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Helmet>
          <title>Product Not Found - Sai Darshan Shopping Mart</title>
        </Helmet>
        <h2 className="typescale-title-large">Product not found</h2>
        <p style={{ marginTop: '16px' }}>
          <Link to="/shop">Return to Shop</Link>
        </p>
      </div>
    );
  }

  const activePrice = selectedVariant?.price ?? product.price;
  const activeMrp = selectedVariant?.mrp ?? product.mrp;
  const activeUnitSize = selectedVariant?.unit_size ?? product.unit_size;
  const isAvailable = selectedVariant ? selectedVariant.is_available : product.is_available;
  const discountPercent = activeMrp && activeMrp > activePrice 
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) 
    : 0;

  // Resolve category name for Flipkart-style breadcrumbs
  const currentCategory = categories.find(c => c.id === product.category_id);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(q => q + 1);
  };

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      product_name: product.name,
      product_sku: selectedVariant?.sku || product.sku,
      product_price: activePrice,
      original_price: activeMrp,
      product_image_url: product.image_url,
      unit_size: activeUnitSize,
      quantity: quantity,
    });
    
    // Reset quantity back to 1 after adding
    setQuantity(1);
  };

  const whatsAppOrderUrl = `https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(
    `Namaste ${STORE_NAME}! Mujhe yeh item order karna hai:\n\n• ${product.name} (${activeUnitSize || 'Standard'})\n• Quantity: ${quantity}\n• Price: ₹${activePrice * quantity}\n\nKripya confirm karein.`
  )}`;

  const pageTitle = `${product.name} | Sai Darshan Shopping Mart`;

  return (
    <div className="product-detail-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={product.description || `Buy ${product.name} at Sai Darshan Shopping Mart Jabalpur.`} />
      </Helmet>

      <div className="layout-container">
        {/* Flipkart-Style Clean Breadcrumbs */}
        <nav className="product-detail__breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
          <Link to="/shop">Shop</Link>
          {currentCategory && (
            <>
              <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
              <Link to={`/shop/${currentCategory.slug}`}>{currentCategory.name}</Link>
            </>
          )}
          <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Flipkart Signature Dual Column Card */}
        <div className="product-detail-card">
          {/* Left Column: Sticky Image Viewport & Action Buttons */}
          <div className="product-detail__left-col">
            <div className="product-detail__image-box">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="product-detail__image" 
                  loading="eager"
                />
              ) : (
                <div className="product-detail__placeholder">
                  <span className="material-symbols-outlined product-detail__placeholder-icon">image</span>
                </div>
              )}
            </div>

            {/* Action Buttons Directly Under Image (Flipkart Signature) */}
            <div className="product-detail__action-panel">
              {isAvailable ? (
                <>
                  <div className="product-detail__qty-cart-row">
                    {/* Quantity Selector */}
                    <div className="product-detail__quantity" aria-label="Select Quantity">
                      <button 
                        type="button"
                        className="product-detail__quantity-btn" 
                        onClick={handleDecrease}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="product-detail__quantity-value">{quantity}</span>
                      <button 
                        type="button"
                        className="product-detail__quantity-btn" 
                        onClick={handleIncrease}
                        aria-label="Increase quantity"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                      type="button" 
                      className="product-detail__cart-btn" 
                      onClick={handleAddToCart}
                    >
                      <span className="material-symbols-outlined">shopping_cart</span>
                      <span>ADD TO CART</span>
                    </button>
                  </div>

                  {/* Direct WhatsApp Order CTA */}
                  <a
                    href={whatsAppOrderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="product-detail__whatsapp-order-btn"
                  >
                    <WhatsAppIcon size={18} color="#FFFFFF" />
                    <span>ORDER ON WHATSAPP</span>
                  </a>
                </>
              ) : (
                <div className="product-detail__unavailable-banner">
                  <span className="material-symbols-outlined">cancel</span>
                  <span>Currently Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Ratings, Price, Options, Guarantees, Specs */}
          <div className="product-detail__right-col">
            {/* Header info */}
            <div className="product-detail__header-block">
              <h1 className="product-detail__title">{product.name}</h1>
              {activeUnitSize && (
                <span className="product-detail__unit-pill">{activeUnitSize}</span>
              )}

              {/* Flipkart Rating & Assured Badge Row */}
              <div className="product-detail__badges-row">
                <span className="product-detail__rating-badge">
                  <span>4.8</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>star</span>
                </span>
                <span className="product-detail__assured-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
                  <span>Sai Darshan Assured</span>
                </span>
                {isAvailable ? (
                  <span className="product-detail__stock-tag product-detail__stock-tag--in">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                    <span>In Stock</span>
                  </span>
                ) : (
                  <span className="product-detail__stock-tag product-detail__stock-tag--out">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Flipkart Signature Price Row */}
            <div className="product-detail__price-block">
              <div className="product-detail__price-row">
                <span className="product-detail__price-main">{formatPrice(activePrice)}</span>
                {activeMrp && activeMrp > activePrice && (
                  <>
                    <span className="product-detail__mrp">MRP {formatPrice(activeMrp)}</span>
                    <span className="product-detail__discount-tag">{discountPercent}% off</span>
                  </>
                )}
              </div>
              <span className="product-detail__tax-sub">Inclusive of all local taxes</span>
            </div>

            {/* Pack / Variant Selector (Flipkart Available Options) */}
            {product.variants && product.variants.length > 1 && (
              <div className="product-detail__variants-section">
                <span className="product-detail__variants-label">Available Pack / Quantity Options:</span>
                <div className="product-detail__variants-grid">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id || selectedVariant?.unit_size === v.unit_size;
                    return (
                      <button
                        key={v.id || v.unit_size}
                        type="button"
                        className={`product-detail__variant-chip ${isSelected ? 'product-detail__variant-chip--active' : ''}`}
                        onClick={() => setSelectedVariant(v)}
                      >
                        <span className="product-detail__variant-size">{v.unit_size}</span>
                        <span className="product-detail__variant-price">{formatPrice(v.price)}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined product-detail__variant-check">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flipkart Style Delivery & Store Guarantees */}
            <div className="product-detail__guarantees-card">
              <div className="product-detail__guarantee-item">
                <span className="material-symbols-outlined">local_shipping</span>
                <div>
                  <strong>Jabalpur Doorstep Delivery:</strong> Fast dispatch from 1117 Sanjeevni Nagar (Free on orders ₹500+)
                </div>
              </div>
              <div className="product-detail__guarantee-item">
                <span className="material-symbols-outlined">payments</span>
                <div>
                  <strong>Pay on Delivery:</strong> Cash on Delivery (COD) &amp; UPI accepted
                </div>
              </div>
              <div className="product-detail__guarantee-item">
                <span className="material-symbols-outlined">verified</span>
                <div>
                  <strong>100% Genuine &amp; Fresh:</strong> Handpicked directly from supermarket store shelves
                </div>
              </div>
            </div>

            {/* Specifications / Product Details Table (Flipkart Style) */}
            <div className="product-detail__specs-section">
              <h2 className="product-detail__specs-heading">Specifications</h2>
              <table className="product-detail__specs-table">
                <tbody>
                  <tr>
                    <td className="product-detail__specs-key">Product</td>
                    <td className="product-detail__specs-val">{product.name}</td>
                  </tr>
                  <tr>
                    <td className="product-detail__specs-key">Pack Size / Weight</td>
                    <td className="product-detail__specs-val">{activeUnitSize || 'Standard Pack'}</td>
                  </tr>
                  {currentCategory && (
                    <tr>
                      <td className="product-detail__specs-key">Category</td>
                      <td className="product-detail__specs-val">{currentCategory.name}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="product-detail__specs-key">Store</td>
                    <td className="product-detail__specs-val">Sai Darshan Shopping Mart, Jabalpur</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* About this item / Description */}
            {product.description && (
              <div className="product-detail__desc-section">
                <h2 className="product-detail__desc-heading">About This Item</h2>
                <p className="product-detail__desc-body">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supermarket Value & Trust Guarantees */}
      <WatermarkBanner />
    </div>
  );
}
