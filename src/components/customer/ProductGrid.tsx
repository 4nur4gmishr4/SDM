import { useState } from 'react';
import { ProductTile } from './ProductTile';
import { ProductGridSkeleton } from '../common';
import type { Product } from '../../types/product';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  isLoading?: boolean;
  skeletonCount?: number;
}

export function ProductGrid({
  products,
  emptyMessage = 'No products found.',
  isLoading = false,
  skeletonCount = 8,
}: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(20);

  if (isLoading && products.length === 0) {
    return <ProductGridSkeleton count={skeletonCount} />;
  }


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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <md-filled-tonal-button 
            className="product-grid__load-more-btn" 
            onClick={() => setVisibleCount(c => c + 20)}
          >
            <span className="material-symbols-outlined" slot="icon">expand_more</span>
            Load More Products
          </md-filled-tonal-button>
        </div>
      )}
    </div>
  );
}
