import { VirtuosoGrid } from 'react-virtuoso';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <VirtuosoGrid
        useWindowScroll
        data={products}
        listClassName="product-grid"
        itemContent={(_index: number, product: Product) => (
          <ProductTile product={product} />
        )}
      />
    </div>
  );
}
