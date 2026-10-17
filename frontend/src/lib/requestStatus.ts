import type { DispatchReport } from "../dispatch"

export type RequestStage = "attention" | "ongoing" | "arrived"

export function requestStage(
  report: DispatchReport,
  now: number,
): RequestStage {
  if (report.state === "requested" || (report.missingTypes?.length ?? 0) > 0) {
    return "attention"
  }
  const assignments = report.assignments ?? []
  if (
    report.state !== "dispatched" ||
    assignments.length === 0 ||
    !report.dispatchedAt ||
    !Number.isFinite(report.dispatchedAt)
  ) {
    return "ongoing"
  }
  const elapsed = Math.max(0, (now - report.dispatchedAt) / 1000)
  return assignments.every(
    (assignment) =>
      !assignment.direct &&
      assignment.seconds !== null &&
      elapsed >= assignment.seconds,
  )
    ? "arrived"
    : "ongoing"
}

export function groupRequests(reports: DispatchReport[], now: number) {
  const groups: Record<RequestStage, DispatchReport[]> = {
    attention: [],
    ongoing: [],
    arrived: [],
  }
  for (const report of [...reports].sort((a, b) => b.id - a.id)) {
    if (report.state) groups[requestStage(report, now)].push(report)
  }
  return groups
}
