import { useEffect, useMemo, useState } from "react"
import JourneyMap from "./JourneyMap"
import { junctions, roads } from "../shared/resqnet"
import { CLEAR_MS, TRAVEL_MS, responseJourney } from "./lib/response-journey"
import type { Report } from "./lib/reports"

// Presentation-only road walk, not engine routing or ETA.
function illustrationPath(destination: number) {
  const start = destination === 1 ? 4 : 1
  const queue = [[start]]
  const visited = new Set([start])
  while (queue.length) {
    const path = queue.shift()!
    const last = path[path.length - 1]
    if (last === destination) return path.map(id => junctions.find(place => place.id === id)!)
    for (const road of roads) {
      const next = road.source === last ? road.target : road.target === last ? road.source : undefined
      if (next !== undefined && !visited.has(next)) { visited.add(next); queue.push([...path, next]) }
    }
  }
  return []
}

export default function ResponseJourney({ report }: { report: Report }) {
  const [now, setNow] = useState(Date.now)
  const destination = report.dispatchDestination?.id ?? (typeof report.location === "number" ? report.location : undefined)
  const points = useMemo(() => destination ? illustrationPath(destination) : [], [destination])
  const journey = responseJourney(report.dispatchedAt ?? "", now)
  const cleared = report.status === "RESOLVED"
  const awaitingClearance = journey.cleared && !cleared

  useEffect(() => {
    if (cleared) return
    const tick = () => setNow(Date.now())
    const started = Date.parse(report.dispatchedAt ?? "")
    if (!Number.isFinite(started)) return
    const elapsed = Date.now() - started
    const boundary = elapsed < TRAVEL_MS ? TRAVEL_MS : CLEAR_MS
    const timer = elapsed < CLEAR_MS ? window.setTimeout(tick, Math.max(0, boundary - elapsed) + 20) : undefined
    document.addEventListener("visibilitychange", tick)
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", tick) }
  }, [cleared, journey.stage, report.dispatchedAt])

  useEffect(() => {
    if (journey.cleared && report.status !== "RESOLVED") window.dispatchEvent(new Event("resqnet:refresh-my-reports"))
  }, [journey.cleared, report.status])

  if (!report.dispatchedAt || !points.length) return null
  return (
    <section aria-label="Simulated response journey" className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-sm font-semibold">{cleared ? "Incident cleared" : awaitingClearance ? "Updating incident status" : journey.stage}</p>
        <span className="text-xs text-mute">Simulated response</span>
      </div>
      {!cleared && <JourneyMap points={points} dispatchedAt={report.dispatchedAt} destination={report.dispatchDestination?.name ?? report.area} arrived={journey.progress >= 1} />}
      <p className="text-xs leading-relaxed text-mute">{cleared
        ? "The team has completed its response. This simulated incident is now closed."
        : awaitingClearance ? "Refreshing the saved response status." : journey.progress >= 1 ? "Vehicles have arrived. The team is attending to the incident."
        : `Response vehicles are heading to ${report.dispatchDestination?.name ?? report.area}.`}</p>
    </section>
  )
}
