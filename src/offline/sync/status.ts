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
// Evitamos crearlo en tests porque Vitest se queda colgado esperando que el canal se cierre.
if (typeof BroadcastChannel !== 'undefined' && typeof import.meta !== 'undefined' && !import.meta.env?.TEST) {
  channel = new BroadcastChannel('yura-sync-status')
  channel.onmessage = (event) => {
    state = { ...state, ...event.data }
    for (const listener of listeners) listener()
  }
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
