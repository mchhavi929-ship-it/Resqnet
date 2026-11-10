#ifndef INCIDENT_H
#define INCIDENT_H

#ifdef __cplusplus
extern "C" {
#endif

#define INC_MAX        1000
#define INC_USER_LEN   32
#define INC_NOTE_LEN   200
#define INC_MAX_UNITS  96
#define INC_MAX_HOSP   4

enum IncStatus { INC_REPORTED = 0, INC_DISPATCHED = 1, INC_ARRIVED = 2, INC_RESOLVED = 3, INC_RELEASED = 4 };

typedef struct {
    int  id, type, location, severity, people, status, vcount;
    int  vehicles[INC_MAX_UNITS];
    int  delivered;
    int  nHosp;
    int  hosp[INC_MAX_HOSP];
    int  hospPat[INC_MAX_HOSP];
    char reporter[INC_USER_LEN];
    char note[INC_NOTE_LEN];
} Incident;

typedef struct {
    Incident items[INC_MAX];
    int      count;
} IncidentStore;

void        inc_init(IncidentStore* s);
int         inc_load(IncidentStore* s, const char* path);
int         inc_save(const IncidentStore* s, const char* path);
int         inc_add(IncidentStore* s, Incident inc);
double      inc_priority(const Incident* inc);
int         inc_best_pending(const IncidentStore* s, const int skip[]);
const char* inc_status_name(int status);

#ifdef __cplusplus
}
#endif

#endif