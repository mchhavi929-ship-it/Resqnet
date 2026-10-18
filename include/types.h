#ifndef TYPES_H
#define TYPES_H

#include "common.h"

const char* type_name(int t);
const int*  needs_for(int t);
const char* precaution_for(int t);
const char* vehicle_type_name(int v);

#endif