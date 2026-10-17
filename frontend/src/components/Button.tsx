import type { ButtonHTMLAttributes } from "react"
export default function Button({
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet"
}) {
  return (
    <button className={`button button--${variant}`} {...props}>
      {children}
    </button>
  )
}
