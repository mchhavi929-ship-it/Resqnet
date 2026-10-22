import { memo } from "react"
import { junctions, roads } from "../shared/resqnet"

// Decorative cartography only; these local streets never affect dispatch routing.
const blocks = [
  [-75, -90, 66, 72], [13, -80, 70, 60], [116, -74, 64, 53], [215, -90, 67, 70],
  [16, 18, 63, 62], [117, 18, 64, 63], [215, 20, 66, 58],
  [-78, 117, 61, 66], [16, 120, 63, 62], [120, 119, 27, 33], [216, 119, 65, 62],
  [16, 220, 63, 54], [120, 219, 62, 57], [218, 220, 62, 63],
]

export default memo(function JourneyMapBackdrop() {
  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect x="-250" y="-250" width="900" height="750" className="map-land" />
      <path d="M-92-120V300M-20-100V300M50-100V300M150-100V75M250-100V300M-120-55H340M-120 50H325M-120 150H100M130 150H330M-120 250H340"
        fill="none" className="map-local-road" strokeWidth="4" />
      <g className="map-block" strokeWidth=".6">
        {blocks.map(([x, y, width, height], index) => <rect key={index} x={x} y={y} width={width} height={height} rx="3" />)}
      </g>
      <g className="map-building" strokeWidth=".35">
        {blocks.flatMap(([x, y, width, height], block) => Array.from({ length: block % 3 === 0 ? 4 : 6 }, (_, index) => {
          const columns = 2
          const w = (width - 15) / columns
          const h = (height - 17) / 3
          return <rect key={`${block}-${index}`} x={x + 5 + index % columns * (w + 5)} y={y + 5 + Math.floor(index / columns) * (h + 4)}
            width={w - (index % 3 === 0 ? 3 : 0)} height={h} rx="1" />
        }))}
      </g>
      <path d="M-80 15L-25 15L-25 82L-50 86L-80 68Z M125 163L158 128L181 132L181 184L124 184Z" className="map-park" />
      <path d="M-72 25L-36 32L-36 70L-66 61Z M135 173L169 143L171 174Z" fill="none" className="map-park-path" strokeWidth="1.5" />
      <g className="map-trees">
        {[[-67, 30], [-45, 45], [-65, 65], [-32, 73], [144, 169], [171, 158]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)}
      </g>
      <path d="M364-170C315-65 367-20 347 55S329 166 366 260L390 350" fill="none" className="map-water-bank" strokeWidth="34" />
      <path d="M364-170C315-65 367-20 347 55S329 166 366 260L390 350" fill="none" className="map-water" strokeWidth="24" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {roads.map(road => {
          const from = junctions.find(place => place.id === road.source)!
          const to = junctions.find(place => place.id === road.target)!
          return <path key={`${road.source}-${road.target}`} d={`M${from.x},${from.y}L${to.x},${to.y}`} className="map-road-edge" strokeWidth="10" />
        })}
        {roads.map(road => {
          const from = junctions.find(place => place.id === road.source)!
          const to = junctions.find(place => place.id === road.target)!
          return <path key={`${road.source}-${road.target}`} d={`M${from.x},${from.y}L${to.x},${to.y}`} className="map-road-surface" strokeWidth="8" />
        })}
      </g>
      <g className="map-street-label" textAnchor="middle" fontSize="4.2" letterSpacing=".6">
        <text x="150" y="1.5">MAIN ROAD</text>
        <text x="49" y="101.5">PARK LANE</text>
        <text x="250" y="101.5">CIVIL LINES</text>
        <text x="200" y="201.5">OLD TOWN ROAD</text>
        <text transform="translate(101.5 151) rotate(-90)">MARKET STREET</text>
      </g>
      <g textAnchor="middle" className="map-district-label" fontSize="5" letterSpacing="1.1">
        <text x="48" y="-34">WEST END</text>
        <text x="151" y="56">CITY CENTRE</text>
        <text x="250" y="154">CIVIL LINES</text>
        <text x="50" y="161">OLD TOWN</text>
      </g>
      <g className="map-park-label" textAnchor="middle" fontSize="4">
        <text x="-52" y="54">CITY PARK</text>
        <text x="153" y="180">GARDENS</text>
      </g>
      {junctions.filter(place => place.kind === "hospital").map(place => <g key={place.id} transform={`translate(${place.x - 19} ${place.y - 25})`}>
        <rect x="-5" y="-5" width="10" height="10" rx="2" className="map-hospital" />
        <path d="M-2.5 0h5M0-2.5v5" stroke="currentColor" strokeWidth="1.5" className="text-white" />
        <text x="9" y="1.5" fontSize="4.5" className="map-poi-label">{place.name}</text>
      </g>)}
    </g>
  )
})
