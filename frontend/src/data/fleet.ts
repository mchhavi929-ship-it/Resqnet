import type { IconName } from "../components/Icon"
export const fleetUnits: {
  name: string
  type: string
  location: string
  icon: IconName
}[] = [
  {
    name: "Ambulance-A1",
    type: "Ambulance",
    location: "Base Station",
    icon: "vehicle",
  },
  {
    name: "Ambulance-A2",
    type: "Ambulance",
    location: "City Hospital",
    icon: "vehicle",
  },
  {
    name: "FireTruck-F1",
    type: "Fire truck",
    location: "Base Station",
    icon: "fire",
  },
  {
    name: "Police-P1",
    type: "Police",
    location: "Station Chowk",
    icon: "shield",
  },
  {
    name: "Boat-B1",
    type: "Rescue boat",
    location: "Market Square",
    icon: "boat",
  },
  {
    name: "Helicopter-H1",
    type: "Helicopter",
    location: "Base Station",
    icon: "helicopter",
  },
]
