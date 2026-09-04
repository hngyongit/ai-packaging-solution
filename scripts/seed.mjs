import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

const env = {}
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(url, key)

const testUsers = [
  { email: 'test-customer@test.com', password: 'test123456', meta: { full_name: 'Nguyễn Văn A', role: 'customer' } },
  { email: 'test-sales@test.com', password: 'test123456', meta: { full_name: 'Trần Thị B', role: 'sales' } },
  { email: 'test-admin@test.com', password: 'test123456', meta: { full_name: 'Lê Văn C', role: 'admin' } },
]

async function main() {
  // 1. Create or update auth users
  for (const u of testUsers) {
    const { data: list } = await supabase.auth.admin.listUsers()
    const found = list?.users?.find(x => x.email === u.email)
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password: u.password,
        user_metadata: u.meta,
        email_confirm: true,
      })
      console.log(`Updated: ${u.email}`)
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: u.meta,
      })
      if (error) { console.error(`FAIL ${u.email}: ${error.message}`); continue }
      console.log(`Created: ${u.email} → ${data.user.id}`)
    }
  }

  // 2. Sync profiles (match auth users by email)
  const { data: users } = await supabase.auth.admin.listUsers()
  const profileData = [
    { email: 'test-customer@test.com', role: 'customer', full_name: 'Nguyễn Văn A', phone: '0901234567', company_name: 'Công ty TNHH ABC' },
    { email: 'test-sales@test.com', role: 'sales', full_name: 'Trần Thị B', phone: '0901234568' },
    { email: 'test-admin@test.com', role: 'admin', full_name: 'Lê Văn C', phone: '0901234569' },
  ]
  for (const p of profileData) {
    const au = users?.users?.find(x => x.email === p.email)
    if (!au) { console.error(`No auth user for ${p.email}`); continue }
    const { email, ...profile } = p
    const { error } = await supabase.from('profiles').upsert(
      { id: au.id, ...profile },
      { onConflict: 'id' }
    )
    if (error) console.error(`Profile FAIL ${p.email}: ${error.message}`)
    else console.log(`Profile OK: ${p.email} → ${au.id}`)
  }

  // 3. Sample consultation & order (if not exist)
  const { data: existing } = await supabase.from('consultations').select('id').limit(1)
  if (!existing || existing.length === 0) {
    const customer = users?.users?.find(x => x.email === 'test-customer@test.com')
    if (customer) {
      await supabase.from('consultations').insert({
        customer_id: customer.id,
        status: 'ai_processed',
        product_type: 'coffee beans',
        product_description: 'Cà phê rang xay nguyên chất 500g/gói',
        product_length: 25, product_width: 18, product_height: 12, product_weight: 500,
        quantity_per_box: 20, desired_quantity: 500,
        has_printing: true, printing_notes: 'In 1 màu xanh lá, logo và thông tin sản phẩm',
        budget: 5000000, notes: 'Giao hàng trong vòng 7 ngày',
      })
      console.log('Sample consultation created')
    }
  }

  const { data: existingOrders } = await supabase.from('orders').select('id').limit(1)
  if (!existingOrders || existingOrders.length === 0) {
    const customer = users?.users?.find(x => x.email === 'test-customer@test.com')
    if (customer) {
      await supabase.from('orders').insert({
        order_code: 'ORD-20260902-001',
        customer_id: customer.id,
        status: 'confirmed',
        total_amount: 4500000,
        payment_method: 'bank_transfer',
        payment_status: 'deposit_paid',
        contact_name: 'Nguyễn Văn A',
        contact_phone: '0901234567',
        contact_email: 'test-customer@test.com',
        delivery_method: 'delivery',
        delivery_address: '123 Nguyễn Huệ, Q.1, TP.HCM',
      })
      console.log('Sample order created')
    }
  }

  console.log('Done')
}

main().catch(e => console.error(e))