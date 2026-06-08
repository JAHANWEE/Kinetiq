# Kinetiq

A mobile app for tracking and improving driving behavior. Kinetiq monitors your trips in real time, scores your driving, and surfaces actionable insights to help you become a safer driver.


---

## Features

- **Dashboard** — your current safety score, recent drives, and lifetime stats at a glance
- **Live Drive** — real-time session tracking with a live score, elapsed timer, sensor status, and a feed of driving events (harsh brakes, sharp turns, smooth segments)
- **History** — a full log of past trips with per-drive scores, distance, and duration
- **Insights** — weekly score trends, daily bar chart, behavior breakdown (smooth driving, hard braking, sharp turns, phone use), and personalized tips
- **Settings** — configure speed sensitivity, real-time alerts, haptic feedback, GPS accuracy, data sync, and app preferences

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Expo | ~56.0.0 |
| Navigation | Expo Router | ~56.2.8 |
| UI | React Native | 0.85.3 |
| Icons | @expo/vector-icons (MaterialIcons) | ^15.1.0 |
| Charts/SVG | react-native-svg | 15.15.4 |
| Language | TypeScript | ~6.0.3 |

---

## Project Structure

```
Kinetiq/
├── app/
│   ├── _layout.tsx          # Root layout (Stack navigator + StatusBar)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar layout with 5 tabs
│       ├── index.tsx        # Home / Dashboard screen
│       ├── drive.tsx        # Live drive session screen
│       ├── history.tsx      # Trip history screen
│       ├── insights.tsx     # Analytics & insights screen
│       └── settings.tsx     # App settings screen
├── constants/
│   ├── Colors.ts            # Design token palette (dark theme)
│   ├── Spacing.ts           # Spacing scale and border radius tokens
│   └── Typography.ts        # Text style definitions
├── assets/                  # App icons and splash screen images
├── app.json                 # Expo app configuration
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- For iOS: Xcode and an Apple developer account (or Expo Go on a physical device)
- For Android: Android Studio with an emulator, or Expo Go on a physical device

### Install

```bash
git clone <repo-url>
cd Kinetiq
npm install
```

### Run

```bash
# Start the dev server
npm start

# Open on a specific platform
npm run ios
npm run android
npm run web
```

Scan the QR code with [Expo Go](https://expo.dev/client) to run on a physical device, or press `i` / `a` in the terminal to open an emulator.

---

## Design System

The app uses a dark theme throughout. Design tokens live in `constants/`:

- **Colors** — deep navy backgrounds (`#0A0C18`) with a lime-yellow primary accent (`#D4E157`), semantic colors for success/warning/danger states
- **Spacing** — an 8-point scale (`xs` through `xxl`) plus `containerMargin` and `gutter` helpers
- **Typography** — named text styles (`displayScore`, `headlineLg`, `metricMd`, `bodyMd`, `labelCaps`, etc.) typed as `TextStyle`

---

## License

[MIT](./LICENSE)
