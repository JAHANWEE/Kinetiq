/**
 * settingsStore.ts
 * Persists user preferences in-memory with pub/sub.
 * Settings that affect sensor behaviour are exported as getters
 * so useDriveSession can read them without coupling.
 */

export type Sensitivity = 'low' | 'medium' | 'high';

export type Settings = {
  hapticFeedback: boolean;
  sensitivity: Sensitivity;
  /** Whether to display a real-time alert banner on the drive screen */
  realtimeAlerts: boolean;
};

// Sensitivity multipliers applied to detection thresholds.
// Higher sensitivity = easier to trigger events (stricter driving).
export const SENSITIVITY_MULTIPLIERS: Record<Sensitivity, number> = {
  low: 1.4,    // thresholds * 1.4 → harder to trigger
  medium: 1.0, // default
  high: 0.7,   // thresholds * 0.7 → easier to trigger
};

const DEFAULT_SETTINGS: Settings = {
  hapticFeedback: true,
  sensitivity: 'medium',
  realtimeAlerts: true,
};

let current: Settings = { ...DEFAULT_SETTINGS };
const listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((l) => l());
}

export const settingsStore = {
  get(): Settings {
    return { ...current };
  },

  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    current = { ...current, [key]: value };
    notify();
  },

  reset() {
    current = { ...DEFAULT_SETTINGS };
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      const i = listeners.indexOf(listener);
      if (i !== -1) listeners.splice(i, 1);
    };
  },

  /** Convenience — threshold multiplier for current sensitivity */
  getThresholdMultiplier(): number {
    return SENSITIVITY_MULTIPLIERS[current.sensitivity];
  },
};
