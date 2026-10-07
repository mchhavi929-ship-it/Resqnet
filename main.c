#include <stdio.h>

int main()
{
    int choice;

    printf("=====================================\n");
    printf("        RESQNET\n");
    printf(" Smart Urban Emergency Network\n");
    printf("=====================================\n");

    printf("\n1. Report New Disaster");
    printf("\n2. View Disasters");
    printf("\n3. Prioritize Emergencies");
    printf("\n4. Allocate Vehicle");
    printf("\n5. Find Best Route");
    printf("\n6. View Hospitals");
    printf("\n0. Exit");

    printf("\n\nEnter your choice: ");
    scanf("%d", &choice);

    switch(choice)
    {
        case 1:
            printf("\nReport New Disaster selected.\n");
            break;

        case 2:
            printf("\nView Disasters selected.\n");
            break;

        case 3:
            printf("\nPrioritize Emergencies selected.\n");
            break;

        case 4:
            printf("\nAllocate Vehicle selected.\n");
            break;

        case 5:
            printf("\nFind Best Route selected.\n");
            break;

        case 6:
            printf("\nView Hospitals selected.\n");
            break;

        case 0:
            printf("\nExiting RESQNET...\n");
            break;

        default:
            printf("\nInvalid choice!\n");
    }

    return 0;
}