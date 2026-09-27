import { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/orderUtils';
import type { Product } from '../../types/product';
import './ProductTile.css';

interface ProductTileProps {
  product: Product;
}

export const ProductTile = memo(function ProductTile({ product }: ProductTileProps) {
  const { addItem } = useCart();
  const variants = product.variants || [];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const activeVariant = variants.length > 0 ? variants[selectedVariantIdx] : null;
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentMrp = activeVariant?.mrp || product.mrp;
  const currentUnit = activeVariant ? activeVariant.unit_size : product.unit_size;
  const isAvailable = activeVariant ? activeVariant.is_available : product.is_available;
  const discountPercent = (currentMrp && currentMrp > currentPrice)
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_id: product.id,
      variant_id: activeVariant?.id,
      product_name: product.name,
      product_sku: activeVariant?.sku || product.sku,
      product_price: currentPrice,
      original_price: currentMrp,
      product_image_url: product.image_url,
      unit_size: currentUnit,
      quantity: 1,
    });
  }, [addItem, product.id, product.name, product.sku, product.image_url, activeVariant?.id, activeVariant?.sku, currentPrice, currentMrp, currentUnit]);

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
        to={`/product/${product.id}`} 
        className="product-tile__image-link"
        aria-label={`View details for ${product.name}`}
        tabIndex={-1}
      >
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="product-tile__image" 
            loading="lazy" 
            decoding="async"
            width="180"
            height="180"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const icon = e.currentTarget.parentElement?.querySelector('.product-tile__placeholder-icon') as HTMLElement;
              if (icon) icon.style.display = 'block';
            }}
          />
        )}
        <span 
          className="material-symbols-outlined product-tile__placeholder-icon"
          style={{ display: product.image_url ? 'none' : 'block' }}
        >
          image
        </span>
      </Link>

      <div className="product-tile__content">
        <Link to={`/product/${product.id}`} className="product-tile__name">
          {product.name}
        </Link>

        {/* Quantity Options / Variants Mini Pills */}
        {variants.length > 1 ? (
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
              >
                {v.unit_size}
              </button>
            ))}
          </div>
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
          
          <button 
            className="product-tile__add-button" 
            onClick={handleAdd}
            disabled={!isAvailable}
            aria-label={`Add ${product.name} (${currentUnit}) to cart`}
            title={`Add ${currentUnit} to cart`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </article>
  );
});
