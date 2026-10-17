import { useEffect, useState } from "react"
import { routeProgress, headingDegrees, type Assignment } from "../dispatch"
import {
  junctions as desktopJunctions,
  compactJunctions,
  roads,
} from "../data/city"
import useCompactLayout from "../hooks/useCompactLayout"
import Icon from "./Icon"
export default function ResponseTracking({
  assignment: a,
  dispatchedAt,
}: {
  assignment: Assignment
  dispatchedAt?: number
}) {
  const compact = useCompactLayout()
  const junctions = compact ? compactJunctions : desktopJunctions
  const [origin] = useState(dispatchedAt ?? Date.now())
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (a.direct || a.seconds === null) return
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [a.direct, a.seconds])
  const elapsed = Math.max(0, (now - origin) / 1000)
  const progress = routeProgress(a, elapsed)
  const from = junctions[progress.from],
    to = junctions[progress.to]
  const x = from.x + (to.x - from.x) * progress.fraction,
    y = from.y + (to.y - from.y) * progress.fraction
  const arrived = progress.remaining === 0
  const previous = a.route[Math.max(0, a.route.length - 2)]
  const heading = headingDegrees(arrived ? junctions[previous] : from, to)
  const legIndex = a.route.findIndex(
    (id, i) => id === progress.from && a.route[i + 1] === progress.to,
  )
  const remainingPoints = arrived
    ? `${x},${y}`
    : [
        `${x},${y}`,
        ...a.route
          .slice(Math.max(0, legIndex) + 1)
          .map((i) => `${junctions[i].x},${junctions[i].y}`),
      ].join(" ")
  const responseTitle = arrived
    ? "Response arrived"
    : `${a.type} response dispatched`
  const stage = arrived ? 3 : a.direct ? 1 : 2
  return (
    <section className="response-tracking" aria-label={`${a.vehicle} tracking`}>
      <div className="tracking-hero">
        <div className="eyebrow">RESPONSE STATUS</div>
        <h2>{responseTitle}</h2>
        <p>
          {arrived
            ? "The unit has reached the reported location in this simulation."
            : `Assigned to the emergency at ${junctions[a.route[a.route.length - 1]].name}.`}
        </p>
      </div>
      <ol className="response-progress" aria-label="Response progress">
        {["Request received", "Response assigned", "On the way", "Arrived"].map(
          (label, i) => (
            <li
              key={label}
              className={i <= stage ? "complete" : ""}
              aria-current={i === stage ? "step" : undefined}
            >
              <span>{i < stage ? <Icon name="check" size={10} /> : i + 1}</span>
              <small>{label}</small>
            </li>
          ),
        )}
      </ol>
      <details className="tracking-map-disclosure">
        <summary>
          <span className="map-label-closed">Show tracking map</span>
          <span className="map-label-open">Hide tracking map</span>
          <Icon name="route" size={16} />
        </summary>
        <div className="tracking-map-scroll tracking-map-main">
          <svg
            viewBox={compact ? "0 0 315 330" : "-20 0 570 405"}
            role="img"
            aria-label={`Simulated ${a.vehicle} moving ${
              Math.abs(heading) > 90 ? "left" : "toward the emergency"
            }; not live GPS`}
          >
            <g className="tracking-background">
              {roads.map(([a, b], i) => (
                <line
                  key={i}
                  x1={junctions[a].x}
                  y1={junctions[a].y}
                  x2={junctions[b].x}
                  y2={junctions[b].y}
                />
              ))}
            </g>
            <polyline
              className="tracking-route-completed"
              points={a.route
                .map((i) => `${junctions[i].x},${junctions[i].y}`)
                .join(" ")}
            />
            {!arrived && (
              <polyline
                className={`tracking-route ${a.direct ? "direct-flight" : ""}`}
                points={remainingPoints}
              />
            )}
            {a.route.map((id, index) => (
              <g key={`${id}-${index}`}>
                <circle
                  className="tracking-stop"
                  cx={junctions[id].x}
                  cy={junctions[id].y}
                  r="4"
                />
                <text
                  x={junctions[id].x}
                  y={junctions[id].y + 27}
                  textAnchor="middle"
                >
                  {compact
                    ? junctions[id].name.split(" ").map((word, index) => (
                        <tspan
                          key={index}
                          x={junctions[id].x}
                          dy={index === 0 ? 0 : 14}
                        >
                          {word}
                        </tspan>
                      ))
                    : junctions[id].name}
                </text>
              </g>
            ))}
            <g
              className="tracking-destination"
              transform={`translate(${junctions[a.route[a.route.length - 1]].x} ${junctions[a.route[a.route.length - 1]].y})`}
            >
              <circle r="12" />
              <circle r="4" />
            </g>
            {!a.direct && (
              <g
                className="tracking-position"
                transform={`translate(${x} ${y})`}
              >
                <circle className="tracking-vehicle-ring" r="18" />
                <g
                  className="tracking-heading"
                  transform={`rotate(${heading})`}
                >
                  <rect
                    className="tracking-car-body"
                    x="-13"
                    y="-7"
                    width="26"
                    height="14"
                    rx="4"
                  />
                  <path
                    className="tracking-car-glass"
                    d="M5-6v12M-10-3h5m-2.5-2.5v5M-7-10h6m-6 20h6M7-10h3M7 10h3"
                  />
                  <path className="tracking-car-nose" d="m10-2 3 2-3 2" />
                </g>
              </g>
            )}
          </svg>
          {a.direct && (
            <div className="tracking-map-stamp">
              Direct flight · Position unavailable
            </div>
          )}
        </div>
      </details>
      <div className="tracking-unit-footer">
        <span className="tracking-unit-icon">
          <Icon name={a.direct ? "helicopter" : "vehicle"} size={20} />
        </span>
        <div>
          <strong>{a.vehicle}</strong>
          <span>
            {arrived
              ? "At the reported location"
              : a.direct
                ? "Assigned · Flight ETA unavailable"
                : "Dispatched · On the way"}
          </span>
        </div>
        {progress.remaining !== null && (
          <span className="tracking-exact-eta mono">
            {progress.remaining} s
            <small>{arrived ? "arrived" : "remaining"}</small>
          </span>
        )}
      </div>
    </section>
  )
}
