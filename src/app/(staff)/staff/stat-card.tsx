'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { 
  WarningCircle as AlertIcon, 
  ChatCircleText as ChatIcon, 
  Package as PackageIcon, 
  TrendUp as TrendIcon 
} from '@phosphor-icons/react'

type StatCardProps = {
  title: string
  value: string | number
  href: string
  icon: 'chat' | 'package' | 'trend' | 'warning'
  color: 'amber' | 'blue' | 'emerald' | 'red'
}

// Icon mapping - only imported in Client Component
const ICON_MAP = {
  chat: ChatIcon,
  package: PackageIcon,
  trend: TrendIcon,
  warning: AlertIcon,
} as const

export function StatCard({ 
  title, 
  value, 
  href, 
  icon: iconName, 
  color 
}: StatCardProps) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  }
  
  const Icon = ICON_MAP[iconName]

  return (
    <Link href={href} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={cn('rounded-lg p-3', colorMap[color])}>
            <Icon className="h-6 w-6" weight="duotone" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-950">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
