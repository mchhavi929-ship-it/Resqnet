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

int main()
{
    struct Disaster disasters[MAX_DISASTERS];
    int count = 0;
    int choice;

    do
    {
        printf("\n RESQNET DISASTER MANAGEMENT \\n");
        printf("1. Report New Disaster\n");
        printf("2. View Active Disasters\n");
        printf("3. Exit\n");
        printf("Enter choice: ");
        scanf("%d", &choice);

        switch (choice)
        {
            case 1:
                addDisaster(disasters, &count);
                break;

            case 2:
                displayDisasters(disasters, count);
                break;

            case 3:
                printf("\nExiting Disaster Management...\n");
                break;

            default:
                printf("\nInvalid choice!\n");
        }

    } while (choice != 3);

    return 0;
}