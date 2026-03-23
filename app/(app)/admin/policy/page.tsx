'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, ArrowLeft, Plus, Trash2, CheckCircle, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyExtract {
  preferredTerminology?: {
    clientTerm?: string
    medicationTerm?: string
    carePlanTerm?: string
  }
  keyPolicies?: string[]
  safeguardingProcedures?: string[]
  customInstructions?: string
}

interface PromptVersion {
  id: string
  version: string
  active: boolean
  createdAt: string
}

type PageState = 'idle' | 'uploading' | 'review' | 'activating'

// ─── Component ────────────────────────────────────────────────────────────────

export default function PolicyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Page state machine
  const [pageState, setPageState] = useState<PageState>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activateError, setActivateError] = useState<string | null>(null)

  // Pending upload metadata (needed when activating)
  const [pendingFilename, setPendingFilename] = useState<string>('')

  // Editable review state
  const [clientTerm, setClientTerm] = useState('')
  const [medicationTerm, setMedicationTerm] = useState('')
  const [carePlanTerm, setCarePlanTerm] = useState('')
  const [keyPolicies, setKeyPolicies] = useState<string[]>([])
  const [customInstructions, setCustomInstructions] = useState('')

  // Version history
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  // ── Load version history ─────────────────────────────────────────────────

  async function loadVersions() {
    setVersionsLoading(true)
    try {
      const res = await fetch('/api/admin/policy/versions')
      if (!res.ok) throw new Error('Failed to load versions')
      const data = await res.json() as { versions: PromptVersion[] }
      setVersions(data.versions)
    } catch {
      // Non-fatal — show empty state
      setVersions([])
    } finally {
      setVersionsLoading(false)
    }
  }

  useEffect(() => {
    void loadVersions()
  }, [])

  // ── File handling ────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    // Reset input so the same file can be re-selected after an error
    e.target.value = ''
  }

  async function processFile(file: File) {
    setUploadError(null)
    setPageState('uploading')

    try {
      // Step 1 — Upload
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/admin/policy/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json() as { error?: string }
        throw new Error(err.error ?? 'Upload failed')
      }

      const uploadData = await uploadRes.json() as {
        buffer: string
        type: string
        filename: string
      }

      // Step 2 — Extract terminology with Claude
      const extractRes = await fetch('/api/admin/policy/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buffer: uploadData.buffer,
          type: uploadData.type,
          filename: uploadData.filename,
        }),
      })

      if (!extractRes.ok) {
        const err = await extractRes.json() as { error?: string }
        throw new Error(err.error ?? 'Extraction failed')
      }

      const extractData = await extractRes.json() as { extract: PolicyExtract }
      const ex = extractData.extract

      // Populate editable review fields
      setPendingFilename(uploadData.filename)
      setClientTerm(ex.preferredTerminology?.clientTerm ?? '')
      setMedicationTerm(ex.preferredTerminology?.medicationTerm ?? '')
      setCarePlanTerm(ex.preferredTerminology?.carePlanTerm ?? '')
      setKeyPolicies(ex.keyPolicies?.slice(0, 10) ?? [])
      setCustomInstructions(ex.customInstructions ?? '')

      setPageState('review')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong')
      setPageState('idle')
    }
  }

  // ── Activate ─────────────────────────────────────────────────────────────

  async function handleActivate() {
    setActivateError(null)
    setPageState('activating')

    const extract: PolicyExtract = {
      preferredTerminology: {
        clientTerm: clientTerm || undefined,
        medicationTerm: medicationTerm || undefined,
        carePlanTerm: carePlanTerm || undefined,
      },
      keyPolicies: keyPolicies.filter(Boolean),
      customInstructions: customInstructions || undefined,
    }

    try {
      const res = await fetch('/api/admin/policy/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extract, filename: pendingFilename }),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Activation failed')
      }

      await loadVersions()
      setPageState('idle')
    } catch (err) {
      setActivateError(err instanceof Error ? err.message : 'Something went wrong')
      setPageState('review')
    }
  }

  // ── Restore version ───────────────────────────────────────────────────────

  async function handleRestore(versionId: string) {
    setRestoringId(versionId)
    try {
      const res = await fetch('/api/admin/policy/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })
      if (!res.ok) throw new Error('Restore failed')
      await loadVersions()
    } catch {
      // Could show a toast — for now silently re-load
    } finally {
      setRestoringId(null)
    }
  }

  // ── Key policies helpers ──────────────────────────────────────────────────

  function updatePolicy(index: number, value: string) {
    setKeyPolicies((prev) => prev.map((p, i) => (i === index ? value : p)))
  }

  function removePolicy(index: number) {
    setKeyPolicies((prev) => prev.filter((_, i) => i !== index))
  }

  function addPolicy() {
    if (keyPolicies.length < 10) setKeyPolicies((prev) => [...prev, ''])
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-care-dark">Policy Customisation</h1>
        <p className="text-slate-mid text-sm mt-1">
          Upload your care policy document. CareDoc AI will extract your agency&apos;s preferred terminology and key
          policies, which you can review and edit before activating.
        </p>
      </div>

      {/* ── UPLOADING ────────────────────────────────────────────────────────── */}
      {pageState === 'uploading' && (
        <div className="rounded-xl border border-border-soft bg-white p-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-care">
            <Upload className="h-6 w-6 animate-bounce" />
            <span className="font-medium text-slate-deep">Uploading and analysing policy…</span>
          </div>
          <p className="text-sm text-slate-mid">
            Claude is reading your document to extract key terminology and policies.
          </p>
          <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
            <div className="h-full bg-care rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* ── ACTIVATING ───────────────────────────────────────────────────────── */}
      {pageState === 'activating' && (
        <div className="rounded-xl border border-border-soft bg-white p-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-care">
            <CheckCircle className="h-6 w-6 animate-pulse" />
            <span className="font-medium text-slate-deep">Activating policy…</span>
          </div>
          <p className="text-sm text-slate-mid">Saving your policy settings and creating a new version.</p>
        </div>
      )}

      {/* ── IDLE — Upload zone ────────────────────────────────────────────────── */}
      {pageState === 'idle' && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-care bg-care-pale' : 'border-border-soft hover:border-care'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-slate-mid mx-auto mb-3" />
            <p className="font-medium text-slate-deep">Drop your policy document here</p>
            <p className="text-sm text-slate-mid mt-1">PDF, DOCX, or TXT · Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {uploadError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}
        </>
      )}

      {/* ── REVIEW ───────────────────────────────────────────────────────────── */}
      {(pageState === 'review' || pageState === 'activating') && pageState !== 'activating' && (
        <div className="space-y-6">
          {/* Preferred terminology */}
          <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light">
              <p className="font-semibold text-slate-deep text-sm uppercase tracking-wide">
                Preferred Terminology
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Client Term</Label>
                <Input
                  placeholder="e.g. service user"
                  value={clientTerm}
                  onChange={(e) => setClientTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Medication Term</Label>
                <Input
                  placeholder="e.g. medication"
                  value={medicationTerm}
                  onChange={(e) => setMedicationTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Care Plan Term</Label>
                <Input
                  placeholder="e.g. support plan"
                  value={carePlanTerm}
                  onChange={(e) => setCarePlanTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Key policies */}
          <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
              <p className="font-semibold text-slate-deep text-sm uppercase tracking-wide">
                Key Policies <span className="text-slate-mid font-normal normal-case">(up to 10)</span>
              </p>
              {keyPolicies.length < 10 && (
                <Button variant="ghost" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={addPolicy}>
                  Add
                </Button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {keyPolicies.length === 0 && (
                <p className="text-sm text-slate-mid">No key policies extracted. Add one above.</p>
              )}
              {keyPolicies.map((policy, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-slate-mid text-sm mt-2.5 w-5 shrink-0">•</span>
                  <Textarea
                    rows={2}
                    value={policy}
                    onChange={(e) => updatePolicy(i, e.target.value)}
                    placeholder="Policy point…"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removePolicy(i)}
                    className="mt-2 p-1.5 rounded-lg text-slate-mid hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remove policy"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom instructions */}
          <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light">
              <p className="font-semibold text-slate-deep text-sm uppercase tracking-wide">
                Custom Instructions
              </p>
            </div>
            <div className="p-4">
              <Textarea
                rows={4}
                placeholder="Additional instructions for AI report generation…"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-slate-mid mt-1 text-right">{customInstructions.length}/500</p>
            </div>
          </div>

          {/* Activate error */}
          {activateError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {activateError}
            </div>
          )}

          {/* Note */}
          <p className="text-xs text-slate-mid">
            Activating this policy will apply it to all future visit reports.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => {
                setPageState('idle')
                setActivateError(null)
              }}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={() => void handleActivate()}>
              Activate Policy
            </Button>
          </div>
        </div>
      )}

      {/* ── VERSION HISTORY (idle only) ──────────────────────────────────────── */}
      {pageState === 'idle' && (
        <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light">
            <p className="font-semibold text-slate-deep text-sm">Version History</p>
          </div>

          {versionsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-mid text-sm">
                No policy versions yet. Upload your first policy document above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-surface">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-mid">Version</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-mid">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-mid">Activated Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-mid">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {versions.map((v) => (
                    <tr key={v.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-deep">v{v.version}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.active ? 'success' : 'default'}>
                          {v.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-mid">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {!v.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="h-3.5 w-3.5" />}
                            loading={restoringId === v.id}
                            onClick={() => void handleRestore(v.id)}
                          >
                            Restore
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
