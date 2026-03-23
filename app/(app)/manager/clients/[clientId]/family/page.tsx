'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  Plus,
  UserCheck,
  UserX,
  Bell,
  BellOff,
  Link as LinkIcon,
  X,
  Mail,
  Pencil,
  Smartphone,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyContact {
  id: string
  name: string
  email: string
  relationship: string
  consentGiven: boolean
  consentDate: string | null
  notifyOnVisit: boolean
  notifyOnFlag: boolean
  active: boolean
  createdAt: string
  _count: { pushSubscriptions: number }
}

interface ClientInfo {
  id: string
  name: string
  portalSlug: string | null
}

interface FamilyPageProps {
  params: { clientId: string }
}

interface FormState {
  name: string
  email: string
  relationship: string
  notifyOnVisit: boolean
  notifyOnFlag: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  relationship: '',
  notifyOnVisit: false,
  notifyOnFlag: true,
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  type: 'success' | 'info' | 'error'
  onDismiss: () => void
}

function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  const colours = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-care-pale border-care-light text-care-dark',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${colours[type]}`}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}

function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-care disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-care' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ─── Slide-over panel ─────────────────────────────────────────────────────────

interface SlideOverProps {
  open: boolean
  onClose: () => void
  clientId: string
  editTarget: FamilyContact | null
  onSaved: () => void
  onToast: (msg: string, type: 'success' | 'info' | 'error') => void
}

function FamilySlideOver({
  open,
  onClose,
  clientId,
  editTarget,
  onSaved,
  onToast,
}: SlideOverProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editTarget) {
      setForm({
        name: editTarget.name,
        email: editTarget.email,
        relationship: editTarget.relationship,
        notifyOnVisit: editTarget.notifyOnVisit,
        notifyOnFlag: editTarget.notifyOnFlag,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [editTarget, open])

  if (!open) return null

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)

    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.relationship.trim()) { setError('Relationship is required.'); return }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        relationship: form.relationship.trim(),
        notifyOnVisit: form.notifyOnVisit,
        notifyOnFlag: form.notifyOnFlag,
      }

      const url = editTarget
        ? `/api/manager/clients/${clientId}/family/${editTarget.id}`
        : `/api/manager/clients/${clientId}/family`
      const method = editTarget ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to save contact.')
        return
      }

      onToast(editTarget ? 'Contact updated.' : 'Contact added successfully.', 'success')
      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!editTarget

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-care-dark">
            {isEdit ? 'Edit Contact' : 'Add Family Contact'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface transition-colors">
            <X className="h-5 w-5 text-slate-mid" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Relationship <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.relationship}
              onChange={(e) => set('relationship', e.target.value)}
              placeholder="e.g. Son, Daughter, Next of Kin"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Notification preferences */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Notification Preferences
            </p>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface px-4 py-3 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-slate-mid shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-deep">Visit completed</p>
                  <p className="text-xs text-slate-mid">Notify when a care visit is finished</p>
                </div>
              </div>
              <Toggle
                checked={form.notifyOnVisit}
                onChange={(v) => set('notifyOnVisit', v)}
                label="Notify on visit completion"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface px-4 py-3 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-deep">Flagged concerns</p>
                  <p className="text-xs text-slate-mid">Notify when a care report is flagged</p>
                </div>
              </div>
              <Toggle
                checked={form.notifyOnFlag}
                onChange={(v) => set('notifyOnFlag', v)}
                label="Notify on flagged concerns"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button className="w-full" loading={saving} onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact card ──────────────────────────────────────────────────────────────

interface ContactCardProps {
  contact: FamilyContact
  clientId: string
  portalSlug: string | null
  onEdit: (c: FamilyContact) => void
  onPreferenceToggle: (contact: FamilyContact, field: 'notifyOnVisit' | 'notifyOnFlag', value: boolean) => void
  togglingId: string | null
  onDeactivate: (contact: FamilyContact) => void
  deactivatingId: string | null
  onResendInvite: (contact: FamilyContact) => void
  onCopyPortalLink: (contact: FamilyContact) => void
  onToast: (msg: string, type: 'success' | 'info' | 'error') => void
}

function ContactCard({
  contact,
  onEdit,
  onPreferenceToggle,
  togglingId,
  onDeactivate,
  deactivatingId,
  onResendInvite,
  onCopyPortalLink,
}: ContactCardProps) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const isToggling = togglingId === contact.id
  const isDeactivating = deactivatingId === contact.id

  return (
    <div
      className={`bg-white border border-border-soft rounded-xl p-5 space-y-4 transition-opacity ${
        !contact.active ? 'opacity-60' : ''
      }`}
    >
      {/* Top row: name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-care-pale flex items-center justify-center shrink-0">
            <span className="text-care font-semibold text-sm">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            {/* Name + relationship */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-deep text-sm leading-snug">
                {contact.name}
              </h3>
              <span className="text-slate-mid text-sm">—</span>
              <span className="text-sm text-slate-mid">{contact.relationship}</span>
              {!contact.active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Inactive
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="h-3 w-3 text-slate-mid shrink-0" />
              <span className="text-xs text-slate-mid truncate">{contact.email}</span>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(contact)}
          className="p-1.5 rounded-lg border border-border-soft hover:bg-surface transition-colors shrink-0"
          title="Edit contact"
        >
          <Pencil className="h-3.5 w-3.5 text-slate-mid" />
        </button>
      </div>

      {/* Consent status row */}
      <div className="flex flex-wrap items-center gap-2">
        {contact.consentGiven ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
            <UserCheck className="h-3.5 w-3.5" />
            Consent given
            {contact.consentDate && (
              <span className="text-emerald-600">
                ({new Date(contact.consentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
              </span>
            )}
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
              <UserX className="h-3.5 w-3.5" />
              Awaiting consent
            </span>
            <button
              onClick={() => onResendInvite(contact)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border-soft px-3 py-1 text-xs font-medium text-slate-deep hover:bg-surface transition-colors"
            >
              <Mail className="h-3 w-3" />
              Resend invite
            </button>
          </>
        )}

        {/* Push notifications badge */}
        {contact._count.pushSubscriptions > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-care-pale border border-care-light px-3 py-1 text-xs font-medium text-care-dark">
            <Smartphone className="h-3 w-3" />
            Push enabled
          </span>
        )}

        {/* Copy portal link */}
        {contact.consentGiven && (
          <button
            onClick={() => onCopyPortalLink(contact)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border-soft px-3 py-1 text-xs font-medium text-slate-deep hover:bg-surface transition-colors"
          >
            <LinkIcon className="h-3 w-3" />
            Copy portal link
          </button>
        )}
      </div>

      {/* Notification preference toggles */}
      <div className="flex flex-wrap gap-4 pt-1 border-t border-border-light">
        {/* Visit completed */}
        <div className="flex items-center gap-2">
          {contact.notifyOnVisit ? (
            <Bell className="h-3.5 w-3.5 text-care shrink-0" />
          ) : (
            <BellOff className="h-3.5 w-3.5 text-slate-mid shrink-0" />
          )}
          <span className="text-xs text-slate-deep">Visit completed</span>
          <Toggle
            checked={contact.notifyOnVisit}
            onChange={(v) => onPreferenceToggle(contact, 'notifyOnVisit', v)}
            disabled={isToggling}
            label="Notify on visit completion"
          />
        </div>

        {/* Flagged concerns */}
        <div className="flex items-center gap-2">
          {contact.notifyOnFlag ? (
            <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <BellOff className="h-3.5 w-3.5 text-slate-mid shrink-0" />
          )}
          <span className="text-xs text-slate-deep">Flagged concerns</span>
          <Toggle
            checked={contact.notifyOnFlag}
            onChange={(v) => onPreferenceToggle(contact, 'notifyOnFlag', v)}
            disabled={isToggling}
            label="Notify on flagged concerns"
          />
        </div>
      </div>

      {/* Deactivate / inline confirmation */}
      {contact.active && (
        <div className="pt-1">
          {confirmDeactivate ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-amber-800 font-medium">
                Deactivate this contact? They will no longer receive notifications.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDeactivate(false)}
                  className="px-2.5 py-1 rounded-md border border-amber-200 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmDeactivate(false)
                    onDeactivate(contact)
                  }}
                  disabled={isDeactivating}
                  className="px-2.5 py-1 rounded-md bg-amber-500 text-xs text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeactivate(true)}
              disabled={isDeactivating}
              className="text-xs text-slate-mid hover:text-red-600 underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              Deactivate contact
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FamilyContactsPage({ params }: FamilyPageProps) {
  const { clientId } = params

  const [contacts, setContacts] = useState<FamilyContact[]>([])
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [slideOpen, setSlideOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FamilyContact | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
    setToast({ message, type })
  }

  // Load contacts + client info in parallel
  const loadData = useCallback(() => {
    setLoading(true)
    setFetchError(false)

    Promise.all([
      fetch(`/api/manager/clients/${clientId}/family`)
        .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<{ contacts: FamilyContact[] }> }),
      fetch(`/api/manager/clients/${clientId}`)
        .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<ClientInfo> }),
    ])
      .then(([familyData, client]) => {
        setContacts(familyData.contacts)
        setClientInfo(client)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openAdd() {
    setEditTarget(null)
    setSlideOpen(true)
  }

  function openEdit(contact: FamilyContact) {
    setEditTarget(contact)
    setSlideOpen(true)
  }

  async function handlePreferenceToggle(
    contact: FamilyContact,
    field: 'notifyOnVisit' | 'notifyOnFlag',
    value: boolean,
  ) {
    setTogglingId(contact.id)
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, [field]: value } : c))
    )
    try {
      const res = await fetch(`/api/manager/clients/${clientId}/family/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        // Roll back on failure
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, [field]: !value } : c))
        )
        showToast('Failed to update preference.', 'error')
      }
    } catch {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, [field]: !value } : c))
      )
      showToast('Network error. Please try again.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDeactivate(contact: FamilyContact) {
    setDeactivatingId(contact.id)
    try {
      const res = await fetch(`/api/manager/clients/${clientId}/family/${contact.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, active: false } : c))
        )
        showToast('Contact deactivated.', 'info')
      } else {
        showToast('Failed to deactivate contact.', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
    } finally {
      setDeactivatingId(null)
    }
  }

  async function handleResendInvite(contact: FamilyContact) {
    try {
      await fetch(`/api/manager/clients/${clientId}/family/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      })
    } catch {
      // Best-effort
    }
    showToast('Consent invite sent.', 'success')
  }

  function handleCopyPortalLink(contact: FamilyContact) {
    if (!clientInfo?.portalSlug) {
      showToast("Portal link copied. The client's portal slug must be configured first.", 'info')
      return
    }
    const token = btoa(contact.id)
    const url = `${window.location.origin}/portal/${clientInfo.portalSlug}?token=${token}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('Portal link copied to clipboard.', 'success')
    }).catch(() => {
      showToast('Failed to copy link.', 'error')
    })
  }

  const activeCount = contacts.filter((c) => c.active).length
  const totalCount = contacts.length

  return (
    <>
      <div className="space-y-5">
        {/* Back link */}
        <Link href={`/manager/clients/${clientId}`}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft className="h-4 w-4" />}
            className="-ml-2"
          >
            Back to Client
          </Button>
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-care-dark">Family Contacts</h1>
            {!loading && !fetchError && (
              <p className="text-sm text-slate-mid mt-0.5">
                {activeCount} active contact{activeCount !== 1 ? 's' : ''}
                {totalCount > activeCount && ` · ${totalCount - activeCount} inactive`}
                {clientInfo && (
                  <span className="text-slate-mid"> for {clientInfo.name}</span>
                )}
              </p>
            )}
          </div>
          <Button
            onClick={openAdd}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Contact
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-sm text-red-700 font-medium">Failed to load family contacts.</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 underline underline-offset-2 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-xl bg-surface border border-border-light p-12 text-center">
            <UserCheck className="h-8 w-8 text-slate-mid mx-auto mb-3" />
            <p className="text-sm text-slate-mid font-medium">No family contacts added yet.</p>
            <p className="text-xs text-slate-mid mt-1 mb-4">
              Add a family contact to enable portal access and notifications.
            </p>
            <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />} size="sm">
              Add First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                clientId={clientId}
                portalSlug={clientInfo?.portalSlug ?? null}
                onEdit={openEdit}
                onPreferenceToggle={handlePreferenceToggle}
                togglingId={togglingId}
                onDeactivate={handleDeactivate}
                deactivatingId={deactivatingId}
                onResendInvite={handleResendInvite}
                onCopyPortalLink={handleCopyPortalLink}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over */}
      <FamilySlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        clientId={clientId}
        editTarget={editTarget}
        onSaved={loadData}
        onToast={showToast}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  )
}
