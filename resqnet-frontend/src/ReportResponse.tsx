import type { Report } from "./lib/reports"
import { assignedVehicles, vehicleCountSummary } from "./lib/report-response"
import ResponseJourney from "./ResponseJourney"
import { memo } from "react"

export default memo(function ReportResponse({ report }: { report: Report }) {
  const status = report.status.toUpperCase()
  const vehicles = assignedVehicles(report)
  const assigned = status === "DISPATCHED" || status === "RESOLVED"
  return (
    <section aria-label="Assigned response" className="report-response rounded-2xl border border-white bg-white/60 p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-mute">{assigned ? status === "RESOLVED" ? "Last assigned help" : `Assigned: ${vehicleCountSummary(report.assignments?.length ? report.assignments.map(unit => unit.type) : vehicles)}` : "Response status"}</p>
      {vehicles.length && !report.simulatedResponse ? <><ul className="mt-3 flex flex-wrap gap-2">{vehicles.map((name, index) => <li key={`${name}:${index}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium">{name}</li>)}</ul><p className="mt-3 text-xs text-mute">{status === "RESOLVED" ? "Incident cleared." : report.simulatedResponse ? "" : report.assignments?.length ? "Latest saved assignment. Calculated travel estimates are shown below." : "Latest saved assignment. Arrival time has not been provided."}</p></> : !report.simulatedResponse && <p className="mt-2 text-sm leading-relaxed text-mute">{assigned ? "A team is assigned. Vehicle details have not been recorded yet." : "No help has been assigned yet. Confirmed assignments will appear here."}</p>}
      {assigned && report.assignments?.length ? <ul className="mt-4 space-y-3 border-t border-line pt-3">{report.assignments.map(unit => <li key={unit.id} className="text-xs leading-relaxed"><p className="font-medium">{unit.name} · {unit.type}</p><p className="mt-1 text-mute">{unit.directFlight ? "Direct flight" : unit.route.map(place => place.name).join(" → ")} · {unit.etaSeconds} sec calculated travel time</p></li>)}</ul> : null}
      {assigned && !report.simulatedResponse && report.dispatchDestination && <p className="mt-3 text-xs text-mute">Response destination: {report.dispatchDestination.name}</p>}
      {assigned && report.missingTypes?.length ? <p className="mt-3 text-xs text-mute">Not filled in this response: {report.missingTypes.join(", ")}.</p> : null}
      {assigned && report.simulatedResponse && <ResponseJourney report={report} />}
    </section>
  )
})
