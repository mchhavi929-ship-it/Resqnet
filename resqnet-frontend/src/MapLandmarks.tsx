export const landmarkLabels: Record<number, { x: number; y: number }> = {
  1: { x: 45, y: 20 },
  2: { x: 143, y: -45 },
  3: { x: 225, y: 16 },
  4: { x: 282, y: 24 },
  5: { x: -40, y: 25 },
  6: { x: 140, y: 53 },
  7: { x: 223, y: 133 },
  8: { x: 266, y: 126 },
  9: { x: 154, y: 213 },
  10: { x: 274, y: 214 },
}

function Building({ x, y, hospital = false }: { x: number; y: number; hospital?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="2" width="41" height="29" rx="4" fill={hospital ? "#dce8df" : "#e7e2d6"} />
      <path d="M3 9 12 4 34 4 25 9Z" fill={hospital ? "#b0c7be" : "#c7c3b5"} stroke="#a6b1a3" strokeWidth=".6" />
      <path d="M25 9 34 4V23L25 28Z" fill={hospital ? "#a8beb4" : "#c6c1b2"} />
      <path d="M3 9H25V28H3Z" fill={hospital ? "#f8fcf8" : "#f8f5ec"} stroke="#b6beb0" strokeWidth=".7" />
      {hospital ? <path d="M12 12H16V15H19V19H16V22H12V19H9V15H12Z" fill="#6d9280" /> : <><rect x="6" y="13" width="6" height="4" rx=".5" fill="#b2c6c4" /><rect x="16" y="13" width="6" height="4" rx=".5" fill="#b2c6c4" /></>}
      <rect x="17" y="23" width="5" height="5" fill="#9fb6b1" />
      <path d="M28 12 31 10M28 17 31 15M28 22 31 20" stroke="#e5eee5" strokeWidth="1.4" />
    </g>
  )
}

function MainRoadBlock() {
  return (
    <g transform="translate(119 -39)">
      <rect x="-3" y="-1" width="51" height="25" rx="3" fill="#e2dece" />
      {[0, 15, 30].map((x, index) => <g key={x} transform={`translate(${x} 0)`}>
        <path d="M0 5 4 1H17L13 5Z" fill={index === 1 ? "#b3c0a7" : "#bfc5b4"} />
        <rect y="5" width="13" height="16" fill="#fbf7e9" stroke="#bcbda8" strokeWidth=".6" />
        <rect x="2" y="8" width="9" height="3" fill="#b9cdc1" />
        <rect x="2" y="14" width="6" height="7" fill="#becdc1" />
        <rect x="9" y="14" width="2" height="7" fill="#ded7c2" />
      </g>)}
      <path d="M-5 25H49" stroke="#fffdf0" strokeWidth="2" />
      <path d="M48 8V23M46 8H50" stroke="#99a991" strokeWidth="1" />
    </g>
  )
}

function CivicHall() {
  return (
    <g transform="translate(247 133)">
      <rect x="-3" y="1" width="46" height="34" rx="4" fill="#e2e3d6" />
      <path d="M0 12 19 0 38 12Z" fill="#b3c2ad" stroke="#99ad96" strokeWidth=".7" />
      <rect x="3" y="12" width="32" height="19" fill="#f9f6e9" stroke="#b9c1ad" strokeWidth=".6" />
      <rect x="14" y="20" width="10" height="11" fill="#a9bfb2" />
      {[7, 13, 25, 31].map(x => <path key={x} d={`M${x} 15V29`} stroke="#d3d5c0" strokeWidth="2.5" />)}
      <path d="M0 31H38M-2 34H40" stroke="#c3c8b4" strokeWidth="2" />
      <circle cx="19" cy="8" r="2" fill="#ecedda" />
    </g>
  )
}

function Tree({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}><ellipse cy="4" rx="5" ry="2.5" fill="#9eaf92" opacity=".22" /><path d="M0 0V5" stroke="#9a9c7e" strokeWidth="1.5" /><circle cy="-3" r="5" fill="#a8c39a" /><circle cx="-1.5" cy="-4.5" r="3" fill="#bed1b0" /></g>
}

function House({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><path d="M0 7 9 0 18 7 9 14Z" fill="#c7bca6" /><path d="M2 9V21H15V9L9 4Z" fill="#f6f0df" stroke="#c6c0ad" strokeWidth=".6" /><path d="M15 9 20 6V18L15 21Z" fill="#d5cbb6" /><rect x="5" y="12" width="4" height="4" fill="#afc5bf" /><rect x="11" y="15" width="3" height="6" fill="#b6ad97" /></g>
}

function ResponseBase() {
  return (
    <g transform="translate(18 27)">
      <rect x="-3" y="1" width="66" height="59" rx="5" fill="#dddccf" stroke="#c4c9b9" strokeWidth=".8" />
      <rect x="1" y="4" width="58" height="52" rx="3" fill="#e9e6db" />
      <path d="M-11 43H1" stroke="#e9e6db" strokeWidth="10" />
      <path d="M5 16 14 8H55L46 16Z" fill="#a7b9ac" stroke="#8eaa96" strokeWidth=".7" />
      <path d="M46 16 55 8V33L46 41Z" fill="#b4c3b5" />
      <path d="M5 16H46V41H5Z" fill="#faf7ed" stroke="#abb9a8" strokeWidth=".8" />
      <rect x="5" y="17" width="41" height="5" fill="#91a991" />
      {[9, 21, 33].map(x => <g key={x}>
        <rect x={x} y="25" width="9" height="16" rx="1" fill="#b9c5b5" stroke="#9dac9b" strokeWidth=".5" />
        <path d={`M${x + 1} 29h7M${x + 1} 33h7M${x + 1} 37h7`} stroke="#e0e5d9" strokeWidth=".6" />
      </g>)}
      <rect x="17" y="9" width="19" height="4" rx="1" fill="#cbd8c9" />
      <path d="M51 17 58-4 61 17M54 7H60M52 13H60" fill="none" stroke="#839886" strokeWidth=".8" />
      <circle cx="58" cy="-4" r="1.3" fill="#8ba58f" />
      <path d="M2 53H56M20 44V51M37 44V51" stroke="#faf8ee" strokeWidth="1" />
      <g transform="translate(7 39)">
        <rect width="11" height="12" rx="2" fill="#fcfcf4" stroke="#9cad9d" strokeWidth=".7" />
        <rect x="1.5" y="2" width="8" height="3" rx="1" fill="#b1c6be" />
        <path d="M5.5 6V10M3.5 8H7.5" stroke="#72977c" strokeWidth="1.3" />
        <path d="M2 0H4M7 0H9" stroke="#b8ac82" strokeWidth="1.5" />
      </g>
      <g transform="translate(23 40)">
        <rect width="11" height="11" rx="1.5" fill="#91a793" stroke="#7b927e" strokeWidth=".7" />
        <rect x="1.5" y="1.5" width="8" height="3" rx=".5" fill="#d5e1d5" />
        <path d="M3 6H8M3 8H8" stroke="#d9e2ce" strokeWidth="1" />
      </g>
      <path d="M62 8V48M55 57H37" stroke="#a8b39f" strokeWidth="1.3" strokeDasharray="2 1" />
    </g>
  )
}

export default function MapLandmarks() {
  return (
    <g aria-hidden="true" pointerEvents="none">
      {/* Raised roof silhouettes make the landmarks readable at the map's fit scale. */}
      <g>
        <Building x={260} y={29} hospital />
        <rect x="253" y="45" width="12" height="18" rx="1" fill="#eff6ec" stroke="#afc2b3" strokeWidth=".7" />
        <path d="M253 48H265" stroke="#93b09b" strokeWidth="2" />
        <rect x="256" y="53" width="5" height="5" fill="#b5cdc3" />
        <path d="M268 65H292" stroke="#e5e8db" strokeWidth="4" />
        <path d="M299 50V64M302 50V64M305 50V64" stroke="#fafbf0" strokeWidth="1" />
      </g>
      <g>
        <rect x="250" y="219" width="57" height="36" rx="5" fill="#dce8d5" />
        <Building x={254} y={220} hospital />
        <rect x="287" y="231" width="13" height="16" fill="#eff6e9" stroke="#b5c5ad" strokeWidth=".6" />
        <path d="M290 236H297M290 240H297" stroke="#b6cec0" strokeWidth="2" />
        <Tree x={300} y={225} size={.8} />
        <Tree x={299} y={251} size={.7} />
      </g>
      <ResponseBase />
      <MainRoadBlock />

      {/* Market Square: striped awnings and shopfronts, rather than generic blocks. */}
      <g transform="translate(122 58)">
        {[0, 18].map(x => <g key={x} transform={`translate(${x} 0)`}>
          <rect x="1" y="11" width="14" height="13" fill="#f6f0df" stroke="#c4c2ac" strokeWidth=".7" />
          <path d="M0 11 3 5H14L17 11Z" fill="#aebfa0" />
          <path d="M5 5 4 11M10 5 11 11" stroke="#f6f6e8" strokeWidth="3" />
          <path d="M0 11H17V14Q14 17 11 14Q8 17 5 14Q2 17 0 14Z" fill="#9aaf8b" />
          <rect x="4" y="18" width="8" height="6" fill="#c5d1ba" />
        </g>)}
      </g>

      {/* Bus Stand: a shelter and a parked bus, kept off the routing roads. */}
      <g transform="translate(207 139)">
        <path d="M0 4H31L27 0H4Z" fill="#a8b9b0" />
        <path d="M3 5V22M27 5V22" stroke="#a0b1a7" strokeWidth="1.5" />
        <rect x="6" y="7" width="18" height="10" rx="1" fill="#d1dfd7" opacity=".8" />
        <path d="M7 20H23" stroke="#a1ab9b" strokeWidth="2" />
        <rect x="2" y="26" width="30" height="11" rx="3" fill="#f7faf2" stroke="#9aaa9c" strokeWidth=".8" />
        {[6, 13, 20].map(x => <rect key={x} x={x} y="28" width="5" height="4" rx=".5" fill="#b6cec5" />)}
        <circle cx="8" cy="37" r="2" fill="#788278" /><circle cx="26" cy="37" r="2" fill="#788278" />
      </g>

      {/* Station Chowk: a small clock tower and paved public square. */}
      <g transform="translate(212 27)">
        <path d="M-2 23 13 17 28 23 13 30Z" fill="#dfd9ca" />
        <path d="M8 4H19V23H8Z" fill="#f9f4e6" stroke="#bfb8a2" strokeWidth=".8" />
        <path d="M19 4 24 1V20L19 23Z" fill="#cfc6b0" />
        <path d="M6 4 13-2 21 4Z" fill="#b2bda8" />
        <circle cx="13.5" cy="10" r="3.5" fill="#fffdf4" stroke="#a7af99" strokeWidth=".6" />
        <path d="M13.5 7.5V10L15.5 11" fill="none" stroke="#8c9887" strokeWidth=".7" />
      </g>
      <CivicHall />
      <path d="M118 247Q149 237 194 248" fill="none" stroke="#faf7e9" strokeWidth="5" />
      <House x={122} y={222} /><House x={148} y={218} /><House x={175} y={225} />
      <g transform="translate(181 217)" fill="none" stroke="#b5b398" strokeWidth="2"><path d="M0 18V7Q8-3 16 7V18" /><path d="M-2 18H3M13 18H18" /></g>

      {/* Park Lane and gardens: tree canopy, walking paths, and benches. */}
      <path d="M-52 42Q-27 54-42 76M131 135Q144 130 161 140" fill="none" stroke="#edf1dd" strokeWidth="3" />
      {[[-52, 40], [-28, 38], [-58, 66], [-25, 78], [-49, 82], [130, 132], [166, 163], [160, 132], [138, 166], [280, 160], [236, 242], [84, 81]].map(([x, y]) => <Tree key={`${x}-${y}`} x={x} y={y} />)}
      <g stroke="#9eaa8f" strokeWidth="1.3"><path d="M-40 57H-29M-40 60H-29M-38 57V63M-31 57V63M144 164H154M146 162V167M152 162V167" /></g>
      <g transform="translate(-53 45)"><path d="M2 19V5M0 5H4" stroke="#95a08a" strokeWidth="1" /><circle cx="2" cy="4" r="2" fill="#f3f0d7" /><path d="M17 24Q22 14 31 16" fill="none" stroke="#edeed8" strokeWidth="2" /><ellipse cx="24" cy="15" rx="6" ry="3" fill="#c2d8d2" stroke="#aec7b8" strokeWidth=".6" /></g>

      {/* Pedestrian crossings stay aligned with the existing main-road edges. */}
      {[65, 165].map(x => <g key={x} transform={`translate(${x} -4)`}>{[0, 2.5, 5, 7.5].map(offset => <rect key={offset} x={offset} width="1.3" height="8" fill="#d0cbb8" />)}</g>)}
    </g>
  )
}
