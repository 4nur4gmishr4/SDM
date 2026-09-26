export interface StoreMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  width?: number;
  height?: number;
  title: string;
  department: string;
  badge: string;
  notes: string;
  highlightTag?: string;
  aspectRatioLabel?: string;
}

// 5 Curated Unique Master Photos + 1 Master Video Tour (Zero duplicate angles)
export const STORE_MEDIA_ITEMS: StoreMediaItem[] = [
  {
    id: 'store-billing-counter',
    type: 'image',
    url: '/images/store/img_0604.jpg',
    width: 4032,
    height: 3024,
    title: 'Express Billing & Front Counter Operations',
    department: 'Front Desk & Checkout',
    badge: 'Customer First',
    highlightTag: '4032 × 3024 Master HD',
    notes: "Sai Darshan Mart's checkout counter is powered by digital POS systems ensuring prompt computerized billing and zero wait times. Our staff welcomes every neighbor with warmth, staying true to our philosophy: 'There is only one Boss: The Customer'.",
    aspectRatioLabel: '1000×1000 Master Fit',
  },
  {
    id: 'store-snacks-aisle',
    type: 'image',
    url: '/images/store/img_0525.jpg',
    width: 4032,
    height: 3024,
    title: 'Evening Snacks, Tea-Time Namkeens & Kitchenware',
    department: 'Snacks & Kitchen Essentials',
    badge: 'Daily Variety',
    highlightTag: '4032 × 3024 Master HD',
    notes: 'A spacious supermarket aisle filled with fresh tea-time snacks, traditional namkeens, chips, roasted mixtures, alongside durable stainless steel cookware and daily kitchen utensils.',
    aspectRatioLabel: '1000×1000 Master Fit',
  },
  {
    id: 'store-dry-fruits',
    type: 'image',
    url: '/images/store/img_9084.jpg',
    width: 4032,
    height: 3024,
    title: 'Handpicked Dry Fruits, Nuts & Cooking Spices',
    department: 'Dry Fruits & Healthy Living',
    badge: 'Grade-A Quality',
    highlightTag: '4032 × 3024 Master HD',
    notes: 'Premium California almonds, whole cashews, plump golden raisins, walnuts, and celebratory dry fruit gift boxes preserved under hygienic, climate-controlled shelves for maximum freshness.',
    aspectRatioLabel: '1000×1000 Master Fit',
  },
  {
    id: 'store-packaged-groceries',
    type: 'image',
    url: '/images/store/img_2552.jpg',
    width: 3264,
    height: 2448,
    title: 'Branded Pantry Staples, Cooking Oils & Provisions',
    department: 'Pantry Staples & Grocery',
    badge: 'Top Brands',
    highlightTag: '3264 × 2448 Master HD',
    notes: 'Everyday household essentials from trusted edible oils and whole wheat flours to quick breakfast cereals, noodles, and packaged staples, continually replenished with fresh batches.',
    aspectRatioLabel: '1000×1000 Master Fit',
  },
  {
    id: 'store-personal-care',
    type: 'image',
    url: '/images/store/8f4f810f-f26c-4c1d-84e8-d91f62f37615.jpg',
    width: 1024,
    height: 768,
    title: 'Skincare, Daily Grooming & Family Hygiene',
    department: 'Personal Care & Wellness',
    badge: 'Hygiene & Care',
    highlightTag: '1024 × 768 Master Section',
    notes: 'A dedicated personal care section featuring trusted family skincare lotions, soaps, shampoos, hair oils, dental care, and everyday hygiene necessities for all ages.',
    aspectRatioLabel: '1000×1000 Master Fit',
  },
  {
    id: 'store-video-tour',
    type: 'video',
    url: '/images/store/img_0525.mp4',
    title: 'Live Walkthrough Video: Supermarket Aisles in Motion',
    department: 'Virtual Store Tour',
    badge: 'Watch Video Tour',
    highlightTag: 'HD Video Walkthrough',
    notes: 'Take an authentic virtual walk through Sai Darshan Mart at 1117 Sanjeevni Nagar. Experience the cleanliness, organized categorization, wide aisles, and extensive product variety in motion.',
    aspectRatioLabel: 'Video Stream',
  },
];
