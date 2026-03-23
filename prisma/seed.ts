import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { buildSystemPrompt } from '../lib/ai/prompts'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Agency ─────────────────────────────────────────────────────────────────
  const agency = await prisma.agency.upsert({
    where: { code: 'SUNRISE' },
    update: {},
    create: {
      name: 'Sunrise Care Agency',
      code: 'SUNRISE',
      plan: 'starter',
      active: true,
    },
  })
  console.log('✅ Agency created:', agency.name)

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash    = await hash('Admin123!', 12)
  const managerHash  = await hash('Manager123!', 12)
  const carerHash    = await hash('Carer123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sunrise.care' },
    update: {},
    create: {
      agencyId:     agency.id,
      email:        'admin@sunrise.care',
      name:         'Admin User',
      role:         'ADMIN',
      passwordHash: adminHash,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sunrise.care' },
    update: {},
    create: {
      agencyId:     agency.id,
      email:        'manager@sunrise.care',
      name:         'Sarah Mitchell',
      role:         'MANAGER',
      passwordHash: managerHash,
    },
  })

  const carer1 = await prisma.user.upsert({
    where: { email: 'carer1@sunrise.care' },
    update: {},
    create: {
      agencyId:     agency.id,
      email:        'carer1@sunrise.care',
      name:         'Emma Johnson',
      role:         'CAREGIVER',
      passwordHash: carerHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'carer2@sunrise.care' },
    update: {},
    create: {
      agencyId:     agency.id,
      email:        'carer2@sunrise.care',
      name:         'David Clarke',
      role:         'CAREGIVER',
      passwordHash: carerHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'carer3@sunrise.care' },
    update: {},
    create: {
      agencyId:     agency.id,
      email:        'carer3@sunrise.care',
      name:         'Priya Patel',
      role:         'CAREGIVER',
      passwordHash: carerHash,
    },
  })

  console.log('✅ Users created (admin, manager, 3 caregivers)')

  // ── Clients ────────────────────────────────────────────────────────────────
  const margaret = await prisma.client.upsert({
    where: { id: 'client-margaret-thompson' },
    update: {},
    create: {
      id:         'client-margaret-thompson',
      agencyId:   agency.id,
      name:       'Margaret Thompson',
      dob:        new Date('1943-03-14'),
      address:    '14 Elm Close, Birmingham, B15 2TT',
      conditions: ['Dementia (early stage)', 'Type 2 Diabetes'],
      carePlan:   'Requires assistance with personal care, medication prompts, and meal preparation. Mobility support needed when transferring. Ensure a calm, familiar environment to minimise confusion. Monitor blood glucose levels and report any concerns.',
      risks:      'Wandering risk — ensure front door is secured. Falls risk on stairs — use stairlift. Ensure medication is taken with food to avoid hypoglycaemia.',
      active:     true,
    },
  })

  const arthur = await prisma.client.upsert({
    where: { id: 'client-arthur-davies' },
    update: {},
    create: {
      id:         'client-arthur-davies',
      agencyId:   agency.id,
      name:       'Arthur Davies',
      dob:        new Date('1934-07-22'),
      address:    '7 Oak Lane, Birmingham, B29 6QR',
      conditions: ['COPD', 'Hearing impairment'],
      carePlan:   'Oxygen therapy management — check cylinder levels and ensure tubing is positioned correctly. Medication administration twice daily. Light housekeeping. Speak clearly and face Arthur directly due to hearing impairment.',
      risks:      'Falls risk — use walking frame at all times when mobilising. Do not allow unsupervised stairs. Monitor respiratory rate and oxygen saturation. Call 999 and manager if SpO2 drops below 90%.',
      active:     true,
    },
  })

  const doris = await prisma.client.upsert({
    where: { id: 'client-doris-mitchell' },
    update: {},
    create: {
      id:         'client-doris-mitchell',
      agencyId:   agency.id,
      name:       'Doris Mitchell',
      dob:        new Date('1948-11-05'),
      address:    '22 Birch Road, Birmingham, B13 9PL',
      conditions: ["Parkinson's Disease", 'Anxiety'],
      carePlan:   "Assistance with dressing — allow extra time, do not rush. Meal support with adapted cutlery. Emotional wellbeing check at every visit — Doris responds well to gentle conversation. Encourage fluid intake throughout the visit. Monitor tremor severity and report any sudden worsening.",
      risks:      "Swallowing difficulties — ensure food is appropriate texture. Risk of falls due to Parkinson's gait — clear pathways before mobilising. Anxiety may be heightened in the morning — maintain a calm, unhurried approach.",
      active:     true,
    },
  })

  console.log('✅ Clients created: Margaret, Arthur, Doris')

  // ── Rota Assignments (today) ───────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const client of [margaret, arthur, doris]) {
    // Check if assignment already exists
    const existing = await prisma.rotaAssignment.findFirst({
      where: {
        clientId:      client.id,
        caregiverId:   carer1.id,
        scheduledDate: today,
      },
    })

    if (!existing) {
      await prisma.rotaAssignment.create({
        data: {
          clientId:      client.id,
          caregiverId:   carer1.id,
          agencyId:      agency.id,
          scheduledDate: today,
          visitType:     'standard',
          status:        'scheduled',
        },
      })
    }
  }

  console.log('✅ Rota assignments created for today (carer1 → all 3 clients)')

  // ── Prompt Version ─────────────────────────────────────────────────────────
  // Deactivate any existing active prompts first
  await prisma.promptVersion.updateMany({
    where: { agencyId: agency.id, active: true },
    data:  { active: false },
  })

  await prisma.promptVersion.create({
    data: {
      agencyId:     agency.id,
      systemPrompt: buildSystemPrompt(),
      version:      '1.0',
      active:       true,
    },
  })

  console.log('✅ Prompt version 1.0 created')
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Test credentials:')
  console.log('  Admin:    admin@sunrise.care    / Admin123!')
  console.log('  Manager:  manager@sunrise.care  / Manager123!')
  console.log('  Caregiver: carer1@sunrise.care  / Carer123!')
  console.log('')
  console.log('Login as carer1 to see all 3 clients on the dashboard.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
