import type { RecurrenceUnitT, RecurringItemInputT } from './schemas.js';

/**
 * Compute every occurrence of a recurring rule strictly between `from` (exclusive)
 * and `to` (inclusive). Used by both the mobile materialiser and the API.
 */
export function occurrencesBetween(
  rule: Pick<
    RecurringItemInputT,
    | 'startDate'
    | 'intervalUnit'
    | 'intervalCount'
    | 'monthDay'
    | 'weekDay'
    | 'endDate'
    | 'remainingCount'
    | 'isPaused'
  >,
  from: Date,
  to: Date,
): Date[] {
  if (rule.isPaused) return [];
  const out: Date[] = [];
  const start = new Date(rule.startDate);
  const end = rule.endDate ? new Date(rule.endDate) : null;
  const hardCap = rule.remainingCount ?? Number.POSITIVE_INFINITY;

  let cursor = start;
  let stepIdx = 0;
  // Skip ahead until we land at-or-after `from`. To stay defensive against
  // unbounded loops with bad data we cap iterations at 10_000.
  for (let i = 0; i < 10_000; i++) {
    if (end && cursor > end) break;
    if (stepIdx >= hardCap) break;
    if (cursor > to) break;
    if (cursor > from) out.push(new Date(cursor));
    cursor = advance(cursor, rule.intervalUnit, rule.intervalCount, rule.monthDay, rule.weekDay);
    stepIdx++;
  }
  return out;
}

export function nextOccurrenceAfter(
  rule: Pick<
    RecurringItemInputT,
    'startDate' | 'intervalUnit' | 'intervalCount' | 'monthDay' | 'weekDay' | 'endDate' | 'isPaused'
  >,
  after: Date,
): Date | null {
  if (rule.isPaused) return null;
  const end = rule.endDate ? new Date(rule.endDate) : null;
  let cursor = new Date(rule.startDate);
  for (let i = 0; i < 10_000; i++) {
    if (end && cursor > end) return null;
    if (cursor > after) return cursor;
    cursor = advance(cursor, rule.intervalUnit, rule.intervalCount, rule.monthDay, rule.weekDay);
  }
  return null;
}

function advance(
  d: Date,
  unit: RecurrenceUnitT,
  count: number,
  monthDay?: number | null,
  weekDay?: number | null,
): Date {
  const next = new Date(d);
  switch (unit) {
    case 'DAY':
      next.setDate(next.getDate() + count);
      return next;
    case 'WEEK': {
      next.setDate(next.getDate() + count * 7);
      if (weekDay != null) {
        const delta = (weekDay - next.getDay() + 7) % 7;
        next.setDate(next.getDate() + delta);
      }
      return next;
    }
    case 'MONTH': {
      const targetDay = monthDay ?? d.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + count);
      const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDay, lastDayOfMonth));
      return next;
    }
    case 'YEAR':
      next.setFullYear(next.getFullYear() + count);
      return next;
  }
}

export function describeRecurrence(
  rule: Pick<RecurringItemInputT, 'intervalUnit' | 'intervalCount' | 'monthDay' | 'weekDay'>,
): string {
  const { intervalUnit, intervalCount, monthDay, weekDay } = rule;
  if (intervalUnit === 'DAY')
    return intervalCount === 1 ? 'Tous les jours' : `Tous les ${intervalCount} jours`;
  if (intervalUnit === 'WEEK') {
    const base = intervalCount === 1 ? 'Toutes les semaines' : `Toutes les ${intervalCount} semaines`;
    if (weekDay == null) return base;
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return `${base}, ${days[weekDay]}`;
  }
  if (intervalUnit === 'MONTH') {
    const base = intervalCount === 1 ? 'Tous les mois' : `Tous les ${intervalCount} mois`;
    return monthDay ? `${base}, le ${monthDay}` : base;
  }
  return intervalCount === 1 ? 'Tous les ans' : `Tous les ${intervalCount} ans`;
}
