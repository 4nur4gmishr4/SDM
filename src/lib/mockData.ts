import type { Category } from '../types/category';
import type { Product } from '../types/product';
import type { Banner } from '../types/banner';
import type { DeliverySettings } from '../types/delivery';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'c1',
    name: 'Fresh Vegetables',
    slug: 'fresh-vegetables',
    display_order: 1,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=400&auto=format&fit=crop',
    description: 'Daily fresh vegetables direct from farms',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Dairy & Bakery',
    slug: 'dairy-bakery',
    display_order: 2,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400&auto=format&fit=crop',
    description: 'Milk, cheese, breads and more',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c3',
    name: 'Snacks & Munchies',
    slug: 'snacks',
    display_order: 3,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=400&auto=format&fit=crop',
    description: 'Chips, biscuits, and namkeen',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c4',
    name: 'Festive Offers',
    slug: 'festive-offers',
    display_order: 4,
    is_visible: true,
    is_offer_category: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=400&auto=format&fit=crop',
    description: 'Special discounts for the season',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: 'VEG-001',
    name: 'Farm Fresh Tomatoes',
    price: 45,
    unit_size: '1 kg',
    category_id: 'c1',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400&auto=format&fit=crop',
    description: 'Fresh red tomatoes, great for salads and cooking.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p2',
    sku: 'VEG-002',
    name: 'Organic Onions',
    price: 35,
    unit_size: '1 kg',
    category_id: 'c1',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?q=80&w=400&auto=format&fit=crop',
    description: 'Premium quality dry onions.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p3',
    sku: 'DAI-001',
    name: 'Amul Taaza Toned Milk',
    price: 54,
    unit_size: '1 L',
    category_id: 'c2',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop',
    description: 'Homogenized toned milk.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p4',
    sku: 'DAI-002',
    name: 'Britannia Whole Wheat Bread',
    price: 45,
    unit_size: '400 g',
    category_id: 'c2',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
    description: '100% whole wheat bread, high in fiber.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p5',
    sku: 'SNA-001',
    name: 'Haldiram Aloo Bhujia',
    price: 110,
    unit_size: '400 g',
    category_id: 'c3',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=400&auto=format&fit=crop',
    description: 'Crispy potato noodles snack.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p6',
    sku: 'SNA-002',
    name: 'Lays India\'s Magic Masala',
    price: 20,
    unit_size: '50 g',
    category_id: 'c3',
    is_available: false,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=400&auto=format&fit=crop',
    description: 'Spicy potato chips.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p7',
    sku: 'FES-001',
    name: 'Cadbury Celebrations Gift Pack',
    price: 150,
    unit_size: '130 g',
    category_id: 'c4',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop',
    description: 'Perfect gift for festive season.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: 'Diwali Mega Sale',
    text: 'Up to 50% off on groceries and sweets!',
    image_url: 'https://images.unsplash.com/photo-1512805147242-c3e794fc1b24?q=80&w=1200&auto=format&fit=crop',
    link_url: '/shop/festive-offers',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b2',
    title: 'Fresh Vegetables Daily',
    text: 'Farm fresh produce delivered to your doorstep.',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    link_url: '/shop/fresh-vegetables',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_DELIVERY_SETTINGS: DeliverySettings = {
  id: 'ds1',
  rules_text: 'Free delivery on orders above ₹500 within 5km radius. Standard delivery time is 45-60 mins.',
  flat_fee: 30,
  is_active: true,
  updated_at: new Date().toISOString()
};

export const MOCK_OFFERS = [
  {
    id: 'o1',
    title: 'Get 20% off on Snacks!',
    description: 'Use code SNACK20 at checkout',
    discount_percentage: 20,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
