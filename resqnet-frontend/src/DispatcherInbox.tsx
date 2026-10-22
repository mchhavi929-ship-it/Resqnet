import { useEffect, useRef, useState } from "react"
import { categories, reportsRequest, type Report } from "./lib/reports"
import { junctions } from "../shared/resqnet"
import AccountActions from "./AccountActions"
import CityMap from "./CityMap"
import DispatcherReportDetail from "./DispatcherReportDetail"
import DispatchConsole from "./DispatchConsole"
import AnimatedNumber from "./AnimatedNumber"
import ReportResponse from "./ReportResponse"
import { addNotification } from "./lib/notifications"

export default function DispatcherInbox({ accountId, onSwitchAccount, onSignOut, signingOut, signOutError }: {
  accountId: string; onSwitchAccount: () => void; onSignOut: () => void; signingOut: boolean; signOutError?: string
}) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [synced, setSynced] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [view, setView] = useState<"inbox" | "dispatch" | "network">("inbox")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [location, setLocation] = useState<number | null>(null)
  const [order, setOrder] = useState<"newest" | "oldest">("newest")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [offline, setOffline] = useState(!navigator.onLine)
  const [announcement, setAnnouncement] = useState("")
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [newIds, setNewIds] = useState<string[]>([])
  const [dispatchReceipt, setDispatchReceipt] = useState<Report[]>([])
  const previousReports = useRef<Map<string, string> | null>(null)
  const connectionInterrupted = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = "Dispatcher workspace · ResqNet"
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
    return () => { document.title = "ResqNet" }
  }, [])

  useEffect(() => {
    let active = true
    let fetching = false
    let refreshAgain = false
    let failures = 0
    let timer: number | undefined
    const controller = new AbortController()
    const schedule = () => {
      clearTimeout(timer)
      if (active && !document.hidden && navigator.onLine) {
        timer = window.setTimeout(() => void refresh(), Math.min(30000, 3000 * 2 ** failures))
      }
    }
    const refresh = async () => {
      if (!active || document.hidden || !navigator.onLine) return
      if (fetching) { refreshAgain = true; return }
      clearTimeout(timer)
      fetching = true
      try {
        const result = await reportsRequest<{ reports: Report[] }>("GET", undefined, controller.signal, "dispatcher")
        if (active) {
          failures = 0
          const snapshot = new Map(result.reports.map(report => [report.id, JSON.stringify(report)]))
          const previous = previousReports.current
          if (previous) {
            const added = result.reports.filter(report => !previous.has(report.id)).map(report => report.id)
            const changed = result.reports.filter(report => previous.has(report.id) && previous.get(report.id) !== snapshot.get(report.id)).map(report => report.id)
            const removed = [...previous.keys()].filter(id => !snapshot.has(id))
            if (added.length || changed.length || removed.length) {
              setNewIds(added)
              setRecentIds([...added, ...changed])
              const summary = [
                added.length && `${added.length} new ${added.length === 1 ? "report" : "reports"}`,
                changed.length && `${changed.length} updated`,
                removed.length && `${removed.length} no longer in this snapshot`,
              ].filter(Boolean).join(" · ")
              setAnnouncement(`Inbox updated. ${summary}`)
              for (const id of [...added, ...changed]) {
                const report = result.reports.find(item => item.id === id)!
                addNotification(accountId, added.includes(id) ? "New incident report" : "Incident report updated", `${report.category} · ${report.area}.`, { reportId: report.id })
              }
            }
          }
          previousReports.current = snapshot
          if (connectionInterrupted.current) {
            connectionInterrupted.current = false
          }
          setReports(result.reports)
          setError("")
          setSynced(new Date())
          setSelectedId(previous => result.reports.some(report => report.id === previous) ? previous : result.reports[0]?.id ?? null)
        }
      } catch (error) {
        if (active) {
          if (!connectionInterrupted.current) {
            connectionInterrupted.current = true
          }
          failures = Math.min(failures + 1, 4)
          setError(error instanceof Error ? error.message : "Could not load the dispatcher inbox.")
        }
      } finally {
        fetching = false
        if (active) {
          setLoading(false)
          if (refreshAgain) { refreshAgain = false; void refresh() }
          else schedule()
        }
      }
    }
    const visible = () => { if (document.hidden) clearTimeout(timer); else void refresh() }
    const connected = () => { setOffline(false); failures = 0; void refresh() }
    const disconnected = () => {
      setOffline(true)
      setLoading(false)
      clearTimeout(timer)
      if (!connectionInterrupted.current) {
        connectionInterrupted.current = true
      }
    }
    if (navigator.onLine) void refresh()
    else setLoading(false)
    document.addEventListener("visibilitychange", visible)
    window.addEventListener("online", connected)
    window.addEventListener("offline", disconnected)
    return () => {
      active = false
      controller.abort()
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", visible)
      window.removeEventListener("online", connected)
      window.removeEventListener("offline", disconnected)
    }
  }, [refreshKey, accountId])

  useEffect(() => {
    if (!recentIds.length && !newIds.length) return
    const timer = window.setTimeout(() => { setRecentIds([]); setNewIds([]) }, 5000)
    return () => clearTimeout(timer)
  }, [recentIds, newIds])

  const selectedPlace = junctions.find(place => place.id === location)
  const query = search.trim().toLowerCase()
  const filtered = reports.filter(report =>
    (category === "all" || report.category === category)
    && (location === null || report.location === location || report.area === selectedPlace?.name)
    && (!query || [report.id, report.category, report.area, report.description ?? ""].some(value => value.toLowerCase().includes(query))),
  ).sort((a, b) => order === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt))
  const selected = filtered.find(report => report.id === selectedId) ?? filtered[0]
  const dispatchReport = reports.find(report => report.id === selectedId) ?? selected ?? reports[0]
  const hasFilters = Boolean(query) || category !== "all" || location !== null
  const clearFilters = () => { setSearch(""); setCategory("all"); setLocation(null) }
  const refresh = () => { setLoading(true); setRefreshKey(key => key + 1) }
  const selectReport = (report: Report) => {
    setSelectedId(report.id)
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        document.getElementById("dispatcher-detail")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })
        document.getElementById("selected-report-title")?.focus({ preventScroll: true })
      })
    }
  }
  const represented = new Set(reports.map(report => report.area)).size
  const people = reports.reduce((total, report) => total + (report.people ?? 0), 0)
  const openDispatch = (report: Report) => {
    setSelectedId(report.id)
    setView("dispatch")
    requestAnimationFrame(() => document.getElementById("dispatch-console-title")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }))
  }
  const onDispatched = (confirmed: Report[]) => {
    setDispatchReceipt(confirmed)
    setReports(previous => previous.filter(report => !confirmed.some(item => item.id === report.id)))
    setView("inbox")
    setSelectedId(null)
    setLoading(true)
    setRefreshKey(key => key + 1)
    for (const report of confirmed) addNotification(accountId, "Dispatch confirmed", `${report.category} · ${report.vehicles?.join(", ") || "Response recorded"}.`, { reportId: report.id, eventKey: `dispatch:${report.id}:${report.dispatchedAt}` })
    setAnnouncement(`Dispatch confirmed for ${confirmed.length} ${confirmed.length === 1 ? "report" : "reports"}.`)
  }

  return (
    <main className="dashboard dispatcher-page flex-1 px-5 py-8 sm:px-10 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><span className="dispatcher-role rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium">Dispatcher</span><span className="text-xs text-mute">Authorized control-room access</span></div>
          <AccountActions onSwitchAccount={onSwitchAccount} onSignOut={onSignOut} busy={signingOut} />
        </div>
        {signOutError && <p role="alert" className="mb-5 rounded-xl border border-line bg-white/60 p-4 text-sm">{signOutError}</p>}

        <section className="dispatcher-intro card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div><p className="mb-3 text-xs uppercase tracking-widest text-mute">ResqNet / Control room</p><h1 ref={heading} tabIndex={-1} className="font-brand text-4xl font-medium tracking-tight outline-none sm:text-5xl">A clear view.<br />A considered next step.</h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-mute">Review incoming incidents, understand the situation, and keep every reported detail in view.</p></div>
          </div>
          <dl className="dispatcher-metrics mt-7 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
            {([
              [synced ? reports.length : null, "Pending reports", "Saved and awaiting assignment", "M5 5h14v14H5zM8 9h8M8 12h8M8 15h5"],
              [synced ? people : null, "People reported affected", "Sum of the loaded reports", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"],
              [synced ? represented : null, "Locations represented", "Junctions with pending incidents", "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM12 7v6M9 10h6"],
            ] as const).map(([value, label, hint, icon]) => <div key={label} className="dispatcher-metric flex min-w-0 flex-col rounded-2xl border border-white bg-white/45 p-4"><dt className="flex items-center gap-2 text-xs text-mute"><svg aria-hidden="true" className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>{label}</dt><dd className="mt-3 font-brand text-4xl font-medium tracking-tight tabular-nums"><AnimatedNumber value={value} /><span className="mt-3 block font-sans text-xs font-normal tracking-normal text-mute">{hint}</span></dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-mute">Snapshot of the latest 50 pending reports{offline || error ? " · last successfully synced data" : ""}. Totals are not a count of unique people.</p>
        </section>

        <div className="dispatcher-toolbar my-6">
          <div className="dispatcher-tabs rounded-full border border-white bg-white/50 p-1" aria-label="Workspace view">
            {(["inbox", "dispatch", "network"] as const).map(value => <button key={value} type="button" onClick={() => setView(value)} aria-pressed={view === value} className={`feed-scope rounded-full px-3 text-xs font-medium sm:px-5 sm:text-sm ${view === value ? "bg-ink text-white" : "text-mute hover:text-ink"}`}>{value === "inbox" ? "Incoming reports" : value === "dispatch" ? "Dispatch controls" : "Network overview"}</button>)}
          </div>
          <button type="button" onClick={refresh} disabled={loading || offline} className="dispatcher-refresh home-action inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/70 px-5 text-sm font-medium disabled:opacity-50"><svg aria-hidden="true" className={`size-3.5 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" /></svg>{loading ? "Refreshing…" : "Refresh inbox"}</button>
        </div>
        <p role="status" className="sr-only">{announcement}</p>
        {offline && <p role="status" className="mb-5 rounded-2xl border border-line bg-white/70 p-4 text-sm">You’re offline. Keeping the last loaded reports in view; updates will resume when the connection returns.</p>}
        {error && <div role="alert" className="mb-5 rounded-2xl border border-line bg-white/70 p-4 text-sm"><p>{error}</p><p className="mt-1 text-xs text-mute">{synced ? "Showing the last successfully loaded reports. They may be out of date." : "The inbox has not loaded. This does not mean there are no reports."}</p></div>}
        {dispatchReceipt.length > 0 && <section className="card mb-6 rounded-3xl p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-brand text-2xl font-medium">Dispatch confirmed</h2><button type="button" onClick={() => setDispatchReceipt([])} className="text-xs font-medium underline underline-offset-4">Dismiss confirmation</button></div><div className="grid gap-3 sm:grid-cols-2">{dispatchReceipt.map(report => <div key={report.id}><p className="mb-2 text-sm font-medium">{report.category} · {report.dispatchDestination?.name ?? report.area}</p><ReportResponse report={report} /></div>)}</div></section>}

        {view === "dispatch" ? <DispatchConsole key={dispatchReport?.id ?? "empty"} reports={reports} report={dispatchReport} stale={Boolean(error) || offline || !synced} onSelectReport={setSelectedId} onDispatched={onDispatched} /> : view === "network" ? (
          <section aria-labelledby="network-title" className="dispatcher-network grid items-start gap-6 lg:grid-cols-2">
            <div className="card rounded-3xl p-5 sm:p-7"><h2 id="network-title" className="mb-2 font-brand text-2xl font-medium tracking-tight">The incident network</h2><p className="mb-5 text-sm leading-relaxed text-mute">Select a junction to filter incoming reports. This illustrated network does not show vehicle positions or calculated routes.</p><CityMap selected={location} onSelect={id => { setLocation(id); setView("inbox") }} disabled={false} mode="explore" /></div>
            <div className="card rounded-3xl p-5 sm:p-7"><h3 className="font-brand text-xl font-medium">Reports by junction</h3><p className="mb-5 mt-2 text-xs text-mute">Counts reflect the latest 50 pending reports{error ? " · sync interrupted" : ""}.</p><ul className="divide-y divide-line">{junctions.map(place => <li key={place.id}><button type="button" onClick={() => { setLocation(place.id); setView("inbox") }} className="dispatcher-junction flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left text-sm"><span><span className="mr-3 font-mono text-xs text-mute">{String(place.id).padStart(2, "0")}</span>{place.name}</span><span className="rounded-full bg-white px-2.5 py-1 text-xs tabular-nums">{synced ? reports.filter(report => report.location === place.id || report.area === place.name).length : "—"}</span></button></li>)}</ul></div>
          </section>
        ) : (
          <div className="dispatcher-workspace grid items-start gap-6 lg:grid-cols-2">
            <section id="dispatcher-queue" aria-labelledby="queue-title" className="card overflow-hidden rounded-3xl">
              <div className="border-b border-line p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3"><h2 id="queue-title" className="font-brand text-xl font-medium tracking-tight">Awaiting assignment</h2><span className="rounded-full bg-white/80 px-3 py-1 text-xs tabular-nums"><AnimatedNumber value={synced ? filtered.length : null} /></span></div>
                <label className="block"><span className="sr-only">Search dispatcher reports</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search incident or location…" className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" /></label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <select aria-label="Dispatcher emergency filter" value={category} onChange={event => setCategory(event.target.value)} className="min-w-0 rounded-xl border border-line bg-white/60 px-3 py-2.5 text-xs"><option value="all">All emergency types</option>{categories.map(name => <option key={name}>{name}</option>)}</select>
                  <select aria-label="Report order" value={order} onChange={event => setOrder(event.target.value as typeof order)} className="min-w-0 rounded-xl border border-line bg-white/60 px-3 py-2.5 text-xs"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
                </div>
                {hasFilters && <div className="mt-3 flex items-center justify-between gap-2 text-xs"><span className="text-mute">{selectedPlace ? selectedPlace.name : "Filtered reports"}</span><button type="button" onClick={clearFilters} className="font-medium underline underline-offset-4">Clear filters</button></div>}
              </div>
              {loading && !synced ? <div role="status" className="space-y-3 p-5"><span className="sr-only">Loading dispatcher reports…</span>{[0, 1, 2].map(index => <div key={index} aria-hidden="true" className="report-skeleton h-28 rounded-2xl border border-white bg-white/60" />)}</div> : filtered.length === 0 ? (
                <div className="px-6 py-14 text-center"><p className="font-brand text-xl font-medium">{error && !synced ? "Inbox unavailable" : hasFilters ? "No matching incidents" : "All clear in the inbox"}</p><p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-mute">{error && !synced ? "Try refreshing the inbox to reconnect." : hasFilters ? "Try a different emergency type, junction, or search term." : "No pending reports in the loaded inbox. New saved submissions will appear here."}</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-5 text-sm font-medium underline underline-offset-4">Reset filters</button>}</div>
              ) : <ul className="dispatcher-queue max-h-96 space-y-2 overflow-y-auto p-3 lg:max-h-screen">{filtered.map(report => (
                <li key={report.id}><button type="button" data-recent={recentIds.includes(report.id)} aria-pressed={selected?.id === report.id} aria-controls="dispatcher-detail" onClick={() => selectReport(report)} className="dispatcher-queue-item block w-full rounded-2xl border border-transparent p-4 text-left">
                  <span className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-medium text-mute">Awaiting dispatcher{newIds.includes(report.id) && <span className="rounded-full bg-ink px-2 py-0.5 text-white">New</span>}</span><time dateTime={report.createdAt} className="text-xs text-mute">{new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></span>
                  <span className="mt-3 block text-base font-semibold">{report.category}</span><span className="mt-1 block text-sm text-mute">{report.area}</span>
                  <span className="mt-4 flex flex-wrap items-center gap-3 text-xs"><span className="rounded-full border border-line bg-white/80 px-2.5 py-1">Reported severity {report.severity} / 10</span><span className="text-mute">{report.people ?? "Unknown"} affected</span></span>
                </button></li>
              ))}</ul>}
              <p className="border-t border-line px-5 py-4 text-xs leading-relaxed text-mute">Latest 50 pending reports · Ordered by receipt time.</p>
            </section>
            <div className="min-w-0 lg:sticky lg:top-6">
              {selected ? <DispatcherReportDetail key={selected.id} report={selected} stale={Boolean(error) || offline} onPrepareDispatch={() => openDispatch(selected)} /> : <div className="card flex min-h-80 flex-col items-center justify-center rounded-3xl p-8 text-center"><span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-white bg-white/70"><svg aria-hidden="true" className="size-6 text-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></svg></span><h2 className="font-brand text-xl font-medium">Room for the full picture</h2><p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">Select an incoming report to review its situation, precautions, and dispatch readiness.</p></div>}
            </div>
          </div>
        )}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-mute"><span>ResqNet · Dispatcher workspace</span><span>{offline ? "Offline · last loaded data" : synced ? `Last updated ${synced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for reports"}</span></footer>
      </div>
    </main>
  )
}
