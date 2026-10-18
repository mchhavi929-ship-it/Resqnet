#include "types.h"

static const char* TYPE_NAMES[INCIDENT_TYPE_COUNT] = {
    "Road Accident",
    "Fire Emergency",
    "Medical Emergency",
    "Flooding",
    "Electrical Hazard",
    "Building Collapse",
    "Chemical or Gas Leak",
    "Road Blockage",
    "Missing or Stranded Person",
    "Landslide",
    "Earthquake",
    "Heart Attack",
    "Stroke",
    "Drowning",
    "Vehicle Breakdown",
    "Industrial Accident",
    "Gas Explosion",
    "Severe Weather",
    "Forest Fire",
    "Animal Attack",
    "Crime or Assault",
    "Child or Elderly Person in Danger",
    "Train Accident",
    "Water Pipeline Burst",
    "Structural Damage"
};

static const int NEEDS[INCIDENT_TYPE_COUNT][4] = {
    { AMBULANCE, POLICE, -1, -1 },
    { FIRE_TRUCK, AMBULANCE, -1, -1 },
    { AMBULANCE, -1, -1, -1 },
    { RESCUE_BOAT, HELICOPTER, AMBULANCE, -1 },
    { FIRE_TRUCK, POLICE, -1, -1 },
    { HEAVY_RESCUE, AMBULANCE, -1, -1 },
    { FIRE_TRUCK, POLICE, AMBULANCE, -1 },
    { RECOVERY, POLICE, -1, -1 },
    { POLICE, HELICOPTER, -1, -1 },
    { HEAVY_RESCUE, HELICOPTER, AMBULANCE, -1 },
    { HEAVY_RESCUE, AMBULANCE, HELICOPTER, -1 },
    { AMBULANCE, -1, -1, -1 },
    { AMBULANCE, -1, -1, -1 },
    { RESCUE_BOAT, AMBULANCE, -1, -1 },
    { RECOVERY, -1, -1, -1 },
    { FIRE_TRUCK, HEAVY_RESCUE, AMBULANCE, -1 },
    { FIRE_TRUCK, AMBULANCE, POLICE, -1 },
    { HELICOPTER, AMBULANCE, -1, -1 },
    { FIRE_TRUCK, HELICOPTER, -1, -1 },
    { AMBULANCE, POLICE, -1, -1 },
    { POLICE, AMBULANCE, -1, -1 },
    { AMBULANCE, POLICE, -1, -1 },
    { HEAVY_RESCUE, AMBULANCE, FIRE_TRUCK, -1 },
    { RECOVERY, POLICE, -1, -1 },
    { HEAVY_RESCUE, POLICE, -1, -1 }
};

static const char* PRECAUTIONS[INCIDENT_TYPE_COUNT] = {
    "Do not move the injured unless the vehicle is on fire. Switch off the engine, turn on hazard lights, keep people away from traffic, and press firmly on any bleeding.",
    "Leave the area and keep others away. Do not use lifts. If there is smoke, cover your nose with a wet cloth and stay low.",
    "Keep the person still and calm. Do not give food or water. Loosen tight clothing. Start CPR only if they are not breathing and you know how.",
    "Move to higher ground. Do not walk or drive through moving water. Switch off electricity at the main switch only if it is safe.",
    "Do not touch wires or anyone in contact with a live source. Stay at least 10 metres from fallen lines. Keep others away.",
    "Stay away from the building. Do not enter to search. If trapped, cover your mouth, tap on pipes to signal, and avoid flames.",
    "Do not switch lights or electrical devices on or off. Open windows, leave immediately, and call from outside. Avoid any flame or spark.",
    "Keep a safe distance and switch off the engine. Use hazard lights or warning signs if possible. Follow the alternative route given by the dispatcher.",
    "Note the last seen place, time and clothing. Do not search alone in unsafe areas. Keep your phone reachable and share recent photos with responders.",
    "Move away from the slope and downhill path. Do not cross debris or flowing mud. Watch for further falls and warn others nearby.",
    "Drop, cover and hold on under sturdy furniture. Stay away from windows and walls. After shaking stops, move to an open area and avoid damaged buildings.",
    "Keep the person sitting and calm. Loosen tight clothing. Do not give any medicine unless a doctor has advised it. Be ready to start CPR.",
    "Note the time symptoms started. Keep the person calm with head slightly raised. Do not give food, water or medicine by mouth.",
    "Do not enter the water unless trained. Throw a rope or flotation device. If the person is out and not breathing, start CPR. Keep them warm.",
    "Pull over safely, switch on hazard lights and stay behind the barrier if possible. Do not stand in traffic lanes.",
    "Move upwind and away from the site. Do not enter the contaminated area. Cover nose and mouth. Follow instructions from site staff.",
    "Move far away from the building immediately. Do not go back for any reason. Avoid flames and vehicles. Keep clear of falling glass.",
    "Stay indoors away from windows. Avoid open ground, trees and water. Keep an emergency kit ready and follow official weather alerts.",
    "Move upwind and away from the fire path. Keep roads clear for responders. Cover nose with a wet cloth. Do not try to fight the fire yourself.",
    "Move away slowly without running. Do not corner the animal. Keep a barrier between you and it. Wash wounds with clean water and seek medical care.",
    "Move to a safe place if you can. Do not confront the attacker. Note the description and direction of escape. Do not touch anything at the scene.",
    "Keep the person calm and in sight. Do not leave them alone. Move to a safe area and do not attempt a rescue beyond your ability.",
    "Stay at least 100 metres away from tracks and trains. Do not walk on tracks. Help only from a safe spot and follow railway staff instructions.",
    "Stay away from the water or fluid spill. Keep away from electrical equipment near water. Warn neighbours and keep children away.",
    "Keep out of the damaged area. Do not use lifts. Avoid walls, ceilings or balconies showing cracks. Leave calmly by the stairs."
};

const char* type_name(int t) { return TYPE_NAMES[t]; }

const int* needs_for(int t) { return NEEDS[t]; }

const char* precaution_for(int t) { return PRECAUTIONS[t]; }

const char* vehicle_type_name(int v) {
    static const char* names[] = {
        "Ambulance", "Fire Truck", "Police", "Recovery Vehicle",
        "Heavy Rescue", "Helicopter", "Rescue Boat", "Relief Supply"
    };
    return names[v];
}