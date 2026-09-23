'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Envelope, Lock, User, Phone, Eye, EyeSlash } from '@phosphor-icons/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập họ tên'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    agree: z.literal(true, { errorMap: () => ({ message: 'Vui lòng đồng ý với điều khoản' }) }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  })
type RegisterForm = z.infer<typeof registerSchema>

// Link confirm/reset của Supabase phải trỏ về domain deploy, không phải localhost
// mà Supabase mặc định lấy từ Site URL trong dashboard.
function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured && !configured.includes('localhost')) return configured.replace(/\/$/, '')
  return window.location.origin.replace(/\/$/, '')
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [emailSentTo, setEmailSentTo] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit({ name, email, phone, password }: RegisterForm) {
    setServerError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${publicOrigin()}/api/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    // Row profiles do user tự sinh từ trigger handle_new_user (đọc user_metadata
    // ở trên) — client không upsert được vì profiles không có INSERT policy.
    // Bật "Confirm email" → chưa có session, dừng ở màn hướng dẫn check mail.
    if (!data.session) {
      setEmailSentTo(email)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  if (emailSentTo) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <Envelope className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="text-xl">Vui lòng xác thực email</CardTitle>
            <p className="text-sm text-muted-foreground">
              Chúng tôi đã gửi link xác thực tới <span className="font-medium text-foreground">{emailSentTo}</span>.
              Mở link để hoàn tất đăng ký.
            </p>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Đã xác thực — Đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            AI Carton
          </Link>
          <CardTitle className="mt-4 text-xl">Đăng ký tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Họ tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="name" placeholder="Nguyễn Văn A" className="pl-9" {...register('name')} />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="phone" type="tel" placeholder="0901 234 567" className="pl-9" {...register('phone')} />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="pl-9 pr-9"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  className="pl-9 pr-9"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree"
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                {...register('agree')}
              />
              <Label htmlFor="agree" className="text-sm font-normal text-muted-foreground">
                Tôi đồng ý với{' '}
                <Link href="#" className="font-medium text-primary hover:underline">
                  điều khoản sử dụng
                </Link>
              </Label>
            </div>
            {errors.agree && <p className="text-xs text-destructive">{errors.agree.message}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}