#ifndef DISPATCH_H
#define DISPATCH_H

#include "city.h"
#include "fleet.h"
#include "disaster.h"

int dispatch_incident(const City* c, Fleet* f, const Disaster* d);

#endif