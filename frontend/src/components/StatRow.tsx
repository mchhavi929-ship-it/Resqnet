export default function StatRow({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <span className="mono">
        {value}
        <small>{unit}</small>
      </span>
    </div>
  )
}
