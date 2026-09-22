import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/orderUtils';
import type { Product } from '../../types/product';
import './ProductTile.css';

interface ProductTileProps {
  product: Product;
}

export function ProductTile({ product }: ProductTileProps) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_price: product.price,
      product_image_url: product.image_url,
      unit_size: product.unit_size,
      quantity: 1,
    });
    // In a real app we might show a brief "Added" snackbar here
  };

  return (
    <article className="product-tile">
      <div className="product-tile__badges">
        {!product.is_available && (
          <span className="product-tile__badge product-tile__badge--unavailable">Out of Stock</span>
        )}
        {product.is_available && product.is_featured && (
          <span className="product-tile__badge product-tile__badge--featured">Featured</span>
        )}
      </div>

      <Link 
        to={`/product/${product.id}`} 
        className="product-tile__image-link"
        aria-label={`View details for ${product.name}`}
        tabIndex={-1} // Prevent double tab stops
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-tile__image" loading="lazy" />
        ) : (
          <span className="material-symbols-outlined product-tile__placeholder-icon">image</span>
        )}
      </Link>

      <div className="product-tile__content">
        <Link to={`/product/${product.id}`} className="product-tile__name">
          {product.name}
        </Link>
        <div className="product-tile__unit">{product.unit_size}</div>
        
        <div className="product-tile__price-row">
          <div className="product-tile__price">{formatPrice(product.price)}</div>
          
          <button 
            className="product-tile__add-button" 
            onClick={handleAdd}
            disabled={!product.is_available}
            aria-label={`Add ${product.name} to cart`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
