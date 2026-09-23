'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ActionSidebarProps = {
  consultationId: string
  status: string
  assigned_name: string | null
  assigned_to: string | null
  sales_notes: string | null
  currentUserId: string
  profileFullName: string
}

export function ConsultationActionSidebar({
  consultationId,
  status,
  assigned_name,
  assigned_to,
  sales_notes,
  currentUserId,
  profileFullName,
}: ActionSidebarProps) {
  const router = useRouter()
  const [showReviseForm, setShowReviseForm] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [reviseLoading, setReviseLoading] = useState(false)

  // --- Approve → quoted (JS so we can notify + redirect) ---
  async function handleApprove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setApproveLoading(true)
    const formData = new FormData(e.currentTarget)
    const notes = formData.get('notes')?.toString() ?? ''

    try {
      const res = await fetch(`/api/consultations/${consultationId}/respond`, {
        method: 'POST',
        body: new URLSearchParams({ action: 'approve', notes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Lỗi' }))
        throw new Error(data.error ?? 'Không thể duyệt tư vấn')
      }
      alert('✅ Đã duyệt tư vấn — khách hàng có thể tạo đơn hàng.')
      router.push('/staff')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setApproveLoading(false)
    }
  }

  // --- Revise → pending_review (needs JS because textarea is hidden) ---
  async function handleRevise(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setReviseLoading(true)
    const formData = new FormData(e.currentTarget)
    const notes = formData.get('notes')?.toString() ?? ''

    try {
      const res = await fetch(`/api/consultations/${consultationId}/respond`, {
        method: 'POST',
        body: new URLSearchParams({ action: 'revise', notes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Lỗi' }))
        throw new Error(data.error ?? 'Không thể gửi yêu cầu điều chỉnh')
      }
      alert('✅ Đã gửi yêu cầu điều chỉnh cho khách hàng.')
      router.push('/staff')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setReviseLoading(false)
    }
  }

  // --- Save notes (existing form action) ---

  return (
    <div className="space-y-6">
      {/* ── Status transitions ── */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Option 1: Duyệt → quoted */}
          {(status === 'ai_processed' || status === 'staff_reviewed') && (
            <form onSubmit={handleApprove} className="space-y-2">
              <input type="hidden" name="action" value="approve" />
              <textarea
                name="notes"
                placeholder="Ghi chú phản hồi cho khách (tùy chọn)..."
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={approveLoading}
                className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
              >
                {approveLoading ? 'Đang duyệt...' : '✓ Duyệt & Khách có thể tạo đơn'}
              </button>
            </form>
          )}

          {/* Option 2: Điều chỉnh — toggle textarea */}
          {(status === 'ai_processed' || status === 'staff_reviewed') && !showReviseForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReviseForm(true)}
            >
              ✎ Điều chỉnh
            </Button>
          )}

          {showReviseForm && (
            <form onSubmit={handleRevise} className="space-y-2">
              <textarea
                name="notes"
                placeholder="Mô tả chi tiết cần điều chỉnh..."
                rows={3}
                required
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reviseLoading}
                  className={cn(buttonVariants({ size: 'sm' }), 'flex-1')}
                >
                  {reviseLoading ? 'Đang gửi...' : 'Gửi yêu cầu điều chỉnh'}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviseForm(false)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}

          {/* Convert to order — only when already quoted */}
          {status === 'quoted' && (
            <form action={`/api/consultations/${consultationId}/convert`} method="POST">
              <input type="hidden" name="fromStatus" value={status} />
              <button
                type="submit"
                className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
              >
                📦 Chuyển thành đơn
              </button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Sales Notes ── */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Ghi chú bán hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sales_notes && (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 whitespace-pre-wrap">
              {sales_notes}
            </p>
          )}
          <form action={`/api/consultations/${consultationId}/notes`} method="POST" className="space-y-2">
            <textarea
              name="notes"
              placeholder="Ghi chú phản hồi cho khách..."
              rows={3}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'w-full')}
            >
              Lưu ghi chú
            </button>
          </form>
        </CardContent>
      </Card> */}

      {/* ── Assignment ── */}
      <Card>
        <CardHeader>
          <CardTitle>Phân công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            {assigned_name ? `Đã gán cho ${assigned_name}` : 'Chưa gán'}
          </p>
          <form action={`/api/consultations/${consultationId}/assign`} method="POST" className="space-y-2">
            <select
              name="userId"
              defaultValue={assigned_to || ''}
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chưa gán</option>
              <option value={currentUserId}>{profileFullName || 'Bạn'}</option>
            </select>
            <button
              type="submit"
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'w-full')}
            >
              Gán
            </button>
          </form>
        </CardContent>
      </Card>

      {/* ── Related order ── */}
      {status === 'converted' && (
        <Card>
          <CardHeader>
            <CardTitle>Đơn liên quan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Tư vấn này đã được chuyển thành đơn hàng.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
