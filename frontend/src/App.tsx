import { useEffect, useState } from "react"
import { suggestDispatch } from "./dispatch"
import type { Incident, Screen } from "./types"
import ReportingActions from "./components/ReportingActions"
import { junctions } from "./data/city"
import {
  createIncident,
  dispatchIncident,
  getDispatcherIncidents,
  getIncidents,
  removeIncident,
  requestHelp as submitRequests,
  updateIncident,
} from "./lib/api"
import Button from "./components/Button"
import Icon from "./components/Icon"
import Stepper from "./components/Stepper"
import LocationPage from "./pages/LocationPage"
import DetailsPage from "./pages/DetailsPage"
import ReviewPage from "./pages/ReviewPage"
import RequestStatusPage from "./pages/RequestStatusPage"
import DispatcherPage from "./pages/DispatcherPage"

export default function App() {
  const [screen, setScreen] = useState<Screen>(0)
  const [returnScreen, setReturnScreen] = useState<0 | 1 | 2 | 4>(0)
  const [location, setLocation] = useState<number | null>(null)
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState(0)
  const [people, setPeople] = useState(0)
  const [queue, setQueue] = useState<Incident[]>([])
  const [dispatcherQueue, setDispatcherQueue] = useState<Incident[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [autosaveFailed, setAutosaveFailed] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [notice, setNotice] = useState("")
  const [dispatcherError, setDispatcherError] = useState("")
  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const reports = await getIncidents()
        if (active) {
          setQueue(reports)
          setAutosaveFailed(false)
          setConnectionError("")
        }
      } catch (error) {
        if (active) {
          setAutosaveFailed(true)
          setConnectionError(
            error instanceof Error ? error.message : "Could not load your reports.",
          )
        }
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    if (screen !== 3) return
    let active = true
    const refresh = async () => {
      try {
        const reports = await getDispatcherIncidents()
        if (active) {
          setDispatcherQueue(reports)
          setDispatcherError("")
        }
      } catch (error) {
        if (active) {
          setDispatcherError(
            error instanceof Error ? error.message : "Could not refresh incidents.",
          )
        }
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [screen])
  const hasLocation = location !== null
  const locationName = (id: number) => junctions[id].name
  const navigate = (next: Screen) => {
    window.history.pushState({ resqnetScreen: next }, "")
    setScreen(next)
    setNotice("")
  }
  useEffect(() => {
    window.history.replaceState({ resqnetScreen: 0 }, "")
  }, [])
  useEffect(() => {
    const back = (e: PopStateEvent) => {
      const next = e.state?.resqnetScreen ?? 0
      setScreen(next === 1 && !hasLocation ? 0 : next)
      if (next !== 3) setDispatcherQueue([])
    }
    window.addEventListener("popstate", back)
    return () => window.removeEventListener("popstate", back)
  }, [hasLocation])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    document.getElementById("screen-title")?.focus({ preventScroll: true })
  }, [screen])
  const requestHelp = async () => {
    try {
      const reports = await submitRequests()
      setQueue(reports)
      setAutosaveFailed(false)
      setNotice("")
      navigate(4)
    } catch (error) {
      setAutosaveFailed(true)
      setNotice(
        error instanceof Error ? error.message : "Could not submit your request.",
      )
    }
  }
  const approve = async (id: number, overrides: Record<string, number>) => {
    const report = dispatcherQueue.find((item) => item.id === id)
    if (!report || report.state !== "requested") return
    try {
      const plan = suggestDispatch(report, dispatcherQueue, overrides)
      if (!plan.assignments.length) return
      const updated = await dispatchIncident(id, plan)
      setDispatcherQueue((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      )
      setDispatcherError("")
    } catch (error) {
      setDispatcherError(
        error instanceof Error ? error.message : "Could not dispatch this incident.",
      )
    }
  }
  const openDispatcher = () => {
    setReturnScreen(screen as 0 | 1 | 2 | 4)
    setDispatcherError("")
    setDispatcherQueue([])
    navigate(3)
  }
  const selectLocation = (id: number) => setLocation(id)
  const reset = () => {
    setLocation(null)
    setType("")
    setSeverity(0)
    setPeople(0)
    setEditing(null)
  }
  const add = async () => {
    if (location === null || !type || !severity) return
    if (editing !== null && queue.find((i) => i.id === editing)?.state) {
      navigate(4)
      return
    }
    const draft = {
      location,
      type,
      severity,
      people,
    }
    try {
      const entry =
        editing !== null && queue.some((item) => item.id === editing)
          ? await updateIncident(editing, draft)
          : await createIncident(draft)
      setQueue((current) =>
        current.some((item) => item.id === entry.id)
          ? current.map((item) => (item.id === entry.id ? entry : item))
          : [...current, entry],
      )
      setEditing(entry.id)
      setAutosaveFailed(false)
      setNotice("")
      navigate(2)
    } catch (error) {
      setAutosaveFailed(true)
      setNotice(
        error instanceof Error ? error.message : "Could not save your report.",
      )
    }
  }
  const edit = (i: Incident) => {
    setLocation(i.location)
    setType(i.type)
    setSeverity(i.severity)
    setPeople(i.people)
    setEditing(i.id)
    navigate(1)
  }
  const remove = async (id: number) => {
    try {
      await removeIncident(id)
      setQueue((current) => current.filter((item) => item.id !== id))
      if (editing === id) reset()
      setNotice("")
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not remove this report.",
      )
    }
  }
  const changePeople = (n: number) =>
    setPeople(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0)
  const titles = [
    "City network",
    "Incident details",
    "Check your report",
    "Dispatcher view",
    "Your request",
  ]
  const subtitles = [
    "Explore the city. Select a junction to report an emergency.",
    "Select the emergency type, severity and people affected.",
    "Check the details before requesting help.",
    "",
    "Updates appear here when the dispatcher approves your response.",
  ]
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="wordmark">RESQNET</div>
          <div className="header-actions">
            <span>Emergency reporting</span>
            <Button
              variant="secondary"
              onClick={() => {
                if (screen === 3) {
                  setDispatcherQueue([])
                  navigate(returnScreen)
                } else openDispatcher()
              }}
            >
              {screen === 3 ? "Back to reporting" : "Dispatcher view"}
              <Icon name={screen === 3 ? "arrow" : "route"} size={14} />
            </Button>
          </div>
        </div>
      </header>
      {screen === 3 ? (
        <>
          <DispatcherPage
            queue={dispatcherQueue.filter((item) => item.state !== undefined)}
            onApprove={approve}
          />
          {dispatcherError && (
            <div className="report-notice" role="alert">
              {dispatcherError}
            </div>
          )}
        </>
      ) : (
        <>
          <Stepper
            current={screen === 4 ? 2 : screen}
            available={[true, hasLocation, queue.length > 0]}
            onChange={(s) => {
              if (
                s === 0 ||
                (s === 1 && hasLocation) ||
                (s === 2 && queue.length > 0)
              )
                navigate(s as Screen)
            }}
          />
          <main className="report-page wizard-page public-flow">
            <div
              className={`page-heading ${
                screen === 0 ? "map-screen-heading" : ""
              }`}
            >
              <h1 id="screen-title" tabIndex={-1}>
                {titles[screen]}
              </h1>
              {screen === 1 && location !== null ? (
                <div className="heading-location">
                  <span>
                    Reporting at <strong>{locationName(location)}</strong>
                  </span>
                  <span className="heading-location-dot" aria-hidden="true">
                    ·
                  </span>
                  <Button variant="quiet" onClick={() => navigate(0)}>
                    Change
                  </Button>
                </div>
              ) : (
                <p>{subtitles[screen]}</p>
              )}
            </div>
            {screen === 0 && (
              <LocationPage
                location={location}
                queue={queue}
                onSelect={selectLocation}
              />
            )}

            {screen === 1 && location !== null && (
              <DetailsPage
                type={type}
                setType={setType}
                severity={severity}
                setSeverity={setSeverity}
                people={people}
                changePeople={changePeople}
              />
            )}

            {screen === 2 && (
              <ReviewPage
                queue={queue}
                autosaveFailed={autosaveFailed}
                onEdit={edit}
                onRemove={remove}
              />
            )}
            {screen === 4 && <RequestStatusPage queue={queue} />}

            <ReportingActions
              screen={screen}
              queue={queue}
              location={location}
              type={type}
              severity={severity}
              people={people}
              onNavigate={navigate}
              onReset={reset}
              onReview={add}
              onRequestHelp={requestHelp}
            />
            {autosaveFailed && (
              <div className="report-notice" role="alert">
                {connectionError ||
                  "The server is unavailable. Your reports could not be synced."}
              </div>
            )}
            {notice && (
              <div className="report-notice" role="alert">
                {notice}
              </div>
            )}
          </main>
        </>
      )}
      <footer>RESQNET · Emergency reporting</footer>
    </>
  )
}
