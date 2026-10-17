import { useState } from "react"
import type { Incident } from "../types"
import { junctions } from "../data/city"
import Icon from "./Icon"
import Button from "./Button"
import ResponseTracking from "./ResponseTracking"
export default function RequestTracking({
  report,
  defaultExpanded = true,
  arrived = false,
}: {
  report: Incident
  defaultExpanded?: boolean
  arrived?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const assignments = [...(report.assignments ?? [])].sort(
    (a, b) => (a.seconds ?? Infinity) - (b.seconds ?? Infinity),
  )
  const [chosen, setChosen] = useState("")
  const elapsed = report.dispatchedAt
    ? Math.max(0, (Date.now() - report.dispatchedAt) / 1000)
    : 0
  const selected =
    assignments.find((a) => a.vehicle === chosen) ??
    assignments.find((a) => a.seconds !== null && elapsed < a.seconds) ??
    assignments.find((a) => a.seconds === null) ??
    assignments[0]
  return (
    <article
      className={`card request-status-card tracking-request-card request-card--${
        arrived
          ? "arrived"
          : report.state === "requested"
            ? "waiting"
            : "active"
      }`}
    >
      <details
        className="request-record"
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary className="request-record-summary">
          <span className="request-record-place">
            <strong>{report.type}</strong>
            <span>
              <Icon name="pin" size={12} />
              {junctions[report.location].name}
            </span>
          </span>
          <span className="request-record-state">
            <Icon
              name={
                arrived
                  ? "check"
                  : report.state === "requested"
                    ? "clock"
                    : "vehicle"
              }
              size={14}
            />
            {arrived
              ? "Arrived"
              : report.state === "requested"
                ? "Awaiting approval"
                : (report.missingTypes?.length ?? 0) > 0
                  ? "More help needed"
                  : "Responding"}
            <span className="request-record-chevron" aria-hidden="true">
              <Icon name="arrow" size={12} />
            </span>
          </span>
        </summary>
        {report.state === "requested" ? (
          <div className="waiting-response">
            <span className="waiting-icon">
              <Icon name="clock" size={24} />
            </span>
            <div className="eyebrow">REQUEST RECEIVED</div>
            <h2>Awaiting approval</h2>
            <p>
              Your assigned vehicle and arrival estimate will appear here after
              approval.
            </p>
            <div className="waiting-progress">
              <Icon name="check" size={14} />
              <span>Received</span>
              <span className="waiting-progress-line" />
              <Icon name="clock" size={14} />
              <span>Awaiting approval</span>
            </div>
          </div>
        ) : selected ? (
          <ResponseTracking
            key={selected.vehicle}
            assignment={selected}
            dispatchedAt={report.dispatchedAt}
          />
        ) : (
          <p className="field-help">Waiting for an available response unit.</p>
        )}
        {assignments.length > 1 && (
          <details className="other-response-units">
            <summary>Other responding units ({assignments.length - 1})</summary>
            <div>
              {assignments
                .filter((a) => a.vehicle !== selected?.vehicle)
                .map((a) => (
                  <Button
                    key={a.vehicle}
                    variant="secondary"
                    onClick={() => setChosen(a.vehicle)}
                  >
                    <Icon
                      name={a.direct ? "helicopter" : "vehicle"}
                      size={16}
                    />
                    {a.vehicle}
                    <Icon name="arrow" size={14} />
                  </Button>
                ))}
            </div>
          </details>
        )}
        {(report.missingTypes?.length ?? 0) > 0 && (
          <p className="response-pending">
            Additional resources are still needed. Your assigned units are
            responding.
          </p>
        )}
      </details>
    </article>
  )
}
