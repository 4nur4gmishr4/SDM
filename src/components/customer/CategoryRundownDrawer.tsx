import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Category } from '../../types/category';
import { getCategoryMaterialIcon } from './CategoryNav';
import { STORE_NAME, STORE_PHONE_NUMBER, STORE_WHATSAPP_NUMBER, STORE_WHATSAPP_CLEAN, openSms } from '../../lib/orderUtils';
import { WhatsAppIcon } from '../common';
import './CategoryRundownDrawer.css';

interface CategoryRundownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeSlug?: string;
}

export function CategoryRundownDrawer({
  isOpen,
  onClose,
  categories,
  activeSlug,
}: CategoryRundownDrawerProps) {
  const location = useLocation();

  // Close drawer automatically when user navigates
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="category-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Categories Rundown">
      <div className="category-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="category-drawer-header">
          <div className="category-drawer-brand">
            <span className="material-symbols-outlined category-drawer-logo-icon">storefront</span>
            <div>
              <h2 className="category-drawer-title">{STORE_NAME}</h2>
              <p className="category-drawer-subtitle">All 21 Supermarket Departments</p>
            </div>
          </div>
          <button 
            type="button" 
            className="category-drawer-close-btn" 
            onClick={onClose}
            aria-label="Close Categories Menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Quick All Items Jump */}
        <div className="category-drawer-all-link-wrap">
          <Link 
            to="/shop" 
            className={`category-drawer-item ${!activeSlug && location.pathname === '/shop' ? 'category-drawer-item--active' : ''}`}
            onClick={onClose}
          >
            <div className="category-drawer-item-icon-wrap" style={{ backgroundColor: 'var(--md-sys-color-primary, #0D652D)', color: '#ffffff' }}>
              <span className="material-symbols-outlined">apps</span>
            </div>
            <div className="category-drawer-item-label">
              <strong>All Supermarket Products</strong>
              <span>Browse entire 9,000+ grocery catalog</span>
            </div>
            <span className="material-symbols-outlined category-drawer-chevron">chevron_right</span>
          </Link>
        </div>

        {/* Vertical Rundown List of All Categories */}
        <div className="category-drawer-list">
          <div className="category-drawer-section-label">Department Rundown (Left Menu)</div>
          {categories.map((category) => {
            const isActive = activeSlug === category.slug || location.pathname === `/shop/${category.slug}`;
            const icon = getCategoryMaterialIcon(category);

            return (
              <Link
                key={category.id}
                to={`/shop/${category.slug}`}
                className={`category-drawer-item ${isActive ? 'category-drawer-item--active' : ''}`}
                onClick={onClose}
              >
                <div className="category-drawer-item-icon-wrap">
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div className="category-drawer-item-label">
                  <span>{category.name}</span>
                </div>
                {category.is_offer_category && (
                  <span className="category-drawer-offer-badge">Offer</span>
                )}
                <span className="material-symbols-outlined category-drawer-chevron">chevron_right</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Store Contact & SMS/WhatsApp Helpline */}
        <div className="category-drawer-footer">
          <div className="category-drawer-footer-title">Need Help Ordering?</div>
          <div className="category-drawer-footer-actions">
            <a 
              href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Hello ${STORE_NAME}, I need assistance with an order`)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="category-drawer-helpline-btn category-drawer-helpline-btn--wa"
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp</span>
            </a>

            <button 
              type="button" 
              className="category-drawer-helpline-btn category-drawer-helpline-btn--sms"
              onClick={() => openSms(STORE_WHATSAPP_NUMBER, `Hello ${STORE_NAME}, I need assistance placing my grocery order.`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sms</span>
              <span>SMS Order</span>
            </button>

            <a 
              href={`tel:${STORE_PHONE_NUMBER}`} 
              className="category-drawer-helpline-btn category-drawer-helpline-btn--call"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
              <span>Call</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
