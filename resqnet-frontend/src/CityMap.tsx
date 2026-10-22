import { useEffect, useRef, useState, type PointerEvent } from "react"
import { junctions, roads } from "../shared/resqnet"
import MapLandmarks, { landmarkLabels } from "./MapLandmarks"

const initialView = { x: 150, y: 100, zoom: 1 }
const buildings = Array.from({ length: 6 }, (_, row) =>
  Array.from({ length: 9 }, (_, column) => ({
    x: -50 + column * 45, y: -36 + row * 48,
    width: column % 3 === 0 ? 23 : 30, height: row % 2 === 0 ? 21 : 27,
  })),
).flat()

function boundView(view: typeof initialView) {
  const zoom = Math.min(2.5, Math.max(1, view.zoom))
  const halfWidth = 230 / zoom
  const halfHeight = 165 / zoom
  return { zoom, x: Math.max(-80 + halfWidth, Math.min(380 - halfWidth, view.x)), y: Math.max(-65 + halfHeight, Math.min(265 - halfHeight, view.y)) }
}

export default function CityMap({ selected, onSelect, disabled, mode = "report", journey }: {
  selected: number | null; onSelect: (id: number) => void; disabled: boolean; mode?: "report" | "explore" | "dispatch" | "tracking"
  journey?: { points: { x: number; y: number }[]; progress: number }
}) {
  const [view, setView] = useState(initialView)
  const drag = useRef<{ id: number; clientX: number; clientY: number; view: typeof initialView } | null>(null)
  const width = 460 / view.zoom
  const height = 330 / view.zoom
  const place = junctions.find(node => node.id === selected)
  const segmentLengths = journey?.points.slice(1).map((point, index) => Math.hypot(point.x - journey.points[index].x, point.y - journey.points[index].y)) ?? []
  let remaining = segmentLengths.reduce((sum, length) => sum + length, 0) * (journey?.progress ?? 0)
  let vehicle = journey?.points[0]
  for (let index = 0; index < segmentLengths.length; index++) {
    const length = segmentLengths[index]
    const from = journey!.points[index]
    const to = journey!.points[index + 1]
    const fraction = length ? Math.min(1, remaining / length) : 1
    vehicle = { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction }
    if (remaining <= length) break
    remaining -= length
  }

  useEffect(() => {
    const node = junctions.find(node => node.id === selected)
    if (!node) return
    setView(previous => {
      const marginX = 210 / previous.zoom
      const marginY = 140 / previous.zoom
      return Math.abs(node.x - previous.x) > marginX || Math.abs(node.y - previous.y) > marginY
        ? boundView({ ...previous, x: node.x, y: node.y }) : previous
    })
  }, [selected])

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || event.button !== 0 || (event.target as Element).closest(".city-junction")) return
    drag.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, view }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current
    if (!start || disabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    setView(boundView({
      ...start.view,
      x: start.view.x - (event.clientX - start.clientX) * (460 / start.view.zoom) / rect.width,
      y: start.view.y - (event.clientY - start.clientY) * (330 / start.view.zoom) / rect.height,
    }))
  }

  return (
    <div>
      <div className="city-graph relative overflow-hidden rounded-2xl border border-white">
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-white/90 bg-white/90 px-3 py-2 text-xs font-medium shadow-sm">ResqNet City <span className="ml-2 text-mute">Demo map</span></div>
        <svg viewBox={`${view.x - width / 2} ${view.y - height / 2} ${width} ${height}`}
          className="city-street-map block w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-focus"
          role="group" tabIndex={disabled ? -1 : 0} aria-label={mode === "tracking" ? "Simulated vehicle journey to the incident. Illustrated map, not live GPS." : "Street-style simulator map. Select a junction. Drag to pan; use arrow keys to pan or buttons to zoom."}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
          onKeyDown={event => {
            const directions: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }
            if (disabled || event.target !== event.currentTarget || !directions[event.key]) return
            event.preventDefault()
            const [x, y] = directions[event.key]
            setView(previous => boundView({ ...previous, x: previous.x + x / previous.zoom, y: previous.y + y / previous.zoom }))
          }}>
          <defs>
            <pattern id="city-parcels" width="45" height="48" patternUnits="userSpaceOnUse"><rect width="45" height="48" fill="#eeeee7" /><path d="M0 48V0H45" fill="none" stroke="#fff" strokeWidth="3" /></pattern>
            <pattern id="city-park" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#d6e3cc" /><circle cx="6" cy="6" r="2" fill="#b9ceb0" opacity=".5" /></pattern>
          </defs>
          <g aria-hidden="true" pointerEvents="none">
            <rect x="-100" y="-100" width="550" height="450" fill="url(#city-parcels)" />
            {buildings.map((building, index) => <rect key={index} {...building} rx="2" fill={index % 3 === 0 ? "#dfded4" : "#e2e1d8"} stroke="#d5d5ca" strokeWidth=".5" />)}
            <path d="M-65 32Q-32 12-15 42L-15 83Q-30 107-65 85Z" fill="url(#city-park)" stroke="#c4d4ba" />
            <rect x="120" y="123" width="58" height="54" rx="8" fill="url(#city-park)" stroke="#c4d4ba" />
            <path d="M340-80C320-10 365 30 341 90S335 190 375 270" fill="none" stroke="#bbd8dd" strokeWidth="19" />
            <path d="M340-80C320-10 365 30 341 90S335 190 375 270" fill="none" stroke="#cde5e7" strokeWidth="13" />
            <text x="149" y="146" textAnchor="middle" fontSize="6" fill="#7c9472" letterSpacing=".5">CITY</text><text x="149" y="155" textAnchor="middle" fontSize="6" fill="#7c9472" letterSpacing=".5">GARDENS</text>
            {junctions.filter(node => node.kind !== "normal").map(node => <rect key={node.id} x={node.x - 26} y={node.y - 27} width="52" height="50" rx="5" fill={node.kind === "hospital" ? "#dbe8e4" : "#e6e0d2"} stroke="#cbd5ce" />)}
            {roads.map(road => {
              const from = junctions.find(node => node.id === road.source)!
              const to = junctions.find(node => node.id === road.target)!
              return <g key={`${road.source}-${road.target}`}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#cfcec1" strokeWidth="13" strokeLinecap="round" /><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#fffef7" strokeWidth="10" strokeLinecap="round" /><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#dedbcc" strokeWidth=".7" strokeDasharray="3 4" /></g>
            })}
            <text x="145" y="3" textAnchor="middle" fontSize="5" fill="#989687" className="map-road-name">MAIN ROAD</text>
            <text x="250" y="103" textAnchor="middle" fontSize="5" fill="#989687" className="map-road-name">CITY NETWORK</text>
          </g>
          <MapLandmarks />
          {journey && <polyline points={journey.points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ink" />}
          {junctions.map(node => {
            if (mode === "tracking" && node.id !== selected) return null
            const active = selected === node.id
            const label = landmarkLabels[node.id] ?? { x: node.x, y: node.y + 14 }
            return <g key={node.id} role="button" tabIndex={disabled ? -1 : 0} aria-pressed={active} aria-disabled={disabled}
              aria-label={`${node.name}, junction ${node.id}${node.kind !== "normal" ? `, ${node.kind}` : ""}`}
              className="city-junction" onClick={() => { if (!disabled) onSelect(node.id) }}
              onKeyDown={event => { if (!disabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.stopPropagation(); onSelect(node.id) } }}>
              <circle cx={node.x} cy={node.y - 9} r="23" fill="transparent" />
              {active && <circle cx={node.x} cy={node.y} r="23" fill="#b6cdb8" opacity=".45" />}
              <path className="junction-focus map-pin" d="M0 0C-4-6-12-12-12-20a12 12 0 0 1 24 0C12-12 4-6 0 0Z" transform={`translate(${node.x} ${node.y})`}
                fill={active ? "#171717" : "#fff"} stroke={active ? "#171717" : "#9ba79c"} strokeWidth="1.2" />
              <text x={node.x} y={node.y - 16} textAnchor="middle" fontSize="9" fontWeight="600" fill={active ? "white" : "#334438"} pointerEvents="none">{node.id}</text>
              <text className="map-place-label" x={label.x} y={label.y} textAnchor="middle" fontSize="8" fontWeight={active ? "700" : "600"} fill={active ? "#171717" : "#3c4840"}>{node.name}</text>
            </g>
          })}
          {vehicle && <g transform={`translate(${vehicle.x} ${vehicle.y})`} className="journey-vehicle" aria-hidden="true">
            <circle r="17" className="fill-white stroke-ink" strokeWidth="1" />
            <g transform="translate(-10 -10)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <path d="M2 5h11v10H2zM13 9h4l3 4v2h-7M5 8h5M7.5 5.5v5" />
              <circle cx="5" cy="16" r="2" /><circle cx="16" cy="16" r="2" />
            </g>
          </g>}
        </svg>
        {mode !== "tracking" && <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm" aria-label="Map controls">
          <button type="button" disabled={disabled || view.zoom >= 2.5} onClick={() => setView(previous => boundView({ ...previous, zoom: previous.zoom + .3 }))} aria-label="Zoom in" className="size-11 text-xl hover:bg-surface disabled:opacity-30">+</button>
          <button type="button" disabled={disabled || view.zoom <= 1} onClick={() => setView(previous => boundView({ ...previous, zoom: previous.zoom - .3 }))} aria-label="Zoom out" className="size-11 border-t border-line text-xl hover:bg-surface disabled:opacity-30">−</button>
          <button type="button" disabled={disabled} onClick={() => setView(initialView)} aria-label="Show all ten junctions" className="size-11 border-t border-line text-xs font-medium hover:bg-surface">Fit</button>
        </div>}
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-1 text-xs text-mute">Illustrated city · not real GPS</span>
      </div>
      {mode !== "tracking" && <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-mute"><span>10 junctions · 14 connected roads</span><span>Drag to explore · tap a pin</span></div>}
      {mode !== "explore" && mode !== "tracking" && <label className="mt-5 block text-sm font-medium">{mode === "dispatch" ? "Dispatch destination" : "Incident location"}
        <span className="relative mt-2 block">
        <select value={selected ?? ""} onChange={event => onSelect(Number(event.target.value))} required disabled={disabled} className="block w-full appearance-none rounded-xl border border-line bg-white/70 py-3 pl-4 pr-12 text-sm focus:outline-2 focus:outline-focus">
          <option value="" disabled>Select a junction on the map or from this list</option>
          {junctions.map(node => <option key={node.id} value={node.id}>{node.id}. {node.name}</option>)}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-6 top-1/2 size-4 -translate-y-1/2 text-mute"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </label>}
      {mode !== "explore" && mode !== "tracking" && place && <p role="status" className="mt-3 text-xs text-mute">Pin selected: {place.name} · Junction {place.id}.{mode === "dispatch" ? " The original report location is unchanged." : ""}</p>}
    </div>
  )
}
