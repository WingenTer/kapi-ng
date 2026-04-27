#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// Pin Definitions
#define LEDO 7
#define GPKEY 2
#define PN532_IRQ 2
#define PN532_RESET 3
#define DOORPIN 10
#define SERVOPIN 12
#define BUZZER_PIN 8
#define TOUCH_SEND A7
#define TOUCH_RECEIVE A6

// Constants
#define MAX_USERS 50
extern long touchThreshold;
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
    // Sound state
    unsigned long soundStartTime;
    unsigned long soundDuration;
    bool isSoundPlaying;
};

extern SystemState state;

// User Data
extern String ids[];
extern String names[];
extern int kartsayisi;

#endif
