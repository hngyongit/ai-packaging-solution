/**
 * Revenue query helpers for staff dashboard.
 */

import { createAdminClient } from '@/lib/supabase/server'

export async function getMonthRevenue(): Promise<number> {
  const admin = await createAdminClient()

  // Get first day of current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data, error } = await admin
    .from('orders')
    .select('total_amount')
    .gte('created_at', firstDayOfMonth)
    .in('status', ['confirmed', 'deposit_paid', 'production', 'completed', 'delivered'])

  if (error) {
    throw new Error(`Failed to get month revenue: ${error.message}`)
  }

  return (data ?? []).reduce((sum: number, o: any) => sum + Number(o.total_amount ?? 0), 0)
}

export async function countOpenConsultations(): Promise<number> {
  const admin = await createAdminClient()

  const { count, error } = await admin
    .from('consultations')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(closed,converted,cancelled)')

  if (error) {
    throw new Error(`Failed to count open consultations: ${error.message}`)
  }

  return count ?? 0
}
