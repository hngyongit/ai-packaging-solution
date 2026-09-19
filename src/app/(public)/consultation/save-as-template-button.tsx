'use client'

import { useState } from 'react'
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

/**
 * "Lưu làm mẫu" — lưu kết quả tư vấn AI vào saved_products để import lại ở
 * /order mà không phải gõ lại thông số. Cần đăng nhập (server trả 401 → hướng dẫn).
 */
export function SaveAsTemplateButton({
  consultationId,
  suggestedName,
  size = 'default',
  className,
}: {
  consultationId: string
  suggestedName?: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  function openModal() {
    setName(suggestedName ?? 'Thùng AI đề xuất')
    setError('')
    setOpen(true)
  }

  async function save() {
    setStatus('saving')
    setError('')
    const response = await fetch('/api/saved-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId, name: name.trim() }),
    })
    if (response.ok) {
      setStatus('saved')
      setOpen(false)
      return
    }
    if (response.status === 401) {
      setError('Bạn cần đăng nhập để lưu mẫu.')
      setStatus('idle')
      window.setTimeout(() => {
        window.location.href = '/login'
      }, 1200)
      return
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    setError(body?.error ?? 'Không lưu được mẫu. Vui lòng thử lại.')
    setStatus('idle')
  }

  if (status === 'saved') {
    return (
      <p className={`flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700 ${className ?? ''}`}>
        <CheckCircle className="h-4 w-4" weight="fill" />
        Đã lưu mẫu — tìm ở "Dashboard → Sản phẩm theo yêu cầu"
      </p>
    )
  }

  return (
    <>
      <Button variant="ghost" size={size} className={className} onClick={openModal}>
        <FloppyDisk className="h-4 w-4" />
        Lưu làm mẫu
      </Button>

      <Modal
        open={open}
        onOpenChange={(next) => setOpen(next)}
        title="Lưu kết quả tư vấn làm mẫu"
        description="Lần sau đặt lại thùng y hệt chỉ cần import, không phải nhập lại thông số."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={status === 'saving' || name.trim().length === 0}>
              {status === 'saving' ? 'Đang lưu...' : 'Lưu mẫu'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <label htmlFor="saved-name" className="text-sm font-medium text-gray-700">
            Tên mẫu <span className="text-red-600">*</span>
          </label>
          <Input
            id="saved-name"
            value={name}
            maxLength={100}
            placeholder="VD: Thùng đựng ly sứ 32x32x20"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void save()
              }
            }}
          />
          <p className="text-xs text-gray-500">Mỗi tài khoản không đặt trùng tên mẫu.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  )
}
