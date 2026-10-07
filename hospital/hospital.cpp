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
    bool emergencyAvailable;

public:
    Hospital(int hId, string hName, string hLoc,
             string hSpecialty, int beds, int available)
    {
        id = hId;
        name = hName;
        loc = hLoc;
        specialty = hSpecialty;
        tBeds = beds;
        availBeds = available;
        emergencyAvailable = true;
    }

    void display()
    {
        cout << "\nHospital ID        : " << id;
        cout << "\nHospital Name      : " << name;
        cout << "\nLocation           : " << loc;
        cout << "\nSpecialty          : " << specialty;
        cout << "\nTotal Beds         : " << tBeds;
        cout << "\nAvailable Beds     : " << availBeds;
        cout << "\nEmergency Service  : ";

        if (emergencyAvailable)
            cout << "Available";
        else
            cout << "Not Available";

        cout << endl;
    }

    // Check hospital availability
    void checkAvailability()
    {
        if (availBeds > 0 && emergencyAvailable)
        {
            cout << "\n" << name
                 << " is available for emergency patients.";
        }
        else
        {
            cout << "\n" << name
                 << " is currently unavailable.";
        }

        cout << endl;
    }

    // Admit emergency patient
    void admitPatient()
    {
        if (availBeds > 0 && emergencyAvailable)
        {
            availBeds--;

            cout << "\nEmergency patient admitted to "
                 << name << ".";
            cout << "\nRemaining beds: "
                 << availBeds << endl;
        }
        else
        {
            cout << "\nNo emergency bed available at "
                 << name << ".\n";
        }
    }

    // Discharge patient
    void dischargePatient()
    {
        if (availBeds < totalBeds)
        {
            availBeds++;

            cout << "\nPatient discharged from "
                 << name << ".";
            cout << "\nAvailable beds: "
                 << availBeds << endl;
        }
        else
        {
            cout << "\nNo patient is currently admitted.\n";
        }
    }
};

int main()
{
    Hospital h1(201,"City Trauma and Emergency Center","Central Zone","Trauma and Emergency",100,6);

    Hospital h2(202,"Critical Care","North Zone","Burns and Critical Care",80,4);

    Hospital h3(203,"Central Multi-Specialty Hospital","South Zone","Multi-Specialty and Emergency",150,9);

    Hospital h4(204,"Flood Medical Center","East Zone","Emergency and Infectious Disease",70,3);

    Hospital h5(205,"Apex Accident and Trauma Hospital","West Zone","Accident and Trauma",120,5);

    Hospital h6(206,"Disaster Response Medical","Central Zone","Critical Care and Emergency",90,2);

    cout << "\n          RESQNET HOSPITAL NETWORK";
  
    h1.display();
    h2.display();
    h3.display();
    h4.display();
    h5.display();
    h6.display();

    cout << "\n       EMERGENCY AVAILABILITY";

    h1.checkAvailability();
    h2.checkAvailability();
    h3.checkAvailability();
    h4.checkAvailability();
    h5.checkAvailability();
    h6.checkAvailability();

    cout << "\n       EMERGENCY PATIENT MANAGEMENT";

    h1.admitPatient();
    h1.display();

    h1.dischargePatient();
    h1.display();

    return 0;
}