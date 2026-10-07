#include <stdio.h>
#include <string.h>

#define MAX_DISASTERS 100

struct Disaster
{
    int id;
    char type[30];
    char location[50];
    int severity;
    char status[20];
};

