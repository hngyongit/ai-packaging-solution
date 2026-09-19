'use client'

import { useRef, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { motion, useMotionValue } from 'motion/react'

import { Label } from '@/components/ui/label'
import { type BoxStyleRecord } from '@/lib/data/boxes'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 pb-8">
      <h2 className="text-sm font-semibold tracking-wide text-gray-900 uppercase">{title}</h2>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  )
}

export function Field({
  label,
  required = false,
  error,
  helper,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : helper ? <p className="text-xs text-gray-500">{helper}</p> : null}
    </div>
  )
}

export function InlineError({ error }: { error?: string }) {
  return <p className="text-red-600">{error ?? ' '}</p>
}

// Picker kiểu dáng thùng: pill text-only. Hover vào kiểu nào thì hiện ảnh preview
// của kiểu đó trong popup nhỏ bám theo con trỏ. Chọn xong → form truyền ảnh lên
// panel "Kết quả AI". Không chọn → AI tự quyết định (mặc định RSC/A1).
const TOOLTIP_W = 200
const TOOLTIP_H = 150

export function BoxStylePicker({
  value,
  onChange,
  styles,
}: {
  value?: string
  onChange?: (next: string | undefined) => void
  styles: BoxStyleRecord[]
}) {
  const [hoverStyle, setHoverStyle] = useState<BoxStyleRecord | null>(null)
  const tipX = useMotionValue(0)
  const tipY = useMotionValue(0)

  function handleEnter(style: BoxStyleRecord, event: React.MouseEvent<HTMLLabelElement>) {
    setHoverStyle(style)
    tipX.set(event.clientX + 16)
    tipY.set(event.clientY + 8)
  }

  function handleMove(event: React.MouseEvent<HTMLLabelElement>) {
    if (!hoverStyle) return
    // Ghim tooltip trong viewport để không tràn khỏi màn hình.
    tipX.set(Math.min(event.clientX + 16, window.innerWidth - TOOLTIP_W - 8))
    tipY.set(Math.min(event.clientY + 8, window.innerHeight - TOOLTIP_H - 8))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <label
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            value === undefined
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="box-style"
            className="sr-only"
            checked={value === undefined}
            onChange={() => onChange?.(undefined)}
          />
          <Sparkle className="h-3.5 w-3.5" />
          Để AI tự chọn kiểu
        </label>

        {styles.map((style) => {
          const checked = value === style.id
          return (
            <label
              key={style.id}
              onMouseEnter={(event) => handleEnter(style, event)}
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverStyle(null)}
              className={`flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                checked
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="box-style"
                className="sr-only"
                checked={checked}
                onChange={() => onChange?.(style.id)}
              />
              {style.label}
            </label>
          )
        })}
      </div>

      {hoverStyle && (
        <motion.div
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none fixed z-50 w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
          style={{ left: tipX, top: tipY }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={hoverStyle.previewUrl} alt={hoverStyle.label} className="h-[140px] w-full object-cover" />
        </motion.div>
      )}
    </div>
  )
}

type RadioOption<T extends string> = { value: T; label: string }

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value?: T | boolean
  onChange?: (next: T) => void
  options: RadioOption<T>[]
}) {
  const current = typeof value === 'boolean' ? String(value) : value
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = current === option.value
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <input type="radio" value={option.value} className="sr-only" checked={checked} onChange={() => onChange?.(option.value)} />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}