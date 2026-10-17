import { fleetUnits } from "./data/fleet";

export type Assignment = { vehicle: string; type: string; route: number[]; seconds: number | null; direct: boolean };
export type DispatchReport = { id: number; location: number; type: string; severity: number; people: number; priorityScore: number; state?: 'requested' | 'dispatched'; assignments?: Assignment[]; missingTypes?: string[]; dispatchedAt?: number };
export const fleet = fleetUnits.map(({ name, type, locationId }) => ({
  name,
  type,
  location: locationId,
}));
const requirements: Record<string, string[]> = {
  Fire: ['Fire truck', 'Ambulance'], Flood: ['Rescue boat', 'Helicopter', 'Ambulance'],
  Earthquake: ['Ambulance', 'Heavy rescue', 'Helicopter'], 'Road accident': ['Ambulance', 'Police'],
  'Building collapse': ['Ambulance', 'Heavy rescue'], Storm: ['Helicopter', 'Ambulance'],
  'Hazardous incident': ['Fire truck', 'Police'],
};
const edges = [[0,1,60],[1,2,50],[2,3,40],[0,4,50],[4,5,60],[5,6,50],[6,7,40],[7,3,30],[1,5,40],[2,6,45],[5,8,55],[8,9,70],[7,9,50],[6,8,60]];
export function shortestRoute(start: number, target: number) {
  const distance = Array(10).fill(Infinity) as number[];
  const previous = Array(10).fill(-1) as number[];
  const visited = new Set<number>();
  distance[start] = 0;
  for (let n = 0; n < 10; n++) {
    let current = -1;
    for (let i = 0; i < 10; i++) if (!visited.has(i) && (current === -1 || distance[i] < distance[current])) current = i;
    if (current === -1 || distance[current] === Infinity) break;
    visited.add(current);
    for (const [a,b,time] of edges) {
      const next = a === current ? b : b === current ? a : -1;
      if (next !== -1 && distance[current] + time < distance[next]) {
        distance[next] = distance[current] + time; previous[next] = current;
      }
    }
  }
  const route: number[] = [];
  if (distance[target] !== Infinity) for (let i = target; i !== -1; i = previous[i]) route.unshift(i);
  return { route, seconds: distance[target] };
}
export function availableFleet(reports: DispatchReport[]) {
  const busy = new Set(reports.flatMap(r => r.assignments ?? []).map(a => a.vehicle));
  return fleet.filter(v => !busy.has(v.name));
}
export function suggestDispatch(report: DispatchReport, reports: DispatchReport[], responsePreparationSeconds: number, overrides: Record<string, number> = {}) {
  const available = availableFleet(reports);
  const assignments: Assignment[] = [];
  const missingTypes: string[] = [];
  const required = requirements[report.type] ?? [];
  for (const type of new Set([...required, ...Object.keys(overrides)])) {
    const quantity = overrides[type] ?? (required.includes(type) ? 1 : 0);
    const wanted = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
    const candidates = available.filter(v => v.type === type);
    candidates.sort((a,b) => shortestRoute(a.location, report.location).seconds - shortestRoute(b.location, report.location).seconds);
    if (candidates.length < wanted || (required.includes(type) && wanted === 0)) missingTypes.push(type);
    for (const vehicle of candidates.slice(0, wanted)) {
      const direct = type === 'Helicopter';
      const travel = shortestRoute(vehicle.location, report.location);
      assignments.push({
        vehicle: vehicle.name,
        type,
        route: direct ? [vehicle.location, report.location] : travel.route,
        seconds: direct
          ? null
          : travel.seconds + responsePreparationSeconds,
        direct,
      });
    }
  }
  return { assignments, missingTypes };
}

export function routeProgress(assignment: Assignment, elapsed: number, responsePreparationSeconds: number) {
  let remaining = Math.max(0, elapsed - responsePreparationSeconds);
  if (assignment.direct || assignment.seconds === null) return { from: assignment.route[0], to: assignment.route[0], fraction: 0, remaining: null };
  if (elapsed < responsePreparationSeconds) {
    const base = assignment.route[0];
    return {
      from: base,
      to: base,
      fraction: 0,
      remaining: Math.max(0, Math.ceil(assignment.seconds - elapsed)),
    };
  }
  for (let i = 0; i < assignment.route.length - 1; i++) {
    const from = assignment.route[i], to = assignment.route[i + 1];
    const leg = edges.find(([a,b]) => (a === from && b === to) || (a === to && b === from));
    const seconds = leg?.[2] ?? 0;
    if (remaining < seconds) return { from, to, fraction: remaining / seconds, remaining: Math.max(0, Math.ceil(assignment.seconds - elapsed)) };
    remaining -= seconds;
  }
  const destination = assignment.route[assignment.route.length - 1];
  return { from: destination, to: destination, fraction: 1, remaining: 0 };
}

export function headingDegrees(from: { x: number; y: number }, to: { x: number; y: number }) {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
}
