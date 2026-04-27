#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <LiquidCrystal_I2C.h>

class Displaymanager
{
public:
    Displaymanager();
    void begin();
    void doorstate(bool state);
    void sensorState(bool isOpen);
    void showUser(String id, String name);
    void showIdle();
    void showUnknown(String id);

private:
    LiquidCrystal_I2C lcd;
};

extern Displaymanager display;

#endif
