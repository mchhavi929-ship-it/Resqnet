#include <stdio.h>
#include "disaster/disaster.h"
#include "routing/routing.h"
#include "hospital/hospital.h"

int main(void)
{
    int ch;

    do
    {
        printf("\n====================================\n");
        printf(" RESQNET - Smart Urban Emergency Network\n");
        printf("====================================\n");
        printf("1. Report New Disaster\n");
        printf("2. View Active Disasters\n");
        printf("3. Prioritize Emergencies\n");
        printf("4. Allocate Emergency Vehicle\n");
        printf("5. View Available Vehicles\n");
        printf("6. Calculate Best Emergency Route\n");
        printf("7. View Road Network\n");
        printf("8. Simulate Road Failure\n");
        printf("9. View Hospitals\n");
        printf("10. Select Best Hospital\n");
        printf("11. Analyze Critical Junctions\n");
        printf("12. View Simulation Results\n");
        printf("13. Exit\n");
        printf("------------------------------------\n");
        printf("Enter your choice: ");

        if (scanf("%d", &ch) != 1)
        {
            printf("Invalid input! Please enter a number.\n");

            while (getchar() != '\n')
                ;

            ch = 0;
            continue;
        }

        switch (ch)
        {
            case 1:
            case 2:
                disasterModule();
                break;

            case 3:
                printf("\nPrioritize Emergencies selected.\n");
                break;

            case 4:
                printf("\nAllocate Emergency Vehicle selected.\n");
                break;

            case 5:
                printf("\nView Available Vehicles selected.\n");
                break;

            case 6:
                routingModule();
                break;

            case 7:
                printf("\nView Road Network selected.\n");
                break;

            case 8:
                printf("\nSimulate Road Failure selected.\n");
                break;

            case 9:
                hospitalModule();
                break;

            case 10:
                printf("\nSelect Best Hospital selected.\n");
                break;

            case 11:
                printf("\nAnalyze Critical Junctions selected.\n");
                break;

            case 12:
                printf("\nView Simulation Results selected.\n");
                break;

            case 13:
                printf("\nExiting RESQNET. Goodbye!\n");
                break;

            default:
                printf("\nInvalid choice! Please choose 1-13.\n");
        }

    } while (ch != 13);

    return 0;
}