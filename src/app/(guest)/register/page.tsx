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

// Supabase gửi mail ĐỒNG BỘ trong /signup. SMTP treo (cấu hình sai / provider chặn
// IP datacenter) → request treo tới timeout edge → 504, và vì GoTrue rollback nên
// KHÔNG có row, KHÔNG có mail. Đây là thất bại thật, KHÔNG được diễn giải thành
// "đã gửi". 504 ở đây = "hệ thống mail lỗi, thử lại sau", không phải "check inbox".
function isMailLatencyError(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string } | null
  if (!err) return false
  if (err.status === 502 || err.status === 503 || err.status === 504) return true
  if (err.code === 'AuthRetryableFetchError') return true
  const message = (err.message ?? '').toLowerCase()
  return (
    message.includes('upstream request timeout') ||
    message.includes('gateway time') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  )
}

// "Email already registered" KHÔNG hàm ý đang chờ xác thực — có thể tài khoản đã
// confirmed sẵn. Đừng tự diễn giải thành "đã gửi mail"; chỉ đưa ra 2 đường và để
// auth.resend trả lời thật (nó không gửi gì nếu email đã confirmed).
function isDuplicateEmailError(error: unknown) {
  const message = ((error as { message?: string } | null)?.message ?? '').toLowerCase()
  return message.includes('already registered') || message.includes('already exists')
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [pending, setPending] = useState<{ email: string; sent: boolean } | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  function confirmUrl() {
    return `${publicOrigin()}/api/auth/callback?next=/dashboard`
  }

  async function onSubmit({ name, email, phone, password }: RegisterForm) {
    setServerError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: confirmUrl(),
      },
    })
    // 504 = hệ thống mail lỗi (SMTP treo), GoTrue đã rollback → chưa có tài khoản.
    // Báo thật, cho bấm lại; ĐỪNG đưa vào màn "check inbox" vì không mail nào đi.
    if (error && isMailLatencyError(error)) {
      setServerError(
        'Không thể gửi email xác thực lúc này (máy chủ mail phản hồi quá chậm). ' +
          'Vui lòng thử lại sau ít phút.',
      )
      return
    }
    if (error) {
      // Email đã có tài khoản (có thể đã confirmed) → không khẳng định đã gửi mail.
      // Cho khách quyền bấm "Gửi lại email"; resend là phép thử thật.
      if (isDuplicateEmailError(error)) {
        setPending({ email, sent: false })
        return
      }
      setServerError(error.message)
      return
    }
    // Row profiles do trigger handle_new_user sinh (profiles không có INSERT
    // policy). Bật "Confirm email" → chưa có session, dừng ở màn hướng dẫn.
    if (!data.session) {
      setPending({ email, sent: true })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function resendConfirmation() {
    if (!pending) return
    setResendState('sending')
    setServerError('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pending.email,
      options: { emailRedirectTo: confirmUrl() },
    })
    if (error && !isMailLatencyError(error)) {
      setResendState('idle')
      setServerError(error.message)
      return
    }
    setResendState('sent')
    setPending({ email: pending.email, sent: true })
  }

  if (pending) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <Envelope className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="text-xl">Xác thực email</CardTitle>
            <p className="text-sm text-muted-foreground">
              {pending.sent ? (
                <>
                  Chúng tôi đã gửi link xác thực tới{' '}
                  <span className="font-medium text-foreground">{pending.email}</span>. Mở link (kiểm tra cả thư rác) để
                  hoàn tất đăng ký.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{pending.email}</span> đã có tài khoản. Bấm "Gửi lại
                  email" nếu cần link xác thực, hoặc đăng nhập nếu đã kích hoạt.
                </>
              )}
            </p>
            {serverError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}
            <Button
              variant="outline"
              className="w-full"
              disabled={resendState === 'sending'}
              onClick={resendConfirmation}
            >
              {resendState === 'sending'
                ? 'Đang gửi lại...'
                : resendState === 'sent'
                  ? 'Đã gửi lại email xác thực'
                  : 'Chưa nhận được? Gửi lại email'}
            </Button>
            <Link
              href="/login"
              className={buttonVariants({ className: 'w-full' })}
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