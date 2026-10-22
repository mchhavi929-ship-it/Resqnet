import AnimatedDisclosure from "./AnimatedDisclosure"
import { reportStatusLabel, type Report } from "./lib/reports"
import { useReportUpdates } from "./ReportUpdatesProvider"
import ReportResponse from "./ReportResponse"
import { assignedVehicles, vehicleCountSummary } from "./lib/report-response"

export default function IncidentReportCard({ report: initialReport }: { report: Report }) {
  const updates = useReportUpdates()
  const ownedReport = updates.reports.find(item => item.id === initialReport.id)
  const report = ownedReport ?? initialReport
  const severity = typeof report.severity === "number" ? report.severity : null
  const date = new Date(report.createdAt)
  if (report.status.toUpperCase() === "RESOLVED") {
    const clearedAt = report.resolvedAt && Number.isFinite(Date.parse(report.resolvedAt)) ? report.resolvedAt : null
    const vehicles = assignedVehicles(report)
    return (
      <article className="incident-card overflow-hidden rounded-2xl border border-cleared-line bg-white/70">
        <div className="flex items-start gap-3 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cleared-surface text-cleared"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4"><path d="m5 12 4 4L19 6" /></svg></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">{report.category}</h3>
            <p className="mt-1 text-sm text-mute">{report.area}</p>
            <p className="mt-3 text-xs text-cleared">Cleared{clearedAt ? <> · <time dateTime={clearedAt}>{new Date(clearedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></> : " · time not recorded"}</p>
          </div>
        </div>
        <AnimatedDisclosure title="View details" className="border-t border-cleared-line px-5 py-4">
          <div className="space-y-4 pt-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-mute">Reported severity</dt><dd className="mt-1">{report.severity} / 10</dd></div>
              <div><dt className="text-xs text-mute">People affected</dt><dd className="mt-1">{report.people ?? "Not recorded"}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-mute">Reported</dt><dd className="mt-1"><time dateTime={report.createdAt}>{date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></dd></div>
            </dl>
            <div><p className="text-xs text-mute">Reported situation</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{report.description || "No additional situation was recorded."}</p></div>
            {vehicles.length > 0 && <div><p className="text-xs text-mute">Assigned response</p><p className="mt-1 text-sm">{vehicleCountSummary(report.assignments?.length ? report.assignments.map(unit => unit.type) : vehicles)}</p></div>}
            {report.precaution && <div><p className="text-xs text-mute">Recorded precautions</p><p className="mt-1 text-sm leading-relaxed text-mute">{report.precaution}</p></div>}
            {(ownedReport || report.isMine) && <button type="button" onClick={() => { window.location.hash = `incident/${encodeURIComponent(report.id)}` }} className="text-xs font-medium underline underline-offset-4">Open full report</button>}
          </div>
        </AnimatedDisclosure>
      </article>
    )
  }

  return (
    <article className="incident-card flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white/60">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="incident-status inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {reportStatusLabel(report.status)}
          </span>
          <time dateTime={report.createdAt} className="text-xs text-mute">{date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
        </div>
        <div className="flex items-center gap-4">
          <span className="incident-symbol flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/80">
            <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {report.type === 2 || report.category === "Medical Emergency" ? <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" /> : <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></>}
            </svg>
          </span>
          <div className="min-w-0"><h3 className="text-lg font-semibold tracking-tight sm:text-xl">{report.category}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-mute">
              <svg aria-hidden="true" className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {report.area}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
          <div><p className="text-xs text-mute">Reported severity</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold tabular-nums">{report.severity}{severity !== null && <span className="ml-1 text-xs font-normal text-mute">/ 10</span>}</p>
              {severity !== null && <span className="incident-severity flex gap-1" data-level={severity >= 9 ? "critical" : severity >= 7 ? "severe" : severity >= 4 ? "moderate" : "low"} aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} className="h-3 w-1 rounded-full bg-line" data-filled={index < severity} />)}</span>}
            </div>
          </div>
          <div className="border-l border-line pl-5"><p className="text-xs text-mute">People affected</p><p className="mt-2 text-lg font-semibold tabular-nums">{report.people ?? "Not recorded"}{report.people !== undefined && <span className="ml-2 text-xs font-normal text-mute">{report.people === 1 ? "person" : "people"}</span>}</p></div>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6">
        <ReportResponse report={report} />
        {(ownedReport || report.isMine) && <button type="button" onClick={() => { window.location.hash = `incident/${encodeURIComponent(report.id)}` }} className="mt-3 text-xs font-medium underline underline-offset-4">View report updates</button>}
      </div>
      <AnimatedDisclosure title="Situation & precautions" className="incident-details flex flex-1 flex-col border-t border-line bg-white/35 px-5 py-4 sm:px-6">
        <div className="flex flex-1 flex-col gap-5 pb-2 pt-5">
          <div className="grid flex-1 gap-5 sm:grid-cols-2">
          <div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-mute">What was reported</p><p className="text-sm leading-relaxed">{report.description || "No additional situation was recorded."}</p></div>
          <div className="rounded-2xl bg-surface/70 p-4"><p className="mb-2 text-xs font-medium uppercase tracking-widest text-mute">While you stay safe</p><p className="text-sm leading-relaxed text-mute">{report.precaution || "No incident-specific precautions are available."}</p></div>
          </div>
          {report.status.toUpperCase() === "REPORTED" && <p className="text-xs leading-relaxed text-mute">Saved and awaiting dispatcher action. No team assignment or arrival time is confirmed. C dispatch integration is not connected yet.</p>}
        </div>
      </AnimatedDisclosure>
    </article>
  )
}
