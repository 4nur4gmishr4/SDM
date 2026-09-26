import { Link } from 'react-router-dom';
import { CategoryNavSkeleton } from '../common';
import type { Category } from '../../types/category';
import './CategoryNav.css';

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
  basePath?: string; // e.g. '/shop'
  isLoading?: boolean;
}

export function CategoryNav({ categories, activeSlug, basePath = '/shop', isLoading = false }: CategoryNavProps) {
  if (isLoading && categories.length === 0) {
    return <CategoryNavSkeleton count={8} />;
  }

  // Helper to map category names to Material Symbols if no thumbnail is available
  const getCategoryIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('special')) return 'star';
    if (nameLower.includes('grocery') || nameLower.includes('staple')) return 'shopping_basket';
    if (nameLower.includes('grain') || nameLower.includes('atta') || nameLower.includes('dal')) return 'grain';
    if (nameLower.includes('dairy')) return 'egg';
    if (nameLower.includes('bakery')) return 'bakery_dining';
    if (nameLower.includes('oil') || nameLower.includes('ghee')) return 'oil_barrel';
    if (nameLower.includes('spice') || nameLower.includes('seasoning')) return 'soup_kitchen';
    if (nameLower.includes('beverage') || nameLower.includes('drink')) return 'local_cafe';
    if (nameLower.includes('chocolate') || nameLower.includes('confectionery')) return 'cookie';
    if (nameLower.includes('personal')) return 'face';
    if (nameLower.includes('baby')) return 'child_care';
    if (nameLower.includes('cleaner') || nameLower.includes('cleaning')) return 'cleaning_services';
    if (nameLower.includes('plastic')) return 'kitchen';
    if (nameLower.includes('stationery') || nameLower.includes('supplies')) return 'edit_document';
    if (nameLower.includes('appliance')) return 'blender';
    if (nameLower.includes('electrical')) return 'bolt';
    if (nameLower.includes('chair') || nameLower.includes('furniture')) return 'chair';
    if (nameLower.includes('pet')) return 'pets';
    return 'category';
  };

  return (
    <nav className="category-nav" aria-label="Product categories">
      {/* "All" option */}
      <Link 
        to={basePath} 
        className={`category-nav__item ${!activeSlug ? 'category-nav__item--active' : ''}`}
      >
        <div className="category-nav__icon-wrapper">
          <span className="material-symbols-outlined category-nav__icon">apps</span>
        </div>
        <span className="category-nav__label">All Items</span>
      </Link>

      {/* Categories */}
      {categories.map((category) => {
        const isActive = activeSlug === category.slug;
        return (
          <Link 
            key={category.id}
            to={`${basePath}/${category.slug}`} 
            className={`category-nav__item ${isActive ? 'category-nav__item--active' : ''}`}
          >
            <div className="category-nav__icon-wrapper">
              {category.thumbnail_url && (
                <img 
                  src={category.thumbnail_url} 
                  alt={category.name} 
                  className="category-nav__image" 
                  loading="lazy"
                  decoding="async"
                  width="72"
                  height="72"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const icon = e.currentTarget.parentElement?.querySelector('.category-nav__fallback-icon') as HTMLElement;
                    if (icon) icon.style.display = 'inline-block';
                  }} 
                />
              )}
              <span 
                className="material-symbols-outlined category-nav__icon category-nav__fallback-icon"
                style={{ display: category.thumbnail_url ? 'none' : 'inline-block' }}
              >
                {getCategoryIcon(category.name)}
              </span>
            </div>
            <span className="category-nav__label">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
