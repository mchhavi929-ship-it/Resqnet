export default function ReportSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Reporting progress" className="report-progress mb-6 sm:mb-8">
      <ol className="grid grid-cols-3 gap-2 rounded-2xl border border-white/80 bg-white/45 p-3 sm:gap-4 sm:p-4">
        {["Incident details", "Review & send", "Report sent"].map((label, index) => (
          <li key={label} aria-current={current === index + 1 ? "step" : undefined} className={`flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:text-left sm:text-sm ${current === index + 1 ? "font-semibold text-ink" : "text-mute"}`}>
            <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${index + 1 <= current ? "border-ink bg-ink text-white" : "border-line bg-white/60"}`}>{index + 1}</span>
            <span>{label}<span className="sr-only">{index + 1 < current ? ", completed" : index + 1 === current ? ", current step" : ", upcoming"}</span></span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
