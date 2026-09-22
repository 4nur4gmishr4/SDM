import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'rounded',
  width,
  height,
  className = '',
  style = {},
}: SkeletonProps) {
  const inlineStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`sdm-skeleton sdm-skeleton--${variant} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
    />
  );
}

/**
 * Product Tile Skeleton
 */
export function ProductTileSkeleton() {
  return (
    <div className="product-tile-skeleton" aria-label="Loading product...">
      <Skeleton className="product-tile-skeleton__image" />
      <div className="product-tile-skeleton__content">
        <Skeleton width="45%" height={12} variant="rounded" />
        <Skeleton width="85%" height={16} variant="rounded" style={{ margin: '4px 0' }} />
        <Skeleton width="60%" height={14} variant="rounded" />
        <div className="product-tile-skeleton__bottom">
          <Skeleton width="40%" height={22} variant="rounded" />
          <Skeleton width="36px" height={36} variant="rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-label="Loading products...">
      {Array.from({ length: count }).map((_, index) => (
        <ProductTileSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Category Navigation Skeleton
 */
export function CategoryNavSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="category-nav-skeleton" aria-label="Loading categories...">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="category-nav-skeleton__item">
          <Skeleton width={56} height={56} variant="circular" />
          <Skeleton width={48} height={12} variant="rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Banner Skeleton
 */
export function BannerSkeleton() {
  return <Skeleton className="banner-skeleton" variant="rounded" />;
}

/**
 * Product Detail Page Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton" aria-label="Loading product details...">
      <Skeleton className="product-detail-skeleton__gallery" variant="rounded" />
      <div className="product-detail-skeleton__info">
        <Skeleton width="30%" height={18} variant="rounded" />
        <Skeleton width="80%" height={32} variant="rounded" style={{ margin: '8px 0' }} />
        <Skeleton width="50%" height={18} variant="rounded" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
          <Skeleton width="120px" height={36} variant="rounded" />
          <Skeleton width="80px" height={24} variant="rounded" />
        </div>
        <Skeleton width="160px" height={44} variant="rounded" style={{ marginBottom: '16px' }} />
        <Skeleton width="100%" height={14} variant="text" />
        <Skeleton width="95%" height={14} variant="text" />
        <Skeleton width="90%" height={14} variant="text" />
        <Skeleton width="70%" height={14} variant="text" />
      </div>
    </div>
  );
}

/**
 * Admin Table Skeleton (renders table rows)
 */
export function AdminTableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="admin-table-skeleton-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton
                width={colIndex === 0 ? '40px' : colIndex === 1 ? '70%' : '50%'}
                height={colIndex === 0 ? 36 : 16}
                variant={colIndex === 0 ? 'rounded' : 'rounded'}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Admin Dashboard Skeleton
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="admin-dashboard-skeleton" aria-label="Loading dashboard...">
      <div className="admin-dashboard-skeleton__grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-dashboard-skeleton__card">
            <Skeleton width={48} height={48} variant="circular" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="50%" height={14} variant="rounded" />
              <Skeleton width="80%" height={24} variant="rounded" />
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
          padding: '24px',
        }}
      >
        <Skeleton width="200px" height={24} variant="rounded" style={{ marginBottom: '20px' }} />
        <Skeleton width="100%" height={36} variant="rounded" style={{ marginBottom: '12px' }} />
        <Skeleton width="100%" height={36} variant="rounded" style={{ marginBottom: '12px' }} />
        <Skeleton width="100%" height={36} variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Admin Form Skeleton
 */
export function AdminFormSkeleton() {
  return (
    <div className="admin-form-skeleton" aria-label="Loading form...">
      <Skeleton width="140px" height={16} variant="rounded" />
      <Skeleton width="100%" height={56} variant="rounded" />
      <Skeleton width="180px" height={16} variant="rounded" />
      <Skeleton width="100%" height={56} variant="rounded" />
      <Skeleton width="120px" height={40} variant="rounded" style={{ marginTop: '12px' }} />
    </div>
  );
}
