// Shared with the frontend; kept inside the Edge Function deployment boundary.
// Web reporting extension. C enum IDs are unchanged; these choices are not
// the eight generic quick picks currently defined in main.c.
export const commonIncidentIds = [0, 1, 2, 3, 4, 5, 6, 20]
export const situationVersion = 3
export const customDescriptionMin = 10
export const customDescriptionMax = 180

const options: Record<number, string[]> = {
  0: ["Vehicles have collided", "A pedestrian or cyclist has been hit", "Someone is trapped in a vehicle", "A vehicle has overturned"],
  1: ["A building or room is on fire", "A vehicle is on fire", "Smoke is coming from a building", "People are trapped near flames or smoke"],
  2: ["Someone is unconscious or not responding", "Someone is having difficulty breathing", "Someone is bleeding heavily", "Someone has a sudden illness or injury"],
  3: ["Water is entering homes or buildings", "People are stranded by rising water", "A road is flooded", "A vehicle is trapped in floodwater"],
  4: ["A power line has fallen", "Sparks are coming from electrical equipment", "Someone may have received an electric shock", "Exposed wiring is creating a hazard"],
  5: ["A building has partially collapsed", "A building has completely collapsed", "People may be trapped under debris", "Debris is falling from a structure"],
  6: ["There is a strong smell of gas", "A gas cylinder or pipe appears to be leaking", "A chemical spill is visible", "People are affected by fumes"],
  7: ["A fallen tree is blocking the road", "Debris is blocking the road", "Vehicles are unable to pass", "An obstruction is blocking emergency access"],
  8: ["Someone is missing from their last known location", "Someone is stranded in an unsafe area", "A person is unable to find a safe way back", "Someone needs rescue from an isolated location"],
  9: ["Soil or rocks are falling onto a road", "People may be trapped by debris", "A slope has collapsed near buildings", "A road has been cut off by a landslide"],
  10: ["Buildings have been damaged after shaking", "People may be trapped in a damaged building", "Falling debris is creating a hazard", "People need assistance after an earthquake"],
  11: ["Someone has chest pain or pressure", "Chest discomfort is accompanied by breathlessness", "Someone has collapsed with suspected heart symptoms", "Someone is sweating or feeling faint with chest discomfort"],
  12: ["Someone has sudden weakness on one side", "Someone has sudden difficulty speaking", "Someone has facial drooping", "Someone has sudden balance or vision problems"],
  13: ["A person is struggling in the water", "A person has gone under the water", "A rescued person is unresponsive", "Multiple people are in difficulty in the water"],
  14: ["A vehicle has stopped in a traffic lane", "A vehicle has broken down in an unsafe location", "A vehicle cannot be moved off the road", "Passengers are stranded after a breakdown"],
  15: ["Someone is injured by machinery", "People may be trapped at an industrial site", "A hazardous substance has been released", "An industrial structure or equipment has failed"],
  16: ["An explosion has occurred inside a building", "A gas cylinder has exploded", "There is fire or smoke after an explosion", "People may be trapped or injured after an explosion"],
  17: ["Strong winds are damaging property", "A tree or structure has fallen in a storm", "People are stranded by severe weather", "Storm debris is making an area unsafe"],
  18: ["Trees or vegetation are burning", "A fire is spreading toward buildings", "Smoke is affecting a nearby area", "People may be cut off by a spreading fire"],
  19: ["Someone has been bitten or injured", "An animal is threatening people nearby", "People are unable to leave an area safely", "An animal attack is ongoing"],
  20: ["An assault is happening", "Someone has been injured in an assault", "People are being threatened", "A violent incident has just occurred"],
  21: ["A child or elderly person is missing", "Someone vulnerable is alone in an unsafe place", "Someone vulnerable is trapped or injured", "Someone vulnerable is unable to reach safety"],
  22: ["A train has collided with a vehicle or object", "A train appears to have derailed", "A person is injured near the tracks", "Passengers may be trapped or injured"],
  23: ["Water is flowing from a damaged pipeline", "A street or building is flooding from a burst pipe", "A water leak is damaging the road", "Water is reaching nearby electrical equipment"],
  24: ["Large cracks have appeared in a building", "A wall or ceiling looks unstable", "A bridge or public structure appears damaged", "Parts of a structure are falling"],
}

export function situationsFor(type: number): string[] {
  const choices = options[type]
  return choices ? [...choices, "Describe in your own words"] : []
}

export function isCustomSituation(type: number, situation: number): boolean {
  const choices = situationsFor(type)
  return choices.length > 0 && situation === choices.length - 1
}
