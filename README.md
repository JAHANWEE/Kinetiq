# Kinetiq

A React Native driving safety app that uses your phone's onboard sensors to score your driving in real time. Built with Expo SDK 56.

Demo video: https://x.com/jaaaani404/status/2063932950937555147?s=20V

## What it does

Kinetiq monitors every drive using the accelerometer and gyroscope. It detects bad driving events as they happen, deducts points from a 100-point safety score, and presents a summary when the drive ends. All data stays on-device — no backend, no accounts.

---

## Screens

| Screen | What you see |
|---|---|
| **Home** | Your latest safety score on a full-width arc gauge, lifetime stats, and a list of recent drives |
| **Drive** | Live session — city night GIF header, real-time score, sensor magnitude bars, scrollable event feed, pinned End Drive button |
| **History** | Every recorded session with date, duration, event count, and score |
| **Insights** | 7-day bar chart, all-time average ring, event breakdown with inline progress bars, and a personalised tip |
| **Settings** | Detection sensitivity picker, haptic / alert toggles, data management, and threshold reference |

Both **dark** and **light** themes are supported and switch automatically with the system setting.

---

## Event detection

The session starts at **100 points**. Each detected event deducts points. A 2-second cooldown per event type prevents the same incident from firing twice.

| Event | Trigger | Deduction |
|---|---|---|
| Harsh Brake | Accel magnitude delta > 1.8 g, negative Y axis | −5 |
| Harsh Acceleration | Accel magnitude delta > 1.8 g | −5 |
| Sharp Turn | Gyro Z rotation rate > 1.2 rad/s | −3 |
| Aggressive Steering | Gyro total magnitude > 2.0 rad/s | −3 |
| Phone Handling | Accel > 2.5 m/s² **and** gyro > 1.5 rad/s simultaneously | −10 |

Thresholds are multiplied by a sensitivity factor set in Settings:

| Sensitivity | Multiplier | Effect |
|---|---|---|
| Low | ×1.4 | Harder to trigger — more forgiving |
| Medium | ×1.0 | Default |
| High | ×0.7 | Easier to trigger — stricter |

Sensors run at **10 Hz** (100 ms interval) — enough for accurate event detection while keeping battery usage low.

---

## Tech stack

| | |
|---|---|
| Framework | Expo ~56.0.0 |
| Navigation | Expo Router ~56.2.8 |
| Language | TypeScript ~6.0.3 |
| UI | React Native 0.85.3 |
| Sensors | expo-sensors ~56.0.5 |
| Haptics | expo-haptics ~56.0.3 |
| GIF rendering | expo-image ~56.0.10 |
| Gradient | expo-linear-gradient ~56.0.4 |
| Charts | react-native-svg 15.15.4 |
| Icons | @expo/vector-icons ^15.1.0 |

---

## Project structure

```
app/
  _layout.tsx              Root stack + StatusBar (theme-aware)
  (tabs)/
    _layout.tsx            Tab bar (Home / Drive / History / Insights / Settings)
    index.tsx              Home screen
    drive.tsx              Drive screen (Idle → Active → Summary)
    history.tsx            History screen
    insights.tsx           Insights screen
    settings.tsx           Settings screen

hooks/
  useDriveSession.ts       Core sensor loop, event detection, scoring
  useTheme.ts              Returns Dark or Light palette based on system scheme

store/
  driveStore.ts            In-memory session store with pub/sub
  settingsStore.ts         User preferences with pub/sub

constants/
  Colors.ts                Dark + Light ThemeColors + legacy shim
  Typography.ts            Type scale
  Spacing.ts               Spacing scale + BorderRadius tokens

assets/
  city_car.gif             Night city drive GIF (400 × 143 px)
  icon.png                 App icon
  splash-icon.png          Splash screen
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + simulator, or Expo Go on a physical device
- Android: Android Studio emulator, or Expo Go on a physical device

### Install

```bash
git clone <repo-url>
cd Kinetiq
npm install
```

### Run

```bash
npm start          # opens Expo dev tools
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser (sensors unavailable on web)
```

Scan the QR code with [Expo Go](https://expo.dev/client) to run on a physical device. Sensor data only works on a real device — simulators return zeroes.

---

## Design system

**Color palette** — two themes, one accent:

- Dark background: `#0C0C0C` with `#181818` cards
- Light background: `#F5F7FA` with `#FFFFFF` cards
- Accent: pastel blue `#7DD3FC` (dark) / `#38BDF8` (light)
- Semantic: rose for danger, amber for warnings — both desaturated

**Typography** — named scale from `displayScore` (64px) down to `caption` (12px), all defined in `constants/Typography.ts`.

**Spacing** — 4-point base grid (`xs` 4 → `xxl` 56), border radii from `xs` 6 to `xl` 30, in `constants/Spacing.ts`.

---

## Detection thresholds — rationale

Accelerometer values are in **g-force** (1 g ≈ 9.8 m/s²). A typical comfortable brake registers ~0.3–0.5 g. Emergency braking reaches 0.8–1.0 g. The 1.8 g threshold (at medium sensitivity) is set well above normal driving to avoid false positives from road bumps.

Gyroscope values are in **rad/s**. Normal lane changes produce ~0.3–0.5 rad/s. A sharp turn or aggressive lane change reaches 1.0–1.5 rad/s. Thresholds are set accordingly.

Phone handling detection combines both sensors — sudden large acceleration **and** rotation together indicates the phone is being picked up, not just a road vibration.

---

## Assumptions

- **Phone placement** — the app assumes the phone is mounted on the dashboard or in a holder, lying roughly flat with the Y axis pointing toward the front of the car. Braking registers as a negative Y spike on the accelerometer; acceleration as positive. Detection degrades if the phone is in a pocket or bag.
- **Driving speed** — thresholds are calibrated for normal road driving (30–100 km/h). The same physical manoeuvre at very low speed (parking) may not exceed thresholds, and off-road or track driving may produce frequent false positives.
- **Single driver per session** — the session model is one device, one driver. No multi-user or cloud sync is implemented.
- **Data persistence** — all session data is stored in memory and is lost when the app is fully closed. This is intentional for the assignment scope. A production app would persist to SQLite or a backend.
- **No GPS** — distance is not tracked. The "~km" estimate on the History screen is a rough approximation based on duration (assumes average speed of ~36 km/h = 0.6 km/min).
- **DeviceMotion availability** — `DeviceMotion` is available on iOS and Android physical devices. It is not available in the Expo Go web preview or on simulators, where it returns null values. The app handles this gracefully by checking for null before applying thresholds.
- **Cooldown period** — the 2-second cooldown per event type is intentional. It prevents a single braking event from registering multiple times as the accelerometer oscillates around the threshold. It means two genuinely distinct events within 2 seconds of the same type are counted as one.
- **Sensitivity default** — medium sensitivity (multiplier ×1.0) is the default and is the reference point for all documented threshold values.

---

## License

MIT
