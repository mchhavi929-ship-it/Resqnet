import type { Report } from "./reports"
import { assignedVehicles, responseFingerprint, vehicleCountSummary } from "./report-response"

export function reconcileReports(previous: Report[], incoming: Report[]): Report[] {
  const byId = new Map(previous.map(report => [report.id, report]))
  const next = incoming.map(report => {
    const old = byId.get(report.id)
    return old && JSON.stringify(old) === JSON.stringify(report) ? old : report
  })
  return next.length === previous.length && next.every((report, index) => report === previous[index]) ? previous : next
}

export function responseNotices(report: Report, previous?: string) {
  const status = report.status.toUpperCase()
  if (previous === responseFingerprint(report) || !["DISPATCHED", "RESOLVED"].includes(status)) return []
  const notices: { title: string; body: string; eventKey: string }[] = []
  const vehicles = assignedVehicles(report)
  const place = report.dispatchDestination?.name ?? report.area
  // Retain the dispatch event even if the reporter returns after clearance.
  if (status === "DISPATCHED" || (!previous && report.dispatchedAt)) {
    notices.push({
      title: "Vehicles dispatched",
      body: `${report.category} · ${place}. ${vehicles.length ? vehicleCountSummary(vehicles) : "Response team assigned"}. ${status === "RESOLVED" ? "Dispatch recorded for your report." : "On the way to your report."}`,
      eventKey: `dispatched:${report.id}:${report.dispatchedAt ?? JSON.stringify(vehicles)}`,
    })
  }
  if (status === "RESOLVED") notices.push({
    title: "Incident cleared",
    body: `${report.category} · ${place}. The team has completed its response.`,
    eventKey: `cleared:${report.id}:${report.resolvedAt ?? report.dispatchedAt ?? "recorded"}`,
  })
  return notices
}
