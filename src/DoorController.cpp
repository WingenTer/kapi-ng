#include "DoorController.h"
#include "Config.h"
#include "Blinker.h"
#include "DisplayManager.h"

Servo servo;

void door(bool open)
{
    display.doorstate(open);
    if (open)
    {
        state.doorOpenTime = millis();
        state.isDoorOpen = true;

        blinker.state = 2; // Solid ON when door is open
        blinker.update();

        Serial.println("door open");
        servo.write(0);
    }
    else
    {
        state.isDoorOpen = false;
        blinker.state = 0;
        blinker.update();

        servo.write(180);
        Serial.println("door closed");
        display.showIdle();
    }
}
