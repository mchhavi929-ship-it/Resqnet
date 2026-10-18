#include "incident.h"

static const char* names[INCIDENT_TYPES] = {
    "Road Accident", "Fire Emergency", "Medical Emergency", "Flooding",
    "Electrical Hazard", "Building Collapse", "Chemical or Gas Leak", "Road Blockage",
    "Missing or Stranded Person", "Landslide", "Earthquake", "Heart Attack",
    "Stroke", "Drowning", "Vehicle Breakdown", "Industrial Accident",
    "Gas Explosion", "Severe Weather", "Forest Fire", "Animal Attack",
    "Crime or Assault", "Child or Elderly Person in Danger", "Train Accident",
    "Water Pipeline Burst", "Structural Damage"
};

/* Vehicles sent per incident type, -1 terminated */
static const int needs[INCIDENT_TYPES][5] = {
    { POLICE, AMBULANCE, RECOVERY, -1, -1 },
    { FIRE_TRUCK, AMBULANCE, -1, -1, -1 },
    { AMBULANCE, -1, -1, -1, -1 },
    { RESCUE_BOAT, HELICOPTER, AMBULANCE, -1, -1 },
    { FIRE_TRUCK, POLICE, -1, -1, -1 },
    { HEAVY_RESCUE, AMBULANCE, -1, -1, -1 },
    { FIRE_TRUCK, AMBULANCE, POLICE, -1, -1 },
    { RECOVERY, POLICE, -1, -1, -1 },
    { POLICE, HELICOPTER, -1, -1, -1 },
    { HEAVY_RESCUE, HELICOPTER, AMBULANCE, -1, -1 },
    { HEAVY_RESCUE, AMBULANCE, HELICOPTER, -1, -1 },
    { AMBULANCE, -1, -1, -1, -1 },
    { AMBULANCE, -1, -1, -1, -1 },
    { RESCUE_BOAT, AMBULANCE, -1, -1, -1 },
    { RECOVERY, -1, -1, -1, -1 },
    { FIRE_TRUCK, HEAVY_RESCUE, AMBULANCE, -1, -1 },
    { FIRE_TRUCK, AMBULANCE, POLICE, -1, -1 },
    { HELICOPTER, RELIEF, AMBULANCE, -1, -1 },
    { FIRE_TRUCK, HELICOPTER, -1, -1, -1 },
    { AMBULANCE, POLICE, -1, -1, -1 },
    { POLICE, AMBULANCE, -1, -1, -1 },
    { POLICE, AMBULANCE, -1, -1, -1 },
    { HEAVY_RESCUE, AMBULANCE, FIRE_TRUCK, -1, -1 },
    { RECOVERY, RELIEF, -1, -1, -1 },
    { HEAVY_RESCUE, RECOVERY, -1, -1, -1 }
};

static const char* precautions[INCIDENT_TYPES] = {
    "Do not move the injured unless they are in danger from traffic or fire. "
    "Switch off the engine, turn on hazard lights, and press a clean cloth on any bleeding.",
    "Leave the building by the nearest safe exit and do not use lifts. Keep low to avoid smoke.",
    "Keep the person calm and lying down with head slightly raised. Do not give food or water.",
    "Move to higher ground or upper floors. Do not walk or drive through moving water.",
    "Do not touch the person or the wire. Keep at least 10 metres away from fallen or sparking wires.",
    "Move away from the building and do not enter it. Cover nose and mouth if there is dust.",
    "Leave the area immediately and move upwind. Cover nose and mouth with a wet cloth.",
    "Keep away from the blocked road and use an alternate route. Do not try to clear it yourself.",
    "Note the last seen place, time and clothing. Do not search unsafe areas alone.",
    "Move away from the slope and from the path of mud or rock. Do not return until declared safe.",
    "Drop, cover and hold under a sturdy table. After shaking stops, leave by the stairs, not the lift.",
    "Keep the person sitting or lying down and calm. Start CPR if they stop breathing normally.",
    "Note the time symptoms started. Keep the person still and do not give food or drink.",
    "Do not enter the water unless trained. Throw a rope or floating object to the person.",
    "Move the vehicle to the side if safe. Turn on hazard lights and stay away from traffic.",
    "Move away from the plant and upwind. Follow the instructions of the plant staff.",
    "Leave the building at once. Do not use switches, phones or lighters inside.",
    "Stay indoors away from windows. Do not go near rivers, trees or hoardings.",
    "Move away from the fire, keep windows closed and do not drive through smoke.",
    "Move slowly away from the animal and do not run. Wash the wound and seek medical care.",
    "Move to a safe, crowded place. Do not confront the attacker. Note their description.",
    "Keep the person in a safe place away from the danger. Do not leave them alone.",
    "Keep away from the tracks and carriages. Do not use open flames. Wait for the rescue team.",
    "Keep away from the water flow and move to higher ground. Avoid the flooded road.",
    "Leave the damaged structure and do not re-enter. Keep away from cracked walls."
};

const char* incident_name(int type) {
    if (type < 0 || type >= INCIDENT_TYPES) return "Unknown";
    return names[type];
}

const int* incident_needs(int type) {
    return needs[type];
}

const char* incident_precaution(int type) {
    if (type < 0 || type >= INCIDENT_TYPES) return "";
    return precautions[type];
}