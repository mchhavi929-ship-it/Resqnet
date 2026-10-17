import type { Incident } from "../types"
export const priorityScore = (incident: Incident) =>
  incident.severity * 10 + incident.people * 0.5
export const severityClass = (n: number) =>
  n <= 3 ? "low" : n <= 6 ? "moderate" : n <= 8 ? "serious" : "critical"
export const severityWord = (n: number) =>
  n <= 3 ? "Minor" : n <= 6 ? "Moderate" : n <= 8 ? "Serious" : "Critical"
