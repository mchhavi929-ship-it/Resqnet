import { useId, useState, type ReactNode } from "react"

export default function AnimatedDisclosure({ title, children, className = "", defaultOpen = false }: {
  title: ReactNode
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className={`animated-disclosure ${className}`} data-open={open}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="disclosure-trigger flex w-full items-center justify-between gap-4 text-left text-sm font-medium">
        <span>{title}</span>
        <svg aria-hidden="true" className="disclosure-chevron size-4 shrink-0 text-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div id={id} className="disclosure-panel" aria-hidden={!open} inert={!open}>
        <div className="disclosure-content">{children}</div>
      </div>
    </div>
  )
}
