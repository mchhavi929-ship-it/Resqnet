export type AppNotification = {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  reportId?: string
  eventKey?: string
}

const prefix = "resqnet.notifications.v1:"
const changeEvent = "resqnet:notifications"
const memory = new Map<string, AppNotification[]>()
const memoryOnly = new Set<string>()

export function readNotifications(accountId: string): AppNotification[] {
  const key = prefix + accountId
  if (memoryOnly.has(key)) return memory.get(key) ?? []
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return memory.get(key) ?? []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const items = parsed.filter((item): item is AppNotification =>
      Boolean(item) && typeof item === "object"
      && typeof item.id === "string"
      && typeof item.title === "string" && item.title.length <= 120
      && typeof item.body === "string" && item.body.length <= 500
      && typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt))
      && typeof item.read === "boolean"
      && typeof item.reportId === "string" && item.reportId.length > 0 && item.reportId.length <= 128
      && (item.eventKey === undefined || typeof item.eventKey === "string"),
    ).map(item => ({ ...item, body: item.body.replace(/\s*(?:Report reference|Reference):\s*[0-9a-f-]+/gi, "").trim() })).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 50)
    memory.set(key, items)
    return items
  } catch {
    return memory.get(key) ?? []
  }
}

function writeNotifications(accountId: string, items: AppNotification[]) {
  const key = prefix + accountId
  memory.set(key, items)
  try { localStorage.setItem(key, JSON.stringify(items)); memoryOnly.delete(key) }
  catch { memoryOnly.add(key) }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: accountId }))
}

export function addNotification(accountId: string, title: string, body: string, options?: { reportId?: string; eventKey?: string }) {
  if (!options?.reportId) return
  // Summaries only: no reporter identities, descriptions, or session data.
  const previous = readNotifications(accountId)
  if (options?.eventKey && previous.some(item => item.eventKey === options.eventKey)) return
  const item: AppNotification = { id: crypto.randomUUID(), title: title.slice(0, 120), body: body.slice(0, 500), createdAt: new Date().toISOString(), read: false, ...options }
  writeNotifications(accountId, [item, ...previous].slice(0, 50))
}

export function markNotificationsRead(accountId: string, id?: string) {
  writeNotifications(accountId, readNotifications(accountId).map(item => !id || item.id === id ? { ...item, read: true } : item))
}

export function clearNotifications(accountId: string) {
  writeNotifications(accountId, [])
}

export function subscribeNotifications(accountId: string, onChange: () => void) {
  const onLocal = (event: Event) => { if ((event as CustomEvent<string>).detail === accountId) onChange() }
  const onStorage = (event: StorageEvent) => {
    if (event.key === prefix + accountId || event.key === null) {
      memory.delete(prefix + accountId)
      memoryOnly.delete(prefix + accountId)
      onChange()
    }
  }
  window.addEventListener(changeEvent, onLocal)
  window.addEventListener("storage", onStorage)
  return () => { window.removeEventListener(changeEvent, onLocal); window.removeEventListener("storage", onStorage) }
}
