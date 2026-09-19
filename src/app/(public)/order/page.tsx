import { redirect } from 'next/navigation'

// Tab tạo đơn đã nghỉ: đơn chỉ được tạo qua giỏ hàng. Giữ URL cũ sống.
export default function OrderPage() {
  redirect('/dashboard/custom')
}
