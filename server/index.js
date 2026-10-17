import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))
const frontendDirectory = path.resolve(directory, "../frontend/dist")
const port = Number.parseInt(process.env.PORT ?? "10000", 10)
const clientIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const junctionCount = 10
const incidentTypes = new Set([
  "Fire",
  "Flood",
  "Earthquake",
  "Road accident",
  "Building collapse",
  "Storm",
  "Hazardous incident",
])
const maxIncidents = 5000
const maxIncidentsPerClient = 50
const fleet = new Map([
  ["Ambulance-A1", "Ambulance"],
  ["Ambulance-A2", "Ambulance"],
  ["FireTruck-F1", "Fire truck"],
  ["Police-P1", "Police"],
  ["Boat-B1", "Rescue boat"],
  ["Helicopter-H1", "Helicopter"],
])
const knownVehicleTypes = new Set([...fleet.values(), "Heavy rescue"])
const incidents = new Map()
let nextId = 1

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.")
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  })
  response.end(JSON.stringify(payload))
}

function readClientId(request) {
  const clientId = request.headers["x-client-id"]
  return typeof clientId === "string" && clientIdPattern.test(clientId)
    ? clientId
    : null
}

async function readBody(request) {
  const chunks = []
  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > 64 * 1024) {
      throw Object.assign(new Error("Request body is too large."), {
        status: 413,
      })
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), {
      status: 400,
    })
  }
}

function validateIncident(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Incident must be a JSON object."
  }
  if (
    !Number.isInteger(value.location) ||
    value.location < 0 ||
    value.location >= junctionCount
  ) {
    return "Location must be a valid city junction."
  }
  if (!incidentTypes.has(value.type)) return "Incident type is not supported."
  if (
    !Number.isInteger(value.severity) ||
    value.severity < 1 ||
    value.severity > 10
  ) {
    return "Severity must be an integer from 1 to 10."
  }
  if (
    !Number.isSafeInteger(value.people) ||
    value.people < 0 ||
    value.people > 100000
  ) {
    return "People affected must be an integer from 0 to 100000."
  }
  return null
}

function publicIncident(incident) {
  const { ownerId, ...result } = incident
  return result
}

async function serveStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 404, { error: "Not found." })
    return
  }

  let requestedPath
  try {
    requestedPath = decodeURIComponent(pathname)
  } catch {
    sendJson(response, 400, { error: "Invalid URL path." })
    return
  }

  const assetPath = path.resolve(frontendDirectory, `.${requestedPath}`)
  if (!assetPath.startsWith(`${frontendDirectory}${path.sep}`) &&
      assetPath !== frontendDirectory) {
    sendJson(response, 404, { error: "Not found." })
    return
  }

  let filePath = assetPath
  try {
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html")
  } catch {
    if (path.extname(requestedPath)) {
      sendJson(response, 404, { error: "Not found." })
      return
    }
    filePath = path.join(frontendDirectory, "index.html")
  }

  try {
    const content = await readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()
    const contentTypes = {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".ico": "image/x-icon",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    })
    response.end(request.method === "HEAD" ? undefined : content)
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "Not found." })
      return
    }
    throw error
  }
}

async function handleApi(request, response, url) {
  const { pathname, searchParams } = url

  if (pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { status: "ok" })
    return
  }

  if (pathname === "/api/incidents" && request.method === "GET") {
    if (searchParams.get("scope") === "dispatcher") {
      sendJson(
        response,
        200,
        [...incidents.values()].map(publicIncident),
      )
      return
    }

    const clientId = readClientId(request)
    if (!clientId) {
      sendJson(response, 400, { error: "A valid client session is required." })
      return
    }
    sendJson(
      response,
      200,
      [...incidents.values()]
        .filter((incident) => incident.ownerId === clientId)
        .map(publicIncident),
    )
    return
  }

  if (pathname === "/api/incidents" && request.method === "POST") {
    const clientId = readClientId(request)
    if (!clientId) {
      sendJson(response, 400, { error: "A valid client session is required." })
      return
    }
    const body = await readBody(request)
    const validationError = validateIncident(body)
    if (validationError) {
      sendJson(response, 400, { error: validationError })
      return
    }
    const clientIncidentCount = [...incidents.values()].filter(
      (incident) => incident.ownerId === clientId,
    ).length
    if (
      incidents.size >= maxIncidents ||
      clientIncidentCount >= maxIncidentsPerClient
    ) {
      sendJson(response, 429, {
        error: "The temporary incident queue has reached its capacity.",
      })
      return
    }

    const incident = {
      id: nextId++,
      location: body.location,
      type: body.type,
      severity: body.severity,
      people: body.people,
      state: undefined,
      assignments: [],
      missingTypes: [],
      dispatchedAt: undefined,
      ownerId: clientId,
    }
    incidents.set(incident.id, incident)
    sendJson(response, 201, publicIncident(incident))
    return
  }

  if (pathname === "/api/incidents/request" && request.method === "POST") {
    const clientId = readClientId(request)
    if (!clientId) {
      sendJson(response, 400, { error: "A valid client session is required." })
      return
    }
    for (const incident of incidents.values()) {
      if (incident.ownerId === clientId && !incident.state) {
        incident.state = "requested"
      }
    }
    sendJson(
      response,
      200,
      [...incidents.values()]
        .filter((incident) => incident.ownerId === clientId)
        .map(publicIncident),
    )
    return
  }

  const incidentRoute =
    /^\/api\/incidents\/(\d+)(?:\/dispatch)?$/.exec(pathname)
  if (!incidentRoute) {
    sendJson(response, 404, { error: "Not found." })
    return
  }

  const id = Number(incidentRoute[1])
  const incident = incidents.get(id)
  if (!incident) {
    sendJson(response, 404, { error: "Incident not found." })
    return
  }
  const isDispatchRoute = pathname.endsWith("/dispatch")

  if (isDispatchRoute && request.method === "POST") {
    if (incident.state !== "requested") {
      sendJson(response, 409, {
        error: "Only requested incidents can be dispatched.",
      })
      return
    }

    const body = await readBody(request)
    if (
      !body ||
      typeof body !== "object" ||
      !Array.isArray(body.assignments) ||
      body.assignments.length === 0
    ) {
      sendJson(response, 400, {
        error: "At least one vehicle assignment is required.",
      })
      return
    }
    if (incident.state !== "requested") {
      sendJson(response, 409, {
        error: "This incident was already updated by another dispatcher.",
      })
      return
    }
    const assignedVehicles = new Set()
    for (const assignment of body.assignments) {
      if (
        !assignment ||
        typeof assignment !== "object" ||
        fleet.get(assignment.vehicle) !== assignment.type ||
        assignedVehicles.has(assignment.vehicle) ||
        !Array.isArray(assignment.route) ||
        assignment.route.length < 1 ||
        assignment.route.length > junctionCount ||
        !assignment.route.every(
          (junction) =>
            Number.isInteger(junction) &&
            junction >= 0 &&
            junction < junctionCount,
        ) ||
        typeof assignment.direct !== "boolean" ||
        (assignment.direct
          ? assignment.type !== "Helicopter" || assignment.seconds !== null
          : !Number.isFinite(assignment.seconds) || assignment.seconds < 0)
      ) {
        sendJson(response, 400, { error: "Vehicle assignment is invalid." })
        return
      }
      assignedVehicles.add(assignment.vehicle)
    }
    const alreadyAssigned = new Set(
      [...incidents.values()]
        .filter((other) => other.id !== id && other.state === "dispatched")
        .flatMap((other) =>
          other.assignments.map((assignment) => assignment.vehicle),
        ),
    )
    if ([...assignedVehicles].some((vehicle) => alreadyAssigned.has(vehicle))) {
      sendJson(response, 409, {
        error: "One or more vehicles have already been assigned to another incident.",
      })
      return
    }
    if (
      !Array.isArray(body.missingTypes) ||
      !body.missingTypes.every((type) => knownVehicleTypes.has(type))
    ) {
      sendJson(response, 400, { error: "Missing vehicle types are invalid." })
      return
    }

    incident.state = "dispatched"
    incident.assignments = body.assignments
    incident.missingTypes = body.missingTypes
    incident.dispatchedAt = Date.now()
    sendJson(response, 200, publicIncident(incident))
    return
  }

  if (request.method === "PUT" && !isDispatchRoute) {
    const clientId = readClientId(request)
    if (!clientId || incident.ownerId !== clientId) {
      sendJson(response, 404, { error: "Incident not found." })
      return
    }
    if (incident.state) {
      sendJson(response, 409, { error: "Submitted incidents can no longer be edited." })
      return
    }
    const body = await readBody(request)
    if (incident.state) {
      sendJson(response, 409, { error: "This incident can no longer be edited." })
      return
    }
    const validationError = validateIncident(body)
    if (validationError) {
      sendJson(response, 400, { error: validationError })
      return
    }
    incident.location = body.location
    incident.type = body.type
    incident.severity = body.severity
    incident.people = body.people
    sendJson(response, 200, publicIncident(incident))
    return
  }

  if (request.method === "DELETE" && !isDispatchRoute) {
    const clientId = readClientId(request)
    if (!clientId || incident.ownerId !== clientId) {
      sendJson(response, 404, { error: "Incident not found." })
      return
    }
    if (incident.state) {
      sendJson(response, 409, { error: "Submitted incidents can no longer be removed." })
      return
    }
    incidents.delete(id)
    response.writeHead(204, { "Cache-Control": "no-store" })
    response.end()
    return
  }

  sendJson(response, 405, { error: "Method not allowed." })
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`)
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url)
    } else {
      await serveStatic(request, response, url.pathname)
    }
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500
    if (status === 500) console.error("Request failed:", error)
    if (!response.headersSent) {
      sendJson(
        response,
        status,
        { error: status === 500 ? "Internal server error." : error.message },
      )
    } else {
      response.destroy(error)
    }
  }
})

server.listen(port, "0.0.0.0", () => {
  console.log(`RESQNET server listening on port ${port}`)
})
