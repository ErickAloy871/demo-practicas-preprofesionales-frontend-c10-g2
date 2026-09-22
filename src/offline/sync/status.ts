export interface SyncStatus {
  online: boolean
  pending: number
  lastSyncAt: string | null
  syncing: boolean
}

type Listener = () => void

let state: SyncStatus = {
  online: navigator.onLine,
  pending: 0,
  lastSyncAt: null,
  syncing: false,
}

const listeners = new Set<Listener>()

let channel: BroadcastChannel | null = null
if (typeof BroadcastChannel !== 'undefined') {
  channel = new BroadcastChannel('yura-sync-status')
  channel.onmessage = (event) => {
    state = { ...state, ...event.data }
    for (const listener of listeners) listener()
  }
}

// Expuesto únicamente para limpiar los tests sin exportar variables mutables.
export function closeSyncChannel(): void {
  if (channel) channel.close()
}

export function getStatus(): SyncStatus {
  return state
}

export function setStatus(patch: Partial<SyncStatus>, broadcast = true): void {
  state = { ...state, ...patch }
  if (broadcast && channel) {
    channel.postMessage(patch)
  }
  for (const listener of listeners) listener()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
