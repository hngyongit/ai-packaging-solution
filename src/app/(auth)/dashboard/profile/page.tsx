'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { User, Envelope, Phone, Building } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      setUser(u)

      if (u) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, company_name, default_address')
          .eq('id', u.id)
          .maybeSingle()

        reset({
          fullName: profile?.full_name || u.user_metadata?.full_name || '',
          phone: profile?.phone || u.user_metadata?.phone || '',
          company: profile?.company_name || '',
          address: profile?.default_address || '',
        })
      }
      setLoading(false)
    })
  }, [supabase, reset])

  if (loading) return <ProfileSkeleton />

  async function onSubmit(data: ProfileForm) {
    setSaved(false)
    const { error } = await supabase.from('profiles').upsert({
      id: user?.id,
      full_name: data.fullName,
      phone: data.phone || null,
      company_name: data.company || null,
      default_address: data.address || null,
    })
    if (!error) setSaved(true)
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Thông tin tài khoản
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {saved && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Đã lưu thay đổi
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Họ tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input id="fullName" className="pl-9" {...register('fullName')} />
          </div>
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              value={user?.email || ''}
              readOnly
              className="pl-9 bg-muted text-muted-foreground"
            />
          </div>
          <p className="text-xs text-emerald-600">✓ Đã xác thực</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input id="phone" className="pl-9" {...register('phone')} />
          </div>
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Tên công ty</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input id="company" className="pl-9" {...register('company')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Địa chỉ mặc định</Label>
          <textarea
            id="address"
            rows={2}
            className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            {...register('address')}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </form>

      <Separator />

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Khu vực nguy hiểm</CardTitle>
          <CardDescription>
            Các hành động không thể hoàn tác
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
            Đổi mật khẩu
          </Button>
          <Button variant="destructive">
            Xóa tài khoản
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-200" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
        ))}
        <div className="h-10 w-28 rounded-md bg-gray-200" />
      </div>
      <div className="h-px w-full bg-gray-200" />
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="h-4 w-56 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded-md bg-gray-200" />
          <div className="h-10 w-32 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  )
}