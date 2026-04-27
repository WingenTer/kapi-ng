#ifndef SOUNDMANAGER_H
#define SOUNDMANAGER_H

#include <Arduino.h>
#include "Config.h"

class SoundManager {
public:
    void begin() {
        pinMode(BUZZER_PIN, OUTPUT);
        digitalWrite(BUZZER_PIN, LOW);
    }

    void update() {
        if (state.isSoundPlaying) {
            if (millis() - state.soundStartTime >= state.soundDuration) {
                noTone(BUZZER_PIN);
                state.isSoundPlaying = false;
            }
        }
    }

    void playSuccess() {
        state.soundStartTime = millis();
        // Süre 1200ms'den 500ms'ye indirildi
        state.soundDuration = 500; 
        state.isSoundPlaying = true;
        tone(BUZZER_PIN, 2200); 
    }

    void playError() {
        state.soundStartTime = millis();
        // Artık hatalı girişte daha kısa/farklı ses çalıyor
        state.soundDuration = 800; 
        state.isSoundPlaying = true;
        tone(BUZZER_PIN, 2500); 
    }

    void playBeep() {
        state.soundStartTime = millis();
        state.soundDuration = 400; 
        state.isSoundPlaying = true;
        tone(BUZZER_PIN, 2500); // Kart okuma ile aynı, çok iyi duyulan frekans
    }
};

extern SoundManager sound;

#endif
