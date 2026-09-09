"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { WarningCircle, XCircle } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState("")

  async function cancelOrder() {
    setIsCancelling(true)
    setError("")

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          notes: "Customer cancelled pending order",
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? "Không thể hủy đơn hàng")
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể hủy đơn hàng")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" size="lg" disabled={isCancelling} onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        Hủy đơn hàng
      </Button>
      <Modal
        size="default"
        title="Xác nhận hủy đơn hàng"
        description="Đơn hàng đang ở trạng thái chờ xử lý nên bạn có thể hủy. Sau khi hủy, trạng thái đơn hàng sẽ chuyển sang Đã hủy."
        open={open}
        onOpenChange={(nextOpen) => {
          if (isCancelling) return
          setOpen(nextOpen)
          if (!nextOpen) setError("")
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="lg" disabled={isCancelling} onClick={() => setOpen(false)}>
              Giữ đơn hàng
            </Button>
            <Button type="button" variant="destructive" size="lg" disabled={isCancelling} onClick={cancelOrder}>
              <XCircle className="h-4 w-4" />
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </div>
        }
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex gap-3">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
            <div>
              <p className="font-semibold">Bạn chắc chắn muốn hủy đơn hàng này?</p>
              <p className="mt-1 leading-6">
                Thao tác này sẽ ghi nhận lịch sử hủy đơn và đơn hàng sẽ không tiếp tục quy trình duyệt.
              </p>
              {error ? <p className="mt-3 font-medium">{error}</p> : null}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
