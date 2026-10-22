import { useEffect, useRef, useState } from "react"
import { categories, reportsRequest, type Report } from "./lib/reports"
import ReportPage from "./ReportPage"
import HomeOverview from "./HomeOverview"
import AnimatedDisclosure from "./AnimatedDisclosure"
import IncidentReportCard from "./IncidentReportCard"
import { transitionPage } from "./lib/page-transition"
import AccountActions from "./AccountActions"
import { useReportUpdates } from "./ReportUpdatesProvider"
import ReportStatusPage from "./ReportStatusPage"
import { reconcileReports } from "./lib/report-sync"
import { newlyClearedReports, reportsInSection, type ReportSection } from "./lib/report-lifecycle"

function referenceFromHash() {
  return window.location.hash.match(/^#incident\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)?.[1] ?? null
}

export default function Dashboard({ onSwitchAccount, onSignOut, signingOut, signOutError }: {
  onSwitchAccount: () => void; onSignOut: () => void; signingOut: boolean; signOutError?: string
}) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState("")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [filter, setFilter] = useState("All reports")
  const [scope, setScope] = useState<"all" | "mine">("all")
  const [reportPage, setReportPage] = useState(window.location.hash === "#report")
  const [reportReference, setReportReference] = useState(referenceFromHash)
  const [message, setMessage] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "REPORTED" | "DISPATCHED" | "RESOLVED">("all")
  const [section, setSection] = useState<ReportSection>("active")
  const [clearance, setClearance] = useState<Report | null>(null)
  const previousOwnReports = useRef<Report[] | null>(null)
  const homeRef = useRef<HTMLElement>(null)
  const ownReports = useReportUpdates()

  useEffect(() => {
    if (ownReports.loading || ownReports.error) return
    const cleared = newlyClearedReports(previousOwnReports.current ?? [], ownReports.reports)
    previousOwnReports.current = ownReports.reports
    if (cleared.length) setClearance(cleared[0])
  }, [ownReports.reports, ownReports.loading, ownReports.error])

  useEffect(() => {
    if (!clearance) return
    const timer = window.setTimeout(() => setClearance(null), 10000)
    return () => clearTimeout(timer)
  }, [clearance])

  useEffect(() => {
    const root = homeRef.current
    if (!root || reportPage || reportReference || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-reveal-state", "visible")
        } else {
          entry.target.setAttribute("data-reveal-state", "pending")
        }
      }
    }, { threshold: 0.05, rootMargin: "0px 0px -48px 0px" })
    const sections = new Set<Element>()
    const observeSections = () => {
      sections.forEach(section => {
        if (!root.contains(section)) { observer.unobserve(section); sections.delete(section) }
      })
      root.querySelectorAll("[data-reveal]").forEach(section => {
        if (sections.has(section)) return
        sections.add(section)
        section.setAttribute("data-reveal-state", "pending")
        observer.observe(section)
      })
    }
    observeSections()
    const updates = new MutationObserver(observeSections)
    updates.observe(root, { childList: true, subtree: true })
    const revealFocused = (event: FocusEvent) => {
      const section = (event.target as Element).closest("[data-reveal]")
      section?.setAttribute("data-reveal-state", "visible")
    }
    root.addEventListener("focusin", revealFocused)
    return () => {
      observer.disconnect()
      updates.disconnect()
      root.removeEventListener("focusin", revealFocused)
      sections.forEach(section => section.removeAttribute("data-reveal-state"))
    }
  }, [reportPage, reportReference])

  useEffect(() => {
    if (scope === "mine") {
      setReports(ownReports.reports)
      setLoading(ownReports.loading)
      setFeedError(ownReports.error)
      setUpdatedAt(ownReports.updatedAt)
    } else {
      setReports(previous => previous.map(report => ownReports.reports.find(item => item.id === report.id) ?? report))
    }
  }, [scope, ownReports.reports, ownReports.loading, ownReports.error, ownReports.updatedAt])

  useEffect(() => {
    if (scope === "mine") return
    setLoading(true)
    let active = true
    let inFlight = false
    const controller = new AbortController()
    const refresh = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const result = await reportsRequest<{ reports: Report[] }>("GET", undefined, controller.signal)
        if (active) { setReports(previous => reconcileReports(previous, result.reports)); setUpdatedAt(new Date()); setFeedError("") }
      } catch (error) {
        if (active) setFeedError(error instanceof Error ? error.message : "Could not load reports.")
      } finally {
        inFlight = false
        if (active) setLoading(false)
      }
    }
    void refresh()
    const timer = window.setInterval(() => { if (!document.hidden && navigator.onLine) void refresh() }, 3000)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener("visibilitychange", onVisible)
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible) }
  }, [scope, refreshKey])

  useEffect(() => {
    const navigate = () => {
      const next = window.location.hash === "#report"
      const reference = referenceFromHash()
      transitionPage(() => { setReportPage(next); setReportReference(reference); window.scrollTo(0, 0) }, next || reference ? "forward" : "back")
    }
    window.addEventListener("hashchange", navigate)
    return () => window.removeEventListener("hashchange", navigate)
  }, [])
  const openReport = () => { setMessage(""); window.location.hash = "report" }
  const back = () => { window.location.hash = "overview" }
  const onSaved = (report: Report) => {
    setReports(previous => [report, ...previous.filter(item => item.id !== report.id)].slice(0, 50))
    setFilter("All reports")
    setSearch("")
    setStatusFilter("all")
    setSection("active")
    setMessage("Your report is saved. Follow its latest status and assigned help here or in your Inbox.")
    setScope("mine")
    back()
  }

  const hasFilters = filter !== "All reports" || search.trim() !== "" || statusFilter !== "all"
  const clearFilters = () => { setFilter("All reports"); setSearch(""); setStatusFilter("all") }
  const browseReports = () => { document.getElementById("report-feed")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }) }
  const currentReports = reports.map(report => ownReports.reports.find(item => item.id === report.id) ?? report)
  const refreshFeed = () => { if (scope === "mine") ownReports.refresh(); else setRefreshKey(key => key + 1) }
  const sectionReports = reportsInSection(currentReports, section)
  const visible = sectionReports.filter(report => {
    const query = search.trim().toLowerCase()
    return (filter === "All reports" || report.category === filter)
      && (statusFilter === "all" || report.status.toUpperCase() === statusFilter)
      && (!query || [report.category, report.area, report.id, report.description ?? ""].some(value => value.toLowerCase().includes(query)))
  })
  const clearanceNotice = clearance && <aside role="status" className="fixed inset-x-5 bottom-5 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cleared-line bg-cleared-surface p-4 text-cleared shadow-lg">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-cleared-line bg-white/70"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 12 4 4L19 6" /></svg></span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Incident cleared</p><p className="mt-1 text-xs leading-relaxed">The team has completed its response.</p><p className="mt-1 text-xs">{clearance.category} · {clearance.area}</p><button type="button" onClick={() => { setScope("mine"); setSection("cleared"); clearFilters(); setClearance(null); if (reportReference || reportPage) back(); else browseReports() }} className="mt-3 text-xs font-medium underline underline-offset-4">View cleared reports</button></div>
    <button type="button" aria-label="Dismiss clearance confirmation" onClick={() => setClearance(null)} className="flex size-8 shrink-0 items-center justify-center rounded-full"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
  </aside>
  if (reportReference) return <>{clearanceNotice}<ReportStatusPage reportId={reportReference} onBack={() => { setScope("mine"); clearFilters(); back() }} /></>
  if (reportPage) return <>{clearanceNotice}<ReportPage onBack={back} onSaved={onSaved} /></>

  return (
    <main ref={homeRef} className="dashboard home-page flex-1 px-5 py-8 sm:px-10 sm:py-12">
      {clearanceNotice}
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div><p className="text-xs uppercase tracking-widest text-mute">Your reporting dashboard</p><p className="mt-1 font-medium">Report clearly. Follow every step.</p></div>
          <AccountActions onSwitchAccount={onSwitchAccount} onSignOut={onSignOut} busy={signingOut} />
        </div>
        {signOutError && <p role="alert" className="mb-5 text-sm">{signOutError}</p>}
        <HomeOverview reports={currentReports} loading={loading} unavailable={Boolean(feedError)} scope={scope} status={section === "cleared" ? "RESOLVED" : statusFilter}
          onStatus={value => { setSection(value === "RESOLVED" ? "cleared" : "active"); setStatusFilter(value === "RESOLVED" ? "all" : value); browseReports() }}
          onReport={openReport}
          onMyReports={() => { setScope("mine"); setSection("active"); clearFilters(); browseReports() }} />

        {message && <p role="status" className="mb-6 rounded-xl border border-line bg-white/70 p-4 text-sm">{message}</p>}

        <section id="report-feed" aria-labelledby="feed-title" className="incident-feed scroll-mt-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4" data-reveal="left">
            <div><p className="mb-2 text-xs uppercase tracking-widest text-mute">Incidents, in focus</p><div className="flex items-center gap-3"><h2 id="feed-title" className="font-brand text-3xl font-medium tracking-tight">{scope === "mine" ? "My reports" : "Incident reports"}</h2><span className="rounded-full border border-white bg-white/70 px-3 py-1 text-xs text-mute">{loading ? "—" : reports.length}</span></div><p className="mt-2 text-sm text-mute">{scope === "mine" ? "The details you shared. The next steps as they happen." : "A clearer picture of what’s happening across the network."}</p></div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-mute" role="status"><span className="inline-flex items-center gap-2">{!loading && !feedError && <span className="home-status-dot" aria-hidden="true" />}{loading ? "Connecting…" : feedError ? "Updates interrupted" : "Auto-sync · every 3s"}</span>{updatedAt && <span className="mt-1 block">Last synced {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</div>
              <button type="button" aria-label="Refresh reports" aria-busy={loading} onClick={refreshFeed} disabled={loading} className="home-action flex size-10 items-center justify-center rounded-full border border-line bg-white/60 disabled:opacity-40"><svg aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" /></svg></button>
            </div>
          </div>
          <div className="card mb-5 rounded-2xl p-4 sm:p-5" data-reveal="right">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-white bg-surface/60 p-1" aria-label="Report view">{(["all", "mine"] as const).map(value => <button key={value} onClick={() => setScope(value)} aria-pressed={scope === value} className={`feed-scope rounded-full px-5 py-2.5 text-xs font-medium ${scope === value ? "bg-ink text-white shadow-sm" : "text-mute hover:text-ink"}`}>{value === "mine" ? "My reports" : "All incidents"}</button>)}</div>
            <p className="text-xs text-mute">{section === "cleared" ? "Recently cleared" : "Latest first"} · {loading ? "Loading" : `${visible.length} ${visible.length === 1 ? "report" : "reports"}`}</p>
          </div>
            <div className="mb-5 flex gap-5 border-b border-line" aria-label="Incident status">
              {(["active", "cleared"] as const).map(value => <button key={value} type="button" aria-pressed={section === value} onClick={() => { setSection(value); setStatusFilter("all") }} className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium ${section === value ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink"}`}>{value === "active" ? "Active" : "Cleared"}<span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${value === "cleared" ? "bg-cleared-surface text-cleared" : "bg-surface text-mute"}`}>{loading ? "—" : reportsInSection(currentReports, value).length}</span></button>)}
            </div>
            <label className="relative block">
              <span className="sr-only">Search reports by emergency, location, or situation</span>
              <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search an incident or place…" className="w-full rounded-xl border border-line bg-white/60 py-3 pl-11 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
            </label>
            <AnimatedDisclosure title={<>Refine your view <span className="ml-2 text-xs font-normal text-mute">{filter !== "All reports" || statusFilter !== "all" ? "Filters applied" : "Emergency type & status"}</span></>} className="mt-4 border-t border-line pt-4">
            <div className={`grid gap-4 pt-4 ${section === "active" ? "sm:grid-cols-2" : ""}`}>
            <label className="block text-xs text-mute">Emergency type<select aria-label="Filter emergency type" value={filter} onChange={event => setFilter(event.target.value)} className="mt-2 block w-full rounded-xl border border-line bg-white/60 px-4 py-3 text-sm text-ink"><option value="All reports">All emergency types</option>{categories.map(type => <option key={type}>{type}</option>)}</select></label>
            {section === "active" && <label className="block text-xs text-mute">Report status<select aria-label="Filter report status" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} className="mt-2 block w-full rounded-xl border border-line bg-white/60 px-4 py-3 text-sm text-ink">
              <option value="all">All active reports</option><option value="REPORTED">Awaiting dispatcher</option><option value="DISPATCHED">Team assigned</option>
            </select></label>}
            </div>
            </AnimatedDisclosure>
          </div>
          {hasFilters && <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/50 px-4 py-3 text-xs"><p role="status">{loading ? "Loading matching reports…" : `${visible.length} matching ${visible.length === 1 ? "report" : "reports"}`}</p><button type="button" onClick={clearFilters} className="font-medium underline underline-offset-4">Clear filters</button></div>}
          {feedError && <div role="alert" className="mb-5 rounded-xl border border-line p-4 text-sm"><p>{feedError} {updatedAt ? "The reports below may be out of date." : "Your reports haven’t loaded yet."}</p><button type="button" onClick={refreshFeed} disabled={loading} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-xs font-medium disabled:opacity-50">{loading ? "Trying again…" : "Try again"}</button></div>}
          {loading && reports.length === 0 ? <div role="status" className="grid gap-4 lg:grid-cols-2"><span className="sr-only">Loading incident reports…</span>{[0, 1].map(item => <div key={item} aria-hidden="true" className="report-skeleton rounded-3xl border border-white bg-white/50 p-6"><div className="mb-6 h-5 w-32 rounded-full bg-line/60" /><div className="mb-3 h-7 w-48 rounded-lg bg-line/60" /><div className="h-4 w-24 rounded-lg bg-line/50" /><div className="mt-7 h-12 rounded-xl bg-line/40" /></div>)}</div> : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-5 py-12 text-center"><p className="font-medium">{feedError ? "Reports are currently unavailable" : hasFilters ? "No reports match these filters." : section === "cleared" ? "No cleared incidents yet." : currentReports.length ? "No active incidents." : scope === "mine" ? "You haven’t sent any reports yet." : "No incidents reported yet."}</p><p className="mt-2 text-sm text-mute">{feedError ? "Please try again. This doesn’t mean your saved reports have been removed." : hasFilters ? "Try another status, emergency type, or search term." : section === "cleared" ? "Completed responses will be kept here with their history." : currentReports.length ? "Completed responses are available in Cleared." : scope === "mine" ? "Only reports you send appear here." : "New reports will appear here after they are sent."}</p>{!feedError && (hasFilters ? <button onClick={clearFilters} className="mt-5 text-sm font-medium underline underline-offset-4">Clear filters</button> : section === "active" && <button onClick={openReport} className="mt-5 text-sm font-medium underline underline-offset-4">Make a report</button>)}</div>
          ) : (
            <ul className={`grid items-start gap-4 ${visible.length > 1 ? "lg:grid-cols-2" : ""}`}>
              {visible.map((report, index) => (
                <li key={report.id} data-reveal={index % 2 === 0 ? "left" : "right"}>
                  <IncidentReportCard report={report} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs text-mute"><svg aria-hidden="true" className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /></svg>Showing the latest 50 reports. Reporter identities stay private in this feed.</p>
        </section>
        <footer className="mt-8 flex justify-between gap-4 text-xs text-mute"><span>ResqNet · Incident reporting & response</span><span>Report. Prioritise. Respond.</span></footer>
      </div>
    </main>
  )
}
