import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/orderUtils';
import './ProductDetailPage.css';

import { ProductDetailSkeleton } from '../../components/common';
import { useProduct } from '../../hooks/useProducts';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem, items, updateQuantity } = useCart();
  
  const { product, isLoading } = useProduct(id);
  
  // Local state for quantity selector before adding to cart
  const [quantity, setQuantity] = useState(1);
  
  // Check if item is already in cart
  const cartItem = items.find(i => i.product_id === id);

  useEffect(() => {
    // Reset quantity when product changes
    setQuantity(1);
  }, [id]);

  if (isLoading && !product) {
    return (
      <div className="layout-container" style={{ padding: '16px 0' }}>
        <Helmet>
          <title>Loading Product - Sai Darshan Mart</title>
        </Helmet>
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="layout-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Helmet>
          <title>Product Not Found - Sai Darshan Mart</title>
        </Helmet>
        <h2 className="typescale-title-large">Product not found</h2>
        <p style={{ marginTop: '16px' }}>
          <Link to="/shop">Return to Shop</Link>
        </p>
      </div>
    );
  }

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(q => q + 1);
  };

  const handleAddToCart = () => {
    if (cartItem) {
      // If already in cart, update quantity by adding the new amount
      updateQuantity(product.id, cartItem.quantity + quantity);
    } else {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        product_price: product.price,
        product_image_url: product.image_url,
        unit_size: product.unit_size,
        quantity: quantity,
      });
    }
    
    // Reset quantity back to 1 after adding
    setQuantity(1);
  };

  const pageTitle = `${product.name} — Sai Darshan Mart`;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <div className="layout-container product-detail">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={product.description || `Buy ${product.name} at Sai Darshan Mart.`} />
      </Helmet>

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
          <p className="product-detail__unit">{product.unit_size}</p>
          <div className="product-detail__price">{formatPrice(product.price)}</div>
        </div>

        <div className="product-detail__actions">
          <div className="product-detail__status">
            {product.is_available ? (
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

          {product.is_available && (
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
                  <span>Add {quantity > 1 ? `${quantity} items` : ''} to Cart</span>
                </button>
              </div>
            </div>
          )}
          
          {cartItem && (
            <p style={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-label-medium-size)', marginTop: '8px' }}>
              ✓ You have {cartItem.quantity} of this item in your cart.
            </p>
          )}
        </div>

        {product.description && (
          <div className="product-detail__description-section">
            <h3 className="product-detail__section-title">Description</h3>
            <p className="product-detail__description">{product.description}</p>
          </div>
        )}
        
        <div style={{ marginTop: '32px', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '16px' }}>
           <p style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-outline)' }}>
             SKU: {product.sku}
           </p>
        </div>
      </div>
    </div>
  );
}
