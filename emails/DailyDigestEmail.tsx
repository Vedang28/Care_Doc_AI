import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import React from 'react'

interface DailyDigestEmailProps {
  agencyName: string
  visitsCompleted: number
  flagsRaised: number
  flagsResolved: number
  incompleteVisits: number
  date: Date
}

export function DailyDigestEmail({
  agencyName,
  visitsCompleted,
  flagsRaised,
  flagsResolved,
  incompleteVisits,
  date,
}: DailyDigestEmailProps) {
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const stats = [
    { label: 'Visits completed', value: visitsCompleted, color: '#2D6A4F' },
    { label: 'Flags raised', value: flagsRaised, color: flagsRaised > 0 ? '#D97706' : '#2D6A4F' },
    { label: 'Flags resolved', value: flagsResolved, color: '#2D6A4F' },
    { label: 'Incomplete / cancelled', value: incompleteVisits, color: incompleteVisits > 0 ? '#DC2626' : '#2D6A4F' },
  ]

  return (
    <Html>
      <Head />
      <Preview>Daily digest — {agencyName} — {dateStr}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'DM Sans, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '32px' }}>
            <Heading style={{ color: '#1B4332', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
              CareDoc<span style={{ color: '#2D6A4F' }}>AI</span>
            </Heading>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 0 }}>Daily digest — {agencyName}</Text>
            <Text style={{ color: '#374151', fontSize: 14 }}>Here&apos;s a summary of yesterday&apos;s activity ({dateStr}):</Text>

            <Hr style={{ border: '1px solid #E5E7EB', margin: '20px 0' }} />

            <table style={{ width: '100%' }}>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.label}>
                    <td style={{ color: '#6B7280', fontSize: 14, paddingBottom: 12 }}>{s.label}</td>
                    <td style={{ color: s.color, fontSize: 20, fontWeight: 700, textAlign: 'right', paddingBottom: 12 }}>
                      {s.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            CareDoc AI — CQC-compliant documentation platform
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default DailyDigestEmail
