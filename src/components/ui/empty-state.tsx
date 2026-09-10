import Link from 'next/link'
import { Package } from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  className?: string
}

export function EmptyState({ icon, title, description, actionHref, actionLabel, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-14 text-center',
        className
      )}
    >
      {icon ?? <Package className="h-10 w-10 text-gray-300" />}
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants({ size: 'lg' }), 'mt-5')}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
