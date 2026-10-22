import { useRef, useState, type FormEvent } from "react"
import CityMap from "./CityMap"
import { incidentTypes, junctions } from "../shared/resqnet"
import type { Report } from "./lib/reports"
import ResponseVehicleControls from "./ResponseVehicleControls"
import { confirmDispatch, previewSimulation, DispatchError, type DispatchPreview } from "./lib/dispatch"
import { vehicleCountSummary } from "./lib/report-response"

type DispatchMode = "selected" | "next" | "all"
const vehicleTypes = [...new Set(incidentTypes.flatMap(item => item.vehicles))]

export default function DispatchConsole({ reports, report, stale, onSelectReport, onDispatched }: {
  reports: Report[]
  report: Report | undefined
  stale: boolean
  onSelectReport: (id: string) => void
  onDispatched: (reports: Report[]) => void
}) {
  const type = incidentTypes.find(item => item.id === report?.type || (report?.type === undefined && item.name === report?.category))
  const standardTypes = type?.vehicles ?? []
  const originalLocation = typeof report?.location === "number" && junctions.some(place => place.id === report.location)
    ? report.location : junctions.find(place => place.name === report?.area)?.id ?? null
  const [destination, setDestination] = useState<number | null>(originalLocation)
  const [mode, setMode] = useState<DispatchMode>("selected")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [selectionMode, setSelectionMode] = useState<"automatic" | "manual">("automatic")
  const [vehicleCounts, setVehicleCounts] = useState<Record<string, number>>(() => Object.fromEntries(vehicleTypes.map(name => [name, standardTypes.includes(name) ? 1 : 0])))
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [preview, setPreview] = useState<DispatchPreview | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [sending, setSending] = useState(false)
  const [dispatchError, setDispatchError] = useState("")
  const committing = useRef(false)
  const review = useRef<HTMLDialogElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const place = junctions.find(item => item.id === destination)
  const changedLocation = destination !== originalLocation
  const modeLabel = mode === "selected" ? "Selected incident" : mode === "next" ? "Next recommended" : "All pending incidents"
  const sourceMissing = reports.length === 0 || (mode === "selected" && !report)
  const requestedVehicles = vehicleTypes.filter(name => (vehicleCounts[name] ?? 0) > 0).map(name => ({ name, quantity: vehicleCounts[name] }))
  const resetResponse = () => {
    setSelectionMode("automatic")
    setVehicleCounts(Object.fromEntries(vehicleTypes.map(name => [name, standardTypes.includes(name) ? 1 : 0])))
    setAdjustmentReason("")
    setError("")
  }
  const prepare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (calculating || sending) return
    let message = ""
    if (stale) message = "Refresh the inbox before reviewing a dispatch plan. The reports may be out of date."
    else if (sourceMissing) message = "Load a pending report before preparing dispatch."
    else if (mode === "selected" && !place) message = "Select a dispatch destination on the map or from the list."
    else if (mode === "selected" && selectionMode === "automatic" && !standardTypes.length) message = "No standard response is recorded. Adjust the vehicle request manually before continuing."
    else if (mode === "selected" && selectionMode === "manual" && vehicleTypes.some(name => !Number.isInteger(vehicleCounts[name]) || vehicleCounts[name] < 0 || vehicleCounts[name] > 4)) message = "Requested quantities must be whole numbers between 0 and 4."
    else if (mode === "selected" && selectionMode === "manual" && !requestedVehicles.length) message = "Request at least one vehicle type before continuing."
    else if (mode === "selected" && selectionMode === "manual" && requestedVehicles.reduce((total, item) => total + item.quantity, 0) > 4) message = "Each incident supports up to four response units. Reduce the requested mix."
    else if (mode === "selected" && selectionMode === "manual" && (adjustmentReason.trim().length < 10 || adjustmentReason.trim().length > 200)) message = "Explain the manual response in 10–200 characters before continuing."
    if (message) {
      setError(message)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setError("")
    setDispatchError("")
    setPreview(null)
    setCalculating(true)
    try {
      setPreview(await previewSimulation({
        requestId: crypto.randomUUID(), mode,
        ...(mode === "selected" ? {
          reportId: report?.id, destination: destination ?? undefined,
          selectionMode,
          ...(selectionMode === "manual" ? { requestedVehicles: vehicleCounts, adjustmentReason: adjustmentReason.trim() } : {}),
        } : { selectionMode: "automatic" }),
        notes: notes.trim(),
      }))
    } catch (error) { setDispatchError(error instanceof Error ? error.message : "The response could not be calculated.") }
    finally { setCalculating(false) }
    review.current?.showModal()
  }
  const dispatch = async () => {
    if (!preview?.canDispatch || committing.current) return
    committing.current = true
    setSending(true)
    setDispatchError("")
    try {
      const result = await confirmDispatch(preview)
      review.current?.close()
      onDispatched(result.reports)
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : "Dispatch could not be confirmed.")
      if (error instanceof DispatchError && error.status === 409) setPreview(null)
    } finally { committing.current = false; setSending(false) }
  }

  return (
    <section aria-labelledby="dispatch-console-title" className="dispatch-console">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-2 text-xs uppercase tracking-widest text-mute">Dispatcher controls</p><h2 id="dispatch-console-title" className="font-brand text-3xl font-medium tracking-tight">Prepare the response.</h2><p className="mt-2 text-sm leading-relaxed text-mute">Choose the operation, verify the incident, and review the destination before dispatch.</p></div>
        <span className="rounded-full border border-line bg-white/70 px-3 py-2 text-xs text-mute">Draft · not sent</span>
      </div>
      <form onSubmit={prepare} noValidate>
        <fieldset disabled={calculating || sending} className="contents">
        <fieldset className="mb-6 grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Dispatch mode</legend>
          {([
            ["selected", "01", "Selected incident", "Review one report and choose its proposed destination."],
            ["next", "02", "Next recommended", "Prepare a response for the next recommended incident."],
            ["all", "03", "All pending", "Prepare an operation for the pending incident queue."],
          ] as const).map(([value, number, label, description]) => <label key={value} className={`dispatch-mode cursor-pointer rounded-2xl border p-4 focus-within:ring-2 focus-within:ring-focus ${mode === value ? "border-ink bg-white/90" : "border-white bg-white/40"}`}><input type="radio" name="dispatch-mode" value={value} checked={mode === value} onChange={() => { setMode(value); setError("") }} className="sr-only" /><span className="flex items-center justify-between"><span className="font-mono text-xs text-mute">{number}</span><span aria-hidden="true" className={`size-3 rounded-full border ${mode === value ? "border-ink bg-ink" : "border-mute"}`} /></span><span className="mt-3 block text-sm font-semibold">{label}</span><span className="mt-2 block text-xs leading-relaxed text-mute">{description}</span></label>)}
        </fieldset>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="card rounded-3xl p-5 sm:p-7">
            {mode === "selected" ? <>
              <h3 className="font-brand text-xl font-medium">01 · Incident & destination</h3>
              <label className="mb-5 mt-4 block text-xs text-mute">Pending incident
                <select value={report?.id ?? ""} disabled={reports.length === 0} onChange={event => onSelectReport(event.target.value)} className="mt-2 block w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-sm text-ink disabled:opacity-50"><option value="" disabled>Choose a saved report</option>{reports.map(item => <option key={item.id} value={item.id}>{item.category} · {item.area} · {item.id.slice(0, 8)}</option>)}</select>
              </label>
              <CityMap mode="dispatch" selected={destination} onSelect={id => { setDestination(id); setError("") }} disabled={!report || calculating || sending} />
              {report && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs"><p className="text-mute">Reported location: <span className="font-medium text-ink">{report.area}</span></p><button type="button" disabled={originalLocation === null} onClick={() => setDestination(originalLocation)} className="font-medium underline underline-offset-4 disabled:opacity-40">Use reported location</button></div>}
              {changedLocation && place && <p className="mt-3 rounded-xl border border-line bg-white/70 p-3 text-xs leading-relaxed text-mute">Destination changed for this plan. The original report is unchanged. Your proposed destination will need confirmation before dispatch.</p>}
            </> : <div className="py-5">
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white bg-white/70"><svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5h14v14H5zM8 9h8M8 12h8M8 15h5" /></svg></span>
              <h3 className="font-brand text-2xl font-medium">{mode === "next" ? "One considered next step." : "A coordinated response."}</h3>
              <p className="mt-4 text-sm leading-relaxed text-mute">{mode === "next" ? "Review calculates the next incident and its proposed response from the pending queue. Units are assigned only after you confirm." : "Review calculates responses for the current pending queue. If reports or assignments change, you’ll need a fresh review before confirming."}</p>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-mute">Choose Selected incident to adjust a specific destination or vehicle mix. This inbox displays the latest 50 pending reports.</p>
            </div>}
          </div>
          <div className="space-y-5">
            <section className="card rounded-3xl p-5 sm:p-7" aria-labelledby="vehicle-request-title">
              <div className="flex items-center justify-between gap-3"><h3 id="vehicle-request-title" className="font-brand text-xl font-medium">02 · Plan the response</h3><svg aria-hidden="true" className="size-5 shrink-0 text-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="white" /><circle cx="15" cy="17" r="3" fill="white" /></svg></div>
              <p className="mt-3 text-sm leading-relaxed text-mute">Start with the standard response. Adjust the requested vehicle mix when the situation calls for it.</p>
              {mode === "selected" && report ? <ResponseVehicleControls standardTypes={standardTypes} vehicleTypes={vehicleTypes} mode={selectionMode} counts={vehicleCounts} reason={adjustmentReason} adjusted={selectionMode === "manual"}
                onMode={value => { setSelectionMode(value); setError("") }}
                onCount={(name, count) => { setVehicleCounts(previous => ({ ...previous, [name]: count })); setError("") }}
                onReason={setAdjustmentReason} onReset={resetResponse} />
                : <p className="mt-5 rounded-2xl border border-dashed border-line p-5 text-sm text-mute">{mode === "selected" ? "Choose an incident to plan its response." : "A response is prepared for each selected incident. Use Selected incident for manual adjustments."}</p>}
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-mute">Up to four units per incident. Review calculates the response against current assignments; confirmation reserves the selected units.</p>
            </section>
            <section className="card rounded-3xl p-5 sm:p-7">
              <label htmlFor="dispatch-notes" className="font-brand text-xl font-medium">03 · Operator notes</label>
              <p id="dispatch-notes-help" className="mt-2 text-xs leading-relaxed text-mute">Optional coordination notes. Included in your review and saved privately with a confirmed dispatch.</p>
              <textarea id="dispatch-notes" aria-describedby="dispatch-notes-help" rows={3} maxLength={300} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Access restrictions, destination clarification, or coordination notes…" className="mt-4 block w-full resize-y rounded-xl border border-line bg-white/60 p-4 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-focus" />
              <p className="mt-2 text-right text-xs tabular-nums text-mute">{notes.length} / 300</p>
            </section>
          </div>
        </div>
        {error && <p ref={errorRef} role="alert" tabIndex={-1} className="mt-5 rounded-2xl border border-line bg-white/80 p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus">{error}</p>}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white bg-white/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium">{modeLabel}{mode === "selected" && place ? ` · ${place.name}` : ""}</p><p className="mt-1 text-xs text-mute">Review your destination and requested response. Nothing has been sent.</p></div>
          <button type="submit" disabled={sourceMissing || calculating || sending} className="primary-button shrink-0 rounded-full px-7 py-3.5 text-sm font-semibold text-white disabled:opacity-40">{calculating ? "Calculating response…" : "Review dispatch plan"}</button>
        </div>
        </fieldset>
      </form>
      <dialog ref={review} aria-labelledby="dispatch-review-title" onCancel={event => { if (sending) event.preventDefault() }} className="dispatch-review-dialog m-auto w-full max-w-xl rounded-3xl border border-white bg-canvas p-0 text-ink shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-widest text-mute">Dispatch review · Simulation</p><button type="button" disabled={sending} aria-label="Close dispatch review" onClick={() => review.current?.close()} className="flex size-8 items-center justify-center rounded-full border border-line"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
          <h2 id="dispatch-review-title" className="font-brand text-3xl font-medium tracking-tight">Ready to dispatch?</h2>
          <p className="mt-2 text-sm text-mute">{selectionMode === "manual" && mode === "selected" ? "Manual response" : "Automatic response"}{preview && preview.results.length > 1 ? ` · ${preview.results.length} incidents` : ""}</p>
          {preview && <div className="mt-6 divide-y divide-line">{preview.results.map(result => <section key={result.reportId} className="py-4 first:pt-0">
            <h3 className="text-base font-semibold">{result.category}</h3>
            <p className="mt-1 text-sm text-mute">{result.destination.name}</p>
            <p className="mt-4 text-sm">{vehicleCountSummary(result.vehicles ?? result.assignments.map(unit => unit.type))}</p>
            {result.missingTypes.length > 0 && <p className="mt-2 text-xs text-mute">Unavailable: {result.missingTypes.join(", ")}</p>}
          </section>)}</div>}
          {mode === "selected" && selectionMode === "manual" && <div className="mt-4 border-t border-line pt-4"><p className="text-xs text-mute">Adjustment reason</p><p className="mt-1 whitespace-pre-wrap text-sm">{adjustmentReason.trim()}</p></div>}
          {notes.trim() && <div className="mt-4 border-t border-line pt-4"><p className="text-xs text-mute">Operator notes</p><p className="mt-1 whitespace-pre-wrap text-sm">{notes.trim()}</p></div>}
          {dispatchError && <p role="alert" className="mt-5 rounded-xl border border-line p-4 text-sm">{dispatchError}</p>}
          {sending && <p role="status" className="mt-4 text-sm text-mute">Confirming the assignment. Keep this page open.</p>}
          <div className="mt-6 flex gap-3 border-t border-line pt-5"><button type="button" disabled={sending} onClick={() => review.current?.close()} className="home-action rounded-full border border-line px-5 py-3 text-sm font-medium">Edit plan</button><button type="button" onClick={() => void dispatch()} disabled={!preview?.canDispatch || sending} className="primary-button flex-1 rounded-full px-5 py-3 text-sm font-medium text-white disabled:opacity-40">{sending ? "Confirming…" : "Dispatch vehicles"}</button></div>
        </div>
      </dialog>
    </section>
  )
}
