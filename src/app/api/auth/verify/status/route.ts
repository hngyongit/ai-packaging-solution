import { NextResponse } from 'next/server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

// Trạng thái xác minh email của chính user đang đăng nhập (client dùng để
// quyết định ở /verify hay về /dashboard).
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data } = await admin
    .from('email_verifications')
    .select('verified_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ verified: Boolean(data?.verified_at) })
}
