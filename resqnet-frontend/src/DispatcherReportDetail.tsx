import AnimatedDisclosure from "./AnimatedDisclosure"
import { incidentTypes } from "../shared/resqnet"
import { reportStatusLabel, type Report } from "./lib/reports"
import AnimatedNumber from "./AnimatedNumber"

export default function DispatcherReportDetail({ report, stale, onPrepareDispatch }: { report: Report; stale: boolean; onPrepareDispatch: () => void }) {
  const type = incidentTypes.find(item => item.id === report.type)

  return (
    <section id="dispatcher-detail" aria-labelledby="selected-report-title" className="dispatcher-detail card overflow-hidden rounded-3xl">
      <div className="dispatcher-detail-header border-b border-white/80 p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs uppercase tracking-widest text-mute">Selected incident</span><span className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white">{reportStatusLabel(report.status)}</span></div>
        <h2 id="selected-report-title" tabIndex={-1} className="font-brand text-2xl font-medium tracking-tight outline-none sm:text-3xl">{report.category}</h2>
        <p className="mt-2 text-sm text-mute">{report.area}{typeof report.location === "number" && ` · Junction ${report.location}`}</p>
      </div>
      <div className="space-y-6 p-6 sm:p-7">
        {stale && <p role="status" className="rounded-xl border border-line bg-white/70 p-3 text-xs text-mute">Connection interrupted. These details reflect the last successful sync.</p>}
        <dl className="grid grid-cols-2 gap-3">
          <div className="border-b border-line pb-4"><dt className="text-xs text-mute">Reported severity</dt><dd className="mt-2 text-xl font-medium tabular-nums">{report.severity}<span className="ml-1 font-sans text-xs font-normal text-mute">/ 10</span></dd></div>
          <div className="border-b border-line pb-4"><dt className="text-xs text-mute">People affected</dt><dd className="mt-2 text-xl font-medium tabular-nums"><AnimatedNumber value={report.people ?? null} /></dd></div>
          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 text-xs text-mute"><dt>Report received</dt><dd><time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></dd></div>
        </dl>
        <div className="border-t border-line pt-5"><h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-mute">Reported situation</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{report.description || "No additional situation was recorded."}</p></div>
        <AnimatedDisclosure title="Safety precautions" className="border-t border-line pt-4"><p className="pt-3 text-sm leading-relaxed text-mute">{report.precaution ?? type?.precaution ?? "No incident-specific precautions are available."}</p></AnimatedDisclosure>
        <div className="border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Response</h3></div>
          {type && <p className="mt-3 text-sm text-mute">{type.vehicles.length} vehicles · {type.vehicles.join(", ")}</p>}
          <button type="button" onClick={onPrepareDispatch} className="primary-button mt-5 w-full rounded-full px-5 py-3 text-sm font-medium text-white">Prepare dispatch</button>
        </div>
      </div>
    </section>
  )
}
