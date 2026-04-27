#include "DisplayManager.h"

Displaymanager::Displaymanager() : lcd(0x23, 20, 4) {}

void Displaymanager::begin()
{
    lcd.init();
    lcd.backlight();
    lcd.clear();
    showIdle();
    doorstate(false);
}

void Displaymanager::doorstate(bool state)
{
    lcd.setCursor(0, 3);
    lcd.print("Lock:");
    if (state)
        lcd.print("OPEN ");
    else
        lcd.print("LOCK ");
}

void Displaymanager::sensorState(bool isOpen)
{
    lcd.setCursor(10, 3);
    lcd.print("Sens:");
    if (isOpen)
        lcd.print("OPEN ");
    else
        lcd.print("CLSD ");
}

void Displaymanager::showUser(String id, String name)
{
    lcd.setCursor(0, 0);
    lcd.print("User: ");
    lcd.print(name);
    lcd.print("                "); // Clear line
    lcd.setCursor(0, 1);
    lcd.print("ID: ");
    lcd.print(id);
    lcd.print("                "); // Clear line
}

void Displaymanager::showIdle()
{
    lcd.setCursor(0, 0);
    lcd.print("  KAPI-NG SYSTEM    ");
    lcd.setCursor(0, 1);
    lcd.print("                    ");
    lcd.setCursor(0, 2);
    lcd.print("Ready to scan...    ");
}

void Displaymanager::showUnknown(String id)
{
    lcd.setCursor(0, 0);
    lcd.print("!! UNKNOWN CARD !!  ");
    lcd.setCursor(0, 1);
    lcd.print("ID: ");
    lcd.print(id);
    lcd.print("                ");
}

Displaymanager display;
