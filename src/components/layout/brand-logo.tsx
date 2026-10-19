import Image from 'next/image'
import Link from 'next/link'

export function BrandLogo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-gray-900 transition-colors hover:text-blue-700"
      aria-label="ThinhLoi Packaging"
    >
      <Image
        src="/logo.png"
        alt=""
        width={compact ? 30 : 36}
        height={compact ? 30 : 36}
        className="rounded-sm object-cover"
        priority
      />
      <span className={compact ? 'text-base font-semibold tracking-tight' : 'text-xl font-bold tracking-tight'}>
        ThinhLoi Packaging
      </span>
    </Link>
  )
}
