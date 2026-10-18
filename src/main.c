#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "common.h"
#include "city.h"
#include "fleet.h"
#include "incident.h"
#include "dispatch.h"
#include "types.h"
#include "auth.h"
#include "io.h"

#define CITY_FILE     "data/city.txt"
#define VEHICLE_FILE  "data/vehicles.txt"
#define INCIDENT_FILE "data/incidents.txt"

static IncidentStore g_store;

static void line(char ch) {
    for (int i = 0; i < 60; ++i) putchar(ch);
    putchar('\n');
}

static int pick_place(const City* c) {
    printf("\nPlaces on the map:\n");
    for (int i = 1; i <= MAX_JUNCTIONS; ++i) {
        if (c->hasJunction[i]) printf("  - %s\n", c->junctions[i].name);
    }
    while (1) {
        char name[NAME_LEN];
        printf("Where is the emergency? (place name): ");
        ask_line(name, sizeof name);
        int id = city_find_by_name(c, name);
        if (id != -1) return id;
        printf("Place not found. Pick one from the list.\n");
    }
}

static void quick_describe(char* out, int size) {
    static const char* options[] = {
        "Injured person(s), need ambulance urgently",
        "Vehicle on fire or smoke",
        "Road blocked, vehicles stuck",
        "Person trapped inside",
        "Bleeding heavily",
        "Unconscious or not responding",
        "Person(s) stuck, need rescue team",
        "Not sure / other"
    };
    int n = (int)(sizeof options / sizeof options[0]);

    printf("\nWhat is the situation? (quick pick, no typing needed)\n");
    for (int i = 0; i < n; ++i) printf("  %d. %s\n", i + 1, options[i]);
    int choice = ask_int("Enter number: ", 1, n);

    strncpy(out, options[choice - 1], size - 1);
    out[size - 1] = '\0';
}

/* ---------- User side ---------- */

static void user_report(const City* c, const char* user) {
    Incident inc;
    memset(&inc, 0, sizeof inc);

    printf("\nWhat happened?\n");
    for (int i = 0; i < INCIDENT_TYPE_COUNT; ++i) {
        printf("  %2d. %s\n", i + 1, type_name(i));
    }
    inc.type = ask_int("Enter number (1-25): ", 1, INCIDENT_TYPE_COUNT) - 1;
    inc.location = pick_place(c);
    inc.severity = ask_int("Severity (1 = minor, 10 = critical): ", 1, 10);
    inc.people = ask_int("How many people are affected? ", 0, 100000);

    char desc[DESC_LEN];
    quick_describe(desc, sizeof desc);

    strncpy(inc.reporter, user, USER_LEN - 1);
    strncpy(inc.description, desc, DESC_LEN - 1);

    store_load(INCIDENT_FILE, &g_store);
    int id = store_add(&g_store, inc);
    if (id < 0) {
        printf("Storage is full. Please contact the dispatcher.\n");
        return;
    }
    store_save(INCIDENT_FILE, &g_store);

    line('=');
    printf(" Report #%d received. Dispatcher has been notified.\n", id);
    printf(" Type: %s at %s\n", type_name(inc.type), city_name(c, inc.location));
    printf(" Until the team reaches you, please follow these precautions:\n");
    printf("   %s\n", precaution_for(inc.type));
    line('=');
}

static void user_view(const City* c, const Fleet* f, const char* user) {
    store_load(INCIDENT_FILE, &g_store);
    int shown = 0;

    for (int i = 0; i < g_store.count; ++i) {
        const Incident* inc = &g_store.items[i];
        if (strcmp(inc->reporter, user) != 0) continue;
        shown++;

        line('-');
        printf(" #%d: %s at %s\n", inc->id, type_name(inc->type), city_name(c, inc->location));
        printf(" Status: %s\n", status_name(inc->status));
        if (inc->description[0]) printf(" Your note: %s\n", inc->description);

        if (inc->status == REPORTED) {
            printf(" Waiting for a team to be assigned.\n");
        } else if (inc->status == DISPATCHED) {
            for (int k = 0; k < inc->vehicleCount; ++k) {
                print_vehicle_line(c, &f->vehicles[inc->vehicles[k]], inc->location);
            }
            printf(" Status: DISPATCHED\n");
        } else {
            printf(" Resolved. Thank you.\n");
        }

        printf(" Precautions until the team arrives:\n");
        printf("   %s\n", precaution_for(inc->type));
    }
    if (!shown) printf("You have no reports yet.\n");
}

static void user_menu(const City* c, const Fleet* f, const char* user) {
    printf("\n--- Your current reports ---\n");
    user_view(c, f, user);

    while (1) {
        char b[16];
        printf("\n[%s] 1. Report an emergency  2. Refresh my reports  3. Logout\nChoice: ", user);
        ask_line(b, sizeof b);
        if (b[0] == '1') user_report(c, user);
        else if (b[0] == '2') user_view(c, f, user);
        else break;
    }
}

/* ---------- Dispatcher side ---------- */

static void dispatcher_list(const City* c, const Fleet* f) {
    store_load(INCIDENT_FILE, &g_store);
    if (g_store.count == 0) {
        printf("No incidents yet.\n");
        return;
    }
    for (int i = 0; i < g_store.count; ++i) {
        const Incident* inc = &g_store.items[i];
        line('-');
        printf(" #%d: %s at %s  [%s]\n", inc->id, type_name(inc->type),
               city_name(c, inc->location), status_name(inc->status));
        printf(" Severity %d/10 | People %d | Priority %.1f | Reported by %s\n",
               inc->severity, inc->people, priority_score(inc), inc->reporter);
        if (inc->description[0]) printf(" Note: %s\n", inc->description);
        if (inc->status == DISPATCHED) {
            for (int k = 0; k < inc->vehicleCount; ++k) {
                print_vehicle_line(c, &f->vehicles[inc->vehicles[k]], inc->location);
            }
        }
    }
    line('-');
}

static void dispatch_all(const City* c, const Fleet* f) {
    store_load(INCIDENT_FILE, &g_store);
    int tried[MAX_INCIDENTS];
    for (int i = 0; i < MAX_INCIDENTS; ++i) tried[i] = 0;

    int idx;
    int any = 0;
    while ((idx = store_best_pending(&g_store, tried)) != -1) {
        tried[idx] = 1;
        dispatch_incident(c, f, &g_store, idx);
        any = 1;
    }
    if (!any) printf("No pending incidents.\n");
    store_save(INCIDENT_FILE, &g_store);
}

static void dispatch_next(const City* c, const Fleet* f) {
    store_load(INCIDENT_FILE, &g_store);
    int tried[MAX_INCIDENTS];
    for (int i = 0; i < MAX_INCIDENTS; ++i) tried[i] = 0;

    int idx = store_best_pending(&g_store, tried);
    if (idx == -1) {
        printf("No pending incidents.\n");
        return;
    }
    dispatch_incident(c, f, &g_store, idx);
    store_save(INCIDENT_FILE, &g_store);
}

static void dispatcher_resolve(void) {
    store_load(INCIDENT_FILE, &g_store);
    char buf[32];
    printf("Incident id to mark resolved: ");
    ask_line(buf, sizeof buf);
    int id = atoi(buf);

    for (int i = 0; i < g_store.count; ++i) {
        if (g_store.items[i].id == id) {
            g_store.items[i].status = RESOLVED;
            store_save(INCIDENT_FILE, &g_store);
            printf("Incident #%d resolved. Its vehicles are free again.\n", id);
            return;
        }
    }
    printf("No incident with id %d.\n", id);
}

static void dispatcher_menu(const City* c, const Fleet* f) {
    while (1) {
        char b[16];
        printf("\n[DISPATCHER] 1. All incidents  2. Dispatch next  3. Dispatch all pending  4. Mark resolved  5. Logout\nChoice: ");
        ask_line(b, sizeof b);
        if (b[0] == '1') dispatcher_list(c, f);
        else if (b[0] == '2') dispatch_next(c, f);
        else if (b[0] == '3') dispatch_all(c, f);
        else if (b[0] == '4') dispatcher_resolve();
        else break;
    }
}

/* ---------- Main ---------- */

int main(void) {
    static City city;
    static Fleet fleet;

    city_init(&city);
    fleet_init(&fleet);
    store_init(&g_store);

    if (!city_load(CITY_FILE, &city)) {
        printf("Could not open %s\n", CITY_FILE);
        return 1;
    }
    if (!fleet_load(VEHICLE_FILE, &fleet)) {
        printf("Could not open %s\n", VEHICLE_FILE);
        return 1;
    }

    while (1) {
        char user[USER_LEN];
        int isDispatcher = 0;
        if (!auth_run(user, &isDispatcher)) break;

        if (isDispatcher) dispatcher_menu(&city, &fleet);
        else user_menu(&city, &fleet, user);
    }

    printf("Goodbye.\n");
    return 0;
}