#include <iostream>
#include <string>
using namespace std;

class Hospital
{
private:
    int id;
    string name;
    string location;
    string specialty;
    int totalBeds;
    int availableBeds;

public:
    // Parameterized constructor
    Hospital(int hId, string hName, string hLocation,
             string hSpecialty, int beds)
    {
        id = hId;
        name = hName;
        location = hLocation;
        specialty = hSpecialty;
        totalBeds = beds;
        availableBeds = beds;
    }

    // Display hospital details
    void display()
    {
        cout << "\nHospital ID       : " << id;
        cout << "\nHospital Name     : " << name;
        cout << "\nLocation          : " << location;
        cout << "\nSpecialty         : " << specialty;
        cout << "\nTotal Beds        : " << totalBeds;
        cout << "\nAvailable Beds    : " << availableBeds;
        cout << endl;
    }

    // Check hospital availability
    void checkAvailability()
    {
        if (availableBeds > 0)
            cout << "\nHospital " << name
                 << " has beds available.\n";
        else
            cout << "\nHospital " << name
                 << " has no available beds.\n";
    }

    // Admit patient
    void admitPatient()
    {
        if (availableBeds > 0)
        {
            availableBeds--;
            cout << "\nPatient admitted to "
                 << name << ".\n";
        }
        else
        {
            cout << "\nNo beds available at "
                 << name << ".\n";
        }
    }

    // Discharge patient
    void dischargePatient()
    {
        if (availableBeds < totalBeds)
        {
            availableBeds++;
            cout << "\nPatient discharged from "
                 << name << ".\n";
        }
        else
        {
            cout << "\nNo patient to discharge.\n";
        }
    }
};

int main()
{
    Hospital h1(201, "City Emergency Hospital",
                "Central City", "Trauma", 50);

    Hospital h2(202, "Metro Medical Center",
                "North Zone", "General", 40);

    Hospital h3(203, "Life Care Hospital",
                "South Zone", "Burns", 30);

    Hospital h4(204, "River Side Hospital",
                "East Zone", "Emergency", 35);

    Hospital h5(205, "Central Trauma Center",
                "West Zone", "Trauma", 60);

    cout << "\n========================================\n";
    cout << "          RESQNET HOSPITALS             \n";
    cout << "========================================\n";

    h1.display();
    h2.display();
    h3.display();
    h4.display();
    h5.display();

    cout << "\n========================================\n";
    cout << "        HOSPITAL AVAILABILITY           \n";
    cout << "========================================\n";

    h1.checkAvailability();
    h2.checkAvailability();
    h3.checkAvailability();
    h4.checkAvailability();
    h5.checkAvailability();

    cout << "\n========================================\n";
    cout << "          PATIENT MANAGEMENT             \n";
    cout << "========================================\n";

    h1.admitPatient();
    h1.display();

    h1.dischargePatient();
    h1.display();

    return 0;
}