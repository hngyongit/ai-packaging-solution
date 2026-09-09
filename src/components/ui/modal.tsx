"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "@phosphor-icons/react"
import * as React from "react"

import { cn } from "@/lib/utils"

type ModalProps = {
  trigger?: React.ReactElement
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  size?: "default" | "lg" | "xl"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const sizeClassName = {
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
}

export function Modal({
  trigger,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  size = "default",
  open,
  onOpenChange,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger render={trigger} /> : null}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-gray-950/45 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-open:opacity-100" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-dvh items-start justify-center overflow-hidden px-4 py-6 sm:items-center sm:py-8">
          <Dialog.Popup
            className={cn(
              "relative flex max-h-[calc(100dvh-3rem)] w-full flex-col rounded-xl border border-gray-200 bg-white text-foreground shadow-xl outline-none transition-all data-closed:translate-y-2 data-closed:scale-[0.98] data-closed:opacity-0 data-open:translate-y-0 data-open:scale-100 data-open:opacity-100 sm:max-h-[calc(100dvh-4rem)]",
              sizeClassName[size],
              className
            )}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <Dialog.Title className="text-base font-semibold text-gray-950 sm:text-lg">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 text-sm leading-6 text-gray-600">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                aria-label="Đóng modal"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", contentClassName)}>{children}</div>
            {footer ? <div className="shrink-0 border-t border-gray-200 px-5 py-4">{footer}</div> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
