#include <stdio.h>
#include "hospital.h"

void hospitalModule(void)
{
    int total_hospitals;
    int available_beds;

    printf("\n===== RESQNET HOSPITAL MODULE =====\n");

    printf("Enter total number of hospitals: ");
    if (scanf("%d", &total_hospitals) != 1 ||
        total_hospitals < 0)
    {
        printf("Invalid hospital count.\n");
        return;
    }

    printf("Enter total available beds: ");
    if (scanf("%d", &available_beds) != 1 ||
        available_beds < 0)
    {
        printf("Invalid bed count.\n");
        return;
    }

    printf("\n--- HOSPITAL SUMMARY ---\n");
    printf("Total hospitals : %d\n", total_hospitals);
    printf("Available beds  : %d\n", available_beds);

    if (available_beds > 0)
    {
        printf("Status          : Beds available\n");
    }
    else
    {
        printf("Status          : No beds available\n");
    }
}