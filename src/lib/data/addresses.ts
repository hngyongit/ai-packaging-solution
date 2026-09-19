import { createAdminClient, createClient } from '@/lib/supabase/server'

import { OrderError } from './orders-create'

// Address book — thông tin liên hệ + giao hàng lưu trong DB để checkout chỉ việc
// chọn, không phải nhập lại. Route dùng admin client + lọc customer_id tường minh
// (RLS customer_addresses: auth.uid() = customer_id).

export type AddressRow = {
  id: string
  customer_id: string
  label: string
  recipient_name: string
  phone: string
  email: string
  address: string
  is_default: boolean
}

export type AddressInput = {
  customerId: string
  id?: string
  label: string
  recipientName: string
  phone: string
  email: string
  address: string
  isDefault?: boolean
}

const ADDRESS_COLUMNS = 'id, customer_id, label, recipient_name, phone, email, address, is_default'

async function admin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? createAdminClient() : null
}

function toPayload(input: AddressInput) {
  return {
    label: input.label.trim(),
    recipient_name: input.recipientName.trim(),
    phone: input.phone.replace(/\D/g, ''),
    email: input.email.trim(),
    address: input.address.trim(),
    updated_at: new Date().toISOString(),
  }
}

export async function listAddresses(customerId: string): Promise<AddressRow[]> {
  const db = await admin()
  if (!db) return []
  const { data, error } = await db
    .from('customer_addresses')
    .select(ADDRESS_COLUMNS)
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at')
  if (error) throw new OrderError(error.message, 500)
  return (data ?? []) as AddressRow[]
}

/** Bỏ default các dòng khác rồi đặt dòng này — unique index một-mặc-định chặn ngược lại. */
async function applyDefault(db: NonNullable<Awaited<ReturnType<typeof admin>>>, customerId: string, id: string) {
  await db.from('customer_addresses').update({ is_default: false }).eq('customer_id', customerId).eq('is_default', true)
  const { error } = await db.from('customer_addresses').update({ is_default: true }).eq('id', id).eq('customer_id', customerId)
  if (error) throw new OrderError(error.message, 500)
}

/** Thêm hoặc sửa địa chỉ. Dòng đầu tiên của khách tự thành mặc định. */
export async function saveAddress(input: AddressInput): Promise<AddressRow> {
  const db = await admin()
  if (!db) throw new OrderError('Unauthorized', 401)
  const payload = toPayload(input)
  if (!payload.recipient_name || !payload.address) throw new OrderError('Thiếu tên người nhận hoặc địa chỉ.', 400)
  if (!/^\d{10}$/.test(payload.phone)) throw new OrderError('Số điện thoại phải đủ 10 chữ số.', 400)

  if (input.id) {
    const { data, error } = await db
      .from('customer_addresses')
      .update({ ...payload, ...(input.isDefault ? { is_default: true } : {}) })
      .eq('id', input.id)
      .eq('customer_id', input.customerId)
      .select(ADDRESS_COLUMNS)
      .maybeSingle<AddressRow>()
    if (error) throw new OrderError(error.message, 500)
    if (!data) throw new OrderError('Không tìm thấy địa chỉ', 404)
    if (input.isDefault) await applyDefault(db, input.customerId, data.id)
    return { ...data, is_default: input.isDefault ? true : data.is_default }
  }

  const hasAny = await db
    .from('customer_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', input.customerId)
  const isDefault = input.isDefault ?? (hasAny.count ?? 0) === 0

  const { data, error } = await db
    .from('customer_addresses')
    .insert({ customer_id: input.customerId, ...payload, is_default: false })
    .select(ADDRESS_COLUMNS)
    .single<AddressRow>()
  if (error) throw new OrderError(error.message, 500)
  if (isDefault) await applyDefault(db, input.customerId, data.id)
  return { ...data, is_default: isDefault }
}

export async function setDefaultAddress(customerId: string, id: string): Promise<void> {
  const db = await admin()
  if (!db) throw new OrderError('Unauthorized', 401)
  await applyDefault(db, customerId, id)
}

export async function deleteAddress(customerId: string, id: string): Promise<void> {
  const db = await admin()
  if (!db) throw new OrderError('Unauthorized', 401)
  const { data, error } = await db
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', customerId)
    .select('id')
  if (error) throw new OrderError(error.message, 500)
  if (!data?.length) throw new OrderError('Không tìm thấy địa chỉ', 404)
}

/**
 * Khách chưa có địa chỉ nào: dựng một cái từ hồ sơ (profiles.full_name/phone/
 * default_address + email tài khoản). Không đủ dữ liệu thì trả null — UI bắt
 * khách tự nhập qua form "Thêm địa chỉ mới".
 */
export async function ensureDefaultAddress(customerId: string): Promise<AddressRow | null> {
  const db = await admin()
  if (!db) throw new OrderError('Unauthorized', 401)
  const existing = await listAddresses(customerId)
  if (existing.length > 0) return existing.find((row) => row.is_default) ?? existing[0]

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, phone, default_address, company_name')
    .eq('id', customerId)
    .maybeSingle<Record<string, string | null>>()
  // service_role đọc email qua auth admin, không qua PostgREST.
  const { data: account } = await db.auth.admin.getUserById(customerId)
  const address = profile?.default_address?.trim()
  const phone = (profile?.phone ?? '').replace(/\D/g, '')
  const name = profile?.full_name?.trim()
  const email = account?.user?.email?.trim() ?? ''
  if (!address || !name || phone.length !== 10) return null

  return saveAddress({
    customerId,
    label: profile?.company_name?.trim() ? 'Công ty' : 'Mặc định',
    recipientName: name,
    phone,
    email,
    address,
    isDefault: true,
  })
}

/** Địa chỉ dùng cho checkout — theo id khách chọn, hoặc mặc định nếu client không gửi id. */
export async function getAddressForCheckout(customerId: string, addressId?: string): Promise<AddressRow> {
  const db = await admin()
  if (!db) throw new OrderError('Unauthorized', 401)
  const query = addressId
    ? db.from('customer_addresses').select(ADDRESS_COLUMNS).eq('id', addressId)
    : db.from('customer_addresses').select(ADDRESS_COLUMNS).eq('is_default', true)
  const { data, error } = await query.eq('customer_id', customerId).maybeSingle<AddressRow>()
  if (error) throw new OrderError(error.message, 500)
  if (!data) throw new OrderError('Vui lòng chọn địa chỉ giao hàng', 400)
  return data
}
