# kapi-ng — Next Generation Door Access System

> 🇹🇷 Türkçe açıklama aşağıda yer almaktadır. | 🇬🇧 English description follows below.

---

## 🇬🇧 English

### Overview

**kapi-ng** is an Arduino-based smart door access control system with a Node.js web interface. It combines RFID card authentication, capacitive touch sensing, and a real-time web dashboard to manage physical door access.

### Features

- 🔑 **RFID Access Control** — Register and manage up to 50 RFID cards
- 👆 **Capacitive Touch Sensor** — Open the door with a touch (configurable threshold)
- 🌐 **Web Dashboard** — Real-time control panel at `http://localhost:3000`
- 🗓️ **Access Schedules** — Restrict individual cards to specific time windows
- 🔒 **Role-Based Auth** — Admin and regular-user roles for the web interface
- 🔁 **Hold Open Mode** — Keep the door open and disable auto-close
- 📊 **Usage Statistics** — Per-user access counters and last-read timestamps
- 📋 **Daily Log Files** — Categorized, date-rotated logs in the `/logs` directory
- 🔄 **Auto-Sync** — Arduino is re-synced every minute and on every change

### Hardware Requirements

| Component | Details |
|---|---|
| Microcontroller | Arduino Mega 2560 |
| RFID Reader | MFRC522 (SPI) |
| Display | I²C LCD (LiquidCrystal_I2C) |
| Door Lock | Servo motor (pin 12) |
| Door Sensor | Digital input with pull-up (pin 10) |
| Touch Sensor | CapacitiveSensor (send: A7, receive: A6) |
| Joystick | Analog inputs A0 (up/down), A1 (left/right) |

**Pin Mapping (from `include/Config.h`)**

| Pin | Function |
|---|---|
| 53 (SS) | RFID SS |
| 48 (RST) | RFID Reset |
| 12 | Servo (door lock) |
| 10 | Door sensor |
| A7 / A6 | Touch send / receive |
| A0 / A1 | Joystick |
| 2 | General purpose key |
| 7 | LED output |

### Software Requirements

- **Node.js** ≥ 18
- **PlatformIO** (for Arduino firmware)
- A Linux host with the Arduino connected via USB

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/WingenTer/kapi-ng.git
cd kapi-ng
```

#### 2. Flash the Arduino firmware

```bash
pio run --target upload
```

#### 3. Install Node.js dependencies

```bash
npm install
```

#### 4. Configure the serial port

Open `server.js` and update `PORT_PATH` to match your Arduino device:

```js
const PORT_PATH = "/dev/serial/by-id/usb-Arduino...";
```

#### 5. Start the server

```bash
node server.js
```

The web interface will be available at **http://localhost:3000**.

### Default Credentials

| Username | Password |
|---|---|
| `admin` | `admin` |

> ⚠️ Change the default password immediately after first login.

### Serial Protocol (Node.js ↔ Arduino)

All commands are plain text strings terminated with `\n`.

| Command | Direction | Description |
|---|---|---|
| `kapi` | → Arduino | Open the door |
| `close` | → Arduino | Close the door |
| `CLR` | → Arduino | Clear all users |
| `USR:ID:NAME` | → Arduino | Add an RFID user |
| `SET_TCH:VALUE` | → Arduino | Set touch threshold |
| `HOLD_ON` | → Arduino | Enable hold-open mode |
| `HOLD_OFF` | → Arduino | Disable hold-open mode |
| `REQ_USERS` | ← Arduino | Request user list from server |
| `New card: ID` | ← Arduino | Newly scanned card UID |
| `Access granted: NAME` | ← Arduino | Successful RFID authentication |
| `TCH:VALUE` | ← Arduino | Live touch sensor reading |

### REST API Endpoints

All endpoints require a logged-in session (cookie-based).

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/login` | — | Log in |
| POST | `/api/logout` | User | Log out |
| GET | `/api/auth-check` | — | Check session |
| GET | `/api/users` | User | List RFID users |
| POST | `/api/users` | Admin | Add RFID user |
| DELETE | `/api/users/:id` | Admin | Remove RFID user |
| PATCH | `/api/users/:id/toggle` | Admin | Enable/disable user |
| PATCH | `/api/users/:id/schedule` | Admin | Set time schedule |
| GET | `/api/door/open` | User | Open door |
| GET | `/api/door/close` | User | Close door |
| GET | `/api/door/hold` | Admin | Toggle hold-open |
| POST | `/api/sync` | Admin | Force Arduino sync |
| GET | `/api/logs` | User | View log entries |
| GET | `/api/config` | User | Get configuration |
| POST | `/api/config/threshold` | Admin | Update touch threshold |
| GET | `/api/web-users` | Admin | List web accounts |
| POST | `/api/web-users` | Admin | Create web account |
| DELETE | `/api/web-users/:username` | Admin | Delete web account |

### Log System

Logs are stored under `/logs/YYYY-MM-DD/` and rotated daily.

| File | Log Types | Contents |
|---|---|---|
| `girisler.log` | `DOOR`, `STATS`, `RFID`, `KART` | Access and card events |
| `web.log` | `WEB`, `AUTH`, `API` | Web logins and API calls |
| `guncelleme.log` | `SYNC`, `CONFIG`, `UPDATE`, `SYSTEM` | Config and sync changes |
| `all.log` | All | Aggregated log |
| `other.log` | Everything else | Uncategorized events |

### Project Structure

```
kapi-ng/
├── server.js           # Node.js server (API + serial communication)
├── public/
│   ├── index.html      # Web dashboard (single-page app)
│   ├── script.js       # Frontend JavaScript
│   └── style.css       # Stylesheet
├── src/
│   ├── main.cpp        # Arduino main loop
│   ├── AuthManager.cpp # RFID user storage and lookup
│   ├── DoorController.cpp # Servo door control
│   ├── DisplayManager.cpp # I²C LCD management
│   └── Blinker.cpp     # LED blinker utility
├── include/
│   ├── Config.h        # Pin definitions and constants
│   ├── AuthManager.h
│   ├── DoorController.h
│   ├── DisplayManager.h
│   └── Blinker.h
├── users.json          # RFID user database
├── web_users.json      # Web interface accounts
├── config.json         # Runtime configuration
├── platformio.ini      # PlatformIO build config
└── package.json        # Node.js dependencies
```

---

## 🇹🇷 Türkçe

### Genel Bakış

**kapi-ng**, Arduino tabanlı akıllı bir kapı erişim kontrol sistemidir. Node.js web arayüzü ile RFID kart doğrulaması, kapasitif dokunmatik algılama ve gerçek zamanlı web panosu sunarak fiziksel kapı erişimini yönetmenizi sağlar.

### Özellikler

- 🔑 **RFID Erişim Kontrolü** — 50'ye kadar RFID kart kaydedilip yönetilebilir
- 👆 **Kapasitif Dokunma Sensörü** — Ayarlanabilir eşik değeriyle dokunarak kapıyı aç
- 🌐 **Web Panosu** — `http://localhost:3000` adresinde gerçek zamanlı kontrol paneli
- 🗓️ **Erişim Zamanlaması** — Kartları belirli saat dilimlerine kısıtlayın
- 🔒 **Rol Tabanlı Kimlik Doğrulama** — Admin ve standart kullanıcı rolleri
- 🔁 **Kapıyı Açık Tutma Modu** — Otomatik kapanmayı devre dışı bırakın
- 📊 **Kullanım İstatistikleri** — Kullanıcı bazlı erişim sayacı ve son okuma zamanı
- 📋 **Günlük Log Dosyaları** — `/logs` dizininde kategorili ve tarih döndürmeli loglar
- 🔄 **Otomatik Senkronizasyon** — Arduino her dakika ve her değişiklikte yeniden senkronize edilir

### Donanım Gereksinimleri

| Bileşen | Detay |
|---|---|
| Mikrodenetleyici | Arduino Mega 2560 |
| RFID Okuyucu | MFRC522 (SPI) |
| Ekran | I²C LCD (LiquidCrystal_I2C) |
| Kapı Kilidi | Servo motor (pin 12) |
| Kapı Sensörü | Pull-up'lı dijital giriş (pin 10) |
| Dokunma Sensörü | CapacitiveSensor (gönderici: A7, alıcı: A6) |
| Joystick | Analog giriş A0 (yukarı/aşağı), A1 (sol/sağ) |

**Pin Haritası (`include/Config.h`)**

| Pin | Fonksiyon |
|---|---|
| 53 (SS) | RFID SS |
| 48 (RST) | RFID Reset |
| 12 | Servo (kapı kilidi) |
| 10 | Kapı sensörü |
| A7 / A6 | Dokunma gönderici / alıcı |
| A0 / A1 | Joystick |
| 2 | Genel amaçlı tuş |
| 7 | LED çıkışı |

### Yazılım Gereksinimleri

- **Node.js** ≥ 18
- **PlatformIO** (Arduino firmware için)
- Arduino'nun USB ile bağlı olduğu bir Linux makine

### Kurulum

#### 1. Depoyu klonlayın

```bash
git clone https://github.com/WingenTer/kapi-ng.git
cd kapi-ng
```

#### 2. Arduino firmware'ini yükleyin

```bash
pio run --target upload
```

#### 3. Node.js bağımlılıklarını yükleyin

```bash
npm install
```

#### 4. Seri portu yapılandırın

`server.js` dosyasını açın ve `PORT_PATH` değerini Arduino aygıtınıza göre güncelleyin:

```js
const PORT_PATH = "/dev/serial/by-id/usb-Arduino...";
```

#### 5. Sunucuyu başlatın

```bash
node server.js
```

Web arayüzüne **http://localhost:3000** adresinden erişilebilir.

### Varsayılan Kimlik Bilgileri

| Kullanıcı Adı | Şifre |
|---|---|
| `admin` | `admin` |

> ⚠️ İlk girişten sonra varsayılan şifreyi hemen değiştirin.

### Seri Protokolü (Node.js ↔ Arduino)

Tüm komutlar `\n` ile biten düz metin dizileridir.

| Komut | Yön | Açıklama |
|---|---|---|
| `kapi` | → Arduino | Kapıyı aç |
| `close` | → Arduino | Kapıyı kapat |
| `CLR` | → Arduino | Tüm kullanıcıları temizle |
| `USR:ID:NAME` | → Arduino | RFID kullanıcısı ekle |
| `SET_TCH:DEGER` | → Arduino | Dokunma eşiğini ayarla |
| `HOLD_ON` | → Arduino | Açık tut modunu etkinleştir |
| `HOLD_OFF` | → Arduino | Açık tut modunu devre dışı bırak |
| `REQ_USERS` | ← Arduino | Sunucudan kullanıcı listesi iste |
| `New card: ID` | ← Arduino | Yeni taranan kart UID'si |
| `Access granted: AD` | ← Arduino | Başarılı RFID doğrulaması |
| `TCH:DEGER` | ← Arduino | Anlık dokunma sensörü değeri |

### REST API Uç Noktaları

Tüm uç noktalar oturum açmış kullanıcı gerektirir (çerez tabanlı).

| Metod | Yol | Yetki | Açıklama |
|---|---|---|---|
| POST | `/api/login` | — | Giriş yap |
| POST | `/api/logout` | Kullanıcı | Çıkış yap |
| GET | `/api/auth-check` | — | Oturum kontrolü |
| GET | `/api/users` | Kullanıcı | RFID kullanıcılarını listele |
| POST | `/api/users` | Admin | RFID kullanıcısı ekle |
| DELETE | `/api/users/:id` | Admin | RFID kullanıcısını sil |
| PATCH | `/api/users/:id/toggle` | Admin | Kullanıcıyı etkinleştir/devre dışı bırak |
| PATCH | `/api/users/:id/schedule` | Admin | Zaman çizelgesi ayarla |
| GET | `/api/door/open` | Kullanıcı | Kapıyı aç |
| GET | `/api/door/close` | Kullanıcı | Kapıyı kapat |
| GET | `/api/door/hold` | Admin | Açık tut modunu değiştir |
| POST | `/api/sync` | Admin | Arduino senkronizasyonu zorla |
| GET | `/api/logs` | Kullanıcı | Log kayıtlarını görüntüle |
| GET | `/api/config` | Kullanıcı | Yapılandırmayı al |
| POST | `/api/config/threshold` | Admin | Dokunma eşiğini güncelle |
| GET | `/api/web-users` | Admin | Web hesaplarını listele |
| POST | `/api/web-users` | Admin | Web hesabı oluştur |
| DELETE | `/api/web-users/:username` | Admin | Web hesabını sil |

### Log Sistemi

Loglar `/logs/YYYY-MM-DD/` dizininde saklanır ve her gün döndürülür.

| Dosya | Log Türleri | İçerik |
|---|---|---|
| `girisler.log` | `DOOR`, `STATS`, `RFID`, `KART` | Erişim ve kart olayları |
| `web.log` | `WEB`, `AUTH`, `API` | Web girişleri ve API çağrıları |
| `guncelleme.log` | `SYNC`, `CONFIG`, `UPDATE`, `SYSTEM` | Yapılandırma ve senkronizasyon değişiklikleri |
| `all.log` | Hepsi | Toplu log |
| `other.log` | Geri kalanlar | Kategorisiz olaylar |

### Proje Yapısı

```
kapi-ng/
├── server.js           # Node.js sunucu (API + seri iletişim)
├── public/
│   ├── index.html      # Web panosu (tek sayfa uygulama)
│   ├── script.js       # Ön yüz JavaScript
│   └── style.css       # Stil dosyası
├── src/
│   ├── main.cpp        # Arduino ana döngüsü
│   ├── AuthManager.cpp # RFID kullanıcı depolama ve arama
│   ├── DoorController.cpp # Servo kapı kontrolü
│   ├── DisplayManager.cpp # I²C LCD yönetimi
│   └── Blinker.cpp     # LED blinker yardımcısı
├── include/
│   ├── Config.h        # Pin tanımları ve sabitler
│   ├── AuthManager.h
│   ├── DoorController.h
│   ├── DisplayManager.h
│   └── Blinker.h
├── users.json          # RFID kullanıcı veritabanı
├── web_users.json      # Web arayüzü hesapları
├── config.json         # Çalışma zamanı yapılandırması
├── platformio.ini      # PlatformIO derleme yapılandırması
└── package.json        # Node.js bağımlılıkları
```
