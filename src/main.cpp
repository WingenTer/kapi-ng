#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_PN532.h>
#include <CapacitiveSensor.h>
#include <Wire.h>

#include "Config.h"
#include "Blinker.h"
#include "DisplayManager.h"
#include "DoorController.h"
#include "AuthManager.h"

// Global Objects
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);
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
long touchThreshold = 10000;

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
      else if (serialBuffer.startsWith("SET_TTH:"))
      {
        touchThreshold = serialBuffer.substring(8).toInt();
        Serial.print("TTH_SET:");
        Serial.println(touchThreshold);
      }
      else if (serialBuffer == "GET_TTH")
      {
        Serial.print("TTH:");
        Serial.println(touchThreshold);
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
  // PN532 doesn't have a simple version register read like MFRC522, 
  // but we can check if it's still responding to basic commands.
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata)
  {
    Serial.println(F("PN532 Reader unresponsive! Resetting..."));
    nfc.begin();
    nfc.SAMConfig();
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

  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.print("Didn't find PN532 board");
  } else {
    Serial.print("Found chip PN5"); Serial.println((versiondata>>24) & 0xFF, HEX);
    nfc.SAMConfig();
  }

  touch.set_CS_AutocaL_Millis(0xFFFFFFFF);

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
  
  static unsigned long lastTchReport = 0;
  if (millis() - lastTchReport > 200) { // Report every 200ms
    Serial.print("TCH:");
    Serial.println(tchrate);
    lastTchReport = millis();
  }

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
    if (tchrate > touchThreshold)
    {
      if (!state.isDoorOpen) {
        door(true);
      }
    }
  }

  if (state.doorAutoCloseEnabled && state.isDoorOpen)
  {
    if (currentSensorState) {
        state.doorOpenTime = millis(); // Reset timer if door is physically open
    }
    if (millis() - state.doorOpenTime > state.doorTimeout)
    {
      door(false);
      Serial.println("Auto-closing door");
    }
  }

  uint8_t success;
  uint8_t uid_raw[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid_raw, &uidLength, 50); // 50ms timeout

  if (success) {
    // We only use bytes 2 and 3 for the internal ID logic to match previous MFRC522 format
    // or we can generate a consistent string representation.
    String uid = "";
    if (uidLength >= 4) {
        // Using the same 2-byte logic as before if that was the intent, 
        // but typically PN532 uses the whole UID. 
        // For compatibility with your current findUser, let's keep it similar.
        uid = String(uid_raw[2]) + String(uid_raw[3]);
    }
    
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
    delay(500); // Prevent multi-reads
  }
}