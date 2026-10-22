import { supabase } from "./supabase"
import { projectId, publicAnonKey } from "../../utils/supabase/info"
import type { Report, VehicleAssignment } from "./reports"

export type DispatchCommand = {
  requestId: string
  mode: "selected" | "next" | "all" | "resolve"
  reportId?: string
  destination?: number
  selectionMode: "automatic" | "manual"
  requestedVehicles?: Record<string, number>
  adjustmentReason?: string
  notes?: string
}
export type DispatchResult = {
  reportId: string
  status: "REPORTED" | "DISPATCHED" | "RESOLVED"
  category: string
  priority: number
  destination: { id: number; name: string }
  precaution: string
  assignments: VehicleAssignment[]
  missingTypes: string[]
  vehicles?: string[]
}
export type DispatchPreview = {
  previewId: string
  expiresAt: string
  requestId: string
  results: DispatchResult[]
  canDispatch: boolean
}

export class DispatchError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function dispatchRequest<T>(path: "preview" | "commit", body: unknown): Promise<T> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new DispatchError("Please sign in again.", 401)
  let response: Response
  try {
    response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-acec273b/simulation/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${publicAnonKey}`, apikey: publicAnonKey, "X-User-Token": data.session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new DispatchError(path === "commit" ? "We couldn’t confirm dispatch. Retry this same submission; it will not dispatch twice." : "The response could not be calculated. Your plan has not been dispatched.", 0)
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new DispatchError(payload?.error ?? "Dispatch is not available right now. No result has been confirmed.", response.status)
  return payload as T
}

export function confirmDispatch(preview: DispatchPreview) {
  return dispatchRequest<{ reports: Report[]; version: number; requestId: string }>("commit", {
    previewId: preview.previewId, requestId: preview.requestId,
  })
}

export function previewSimulation(command: DispatchCommand): Promise<DispatchPreview> {
  return dispatchRequest<DispatchPreview>("preview", command)
}
