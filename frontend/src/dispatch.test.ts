import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableFleet, fleet, shortestRoute, suggestDispatch, routeProgress, headingDegrees, type DispatchReport } from './dispatch.ts';
import { fleetUnits } from './data/fleet.ts';

const report: DispatchReport = { id: 1, location: 8, type: 'Fire', severity: 8, people: 12, priorityScore: 86, state: 'requested' };
const preparationSeconds = 60;

test('shortest routes use road weights in either direction', () => {
  assert.deepEqual(shortestRoute(0, 8), { route: [0, 1, 5, 8], seconds: 155 });
  assert.equal(shortestRoute(8, 0).seconds, 155);
  assert.deepEqual(shortestRoute(0, 0), { route: [0], seconds: 0 });
});

test('suggestions choose the nearest suitable ambulance from the expanded fleet', () => {
  const plan = suggestDispatch({ ...report, location: 6, type: 'Road accident' }, [], preparationSeconds);
  const ambulance = plan.assignments.find(a => a.type === 'Ambulance');
  assert.ok(ambulance);
  assert.equal(ambulance.vehicle, 'Ambulance-A7');
  assert.equal(ambulance.seconds, 60);
  assert.deepEqual(ambulance.route, [6]);
  assert.deepEqual(routeProgress(ambulance, 59, preparationSeconds), {
    from: 6,
    to: 6,
    fraction: 0,
    remaining: 1,
  });
  assert.deepEqual(routeProgress(ambulance, 60, preparationSeconds), {
    from: 6,
    to: 6,
    fraction: 1,
    remaining: 0,
  });
  assert.equal(plan.assignments.length, 2);
});

test('vehicles.txt provides the requested units for every response type', () => {
  assert.equal(fleet.filter(v => v.type === 'Ambulance').length, 15);
  assert.equal(fleet.filter(v => v.type === 'Fire truck').length, 15);
  assert.equal(fleet.filter(v => v.type === 'Police').length, 20);
  assert.equal(fleet.filter(v => v.type === 'Rescue boat').length, 10);
  assert.equal(fleet.filter(v => v.type === 'Helicopter').length, 10);
  assert.equal(fleet.filter(v => v.type === 'Heavy rescue').length, 10);
  assert.equal(new Set(fleet.map(v => v.name)).size, 80);
  assert.equal(new Set(fleetUnits.map(v => v.id)).size, 80);
  const plan = suggestDispatch(report, [], preparationSeconds, {
    Ambulance: 15,
    'Fire truck': 15,
    Police: 20,
    'Rescue boat': 10,
    Helicopter: 10,
    'Heavy rescue': 10,
  });
  assert.equal(plan.assignments.length, 80);
  assert.equal(new Set(plan.assignments.map(a => a.vehicle)).size, 80);
});

test('manual assignments allocate requested counts, including extra police', () => {
  const plan = suggestDispatch(report, [], preparationSeconds, { Ambulance: 2, Police: 1 });
  assert.equal(plan.assignments.filter(a => a.type === 'Ambulance').length, 2);
  assert.equal(plan.assignments.filter(a => a.type === 'Police').length, 1);
  assert.equal(new Set(plan.assignments.map(a => a.vehicle)).size, plan.assignments.length);
  const shortage = suggestDispatch(report, [], preparationSeconds, { Ambulance: 3 });
  assert.equal(shortage.assignments.filter(a => a.type === 'Ambulance').length, 2);
  assert.ok(shortage.missingTypes.includes('Ambulance'));
  const omitted = suggestDispatch(report, [], preparationSeconds, { Ambulance: 0 });
  assert.ok(omitted.missingTypes.includes('Ambulance'));
});

test('tracking follows each road duration and stops at the destination', () => {
  const assignment = suggestDispatch(report, [], preparationSeconds, { Ambulance: 2 }).assignments.find(a => a.vehicle === 'Ambulance-A8')!;
  assert.equal(assignment.seconds, 175);
  assert.deepEqual(routeProgress(assignment, 30, preparationSeconds), { from: 4, to: 4, fraction: 0, remaining: 145 });
  assert.deepEqual(routeProgress(assignment, 90, preparationSeconds), { from: 4, to: 5, fraction: .5, remaining: 85 });
  assert.deepEqual(routeProgress(assignment, 120, preparationSeconds), { from: 5, to: 8, fraction: 0, remaining: 55 });
  assert.deepEqual(routeProgress(assignment, 200, preparationSeconds), { from: 8, to: 8, fraction: 1, remaining: 0 });
});

test('vehicle headings match right, down, left and up movement', () => {
  assert.equal(headingDegrees({x:0,y:0},{x:100,y:0}), 0);
  assert.equal(headingDegrees({x:0,y:0},{x:0,y:100}), 90);
  assert.equal(headingDegrees({x:100,y:0},{x:0,y:0}), 180);
  assert.equal(headingDegrees({x:0,y:100},{x:0,y:0}), -90);
});

test('City Hospital to Market Square faces left after the first turn', () => {
  const assignment = { vehicle: 'Ambulance-A2', type: 'Ambulance', route: shortestRoute(3, 5).route, seconds: shortestRoute(3, 5).seconds + preparationSeconds, direct: false };
  assert.deepEqual(assignment.route, [3, 7, 6, 5]);
  const points = [{x:48,y:52},{x:188,y:52},{x:328,y:52},{x:468,y:52},{x:48,y:192},{x:188,y:192},{x:328,y:192},{x:468,y:192},{x:188,y:332},{x:468,y:332}];
  const progress = routeProgress(assignment, 91, preparationSeconds);
  assert.equal(headingDegrees(points[progress.from], points[progress.to]), 180);
  assert.equal(progress.remaining, 99);
});

test('untracked helicopter positions are not invented', () => {
  const assignment = suggestDispatch({ ...report, type: 'Storm' }, [], preparationSeconds).assignments.find(a => a.direct)!;
  assert.equal(routeProgress(assignment, 60, preparationSeconds).remaining, null);
  assert.equal(routeProgress(assignment, 60, preparationSeconds).fraction, 0);
});

test('allocated vehicles cannot be booked by a second incident', () => {
  const approved: DispatchReport = { ...report, state: 'dispatched', ...suggestDispatch(report, [], preparationSeconds) };
  const next = suggestDispatch({ ...report, id: 2 }, [approved], preparationSeconds);
  assert.ok(next.missingTypes.includes('Fire truck'));
  assert.ok(next.assignments.every(a => !approved.assignments?.some(old => old.vehicle === a.vehicle)));
  assert.equal(availableFleet([approved]).length, 78);
});

test('heavy rescue units and unknown flight ETA are represented honestly', () => {
  const plan = suggestDispatch({ ...report, type: 'Earthquake' }, [], preparationSeconds);
  assert.ok(!plan.missingTypes.includes('Heavy rescue'));
  assert.ok(plan.assignments.some(a => a.type === 'Heavy rescue'));
  const helicopter = plan.assignments.find(a => a.type === 'Helicopter');
  assert.equal(helicopter?.direct, true);
  assert.equal(helicopter?.seconds, null);
  assert.deepEqual(helicopter?.route, [0, 8]);
});

test('configured preparation time affects suggested ETAs and tracking', () => {
  const nearby = { ...report, location: 6, type: 'Road accident' };
  const shortPrep = suggestDispatch(nearby, [], 30).assignments.find(a => a.type === 'Ambulance')!;
  const longPrep = suggestDispatch(nearby, [], 90).assignments.find(a => a.type === 'Ambulance')!;

  assert.equal(shortPrep.seconds, 30);
  assert.equal(longPrep.seconds, 90);
  assert.equal(routeProgress(longPrep, 45, 90).remaining, 45);
  assert.equal(routeProgress(longPrep, 90, 90).fraction, 1);
});
