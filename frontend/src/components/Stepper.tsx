import Icon from "./Icon"
const steps = ["Location", "Details", "Review"]
export default function Stepper({
  current,
  onChange,
  available = [true, true, true],
}: {
  current: number
  onChange: (step: number) => void
  available?: boolean[]
}) {
  return (
    <nav className="stepper" aria-label="Reporting steps">
      {steps.map((step, i) => (
        <button
          key={step}
          className={`step ${i === current ? "current" : ""} ${
            i < current ? "done" : ""
          }`}
          onClick={() => onChange(i)}
          disabled={!available[i]}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="step-number">
            {i < current ? <Icon name="check" size={13} /> : i + 1}
          </span>
          <span>{step}</span>
        </button>
      ))}
    </nav>
  )
}
