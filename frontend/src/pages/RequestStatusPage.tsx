import { useEffect, useState } from "react"
import type { Incident } from "../types"
import RequestTracking from "../components/RequestTracking"
import Icon from "../components/Icon"
import { groupRequests } from "../lib/requestStatus"
type Props = {
  queue: Incident[]
  responsePreparationSeconds: number
}
export default function RequestStatusPage({
  queue,
  responsePreparationSeconds,
}: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const groups = groupRequests(queue, now)
  return (
    <section className="request-status-list" aria-label="Request updates">
      {groups.attention.length > 0 && (
        <section className="request-group" aria-labelledby="attention-heading">
          <div className="request-group-heading">
            <h2 id="attention-heading">Needs attention</h2>
            <span>
              {groups.attention.length}{" "}
              {groups.attention.length === 1 ? "request" : "requests"}
            </span>
          </div>
          {groups.attention.map((report, index) => (
            <RequestTracking
              key={report.id}
              report={report}
              defaultExpanded={index === 0}
              responsePreparationSeconds={responsePreparationSeconds}
            />
          ))}
        </section>
      )}
      {groups.ongoing.length > 0 && (
        <section className="request-group" aria-labelledby="ongoing-heading">
          <div className="request-group-heading">
            <h2 id="ongoing-heading">Ongoing responses</h2>
            <span>{groups.ongoing.length} active</span>
          </div>
          {groups.ongoing.map((report, index) => (
            <RequestTracking
              key={report.id}
              report={report}
              defaultExpanded={index === 0}
              responsePreparationSeconds={responsePreparationSeconds}
            />
          ))}
        </section>
      )}
      {groups.arrived.length > 0 && (
        <details className="arrived-history">
          <summary>
            <span>
              <Icon name="check" size={16} />
              Responses arrived
            </span>
            <span>
              {groups.arrived.length}
              <Icon name="arrow" size={14} />
            </span>
          </summary>
          <div>
            {groups.arrived.map((report) => (
              <RequestTracking
                key={report.id}
                report={report}
                defaultExpanded={false}
                arrived
                responsePreparationSeconds={responsePreparationSeconds}
              />
            ))}
          </div>
        </details>
      )}
      {!queue.some((report) => report.state) && (
        <div className="card requests-empty">
          <Icon name="clock" size={24} />
          <h2>No requests yet</h2>
          <p>Your submitted requests and response updates will appear here.</p>
        </div>
      )}
      <p className="local-workflow-note">
        Project workflow · Updates stay in this browser tab. Tracking is
        simulated, not live GPS.
      </p>
    </section>
  )
}
