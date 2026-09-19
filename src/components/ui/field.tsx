import { Label } from '@/components/ui/label'

// Field dùng chung cho form — bản gốc nằm trong các file form route; dời ra ui/
// để components/ và app/ cùng import mà không phải import chéo route group.
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
