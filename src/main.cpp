#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <CapacitiveSensor.h>
#include <Wire.h>

#include "Config.h"
#include "Blinker.h"
#include "DisplayManager.h"
#include "DoorController.h"
#include "AuthManager.h"

// Global Objects
MFRC522 mfrc522(SS_PIN, RST_PIN);
CapacitiveSensor touch(TOUCH_SEND, TOUCH_RECEIVE);

// Global State Initialization
SystemState state = {
    .lastDoorSensorState = false,
    .rfidResetPending = false,
    .lastRfidResetTime = 0,
    .doorAutoCloseEnabled = true,
    .isDoorOpen = false,
    .doorOpenTime = 0,
    .doorTimeout = DEFAULT_TIMEOUT,
    .isSyncing = false,
    .lastSyncTime = 0,
    .dynamicUserCount = 0};

// Serial Buffer
String serialBuffer = "";

void handleSerial()
{
  while (Serial.available() > 0)
  {
    char c = Serial.read();
    if (c == '\n')
    {
      serialBuffer.trim();
      if (serialBuffer == "kapi")
      {
        if (state.doorAutoCloseEnabled)
        {
          door(true);
          Serial.println("dokun");
        }
        else
        {
          Serial.println("Ignored: Hold Open active");
        }
      }
      else if (serialBuffer == "close")
      {
        if (state.doorAutoCloseEnabled)
        {
          door(false);
        }
        else
        {
          Serial.println("Ignored: Hold Open active");
        }
      }
      else if (serialBuffer == "CLR")
      {
        clearUsers();
        Serial.println("Users cleared");
      }
      else if (serialBuffer.startsWith("USR:"))
      {
        // Format: USR:ID:NAME
        int firstColon = serialBuffer.indexOf(':', 4);
        if (firstColon != -1)
        {
          String id = serialBuffer.substring(4, firstColon);
          String name = serialBuffer.substring(firstColon + 1);
          addUser(id, name);
          Serial.println("Added: " + name);
        }
      }
      else if (serialBuffer == "HOLD_ON")
      {
        state.doorAutoCloseEnabled = false;
        door(true);
        Serial.println("HOLD_MODE: ON");
      }
      else if (serialBuffer == "HOLD_OFF")
      {
        state.doorAutoCloseEnabled = true;
        door(false);
        Serial.println("HOLD_MODE: OFF");
      }
      else if (serialBuffer == "kilit")
      {
        door(false);
        Serial.println("kitlendi");
      }
      serialBuffer = "";
    }
    else
    {
      serialBuffer += c;
    }
  }
}

void checkRfidHealth()
{
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (v == 0x00 || v == 0xFF)
  {
    Serial.println(F("RFID Reader unresponsive! Resetting..."));
    mfrc522.PCD_Init();
  }
}

void setup()
{
  Serial.begin(9600);
  Wire.begin();
  display.begin();

  servo.attach(SERVOPIN);

  pinMode(DOORPIN, INPUT_PULLUP);
  pinMode(GPKEY, INPUT_PULLUP);

  blinker.open();

  SPI.begin();
  mfrc522.PCD_Init();
  touch.set_CS_AutocaL_Millis(0xFFFFFFFF);

  delay(500);
  mfrc522.PCD_DumpVersionToSerial();

  state.lastDoorSensorState = digitalRead(DOORPIN);
  display.sensorState(state.lastDoorSensorState);

  // Request users from server on boot
  Serial.println("REQ_USERS");

  door(true); // Initial state
  state.doorAutoCloseEnabled = true;
}

void loop()
{
  blinker.update();
  handleSerial();

  static unsigned long lastHealthCheck = 0;
  if (millis() - lastHealthCheck > 5000)
  {
    checkRfidHealth();
    lastHealthCheck = millis();
  }

  long tchrate = touch.capacitiveSensor(30);

  static bool debouncedSensorState = false;
  static unsigned long lastSensorChange = 0;
  bool rawSensorState = digitalRead(DOORPIN);

  if (rawSensorState != debouncedSensorState)
  {
    if (millis() - lastSensorChange > 50) // 50ms debounce
    {
      debouncedSensorState = rawSensorState;
      display.sensorState(debouncedSensorState);
      Serial.print("Sensor: ");
      Serial.println(debouncedSensorState ? "OPEN" : "CLOSED");
    }
  }
  else
  {
    lastSensorChange = millis();
  }

  bool currentSensorState = debouncedSensorState;
  if (currentSensorState != state.lastDoorSensorState)
  {
    state.lastDoorSensorState = currentSensorState;
  }

  if (currentSensorState)
  {
    state.doorOpenTime = millis();
  }

  if (state.doorAutoCloseEnabled)
  {
    if (analogRead(JOYDIK) < 300 || tchrate > TOUCH_THRESHOLD)
    {
      if (!state.isDoorOpen) {
        door(true);
      }
    }
    else if (analogRead(JOYDIK) > 1000)
    {
      if (state.isDoorOpen) {
        door(false);
      }
    }

    if (analogRead(JOYYAN) > 1000)
    {
      door(true);
      Serial.println("manual open");
      while (analogRead(JOYYAN) > 30)
      {
        blinker.update();
      }
      door(false);
    }
  }

  if (state.doorAutoCloseEnabled && state.isDoorOpen)
  {
    if (millis() - state.doorOpenTime > state.doorTimeout)
    {
      door(false);
      Serial.println("Auto-closing door");
    }
  }

  if (!mfrc522.PICC_IsNewCardPresent())
    return;
  if (!mfrc522.PICC_ReadCardSerial())
    return;

  String uid = String(mfrc522.uid.uidByte[2]) + String(mfrc522.uid.uidByte[3]);
  Serial.println("New card: " + uid);

  int userIdx = findUser(uid);

  if (userIdx != -1)
  {
    String userName = getDynamicName(userIdx);
    display.showUser(uid, userName);
    Serial.println("Access granted: " + userName);
    if (state.doorAutoCloseEnabled && !state.isDoorOpen)
      door(true);
  }
  else
  {
    display.showUnknown(uid);
    Serial.println("Access denied: " + uid);
    blinker.period = 100;
    blinker.duration = 50;
    blinker.state = 1;
  }

  mfrc522.PICC_HaltA();
}