import type { TaskCategoryDefinition } from '@/types'

export const TASK_CATEGORIES: TaskCategoryDefinition[] = [
  {
    id: 'personal-care',
    label: 'Personal Care',
    tasks: [
      { id: 'pc-1', label: 'Assisted with washing / bathing',          category: 'personal-care' },
      { id: 'pc-2', label: 'Assisted with dressing and grooming',      category: 'personal-care' },
      { id: 'pc-3', label: 'Oral hygiene support provided',            category: 'personal-care' },
      { id: 'pc-4', label: 'Continence care / pad change',             category: 'personal-care' },
    ],
  },
  {
    id: 'medication',
    label: 'Medication',
    tasks: [
      { id: 'med-1', label: 'Medication administered as prescribed',   category: 'medication' },
      { id: 'med-2', label: 'Medication prompt given',                  category: 'medication' },
      { id: 'med-3', label: 'Medication refused — recorded',           category: 'medication' },
    ],
  },
  {
    id: 'nutrition',
    label: 'Nutrition & Hydration',
    tasks: [
      { id: 'nut-1', label: 'Meal prepared and served',                category: 'nutrition' },
      { id: 'nut-2', label: 'Supported with eating / drinking',        category: 'nutrition' },
      { id: 'nut-3', label: 'Fluid intake encouraged and monitored',   category: 'nutrition' },
      { id: 'nut-4', label: 'Special dietary requirements met',        category: 'nutrition' },
    ],
  },
  {
    id: 'mobility',
    label: 'Mobility & Transfers',
    tasks: [
      { id: 'mob-1', label: 'Assisted with transfer (bed to chair)',   category: 'mobility' },
      { id: 'mob-2', label: 'Supported with walking / mobilising',     category: 'mobility' },
      { id: 'mob-3', label: 'Repositioning / pressure relief carried out', category: 'mobility' },
      { id: 'mob-4', label: 'Falls risk equipment checked (walking frame, rails)', category: 'mobility' },
    ],
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing & Household',
    tasks: [
      { id: 'wb-1', label: 'Emotional wellbeing check carried out',    category: 'wellbeing' },
      { id: 'wb-2', label: 'Light housekeeping completed',             category: 'wellbeing' },
      { id: 'wb-3', label: 'Laundry assistance provided',              category: 'wellbeing' },
      { id: 'wb-4', label: 'Client engaged in conversation / activities', category: 'wellbeing' },
    ],
  },
]
