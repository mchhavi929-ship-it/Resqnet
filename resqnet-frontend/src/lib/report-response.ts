import type { Report } from "./reports"

export function vehicleCountSummary(types: readonly string[]): string {
  const counts = new Map<string, number>()
  for (const type of types) counts.set(type, (counts.get(type) ?? 0) + 1)
  return `${types.length} ${types.length === 1 ? "vehicle" : "vehicles"} · ${[...counts].map(([type, count]) => `${count} × ${type}`).join(", ")}`
}

export function assignedVehicles(report: Report): string[] {
  if (!["DISPATCHED", "RESOLVED"].includes(report.status.toUpperCase())) return []
  return Array.isArray(report.vehicles) ? report.vehicles.filter((name): name is string => typeof name === "string" && name.trim().length > 0) : []
}

export function responseFingerprint(report: Report): string {
  return JSON.stringify([report.status.toUpperCase(), assignedVehicles(report)])
}
