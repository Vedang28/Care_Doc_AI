'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeartPulse, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError('Incorrect email or password.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell>
      <div className="bg-white rounded-2xl shadow-sm border border-border-light p-8 space-y-6">
        {/* Wordmark */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HeartPulse className="h-6 w-6 text-care" />
            <span className="font-display text-2xl font-bold text-care-dark">
              CareDoc<span className="text-care">AI</span>
            </span>
          </div>
          <p className="text-slate-mid text-sm">Care documentation, done right.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-care-accent text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-mid hover:text-slate-deep"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-care-accent text-xs">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-care-accent text-sm text-center">{serverError}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-mid">
          Contact your manager to reset your password.
        </p>
      </div>
    </AuthShell>
  )
}
