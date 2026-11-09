#include <cstring>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include "graph.h"
#include "fleet.h"
#include "types.h"
#include "incident.h"
#include "critical.h"
#include "roads.h"
#include "auth.h"
#include "vehicle.hpp"
#include "hospital.hpp"
#include "dispatch.hpp"
#include "simulation.hpp"
#include "storage.hpp"
#include "traffic.hpp"

using namespace resqnet;

namespace {

const char* GRAPH_FILE    = "data/city.txt";
const char* VEHICLE_FILE  = "data/vehicles.txt";
const char* HOSPITAL_FILE = "data/hospitals.txt";
const char* INCIDENT_FILE = "data/incidents.txt";
const char* ROAD_FILE     = "data/roads.txt";
const char* TRAFFIC_FILE  = "data/traffic.txt";
const char* USER_FILE     = "data/users.txt";
const char* LOG_FILE      = "logs/events.txt";

const std::vector<std::string> SITUATIONS = {
    "Injured person(s), need ambulance urgently",
    "Vehicle on fire or smoke",
    "Road blocked, vehicles stuck",
    "Person trapped inside",
    "Bleeding heavily",
    "Unconscious or not responding",
    "Person(s) stuck, need rescue team",
    "Not sure / other"
};

std::string readLine() {
    std::string s;
    std::getline(std::cin, s);
    return s;
}

int readInt(const std::string& prompt, int lo, int hi) {
    while (true) {
        std::cout << prompt;
        std::istringstream ss(readLine());
        int v;
        if (ss >> v && v >= lo && v <= hi) return v;
        std::cout << "Please enter a number from " << lo << " to " << hi << ".\n";
    }
}

void line(char c) {
    std::cout << std::string(60, c) << "\n";
}

void printPlaces(const Graph& g) {
    std::cout << "\nPlaces on the map:\n";
    for (int id = 1; id <= GRAPH_MAX_NODES; ++id) {
        if (graph_has_node(&g, id)) std::cout << "  - " << graph_name(&g, id) << "\n";
    }
}

int pickPlace(const Graph& g) {
    printPlaces(g);
    while (true) {
        std::cout << "Where is the emergency? (place name): ";
        int id = graph_find_by_name(&g, readLine().c_str());
        if (id >= 0) return id;
        std::cout << "Place not found. Pick one from the list.\n";
    }
}

int findIncident(const IncidentStore& s, int id) {
    for (int i = 0; i < s.count; ++i) {
        if (s.items[i].id == id) return i;
    }
    return -1;
}

std::string hospitalRouteText(const Graph& g, const Hospital& h, int from) {
    int path[GRAPH_MAX_NODES];
    int secs = 0;
    int n = graph_shortest_path(&g, from, h.location, path, GRAPH_MAX_NODES, &secs);
    if (n == 0) return "no road route";
    std::vector<int> r(path, path + n);
    return formatRoute(g, r) + " (" + std::to_string(secs) + " s)";
}

bool login(std::string& user, bool& isDispatcher) {
    while (true) {
        std::cout << "\n=== RESQNET Login ===\n1. Login\n2. Register (user)\n0. Exit\nChoice: ";
        std::string c = readLine();
        if (c.empty() || c == "0") return false;

        std::cout << "Username: ";
        std::string u = readLine();
        std::cout << "Password: ";
        std::string p = readLine();

        if (c == "2") {
            int r = auth_register(USER_FILE, u.c_str(), p.c_str());
            if (r == 1) std::cout << "Registered. Now choose Login.\n";
            else if (r == -1) std::cout << "Username already taken.\n";
            else std::cout << "Invalid input (username cannot have spaces).\n";
            continue;
        }

        char role = 0;
        if (auth_login(USER_FILE, u.c_str(), p.c_str(), &role)) {
            user = u;
            isDispatcher = (role == 'D');
            std::cout << "Welcome " << u << (isDispatcher ? " (Dispatcher)" : " (User)") << "\n";
            return true;
        }
        std::cout << "Wrong username or password.\n";
    }
}

/* ---------- User side ---------- */

void userReport(const Graph& g, IncidentStore& store, const std::string& user) {
    Incident inc{};

    std::cout << "\nWhat happened?\n";
    for (int i = 0; i < INCIDENT_TYPE_COUNT; ++i)
        std::cout << std::setw(4) << i + 1 << ". " << type_name(i) << "\n";
    inc.type = readInt("Enter number (1-25): ", 1, INCIDENT_TYPE_COUNT) - 1;

    inc.location = pickPlace(g);
    inc.severity = readInt("Severity (1 = minor, 10 = critical): ", 1, 10);
    inc.people = readInt("How many people are affected? ", 0, 100000);

    std::cout << "\nWhat is the situation? (quick pick, no typing needed)\n";
    for (std::size_t i = 0; i < SITUATIONS.size(); ++i)
        std::cout << "  " << i + 1 << ". " << SITUATIONS[i] << "\n";
    int c = readInt("Enter number: ", 1, static_cast<int>(SITUATIONS.size()));
    std::strncpy(inc.note, SITUATIONS[c - 1].c_str(), INC_NOTE_LEN - 1);
    std::strncpy(inc.reporter, user.c_str(), INC_USER_LEN - 1);

    inc_load(&store, INCIDENT_FILE);
    int id = inc_add(&store, inc);
    if (id < 0) {
        std::cout << "Storage is full. Contact the dispatcher.\n";
        return;
    }
    inc_save(&store, INCIDENT_FILE);

    line('=');
    std::cout << " Report #" << id << " received. Dispatcher has been notified.\n"
              << " Type: " << type_name(inc.type) << " at " << graph_name(&g, inc.location) << "\n"
              << " Until the team reaches you, follow these precautions:\n"
              << "   " << type_precaution(inc.type) << "\n";
    line('=');
}

void userView(const Graph& g, const VehicleList& fleet, const std::vector<Hospital>& hs,
              IncidentStore& store, const std::string& user) {
    inc_load(&store, INCIDENT_FILE);
    bool any = false;

    for (int i = 0; i < store.count; ++i) {
        const Incident& inc = store.items[i];
        if (std::strcmp(inc.reporter, user.c_str()) != 0) continue;
        any = true;

        line('-');
        std::cout << " #" << inc.id << ": " << type_name(inc.type) << " at "
                  << graph_name(&g, inc.location) << "\n"
                  << " Status: " << inc_status_name(inc.status) << "\n"
                  << " Your note: " << inc.note << "\n";

        if (inc.status == INC_REPORTED) {
            std::cout << " Waiting for a team to be assigned.\n";
        } else {
            for (int k = 0; k < inc.vcount; ++k)
                printVehicleLine(g, *fleet[inc.vehicles[k]], inc.location);
            if (inc.status == INC_ARRIVED) std::cout << " Team has reached the scene.\n";
            if (inc.status == INC_RESOLVED) std::cout << " Resolved. Thank you.\n";
        }

        if (inc.hospital >= 0 && inc.hospital < static_cast<int>(hs.size())) {
            const Hospital& h = hs[inc.hospital];
            std::cout << " Hospital : " << h.name << " | free beds " << h.freeBeds
                      << "/" << h.totalBeds << "\n"
                      << " Route to hospital: " << hospitalRouteText(g, h, inc.location) << "\n";
        }

        if (inc.status != INC_RESOLVED) {
            std::cout << " Precautions until the team arrives:\n   "
                      << type_precaution(inc.type) << "\n";
        }
    }
    if (!any) std::cout << "You have no reports yet.\n";
}

void userMenu(const Graph& g, const VehicleList& fleet, const std::vector<Hospital>& hs,
              IncidentStore& store, const std::string& user) {
    std::cout << "\n--- Your current reports ---\n";
    userView(g, fleet, hs, store, user);

    while (true) {
        std::cout << "\n[" << user << "] 1. Report an emergency  2. Refresh my reports  3. Logout\nChoice: ";
        std::string c = readLine();
        if (c == "1") userReport(g, store, user);
        else if (c == "2") userView(g, fleet, hs, store, user);
        else if (c == "3") break;
    }
}

/* ---------- Dispatcher side ---------- */

void listIncidents(const Graph& g, const VehicleList& fleet, const std::vector<Hospital>& hs,
                   IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    if (store.count == 0) { std::cout << "No incidents yet.\n"; return; }

    for (int i = 0; i < store.count; ++i) {
        const Incident& inc = store.items[i];
        line('-');
        std::cout << " #" << inc.id << ": " << type_name(inc.type) << " at "
                  << graph_name(&g, inc.location) << "  [" << inc_status_name(inc.status) << "]\n"
                  << " Severity " << inc.severity << "/10 | People " << inc.people
                  << " | Priority " << std::fixed << std::setprecision(1) << inc_priority(&inc)
                  << " | Reported by " << inc.reporter << "\n"
                  << " Note: " << inc.note << "\n";
        std::cout.unsetf(std::ios::fixed);
        for (int k = 0; k < inc.vcount; ++k)
            printVehicleLine(g, *fleet[inc.vehicles[k]], inc.location);
        if (inc.hospital >= 0 && inc.hospital < static_cast<int>(hs.size()))
            std::cout << " Hospital: " << hs[inc.hospital].name << "\n";
    }
    line('-');
}

void dispatchOne(const Graph& g, const VehicleList& fleet, IncidentStore& store, int idx) {
    if (!dispatchIncident(g, fleet, store, idx)) return;

    Simulation sim;
    planVehicles(sim, g, fleet, store.items[idx]);
    std::cout << "\n  Timeline:\n";
    sim.run(std::cout);

    try {
        appendEventLog(LOG_FILE, "dispatched #" + std::to_string(store.items[idx].id) +
                                 " " + type_name(store.items[idx].type) +
                                 " units=" + std::to_string(store.items[idx].vcount));
    } catch (const std::exception& e) {
        std::cout << "Warning: " << e.what() << "\n";
    }
}

void dispatchNext(const Graph& g, const VehicleList& fleet, IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    int skip[INC_MAX] = {0};
    int idx = inc_best_pending(&store, skip);
    if (idx < 0) { std::cout << "No pending incidents.\n"; return; }

    dispatchOne(g, fleet, store, idx);
    inc_save(&store, INCIDENT_FILE);
}

void dispatchAll(const Graph& g, const VehicleList& fleet, IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    int skip[INC_MAX] = {0};
    bool any = false;
    int idx;
    while ((idx = inc_best_pending(&store, skip)) >= 0) {
        skip[idx] = 1;
        dispatchOne(g, fleet, store, idx);
        any = true;
    }
    if (!any) std::cout << "No pending incidents.\n";
    inc_save(&store, INCIDENT_FILE);
}

void markArrived(IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    int id = readInt("Incident id where team arrived: ", 1, 100000);
    int i = findIncident(store, id);
    if (i < 0) { std::cout << "No incident with id " << id << ".\n"; return; }
    if (store.items[i].status != INC_DISPATCHED) {
        std::cout << "Incident #" << id << " is not waiting for arrival (status "
                  << inc_status_name(store.items[i].status) << ").\n";
        return;
    }
    store.items[i].status = INC_ARRIVED;
    inc_save(&store, INCIDENT_FILE);
    std::cout << "Incident #" << id << " marked ARRIVED at scene.\n";
}

void deliverPatient(const Graph& g, const VehicleList& fleet, std::vector<Hospital>& hs,
                    IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    int id = readInt("Incident id to deliver to hospital: ", 1, 100000);
    int i = findIncident(store, id);
    if (i < 0) { std::cout << "No incident with id " << id << ".\n"; return; }

    Incident& inc = store.items[i];
    if (inc.status != INC_ARRIVED) {
        std::cout << "Team must reach the scene first (status: " << inc_status_name(inc.status) << ").\n";
        return;
    }
    if (inc.hospital >= 0) {
        std::cout << "Patient already delivered to " << hs[inc.hospital].name << ".\n";
        return;
    }

    HospitalChoice hc = selectHospital(g, hs, inc.location, capabilityNeeded(inc.severity));
    if (hc.index < 0) {
        std::cout << "No hospital has a free bed with enough capability right now.\n";
        return;
    }

    admitPatient(hs, hc.index);
    inc.hospital = hc.index;
    saveHospitals(hs, HOSPITAL_FILE);
    inc_save(&store, INCIDENT_FILE);

    const Hospital& h = hs[hc.index];
    int arrive = lastArrival(g, fleet, inc);
    Simulation sim;
    sim.schedule(arrive + hc.secs, EventKind::PatientDelivered, inc.id,
                 "Patient taken to " + h.name + " via " + formatRoute(g, hc.route) +
                 " (beds left " + std::to_string(h.freeBeds) + "/" + std::to_string(h.totalBeds) + ")");
    std::cout << "\n  Timeline:\n";
    sim.run(std::cout);
}

void resolveIncident(std::vector<Hospital>& hs, IncidentStore& store) {
    inc_load(&store, INCIDENT_FILE);
    int id = readInt("Incident id to mark resolved: ", 1, 100000);
    int i = findIncident(store, id);
    if (i < 0) { std::cout << "No incident with id " << id << ".\n"; return; }

    Incident& inc = store.items[i];
    if (inc.status == INC_RESOLVED) { std::cout << "Already resolved.\n"; return; }

    if (inc.hospital >= 0) {
        dischargePatient(hs, inc.hospital);
        saveHospitals(hs, HOSPITAL_FILE);
    }
    inc.status = INC_RESOLVED;
    inc_save(&store, INCIDENT_FILE);
    std::cout << "Incident #" << id << " resolved. Its teams are free and the bed is released.\n";
}

void showHospitalBeds(const std::vector<Hospital>& hs) {
    std::cout << "\nHospitals:\n";
    for (const Hospital& h : hs) {
        std::cout << "  " << std::left << std::setw(18) << h.name
                  << " beds free " << std::setw(3) << h.freeBeds << "/" << std::setw(3) << h.totalBeds
                  << " capability " << h.capability << "\n";
    }
    std::cout << std::right;
}

void reloadTraffic(Graph& g) {
    int n = loadTraffic(g, TRAFFIC_FILE);
    std::cout << "Traffic reloaded from " << TRAFFIC_FILE << ": " << n
              << " road direction(s) with congestion set.\n";
}

void toggleRoad(Graph& g) {
    std::vector<std::pair<int, int>> roads;
    for (int i = 0; i < g.edgeCount; ++i) {
        const GraphEdge& e = g.edges[i];
        if (e.from < e.to) roads.push_back({e.from, e.to});
    }

    std::cout << "\nRoads on the map:\n";
    for (std::size_t i = 0; i < roads.size(); ++i) {
        bool closed = false;
        for (int k = 0; k < g.edgeCount; ++k)
            if (g.edges[k].from == roads[i].first && g.edges[k].to == roads[i].second)
                closed = g.edges[k].closed;
        std::cout << std::setw(3) << i + 1 << ". " << graph_name(&g, roads[i].first)
                  << " <-> " << graph_name(&g, roads[i].second)
                  << "  [" << (closed ? "BLOCKED" : "open") << "]\n";
    }

    int pick = readInt("Enter road number to toggle (0 to cancel): ", 0, static_cast<int>(roads.size()));
    if (pick == 0) return;

    auto [a, b] = roads[pick - 1];
    bool nowClosed = false;
    for (int k = 0; k < g.edgeCount; ++k)
        if (g.edges[k].from == a && g.edges[k].to == b) nowClosed = !g.edges[k].closed;

    graph_set_closed(&g, a, b, nowClosed ? 1 : 0);
    roads_save(&g, ROAD_FILE);
    std::cout << "Road " << graph_name(&g, a) << " <-> " << graph_name(&g, b) << " is now "
              << (nowClosed ? "BLOCKED" : "OPEN") << ". Saved.\n";
}

void showCritical(const Graph& g) {
    int out[GRAPH_MAX_NODES];
    int n = critical_junctions(&g, out, GRAPH_MAX_NODES);
    if (n == 0) { std::cout << "No critical junctions.\n"; return; }
    std::cout << "Critical junctions (removing one disconnects part of the network):\n";
    for (int i = 0; i < n; ++i) std::cout << "  - " << graph_name(&g, out[i]) << "\n";
}

void showEventLog() {
    try {
        for (const std::string& l : readAllLines(LOG_FILE)) std::cout << l << "\n";
    } catch (const std::exception& e) {
        std::cout << e.what() << "\n";
    }
}

void dispatcherMenu(Graph& g, const VehicleList& fleet, std::vector<Hospital>& hs,
                    IncidentStore& store) {
    while (true) {
        std::cout << "\n[DISPATCHER]\n"
                  << " 1. All incidents        2. Dispatch next        3. Dispatch all pending\n"
                  << " 4. Team arrived         5. Deliver to hospital  6. Mark resolved\n"
                  << " 7. Road status          8. Hospital beds        9. Reload traffic\n"
                  << "10. Critical junctions  11. Event log           12. Logout\nChoice: ";
        std::string c = readLine();
        if (c == "1") listIncidents(g, fleet, hs, store);
        else if (c == "2") dispatchNext(g, fleet, store);
        else if (c == "3") dispatchAll(g, fleet, store);
        else if (c == "4") markArrived(store);
        else if (c == "5") deliverPatient(g, fleet, hs, store);
        else if (c == "6") resolveIncident(hs, store);
        else if (c == "7") toggleRoad(g);
        else if (c == "8") showHospitalBeds(hs);
        else if (c == "9") reloadTraffic(g);
        else if (c == "10") showCritical(g);
        else if (c == "11") showEventLog();
        else if (c == "12") break;
        else std::cout << "Please choose a number from 1 to 12.\n";
    }
}

} // namespace

int main() {
    static Graph graph;
    static IncidentStore store;
    graph_init(&graph);

    VehicleList fleet;
    std::vector<Hospital> hospitals;

    try {
        if (!graph_load(&graph, GRAPH_FILE)) throw std::runtime_error("Cannot open map file.");
        Fleet raw;
        if (!fleet_load(&raw, VEHICLE_FILE)) throw std::runtime_error("Cannot open vehicles file.");
        for (int i = 0; i < raw.count; ++i) fleet.push_back(Vehicle::make(raw.v[i]));
        hospitals = loadHospitals(HOSPITAL_FILE);
    } catch (const std::exception& e) {
        std::cerr << "Startup error: " << e.what() << "\n";
        return 1;
    }

    roads_load(&graph, ROAD_FILE);
    loadTraffic(graph, TRAFFIC_FILE);
    inc_init(&store);

    std::string user;
    bool isDispatcher = false;
    while (login(user, isDispatcher)) {
        try {
            if (isDispatcher) dispatcherMenu(graph, fleet, hospitals, store);
            else userMenu(graph, fleet, hospitals, store, user);
        } catch (const std::exception& e) {
            std::cout << "Error: " << e.what() << "\n";
        }
    }
    std::cout << "Goodbye.\n";
    return 0;
}