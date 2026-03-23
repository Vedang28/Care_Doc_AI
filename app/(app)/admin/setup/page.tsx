'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, ArrowLeft, Building2, Palette, User } from 'lucide-react'

type Step = 1 | 2 | 3

interface FormData {
  // Step 1
  name: string
  code: string
  contactEmail: string
  timezone: string
  // Step 2
  brandColour: string
  // Step 3
  managerName: string
  managerEmail: string
  managerPassword: string
}

const TIMEZONES = ['Europe/London', 'Europe/Dublin', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles']

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    name: '',
    code: '',
    contactEmail: '',
    timezone: 'Europe/London',
    brandColour: '#2D6A4F',
    managerName: '',
    managerEmail: '',
    managerPassword: '',
  })

  function update(key: keyof FormData, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value }
      // Auto-suggest code from name
      if (key === 'name' && !f.code) next.code = slugify(value)
      return next
    })
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          subdomain: form.code,
          contactEmail: form.contactEmail,
          timezone: form.timezone,
          managerName: form.managerName,
          managerEmail: form.managerEmail,
          managerPassword: form.managerPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to create agency')
      }

      // Update brand colour for the new agency
      const { agencyId } = await res.json() as { agencyId: string }
      await fetch(`/api/admin/agencies/${agencyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandColour: form.brandColour }),
      })

      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const steps = [
    { num: 1, label: 'Agency Details', icon: Building2 },
    { num: 2, label: 'Branding',       icon: Palette },
    { num: 3, label: 'First Manager',  icon: User },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-care-dark">Create New Agency</h1>
        <p className="text-slate-mid text-sm mt-1">Set up a new care agency on CareDoc AI.</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s) => {
          const Icon = s.icon
          const active = step === s.num
          const done = step > s.num
          return (
            <div key={s.num} className={`flex-1 rounded-lg border p-3 transition-colors ${active ? 'border-care bg-care-pale' : done ? 'border-care-light bg-care-pale/50' : 'border-border-soft bg-white'}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active || done ? 'text-care' : 'text-slate-mid'}`} />
                <span className={`text-xs font-medium ${active || done ? 'text-care-dark' : 'text-slate-mid'}`}>{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Agency Name</Label>
            <Input placeholder="Sunrise Care Agency" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Agency Code <span className="text-slate-mid text-xs">(unique, lowercase)</span></Label>
            <Input placeholder="sunrise-care" value={form.code} onChange={(e) => update('code', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input type="email" placeholder="admin@sunrisecare.co.uk" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <select
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care"
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <Button
            className="w-full"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => setStep(2)}
            disabled={!form.name || !form.code || !form.contactEmail}
          >
            Next: Branding
          </Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Primary Colour</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColour}
                onChange={(e) => update('brandColour', e.target.value)}
                className="h-10 w-16 rounded-lg border border-border-soft cursor-pointer"
              />
              <Input value={form.brandColour} onChange={(e) => update('brandColour', e.target.value)} className="flex-1" />
            </div>
          </div>

          <div className="rounded-lg border border-border-soft p-4 text-sm text-slate-mid">
            <p className="font-medium text-slate-deep mb-1">Preview</p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: form.brandColour }} />
              <span>Agency accent colour</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" icon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep(3)}>
              Next: First Manager
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Manager Name</Label>
            <Input placeholder="Jane Smith" value={form.managerName} onChange={(e) => update('managerName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Manager Email</Label>
            <Input type="email" placeholder="jane@sunrisecare.co.uk" value={form.managerEmail} onChange={(e) => update('managerEmail', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Temporary Password <span className="text-slate-mid text-xs">(min 8 chars)</span></Label>
            <Input type="password" placeholder="••••••••" value={form.managerPassword} onChange={(e) => update('managerPassword', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={handleFinish}
              disabled={!form.managerName || !form.managerEmail || form.managerPassword.length < 8}
            >
              Create Agency
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
