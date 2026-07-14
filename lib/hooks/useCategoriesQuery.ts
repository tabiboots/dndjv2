import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/contexts/TagDataContext'

const supabase = createClient()

export function useCategoriesQuery(uid: string | null) {
  return useQuery({
    queryKey: ['categories', uid],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await supabase
        .from('tag_categories')
        .select('id, name, sort_order')
        .eq('user_id', uid!)
        .order('sort_order')
      return data ?? []
    },
    enabled: !!uid,
  })
}
