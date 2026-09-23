/**
 * Customers data functions for staff — list, detail, stats.
 * Uses Supabase admin client (bypasses RLS) so staff can query all customers.
 */

import { createAdminClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomerSummary = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null // derived from auth.users via join
  company_name: string | null
  address: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
}

export type CustomerDetail = CustomerSummary & {
  created_at: string
  updated_at: string
}

export type CustomerStats = {
  totalOrders: number
  totalSpent: number
  lastOrderAt: string | null
}

export type PaginationInfo = {
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Lấy danh sách khách hàng */
export async function listCustomers(
  page = 1,
  perPage = 20,
  search?: string
): Promise<{ data: CustomerSummary[]; pagination: PaginationInfo }> {
  const admin = await createAdminClient()
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = admin.from('profiles').select(`
    id,
    full_name,
    phone,
    company_name,
    address,
    created_at,
    updated_at,
    orders:orders!customer_id (
      id,
      total_amount,
      created_at
    )
  `, { count: 'exact' })

  // Filter only customers (exclude sales/admin)
  query = query.eq('role', 'customer')

  // Search
  if (search) {
    const term = `%${search}%`
    query = query.or(`full_name.ilike.${term},phone.ilike.${term},company_name.ilike.${term}`)
  }

  // Sort by most recent activity
  query = query.order('created_at', { ascending: false })

  // Pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list customers: ${error.message}`)
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / perPage)

  // Transform: compute stats from joined orders
  const transformed = (data ?? []).map((row: any) => {
    const orders = row.orders ?? []
    return {
      id: row.id,
      full_name: row.full_name,
      phone: row.phone,
      email: null, // Not available via profiles join; would need separate query
      company_name: row.company_name,
      address: row.address,
      total_orders: orders.length,
      total_spent: orders.reduce((sum: number, o: any) => sum + Number(o.total_amount ?? 0), 0),
      last_order_at: orders.length > 0
        ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null,
    } as CustomerSummary
  })

  return {
    data: transformed,
    pagination: { total, page, perPage, totalPages },
  }
}

/** Lấy chi tiết khách hàng */
export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      company_name,
      address,
      created_at,
      updated_at,
      orders:orders!customer_id (
        id,
        total_amount,
        created_at
      )
    `)
    .eq('id', customerId)
    .eq('role', 'customer')
    .single()

  if (error) {
    throw new Error(`Failed to get customer detail: ${error.message}`)
  }

  if (!data) return null

  const orders = (data as any).orders ?? []
  return {
    id: data.id,
    full_name: data.full_name,
    phone: data.phone,
    email: null,
    company_name: data.company_name,
    address: data.address,
    total_orders: orders.length,
    total_spent: orders.reduce((sum: number, o: any) => sum + Number(o.total_amount ?? 0), 0),
    last_order_at: orders.length > 0
      ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as CustomerDetail
}

/** Lấy thống kê đơn hàng của khách */
export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select('total_amount, created_at')
    .eq('customer_id', customerId)

  if (error) {
    throw new Error(`Failed to get customer stats: ${error.message}`)
  }

  const orders = data ?? []
  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount ?? 0), 0)
  const lastOrderAt = orders.length > 0
    ? orders.reduce((latest: any, o: any) =>
        new Date(o.created_at) > new Date(latest.created_at) ? o : latest
      ).created_at
    : null

  return { totalOrders, totalSpent, lastOrderAt }
}
