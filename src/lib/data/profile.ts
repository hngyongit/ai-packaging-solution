import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// Hồ sơ người dùng hiện tại — nguồn sự thật cho mọi route handler cần auth.
export type Profile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
  full_name: string | null
  phone: string | null
}

/**
 * Lấy profile của user đã xác thực.
 * @param request - Optional NextRequest (dùng trong middleware để đọc cookies).
 */
export async function getAuthenticatedProfile(request?: NextRequest): Promise<Profile | null> {
  const supabase = await createClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = await createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', user.id)
    .single<Profile>()

  return data
}
