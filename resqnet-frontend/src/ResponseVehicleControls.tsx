import { vehicleCountSummary } from "./lib/report-response"

export default function ResponseVehicleControls({ standardTypes, vehicleTypes, mode, counts, reason, adjusted, onMode, onCount, onReason, onReset }: {
  standardTypes: readonly string[]
  vehicleTypes: readonly string[]
  mode: "automatic" | "manual"
  counts: Record<string, number>
  reason: string
  adjusted: boolean
  onMode: (mode: "automatic" | "manual") => void
  onCount: (name: string, count: number) => void
  onReason: (reason: string) => void
  onReset: () => void
}) {
  const omitted = standardTypes.filter(name => (counts[name] ?? 0) === 0)
  return (
    <>
      <fieldset className="response-selection mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-white bg-surface/60 p-1">
        <legend className="sr-only">Vehicle selection method</legend>
        {(["automatic", "manual"] as const).map(value => <label key={value} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-focus ${mode === value ? "bg-ink text-white shadow-sm" : "text-mute hover:bg-white/60"}`}><input type="radio" name="vehicle-selection" value={value} checked={mode === value} onChange={() => onMode(value)} className="sr-only" />{value === "automatic" ? "Automatic response" : "Adjust manually"}</label>)}
      </fieldset>
      {mode === "automatic" ? <div className="response-automatic">
        <div className="mb-4 mt-5 flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-widest text-mute">{vehicleCountSummary(standardTypes)}</p><span className="rounded-full border border-line bg-white/70 px-2.5 py-1 text-xs text-mute">Not dispatched</span></div>
        {standardTypes.length ? <ul className="space-y-2">{standardTypes.map(name => <li key={name} className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12v11H3zM15 10h4l3 4v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg></span><span className="min-w-0"><span className="block text-sm font-medium">{name}</span><span className="mt-1 block text-xs text-mute">{name === "Ambulance" ? "Medical assistance & patient transport" : name === "Police" ? "Safety & incident coordination" : name === "Fire Truck" ? "Fire & rescue assistance" : "Specialist response support"}</span></span><span className="ml-auto text-xs text-mute">1 vehicle</span></li>)}</ul> : <p className="rounded-xl border border-dashed border-line p-4 text-sm text-mute">No response is recorded for this incident. Choose Adjust manually to request help.</p>}
        <p className="mt-4 text-xs leading-relaxed text-mute">This is the help being requested, not a confirmed assignment. Once dispatch is recorded, the reporter will see the assigned vehicles in their report and notification inbox.</p>
      </div> : <div className="response-manual">
        <div className="mb-4 mt-5 flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-widest text-mute">Requested vehicle mix</p><button type="button" onClick={onReset} className="text-xs font-medium underline underline-offset-4">Reset to standard</button></div>
        <p className="mb-4 text-xs leading-relaxed text-mute">Include the types you need, then adjust the requested quantity. These are requests, not confirmed available units.</p>
        <ul className="space-y-2">{vehicleTypes.map(name => {
          const count = counts[name] ?? 0
          return <li key={name} className={`response-vehicle-row flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${count > 0 ? "border-line bg-white/85" : "border-white bg-white/35"}`}>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={count > 0} onChange={event => onCount(name, event.target.checked ? 1 : 0)} className="size-4 shrink-0 accent-ink" /><span>{name}{standardTypes.includes(name) && <span className="mt-0.5 block text-xs text-mute">Standard for this incident</span>}</span></label>
            <div className="inline-flex shrink-0 items-center rounded-full border border-line bg-white p-1">
              <button type="button" aria-label={`Request fewer ${name} units`} disabled={count <= 0} onClick={() => onCount(name, Math.max(0, count - 1))} className="flex size-7 items-center justify-center rounded-full text-base hover:bg-surface disabled:opacity-30">−</button>
              <input type="number" aria-label={`${name} requested units`} min={0} max={4} step={1} value={count} onChange={event => onCount(name, event.target.value === "" ? 0 : Number(event.target.value))} className="response-quantity w-12 bg-transparent py-1 text-center text-xs tabular-nums outline-none" />
              <button type="button" aria-label={`Request more ${name} units`} disabled={count >= 4} onClick={() => onCount(name, Math.min(4, count + 1))} className="flex size-7 items-center justify-center rounded-full text-base hover:bg-surface disabled:opacity-30">+</button>
            </div>
          </li>
        })}</ul>
        {omitted.length > 0 && <p role="status" className="mt-4 rounded-xl border border-line bg-white/70 p-3 text-xs leading-relaxed text-mute">Standard types not requested: <span className="font-medium text-ink">{omitted.join(", ")}</span>.</p>}
        {adjusted && <div className="mt-5"><label htmlFor="response-adjustment-reason" className="text-sm font-medium">Reason for adjustment <span className="text-xs font-normal text-mute">Required</span></label><textarea id="response-adjustment-reason" rows={2} maxLength={200} minLength={10} value={reason} onChange={event => onReason(event.target.value)} aria-describedby="response-reason-help" placeholder="Explain why this response needs a different vehicle mix…" className="mt-2 block w-full resize-y rounded-xl border border-line bg-white/70 p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-focus" /><p id="response-reason-help" className="mt-2 text-xs text-mute">10–200 characters. Included in your unsent plan for review.</p></div>}
      </div>}
    </>
  )
}
