#include "Blinker.h"
#include "Config.h"

Blinker::Blinker(int ipin)
{
    pin = ipin;
    pinMode(pin, OUTPUT);
}

void Blinker::update()
{
    if (state == 1) // Blinking mode
    {
        if (millis() % period < (unsigned long)duration)
        {
            digitalWrite(pin, 1);
        }
        else
            digitalWrite(pin, 0);
    }
    else if (state == 2) // Solid ON mode
    {
        digitalWrite(pin, 1);
    }
    else // OFF mode
    {
        digitalWrite(pin, 0);
    }
}

void Blinker::open()
{
    period = 5;
    duration = 1000;
    state = 0;
}

Blinker blinker(LEDO);
