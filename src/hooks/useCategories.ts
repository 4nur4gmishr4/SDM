import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Category } from '../types/category';

export function useCategories() {
  const queryResult = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      if (!isSupabaseConfigured) return [];

      // Fetch categories and active banners in parallel
      const [categoriesRes, bannersRes] = await Promise.all([
        withTimeout(
          supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true }),
          5000
        ),
        withTimeout(
          supabase
            .from('banners')
            .select('id, title, link_url, is_active')
            .eq('is_active', true),
          5000
        ),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;

      const list = (categoriesRes.data as Category[]) || [];
      const activeBanners = (bannersRes.data as any[]) || [];

      // Dynamic synchronization: A promotional category is displayed only when its corresponding promotional banner is ON
      const isMidMonthBannerActive = activeBanners.some((b) => {
        const url = (b.link_url || '').toLowerCase();
        const title = (b.title || '').toLowerCase();
        return url.includes('mid-month-offer') || title.includes('mid-month') || title.includes('mid month');
      });

      const isBogoBannerActive = activeBanners.some((b) => {
        const url = (b.link_url || '').toLowerCase();
        const title = (b.title || '').toLowerCase();
        return url.includes('buy-1-get-1') || title.includes('buy 1 get 1') || title.includes('bogo');
      });

      const isBmgmBannerActive = activeBanners.some((b) => {
        const url = (b.link_url || '').toLowerCase();
        const title = (b.title || '').toLowerCase();
        return url.includes('buy-more-get-more') || title.includes('buy more') || title.includes('bmgm');
      });

      // Filter out hidden categories and promotional categories whose banner is turned off
      const visible = list.filter((c) => {
        if ((c as any).is_visible === false || (c as any).is_active === false) return false;
        
        const slug = (c.slug || '').toLowerCase();
        if (slug === 'mid-month-offer') return isMidMonthBannerActive;
        if (slug === 'buy-1-get-1') return isBogoBannerActive;
        if (slug === 'buy-more-get-more') return isBmgmBannerActive;
        
        return true;
      });

      const getCategoryRank = (slug: string): number => {
        const s = (slug || '').toLowerCase();
        if (s === 'sai-darshan-specials') return 1;
        if (s === 'mid-month-offer') return 2;
        if (s === 'buy-1-get-1') return 3;
        if (s === 'buy-more-get-more') return 4;
        return 100;
      };

      return [...visible].sort((a, b) => {
        const rankA = getCategoryRank(a.slug);
        const rankB = getCategoryRank(b.slug);
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      });
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  return {
    categories: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error ? (queryResult.error as Error).message : null,
  };
}
