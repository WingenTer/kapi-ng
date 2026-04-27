#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// Pin Definitions
#define LEDO 7
#define GPKEY 2
#define RST_PIN 48
#define SS_PIN 53
#define DOORPIN 10
#define JOYDIK A0
#define JOYYAN A1
#define SERVOPIN 12
#define TOUCH_SEND A7
#define TOUCH_RECEIVE A6

// Constants
#define MAX_USERS 50
#define TOUCH_THRESHOLD 10000
const unsigned long DEFAULT_TIMEOUT = 2000;

// System State Structure
struct SystemState
{
    bool lastDoorSensorState;
    bool rfidResetPending;
    unsigned long lastRfidResetTime;
    bool doorAutoCloseEnabled;
    bool isDoorOpen;
    unsigned long doorOpenTime;
    unsigned long doorTimeout;
    bool isSyncing;
    unsigned long lastSyncTime;
    int dynamicUserCount;
};

extern SystemState state;

// User Data
extern String ids[];
extern String names[];
extern int kartsayisi;

#endif
