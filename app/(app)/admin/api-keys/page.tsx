'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate } from '@/lib/utils'
import { Key, Plus, Copy, Check, X, AlertTriangle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(dateStr)
}

// ─── Scope config ─────────────────────────────────────────────────────────────

const SCOPES = [
  { id: 'reports:read',   label: 'reports:read',   description: 'Read reports and visit data' },
  { id: 'clients:read',   label: 'clients:read',   description: 'Read client information' },
  { id: 'clients:write',  label: 'clients:write',  description: 'Update client information' },
] as const

type ScopeId = (typeof SCOPES)[number]['id']

function scopeBadgeClass(scope: string): string {
  if (scope === 'reports:read') return 'bg-blue-50 border-blue-200 text-blue-700'
  if (scope === 'clients:read') return 'bg-green-50 border-green-200 text-green-700'
  if (scope === 'clients:write') return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-surface border-border-light text-slate-mid'
}

// ─── Create Key Modal ─────────────────────────────────────────────────────────

interface CreateKeyModalProps {
  onClose: () => void
  onCreated: (key: string) => void
}

function CreateKeyModal({ onClose, onCreated }: CreateKeyModalProps) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<ScopeId[]>(['reports:read'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleScope(scope: ScopeId) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Key name is required.')
      return
    }
    if (scopes.length === 0) {
      setError('Select at least one scope.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), scopes }),
      })

      const data = await res.json() as { key?: string; error?: string }

      if (!res.ok || !data.key) {
        setError(data.error ?? 'Failed to create key. Please try again.')
        return
      }

      onCreated(data.key)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-deep/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-care-pale">
              <Key className="h-5 w-5 text-care" />
            </div>
            <div>
              <p className="font-bold text-slate-deep text-lg leading-tight">Create API Key</p>
              <p className="text-slate-mid text-sm">Name your key and select its permissions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-mid hover:bg-surface hover:text-slate-deep transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
          {/* Key name */}
          <div className="space-y-1.5">
            <Label htmlFor="key-name">Key name</Label>
            <Input
              id="key-name"
              placeholder="e.g. Nourish Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>Scopes</Label>
            <div className="rounded-lg border border-border-soft overflow-hidden divide-y divide-border-light">
              {SCOPES.map((scope) => {
                const checked = scopes.includes(scope.id)
                return (
                  <label
                    key={scope.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleScope(scope.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-deep font-mono">{scope.label}</p>
                      <p className="text-xs text-slate-mid">{scope.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Create Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Key Reveal Modal ─────────────────────────────────────────────────────────

interface KeyRevealModalProps {
  apiKey: string
  onClose: () => void
}

function KeyRevealModal({ apiKey, onClose }: KeyRevealModalProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-deep/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-light">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="font-bold text-slate-deep text-lg">Copy your API key now</p>
          </div>
          <p className="text-slate-mid text-sm">
            This key will not be shown again. Store it securely before closing this dialog.
          </p>
        </div>

        {/* Key display */}
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-surface border border-border-soft p-4">
            <p className="font-mono text-sm text-slate-deep break-all select-all leading-relaxed">
              {apiKey}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
            <Button className="flex-1" onClick={onClose}>
              I&apos;ve saved this key — Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Key Row ──────────────────────────────────────────────────────────────────

interface KeyRowProps {
  apiKey: ApiKey
  onRevoked: () => void
}

function KeyRow({ apiKey, onRevoked }: KeyRowProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  async function handleRevoke() {
    setRevoking(true)
    setRevokeError(null)
    try {
      const res = await fetch(`/api/admin/api-keys/${apiKey.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Revoke failed')
      }
      onRevoked()
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : 'Something went wrong')
      setRevoking(false)
    }
  }

  return (
    <div className="px-4 py-4 hover:bg-surface/50 transition-colors">
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Status dot + icon */}
        <div className="flex-shrink-0 mt-1 flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              apiKey.active ? 'bg-green-500' : 'bg-slate-mid/40'
            }`}
            title={apiKey.active ? 'Active' : 'Inactive'}
          />
        </div>

        {/* Key info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-deep text-sm">{apiKey.name}</span>
            <span className="font-mono text-xs text-slate-mid bg-surface border border-border-light px-1.5 py-0.5 rounded">
              {apiKey.keyPrefix}…
            </span>
          </div>

          {/* Scopes */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {apiKey.scopes.map((scope) => (
              <span
                key={scope}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${scopeBadgeClass(scope)}`}
              >
                {scope}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-slate-mid">
            <span>
              Last used:{' '}
              <span className="text-slate-deep">
                {apiKey.lastUsedAt ? relativeTime(apiKey.lastUsedAt) : 'Never'}
              </span>
            </span>
            {apiKey.expiresAt && (
              <span>
                Expires: <span className="text-slate-deep">{formatDate(apiKey.expiresAt)}</span>
              </span>
            )}
            <span>
              Created: <span className="text-slate-deep">{formatDate(apiKey.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Revoke button */}
        {apiKey.active && !confirmRevoke && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={() => setConfirmRevoke(true)}
          >
            Revoke
          </Button>
        )}
      </div>

      {/* Inline revoke confirmation */}
      {confirmRevoke && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800 mb-3">
            Revoking this key will immediately block all integrations using it. Are you sure?
          </p>
          {revokeError && (
            <p className="text-xs text-red-700 mb-2">{revokeError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              loading={revoking}
              onClick={() => void handleRevoke()}
            >
              Revoke
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={revoking}
              onClick={() => { setConfirmRevoke(false); setRevokeError(null) }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [revealKey, setRevealKey] = useState<string | null>(null)

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      const data = await res.json() as { keys: ApiKey[] }
      setKeys(data.keys ?? [])
    } catch {
      // Non-fatal — show empty state
      setKeys([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  function handleKeyCreated(newKey: string) {
    setShowCreateModal(false)
    setRevealKey(newKey)
    void loadKeys()
  }

  function handleRevealClosed() {
    setRevealKey(null)
  }

  function handleRevoked() {
    void loadKeys()
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-care-dark">API Keys</h1>
            <p className="text-slate-mid text-sm mt-1">
              Create API keys for enterprise integrations.
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            className="shrink-0"
          >
            Create API Key
          </Button>
        </div>

        {/* ── Key list ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
          {/* List header */}
          <div className="px-4 py-3 border-b border-border-light bg-surface flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-mid" />
            <p className="font-semibold text-slate-deep text-sm">
              API Keys
              {!loading && keys.length > 0 && (
                <span className="ml-1.5 text-slate-mid font-normal">({keys.length})</span>
              )}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && keys.length === 0 && (
            <div className="py-16 text-center px-6">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-care-pale flex items-center justify-center">
                <Key className="h-6 w-6 text-care" />
              </div>
              <p className="font-medium text-slate-deep text-sm">No API keys yet</p>
              <p className="text-slate-mid text-xs mt-1 mb-4">
                Create your first key to start integrating with external services.
              </p>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create API Key
              </Button>
            </div>
          )}

          {/* Key rows */}
          {!loading && keys.length > 0 && (
            <div className="divide-y divide-border-light">
              {keys.map((apiKey) => (
                <KeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoked={handleRevoked}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Info callout ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            API keys are shown only once at creation. Store them securely — revoking a key immediately
            blocks all integrations using it.
          </p>
        </div>
      </div>

      {/* ── Create Key Modal ─────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleKeyCreated}
        />
      )}

      {/* ── Key Reveal Modal ─────────────────────────────────────────────────── */}
      {revealKey && (
        <KeyRevealModal
          apiKey={revealKey}
          onClose={handleRevealClosed}
        />
      )}
    </>
  )
}
