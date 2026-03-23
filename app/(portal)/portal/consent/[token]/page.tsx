'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type PageState = 'idle' | 'submitting' | 'success' | 'error' | 'invalid'

// Attempt to extract a display name from the base64 token
// The token is base64(contactId) — we can't decode a name from it,
// so we show a generic friendly message. The server will confirm details.

export default function ConsentPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [state, setState] = useState<PageState>('idle')
  const [clientId, setClientId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Validate token format on mount (basic sanity check)
  useEffect(() => {
    if (!token) {
      setState('invalid')
      return
    }
    try {
      const decoded = atob(token)
      if (!decoded || decoded.length < 5) setState('invalid')
    } catch {
      setState('invalid')
    }
  }, [token])

  async function handleConsent() {
    setState('submitting')
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/portal/consent/${encodeURIComponent(token)}`, {
        method: 'POST',
      })

      if (res.status === 400) {
        setState('invalid')
        return
      }
      if (res.status === 404) {
        setErrorMessage('This invitation link was not found or has already been used. Please contact the care agency.')
        setState('error')
        return
      }
      if (!res.ok) {
        setErrorMessage('Something went wrong. Please try again or contact the care agency.')
        setState('error')
        return
      }

      const data = await res.json() as { success: boolean; clientId?: string }
      setClientId(data.clientId ?? null)
      setState('success')
    } catch {
      setErrorMessage('Unable to record consent. Please check your connection and try again.')
      setState('error')
    }
  }

  // ── Render: invalid token ─────────────────────────────────────────────────
  if (state === 'invalid') {
    return (
      <ConsentShell>
        <div className="text-center space-y-3 py-2">
          <div className="text-4xl" role="img" aria-label="Warning">⚠️</div>
          <h1 className="text-lg font-semibold text-slate-deep">Invalid invitation link</h1>
          <p className="text-sm text-slate-mid leading-relaxed">
            This link appears to be invalid or has expired. Please contact the care
            agency for a new invitation.
          </p>
        </div>
      </ConsentShell>
    )
  }

  // ── Render: success ───────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <ConsentShell>
        <div className="text-center space-y-4 py-2">
          <div className="text-4xl" role="img" aria-label="Success">✅</div>
          <h1 className="text-lg font-semibold text-care-dark">Thank you</h1>
          <p className="text-base text-slate-deep leading-relaxed">
            Your consent has been recorded. You can now receive care updates for your
            relative.
          </p>
          <p className="text-sm text-slate-mid leading-relaxed">
            You&apos;ll receive a secure link by email whenever a new care update is
            available.
          </p>
          {clientId && (
            <p className="text-xs text-slate-mid pt-2">
              Reference: {clientId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>
      </ConsentShell>
    )
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <ConsentShell>
        <div className="text-center space-y-3 py-2">
          <div className="text-4xl" role="img" aria-label="Error">😔</div>
          <h1 className="text-lg font-semibold text-slate-deep">Something went wrong</h1>
          {errorMessage && (
            <p className="text-sm text-slate-mid leading-relaxed">{errorMessage}</p>
          )}
          <button
            onClick={() => { setState('idle'); setErrorMessage(null) }}
            className="mt-2 text-sm text-care underline underline-offset-2 hover:text-care-dark transition-colors"
          >
            Try again
          </button>
        </div>
      </ConsentShell>
    )
  }

  // ── Render: main consent form ─────────────────────────────────────────────
  return (
    <ConsentShell>
      <div className="space-y-6">
        {/* Invitation header */}
        <div className="text-center space-y-1">
          <div className="text-3xl mb-3" role="img" aria-label="Care">🌿</div>
          <h1 className="text-lg font-semibold text-care-dark leading-snug">
            You&apos;ve been invited to receive care updates
          </h1>
          <p className="text-sm text-slate-mid leading-relaxed">
            A care agency using CareDoc AI has invited you to view care updates for
            your relative via the Family Portal.
          </p>
        </div>

        {/* Consent items */}
        <div className="bg-care-pale rounded-xl border border-care-light p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-deep">By clicking I Consent, you agree to:</p>
          <ul className="space-y-2" role="list">
            {[
              'Receive visit summary emails when care takes place',
              'View care updates via the Family Portal',
              'Your data being retained for 12 months in line with our privacy policy',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-deep">
                <span
                  className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-care-light border border-care flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-care text-[10px] font-bold">✓</span>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-slate-mid text-center leading-relaxed">
          Your information is held securely and only shared with the care agency providing
          services to your relative. You may withdraw consent at any time by contacting the agency.
        </p>

        {/* CTA */}
        <button
          onClick={handleConsent}
          disabled={state === 'submitting'}
          aria-label="Give consent to receive care updates"
          className="w-full py-3.5 px-4 rounded-xl bg-care text-white font-semibold text-base hover:bg-care-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-care focus:ring-offset-2"
        >
          {state === 'submitting' ? 'Recording consent…' : 'I Consent'}
        </button>

        <p className="text-center text-xs text-slate-mid">
          Don&apos;t recognise this invitation?{' '}
          <span className="text-slate-deep font-medium">Please ignore this page</span> and
          contact the care agency directly.
        </p>
      </div>
    </ConsentShell>
  )
}

// ── Layout wrapper ────────────────────────────────────────────────────────────

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 font-body">
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark */}
        <div className="text-center">
          <span className="text-xl font-semibold text-care-dark tracking-tight">
            <span className="text-care">CareDoc</span> AI
          </span>
          <p className="text-sm text-care mt-0.5">Family Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-care-light p-7">
          {children}
        </div>

        <p className="text-center text-xs text-slate-mid">
          Secure family updates &mdash; powered by CareDoc AI
        </p>
      </div>
    </main>
  )
}
