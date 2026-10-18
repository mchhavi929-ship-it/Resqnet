#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "city.h"
#include "fleet.h"
#include "disaster.h"
#include "incident.h"
#include "store.h"
#include "auth.h"
#include "dispatch.h"

#define CITY_FILE      "data/city.txt"
#define VEHICLES_FILE  "data/vehicles.txt"
#define USERS_FILE     "data/users.txt"
#define INCIDENTS_FILE "data/incidents.txt"

static void print_line(char ch) {
    for (int i = 0; i < 60; ++i) putchar(ch);
    putchar('\n');
}

static void read_line(char* buf, int size) {
    if (!fgets(buf, size, stdin)) {
        printf("\nInput closed. Exiting.\n");
        exit(0);
    }
    buf[strcspn(buf, "\r\n")] = '\0';
}

static int read_int(const char* prompt, int lo, int hi) {
    char buf[64];
    int v;
    while (1) {
        printf("%s", prompt);
        read_line(buf, sizeof(buf));
        if (sscanf(buf, "%d", &v) == 1 && v >= lo && v <= hi) return v;
        printf("Please enter a number from %d to %d.\n", lo, hi);
    }
}

static void print_places(const City* c) {
    printf("\nPlaces on the map:\n");
    for (int i = 1; i <= MAX_JUNCTIONS; ++i) {
        if (c->hasJunction[i]) printf("  - %s\n", c->junctions[i].name);
    }
}

static int ask_location(const City* c) {
    char name[NAME_LEN];
    while (1) {
        print_places(c);
        printf("Where is the incident? (place name): ");
        read_line(name, sizeof(name));
        int loc = city_find_by_name(c, name);
        if (loc != -1) return loc;
        printf("Place not found. Pick one from the list.\n");
    }
}

static void print_incident_row(const City* c, const Disaster* d) {
    printf(" #%-4d %-30s %-18s sev %2d  people %4d  by %-10s [%s]\n",
           d->id, incident_name(d->type), city_name(c, d->location),
           d->severity, d->peopleAffected, d->reporter,
           disaster_status_name(d->status));
}

/* ---------- USER PAGE ---------- */

static void user_report(const City* c, Store* s, const char* username) {
    Disaster d;
    memset(&d, 0, sizeof(d));

    printf("\n--- Report an incident ---\n");
    d.location = ask_location(c);

    printf("\nWhat happened?\n");
    for (int i = 0; i < INCIDENT_TYPES; ++i) {
        printf("  %2d. %s\n", i + 1, incident_name(i));
    }
    d.type = read_int("Choose incident number: ", 1, INCIDENT_TYPES) - 1;
    d.severity = read_int("Severity (1 = minor, 10 = critical): ", 1, 10);
    d.peopleAffected = read_int("How many people are affected? ", 0, 100000);
    d.reportedAt = 0;
    d.status = OPEN;
    strncpy(d.reporter, username, USER_LEN - 1);
    d.reporter[USER_LEN - 1] = '\0';

    int id = store_add(s, d);
    if (id < 0) {
        printf("System is full. Try again later.\n");
        return;
    }
    store_save(s, INCIDENTS_FILE);

    printf("\nIncident #%d recorded. The response team is being alerted.\n", id);
    print_line('-');
    printf(" Precautions until help arrives:\n");
    printf(" %s\n", incident_precaution(d.type));
    print_line('-');
}

static void user_my_incidents(const City* c, const Store* s, const char* username) {
    int found = 0;
    printf("\n--- Your incidents ---\n");
    for (int i = 0; i < s->count; ++i) {
        const Disaster* d = &s->items[i];
        if (strcmp(d->reporter, username) != 0) continue;
        found = 1;
        print_incident_row(c, d);
        if (d->status != CLOSED) {
            printf("    Precaution: %s\n", incident_precaution(d->type));
        }
    }
    if (!found) printf("You have not reported any incident.\n");
}

static void user_menu(const City* c, Store* s, const char* username) {
    while (1) {
        printf("\n[USER: %s]\n", username);
        printf("  1. Report an incident\n");
        printf("  2. View my incidents and precautions\n");
        printf("  3. Logout\n");
        int ch = read_int("Choose: ", 1, 3);
        if (ch == 1) user_report(c, s, username);
        else if (ch == 2) user_my_incidents(c, s, username);
        else return;
    }
}

/* ---------- DISPATCHER PAGE ---------- */

static void dispatcher_list_all(const City* c, const Store* s) {
    printf("\n--- All incidents ---\n");
    if (s->count == 0) { printf("No incidents yet.\n"); return; }
    for (int i = 0; i < s->count; ++i) print_incident_row(c, &s->items[i]);
}

static void dispatcher_dispatch_next(const City* c, Fleet* f, Store* s) {
    int idx = disaster_best_open(s->items, s->count);
    if (idx < 0) {
        printf("\nNo open incidents to dispatch.\n");
        return;
    }
    Disaster* d = &s->items[idx];

    print_line('=');
    printf(" DISPATCH  #%d  |  %s\n", d->id, incident_name(d->type));
    printf(" Location : %s\n", city_name(c, d->location));
    printf(" Severity : %d/10  |  People affected: %d\n", d->severity, d->peopleAffected);
    print_line('-');

    int sent = dispatch_incident(c, f, d);
    if (sent > 0) {
        d->status = DISPATCHED;
        store_save(s, INCIDENTS_FILE);
        printf(" Incident #%d marked DISPATCHED.\n", d->id);
    } else {
        printf(" No vehicles free. Incident #%d stays OPEN.\n", d->id);
    }
    print_line('=');
}

static void dispatcher_close(Store* s) {
    int id = read_int("Incident id to close: ", 1, 1000000);
    Disaster* d = store_find(s, id);
    if (!d) { printf("No incident with id %d.\n", id); return; }
    d->status = CLOSED;
    store_save(s, INCIDENTS_FILE);
    printf("Incident #%d closed.\n", id);
}

static void dispatcher_menu(const City* c, Fleet* f, Store* s, const char* username) {
    while (1) {
        printf("\n[DISPATCHER: %s]\n", username);
        printf("  1. View all incidents\n");
        printf("  2. Dispatch next most urgent incident\n");
        printf("  3. Close an incident\n");
        printf("  4. Logout\n");
        int ch = read_int("Choose: ", 1, 4);
        if (ch == 1) dispatcher_list_all(c, s);
        else if (ch == 2) dispatcher_dispatch_next(c, f, s);
        else if (ch == 3) dispatcher_close(s);
        else return;
    }
}

/* ---------- LOGIN ---------- */

static int login(char* username, int usize, char* role, int rsize) {
    char pass[USER_LEN];
    for (int attempt = 1; attempt <= 3; ++attempt) {
        printf("Username: ");
        read_line(username, usize);
        printf("Password: ");
        read_line(pass, sizeof(pass));
        if (auth_login(USERS_FILE, username, pass, role, rsize)) return 1;
        printf("Wrong username or password (%d of 3).\n", attempt);
    }
    return 0;
}

int main(void) {
    City city;
    Fleet fleet;
    Store store;

    city_init(&city);
    fleet_init(&fleet);
    store_init(&store);

    if (!city_load(CITY_FILE, &city)) { printf("Could not open %s\n", CITY_FILE); return 1; }
    if (!fleet_load(VEHICLES_FILE, &fleet)) { printf("Could not open %s\n", VEHICLES_FILE); return 1; }
    store_load(&store, INCIDENTS_FILE);

    print_line('=');
    printf(" RESQNET - Emergency Response System\n");
    print_line('=');

    char username[USER_LEN];
    char role[16];
    if (!login(username, sizeof(username), role, sizeof(role))) {
        printf("Too many failed attempts. Exiting.\n");
        return 0;
    }

    printf("\nLogged in as %s (%s)\n", username, role);
    if (strcmp(role, "dispatcher") == 0) dispatcher_menu(&city, &fleet, &store, username);
    else                                 user_menu(&city, &store, username);

    printf("Logged out.\n");
    return 0;
}