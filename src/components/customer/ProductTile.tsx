import { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/orderUtils';
import type { Product } from '../../types/product';
import './ProductTile.css';

function optimizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes('/storage/v1/object/public/store-media/')) {
    return url.replace(
      '/storage/v1/object/public/store-media/', 
      '/storage/v1/render/image/public/store-media/'
    ) + '?width=400&resize=contain&quality=80&format=webp';
  }
  return url;
}

interface ProductTileProps {
  product: Product;
}

export const ProductTile = memo(function ProductTile({ product }: ProductTileProps) {
  const { addItem, items, updateQuantity } = useCart();
  const variants = product.variants || [];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const activeVariant = variants.length > 0 ? variants[selectedVariantIdx] : null;
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentMrp = activeVariant?.mrp || product.mrp;
  const currentUnit = activeVariant ? activeVariant.unit_size : product.unit_size;
  const currentImage = activeVariant?.image_url || product.image_url;
  const targetId = activeVariant?.id || product.id;
  const isAvailable = activeVariant ? activeVariant.is_available : product.is_available;
  const discountPercent = (currentMrp && currentMrp > currentPrice)
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  const currentItemKey = `${targetId}_${activeVariant?.id || currentUnit || 'default'}`;
  const existingCartItem = items.find(
    i => `${i.product_id}_${i.variant_id || i.unit_size || 'default'}` === currentItemKey
  );
  const currentQty = existingCartItem ? existingCartItem.quantity : 0;

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const finalCartName = currentUnit && product.name.includes(`(${currentUnit})`)
      ? product.name
      : (currentUnit ? `${product.name} (${currentUnit})` : product.name);

    addItem({
      product_id: targetId,
      variant_id: activeVariant?.id,
      product_name: finalCartName,
      product_sku: activeVariant?.sku || product.sku,
      product_price: currentPrice,
      original_price: currentMrp,
      product_image_url: currentImage,
      unit_size: currentUnit,
      quantity: 1,
    });
  }, [addItem, targetId, product.name, product.sku, currentImage, activeVariant?.id, activeVariant?.sku, currentPrice, currentMrp, currentUnit]);

  return (
    <article className="product-tile">
      <div className="product-tile__badges">
        {discountPercent > 0 && (
          <span className="product-tile__badge product-tile__badge--discount">
            {discountPercent}% OFF
          </span>
        )}
        {!isAvailable && (
          <span className="product-tile__badge product-tile__badge--unavailable">Out of Stock</span>
        )}
        {isAvailable && product.is_featured && (
          <span className="product-tile__badge product-tile__badge--featured">Featured</span>
        )}
      </div>

      <Link 
        to={`/product/${targetId}`} 
        className="product-tile__image-link"
        aria-label={`View details for ${product.name}`}
        tabIndex={-1}
      >
        {currentImage && (
          <img 
            src={optimizeImageUrl(currentImage)} 
            alt={product.name} 
            className="product-tile__image" 
            loading="lazy" 
            decoding="async"
            referrerPolicy="no-referrer"
            width="180"
            height="180"
            onError={(e) => {
              const target = e.currentTarget;
              if (currentImage && target.src !== currentImage) {
                target.src = currentImage;
                return;
              }
              target.style.display = 'none';
              const icon = target.parentElement?.querySelector('.product-tile__placeholder-icon') as HTMLElement;
              if (icon) icon.style.display = 'block';
            }}
          />
        )}
        <span 
          className="material-symbols-outlined product-tile__placeholder-icon"
          style={{ display: currentImage ? 'none' : 'block' }}
        >
          image
        </span>
      </Link>

      <div className="product-tile__content">
        <Link to={`/product/${targetId}`} className="product-tile__name">
          {product.name}
        </Link>

        {/* Quantity Options / Variants Selector */}
        {variants.length > 1 ? (
          variants.length <= 4 ? (
            <div className="product-tile__variants">
              {variants.map((v, i) => (
                <button
                  key={v.id || i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIdx(i);
                  }}
                  className={`product-tile__variant-pill ${i === selectedVariantIdx ? 'product-tile__variant-pill--active' : ''}`}
                  aria-label={`Select ${v.unit_size}`}
                  title={`${v.unit_size} - ${formatPrice(v.price)}`}
                >
                  {v.unit_size}
                </button>
              ))}
            </div>
          ) : (
            <div className="product-tile__variant-select-wrap">
              <select
                className="product-tile__variant-select"
                value={selectedVariantIdx}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSelectedVariantIdx(Number(e.target.value))}
                aria-label="Select pack size"
              >
                {variants.map((v, i) => (
                  <option key={v.id || i} value={i}>
                    {v.unit_size} - {formatPrice(v.price)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined product-tile__select-arrow">expand_more</span>
            </div>
          )
        ) : (
          <div className="product-tile__unit">{currentUnit}</div>
        )}
        
        <div className="product-tile__price-row">
          <div className="product-tile__price-col">
            <div className="product-tile__price-line">
              <span className="product-tile__price">{formatPrice(currentPrice)}</span>
              {discountPercent > 0 && (
                <span className="product-tile__discount-chip">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            {currentMrp && currentMrp > currentPrice && (
              <div className="product-tile__mrp-line">
                <span className="product-tile__mrp-label">MRP</span>
                <span className="product-tile__mrp-value">{formatPrice(currentMrp)}</span>
              </div>
            )}
          </div>
          
          {currentQty > 0 ? (
            <div
              className="product-tile__stepper"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                className="product-tile__stepper-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(targetId, currentQty - 1, currentItemKey);
                }}
                aria-label="Decrease quantity"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>remove</span>
              </button>
              <span className="product-tile__stepper-count">{currentQty}</span>
              <button
                type="button"
                className="product-tile__stepper-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(targetId, currentQty + 1, currentItemKey);
                }}
                aria-label="Increase quantity"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
              </button>
            </div>
          ) : (
            <button 
              type="button"
              className="product-tile__add-button" 
              onClick={handleAdd}
              disabled={!isAvailable}
              aria-label={`Add ${product.name} (${currentUnit}) to cart`}
              title={`Add ${currentUnit} to cart`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              <span className="product-tile__add-text">ADD</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
