import { createAdminClient, createClient } from '@/lib/supabase/server'

// Hồ sơ người dùng hiện tại — nguồn sự thật cho mọi route handler cần auth.
export type Profile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
  full_name: string | null
  phone: string | null
}

export async function getAuthenticatedProfile(): Promise<Profile | null> {
  const supabase = await createClient()
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
