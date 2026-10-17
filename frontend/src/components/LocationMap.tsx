import { useEffect, useState } from "react"
import type { Incident } from "../types"
import { routeProgress } from "../dispatch"
import {
  junctions as desktopJunctions,
  compactJunctions,
  roads,
} from "../data/city"
import useCompactLayout from "../hooks/useCompactLayout"
import { severityClass, severityWord } from "../lib/incident"
export default function LocationMap({
  selected,
  onSelect,
  queue,
  detailed = false,
  responsePreparationSeconds = 0,
}: {
  selected: number | null
  onSelect: (id: number) => void
  queue: Incident[]
  detailed?: boolean
  responsePreparationSeconds?: number
}) {
  const compact = useCompactLayout()
  const junctions = compact ? compactJunctions : desktopJunctions
  const [hovered, setHovered] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!detailed) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [detailed])
  const active = detailed ? null : (selected ?? hovered)
  const trackedVehicles = detailed
    ? queue.flatMap((report) => {
        if (
          report.state !== "dispatched" ||
          typeof report.dispatchedAt !== "number" ||
          !Number.isFinite(report.dispatchedAt)
        ) {
          return []
        }
        const elapsed = Math.max(0, (now - report.dispatchedAt) / 1000)
        return (report.assignments ?? []).flatMap((assignment) => {
          if (
            assignment.direct ||
            assignment.seconds === null ||
            assignment.route.length === 0
          ) {
            return []
          }
          const progress = routeProgress(
            assignment,
            elapsed,
            responsePreparationSeconds,
          )
          const from = junctions[progress.from]
          const to = junctions[progress.to]
          return [{
            vehicle: assignment.vehicle,
            x: from.x + (to.x - from.x) * progress.fraction,
            y: from.y + (to.y - from.y) * progress.fraction,
            arrived: progress.remaining === 0,
            preparing:
              progress.remaining !== 0 && elapsed < responsePreparationSeconds,
          }]
        })
      })
    : []
  // This unweighted connection only illustrates selection; dispatch routing is deferred.
  const connection: number[] = []
  if (active !== null) {
    const pending: number[][] = [[0]]
    const visited = new Set([0])
    while (pending.length) {
      const path = pending.shift()!
      const end = path[path.length - 1]
      if (end === active) {
        connection.push(...path)
        break
      }
      for (const [a, b] of roads) {
        const next = a === end ? b : b === end ? a : null
        if (next !== null && !visited.has(next)) {
          visited.add(next)
          pending.push([...path, next])
        }
      }
    }
  }
  return (
    <div
      className={`network-preview selection-network map-only-network ${
        detailed ? "dispatcher-map" : "reporter-map"
      } ${active !== null ? "has-connection" : ""}`}
    >
      <div className="network-layout">
        <div className="network-map">
          <div className="network-map-caption">
            <span className="mono">RESQNET / SCHEMATIC 01</span>
            <span>N ↑</span>
          </div>
          <div
            className="network-scroll"
            tabIndex={0}
            aria-label="Schematic city map; scroll sideways on a small screen"
          >
            <svg
              className="dispatch-map"
              viewBox={compact ? "0 0 315 350" : "-20 -15 570 415"}
              aria-label={
                detailed
                  ? "City map showing incident locations and moving dispatched ground vehicles."
                  : "Interactive city map. Select a junction to see its connection to Base Station."
              }
            >
              <defs>
                <pattern
                  id="network-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M20 0H0V20"
                    fill="none"
                    className="network-grid-line"
                  />
                </pattern>
              </defs>
              <rect
                x="-20"
                y="-15"
                width="570"
                height="415"
                fill="url(#network-grid)"
              />
              <g className="network-roads">
                {roads.map(([a, b], i) => (
                  <g key={i}>
                    <line
                      className="network-road"
                      x1={junctions[a].x}
                      y1={junctions[a].y}
                      x2={junctions[b].x}
                      y2={junctions[b].y}
                    />
                  </g>
                ))}
              </g>
              {connection.length > 1 && (
                <polyline
                  key={connection.join("-")}
                  className="selection-connection"
                  pathLength="1"
                  points={connection
                    .map((i) => `${junctions[i].x},${junctions[i].y}`)
                    .join(" ")}
                />
              )}

              {junctions.map((n, i) => {
                const localReports = queue.filter((q) => q.location === i)
                const incident = localReports.reduce(
                  (max, q) => Math.max(max, q.severity),
                  0,
                )
                return (
                  <g
                    key={n.name}
                    className={`network-node ${
                      incident
                        ? `has-incident sev-${severityClass(incident)}`
                        : ""
                    } ${selected === i ? "is-selected" : ""} ${
                      connection.includes(i) ? "is-connected" : ""
                    } ${i === 3 ? "hospital-city" : ""} ${
                      i === 9 ? "hospital-green" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${n.name}, junction ${i + 1}${
                      incident
                        ? `, ${localReports.length} ${
                            localReports.length === 1 ? "report" : "reports"
                          }, highest severity ${incident}, ${severityWord(incident)}`
                        : ""
                    }`}
                    aria-pressed={selected === i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                    onClick={() => onSelect(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(i)
                      }
                    }}
                  >
                    <rect
                      className="network-hit"
                      x={n.x - (compact ? 36 : 49)}
                      y={n.y - 24}
                      width={compact ? 72 : 98}
                      height={compact ? 94 : 75}
                      rx="10"
                    />
                    {selected === i && (
                      <circle
                        className="network-selected-ring"
                        cx={n.x}
                        cy={n.y}
                        r="23"
                      />
                    )}
                    {incident && detailed ? (
                      <>
                        <circle
                          className="incident-pulse"
                          cx={n.x}
                          cy={n.y}
                          r="17"
                        />
                        <circle
                          className="incident-marker"
                          cx={n.x}
                          cy={n.y}
                          r="12"
                        />
                        <text
                          className="incident-severity"
                          x={n.x}
                          y={n.y + 4}
                          textAnchor="middle"
                        >
                          {incident}
                        </text>
                        {localReports.length > 1 && (
                          <g className="map-report-count">
                            <circle cx={n.x + 14} cy={n.y - 14} r="8" />
                            <text x={n.x + 14} y={n.y - 11} textAnchor="middle">
                              {localReports.length}
                            </text>
                          </g>
                        )}
                      </>
                    ) : n.type === "base" ? (
                      <>
                        <rect
                          className="network-landmark-base"
                          x={n.x - 14}
                          y={n.y - 14}
                          width="28"
                          height="28"
                          rx="8"
                        />
                        <path
                          className="network-tower"
                          d={`M${n.x} ${n.y - 8}v16m-5 0h10m-9-3 4-7 4 7M${n.x - 7} ${n.y - 5}a9 9 0 0 0 0 9m14-9a9 9 0 0 1 0 9`}
                        />
                      </>
                    ) : n.type === "hospital" ? (
                      <>
                        <rect
                          className="network-hospital"
                          x={n.x - 13}
                          y={n.y - 13}
                          width="26"
                          height="26"
                          rx="8"
                        />
                        <path
                          className="network-cross"
                          d={`M${n.x - 5} ${n.y}h10M${n.x} ${n.y - 5}v10`}
                        />
                      </>
                    ) : (
                      <>
                        <circle
                          className="network-junction-shell"
                          cx={n.x}
                          cy={n.y}
                          r="8"
                        />
                        <circle
                          className="network-junction-dot"
                          cx={n.x}
                          cy={n.y}
                          r="3"
                        />
                      </>
                    )}
                    <text
                      className="network-node-label"
                      x={n.x}
                      y={n.y + 31}
                      textAnchor="middle"
                    >
                      {compact ? n.name.split(" ").map((word, index) => (
                            <tspan
                              key={index}
                              x={n.x}
                              dy={index === 0 ? 0 : 14}
                            >
                              {word}
                            </tspan>
                          )) : n.name}
                    </text>
                    <text
                      className={`network-node-id ${
                        incident && detailed ? "incident-word" : ""
                      }`}
                      x={n.x}
                      y={n.y + (compact ? 64 : 46)}
                      textAnchor="middle"
                    >
                      #{i + 1}
                      {incident && detailed
                        ? ` · ${severityWord(incident)}`
                        : ""}
                    </text>
                    {incident > 0 && !detailed && (
                      <circle
                        className="quiet-severity-dot"
                        cx={n.x + 15}
                        cy={n.y - 12}
                        r="3"
                      />
                    )}
                  </g>
                )
              })}
              {trackedVehicles.map((vehicle) => (
                <g
                  key={vehicle.vehicle}
                  className={`live-vehicle-marker ${
                    vehicle.arrived ? "arrived" : ""
                  } ${vehicle.preparing ? "preparing" : ""}`}
                  transform={`translate(${vehicle.x} ${vehicle.y})`}
                  aria-label={`${vehicle.vehicle}, ${
                    vehicle.arrived
                      ? "arrived"
                      : vehicle.preparing
                        ? "preparing to depart"
                        : "en route"
                  }`}
                >
                  <title>
                    {vehicle.vehicle} · {vehicle.arrived
                      ? "Arrived"
                      : vehicle.preparing
                        ? "Preparing to depart"
                        : "En route"}
                  </title>
                  <circle r="11" />
                  <path d="M-7 2h14l-1.5-5h-11zM-5-4h2v2h-2zm7 0h2v2H2zM-5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                </g>
              ))}
            </svg>
          </div>
          <div className="network-map-footer">
            {detailed ? (
              <span>
                {trackedVehicles.length > 0
                  ? `${trackedVehicles.length} dispatched ground ${
                      trackedVehicles.length === 1 ? "unit" : "units"
                    } · positions update live (simulated, not GPS)`
                  : "Dispatched ground units will appear and move here · simulated, not GPS"}
              </span>
            ) : (
              <span>Tap a junction to select a location</span>
            )}
            <span className="network-mobile-help">Swipe to explore · </span>
            <span>Not to scale</span>
          </div>
        </div>
      </div>
    </div>
  )
}
