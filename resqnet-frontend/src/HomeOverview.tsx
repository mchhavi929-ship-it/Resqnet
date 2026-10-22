import AnimatedDisclosure from "./AnimatedDisclosure"
import type { Report } from "./lib/reports"

type Status = "all" | "REPORTED" | "DISPATCHED" | "RESOLVED"

export default function HomeOverview({ reports, loading, unavailable, scope, status, onStatus, onReport, onMyReports }: {
  reports: Report[]
  loading: boolean
  unavailable: boolean
  scope: "all" | "mine"
  status: Status
  onStatus: (status: Status) => void
  onReport: () => void
  onMyReports: () => void
}) {
  const count = (value: Status) => loading || unavailable ? "—" : reports.filter(report => value === "all" ? report.status.toUpperCase() !== "RESOLVED" : report.status.toUpperCase() === value).length

  return (
    <>
      <section className="home-hero card overflow-hidden rounded-3xl">
        <div className="grid items-center gap-6 p-5 sm:gap-8 sm:p-9 lg:grid-cols-2 lg:gap-12 lg:p-10">
          <div className="home-intro">
            <h1 className="font-brand text-4xl font-medium leading-tight tracking-tight sm:text-5xl xl:text-6xl">Help starts<br />with <span className="home-heading-accent">you.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute sm:text-base">Notice something that needs attention? Share what you see. Give dispatchers the details they need to take the next step.</p>
            <div className="home-hero-actions mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <button type="button" onClick={onReport} className="primary-button home-action inline-flex items-center gap-5 rounded-full px-6 py-3.5 text-sm font-medium text-white">
                Make a report
                <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </button>
              <button type="button" onClick={onMyReports} className="home-action rounded-full border border-line bg-white/50 px-5 py-3.5 text-sm font-medium hover:bg-white">View my reports</button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-xs text-mute">
              <span className="flex size-8 items-center justify-center rounded-full border border-white bg-white/60">
                <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></svg>
              </span>
              Review first. Send when you’re ready.
            </div>
          </div>
          <aside aria-label="The reporting journey" className="home-journey rounded-3xl border border-white bg-white/45 p-4 sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="min-w-0"><p className="text-xs uppercase tracking-widest text-mute">Small steps. Clearer action.</p><h2 className="mt-3 font-brand text-xl font-medium tracking-tight sm:text-2xl">From noticing<br />to being heard.</h2></div>
              <span className="journey-mark flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 sm:size-12">
                <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></svg>
              </span>
            </div>
            <div className="space-y-3">
              {[
                ["01", "Notice & describe", "Choose the incident and its location inside the reporting form. Add the people affected and the severity you observe."],
                ["02", "Review & send", "Check everything before sending. Your details stay unsent until you choose Send report."],
                ["03", "Stay in the loop", "Your saved report reaches the dispatcher inbox. Visit My reports to follow its recorded status."],
              ].map(([number, title, description], index) => (
                <AnimatedDisclosure key={number} defaultOpen={index === 0} className="journey-step rounded-2xl border border-white bg-white/50 p-4"
                  title={<span className="flex items-center gap-3"><span className="journey-number flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-xs">{number}</span>{title}</span>}>
                  <p className="pt-3 text-xs leading-relaxed text-mute">{description}</p>
                </AnimatedDisclosure>
              ))}
            </div>
            <p className="mt-5 text-xs text-mute">Your report. Your final say before sending.</p>
          </aside>
        </div>
      </section>

      <section aria-label="Report snapshot" className="my-7" data-reveal>
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-widest text-mute">At a glance</p><p className="text-xs text-mute">{scope === "mine" ? "Your latest 50 reports" : "Latest 50 incident reports"}</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["all", "Active reports", "Reports awaiting or receiving a response", "M5 5h14v14H5z M8 9h8 M8 12h8 M8 15h5"],
            ["REPORTED", "Awaiting dispatcher", "Waiting for the next step", "M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"],
            ["DISPATCHED", "Team assigned", "Reports marked dispatched", "m5 12 4 4L19 6"],
          ] as const).map(([value, label, description, icon]) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => onStatus(value)} className="home-stat group rounded-2xl border border-white/80 bg-white/50 p-5 text-left">
              <div className="home-stat-icon-row flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl border border-white bg-white/70"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></span><svg className="size-4 text-mute transition-transform group-hover:translate-x-1" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7H7m10 0v10" /></svg></div>
              <div className="home-stat-value mt-4 flex flex-wrap items-baseline gap-3"><span className="font-brand text-3xl font-medium tabular-nums">{count(value)}</span><span className="text-sm font-medium">{label}</span></div>
              <p className="home-stat-caption mt-2 text-xs text-mute">{description}</p>
            </button>
          ))}
        </div>
      </section>

    </>
  )
}
