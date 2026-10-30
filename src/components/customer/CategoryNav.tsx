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

export function getCategoryMaterialIcon(category: { slug?: string; name?: string }): string {
  const slug = (category.slug || '').toLowerCase();
  const name = (category.name || '').toLowerCase();

  // 1. Promotional & Special Categories
  if (slug === 'sai-darshan-specials' || name.includes('special')) return 'stars';
  if (slug === 'mid-month-offer' || name.includes('mid month') || name.includes('month offer')) return 'calendar_month';
  if (slug === 'buy-1-get-1' || name.includes('buy 1') || name.includes('bogo')) return 'redeem';
  if (slug === 'buy-more-get-more' || name.includes('buy more') || name.includes('save more')) return 'savings';

  // 2. Departmental & Everyday Grocery Categories
  if (slug === 'grocery-staples' || name.includes('grocery') || name.includes('staple')) return 'shopping_basket';
  if (slug === 'food-grains-atta-dals' || name.includes('grain') || name.includes('atta') || name.includes('dal')) return 'grain';
  if (slug === 'dairy-products' || name.includes('dairy')) return 'egg';
  if (slug === 'bakery-products' || name.includes('bakery')) return 'bakery_dining';
  if (slug === 'cooking-oils-ghee' || name.includes('oil') || name.includes('ghee')) return 'water_drop';
  if (slug === 'spices-seasonings' || name.includes('spice') || name.includes('seasoning')) return 'soup_kitchen';
  if (slug === 'beverages-drinks' || name.includes('beverage') || name.includes('drink')) return 'local_cafe';
  if (slug === 'chocolates-confectionery' || name.includes('chocolate') || name.includes('confectionery')) return 'cookie';
  if (slug === 'personal-care' || name.includes('personal')) return 'face';
  if (slug === 'baby-care' || name.includes('baby')) return 'child_care';
  if (slug === 'home-cleaners' || name.includes('cleaner') || name.includes('cleaning')) return 'cleaning_services';
  if (slug === 'plastic-items-storage' || name.includes('plastic') || name.includes('storage')) return 'inventory_2';
  if (slug === 'stationery-supplies' || name.includes('stationery') || name.includes('supplies')) return 'edit_document';
  if (slug === 'appliances' || name.includes('appliance')) return 'blender';
  if (slug === 'electricals-electronics' || name.includes('electrical')) return 'bolt';
  if (slug === 'dining-chairs-furniture' || name.includes('chair') || name.includes('furniture')) return 'chair';
  if (slug === 'pet-supplies' || name.includes('pet')) return 'pets';

  return 'category';
}

export function CategoryNav({ categories, activeSlug, basePath = '/shop', isLoading = false }: CategoryNavProps) {
  if (isLoading && categories.length === 0) {
    return <CategoryNavSkeleton count={8} />;
  }

  // Curated Material Symbols icons for all store categories
  const getCategoryIcon = getCategoryMaterialIcon;

  return (
    <nav className="category-nav" aria-label="Product categories">
      {/* "All Items" option */}
      <Link 
        to={basePath} 
        className={`category-nav__item ${!activeSlug ? 'category-nav__item--active' : ''}`}
      >
        <div className="category-nav__icon-wrapper">
          <span className="material-symbols-outlined category-nav__icon">apps</span>
        </div>
        <span className="category-nav__label">All Items</span>
      </Link>

      {/* Categories with icons only */}
      {categories.map((category) => {
        const isActive = activeSlug === category.slug;
        const iconName = getCategoryIcon(category);

        return (
          <Link 
            key={category.id}
            to={`${basePath}/${category.slug}`} 
            className={`category-nav__item ${isActive ? 'category-nav__item--active' : ''}`}
          >
            <div className="category-nav__icon-wrapper">
              <span className="material-symbols-outlined category-nav__icon">
                {iconName}
              </span>
            </div>
            <span className="category-nav__label">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
