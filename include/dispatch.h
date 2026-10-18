#ifndef DISPATCH_H
#define DISPATCH_H

#include "common.h"
#include "city.h"
#include "fleet.h"
#include "incident.h"

int  vehicle_eta(const City* c, const Vehicle* v, int target, int path[], int* n);
void print_vehicle_line(const City* c, const Vehicle* v, int target);
void dispatch_incident(const City* c, const Fleet* f, IncidentStore* s, int idx);

#endif