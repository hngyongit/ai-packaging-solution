// Báo giỏ hàng thay đổi để navbar refresh badge. Custom event thay vì global state
// (Redux bị cấm ở AGENT.md). Số dòng giỏ quá nhỏ để đáng một store.
export const CART_UPDATED = 'cart:updated'

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED))
}
