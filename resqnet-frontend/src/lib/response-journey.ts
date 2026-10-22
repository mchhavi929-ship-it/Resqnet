import { TRAVEL_MS, CLEAR_MS } from "../../shared/simulation-clock"
export { TRAVEL_MS, CLEAR_MS }

export function responseJourney(dispatchedAt: string, now = Date.now()) {
  const started = Date.parse(dispatchedAt)
  const elapsed = Number.isFinite(started) ? Math.max(0, now - started) : 0
  return {
    progress: Math.min(1, elapsed / TRAVEL_MS),
    stage: elapsed >= CLEAR_MS ? "Incident cleared" : elapsed >= TRAVEL_MS ? "At the scene" : "On the way",
    cleared: elapsed >= CLEAR_MS,
    resolvedAt: Number.isFinite(started) ? new Date(started + CLEAR_MS).toISOString() : undefined,
  }
}
