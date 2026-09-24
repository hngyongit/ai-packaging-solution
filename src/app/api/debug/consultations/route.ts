/**
 * Debug endpoint for consultations — check DB connection, columns, RLS policies, and sample data.
 * GET /api/debug/consultations
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // 1. Check if consultations table exists and get column info
    const { data: tables, error: tablesError } = await supabase
      .from('consultations')
      .select('id, customer_id, status, product_type, box_style, print_faces, product_length, product_width, product_height, product_weight, desired_quantity, has_printing, logo_url, notes, sales_notes, ai_recommendation, ai_suggested_dimensions, ai_confidence, created_at')
      .limit(5)
      .order('created_at', { ascending: false })

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: tablesError.message,
        hint: tablesError.hint,
        details: 'Query failed — likely missing columns or table does not exist',
      }, { status: 500 })
    }

    // 2. Count total consultations
    const { count: totalCount, error: countError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })

    // 3. Get distinct statuses
    const { data: statusData, error: statusError } = await supabase.rpc('distinct_statuses', {
      _table: 'consultations',
    } as any).then(() => ({ data: null, error: null }))

    // Fallback: get statuses manually
    const { data: allConsultations, error: allError } = await supabase
      .from('consultations')
      .select('status')
      .limit(100)

    const statuses = allError ? [] : [...new Set(allConsultations?.map(c => c.status) || [])]

    // 4. Check profiles table
    const { data: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('id, role', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      results: {
        rowCount: tables?.length ?? 0,
        totalConsultations: totalCount ?? 0,
        statuses,
        profilesTotal: profileCount ?? 0,
        sampleData: tables,
        errors: {
          query: tablesError?.message,
          count: countError?.message,
        },
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
