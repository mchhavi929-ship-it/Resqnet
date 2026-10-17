import { test } from "node:test"
import assert from "node:assert/strict"
import type { DispatchReport } from "../dispatch.ts"
import { groupRequests, requestStage } from "./requestStatus.ts"

const report: DispatchReport = {
  id: 1,
  location: 4,
  type: "Fire",
  severity: 7,
  people: 2,
  state: "dispatched",
  dispatchedAt: 100_000,
  assignments: [
    {
      vehicle: "FireTruck-F1",
      type: "Fire truck",
      route: [0, 4],
      seconds: 50,
      direct: false,
    },
    {
      vehicle: "Ambulance-A1",
      type: "Ambulance",
      route: [0, 4],
      seconds: 120,
      direct: false,
    },
  ],
}

test("a request stays ongoing until all assigned units arrive", () => {
  assert.equal(requestStage(report, 160_000), "ongoing")
  assert.equal(requestStage(report, 220_000), "arrived")
})

test("missing resources stay visible even after assigned units arrive", () => {
  assert.equal(
    requestStage({ ...report, missingTypes: ["Heavy rescue"] }, 300_000),
    "attention",
  )
})

test("unknown flight ETA and unknown dispatch time do not imply arrival", () => {
  assert.equal(
    requestStage({ ...report, dispatchedAt: undefined }, 300_000),
    "ongoing",
  )
  assert.equal(
    requestStage(
      {
        ...report,
        assignments: [
          {
            vehicle: "Helicopter-H1",
            type: "Helicopter",
            route: [0, 4],
            seconds: null,
            direct: true,
          },
        ],
      },
      300_000,
    ),
    "ongoing",
  )
})

test("groups exclude drafts, put latest requests first, and separate arrival history", () => {
  const groups = groupRequests(
    [
      report,
      { ...report, id: 2, state: "requested" },
      { ...report, id: 3, state: "requested" },
      { ...report, id: 4, state: undefined },
      { ...report, id: 5, dispatchedAt: 290_000 },
    ],
    300_000,
  )
  assert.deepEqual(
    groups.attention.map((r) => r.id),
    [3, 2],
  )
  assert.deepEqual(
    groups.ongoing.map((r) => r.id),
    [5],
  )
  assert.deepEqual(
    groups.arrived.map((r) => r.id),
    [1],
  )
})
