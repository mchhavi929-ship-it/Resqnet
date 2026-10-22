import { useEffect, useRef, useState, type FormEvent } from "react"
import CityMap from "./CityMap"
import { incidentTypes, junctions } from "../shared/resqnet"
import { commonIncidentIds, situationsFor, situationVersion, isCustomSituation, customDescriptionMin, customDescriptionMax } from "../shared/report-options"
import { severities, type Report, type ReportDraft } from "./lib/reports"
import ReportReview from "./ReportReview"
import ReportSteps from "./ReportSteps"
import { transitionPage } from "./lib/page-transition"

export default function ReportPage({ onBack, onSaved }: { onBack: () => void; onSaved: (report: Report) => void }) {
  const [location, setLocation] = useState<number | null>(null)
  const [people, setPeople] = useState(0)
  const [severity, setSeverity] = useState<number | null>(null)
  const severityLabel = severity === null ? "Choose a level" : severity <= 3 ? "Minor" : severity <= 6 ? "Moderate" : severity <= 8 ? "Severe" : "Critical"
  const severityHint = severity === null ? "Select the level that best describes the incident." : severity <= 3 ? "Limited impact, with no obvious immediate danger." : severity <= 6 ? "Significant impact that may need prompt assistance." : severity <= 8 ? "Serious danger or major injuries may be present." : "An immediate threat to life or widespread danger."
  const [type, setType] = useState<number | null>(null)
  const [situation, setSituation] = useState<number | null>(null)
  const [customDescription, setCustomDescription] = useState("")
  const customSituation = type !== null && situation !== null && isCustomSituation(type, situation)
  const severityTone = severity === null ? "unselected" : severity <= 3 ? "minor" : severity <= 6 ? "moderate" : severity <= 8 ? "severe" : "critical"
  const [showOther, setShowOther] = useState(false)
  const situationChoices = type === null ? [] : situationsFor(type)
  const selectedType = incidentTypes.find(item => item.id === type)
  const selectedPlace = junctions.find(item => item.id === location)
  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [error, setError] = useState("")
  const title = useRef<HTMLHeadingElement>(null)
  const errorSummary = useRef<HTMLParagraphElement>(null)
  const completeChoices = [location !== null, type !== null, severity !== null, situation !== null].filter(Boolean).length
  useEffect(() => { if (!draft) { title.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) } }, [draft])
  useEffect(() => {
    document.title = draft ? "Review report · ResqNet" : "Report an incident · ResqNet"
    return () => { document.title = "ResqNet" }
  }, [draft])
  useEffect(() => { if (error) errorSummary.current?.focus() }, [error])

  const selectType = (id: number) => {
    if (id !== type) { setType(id); setSituation(null); setCustomDescription(""); setError("") }
    if (commonIncidentIds.includes(id)) setShowOther(false)
  }
  const typeChoice = (item: typeof incidentTypes[number]) => (
    <label key={item.id} className={`relative flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-left text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-focus ${type === item.id ? "border-ink bg-ink text-white" : "border-line bg-white/60 hover:bg-white"}`}>
      <input className="sr-only" type="radio" name="type" value={item.id} checked={type === item.id} onChange={() => selectType(item.id)} required />
      {item.name}
    </label>
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const missing = [location === null && "an incident location", type === null && "an emergency type", severity === null && "a severity score", situation === null && "a situation"].filter(Boolean)
    if (missing.length) { setError(`Before continuing, choose ${missing.join(", ")}.`); errorSummary.current?.focus(); return }
    if (location === null || type === null || severity === null || situation === null) return
    if (!Number.isInteger(people) || people < 0 || people > 100000) { setError("Enter a whole number of people between 0 and 100,000."); return }
    if (customSituation && (customDescription.trim().length < customDescriptionMin || customDescription.trim().length > customDescriptionMax)) { setError(`Describe the emergency in ${customDescriptionMin}–${customDescriptionMax} characters before continuing.`); return }
    setError("")
    const next = { requestId: crypto.randomUUID(), location, people, severity, type, situation, situationVersion, ...(customSituation ? { customDescription: customDescription.trim() } : {}) }
    transitionPage(() => setDraft(next))
  }

  if (draft) return <ReportReview draft={draft} onEdit={() => transitionPage(() => setDraft(null), "back")} onDone={onSaved} />

  return (
    <main className="dashboard report-page flex-1 px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={onBack} className="home-action mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-5 py-2.5 text-sm"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>Back to overview</button>
        <ReportSteps current={1} />
        <p className="text-xs font-medium uppercase tracking-widest text-mute">Report an incident</p>
        <h1 ref={title} tabIndex={-1} className="mt-3 text-4xl font-semibold tracking-tight outline-none">A few details. A better response.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">Choose where the incident is, what happened, and how many people are affected. You’ll review everything before sending it to the dispatcher.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-mute"><span className="inline-flex gap-1" aria-hidden="true">{[1, 2, 3, 4].map(step => <span key={step} className={`report-readiness h-1 w-8 rounded-full ${completeChoices >= step ? "bg-ink" : "bg-line"}`} />)}</span><span>{completeChoices} of 4 required choices completed</span><span className="text-mute">Nothing sent yet</span></div>
        <form onSubmit={submit} noValidate className="mt-8">
          {error && <p ref={errorSummary} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-line bg-white/80 p-4 text-sm focus:outline-2 focus:outline-focus">{error} Your entries are still here.</p>}
          <fieldset className="grid items-start gap-6 lg:grid-cols-2">
            <div className="space-y-6 lg:sticky lg:top-6">
            <section className="card rounded-3xl p-6 sm:p-7">
              <h2 className="text-xl font-semibold">01 · Where is the incident?</h2>
              <p className="mt-2 text-xs text-mute">Required · Tap a map pin or choose a place from the list below.</p>
              <div className="mt-5"><CityMap selected={location} onSelect={setLocation} disabled={false} /></div>
            </section>

            </div>
            <div className="space-y-6">
              <section className="card rounded-3xl p-6 sm:p-7">
                <h2 className="text-xl font-semibold">02 · Type of emergency</h2>
                <p className="mt-2 text-xs text-mute">Required · Choose the closest match. Other emergency shows more options.</p>
                <div className="report-type-choices mt-5 grid grid-cols-2 gap-2">
                  {incidentTypes.filter(item => commonIncidentIds.includes(item.id)).map(typeChoice)}
                  <button type="button" aria-expanded={showOther} aria-controls="other-emergency-types" onClick={() => setShowOther(previous => !previous)} className={`col-span-2 flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium focus-visible:outline-2 focus-visible:outline-focus ${type !== null && !commonIncidentIds.includes(type) ? "border-ink bg-ink text-white" : "border-line bg-white/60 hover:bg-white"}`}>
                    <span>{type !== null && !commonIncidentIds.includes(type) ? `Other · ${selectedType?.name}` : "Other emergency"}</span><span aria-hidden="true">{showOther ? "−" : "+"}</span>
                  </button>
                </div>
                <div id="other-emergency-types" className="form-collapse" data-open={showOther} aria-hidden={!showOther} inert={!showOther}><div className="disclosure-content"><div className="pt-4">
                  <p className="mb-3 text-xs text-mute">More emergency types</p>
                  <div className="report-type-choices grid grid-cols-2 gap-2">{incidentTypes.filter(item => !commonIncidentIds.includes(item.id)).map(typeChoice)}</div>
                </div></div></div>
                {selectedType && <p className="mt-4 text-xs leading-relaxed text-mute">Required vehicle types: {selectedType.vehicles.join(", ")}. Assignment depends on dispatcher action and availability.</p>}
              </section>
              <section className="card rounded-3xl p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4"><label htmlFor="people-count" className="text-xl font-semibold">03 · People affected</label><input id="people-count" aria-label="Number of people affected" type="number" min="0" max="100000" step="1" required value={people} onChange={e => setPeople(e.target.value === "" ? 0 : Number(e.target.value))} className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-right text-2xl font-semibold tabular-nums focus:outline-2 focus:outline-focus sm:w-32" /></div>
                <p className="mt-2 text-xs text-mute">Give your best estimate. Leave 0 if nobody is affected. For more than 200, type the number above.</p>
                <input id="people" aria-label="People affected slider" type="range" min="0" max="200" step="1" value={Math.min(200, Math.max(0, people))} onChange={e => setPeople(Number(e.target.value))} className="mt-6 w-full accent-ink" />
                <div className="mt-2 flex justify-between text-xs text-mute"><span>0 people</span><span>200+</span></div>
              </section>
              <section data-severity={severityTone} className="severity-panel card rounded-3xl p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">04 · Severity score</h2><span className="rounded-full border border-line bg-white/60 px-3 py-1 text-xs text-mute">Your assessment</span></div>
                <div className="mt-6 flex items-center gap-5" aria-live="polite" aria-atomic="true">
                  <div className="flex shrink-0 items-baseline gap-1"><span className="severity-readout text-6xl font-medium tracking-tighter tabular-nums">{severity === null ? "—" : String(severity).padStart(2, "0")}</span><span className="text-sm text-mute">/ 10</span></div>
                  <div><p className="severity-label text-base font-semibold">{severityLabel}</p><p className="mt-1 text-xs leading-relaxed text-mute">{severityHint}</p></div>
                </div>
                <div className="severity-meter mt-6 grid grid-cols-5 gap-1 sm:grid-cols-10 sm:gap-2 lg:grid-cols-5 xl:grid-cols-10 xl:gap-1" role="group" aria-label="Select severity score from 1 to 10">
                  {severities.map(score => <button key={score} type="button" aria-pressed={severity === score} aria-label={`Severity ${score} of 10`} onClick={() => setSeverity(score)} className={`severity-step group flex flex-col items-center gap-2 rounded-lg px-1 pb-2 pt-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${severity === score ? "is-selected" : ""} ${severity !== null && score <= severity ? "is-filled" : ""}`}><span className="severity-bar-track flex h-12 w-full items-end overflow-hidden rounded-md sm:h-20 lg:h-12 xl:h-20" aria-hidden="true"><span className="severity-bar block w-full rounded-md" /></span><span className={`text-xs tabular-nums ${severity === score ? "font-semibold text-ink" : "text-mute"}`}>{score}</span></button>)}
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-3 text-xs text-mute"><span>Lower impact</span><span>Higher impact</span></div>
              </section>
            <section className="card rounded-3xl p-6 sm:p-7">
              <h2 className="text-xl font-semibold">05 · What is the situation?</h2>
              <p className="mt-2 text-xs text-mute" role="status">{selectedType ? `For ${selectedType.name.toLowerCase()}, choose the closest description.` : "Choose an emergency type first to see relevant situations."}</p>
              <div className="mt-5 space-y-2">
                {situationChoices.map((description, index) => <label key={`${type}:${description}`} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-focus ${situation === index ? "border-ink bg-white/90" : "border-line bg-white/40"}`}><input type="radio" name="situation" value={index} checked={situation === index} onChange={() => setSituation(index)} required className="accent-ink" />{description}</label>)}
                {type === null && <p className="rounded-xl border border-dashed border-line bg-white/40 p-5 text-sm text-mute">Situation options will adapt to your emergency.</p>}
              </div>
              {customSituation && (
                <div className="mt-4">
                  <label htmlFor="custom-description" className="text-sm font-medium">Describe your emergency</label>
                  <textarea id="custom-description" required minLength={customDescriptionMin} maxLength={customDescriptionMax} rows={4} value={customDescription} onChange={event => setCustomDescription(event.target.value)} aria-describedby="description-help" placeholder="Tell us what is happening and what kind of help is needed…" className="mt-2 block w-full resize-y rounded-xl border border-line bg-white/70 p-4 text-sm leading-relaxed outline-none focus:border-focus focus:ring-2 focus:ring-focus/20" />
                  <div id="description-help" className="mt-2 flex justify-between gap-3 text-xs text-mute"><span>10–180 characters. Avoid names or contact details; this description appears in reports.</span><span className="shrink-0 tabular-nums">{customDescription.length}/{customDescriptionMax}</span></div>
                </div>
              )}
            </section>
            </div>
          </fieldset>
          {selectedType && (
            <section className="card mt-6 rounded-3xl p-6 sm:p-7">
              <h2 className="text-lg font-semibold">Precautions · {selectedType.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-mute">{selectedType.precaution}</p>
            </section>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white bg-white/50 p-5">
            <div className="max-w-xl"><p className="text-sm font-medium">{selectedType?.name ?? "Choose an emergency"} · {selectedPlace?.name ?? "Choose a location"}</p><p className="mt-2 text-xs leading-relaxed text-mute">Take a breath. Stay somewhere safe. Sharing clear details is a meaningful first step toward getting the right help.</p></div>
            <div className="w-full text-center sm:w-auto"><button type="submit" className="primary-button inline-flex w-full items-center justify-center gap-4 rounded-full px-6 py-3.5 text-sm font-semibold text-white sm:w-auto sm:px-8">Continue to review<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button><p className="mt-2 text-xs text-mute">Not sent yet · You can edit on the next page</p></div>
          </div>
        </form>
      </div>
    </main>
  )
}
