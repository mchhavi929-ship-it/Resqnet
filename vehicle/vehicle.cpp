#include <iostream>
#include <string>
using namespace std;

class Vehicle
{
private:
    int id;
    string type;
    bool available;

public:
    Vehicle(int vId, string vType)
    {
        id = vId;
        type = vType;
        available = true;
    }

    void display()
    {
        cout << "\nVehicle ID   : " << id;
        cout << "\nVehicle Type : " << type;
        cout << "\nAvailable    : ";

        if (available)
            cout << "Yes";
        else
            cout << "No";

        cout << endl;
    }


};

int main()
{
    Vehicle v1(101, "Ambulance");
    Vehicle v2(102, "Fire Truck");
    Vehicle v3(103, "Police Vehicle");
    Vehicle v4(104, "Rescue Vehicle");
    Vehicle v5(105, "Helicopter");
    Vehicle v6(106, "Rescue Boat");
    cout << "\n RESQNET VEHICLES \n";

    v1.display();
    v2.display();
    v3.display();
    v4.display();
    v5.display();
    v6.display();

    return 0;
}