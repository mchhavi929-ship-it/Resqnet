export const junctions = [
  { name: "Base Station", x: 48, y: 52, type: "base" },
  { name: "Main Road", x: 188, y: 52 },
  { name: "Station Chowk", x: 328, y: 52 },
  { name: "City Hospital", x: 468, y: 52, type: "hospital" },
  { name: "Park Lane", x: 48, y: 192 },
  { name: "Market Square", x: 188, y: 192 },
  { name: "Bus Stand", x: 328, y: 192 },
  { name: "Civil Lines", x: 468, y: 192 },
  { name: "Old Town", x: 188, y: 332 },
  { name: "Green Hospital", x: 468, y: 332, type: "hospital" },
]
export const roads = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 3],
  [1, 5],
  [2, 6],
  [5, 8],
  [8, 9],
  [7, 9],
  [6, 8],
]

// Same topology, with shorter columns and wrapped labels for phone screens.
export const compactJunctions = junctions.map((junction) => ({
  ...junction,
  x: 30 + ((junction.x - 48) / 140) * 85,
  y: 38 + ((junction.y - 52) / 140) * 115,
}))
