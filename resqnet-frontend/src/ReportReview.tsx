import { useEffect, useRef, useState } from "react"
import { incidentTypes, junctions } from "../shared/resqnet"
import { isCustomSituation, situationsFor } from "../shared/report-options"
import { reportsRequest, type Report, type ReportDraft } from "./lib/reports"
import ReportSteps from "./ReportSteps"
import { transitionPage } from "./lib/page-transition"
import ReportConfirmation from "./ReportConfirmation"
import { useReportUpdates } from "./ReportUpdatesProvider"

export default function ReportReview({ draft, onEdit, onDone }: {
  draft: ReportDraft; onEdit: () => void; onDone: (report: Report) => void
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState<Report | null>(null)
  const sendingRef = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const { trackSaved } = useReportUpdates()
  const type = incidentTypes[draft.type]
  const location = junctions.find(place => place.id === draft.location)!
  const description = isCustomSituation(draft.type, draft.situation) ? draft.customDescription : situationsFor(draft.type)[draft.situation]
  useEffect(() => {
    if (saved) return
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
    document.title = "Review report · ResqNet"
  }, [saved])

  const send = async () => {
    if (sendingRef.current || saved) return
    sendingRef.current = true
    setSending(true)
    setError("")
    let confirmed = false
    try {
      const { report } = await reportsRequest<{ report: Report }>("POST", draft)
      trackSaved(report)
      confirmed = true
      transitionPage(() => { setSaved(report); setSending(false) })
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not confirm submission. Please retry.")
    } finally {
      if (!confirmed) {
        sendingRef.current = false
        setSending(false)
      }
    }
  }

  if (saved) return <ReportConfirmation report={saved} draft={draft} onDone={onDone} />

  return (
    <main className="dashboard report-page flex-1 px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <ReportSteps current={2} />
        <section aria-busy={sending} className="card rounded-3xl p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-mute">One last check</p>
          <h1 ref={heading} tabIndex={-1} className="mt-4 text-4xl font-semibold tracking-tight outline-none">Is everything correct?</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute">Check the details below. Nothing is sent until you choose Send report.</p>
          <dl className="mt-8 grid gap-6 border-y border-line py-7 sm:grid-cols-2">
            {[
              ["Emergency", type.name],
              ["Location", `${location.name} · Junction ${draft.location}`],
              ["People affected", String(draft.people)],
              ["Severity", `${draft.severity} / 10`],
            ].map(([label, value]) => <div key={label}><dt className="text-xs text-mute">{label}</dt><dd className="mt-2 text-base font-semibold">{value}</dd></div>)}
            <div className="sm:col-span-2"><dt className="text-xs text-mute">Situation</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{description}</dd></div>
          </dl>
          <div className="mt-7 rounded-2xl bg-white/50 p-5"><h2 className="font-semibold">While you stay safe</h2><p className="mt-3 text-sm leading-relaxed text-mute">{type.precaution}</p></div>
          {error && <p role="alert" className="mt-6 rounded-xl border border-line bg-white/70 p-4 text-sm">{error} Retrying this report will not create another copy.</p>}
          {sending && <p role="status" className="mt-6 text-sm text-mute">Saving your report. Please keep this page open until you see confirmation.</p>}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" disabled={sending} onClick={onEdit} className="rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold disabled:opacity-50">Edit details</button>
            <button type="button" disabled={sending} onClick={() => void send()} className="primary-button inline-flex items-center justify-center gap-3 rounded-full px-8 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{sending && <svg aria-hidden="true" className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" opacity=".25" /><path d="M12 3a9 9 0 0 1 9 9" /></svg>}{sending ? "Sending report…" : error ? "Retry sending" : "Send report"}</button>
          </div>
          {!sending && <p className="mt-4 text-right text-xs text-mute">Send report saves your details and adds them to the dispatcher inbox.</p>}
        </section>
      </div>
    </main>
  )
}
