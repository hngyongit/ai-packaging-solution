'use client'

import { useEffect } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  variant?: 'success' | 'error' | 'warning'
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Đóng',
  cancelLabel = 'Hủy',
  onConfirm,
  variant = 'success',
}: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const colors = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  }[variant]

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
  }[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className={`rounded-t-lg border-b ${colors.bg} p-4`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icons}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        
        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          {cancelLabel && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${colors.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
