import { useEffect, useState } from "react"
import { availableFleet, suggestDispatch } from "../dispatch"
import type { Incident } from "../types"
import { junctions } from "../data/city"
import { incidentTypes } from "../data/incidents"
import { fleetUnits } from "../data/fleet"
import { priorityScore, severityClass } from "../lib/incident"
import Icon from "../components/Icon"
import Button from "../components/Button"
import Badge from "../components/Badge"
import Card from "../components/Card"
import LocationMap from "../components/LocationMap"
export default function DispatcherPage({
  queue,
  onApprove,
}: {
  queue: Incident[]
  onApprove: (id: number, overrides: Record<string, number>) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const ranked = queue
    .map((incident, index) => ({ incident, index }))
    .sort(
      (a, b) =>
        priorityScore(b.incident) - priorityScore(a.incident) ||
        a.index - b.index,
    )
    .map(({ incident }) => incident)
  const incident =
    queue.find((i) => i.id === focused) ??
    ranked.find((i) => i.state === "requested") ??
    ranked[0]
  const [manual, setManual] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  useEffect(() => {
    setOverrides({})
    setManual(false)
  }, [incident?.id])
  const free = availableFleet(queue)
  const plan = incident
    ? suggestDispatch(incident, queue, manual ? overrides : {})
    : null
  return (
    <main className="dispatcher-page">
      <div className="dispatcher-title">
        <div>
          <div className="eyebrow">OPERATIONS</div>
          <h1 id="screen-title" tabIndex={-1}>
            Dispatcher view
          </h1>
          <p>The city, its reports, and the resources on standby.</p>
        </div>
        <span className="dispatcher-standby">
          <Icon name="clock" size={14} />
          {queue.filter((i) => i.state === "requested").length} awaiting
          approval
        </span>
      </div>
      <div className="dispatch-stats">
        <div>
          <span className="eyebrow">QUEUED REPORTS</span>
          <strong className="mono">
            {queue.filter((i) => i.state === "requested").length}
          </strong>
        </div>
        <div>
          <span className="eyebrow">LOCATIONS AFFECTED</span>
          <strong className="mono">
            {new Set(queue.map((i) => i.location)).size}
          </strong>
        </div>
        <div>
          <span className="eyebrow">VEHICLES AVAILABLE</span>
          <strong className="mono">
            {free.length} <small>/ 6</small>
          </strong>
        </div>
      </div>
      <div className="dispatcher-columns">
        <Card
          eyebrow="CITY STATUS"
          title={selected === null ? "Incident map" : junctions[selected].name}
          className="dispatch-map-card"
          action={
            selected !== null ? (
              <Button
                variant="quiet"
                onClick={() => {
                  setSelected(null)
                  setFocused(null)
                }}
              >
                Clear selection
              </Button>
            ) : undefined
          }
        >
          <LocationMap
            detailed
            selected={selected}
            onSelect={(id) => {
              setSelected(id)
              setFocused(ranked.find((i) => i.location === id)?.id ?? null)
            }}
            queue={queue}
          />
          <p className="dispatch-help">
            Markers show highest severity at each location. Select a report
            below to inspect it.
          </p>
        </Card>
        <Card
          eyebrow="FLEET"
          title={`${free.length} units available`}
          className="dispatch-fleet"
        >
          {fleetUnits.map((unit) => (
            <div className="dispatcher-fleet-unit" key={unit.name}>
              <Icon name={unit.icon} />
              <div>
                <strong>{unit.name}</strong>
                <span>
                  {unit.type} · {unit.location}
                </span>
              </div>
              <Badge
                status={
                  free.some((v) => v.name === unit.name)
                    ? "Available"
                    : "Dispatched"
                }
              />
            </div>
          ))}
          <p className="fleet-gap">
            <Icon name="alert" size={14} />
            No heavy rescue unit in the fleet.
          </p>
        </Card>
      </div>
      <Card
        eyebrow="PRIORITY QUEUE"
        title="Emergency requests"
        className="dispatch-queue"
      >
        <p className="dispatch-help">
          Select a request, review the suggested response, then approve
          dispatch. Priority = severity × 10 + people × 0.5.
        </p>
        {ranked.length === 0 ? (
          <div className="dispatch-empty">
            No reports yet. Reports added in the reporting view will appear
            here.
          </div>
        ) : (
          <ol className="dispatcher-reports">
            {ranked.map((report, index) => (
              <li key={report.id}>
                <button
                  className={`dispatcher-report sev-${severityClass(report.severity)} ${
                    focused === report.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setFocused(report.id)
                    setSelected(report.location)
                  }}
                  aria-pressed={focused === report.id}
                >
                  <span className="dispatcher-rank mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="dispatcher-report-name">
                    <strong>{report.type}</strong>
                    <span>
                      {junctions[report.location].name} · Severity{" "}
                      {report.severity} · {report.people} people
                    </span>
                  </div>
                  <span className="dispatcher-score mono">
                    {priorityScore(report).toFixed(1)}
                  </span>
                  <Badge
                    status={
                      report.state === "dispatched" ? "Dispatched" : "Queued"
                    }
                  />
                  <span className="dispatch-order-word">
                    {index === 0 ? "Handled first" : `Order ${index + 1}`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {incident && plan && (
          <section className="approval-panel">
            <div className="approval-heading">
              <div>
                <div className="eyebrow">
                  {incident.state === "dispatched"
                    ? "APPROVED RESPONSE"
                    : "SUGGESTED RESPONSE"}
                </div>
                <h3>
                  {incident.type} · {junctions[incident.location].name}
                </h3>
              </div>
              {incident.state !== "dispatched" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!manual)
                      setOverrides(
                        Object.fromEntries(
                          [
                            ...new Set(
                              fleetUnits
                                .map((v) => v.type)
                                .concat("Heavy rescue"),
                            ),
                          ].map((type) => [
                            type,
                            plan.assignments.filter((a) => a.type === type)
                              .length,
                          ]),
                        ),
                      )
                    setManual(!manual)
                  }}
                >
                  {manual ? "Use suggestions" : "Assign manually"}
                </Button>
              )}
            </div>
            {(incident.state === "dispatched"
              ? (incident.assignments ?? [])
              : plan.assignments
            ).map((a) => (
              <div className="approval-vehicle" key={a.vehicle}>
                <Icon name="vehicle" />
                <div>
                  <strong>{a.vehicle}</strong>
                  <span>
                    {a.direct
                      ? "Flies direct"
                      : a.route.map((i) => junctions[i].name).join(" → ")}
                  </span>
                </div>
                <span className="mono">
                  {a.seconds === null ? "ETA unavailable" : `${a.seconds} s`}
                </span>
              </div>
            ))}
            {manual && incident.state !== "dispatched" && (
              <div className="manual-unit-counts">
                <div className="manual-counts-heading">
                  <h3>How many units should respond?</h3>
                  <p>
                    Choose quantities. The nearest available units are assigned
                    within each type.
                  </p>
                </div>
                {[
                  ...new Set(
                    fleetUnits.map((v) => v.type).concat("Heavy rescue"),
                  ),
                ].map((type) => {
                  const available = free.filter((v) => v.type === type).length
                  const value = overrides[type] ?? 0
                  return (
                    <div className="manual-unit-row" key={type}>
                      <div>
                        <strong>{type}</strong>
                        <span>{available} available</span>
                      </div>
                      <div className="unit-count-stepper">
                        <button
                          aria-label={`Fewer ${type} units`}
                          disabled={value === 0}
                          onClick={() =>
                            setOverrides((o) => ({
                              ...o,
                              [type]: Math.max(0, value - 1),
                            }))
                          }
                        >
                          −
                        </button>
                        <input
                          aria-label={`${type} unit count`}
                          type="number"
                          min="0"
                          max={available}
                          value={value}
                          onChange={(e) =>
                            setOverrides((o) => ({
                              ...o,
                              [type]: Math.max(
                                0,
                                Math.min(
                                  available,
                                  Math.floor(Number(e.target.value) || 0),
                                ),
                              ),
                            }))
                          }
                        />
                        <button
                          aria-label={`More ${type} units`}
                          disabled={value >= available}
                          onClick={() =>
                            setOverrides((o) => ({ ...o, [type]: value + 1 }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {(incident.state === "dispatched"
              ? (incident.missingTypes ?? [])
              : plan.missingTypes
            ).length > 0 && (
              <p className="approval-warning">
                <Icon name="alert" size={14} />
                Not covered:{" "}
                {(incident.state === "dispatched"
                  ? (incident.missingTypes ?? [])
                  : plan.missingTypes
                ).join(", ")}
                .{" "}
                {incident.state === "dispatched"
                  ? "Additional resources still needed."
                  : "Available units can still be dispatched."}
              </p>
            )}
            {incident.state !== "dispatched" && (
              <div className="approval-footer">
                <span>Nothing is dispatched until you approve.</span>
                <Button
                  disabled={!plan.assignments.length}
                  onClick={() =>
                    onApprove(incident.id, manual ? overrides : {})
                  }
                >
                  Approve & dispatch
                  <Icon name="check" size={16} />
                </Button>
              </div>
            )}
          </section>
        )}
      </Card>
    </main>
  )
}
