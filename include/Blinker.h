#ifndef BLINKER_H
#define BLINKER_H

#include <Arduino.h>

class Blinker
{
public:
    Blinker(int ipin);
    void update();
    void open();

    int period, duration, pin;
    int state; // 0: OFF, 1: BLINK, 2: SOLID ON
};

extern Blinker blinker;

#endif
