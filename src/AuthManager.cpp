#include "AuthManager.h"
#include "Config.h"
#include "Blinker.h"

// Layer 1: Master Failsafe List (Empty - Controlled via Web UI)
String masterIds[] = {};
String masterNames[] = {};
int masterCount = 0;

// Layer 2: Dynamic Server Cache (RAM)
String dynamicIds[MAX_USERS];
String dynamicNames[MAX_USERS];

bool issafe(String *id)
{
    return (findUser(*id) != -1);
}

void addUser(String id, String name)
{
    if (state.dynamicUserCount < MAX_USERS)
    {
        dynamicIds[state.dynamicUserCount] = id;
        dynamicNames[state.dynamicUserCount] = name;
        state.dynamicUserCount++;
    }
}

void clearUsers()
{
    state.dynamicUserCount = 0;
}

int findUser(String id)
{
    // 1. Check Master List (Returns -100 to -2)
    for (int i = 0; i < masterCount; i++)
    {
        if (id == masterIds[i])
            return -(i + 2);
    }

    // 2. Check Dynamic Cache (Returns 0 to 49)
    for (int i = 0; i < state.dynamicUserCount; i++)
    {
        if (id == dynamicIds[i])
            return i;
    }

    // 3. Not Found
    return -1;
}

String getDynamicName(int index)
{
    if (index <= -2)
    {
        int masterIdx = -(index + 2);
        if (masterIdx >= 0 && masterIdx < masterCount)
            return masterNames[masterIdx];
    }
    if (index >= 0 && index < state.dynamicUserCount)
        return dynamicNames[index];
    return "Unknown";
}

String getDynamicId(int index)
{
    if (index <= -2)
    {
        int masterIdx = -(index + 2);
        if (masterIdx >= 0 && masterIdx < masterCount)
            return masterIds[masterIdx];
    }
    if (index >= 0 && index < state.dynamicUserCount)
        return dynamicIds[index];
    return "";
}

void whoami()
{
    Serial.print("ID Numarasi: ");
    for (int sayac = 0; sayac < 4; sayac++)
    {
        Serial.print(" ");
    }
    Serial.println("");
}

void noauth()
{
    Serial.println("sg");
    whoami();
}
