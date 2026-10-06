'use client'

import Link from 'next/link'

import { LoginForm } from '@/components/auth/login-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function LoginPage() {
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
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
