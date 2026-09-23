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
    if (nameLower.includes('bakery')) return 'bakery_dining';
    if (nameLower.includes('dairy')) return 'egg';
    if (nameLower.includes('grain')) return 'agriculture';
    if (nameLower.includes('spice') || nameLower.includes('oil')) return 'oil_barrel';
    if (nameLower.includes('chocolate')) return 'icecream';
    if (nameLower.includes('cleaner')) return 'cleaning_services';
    if (nameLower.includes('personal')) return 'face';
    if (nameLower.includes('appliance')) return 'blender';
    if (nameLower.includes('stationery')) return 'edit_document';
    if (nameLower.includes('plastic')) return 'kitchen';
    if (nameLower.includes('baby')) return 'child_care';
    if (nameLower.includes('chair')) return 'chair';
    if (nameLower.includes('pets')) return 'pets';
    if (nameLower.includes('beverage')) return 'local_cafe';
    if (nameLower.includes('electrical')) return 'electrical_services';
    if (nameLower.includes('offer')) return 'local_offer';
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
              {category.thumbnail_url ? (
                <img src={category.thumbnail_url} alt="" className="category-nav__image" loading="lazy" />
              ) : (
                <span className="material-symbols-outlined category-nav__icon">
                  {getCategoryIcon(category.name)}
                </span>
              )}
            </div>
            <span className="category-nav__label">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
