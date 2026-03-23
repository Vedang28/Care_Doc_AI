'use client'

import { useState } from 'react'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/portal/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Unable to send link. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 font-body">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl" role="img" aria-label="Leaf">🌿</span>
            <span className="text-2xl font-semibold text-care-dark tracking-tight">
              CareDoc <span className="text-care">AI</span>
            </span>
          </div>
          <p className="text-base font-medium text-care mt-1">Family Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-care-light p-8 space-y-6">
          {submitted ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl" role="img" aria-label="Email sent">📬</div>
              <p className="text-slate-deep font-medium leading-snug">
                A link has been sent to your email.
              </p>
              <p className="text-slate-mid text-sm leading-relaxed">
                Check your inbox and click the link to access care updates.
                It&apos;s valid for 30 minutes.
              </p>
              <button
                onClick={() => { setSubmitted(false); setEmail('') }}
                className="text-sm text-care underline underline-offset-2 hover:text-care-dark transition-colors"
              >
                Try a different address
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <p className="text-slate-deep text-base leading-relaxed">
                  Stay connected with your relative&apos;s care.
                </p>
                <p className="text-slate-mid text-sm leading-relaxed">
                  Enter your email to receive a secure link to view care updates.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="portal-email"
                    className="block text-sm font-medium text-slate-deep"
                  >
                    Email address
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-label="Email address"
                    className="w-full px-4 py-3 rounded-xl border border-border-soft bg-surface text-slate-deep placeholder:text-slate-mid/60 text-base focus:outline-none focus:ring-2 focus:ring-care focus:border-transparent transition-shadow"
                  />
                </div>

                {error && (
                  <p className="text-care-accent text-sm text-center" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  aria-label="Send secure login link"
                  className="w-full py-3 px-4 rounded-xl bg-care text-white font-medium text-base hover:bg-care-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-care focus:ring-offset-2"
                >
                  {loading ? 'Sending…' : 'Send secure link'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-mid leading-relaxed">
                We&apos;ll send a one-time link valid for 30 minutes.
                No password needed.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-mid">
          Powered by CareDoc AI &mdash; secure family updates
        </p>
      </div>
    </main>
  )
}
