#ifndef PRIORITY_H
#define PRIORITY_H

int calculate_priority(int severity, int is_critical, int waiting_time);

const char *get_priority_level(int priority_score);

void display_priority(int incident_id, int priority_score);

#endif /* PRIORITY_H */