#include <stdio.h>
#include "priority.h"

int calculate_priority(int severity, int is_critical, int waiting_time)
{
    int priority_score = severity * 10;

    if (is_critical) {
        priority_score += 50;
    }

    if (waiting_time >= 30) {
        priority_score += 20;
    } else if (waiting_time >= 15) {
        priority_score += 10;
    }

    return priority_score;
}

const char *get_priority_level(int priority_score)
{
    if (priority_score >= 80) {
        return "CRITICAL";
    } else if (priority_score >= 60) {
        return "HIGH";
    } else if (priority_score >= 30) {
        return "MEDIUM";
    } else {
        return "LOW";
    }
}

void display_priority(int incident_id, int priority_score)
{
    printf("\n--- RESQNET PRIORITY REPORT ---\n");
    printf("Incident ID   : %d\n", incident_id);
    printf("Priority Score: %d\n", priority_score);
    printf("Priority Level: %s\n",
           get_priority_level(priority_score));
}