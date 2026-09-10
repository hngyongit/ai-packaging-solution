import { Label } from '@/components/ui/Label'

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
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export function InlineError({ error }: { error?: string }) {
  return <p className="text-red-600">{error ?? ' '}</p>
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