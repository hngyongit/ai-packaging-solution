'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { BuildingOffice, CheckCircle, Envelope, MapPin, Phone, ShieldCheck, User } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

function getInitials(name: string, email?: string) {
  const source = name.trim() || email?.split('@')[0] || 'T'
  const words = source.split(/\s+/).filter(Boolean)
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user
      setUser(currentUser)

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, company_name, default_address')
          .eq('id', currentUser.id)
          .maybeSingle()

        reset({
          fullName: profile?.full_name || currentUser.user_metadata?.full_name || '',
          phone: profile?.phone || currentUser.user_metadata?.phone || '',
          company: profile?.company_name || '',
          address: profile?.default_address || '',
        })
      }
      setLoading(false)
    })
  }, [supabase, reset])

  if (loading) return <ProfileSkeleton />

  const displayName = watch('fullName') || 'Khách hàng Thịnh Lợi'
  const initials = getInitials(displayName, user?.email)

  async function onSubmit(data: ProfileForm) {
    setSaved(false)
    setSaveError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user?.id,
      full_name: data.fullName,
      phone: data.phone || null,
      company_name: data.company || null,
      default_address: data.address || null,
    })

    if (error) {
      setSaveError('Không thể lưu thay đổi. Vui lòng thử lại.')
      return
    }
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Thông tin tài khoản</h1>
        <p className="mt-1.5 text-sm text-slate-500">Quản lý thông tin cá nhân và địa chỉ dùng cho đơn hàng.</p>
      </div>

      <Card className="gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
        <div className="h-24 bg-[linear-gradient(120deg,#eff6ff_0%,#dbeafe_55%,#eef2ff_100%)] sm:h-28" />
        <CardContent className="relative px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="-mt-10 grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white bg-blue-600 text-2xl font-bold text-white shadow-md sm:-mt-12 sm:h-28 sm:w-28 sm:text-3xl">
                {initials}
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="truncate text-xl font-semibold text-slate-950">{displayName}</h2>
                <p className="truncate text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4" weight="fill" />
              Tài khoản đã xác thực
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-500">
            Avatar được tạo tự động từ tên của bạn và sẽ cập nhật khi thay đổi họ tên.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Thông tin này giúp chúng tôi liên hệ và xử lý đơn hàng chính xác.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {saved && (
              <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle className="h-5 w-5 shrink-0" weight="fill" />
                Đã lưu thay đổi thành công.
              </div>
            )}
            {saveError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>}

            <div className="grid gap-5 md:grid-cols-2">
              <ProfileField label="Họ và tên" htmlFor="fullName" icon={<User />} error={errors.fullName?.message}>
                <Input id="fullName" className="h-11 pl-10" autoComplete="name" {...register('fullName')} />
              </ProfileField>
              <ProfileField label="Số điện thoại" htmlFor="phone" icon={<Phone />} error={errors.phone?.message}>
                <Input id="phone" className="h-11 pl-10" autoComplete="tel" placeholder="0968 373 066" {...register('phone')} />
              </ProfileField>
              <ProfileField label="Email" htmlFor="email" icon={<Envelope />} hint="Email đăng nhập không thể chỉnh sửa tại đây.">
                <Input id="email" value={user?.email || ''} readOnly className="h-11 bg-slate-50 pl-10 text-slate-500" />
              </ProfileField>
              <ProfileField label="Tên công ty" htmlFor="company" icon={<BuildingOffice />}>
                <Input id="company" className="h-11 pl-10" autoComplete="organization" placeholder="Tên doanh nghiệp" {...register('company')} />
              </ProfileField>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ giao hàng mặc định</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <textarea
                  id="address"
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className="flex w-full resize-y rounded-lg border border-input bg-transparent py-2.5 pl-10 pr-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register('address')}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" className="min-w-36" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" weight="duotone" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Bảo mật tài khoản</h2>
              <p className="mt-1 text-sm text-slate-500">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn.</p>
            </div>
          </div>
          <Link href="/forgot-password" className={buttonVariants({ variant: 'outline' })}>Đổi mật khẩu</Link>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({ label, htmlFor, icon, hint, error, children }: {
  label: string
  htmlFor: string
  icon: React.ReactNode
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {children}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-60 rounded bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-100" />
      </div>
      <div className="h-56 rounded-xl border border-slate-200 bg-white" />
      <div className="h-[440px] rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}
