import type { Report } from "./reports"

export type ReportSection = "active" | "cleared"

export function reportsInSection(reports: Report[], section: ReportSection): Report[] {
  const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0
  return reports.filter(report => (report.status.toUpperCase() === "RESOLVED") === (section === "cleared"))
    .sort((a, b) => section === "cleared"
      ? time(b.resolvedAt) - time(a.resolvedAt) || time(b.createdAt) - time(a.createdAt)
      : time(b.createdAt) - time(a.createdAt))
}

export function newlyClearedReports(previous: Report[], incoming: Report[]): Report[] {
  const before = new Map(previous.map(report => [report.id, report.status.toUpperCase()]))
  return incoming.filter(report => report.status.toUpperCase() === "RESOLVED"
    && before.has(report.id) && before.get(report.id) !== "RESOLVED")
}
