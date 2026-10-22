// Shared with the frontend; kept inside the Edge Function deployment boundary.
// Extracted from the uploaded C sources: types.c, main.c, and data/city.txt.
// Display metadata only; routing, priority, and dispatch remain the C engine's responsibility.
export const incidentTypes = [
  {
    "id": 0,
    "name": "Road Accident",
    "precaution": "Do not move the injured unless the vehicle is on fire. Switch off the engine, turn on hazard lights, keep people away from traffic, and press firmly on any bleeding.",
    "vehicles": [
      "Ambulance",
      "Police"
    ]
  },
  {
    "id": 1,
    "name": "Fire Emergency",
    "precaution": "Leave the area and keep others away. Do not use lifts. If there is smoke, cover your nose with a wet cloth and stay low.",
    "vehicles": [
      "Fire Truck",
      "Ambulance"
    ]
  },
  {
    "id": 2,
    "name": "Medical Emergency",
    "precaution": "Keep the person still and calm. Do not give food or water. Loosen tight clothing. Start CPR only if they are not breathing and you know how.",
    "vehicles": [
      "Ambulance"
    ]
  },
  {
    "id": 3,
    "name": "Flooding",
    "precaution": "Move to higher ground. Do not walk or drive through moving water. Switch off electricity at the main switch only if it is safe.",
    "vehicles": [
      "Rescue Boat",
      "Helicopter",
      "Ambulance"
    ]
  },
  {
    "id": 4,
    "name": "Electrical Hazard",
    "precaution": "Do not touch wires or anyone in contact with a live source. Stay at least 10 metres from fallen lines. Keep others away.",
    "vehicles": [
      "Fire Truck",
      "Police"
    ]
  },
  {
    "id": 5,
    "name": "Building Collapse",
    "precaution": "Stay away from the building. Do not enter to search. If trapped, cover your mouth, tap on pipes to signal, and avoid flames.",
    "vehicles": [
      "Heavy Rescue",
      "Ambulance"
    ]
  },
  {
    "id": 6,
    "name": "Chemical or Gas Leak",
    "precaution": "Do not switch lights or electrical devices on or off. Open windows, leave immediately, and call from outside. Avoid any flame or spark.",
    "vehicles": [
      "Fire Truck",
      "Police",
      "Ambulance"
    ]
  },
  {
    "id": 7,
    "name": "Road Blockage",
    "precaution": "Keep a safe distance and switch off the engine. Use hazard lights or warning signs if possible. Follow the alternative route given by the dispatcher.",
    "vehicles": [
      "Recovery Vehicle",
      "Police"
    ]
  },
  {
    "id": 8,
    "name": "Missing or Stranded Person",
    "precaution": "Note the last seen place, time and clothing. Do not search alone in unsafe areas. Keep your phone reachable and share recent photos with responders.",
    "vehicles": [
      "Police",
      "Helicopter"
    ]
  },
  {
    "id": 9,
    "name": "Landslide",
    "precaution": "Move away from the slope and downhill path. Do not cross debris or flowing mud. Watch for further falls and warn others nearby.",
    "vehicles": [
      "Heavy Rescue",
      "Helicopter",
      "Ambulance"
    ]
  },
  {
    "id": 10,
    "name": "Earthquake",
    "precaution": "Drop, cover and hold on under sturdy furniture. Stay away from windows and walls. After shaking stops, move to an open area and avoid damaged buildings.",
    "vehicles": [
      "Heavy Rescue",
      "Ambulance",
      "Helicopter"
    ]
  },
  {
    "id": 11,
    "name": "Heart Attack",
    "precaution": "Keep the person sitting and calm. Loosen tight clothing. Do not give any medicine unless a doctor has advised it. Be ready to start CPR.",
    "vehicles": [
      "Ambulance"
    ]
  },
  {
    "id": 12,
    "name": "Stroke",
    "precaution": "Note the time symptoms started. Keep the person calm with head slightly raised. Do not give food, water or medicine by mouth.",
    "vehicles": [
      "Ambulance"
    ]
  },
  {
    "id": 13,
    "name": "Drowning",
    "precaution": "Do not enter the water unless trained. Throw a rope or flotation device. If the person is out and not breathing, start CPR. Keep them warm.",
    "vehicles": [
      "Rescue Boat",
      "Ambulance"
    ]
  },
  {
    "id": 14,
    "name": "Vehicle Breakdown",
    "precaution": "Pull over safely, switch on hazard lights and stay behind the barrier if possible. Do not stand in traffic lanes.",
    "vehicles": [
      "Recovery Vehicle"
    ]
  },
  {
    "id": 15,
    "name": "Industrial Accident",
    "precaution": "Move upwind and away from the site. Do not enter the contaminated area. Cover nose and mouth. Follow instructions from site staff.",
    "vehicles": [
      "Fire Truck",
      "Heavy Rescue",
      "Ambulance"
    ]
  },
  {
    "id": 16,
    "name": "Gas Explosion",
    "precaution": "Move far away from the building immediately. Do not go back for any reason. Avoid flames and vehicles. Keep clear of falling glass.",
    "vehicles": [
      "Fire Truck",
      "Ambulance",
      "Police"
    ]
  },
  {
    "id": 17,
    "name": "Severe Weather",
    "precaution": "Stay indoors away from windows. Avoid open ground, trees and water. Keep an emergency kit ready and follow official weather alerts.",
    "vehicles": [
      "Helicopter",
      "Ambulance"
    ]
  },
  {
    "id": 18,
    "name": "Forest Fire",
    "precaution": "Move upwind and away from the fire path. Keep roads clear for responders. Cover nose with a wet cloth. Do not try to fight the fire yourself.",
    "vehicles": [
      "Fire Truck",
      "Helicopter"
    ]
  },
  {
    "id": 19,
    "name": "Animal Attack",
    "precaution": "Move away slowly without running. Do not corner the animal. Keep a barrier between you and it. Wash wounds with clean water and seek medical care.",
    "vehicles": [
      "Ambulance",
      "Police"
    ]
  },
  {
    "id": 20,
    "name": "Crime or Assault",
    "precaution": "Move to a safe place if you can. Do not confront the attacker. Note the description and direction of escape. Do not touch anything at the scene.",
    "vehicles": [
      "Police",
      "Ambulance"
    ]
  },
  {
    "id": 21,
    "name": "Child or Elderly Person in Danger",
    "precaution": "Keep the person calm and in sight. Do not leave them alone. Move to a safe area and do not attempt a rescue beyond your ability.",
    "vehicles": [
      "Ambulance",
      "Police"
    ]
  },
  {
    "id": 22,
    "name": "Train Accident",
    "precaution": "Stay at least 100 metres away from tracks and trains. Do not walk on tracks. Help only from a safe spot and follow railway staff instructions.",
    "vehicles": [
      "Heavy Rescue",
      "Ambulance",
      "Fire Truck"
    ]
  },
  {
    "id": 23,
    "name": "Water Pipeline Burst",
    "precaution": "Stay away from the water or fluid spill. Keep away from electrical equipment near water. Warn neighbours and keep children away.",
    "vehicles": [
      "Recovery Vehicle",
      "Police"
    ]
  },
  {
    "id": 24,
    "name": "Structural Damage",
    "precaution": "Keep out of the damaged area. Do not use lifts. Avoid walls, ceilings or balconies showing cracks. Leave calmly by the stairs.",
    "vehicles": [
      "Heavy Rescue",
      "Police"
    ]
  }
]

export const situations = [
  "Injured person(s), need ambulance urgently",
  "Vehicle on fire or smoke",
  "Road blocked, vehicles stuck",
  "Person trapped inside",
  "Bleeding heavily",
  "Unconscious or not responding",
  "Person(s) stuck, need rescue team",
  "Not sure / other"
]

export const junctions = [
  {
    "id": 1,
    "x": 0,
    "y": 0,
    "kind": "base",
    "name": "Base Station"
  },
  {
    "id": 2,
    "x": 100,
    "y": 0,
    "kind": "normal",
    "name": "Main Road"
  },
  {
    "id": 3,
    "x": 200,
    "y": 0,
    "kind": "normal",
    "name": "Station Chowk"
  },
  {
    "id": 4,
    "x": 300,
    "y": 0,
    "kind": "hospital",
    "name": "City Hospital"
  },
  {
    "id": 5,
    "x": 0,
    "y": 100,
    "kind": "normal",
    "name": "Park Lane"
  },
  {
    "id": 6,
    "x": 100,
    "y": 100,
    "kind": "normal",
    "name": "Market Square"
  },
  {
    "id": 7,
    "x": 200,
    "y": 100,
    "kind": "normal",
    "name": "Bus Stand"
  },
  {
    "id": 8,
    "x": 300,
    "y": 100,
    "kind": "normal",
    "name": "Civil Lines"
  },
  {
    "id": 9,
    "x": 100,
    "y": 200,
    "kind": "normal",
    "name": "Old Town"
  },
  {
    "id": 10,
    "x": 300,
    "y": 200,
    "kind": "hospital",
    "name": "Green Hospital"
  }
]

export const roads = [
  {
    "source": 1,
    "target": 2,
    "distance": 500,
    "seconds": 60
  },
  {
    "source": 2,
    "target": 3,
    "distance": 400,
    "seconds": 50
  },
  {
    "source": 3,
    "target": 4,
    "distance": 300,
    "seconds": 40
  },
  {
    "source": 1,
    "target": 5,
    "distance": 400,
    "seconds": 50
  },
  {
    "source": 5,
    "target": 6,
    "distance": 500,
    "seconds": 60
  },
  {
    "source": 6,
    "target": 7,
    "distance": 400,
    "seconds": 50
  },
  {
    "source": 7,
    "target": 8,
    "distance": 300,
    "seconds": 40
  },
  {
    "source": 8,
    "target": 4,
    "distance": 200,
    "seconds": 30
  },
  {
    "source": 2,
    "target": 6,
    "distance": 300,
    "seconds": 40
  },
  {
    "source": 3,
    "target": 7,
    "distance": 350,
    "seconds": 45
  },
  {
    "source": 6,
    "target": 9,
    "distance": 400,
    "seconds": 55
  },
  {
    "source": 9,
    "target": 10,
    "distance": 500,
    "seconds": 70
  },
  {
    "source": 8,
    "target": 10,
    "distance": 400,
    "seconds": 50
  },
  {
    "source": 7,
    "target": 9,
    "distance": 450,
    "seconds": 603
  }
]
