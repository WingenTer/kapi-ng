#ifndef DOOR_CONTROLLER_H
#define DOOR_CONTROLLER_H

#include <Arduino.h>
#include <Servo.h>
#include "Config.h"

extern Servo servo;

void door(bool state);

#endif
