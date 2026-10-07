#include <stdio.h>

int main()
{
    int ch;

    do
    {
        printf("RESQNET\nSmart Urban Emergency Network\n");
        printf("1.Report New Disaster\n");
        printf("2.View Active Disasters\n");
        printf("3.Prioritize Emergencies\n");
        printf("4.Allocate Emergency Vehicle\n");
        printf("5.View Available Vehicles\n");
        printf("6.Calculate Best Emergency Route\n");
        printf("8.Simulate Road Failure\n");
        printf("7.View road Network\n");
        printf("9.View Hospitals\n");
        printf("10.Select Best Hospital\n");
        printf("11.Analyze Critical Junctions\n");
        printf("12.View Simulation Results\n");
        printf("13.Exit\n");

        printf("\nEnter your choice: ");
        scanf("%d", &ch);

        switch(ch)
        {
            case 1:
                printf("\nReport New Disaster selected.\n");
                break;

            case 2:
                printf("\nView Active Disasters selected.\n");
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
                printf("\nCalculate Best Emergency Route selected.\n");
                break;

            case 7:
                printf("\nView Road Network selected.\n");
                break;

            case 8:
                printf("\nSimulate Road Failure selected.\n");
                break;

            case 9:
                printf("\nView Hospitals selected.\n");
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
                printf("\nExiting RESQNET...\n");
                break;

            default:
                printf("\nInvalid choice! Try again.\n");
        }

    } while(ch != 13);

    return 0;
}