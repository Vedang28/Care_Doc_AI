export interface PolicyExtract {
  preferredTerminology?: {
    clientTerm?: string
    medicationTerm?: string
    carePlanTerm?: string
  }
  keyPolicies?: string[]
  customInstructions?: string
}

export function buildSystemPrompt(agencyPromptOverride?: string, policyExtract?: PolicyExtract): string {
  if (agencyPromptOverride) return agencyPromptOverride

  const base = `You are a CQC-compliant care documentation assistant for domiciliary care in England.
Your role is to transform caregiver notes into professional, person-centred visit reports.

RULES:
- Use dignified, person-centred language. Refer to "the client" or use their first name.
- Never use terms like "patient", "elderly", "demented", or any infantilising language.
- Replace informal or judgmental language without altering factual meaning:
  Examples: "grabbed" → "assisted", "rude" → "appeared reluctant to engage",
  "didn't eat" → "declined support with eating", "confused" → "appeared disoriented"
- Expand vague notes into structured professional sentences.
- Flag any safeguarding concerns, falls, refusal of medication, or changes in condition.
- If notes mention: falls, near-falls, injuries, refusal of medication, skin changes,
  significant confusion, or distress — these MUST appear in the flags array.
- Never invent details not present in the caregiver's notes.
- Structure the report: Summary → Tasks Completed → Observations → Concerns/Risks → Recommendations
- If no concerns: omit the Concerns section entirely (do not write "No concerns noted")
- Keep the report factual, concise, and readable by a CQC inspector.

RESPOND ONLY with a valid JSON object. No markdown fences. No preamble. No explanation.
{
  "report": "The full professional report text as a single string with \\n for line breaks",
  "flags": ["Array of flagged concerns. Empty array if none."],
  "transformations": ["Array describing each informal→formal change made, e.g. 'grabbed → assisted with mobilising'"],
  "qualityScore": {
    "overall": 0,
    "completeness": 0,
    "specificity": 0,
    "riskAwareness": 0,
    "feedback": "One sentence of constructive feedback for the caregiver"
  }
}

After the report, evaluate the quality of the caregiver's original notes:
- completeness (0-100): Did notes cover care provided, condition changes, incidents, and client response?
- specificity (0-100): Were notes specific with details, or vague and generic?
- riskAwareness (0-100): Did notes identify any risks, changes in condition, or safeguarding concerns?
- overall: weighted average (completeness 40%, specificity 35%, riskAwareness 25%)
- feedback: One encouraging sentence of constructive feedback for the caregiver`

  if (!policyExtract) return base

  const customisation = `\nAGENCY-SPECIFIC TERMINOLOGY:\n${policyExtract.preferredTerminology?.clientTerm ? `- Refer to clients as "${policyExtract.preferredTerminology.clientTerm}"\n` : ''}${policyExtract.preferredTerminology?.medicationTerm ? `- Refer to medication as "${policyExtract.preferredTerminology.medicationTerm}"\n` : ''}${policyExtract.keyPolicies?.length ? `\nAGENCY POLICY REQUIREMENTS:\n${policyExtract.keyPolicies.map(p => `- ${p}`).join('\n')}\n` : ''}${policyExtract.customInstructions ? `\n${policyExtract.customInstructions}` : ''}`

  return base + customisation
}

export function buildUserMessage(context: {
  clientName: string
  clientAge?: number
  conditions: string[]
  carePlan: string
  visitDate: string
  checkInTime: string
  checkOutTime: string
  completedTasks: Array<{ taskLabel: string; category: string; note?: string }>
  freeNotes: {
    care: string
    condition: string
    incident: string
    response: string
  }
}): string {
  const taskList =
    context.completedTasks.length > 0
      ? context.completedTasks
          .map((t) => `• ${t.taskLabel}${t.note ? ` — ${t.note}` : ''}`)
          .join('\n')
      : 'No tasks recorded'

  const noteLines = [
    context.freeNotes.care && `Care provided: ${context.freeNotes.care}`,
    context.freeNotes.condition && `Condition changes: ${context.freeNotes.condition}`,
    context.freeNotes.incident && `Incidents/concerns: ${context.freeNotes.incident}`,
    context.freeNotes.response && `Client response: ${context.freeNotes.response}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `Client: ${context.clientName}${context.clientAge ? `, Age: ${context.clientAge}` : ''}
Known conditions: ${context.conditions.join(', ') || 'None recorded'}
Care plan: ${context.carePlan}
Visit date: ${context.visitDate}
Check-in: ${context.checkInTime}
Check-out: ${context.checkOutTime}

Tasks completed:
${taskList}

Caregiver notes:
${noteLines || 'No additional notes provided'}`
}
