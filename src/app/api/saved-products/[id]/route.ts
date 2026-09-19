import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { deleteSavedProduct, SavedProductError } from '@/lib/data/saved-products'
import { getAuthenticatedProfile } from '@/lib/data/profile'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return NextResponse.json({ error: 'Invalid saved product id' }, { status: 400 })

    await deleteSavedProduct(profile.id, id.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof SavedProductError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Saved-products DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
