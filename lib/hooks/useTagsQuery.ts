import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tag } from '@/lib/contexts/TagDataContext'

const supabase = createClient()

export function useTagsQuery(uid: string | null) {
  return useQuery({
    queryKey: ['tags', uid],
    queryFn: async (): Promise<Tag[]> => {
      const { data } = await supabase
        .from('tags')
        .select('id, name, color, category_id, sort_order')
        .eq('user_id', uid!)
        .order('sort_order')
      return data ?? []
    },
    enabled: !!uid,
  })
}
