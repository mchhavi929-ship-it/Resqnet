import { memo, useEffect, useMemo, useRef, useState } from "react"
import { TRAVEL_MS } from "./lib/response-journey"
import JourneyMapBackdrop from "./JourneyMapBackdrop"
import { junctions } from "../shared/resqnet"

type Point = { x: number; y: number }

function roundedRoute(points: Point[]) {
  if (!points.length) return ""
  let path = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1], corner = points[i], after = points[i + 1]
    const incoming = Math.hypot(corner.x - before.x, corner.y - before.y)
    const outgoing = Math.hypot(after.x - corner.x, after.y - corner.y)
    const radius = Math.min(12, incoming / 3, outgoing / 3)
    path += ` L${corner.x - (corner.x - before.x) * radius / incoming},${corner.y - (corner.y - before.y) * radius / incoming}`
    path += ` Q${corner.x},${corner.y} ${corner.x + (after.x - corner.x) * radius / outgoing},${corner.y + (after.y - corner.y) * radius / outgoing}`
  }
  return `${path} L${points[points.length - 1].x},${points[points.length - 1].y}`
}

export default memo(function JourneyMap({ points, dispatchedAt, destination, arrived }: {
  points: Point[]; dispatchedAt: string; destination: string; arrived: boolean
}) {
  const route = useMemo(() => roundedRoute(points), [points])
  const path = useRef<SVGPathElement>(null)
  const marker = useRef<SVGGElement>(null)
  const trail = useRef<SVGPathElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const width = 440 / zoomLevel, height = width / 1.4
  const zoom = (amount: number) => setZoomLevel(previous => Math.min(2.5, Math.max(1, previous + amount)))
  const start = points[0]
  const startingPlace = junctions.find(place => place.x === start.x && place.y === start.y)?.name ?? "Response base"

  useEffect(() => {
    const line = path.current
    if (!line) return
    const length = line.getTotalLength()
    const started = Date.parse(dispatchedAt)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    let disposed = false
    let visible = typeof IntersectionObserver === "undefined"
    let lastFrame = 0
    const draw = (timestamp = 0) => {
      if (disposed) return
      if (document.hidden || !visible) return
      if (timestamp && timestamp - lastFrame < 1000 / 30) {
        frame = requestAnimationFrame(draw)
        return
      }
      lastFrame = timestamp
      const progress = Number.isFinite(started) ? Math.min(1, Math.max(0, Date.now() - started) / TRAVEL_MS) : 0
      const distance = (reduced.matches && progress < 1 ? 0 : progress) * length
      const point = line.getPointAtLength(distance)
      const before = line.getPointAtLength(Math.max(0, distance - .5))
      const after = line.getPointAtLength(Math.min(length, distance + .5))
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI
      marker.current?.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`)
      trail.current?.setAttribute("stroke-dasharray", `${distance} ${length}`)
      if (progress < 1 && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw)
    }
    const resume = () => { cancelAnimationFrame(frame); lastFrame = 0; draw() }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false
      resume()
    })
    if (container.current) observer?.observe(container.current)
    if (!observer) draw()
    // Reduced-motion users see static locations; arrival still updates correctly.
    const timer = window.setInterval(() => { if (reduced.matches) draw() }, 1000)
    document.addEventListener("visibilitychange", resume)
    reduced.addEventListener("change", resume)
    return () => {
      disposed = true; cancelAnimationFrame(frame); clearInterval(timer)
      observer?.disconnect()
      document.removeEventListener("visibilitychange", resume)
      reduced.removeEventListener("change", resume)
    }
  }, [route, dispatchedAt])

  const end = points[points.length - 1]
  return (
    <div ref={container} className="overflow-hidden rounded-2xl border border-line">
    <div className="journey-navigation-map relative">
      <svg viewBox={`${150 - width / 2} ${95 - height / 2} ${width} ${height}`} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-focus"
        role="group" tabIndex={0} aria-label={`Full simulated city map. Start: ${startingPlace}. Destination: ${destination}. ${arrived ? "Team at the scene." : "Vehicle on the way."} Use plus or minus to zoom, or zero to show the whole map.`}
        onKeyDown={event => {
          if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(.3) }
          else if (event.key === "-") { event.preventDefault(); zoom(-.3) }
          else if (event.key === "0") { event.preventDefault(); setZoomLevel(1) }
        }}>
        <JourneyMapBackdrop />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={route} className="stroke-white" strokeWidth="6" />
          <path ref={path} d={route} className="map-route-ahead" strokeWidth="3.5" />
          <path ref={trail} d={route} className="stroke-ink" strokeWidth="3.5" />
        </g>
        <g transform={`translate(${start.x} ${start.y})`}>
          <circle r="6" className="fill-white stroke-ink" strokeWidth="1.5" />
          <circle r="2" className="fill-ink" />
          <text x="0" y="-17" textAnchor="middle" className="map-destination-label" fontSize="7" fontWeight="600">START</text>
        </g>
        <g transform={`translate(${end.x} ${end.y})`}>
          {arrived && <circle r="14" className="scene-beacon fill-none stroke-ink/30" />}
          <path d="M0 0C-3-4-7-8-7-12a7 7 0 0 1 14 0C7-8 3-4 0 0Z" className="fill-ink stroke-white" strokeWidth="1.5" />
          <circle cy="-12" r="2" className="fill-white" />
          <text x="0" y="-27" textAnchor="middle" className="map-destination-label" fontSize="7" fontWeight="600">DESTINATION</text>
        </g>
        <g ref={marker} transform={`translate(${points[0].x} ${points[0].y})`} aria-hidden="true">
          <circle r="12" className="fill-white/80" />
          <rect x="-8" y="-4.5" width="16" height="9" rx="3" className="fill-ink stroke-white" strokeWidth="1" />
          <path d="M2-3v6M-4-3v6" className="stroke-white/70" strokeWidth="1.5" />
          <path d="M7-2v4" className="stroke-white" strokeWidth="1.5" />
        </g>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute right-3 top-3 flex flex-col items-center gap-1 rounded-full border border-white bg-white/90 px-2 py-2 text-xs font-medium shadow-sm"><span>N</span><svg className="size-3 text-ink" viewBox="0 0 16 16" fill="currentColor"><path d="m8 1 5 13-5-3-5 3Z" /></svg></div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button type="button" onClick={() => setZoomLevel(1)} aria-label="Show whole map" className="home-action flex h-10 items-center justify-center rounded-xl border border-line bg-white px-3 text-xs font-medium shadow-sm">Full map</button>
        <div className="flex overflow-hidden rounded-xl border border-line bg-white shadow-sm"><button type="button" onClick={() => zoom(-.3)} disabled={zoomLevel <= 1} aria-label="Zoom out" className="size-10 text-xl disabled:opacity-30">−</button><button type="button" onClick={() => zoom(.3)} disabled={zoomLevel >= 2.5} aria-label="Zoom in" className="size-10 border-l border-line text-xl disabled:opacity-30">+</button></div>
      </div>
    </div>
    <dl className="grid grid-cols-2 gap-4 border-t border-line bg-white/90 p-4">
      <div className="min-w-0"><dt className="flex items-center gap-2 text-xs text-mute"><svg aria-hidden="true" className="size-3.5 text-ink" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>Start</dt><dd className="mt-1 break-words text-sm font-medium">{startingPlace}</dd></div>
      <div className="min-w-0"><dt className="flex items-center gap-2 text-xs text-mute"><svg aria-hidden="true" className="size-3.5 text-ink" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15S2 9 2 6a6 6 0 0 1 12 0c0 3-6 9-6 9Z" /><circle cx="8" cy="6" r="2" fill="white" /></svg>Destination</dt><dd className="mt-1 break-words text-sm font-medium">{destination}</dd></div>
    </dl>
    </div>
  )
})
