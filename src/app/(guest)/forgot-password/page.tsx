'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Envelope } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setBusy(false)
    if (resetError) {
      setError('Không thể gửi email khôi phục. Vui lòng thử lại sau.')
      return
    }

    setNotice('Nếu email tồn tại, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu.')
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <Link
        href="/"
        className="absolute left-6 top-6 text-xl font-bold tracking-tight text-gray-900 transition-colors hover:text-primary"
      >
        AI Carton
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Quên mật khẩu?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nhập email để nhận liên kết đặt lại mật khẩu.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {notice && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {notice}
              </div>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Envelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
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
