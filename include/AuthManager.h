#ifndef AUTH_MANAGER_H
#define AUTH_MANAGER_H

#include <Arduino.h>

bool issafe(String *id);
void whoami();
void noauth();

// Dual-Layer Auth Functions
void addUser(String id, String name);
void clearUsers();
int findUser(String id);
String getDynamicName(int index);
String getDynamicId(int index);

#endif
