import type { Incident } from "../types"

type IncidentDraft = Pick<
  Incident,
  "location" | "type" | "severity" | "people"
>

const clientIdKey = "resqnet.client-id.v1"

function clientId() {
  let id = sessionStorage.getItem(clientIdKey)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(clientIdKey, id)
  }
  return id
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  headers.set("X-Client-Id", clientId())

  let response: Response
  try {
    response = await fetch(path, { ...options, headers })
  } catch {
    throw new Error("The RESQNET server could not be reached. Check your connection and try again.")
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function getIncidents() {
  return request<Incident[]>("/api/incidents")
}

export function getDispatcherIncidents() {
  return request<Incident[]>("/api/incidents?scope=dispatcher")
}

export function createIncident(incident: IncidentDraft) {
  return request<Incident>(
    "/api/incidents",
    { method: "POST", body: JSON.stringify(incident) },
  )
}

export function updateIncident(id: number, incident: IncidentDraft) {
  return request<Incident>(
    `/api/incidents/${id}`,
    { method: "PUT", body: JSON.stringify(incident) },
  )
}

export function requestHelp() {
  return request<Incident[]>("/api/incidents/request", { method: "POST" })
}

export function removeIncident(id: number) {
  return request<void>(`/api/incidents/${id}`, { method: "DELETE" })
}

export function dispatchIncident(
  id: number,
  plan: Pick<Incident, "assignments" | "missingTypes">,
) {
  return request<Incident>(
    `/api/incidents/${id}/dispatch`,
    { method: "POST", body: JSON.stringify(plan) },
  )
}
