import type { Incident } from "../types"
import Button from "../components/Button"
import Icon from "../components/Icon"
import { junctions } from "../data/city"
import { severityClass, severityWord } from "../lib/incident"
type Props = {
  queue: Incident[]
  autosaveFailed: boolean
  onEdit: (report: Incident) => void
  onRemove: (id: number) => void
}
export default function ReviewPage({
  queue,
  autosaveFailed,
  onEdit,
  onRemove,
}: Props) {
  return (
    <section className="card public-review" aria-label="Reports to review">
      <div className="review-meta">
        <span>
          {queue.length} {queue.length === 1 ? "report" : "reports"}
        </span>
        <span role="status">
          <Icon name={autosaveFailed ? "alert" : "check"} size={13} />
          {autosaveFailed ? "Autosave unavailable" : "Autosaved in this tab"}
        </span>
      </div>
      {queue.length === 0 ? (
        <p className="field-help">
          No reports yet. Add one to try the reporting flow.
        </p>
      ) : (
        [...queue]
          .sort((a, b) => b.severity - a.severity)
          .map((i) => (
            <article className="public-report" key={i.id}>
              <div className="public-report-heading">
                <h2>{i.type}</h2>
                <div>
                  {i.state && (
                    <span className="review-report-state">
                      <Icon
                        name={i.state === "dispatched" ? "check" : "clock"}
                        size={13}
                      />
                      {i.state === "dispatched"
                        ? "Dispatched"
                        : "Request received"}
                    </span>
                  )}
                  {!i.state && (
                    <>
                      <Button variant="quiet" onClick={() => onEdit(i)}>
                        Edit
                      </Button>
                      <Button
                        variant="quiet"
                        aria-label={`Remove ${i.type} at ${junctions[i.location].name}`}
                        onClick={() => onRemove(i.id)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <dl>
                <div>
                  <dt>Location</dt>
                  <dd>{junctions[i.location].name}</dd>
                </div>
                <div>
                  <dt>Severity</dt>
                  <dd>
                    <span
                      className={`severity-badge sev-${severityClass(i.severity)}`}
                    >
                      {i.severity} / 10 · {severityWord(i.severity)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>People affected</dt>
                  <dd>{i.people}</dd>
                </div>
              </dl>
            </article>
          ))
      )}
    </section>
  )
}
