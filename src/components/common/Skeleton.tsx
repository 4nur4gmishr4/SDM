import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
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
 * Product Tile Skeleton (Matches real ProductTile layout 1:1)
 */
export function ProductTileSkeleton() {
  return (
    <div className="product-tile" style={{ pointerEvents: 'none' }} aria-label="Loading product...">
      <div className="product-tile__image-link">
        <Skeleton width="100%" height="100%" variant="rectangular" />
      </div>
      <div className="product-tile__content">
        <Skeleton width="85%" height={16} variant="rounded" style={{ marginBottom: '6px' }} />
        <Skeleton width="45%" height={12} variant="rounded" style={{ marginBottom: '12px' }} />
        <div className="product-tile__price-row" style={{ marginTop: 'auto' }}>
          <Skeleton width="40%" height={22} variant="rounded" />
          <Skeleton width="38px" height="38px" variant="rounded" style={{ borderRadius: '10px' }} />
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
 * Category Navigation Skeleton (Matches real CategoryNav 72x72 square boxes 1:1)
 */
export function CategoryNavSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="category-nav" aria-label="Loading categories...">
      {/* "All Items" skeleton item */}
      <div className="category-nav__item">
        <div className="category-nav__icon-wrapper">
          <Skeleton width="100%" height="100%" variant="rectangular" />
        </div>
        <Skeleton width="54px" height={14} variant="rounded" style={{ marginTop: '6px' }} />
      </div>

      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="category-nav__item">
          <div className="category-nav__icon-wrapper">
            <Skeleton width="100%" height="100%" variant="rectangular" />
          </div>
          <Skeleton width="64px" height={14} variant="rounded" style={{ marginTop: '6px' }} />
        </div>
      ))}
    </div>
  );
}


/**
 * Product Detail Page Skeleton (Matches real ProductDetailPage layout 1:1)
 */
export function ProductDetailSkeleton() {
  return (
    <div className="layout-container product-detail" aria-label="Loading product details...">
      <div className="product-detail__image-section">
        <Skeleton width="100%" height="100%" variant="rectangular" />
      </div>
      <div className="product-detail__info-section">
        <Skeleton width="75%" height={32} variant="rounded" style={{ marginBottom: '8px' }} />
        <Skeleton width="30%" height={16} variant="rounded" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
          <Skeleton width="120px" height={32} variant="rounded" />
          <Skeleton width="80px" height={20} variant="rounded" />
        </div>
        <Skeleton width="100%" height={52} variant="rounded" style={{ marginBottom: '16px', borderRadius: '12px' }} />
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Skeleton width="130px" height={44} variant="rounded" style={{ borderRadius: '10px' }} />
          <Skeleton width="180px" height={44} variant="rounded" style={{ borderRadius: '10px' }} />
        </div>
        <Skeleton width="100%" height={14} variant="rounded" style={{ marginBottom: '8px' }} />
        <Skeleton width="92%" height={14} variant="rounded" style={{ marginBottom: '8px' }} />
        <Skeleton width="68%" height={14} variant="rounded" />
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
                variant="rounded"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Admin Dashboard Skeleton (Matches real admin-dashboard-grid and stat cards 1:1)
 */
export function AdminDashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard...">
      <div className="admin-dashboard-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-stat-card">
            <Skeleton width={48} height={48} variant="rounded" style={{ borderRadius: '12px', flexShrink: 0 }} />
            <div className="admin-stat-card__content" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton width="60px" height={28} variant="rounded" />
              <Skeleton width="90px" height={14} variant="rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-dashboard-section" style={{ marginTop: '24px' }}>
        <Skeleton width="160px" height={24} variant="rounded" style={{ marginBottom: '12px' }} />
        <Skeleton width="340px" height={16} variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Admin Form Skeleton (Matches real admin-table-container form layout 1:1)
 */
export function AdminFormSkeleton() {
  return (
    <div className="admin-table-container" style={{ padding: '24px', maxWidth: '600px', flex: 'none' }} aria-label="Loading form...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton width="180px" height={24} variant="rounded" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="160px" height={16} variant="rounded" />
          <Skeleton width="100%" height={96} variant="rounded" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="140px" height={16} variant="rounded" />
          <Skeleton width="100%" height={48} variant="rounded" />
        </div>
        <Skeleton width="140px" height={42} variant="rounded" style={{ borderRadius: '8px' }} />
      </div>
    </div>
  );
}

