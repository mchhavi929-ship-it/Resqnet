import { useEffect, useRef } from "react"
import AnimatedDisclosure from "./AnimatedDisclosure"
import ReportSteps from "./ReportSteps"
import { reportStatusLabel, type Report, type ReportDraft } from "./lib/reports"
import { incidentTypes } from "../shared/resqnet"
import { isCustomSituation, situationsFor } from "../shared/report-options"
import { useReportUpdates } from "./ReportUpdatesProvider"
import ReportResponse from "./ReportResponse"

export default function ReportConfirmation({ report: initialReport, draft, onDone, mode = "confirmation" }: {
  report: Report
  draft?: ReportDraft
  onDone: (report: Report) => void
  mode?: "confirmation" | "status"
}) {
  const updates = useReportUpdates()
  const report = updates.reports.find(item => item.id === initialReport.id) ?? initialReport
  const heading = useRef<HTMLHeadingElement>(null)
  const status = report.status.toUpperCase()
  const assigned = status === "DISPATCHED" || status === "RESOLVED"
  const resolved = status === "RESOLVED"
  const severity = report.severity ?? draft?.severity
  const type = incidentTypes.find(item => item.id === (report.type ?? draft?.type))
  const precaution = report.precaution ?? type?.precaution ?? "No incident-specific precautions are recorded."
  const description = report.description ?? (draft ? isCustomSituation(draft.type, draft.situation) ? draft.customDescription : situationsFor(draft.type)[draft.situation] : "")
  const location = typeof report.location === "number" ? report.location : draft?.location

  useEffect(() => {
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
    document.title = mode === "status" ? "Report status · ResqNet" : "Report sent · ResqNet"
  }, [initialReport.id, mode])



  return (
    <main className="dashboard report-page confirmation-page flex-1 px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <ReportSteps current={3} />
        <section aria-labelledby="confirmation-title" className="confirmation-hero card overflow-hidden rounded-3xl">
          <div className="grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-5 lg:p-10">
            <div className="lg:col-span-3">
              <div className="mb-6 flex items-center gap-3">
                <span className="success-seal confirmation-seal flex size-11 items-center justify-center rounded-full border border-white bg-white/80"><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path className="success-check" pathLength="1" d="m5 12 4 4L19 6" /></svg></span>
                <span className="text-xs font-medium uppercase tracking-widest text-mute">{mode === "status" ? "Your response updates" : "Received & recorded"}</span>
              </div>
              <h1 id="confirmation-title" ref={heading} tabIndex={-1} className="font-brand text-4xl font-medium leading-tight tracking-tight outline-none sm:text-5xl">{mode === "status" ? "Your report. Every update." : "Your report has been sent."}</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-mute">Your report is saved. Its recorded status and assigned help update here and in My reports. Confirmed response updates also appear in your Inbox.</p>
            </div>
            <div className="confirmation-reference min-w-0 rounded-2xl border border-white bg-white/55 p-5 sm:p-6 lg:col-span-2">
              <span role="status" className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-medium text-white"><span className="size-1.5 rounded-full bg-white/80" aria-hidden="true" />{reportStatusLabel(report.status)}</span>
              <p className="mt-5 font-brand text-xl font-medium">{report.category}</p>
              <p className="mt-2 text-sm text-mute">{report.area}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-white/80 bg-white/25 px-6 py-4 text-xs text-mute sm:px-9 lg:px-10">
            <span>Saved successfully · No need to resend</span>
            <time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        </section>
        {updates.error && <p role="status" className="mt-5 rounded-xl border border-line bg-white/70 p-4 text-sm text-mute">Updates are interrupted. Showing the last saved report details while we reconnect.</p>}
        <div className="mt-6"><ReportResponse report={report} /></div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
          <section aria-labelledby="receipt-title" className="confirmation-detail card rounded-3xl p-6 sm:p-8 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-3"><h2 id="receipt-title" className="font-brand text-xl font-medium tracking-tight">The details you shared</h2><span className="rounded-full border border-line px-3 py-1.5 text-xs text-mute">Saved report</span></div>
            <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/55 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white"><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg></span>
              <div className="min-w-0"><p className="text-xs text-mute">Emergency</p><p className="mt-1 text-lg font-semibold">{report.category}</p></div>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white/40 p-4 sm:col-span-3"><dt className="text-xs text-mute">Incident location</dt><dd className="mt-2 text-sm font-medium">{report.area}{location !== undefined && <span className="ml-2 text-xs font-normal text-mute">Junction {location}</span>}</dd></div>
              <div className="rounded-2xl border border-white bg-white/40 p-4"><dt className="text-xs text-mute">People affected</dt><dd className="mt-2 font-brand text-2xl font-medium tabular-nums">{report.people ?? draft?.people ?? "Not recorded"}</dd></div>
              <div className="rounded-2xl border border-white bg-white/40 p-4 sm:col-span-2"><dt className="text-xs text-mute">Reported severity</dt><dd className="mt-2 flex flex-wrap items-center gap-4"><span className="font-brand text-2xl font-medium tabular-nums">{severity}<span className="ml-1 font-sans text-xs font-normal text-mute">/ 10</span></span>
                {typeof severity === "number" && <span className="incident-severity flex gap-1" data-level={severity >= 9 ? "critical" : severity >= 7 ? "severe" : severity >= 4 ? "moderate" : "low"} aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} className="h-4 w-1.5 rounded-full bg-line" data-filled={index < severity} />)}</span>}
              </dd></div>
              <div className="border-t border-line pt-5 sm:col-span-3"><dt className="text-xs text-mute">Situation</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{description || "No additional situation was recorded."}</dd></div>
            </dl>
          </section>

          <aside aria-labelledby="next-title" className="confirmation-next card rounded-3xl p-6 sm:p-7">
            <p className="mb-2 text-xs uppercase tracking-widest text-mute">From here</p><h2 id="next-title" className="font-brand text-xl font-medium tracking-tight">What happens next</h2>
            <ol className="confirmation-timeline mt-6 space-y-6">
              {[
                [true, "Report saved", "Your details are recorded and available in the dispatcher inbox."],
                [assigned, "Team assignment", assigned ? "This report is marked as having a team assigned." : "Awaiting dispatcher action. A team has not been assigned yet."],
                [resolved, "Response", resolved ? "The team has completed its response." : "No arrival time or completed response is confirmed."],
              ].map(([complete, title, description], index) => <li key={String(title)} className="relative flex gap-3"><span className={`timeline-node relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${complete ? "border-ink bg-ink text-white" : "border-line bg-white text-mute"}`}>{complete ? <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg> : String(index + 1).padStart(2, "0")}</span><div className="pt-1"><p className="text-sm font-medium">{title}</p><p className="mt-2 text-xs leading-relaxed text-mute">{description}</p></div></li>)}
            </ol>
            <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-mute">Follow the recorded status in My reports. This receipt confirms saving, not emergency dispatch.</p>
          </aside>
        </div>

        <section aria-label="Incident precautions" className="confirmation-precautions mt-6">
          <AnimatedDisclosure defaultOpen title={<span className="flex items-center gap-3"><svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></svg>While you stay safe</span>} className="card rounded-3xl p-6 sm:p-7">
            <p className="pt-4 text-sm leading-relaxed text-mute">{precaution}</p>
          </AnimatedDisclosure>
        </section>
        <div className="mt-7 flex flex-col items-start justify-between gap-5 rounded-2xl border border-white bg-white/40 p-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-medium">Your part is recorded.</p><p className="mt-1 text-xs leading-relaxed text-mute">Check My reports for status updates.</p></div>
          <button type="button" onClick={() => onDone(report)} className="primary-button inline-flex w-full items-center justify-center gap-5 rounded-full px-7 py-3.5 text-sm font-semibold text-white sm:w-auto">View my reports<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button>
        </div>
      </div>
    </main>
  )
}
