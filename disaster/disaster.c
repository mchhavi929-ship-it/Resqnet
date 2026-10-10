#include <stdio.h>
#include <string.h>
#include "disaster.h"

#define MAX_DISASTERS 100

struct Disaster {
    int id;
    char type[30];
    char location[50];
    int severity;
    char status[20];
};

static struct Disaster disasters[MAX_DISASTERS];
static int count = 0;

static void addDisaster(void)
{
    if (count >= MAX_DISASTERS) {
        printf("Disaster storage is full!\n");
        return;
    }

    struct Disaster *d = &disasters[count];

    d->id = count + 1;

    printf("Enter disaster type: ");
    scanf(" %29[^\n]", d->type);

    printf("Enter location: ");
    scanf(" %49[^\n]", d->location);

    printf("Enter severity (1-10): ");
    if (scanf("%d", &d->severity) != 1) {
        printf("Invalid severity input!\n");
        while (getchar() != '\n');
        return;
    }

    if (d->severity < 1 || d->severity > 10) {
        printf("Severity must be between 1 and 10.\n");
        return;
    }

    strcpy(d->status, "Active");
    count++;

    printf("Disaster reported successfully! ID: %d\n", d->id);
}

static void displayDisasters(void)
{
    if (count == 0) {
        printf("No disasters reported yet.\n");
        return;
    }

    printf("\n=== REPORTED DISASTERS ===\n");

    for (int i = 0; i < count; i++) {
        printf("\nID: %d\n", disasters[i].id);
        printf("Type: %s\n", disasters[i].type);
        printf("Location: %s\n", disasters[i].location);
        printf("Severity: %d/10\n", disasters[i].severity);
        printf("Status: %s\n", disasters[i].status);
    }
}

void disasterModule(void)
{
    int choice;

    do {
        printf("\n=== RESQNET DISASTER MANAGEMENT ===\n");
        printf("1. Report New Disaster\n");
        printf("2. View Active Disasters\n");
        printf("3. Return to Main Menu\n");
        printf("Enter choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input!\n");
            while (getchar() != '\n');
            choice = 0;
            continue;
        }

        switch (choice) {
            case 1:
                addDisaster();
                break;
            case 2:
                displayDisasters();
                break;
            case 3:
                printf("Returning to main menu...\n");
                break;
            default:
                printf("Invalid choice!\n");
        }
    } while (choice != 3);
}