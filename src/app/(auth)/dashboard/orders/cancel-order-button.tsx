"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { XCircle } from "@phosphor-icons/react"

import { CancelOrderModal } from "@/components/modals/cancel-order"
import { Button } from "@/components/ui/button"

export function CancelOrderButton({ orderId, orderCode }: { orderId: string; orderCode?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="destructive" size="lg" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        Hủy đơn hàng
      </Button>
      <CancelOrderModal
        orderId={orderId}
        orderCode={orderCode}
        open={open}
        onOpenChange={setOpen}
        onCancelled={() => router.refresh()}
      />
    </>
  )
}
