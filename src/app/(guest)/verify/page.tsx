'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Envelope } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Xác minh email bằng OTP tự gửi qua Gmail (không dùng Supabase Confirm email).
// Luồng: /api/auth/verify/send → nhập 6 số → /api/auth/verify → /dashboard.
export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const autoSent = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user?.email) {
        router.replace('/login')
        return
      }
      setEmail(user.email)
      const status = await fetch('/api/auth/verify/status').then((r) => r.json())
      if (cancelled) return
      if (status.verified) {
        router.replace('/dashboard')
        return
      }
      if (!autoSent.current) {
        autoSent.current = true
        requestOtp(user.email, 'Mã xác minh đã gửi tới hộp thư của bạn.')
      }
    }
    function requestOtp(address: string, okMessage: string) {
      fetch('/api/auth/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address }),
      })
        .then(async (r) => {
          const body = await r.json()
          if (!r.ok) setError(body?.error ?? 'Không gửi được mã')
          else setNotice(okMessage)
        })
        .catch(() => setError('Không gửi được mã. Thử lại.'))
    }
    init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const body = await response.json().catch(() => null)
    setBusy(false)
    if (!response.ok) {
      setError(body?.error ?? 'Xác minh thất bại')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function resend() {
    setBusy(true)
    setError('')
    const response = await fetch('/api/auth/verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const body = await response.json().catch(() => null)
    setBusy(false)
    if (!response.ok) setError(body?.error ?? 'Không gửi được mã')
    else setNotice('Đã gửi lại mã xác minh.')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            AI Carton
          </Link>
          <CardTitle className="mt-4 text-xl">Xác minh email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitOtp} className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Envelope className="h-4 w-4" />
              Gửi tới <span className="font-medium text-foreground">{email}</span>
            </div>
            {notice && !error && <p className="text-center text-sm text-green-700">{notice}</p>}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? 'Đang xử lý...' : 'Xác minh'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={resend}>
              Gửi lại mã
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Về đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
