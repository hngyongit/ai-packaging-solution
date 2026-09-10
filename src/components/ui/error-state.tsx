import { WarningCircle } from '@phosphor-icons/react/dist/ssr'

import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  description?: string
  className?: string
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  description = 'Vui lòng tải lại trang hoặc thử lại sau.',
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('rounded-md border border-red-200 bg-red-50 p-4', className)}>
      <div className="flex items-start gap-3">
        <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <h2 className="text-sm font-medium text-red-800">{title}</h2>
          <p className="mt-1 text-sm text-red-600">{description}</p>
        </div>
      </div>
    </div>
  )
}
