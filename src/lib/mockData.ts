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
    description: 'Daily fresh vegetables direct from local farms',
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
    description: 'Fresh milk, butter, paneer, and bakery breads',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c3',
    name: 'Atta, Rice & Dals',
    slug: 'atta-rice-dals',
    display_order: 3,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400&auto=format&fit=crop',
    description: 'Premium grains, whole wheat flour, and pulses',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c4',
    name: 'Snacks & Munchies',
    slug: 'snacks',
    display_order: 4,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=400&auto=format&fit=crop',
    description: 'Chips, biscuits, namkeen, and evening munchies',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c5',
    name: 'Oils & Masalas',
    slug: 'masalas-oils',
    display_order: 5,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop',
    description: 'Pure cooking oils, whole & ground Indian spices',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c6',
    name: 'Beverages & Tea',
    slug: 'beverages',
    display_order: 6,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop',
    description: 'Premium tea, coffee, energy drinks, and juices',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c7',
    name: 'Household Care',
    slug: 'household',
    display_order: 7,
    is_visible: true,
    is_offer_category: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=400&auto=format&fit=crop',
    description: 'Detergents, dishwash, cleaners, and essentials',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c8',
    name: 'Festive Offers',
    slug: 'festive-offers',
    display_order: 8,
    is_visible: true,
    is_offer_category: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop',
    description: 'Special seasonal combos, chocolates, and festive discounts',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_PRODUCTS: Product[] = [
  // Fresh Vegetables (c1)
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
    description: 'Juicy, naturally ripened local farm fresh tomatoes. Perfect for curries, salads, and gravies.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p2',
    sku: 'VEG-002',
    name: 'Organic Red Onions',
    price: 35,
    unit_size: '1 kg',
    category_id: 'c1',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?q=80&w=400&auto=format&fit=crop',
    description: 'Crisp and pungent red onions, cleaned and graded for daily cooking.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p3',
    sku: 'VEG-003',
    name: 'Fresh Mountain Potatoes',
    price: 28,
    unit_size: '1 kg',
    category_id: 'c1',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400&auto=format&fit=crop',
    description: 'Firm and wholesome new crop potatoes, essential for Indian meals.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p4',
    sku: 'VEG-004',
    name: 'Fresh Green Capsicum (Shimla Mirch)',
    price: 40,
    unit_size: '500 g',
    category_id: 'c1',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?q=80&w=400&auto=format&fit=crop',
    description: 'Crisp green bell peppers packed with vitamins, great for stir-fries and noodles.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p5',
    sku: 'VEG-005',
    name: 'Coriander & Green Chilli Combo',
    price: 20,
    unit_size: '250 g',
    category_id: 'c1',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1588879460618-9249e7d947d1?q=80&w=400&auto=format&fit=crop',
    description: 'Fresh fragrant green coriander leaves with spicy green chillies.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Dairy & Bakery (c2)
  {
    id: 'p6',
    sku: 'DAI-001',
    name: 'Amul Taaza Homogenised Milk',
    price: 54,
    unit_size: '1 L',
    category_id: 'c2',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop',
    description: 'Pure, fresh toned milk from Amul. No boiling required before consumption.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p7',
    sku: 'DAI-002',
    name: 'Britannia 100% Whole Wheat Bread',
    price: 45,
    unit_size: '400 g',
    category_id: 'c2',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
    description: 'Nutritious brown bread made from whole wheat flour, rich in dietary fiber.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p8',
    sku: 'DAI-003',
    name: 'Amul Pasteurised Salted Butter',
    price: 58,
    unit_size: '100 g',
    category_id: 'c2',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=400&auto=format&fit=crop',
    description: 'Utterly butterly delicious Amul Butter, made from fresh cream.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p9',
    sku: 'DAI-004',
    name: 'Mother Dairy Fresh Malai Paneer',
    price: 95,
    unit_size: '200 g',
    category_id: 'c2',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400&auto=format&fit=crop',
    description: 'Soft and melt-in-mouth cottage cheese, ideal for Shahi Paneer and Matar Paneer.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Atta, Rice & Dals (c3)
  {
    id: 'p10',
    sku: 'GRN-001',
    name: 'Aashirvaad Shudh Chakki Atta',
    price: 245,
    unit_size: '5 kg',
    category_id: 'c3',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
    description: '100% pure whole wheat flour processed with traditional stone-chakki grinding.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p11',
    sku: 'GRN-002',
    name: 'India Gate Feast Rozzana Basmati Rice',
    price: 135,
    unit_size: '1 kg',
    category_id: 'c3',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400&auto=format&fit=crop',
    description: 'Long grain aromatic basmati rice for daily family meals and biryani.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p12',
    sku: 'GRN-003',
    name: 'Tata Sampann Unpolished Toor Dal',
    price: 165,
    unit_size: '1 kg',
    category_id: 'c3',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
    description: 'Unpolished arhar/toor dal rich in natural protein and wholesome taste.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Snacks & Munchies (c4)
  {
    id: 'p13',
    sku: 'SNA-001',
    name: 'Haldiram\'s Nagpur Aloo Bhujia',
    price: 110,
    unit_size: '400 g',
    category_id: 'c4',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=400&auto=format&fit=crop',
    description: 'Iconic spicy potato and tepary bean mint noodles snack.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p14',
    sku: 'SNA-002',
    name: 'Lay\'s India\'s Magic Masala Chips',
    price: 20,
    unit_size: '50 g',
    category_id: 'c4',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=400&auto=format&fit=crop',
    description: 'Crispy ridged potato chips infused with tantalizing Indian spices.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p15',
    sku: 'SNA-003',
    name: 'Parle-G Gold Glucose Biscuits',
    price: 30,
    unit_size: '250 g',
    category_id: 'c4',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=400&auto=format&fit=crop',
    description: 'India\'s favorite tea-time biscuit with extra milk and wheat strength.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Oils & Masalas (c5)
  {
    id: 'p16',
    sku: 'OIL-001',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    price: 145,
    unit_size: '1 L Pouch',
    category_id: 'c5',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400&auto=format&fit=crop',
    description: 'Light and healthy refined sunflower oil enriched with vitamins A and D.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p17',
    sku: 'OIL-002',
    name: 'Catch Red Chilli Powder (Lal Mirch)',
    price: 75,
    unit_size: '200 g',
    category_id: 'c5',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop',
    description: 'Low-temperature ground red chillies for vibrant color and authentic spiciness.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Beverages & Tea (c6)
  {
    id: 'p18',
    sku: 'BEV-001',
    name: 'Tata Tea Gold Leaf & Dust Blend',
    price: 290,
    unit_size: '500 g',
    category_id: 'c6',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop',
    description: 'Exquisite aroma and rich liquor tea with gently rolled aromatic long leaves.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p19',
    sku: 'BEV-002',
    name: 'Nescafé Classic Instant Coffee',
    price: 180,
    unit_size: '50 g Glass Jar',
    category_id: 'c6',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop',
    description: '100% pure instant coffee made from selected Robusta beans.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Household Care (c7)
  {
    id: 'p20',
    sku: 'HOU-001',
    name: 'Surf Excel Quick Wash Detergent',
    price: 140,
    unit_size: '1 kg',
    category_id: 'c7',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=400&auto=format&fit=crop',
    description: 'Premium stain removal detergent powder with X-Tra Clean Particles.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p21',
    sku: 'HOU-002',
    name: 'Vim Lemon Dishwash Gel Bottle',
    price: 115,
    unit_size: '500 ml',
    category_id: 'c7',
    is_available: true,
    is_featured: false,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=400&auto=format&fit=crop',
    description: 'Concentrated gel with power of 100 lemons. Leaves zero residue and sparkling shine.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Festive Offers (c8)
  {
    id: 'p22',
    sku: 'FES-001',
    name: 'Cadbury Celebrations Rich Chocolate Pack',
    price: 150,
    unit_size: '130 g',
    category_id: 'c8',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop',
    description: 'Assortment of Dairy Milk, 5 Star, and Perk. Perfect festive gifting pack.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'p23',
    sku: 'FES-002',
    name: 'Ferrero Rocher Hazelnut Chocolates Box',
    price: 399,
    unit_size: '16 pieces (200g)',
    category_id: 'c8',
    is_available: true,
    is_featured: true,
    is_archived: false,
    image_url: 'https://images.unsplash.com/photo-1548741487-18d16a1a094c?q=80&w=400&auto=format&fit=crop',
    description: 'Crisp hazelnut and milk chocolate-covered specialty pralines in luxury gold foil.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: 'Sai Darshan Mart Super Savings',
    text: 'Up to 30% off on Fresh Produce, Atta, and Daily Staples! WhatsApp Doorstep Delivery across Jabalpur.',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    link_url: '/shop',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b2',
    title: 'Farm Fresh Vegetables Daily',
    text: 'Handpicked fresh tomatoes, potatoes, onions and leafy greens delivered in under 60 minutes.',
    image_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=1200&auto=format&fit=crop',
    link_url: '/shop/fresh-vegetables',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_DELIVERY_SETTINGS: DeliverySettings = {
  id: 'ds1',
  rules_text: 'Store managed doorstep delivery across Jabalpur. Free delivery on orders above ₹500 within 5km radius. Standard delivery time: 45-60 mins.',
  flat_fee: 30,
  is_active: true,
  updated_at: new Date().toISOString()
};

export const MOCK_OFFERS = [
  {
    id: 'o1',
    title: 'Daily Super Saver',
    description: 'Direct wholesale rates on daily grains and pulses',
    discount_percentage: 15,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_ORDERS: import('../types/order').Order[] = [
  {
    id: 'ord-849102',
    customer_name: 'Aditi Sharma',
    customer_phone: '+91 73541 55669',
    delivery_address: '14 Civil Lines, Near City Hospital, Jabalpur, MP',
    map_link: null,
    quick_order_text: null,
    is_quick_order: false,
    subtotal_amount: 540,
    delivery_fee: 0,
    total_amount: 540,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    order_items: [
      {
        id: 'oi-1',
        order_id: 'ord-849102',
        product_id: 'p1',
        product_name: 'Farm Fresh Hybrid Tomatoes',
        product_sku: 'VEG-TOM-001',
        product_price: 35,
        quantity: 2,
        line_total: 70
      },
      {
        id: 'oi-2',
        order_id: 'ord-849102',
        product_id: 'p7',
        product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
        product_sku: 'GRO-ATT-007',
        product_price: 245,
        quantity: 1,
        line_total: 245
      },
      {
        id: 'oi-3',
        order_id: 'ord-849102',
        product_id: 'p6',
        product_name: 'Amul Fresh Malai Paneer 200g',
        product_sku: 'DAI-PAN-006',
        product_price: 90,
        quantity: 2,
        line_total: 180
      }
    ]
  },
  {
    id: 'ord-849101',
    customer_name: 'Rajesh Verma',
    customer_phone: '+91 73541 55669',
    delivery_address: 'Flat 302, Sai Vihar Apartment, Napier Town, Jabalpur',
    map_link: null,
    quick_order_text: '2kg Aashirvaad Atta, 1 packet Amul Taaza milk, 1 packet Fortune Sunflower oil',
    is_quick_order: true,
    subtotal_amount: 410,
    delivery_fee: 30,
    total_amount: 440,
    status: 'processing',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    id: 'ord-849100',
    customer_name: 'Pooja Tiwari',
    customer_phone: '+91 73541 55669',
    delivery_address: 'B-12, Vijay Nagar, Jabalpur, MP',
    map_link: null,
    quick_order_text: null,
    is_quick_order: false,
    subtotal_amount: 780,
    delivery_fee: 0,
    total_amount: 780,
    status: 'delivered',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  }
];
