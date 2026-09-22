import { useState } from 'react';
import { ProductTile } from './ProductTile';
import type { Product } from '../../types/product';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = 'No products found.' }: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(20);

  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <span className="material-symbols-outlined product-grid-empty__icon">inventory_2</span>
        <h3 className="product-grid-empty__title">{emptyMessage}</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>
    );
  }

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>
      
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <md-filled-tonal-button onClick={() => setVisibleCount(c => c + 20)}>
            Load More Products
          </md-filled-tonal-button>
        </div>
      )}
    </div>
  );
}
