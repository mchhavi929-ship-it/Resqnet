import { useEffect, useRef, useState } from "react"

const numberFormat = new Intl.NumberFormat("en-US")

export default function AnimatedNumber({ value }: { value: number | null }) {
  const [displayed, setDisplayed] = useState<number | null>(null)
  const current = useRef(0)

  useEffect(() => {
    if (value === null) {
      current.current = 0
      setDisplayed(null)
      return
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const startValue = current.current
    const start = performance.now()
    const finish = () => {
      cancelAnimationFrame(frame)
      current.current = value
      setDisplayed(value)
    }
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / 700))
      const next = Math.round(startValue + (value - startValue) * (1 - (1 - progress) ** 3))
      current.current = next
      setDisplayed(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    const onPreference = () => { if (media.matches) finish() }
    if (media.matches || startValue === value) finish()
    else frame = requestAnimationFrame(tick)
    media.addEventListener("change", onPreference)
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", onPreference) }
  }, [value])

  return (
    <span className="animated-number" data-counter-target={value ?? "unknown"} data-counter-value={displayed ?? "unknown"}>
      <span key={value ?? "unknown"} className="counter-digits" aria-hidden="true">{displayed === null ? "—" : numberFormat.format(displayed)}</span>
      <span className="sr-only">{value === null ? "Not loaded" : numberFormat.format(value)}</span>
    </span>
  )
}
