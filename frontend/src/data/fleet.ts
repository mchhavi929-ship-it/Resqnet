import type { IconName } from "../components/Icon"
import { junctions } from "./city"
import vehiclesText from "../../../data/vehicles.txt?raw"

type FleetUnit = {
  id: number
  name: string
  type: string
  location: string
  locationId: number
  icon: IconName
}

const vehicleTypes: Record<string, { label: string; icon: IconName }> = {
  Ambulance: { label: "Ambulance", icon: "vehicle" },
  FireTruck: { label: "Fire truck", icon: "fire" },
  Police: { label: "Police", icon: "shield" },
  RescueBoat: { label: "Rescue boat", icon: "boat" },
  Helicopter: { label: "Helicopter", icon: "helicopter" },
  HeavyRescue: { label: "Heavy rescue", icon: "vehicle" },
}

const seenIds = new Set<number>()
const seenNames = new Set<string>()

export const fleetUnits: FleetUnit[] = vehiclesText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const fields = line.split(/\s+/)
    const [record, rawId, rawType, rawBase, name] = fields
    const id = Number(rawId)
    const base = Number(rawBase)
    const type = vehicleTypes[rawType]
    const location = junctions[base - 1]

    if (
      record !== "V" ||
      fields.length !== 5 ||
      !Number.isSafeInteger(id) ||
      id < 1 ||
      seenIds.has(id) ||
      !type ||
      !Number.isInteger(base) ||
      !location ||
      !name ||
      seenNames.has(name)
    ) {
      throw new Error(`Invalid or duplicate vehicle record in vehicles.txt: ${line}`)
    }

    seenIds.add(id)
    seenNames.add(name)
    return {
      id,
      name,
      type: type.label,
      location: location.name,
      locationId: base - 1,
      icon: type.icon,
    }
  })

if (!fleetUnits.length) {
  throw new Error("No vehicles were found in data/vehicles.txt.")
}
