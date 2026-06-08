/**
 * driveStore.ts
 * In-memory store for completed drive sessions.
 * Uses a simple module-level array + React state subscriptions pattern.
 * No external dependencies — keeps things lean and battery-friendly.
 */

export type DriveEvent = {
  id: string;
  type: 'harshBrake' | 'harshAccel' | 'sharpTurn' | 'phoneHandling' | 'aggressiveSteering';
  label: string;
  pts: number;
  timestamp: number; // ms since session start
};

export type DriveSession = {
  id: string;
  startedAt: number; // unix ms
  durationSec: number;
  score: number;
  rating: string;
  events: DriveEvent[];
};

// Module-level singleton — survives re-renders, lost on hard reload (fine for this assignment)
const sessions: DriveSession[] = [];
const listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((l) => l());
}

export const driveStore = {
  getSessions(): DriveSession[] {
    return [...sessions].reverse(); // newest first
  },

  addSession(session: DriveSession) {
    sessions.push(session);
    notify();
  },

  clearAll() {
    sessions.splice(0, sessions.length);
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      const i = listeners.indexOf(listener);
      if (i !== -1) listeners.splice(i, 1);
    };
  },

  getStats() {
    if (sessions.length === 0) return { totalDrives: 0, avgScore: 0 };
    const avg = Math.round(
      sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length
    );
    return { totalDrives: sessions.length, avgScore: avg };
  },
};
