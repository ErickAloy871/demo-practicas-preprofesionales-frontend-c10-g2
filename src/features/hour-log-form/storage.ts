import { db, type LocalHourLog } from '@/offline/db'
import { enqueue } from '@/offline/sync/push'
import { buildCreateHourLogOperation } from './operation'

export async function saveHourLogLocally(row: LocalHourLog): Promise<void> {
  // Ambas escrituras son atómicas: un fallo al encolar no deja registros huérfanos.
  await db.transaction('rw', [db.hourLogs, db.outbox], async () => {
    await db.hourLogs.add(row)
    await enqueue(buildCreateHourLogOperation(row))
  })
}
