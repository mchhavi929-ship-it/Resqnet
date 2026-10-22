import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { reportsRequest, type Report } from "./lib/reports"
import { addNotification } from "./lib/notifications"
import { responseFingerprint } from "./lib/report-response"
import { reconcileReports, responseNotices } from "./lib/report-sync"

type Snapshot = { owner: string | null; reports: Report[]; loading: boolean; error: string; updatedAt: Date | null }
const ReportUpdatesContext = createContext<{
  reports: Report[]; loading: boolean; error: string; updatedAt: Date | null; trackSaved: (report: Report) => void; refresh: () => void
}>({ reports: [], loading: true, error: "", updatedAt: null, trackSaved: () => {}, refresh: () => {} })

function readSeen(accountId: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`resqnet.report-responses.v1:${accountId}`) ?? "{}")
    return value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).filter(([, fingerprint]) => typeof fingerprint === "string").slice(-100))
      : {}
  } catch { return {} }
}

export default function ReportUpdatesProvider({ accountId, enabled, children }: {
  accountId: string | null; enabled: boolean; children: ReactNode
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ owner: null, reports: [], loading: true, error: "", updatedAt: null })
  const seen = useRef<{ owner: string | null; values: Record<string, string> }>({ owner: null, values: {} })
  const getSeen = useCallback(() => {
    if (seen.current.owner !== accountId) seen.current = { owner: accountId, values: accountId ? readSeen(accountId) : {} }
    return seen.current.values
  }, [accountId])
  const remember = useCallback((report: Report) => {
    if (!accountId) return
    const fingerprint = responseFingerprint(report)
    if (getSeen()[report.id] === fingerprint) return
    const values = { ...getSeen(), [report.id]: fingerprint }
    const bounded = Object.fromEntries(Object.entries(values).slice(-100))
    seen.current = { owner: accountId, values: bounded }
    try { localStorage.setItem(`resqnet.report-responses.v1:${accountId}`, JSON.stringify(bounded)) } catch { /* Session memory still prevents duplicate notices. */ }
  }, [accountId, getSeen])
  const trackSaved = useCallback((report: Report) => {
    if (!accountId) return
    remember(report)
    setSnapshot(previous => ({ owner: accountId, reports: [report, ...(previous.owner === accountId ? previous.reports : []).filter(item => item.id !== report.id)].slice(0, 50), loading: false, error: "", updatedAt: new Date() }))
    addNotification(accountId, "Report received", `${report.category} · ${report.area}.`, { reportId: report.id, eventKey: `received:${report.id}` })
  }, [accountId, remember])

  useEffect(() => {
    if (!accountId || !enabled) return
    let active = true
    let fetching = false
    let timer: number | undefined
    const controller = new AbortController()
    const refresh = async () => {
      if (fetching || !active || document.hidden || !navigator.onLine) return
      fetching = true
      clearTimeout(timer)
      let failed = false
      try {
        // Only the authenticated owner's reports may generate their notifications.
        const result = await reportsRequest<{ reports: Report[] }>("GET", undefined, controller.signal, "mine")
        if (!active) return
        for (const report of result.reports) {
          const previous = getSeen()[report.id]
          for (const notice of responseNotices(report, previous)) {
            addNotification(accountId, notice.title, notice.body, { reportId: report.id, eventKey: notice.eventKey })
          }
          remember(report)
        }
        setSnapshot(previous => ({ owner: accountId,
          reports: reconcileReports(previous.owner === accountId ? previous.reports : [], result.reports),
          loading: false, error: "", updatedAt: new Date() }))
      } catch (error) {
        failed = true
        if (active) setSnapshot(previous => ({ owner: accountId, reports: previous.owner === accountId ? previous.reports : [], loading: false, updatedAt: previous.owner === accountId ? previous.updatedAt : null, error: error instanceof Error ? error.message : "Could not refresh report updates." }))
      } finally {
        fetching = false
        if (active && !document.hidden && navigator.onLine) timer = window.setTimeout(() => void refresh(), failed ? 10000 : 3000)
      }
    }
    const resume = () => { if (!document.hidden) void refresh(); else clearTimeout(timer) }
    const pause = () => {
      clearTimeout(timer)
      setSnapshot(previous => ({ owner: accountId, reports: previous.owner === accountId ? previous.reports : [], updatedAt: previous.owner === accountId ? previous.updatedAt : null, loading: false, error: "You’re offline. Showing the last loaded report details until the connection returns." }))
    }
    const manualRefresh = () => {
      if (!navigator.onLine || document.hidden) return
      setSnapshot(previous => ({ ...previous, loading: true }))
      void refresh()
    }
    if (navigator.onLine) void refresh()
    else pause()
    document.addEventListener("visibilitychange", resume)
    window.addEventListener("online", resume)
    window.addEventListener("offline", pause)
    window.addEventListener("resqnet:refresh-my-reports", manualRefresh)
    return () => { active = false; clearTimeout(timer); controller.abort(); document.removeEventListener("visibilitychange", resume); window.removeEventListener("online", resume); window.removeEventListener("offline", pause); window.removeEventListener("resqnet:refresh-my-reports", manualRefresh) }
  }, [accountId, enabled, getSeen, remember])

  const current = snapshot.owner === accountId ? snapshot : { reports: [], loading: true, error: "", updatedAt: null }
  return <ReportUpdatesContext.Provider value={{ reports: current.reports, loading: current.loading, error: current.error, updatedAt: current.updatedAt, trackSaved, refresh: () => { window.dispatchEvent(new Event("resqnet:refresh-my-reports")) } }}>{children}</ReportUpdatesContext.Provider>
}

export function useReportUpdates() { return useContext(ReportUpdatesContext) }
