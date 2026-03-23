import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import React from 'react'

interface FlaggedReportEmailProps {
  clientName: string
  caregiverName: string
  flags: string[]
  visitDate: Date
  reportId: string
}

const appUrl = process.env.NEXTAUTH_URL ?? 'https://app.caredocai.com'

export function FlaggedReportEmail({
  clientName,
  caregiverName,
  flags,
  visitDate,
  reportId,
}: FlaggedReportEmailProps) {
  const dateStr = visitDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>⚠️ Flagged visit report — {clientName} — {dateStr}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'DM Sans, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
          {/* Header */}
          <Section style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '32px 32px 24px' }}>
            <Heading style={{ color: '#1B4332', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
              CareDoc<span style={{ color: '#2D6A4F' }}>AI</span>
            </Heading>
            <Text style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>CQC-compliant documentation platform</Text>
          </Section>

          <Section style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '16px 24px', margin: '12px 0' }}>
            <Text style={{ color: '#92400E', fontWeight: 600, fontSize: 14, margin: 0 }}>
              ⚠️ A visit report has been submitted with the following concerns:
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '24px 32px', margin: '12px 0' }}>
            {flags.map((flag, i) => (
              <Text key={i} style={{ color: '#374151', fontSize: 14, margin: '4px 0' }}>• {flag}</Text>
            ))}

            <Hr style={{ border: '1px solid #E5E7EB', margin: '20px 0' }} />

            <table style={{ width: '100%' }}>
              <tbody>
                {[
                  ['Client', clientName],
                  ['Caregiver', caregiverName],
                  ['Visit date', dateStr],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ color: '#6B7280', fontSize: 13, paddingBottom: 8, width: '40%' }}>{label}</td>
                    <td style={{ color: '#111827', fontSize: 13, fontWeight: 600, paddingBottom: 8 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              href={`${appUrl}/manager/reports/${reportId}`}
              style={{
                backgroundColor: '#2D6A4F', color: '#ffffff', borderRadius: 8,
                padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                display: 'inline-block', marginTop: 8,
              }}
            >
              View Report
            </Button>
          </Section>

          <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', margin: '24px 0 0' }}>
            This alert was sent because flagged concerns were identified in the visit documentation.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default FlaggedReportEmail
