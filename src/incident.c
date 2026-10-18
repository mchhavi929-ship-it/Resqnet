#include <string.h>
#include "incident.h"
#include "store.h"

static const char* type_names[INCIDENT_TYPES] = {
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

static const char* type_precautions[INCIDENT_TYPES] = {
    "Leave now. Stay low under smoke and cover nose with a wet cloth. Do not use lifts. Do not try to put out a big fire.",
    "Keep the person still and calm. Check breathing. Do not give food or water. Loosen tight clothing. Note any medicines or allergies.",
    "Move to higher ground. Do not walk or drive through moving water. Switch off electricity at the mains if safe. Stay away from power lines.",
    "Switch off main power only if it is safe. Do not touch the person or wire with bare hands. Stay at least 10 metres from fallen lines.",
    "Do not enter the building. Move away from walls and windows. Do not light flames. Help only from outside unless trained.",
    "Move upwind, away from the leak. Do not switch electrical items on or off. Cover nose and mouth with cloth. Leave the area.",
    "Use an alternative route. Keep hazard lights on. Warn vehicles behind you. Do not stand in the road.",
    "Note the last known location and time. If stranded, stay where you are, keep warm and visible. Keep your phone charged.",
    "Move away from the slope and debris path to higher stable ground. Do not go back for belongings. Watch for cracks and falling rocks.",
    "Drop, cover and hold on. Stay away from windows and heavy objects. After shaking stops, leave by stairs, not lifts. Check for injuries.",
    "Keep the person seated and calm. Do not let them walk. Start CPR if they are unresponsive and not breathing normally. Give aspirin only if a doctor advises.",
    "Note the time symptoms began. Check face droop, arm weakness and speech. Do not give food, water or medicine. Keep head slightly raised.",
    "Do not enter the water without training. Reach or throw something to them. Once out, check breathing and start CPR if needed. Keep them warm.",
    "Switch on hazard lights. Move off the road if safe. Stand behind a barrier away from traffic. Place a warning triangle behind the vehicle.",
    "Move upwind and away from the site. Do not enter without protective equipment. Follow instructions from plant staff.",
    "Leave the building at once. Do not use switches, phones or flames inside. Call for help from outside. Stay away from windows and debris.",
    "Stay indoors, away from windows. Avoid trees, poles and open areas. Keep a torch and emergency supplies ready. Do not drive unless necessary.",
    "Move away from the fire, against the wind direction, towards bare ground or water. Cover nose with a wet cloth. Do not enter thick forest.",
    "Move away slowly without running. Protect head and neck. Wash wounds with soap and water. Get medical help for bites or scratches.",
    "Move to a safe place. Do not confront the attacker. Note their description. Do not touch evidence. Keep the victim calm.",
    "Move them to a safe place and keep them calm. Do not leave them alone. Note medical conditions and medicines. Keep them in view.",
    "Stay away from tracks and overhead wires. Do not walk on tracks. Help injured only if safe. Follow railway staff instructions.",
    "Stay away from flowing water. Turn off the main supply valve if you know where it is. Keep away from electrical wires in water.",
    "Leave carefully. Avoid cracked walls and ceilings. Do not re-enter until declared safe. Keep away from the damaged area."
};

const char* incident_type_name(int t) {
    if (t < 0 || t >= INCIDENT_TYPES) return "Unknown";
    return type_names[t];
}

const char* incident_precaution(int t) {
    if (t < 0 || t >= INCIDENT_TYPES) return "Stay safe and wait for help.";
    return type_precautions[t];
}

int incident_add(Store* s, int type, int severity, int people,
                 const char* location, const char* reporter, const char* details) {
    if (s->incidentCount >= MAX_INCIDENTS) return -1;

    Incident* i = &s->incidents[s->incidentCount++];
    i->id       = s->nextIncidentId++;
    i->type     = type;
    i->severity = severity;
    i->people   = people;
    copy_str(i->status,   "REPORTED", 16);
    copy_str(i->team,     "",         STR_LEN);
    copy_str(i->location, location,   STR_LEN);
    copy_str(i->reporter, reporter,   STR_LEN);
    copy_str(i->details,  details,    STR_LEN);
    return i->id;
}

Incident* incident_find(Store* s, int id) {
    for (int k = 0; k < s->incidentCount; ++k) {
        if (s->incidents[k].id == id) return &s->incidents[k];
    }
    return NULL;
}

/* Insertion sort: severity high first, then older id first */
int incident_sorted(const Store* s, int order[]) {
    int n = s->incidentCount;
    for (int k = 0; k < n; ++k) order[k] = k;

    for (int a = 1; a < n; ++a) {
        int key = order[a];
        int b = a - 1;
        while (b >= 0) {
            const Incident* x = &s->incidents[order[b]];
            const Incident* y = &s->incidents[key];
            int moveUp = (y->severity > x->severity) ||
                         (y->severity == x->severity && y->id < x->id);
            if (!moveUp) break;
            order[b + 1] = order[b];
            b--;
        }
        order[b + 1] = key;
    }
    return n;
}