import { useEffect, useState } from "react"
import { useReportUpdates } from "./ReportUpdatesProvider"
import { reportsRequest, reportStatusLabel, type Report } from "./lib/reports"
import { incidentTypes } from "../shared/resqnet"
import ReportResponse from "./ReportResponse"
import AnimatedDisclosure from "./AnimatedDisclosure"

export default function InboxReportDetails({ reportId, audience }: { reportId: string; audience: "reporter" | "dispatcher" }) {
  const own = useReportUpdates()
  const [dispatch, setDispatch] = useState<{ report?: Report; loading: boolean; error: string }>({ loading: true, error: "" })

  useEffect(() => {
    if (audience !== "dispatcher") return
    let active = true
    let fetching = false
    let timer: number | undefined
    const controller = new AbortController()
    const refresh = async () => {
      if (fetching || !active || document.hidden || !navigator.onLine) return
      fetching = true
      clearTimeout(timer)
      try {
        // Dispatchers may inspect shared records, including reports no longer pending.
        const result = await reportsRequest<{ reports: Report[] }>("GET", undefined, controller.signal)
        if (active) setDispatch({ report: result.reports.find(report => report.id === reportId), loading: false, error: "" })
      } catch {
        if (active) setDispatch(previous => ({ ...previous, loading: false, error: "Could not refresh the report. Any details below are from the last successful update." }))
      } finally {
        fetching = false
        if (active && !document.hidden && navigator.onLine) timer = window.setTimeout(() => void refresh(), 3000)
      }
    }
    const resume = () => { if (!document.hidden) void refresh(); else clearTimeout(timer) }
    const pause = () => {
      clearTimeout(timer)
      setDispatch(previous => ({ ...previous, loading: false, error: "You’re offline. Any details below are from the last successful update." }))
    }
    if (navigator.onLine) void refresh()
    else pause()
    document.addEventListener("visibilitychange", resume)
    window.addEventListener("online", resume)
    window.addEventListener("offline", pause)
    return () => { active = false; clearTimeout(timer); controller.abort(); document.removeEventListener("visibilitychange", resume); window.removeEventListener("online", resume); window.removeEventListener("offline", pause) }
  }, [audience, reportId])

  // A reporter's message must never fall back to the shared incident feed.
  const report = audience === "dispatcher" ? dispatch.report : own.reports.find(report => report.id === reportId)
  const loading = audience === "dispatcher" ? dispatch.loading : own.loading
  const error = audience === "dispatcher" ? dispatch.error : own.error
  if (!report) return <div className="mt-5 rounded-2xl border border-line bg-surface/40 p-4"><p role={error ? "alert" : "status"} className="text-sm leading-relaxed text-mute">{loading ? "Loading the report included with this message…" : error || "This report is not available in this account’s latest report list. The original message is still available above."}</p></div>

  const status = report.status.toUpperCase()
  const assigned = status === "DISPATCHED" || status === "RESOLVED"
  const type = incidentTypes.find(type => type.id === report.type)

  return (
    <section aria-labelledby="inbox-report-title" className="inbox-report mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-widest text-mute">Incident details</p><span className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white">{reportStatusLabel(report.status)}</span></div>
      <h4 id="inbox-report-title" className="mt-3 font-brand text-xl font-medium tracking-tight">{report.category}</h4>
      {error && <p role="status" className="mt-3 text-xs text-mute">{error}</p>}
      <dl className="inbox-report-facts mt-4 grid grid-cols-2 gap-4">
        <div className="border-b border-line pb-3"><dt className="text-xs text-mute">Location</dt><dd className="mt-1 text-sm font-medium">{report.area}{typeof report.location === "number" && <span className="mt-1 block text-xs font-normal text-mute">Junction {report.location}</span>}</dd></div>
        <div className="border-b border-line pb-3"><dt className="text-xs text-mute">Report received</dt><dd className="mt-1 text-sm"><time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></dd></div>
        <div className="border-b border-line pb-3"><dt className="text-xs text-mute">People affected</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{typeof report.people === "number" ? report.people.toLocaleString("en-US") : "Not recorded"}</dd></div>
        <div className="border-b border-line pb-3"><dt className="text-xs text-mute">Reported severity</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{report.severity}<span className="ml-1 text-xs font-normal text-mute">/ 10</span></dd></div>
      </dl>
      {assigned && <div className="mt-4"><ReportResponse report={report} /></div>}
      <section className="mt-5"><h5 className="text-xs font-medium uppercase tracking-widest text-mute">What happened</h5><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{report.description || "No additional situation was recorded."}</p></section>
      <AnimatedDisclosure title="Safety precautions" className="mt-5 border-t border-line pt-4"><p className="pt-3 text-sm leading-relaxed text-mute">{report.precaution ?? type?.precaution ?? "No incident-specific precautions are recorded."}</p></AnimatedDisclosure>
    </section>
  )
}
