#include <stdio.h>
#include <string.h>
#include <math.h>
#include "config.h"
#include "city.h"
#include "fleet.h"
#include "disaster.h"

/* Vehicle types needed per disaster type. Row order matches enum DisasterType. */
static const int needs[7][4] = {
    { FIRE_TRUCK, AMBULANCE, -1, -1 },              /* Fire */
    { RESCUE_BOAT, HELICOPTER, AMBULANCE, -1 },     /* Flood */
    { AMBULANCE, HEAVY_RESCUE, HELICOPTER, -1 },    /* Earthquake */
    { AMBULANCE, POLICE, -1, -1 },                  /* Road accident */
    { AMBULANCE, HEAVY_RESCUE, -1, -1 },            /* Building collapse */
    { HELICOPTER, AMBULANCE, -1, -1 },              /* Storm */
    { FIRE_TRUCK, POLICE, -1, -1 }                  /* Hazardous */
};

static int heli_seconds(const City* c, int from, int to, int preparationSeconds) {
    double dx = c->junctions[from].x - c->junctions[to].x;
    double dy = c->junctions[from].y - c->junctions[to].y;
    double metres = sqrt(dx * dx + dy * dy) * 10.0;
    int seconds = (int)(metres / HELI_SPEED_MPS);
    return seconds < preparationSeconds
        ? preparationSeconds
        : seconds;
}

static int find_best(const Fleet* f, const City* c, int t, int target,
                     int preparationSeconds) {
    int best = -1;
    int bestTime = INF_TIME;

    for (int i = 0; i < f->count; ++i) {
        const Vehicle* v = &f->vehicles[i];
        if (v->state != AVAILABLE || v->type != t) continue;

        int secs = 0;
        if (v->type == HELICOPTER) {
            secs = heli_seconds(c, v->location, target, preparationSeconds);
        } else {
            int path[MAX_JUNCTIONS];
            if (city_shortest_path(c, v->location, target, path, MAX_JUNCTIONS, &secs) == 0) continue;
            secs += preparationSeconds;
        }
        if (secs < bestTime) {
            bestTime = secs;
            best = i;
        }
    }
    return best;
}

static void print_line(char ch) {
    for (int i = 0; i < 60; ++i) putchar(ch);
    putchar('\n');
}

static void clear_line_input(void) {
    int ch;
    while ((ch = getchar()) != '\n' && ch != EOF) {}
}

static int ask_int(const char* prompt, int lo, int hi) {
    int v;
    while (1) {
        printf("%s", prompt);
        if (scanf("%d", &v) == 1 && v >= lo && v <= hi) {
            clear_line_input();
            return v;
        }
        clear_line_input();
        printf("Please enter a number from %d to %d.\n", lo, hi);
    }
}

static void ask_line(char* buf, int size) {
    if (fgets(buf, size, stdin)) {
        buf[strcspn(buf, "\r\n")] = '\0';
    } else {
        buf[0] = '\0';
    }
}

static void ask_disaster(City* c, int id, Disaster* d) {
    d->id = id;
    d->reportedAt = 0;

    printf("\nPlaces on the map:\n");
    for (int i = 1; i <= MAX_JUNCTIONS; ++i) {
        if (c->hasJunction[i]) printf("  - %s\n", c->junctions[i].name);
    }

    while (1) {
        char name[NAME_LEN];
        printf("Where is the emergency? (place name): ");
        ask_line(name, sizeof(name));
        int loc = city_find_by_name(c, name);
        if (loc != -1) { d->location = loc; break; }
        printf("Place not found. Pick one from the list above.\n");
    }

    printf("\nWhat happened?\n");
    for (int i = 0; i < 7; ++i) printf("  %d. %s\n", i + 1, disaster_type_name(i));
    d->type = ask_int("Enter number (1-7): ", 1, 7) - 1;
    d->severity = ask_int("Severity (1 = minor, 10 = critical): ", 1, 10);
    d->peopleAffected = ask_int("How many people are affected? ", 0, 100000);
}

int main(void) {
    City city;
    Fleet fleet;
    DisasterList queue;
    ResqnetConfig config;
    const char* configPath = "server/config.json";

    city_init(&city);
    fleet_init(&fleet);
    queue.count = 0;

    if (!city_load("data/city.txt", &city)) {
        printf("Could not open data/city.txt\n");
        return 1;
    }
    if (!fleet_load("data/vehicles.txt", &fleet)) {
        printf("Could not open data/vehicles.txt\n");
        return 1;
    }
    if (!resqnet_config_load(configPath, &config)) {
        printf("Could not load valid settings from %s\n", configPath);
        return 1;
    }

    print_line('=');
    printf(" RESQNET Phase 1 - Emergency Input\n");
    print_line('=');

    int nextId = 1;
    while (1) {
        printf("Add an emergency? (y/n): ");
        char ans[8];
        ask_line(ans, sizeof(ans));
        if (ans[0] != 'y' && ans[0] != 'Y') break;

        Disaster d;
        ask_disaster(&city, nextId++, &d);
        if (queue.count < MAX_DISASTERS) queue.items[queue.count++] = d;
        printf("\n");
    }

    if (queue.count == 0) {
        printf("No emergencies entered. Exiting.\n");
        return 0;
    }

    int total = queue.count;
    print_line('=');
    printf(" DISPATCH REPORT  (%d incident(s), by priority)\n", total);
    print_line('=');

    int order = 1;
    Disaster d;
    const DisasterScoreWeights scoreWeights = {
        config.severityWeight,
        config.peopleAffectedWeight,
    };
    while (disaster_pop_best(&queue, &d, &scoreWeights)) {
        printf("\n INCIDENT %d of %d  |  %s\n", order, total, disaster_type_name(d.type));
        printf(" Location : %s (junction %d)\n", city_name(&city, d.location), d.location);
        printf(" Severity : %d/10  |  People affected: %d\n", d.severity, d.peopleAffected);
        printf(" Priority : %s\n", order == 1 ? "Handled first" : "Queued");
        print_line('-');

        const int* needed = needs[d.type];
        for (int k = 0; k < 4 && needed[k] != -1; ++k) {
            int idx = find_best(&fleet, &city, needed[k], d.location,
                                config.responsePreparationSeconds);
            if (idx < 0) {
                printf("  [--] No free vehicle of the required type\n");
                continue;
            }

            Vehicle* v = &fleet.vehicles[idx];
            int path[MAX_JUNCTIONS];
            int secs = 0;

            printf("  [GO] %s  (from %s)\n", v->name, city_name(&city, v->location));
            if (v->type == HELICOPTER) {
                secs = heli_seconds(&city, v->location, d.location,
                                    config.responsePreparationSeconds);
                printf("       Route   : direct flight (ignores roads)\n");
            } else {
                int n = city_shortest_path(&city, v->location, d.location, path, MAX_JUNCTIONS, &secs);
                secs += config.responsePreparationSeconds;
                printf("       Route   : ");
                for (int i = 0; i < n; ++i) {
                    printf("%s", city_name(&city, path[i]));
                    if (i + 1 < n) printf(" -> ");
                }
                printf("\n");
            }
            printf("       ETA     : %d s  (includes %d s response prep)\n",
                   secs, config.responsePreparationSeconds);

            v->state = ON_SCENE;
            v->location = d.location;
        }
        print_line('-');
        order++;
    }
    print_line('=');
    return 0;
}