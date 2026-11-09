@echo off
gcc -std=c11 -Wall -c -Icore\include core\src\graph.c core\src\fleet.c core\src\types.c core\src\incident.c core\src\critical.c core\src\roads.c core\src\auth.c
if errorlevel 1 exit /b 1
g++ -std=c++17 -Wall -Icore\include -Iapp -c app\vehicle.cpp app\hospital.cpp app\storage.cpp app\dispatch.cpp app\simulation.cpp app\traffic.cpp app\main.cpp
if errorlevel 1 exit /b 1
g++ -o resqnet.exe main.o vehicle.o hospital.o storage.o dispatch.o simulation.o traffic.o graph.o fleet.o types.o incident.o critical.o roads.o auth.o
if errorlevel 1 exit /b 1
echo Build OK