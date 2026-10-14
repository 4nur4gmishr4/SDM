import { useState, useEffect, useMemo, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ProductTile } from './ProductTile';
import { ProductGridSkeleton } from '../common';
import type { Product } from '../../types/product';
import './ProductGrid.css';

interface VirtualizedProductGridProps {
  products: Product[];
  emptyMessage?: string;
  isLoading?: boolean;
  skeletonCount?: number;
  /**
   * Minimum items count before virtualization kicks in.
   * Default: 30 items.
   */
  virtualizeThreshold?: number;
}

function getColumnCount(width: number): number {
  if (width >= 1440) return 6;
  if (width >= 1200) return 5;
  if (width >= 905) return 4;
  if (width >= 600) return 3;
  return 2;
}

export function VirtualizedProductGrid({
  products,
  emptyMessage = 'No products found.',
  isLoading = false,
  skeletonCount = 8,
  virtualizeThreshold = 30,
}: VirtualizedProductGridProps) {
  const [columnCount, setColumnCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getColumnCount(window.innerWidth);
    }
    return 2;
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Keep columns and scroll margin reactive
  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth));
      if (parentRef.current) {
        setScrollMargin(parentRef.current.offsetTop);
      }
    };

    if (parentRef.current) {
      setScrollMargin(parentRef.current.offsetTop);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Split flat list into chunks according to responsive column count
  const rows = useMemo(() => {
    const chunked: Product[][] = [];
    for (let i = 0; i < products.length; i += columnCount) {
      chunked.push(products.slice(i, i + columnCount));
    }
    return chunked;
  }, [products, columnCount]);

  const shouldVirtualize = products.length >= virtualizeThreshold;

  // Window-level virtualizer ensures smooth document scrolling on mobile and desktop
  const rowVirtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    estimateSize: () => (columnCount <= 2 ? 350 : 380),
    overscan: 3,
    scrollMargin,
  });

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

  // Non-virtualized standard render for small lists
  if (!shouldVirtualize) {
    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>
    );
  }

  // Virtualized row rendering for large catalogs (1,000+ items)
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="virtualized-product-grid-container"
      style={{
        position: 'relative',
        width: '100%',
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {virtualRows.map((virtualRow) => {
        const rowProducts = rows[virtualRow.index] || [];
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${
                virtualRow.start - (rowVirtualizer.options.scrollMargin ?? 0)
              }px)`,
              paddingBottom: columnCount <= 2 ? '8px' : '16px',
            }}
          >
            <div
              className="product-grid"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              }}
            >
              {rowProducts.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
