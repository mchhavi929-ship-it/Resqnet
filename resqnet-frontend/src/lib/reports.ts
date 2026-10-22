import { supabase } from "./supabase"
import { projectId, publicAnonKey } from "../../utils/supabase/info"
import { incidentTypes } from "../../shared/resqnet"

export const categories = incidentTypes.map(item => item.name)
export const severities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export function reportStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "REPORTED": return "Awaiting dispatcher"
    case "DISPATCHED": return "Team assigned"
    case "RESOLVED": return "Incident cleared"
    default: return status
  }
}
export type ReportDraft = {
  requestId: string
  type: number
  location: number
  severity: number
  people: number
  situation: number
  situationVersion: number
  customDescription?: string
}
export type VehicleAssignment = {
  id: number
  name: string
  type: string
  from: number
  etaSeconds: number
  directFlight: boolean
  route: { id: number; name: string }[]
}
export type Report = {
  id: string
  category: string
  severity: number | string
  people?: number
  type?: number
  location?: number | { lat: number; lng: number }
  description?: string
  precaution?: string
  vehicles?: string[]
  assignments?: VehicleAssignment[]
  dispatchDestination?: { id: number; name: string }
  priority?: number
  missingTypes?: string[]
  dispatchedAt?: string
  resolvedAt?: string
  simulatedResponse?: boolean
  scheduledClearAt?: string
  isMine?: boolean
  area: string
  status: string
  createdAt: string
}

export async function reportsRequest<T>(method = "GET", body?: unknown, signal?: AbortSignal, scope?: "mine" | "dispatcher"): Promise<T> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error("Please sign in again to access reports.")
  let response: Response
  try {
    response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-acec273b/reports${scope ? `?scope=${scope}` : ""}`,
    {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        apikey: publicAnonKey,
        "X-User-Token": data.session.access_token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    )
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(method === "POST"
      ? "We couldn’t confirm that your report was sent. Check your connection and try again. Your details are still here."
      : "We couldn’t connect to the report service. Check your connection and try again.")
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(response.status === 404 || response.status >= 500
    ? "We can’t reach the report service right now. Please try again shortly."
    : payload?.error ?? "The request could not be completed. Please try again.")
  return payload as T
}
