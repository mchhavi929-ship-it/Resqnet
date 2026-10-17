#include <assert.h>
#include <stdio.h>
#include "fleet.h"

int main(void) {
    Fleet fleet;
    int counts[8] = {0};

    fleet_init(&fleet);
    assert(fleet_load("data/vehicles.txt", &fleet));
    assert(fleet.count == 80);

    for (int i = 0; i < fleet.count; ++i) {
        const Vehicle* vehicle = &fleet.vehicles[i];
        assert(vehicle->id == i + 1);
        assert(vehicle->state == AVAILABLE);
        assert(vehicle->location >= 1 && vehicle->location <= 10);
        assert(vehicle->type >= AMBULANCE && vehicle->type <= RELIEF);
        counts[vehicle->type]++;
    }

    assert(counts[AMBULANCE] == 15);
    assert(counts[FIRE_TRUCK] == 15);
    assert(counts[POLICE] == 20);
    assert(counts[RESCUE_BOAT] == 10);
    assert(counts[HELICOPTER] == 10);
    assert(counts[HEAVY_RESCUE] == 10);
    assert(counts[RECOVERY] == 0);
    assert(counts[RELIEF] == 0);

    puts("Loaded all 80 vehicles with the expected types and valid bases.");
    return 0;
}
