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
  is_active?: boolean;
}

const SUPABASE_STORE_MEDIA_BASE = 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/store/';

// 5 Curated Unique Store Photos + 1 Master Video Tour in Natural Friendly Hinglish (Permanent items)
export const STORE_MEDIA_ITEMS: StoreMediaItem[] = [
  {
    id: 'store-billing-counter',
    type: 'image',
    url: `${SUPABASE_STORE_MEDIA_BASE}img_0604.jpg`,
    width: 4032,
    height: 3024,
    title: 'Fast Computerized Billing Counter',
    department: 'Billing Counter',
    badge: 'Zero Wait Time',
    notes: "Sai Darshan Mart ka modern computerized billing counter, jahan lambi line me khade hone ka koi jhanjhat nahi. Hamara staff har customer ka smile ke sath swagat karta hai.",
    is_active: true,
  },
  {
    id: 'store-snacks-aisle',
    type: 'image',
    url: `${SUPABASE_STORE_MEDIA_BASE}img_0525.jpg`,
    width: 4032,
    height: 3024,
    title: 'Fresh Namkeen, Chai-Nashta & Steel Bartan',
    department: 'Snacks & Kitchen Items',
    badge: 'Daily Fresh Variety',
    notes: 'Shaam ki chai ke liye fresh namkeen, biscuits, chips, snacks aur sath me kitchen ke liye daily use ke mazboot stainless steel bartan ek hi jagah milenge.',
    is_active: true,
  },
  {
    id: 'store-dry-fruits',
    type: 'image',
    url: `${SUPABASE_STORE_MEDIA_BASE}img_9084.jpg`,
    width: 4032,
    height: 3024,
    title: 'Pure Dry Fruits, Kaju, Badam & Asli Masale',
    department: 'Dry Fruits & Pure Masale',
    badge: 'Top Grade Quality',
    notes: 'California badam, kaju, kismis, akhrot aur authentic khade masale. Hamesha fresh, saaf-suthre aur hygienic pack me available.',
    is_active: true,
  },
  {
    id: 'store-packaged-groceries',
    type: 'image',
    url: `${SUPABASE_STORE_MEDIA_BASE}img_2552.jpg`,
    width: 3264,
    height: 2448,
    title: 'Ghar Ka Rashan, Tel, Chakki Atta & Provisions',
    department: 'Daily Rashan & Staples',
    badge: 'Top Trusted Brands',
    notes: 'Ghar ke rashan ka saara zaroori saman jaise refined tel, chakki atta, daal, chawal aur breakfast items, hamesha fresh stock aur sahi daam me.',
    is_active: true,
  },
  {
    id: 'store-personal-care',
    type: 'image',
    url: `${SUPABASE_STORE_MEDIA_BASE}8f4f810f-f26c-4c1d-84e8-d91f62f37615.jpg`,
    width: 1024,
    height: 768,
    title: 'Personal Care, Soaps, Shampoos & Daily Hygiene',
    department: 'Personal Care & Hygiene',
    badge: 'Family Hygiene Essentials',
    notes: 'Sabhi branded soaps, shampoos, hair oils, body lotions, toothpastes aur daily hygiene ka saara zaroori saman ek jagah aasaani se chunein.',
    is_active: true,
  },
  {
    id: 'store-video-tour',
    type: 'video',
    url: `${SUPABASE_STORE_MEDIA_BASE}img_0525.mp4`,
    title: 'Sai Darshan Mart Ka Supermarket Video Tour',
    department: 'Store Video Tour',
    badge: 'Live Store Tour',
    notes: 'Ghar baithe Sai Darshan Mart ka video tour dekhiye. Store ki safai, wide aisles aur aasaani se shopping karne ka mahoul khud dekhein.',
    is_active: true,
  },
];
