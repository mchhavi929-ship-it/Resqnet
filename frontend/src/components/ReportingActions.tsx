import type { Incident, Screen } from "../types"
import { junctions } from "../data/city"
import Button from "./Button"
import Icon from "./Icon"
type Props = {
  screen: Screen
  queue: Incident[]
  location: number | null
  type: string
  severity: number
  people: number
  onNavigate: (screen: Screen) => void
  onReset: () => void
  onReview: () => void
  onRequestHelp: () => void
}
export default function ReportingActions({
  screen,
  queue,
  location,
  type,
  severity,
  people,
  onNavigate,
  onReset,
  onReview,
  onRequestHelp,
}: Props) {
  const hasLocation = location !== null
  const locationName = (id: number) => junctions[id].name
  return (
    <div className="report-actions wizard-actions">
      <div>
        {screen === 0 ? (
          queue.length > 0 ? (
            <Button variant="secondary" onClick={() => onNavigate(2)}>
              View reports ({queue.length})
            </Button>
          ) : (
            <span className="step-caption">Step 1 of 3 · Location</span>
          )
        ) : (
          <Button
            variant="secondary"
            onClick={() =>
              onNavigate(
                screen === 4 ? 2 : screen === 1 || !hasLocation ? 0 : 1,
              )
            }
          >
            <span aria-hidden="true">←</span>Back
          </Button>
        )}
      </div>
      {screen === 4 ? (
        <Button
          variant="secondary"
          onClick={() => {
            onReset()
            onNavigate(0)
          }}
        >
          Report another
          <Icon name="plus" size={16} />
        </Button>
      ) : screen === 0 ? (
        <Button disabled={!hasLocation} onClick={() => onNavigate(1)}>
          Continue
          <Icon name="arrow" size={16} />
        </Button>
      ) : screen === 1 ? (
        <div className="next-action report-next-action">
          <p
            className="compact-report"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {type && location !== null ? (
              <>
                <strong>{type}</strong> in {locationName(location)}
                <span className="report-sentence-detail">
                  {" "}
                  · Severity <span className="mono">{severity || "—"}</span> ·{" "}
                  <span className="mono">{people}</span>{" "}
                  {people === 1 ? "person" : "people"}
                </span>
                {!severity && <small>Select a severity to continue.</small>}
              </>
            ) : (
              "Select an emergency type to continue."
            )}
          </p>
          <Button disabled={!type || !severity} onClick={onReview}>
            Review report
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      ) : (
        <div className="review-buttons">
          <Button
            variant="secondary"
            onClick={() => {
              onReset()
              onNavigate(0)
            }}
          >
            <Icon name="plus" size={16} />
            Report another
          </Button>
          <Button
            disabled={!queue.length}
            onClick={() =>
              queue.some((i) => !i.state) ? onRequestHelp() : onNavigate(4)
            }
          >
            {queue.some((i) => !i.state) ? "Request help" : "View request"}
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
