import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/orderUtils';
import type { ProductVariant } from '../../types/product';
import './ProductDetailPage.css';

import { ProductDetailSkeleton, WatermarkBanner, BeatingHeart } from '../../components/common';
import { useProduct } from '../../hooks/useProducts';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  
  const { product, isLoading } = useProduct(id);
  
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

  const pageTitle = `${product.name} | Sai Darshan Shopping Mart`;

  return (
    <div className="product-detail-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={product.description || `Buy ${product.name} at Sai Darshan Shopping Mart.`} />
      </Helmet>

      <div className="layout-container">
        <div className="product-detail">

      {/* Breadcrumb / Back Navigation */}
      <div className="product-detail__image-section">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-detail__image" />
        ) : (
          <div className="product-detail__placeholder">
            <span className="material-symbols-outlined product-detail__placeholder-icon">image</span>
          </div>
        )}
      </div>

      {/* Info & Actions */}
      <div className="product-detail__info-section">
        <div className="product-detail__header">
          <h1 className="product-detail__title">{product.name}</h1>
          <p className="product-detail__unit">{activeUnitSize}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div className="product-detail__price">{formatPrice(activePrice)}</div>
            {activeMrp && activeMrp > activePrice && (
              <div style={{ textDecoration: 'line-through', color: 'var(--md-sys-color-outline)', fontSize: '18px' }}>
                MRP {formatPrice(activeMrp)}
              </div>
            )}
            {activeMrp && activeMrp > activePrice && (
              <div className="product-detail__discount-badge">
                {Math.round(((activeMrp - activePrice) / activeMrp) * 100)}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Quantity / Pack Option Selector (Variants) */}
        {product.variants && product.variants.length > 1 && (
          <div style={{ margin: '16px 0' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--md-sys-color-on-surface-variant)',
              display: 'block',
              marginBottom: '8px'
            }}>
              Choose Pack / Quantity:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id || selectedVariant?.unit_size === v.unit_size;
                return (
                  <button
                    key={v.id || v.unit_size}
                    type="button"
                    className={`sdm-btn ${isSelected ? 'sdm-btn--primary' : 'sdm-btn--outlined'}`}
                    style={{
                      padding: '0 16px',
                      height: '38px',
                      fontSize: '13px',
                      borderRadius: '8px'
                    }}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span>{v.unit_size}</span>
                    <span style={{ opacity: 0.85, fontSize: '12px', marginLeft: '6px' }}>
                      • {formatPrice(v.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="product-detail__actions">
          <div className="product-detail__status">
            {isAvailable ? (
              <>
                <span className="material-symbols-outlined product-detail__status--in-stock">check_circle</span>
                <span className="product-detail__status--in-stock">In Stock</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined product-detail__status--out-of-stock">cancel</span>
                <span className="product-detail__status--out-of-stock">Currently Unavailable</span>
              </>
            )}
          </div>

          {isAvailable && (
            <div className="product-detail__add-container">
              <div className="product-detail__quantity">
                <button 
                  className="product-detail__quantity-btn" 
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="product-detail__quantity-value">{quantity}</span>
                <button 
                  className="product-detail__quantity-btn" 
                  onClick={handleIncrease}
                  aria-label="Increase quantity"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              
              <div className="product-detail__add-btn-wrapper">
                <button 
                  type="button" 
                  className="sdm-btn sdm-btn--primary product-detail__add-btn" 
                  style={{ width: '100%', height: '46px' }}
                  onClick={handleAddToCart}
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  <span>Add {activeUnitSize ? `(${activeUnitSize})` : ''} to Cart</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {product.description && (
          <div className="product-detail__description-section">
            <h2 className="product-detail__section-title">About this item</h2>
            <p className="product-detail__description">{product.description}</p>
          </div>
        )}
        </div>
      </div>
    </div>

      {/* Shadowy Big Watermark Display */}
      <WatermarkBanner 
        headline={<>Shuddhata aur vishwas, seedhe aapke ghar <BeatingHeart /></>} 
      />
    </div>
  );
}
