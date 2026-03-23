'use client'

import { openDB, type IDBPDatabase } from 'idb'

export interface CompletedTask {
  taskId: string
  taskLabel: string
  category: string
  note?: string
}

export interface FreeNotes {
  care: string
  condition: string
  incident: string
  response: string
}

export interface QueuedVisit {
  id: string          // temp local UUID
  clientId: string
  clientName: string
  tasks: CompletedTask[]
  notes: FreeNotes
  checkInTime: string
  queuedAt: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  errorMessage?: string
}

const DB_NAME = 'caredoc-offline'
const STORE   = 'visit-queue'
const VERSION = 1

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export async function queueVisit(visit: QueuedVisit): Promise<void> {
  const db = await getDB()
  await db.put(STORE, visit)
}

export async function getQueuedVisit(id: string): Promise<QueuedVisit | undefined> {
  const db = await getDB()
  return db.get(STORE, id)
}

export async function getAllPendingVisits(): Promise<QueuedVisit[]> {
  const db = await getDB()
  const all: QueuedVisit[] = await db.getAll(STORE)
  return all.filter((v) => v.status === 'pending' || v.status === 'failed')
}

export async function updateVisitStatus(
  id: string,
  status: QueuedVisit['status'],
  errorMessage?: string
): Promise<void> {
  const db = await getDB()
  const existing = await db.get(STORE, id)
  if (existing) {
    await db.put(STORE, { ...existing, status, errorMessage })
  }
}

export async function removeQueuedVisit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function syncPendingVisits(): Promise<void> {
  const pending = await getAllPendingVisits()
  for (const visit of pending) {
    await updateVisitStatus(visit.id, 'syncing')
    try {
      const res = await fetch('/api/sync/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localId: visit.id,
          clientId: visit.clientId,
          checkInTime: visit.checkInTime,
          tasks: visit.tasks,
          notes: visit.notes,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await updateVisitStatus(visit.id, 'synced')
    } catch (err) {
      await updateVisitStatus(visit.id, 'failed', String(err))
    }
  }
}
