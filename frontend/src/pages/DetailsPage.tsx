import Icon from "../components/Icon"
import { incidentTypes } from "../data/incidents"
import { severityClass, severityWord } from "../lib/incident"
type Props = {
  type: string
  setType: (value: string) => void
  severity: number
  setSeverity: (value: number) => void
  people: number
  changePeople: (value: number) => void
}
export default function DetailsPage({
  type,
  setType,
  severity,
  setSeverity,
  people,
  changePeople,
}: Props) {
  return (
    <>
      <section className="incident-workspace" aria-label="Incident workspace">
        <section className="workspace-types" aria-labelledby="type-heading">
          <div className="workspace-section-heading">
            <div>
              <h2 id="type-heading">Type of emergency</h2>
              <p className="workspace-section-help">
                Choose the closest match.
              </p>
            </div>
          </div>
          <div
            className="incident-tiles"
            role="group"
            aria-label="Emergency type"
          >
            {incidentTypes.map((t) => (
              <button
                key={t.name}
                className={`incident-tile ${
                  type === t.name ? "is-selected" : ""
                }`}
                aria-pressed={type === t.name}
                onClick={() => setType(t.name)}
              >
                <Icon name={t.icon} size={26} />
                <span>{t.name}</span>
                <span className="tile-check" aria-hidden="true">
                  {type === t.name && <Icon name="check" size={12} />}
                </span>
              </button>
            ))}
          </div>
        </section>
        <div className="workspace-measures">
          <section
            className="workspace-severity"
            aria-labelledby="severity-heading"
          >
            <h2 id="severity-heading">Severity</h2>
            <div className="severity-readout">
              <span className="measure-number mono">
                {severity || "—"}
                <small> / 10</small>
              </span>
              {severity > 0 ? (
                <span
                  className={`severity-badge sev-${severityClass(severity)}`}
                >
                  <span className="severity-word-dot" />
                  {severityWord(severity)}
                </span>
              ) : (
                <span className="measure-prompt">Select a level below</span>
              )}
            </div>
            <div
              className={`severity-segments sev-${severityClass(severity)}`}
              role="group"
              aria-label="Severity from 1 to 10"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  className={`${severity >= i + 1 ? "filled" : ""} ${
                    severity === i + 1 ? "chosen" : ""
                  }`}
                  aria-label={`Severity ${i + 1}`}
                  aria-pressed={severity === i + 1}
                  onClick={() => setSeverity(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="range-labels">
              <span>1 · Minor</span>
              <span>10 · Critical</span>
            </div>
          </section>
          <section
            className="workspace-people"
            aria-labelledby="people-heading"
          >
            <h2 id="people-heading">People affected</h2>
            <div className="people-readout">
              <div className="people-number">
                <input
                  className="measure-number mono"
                  aria-label="Number of people affected"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={people}
                  onChange={(e) => changePeople(Number(e.target.value))}
                />
                <span>{people === 1 ? "person" : "people"}</span>
              </div>
              <div className="people-steppers">
                <button
                  aria-label="Fewer people"
                  disabled={people === 0}
                  onClick={() => changePeople(people - 1)}
                >
                  −
                </button>
                <button
                  aria-label="More people"
                  onClick={() => changePeople(people + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="slider-group">
              <div className="slider-shell">
                <div
                  className="slider-fill"
                  style={{ width: `${Math.min(people, 200) / 2}%` }}
                />
                <input
                  aria-label="People affected slider"
                  type="range"
                  min="0"
                  max="200"
                  value={Math.min(people, 200)}
                  onChange={(e) => changePeople(Number(e.target.value))}
                />
              </div>
              <div className="range-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
                <span>150</span>
                <span>200+</span>
              </div>
            </div>
            <p className="field-help">Use the slider or type a number above.</p>
          </section>
        </div>
      </section>
    </>
  )
}
