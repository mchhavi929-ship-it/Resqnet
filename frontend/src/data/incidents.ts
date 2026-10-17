import type { IconName } from "../components/Icon"
export const incidentTypes: {
  name: string
  icon: IconName
  sends: string[]
}[] = [
  { name: "Fire", icon: "fire", sends: ["Fire truck", "Ambulance"] },
  {
    name: "Flood",
    icon: "boat",
    sends: ["Rescue boat", "Helicopter", "Ambulance"],
  },
  {
    name: "Earthquake",
    icon: "earthquake",
    sends: ["Ambulance", "Heavy rescue", "Helicopter"],
  },
  { name: "Road accident", icon: "vehicle", sends: ["Ambulance", "Police"] },
  {
    name: "Building collapse",
    icon: "building",
    sends: ["Ambulance", "Heavy rescue"],
  },
  { name: "Storm", icon: "storm", sends: ["Helicopter", "Ambulance"] },
  {
    name: "Hazardous incident",
    icon: "hazard",
    sends: ["Fire truck", "Police"],
  },
]
