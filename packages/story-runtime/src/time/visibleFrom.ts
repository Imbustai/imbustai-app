// Real-world reveal delay. Ported pattern from apps/tryout-01 (read-only
// reference): random delay within the configured window, delivery clamped to
// waking hours (08:00–23:00 local), wrapping to the next morning.

export interface VisibleFromConfig {
  enabled: boolean;
  min_minutes: number;
  max_minutes: number;
}

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 23;

export function computeVisibleFrom(
  config: VisibleFromConfig | undefined,
  now: Date = new Date(),
  rng: () => number = Math.random,
): string | null {
  if (!config?.enabled) return null;

  const min = Math.max(0, config.min_minutes);
  const max = Math.max(min, config.max_minutes);
  const delayMinutes = min + Math.floor(rng() * (max - min + 1));

  const target = new Date(now.getTime() + delayMinutes * 60_000);

  if (target.getHours() >= DAY_END_HOUR) {
    // Past bedtime → next day at 08:00 plus the spillover minutes.
    const spillMinutes = (target.getHours() - DAY_END_HOUR) * 60 + target.getMinutes();
    target.setDate(target.getDate() + 1);
    target.setHours(DAY_START_HOUR, Math.min(spillMinutes, 59), 0, 0);
  } else if (target.getHours() < DAY_START_HOUR) {
    target.setHours(DAY_START_HOUR, target.getMinutes(), 0, 0);
  }

  return target.toISOString();
}
