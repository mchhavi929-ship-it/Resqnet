#ifndef INPUTHANDLER_H
#define INPUTHANDLER_H

#include "common.h"
#include "CityGraph.h"
#include "DisasterQueue.h"

Disaster askDisasterFromUser(DisasterId id, const CityGraph& city);

#endif // INPUTHANDLER_H