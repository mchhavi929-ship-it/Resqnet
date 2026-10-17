export default function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="input-label">
      {label}
      <input className="input" {...props} />
    </label>
  )
}
