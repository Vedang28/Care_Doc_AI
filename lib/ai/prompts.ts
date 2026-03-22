export function buildSystemPrompt(agencyPromptOverride?: string): string {
  if (agencyPromptOverride) return agencyPromptOverride

  return `You are a CQC-compliant care documentation assistant for domiciliary care in England.
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
  "transformations": ["Array describing each informal→formal change made, e.g. 'grabbed → assisted with mobilising'"]
}`
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
