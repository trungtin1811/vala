'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Court } from '@/types'

export function useCourts() {
  const { user } = useAuth()

  return useQuery<Court[]>({
    queryKey: ['courts', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Court[]
    },
    enabled: !!user,
  })
}

export function useCreateCourt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { name: string; address?: string | null; latitude?: number | null; longitude?: number | null }) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('courts')
        .insert({ owner_id: user.id, ...values })
        .select()
        .single()
      if (error) throw error
      return data as Court
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', user?.id] })
    },
  })
}
