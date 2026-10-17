import type { ReactNode } from "react"
export default function Card({
  eyebrow,
  title,
  children,
  className = "",
  action,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`card ${className}`}>
      <div className="card-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
