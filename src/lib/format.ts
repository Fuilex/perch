/**
 * Display helpers.
 *
 * Anything that produces text a person reads takes a `Translate`, so the same
 * value renders in whichever language is configured. Pure functions only —
 * see format.test.ts.
 */

import type { Action, Condition, ConditionKind, Rule } from './ipc';
import type { Translate, TranslationKey } from './i18n';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Last segment of a path, tolerating either separator. */
export function basename(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, '');
  const at = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return at === -1 ? trimmed : trimmed.slice(at + 1);
}

/** Everything before the last segment. Empty when there is no parent. */
export function parentOf(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, '');
  const at = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return at === -1 ? '' : trimmed.slice(0, at);
}

/** Shortens a long path from the left so the filename stays readable. */
export function ellipsisPath(path: string, max = 52): string {
  if (path.length <= max) return path;
  return `…${path.slice(-(max - 1))}`;
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

const SIZE_KEYS: TranslationKey[] = ['unit.B', 'unit.KB', 'unit.MB', 'unit.GB'];

export function formatBytes(bytes: number, t: Translate): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${t('unit.B')}`;
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_KEYS.length - 1);
  const value = bytes / 1024 ** power;
  const rounded = power === 0 ? value : Number(value.toFixed(value < 10 ? 1 : 0));
  return `${rounded} ${t(SIZE_KEYS[power]!)}`;
}

/**
 * Seconds as the largest whole-ish unit. Russian needs a different plural form
 * from English, so both come out of the dictionary rather than from an "s".
 */
export function formatDuration(seconds: number, t: Translate): string {
  const scale: Array<[number, TranslationKey, TranslationKey]> = [
    [86400, 'unit.day', 'unit.days'],
    [3600, 'unit.hour', 'unit.hours'],
    [60, 'unit.minute', 'unit.minutes'],
    [1, 'unit.second', 'unit.seconds'],
  ];

  for (const [size, one, many] of scale) {
    if (seconds >= size) {
      const count = Math.round(seconds / size);
      return `${count} ${t(count === 1 ? one : many)}`;
    }
  }
  return `0 ${t('unit.seconds')}`;
}

export function relativeTime(iso: string, t: Translate, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return t('time.unknown');

  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 45) return t('time.justNow');
  if (seconds < 5400) {
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? t('time.minutesAgo', { count: minutes }) : t('time.hourAgo');
  }
  if (seconds < 86400) return t('time.hoursAgo', { count: Math.round(seconds / 3600) });
  if (seconds < 604800) return t('time.daysAgo', { count: Math.round(seconds / 86400) });
  return then.toLocaleDateString();
}

export function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** Human label for a condition kind, used in the picker and in summaries. */
export function conditionLabel(kind: ConditionKind, t: Translate): string {
  return t(`cond.${kind}` as TranslationKey);
}

export function describeCondition(condition: Condition, t: Translate): string {
  const key = `cond.desc.${condition.type}` as TranslationKey;

  switch (condition.type) {
    case 'Extension':
    case 'Glob':
    case 'Regex':
    case 'MimeType':
      return t(key, { value: condition.value || '…' });
    case 'SizeGreater':
    case 'SizeSmaller':
      return t(key, { value: formatBytes(condition.value, t) });
    case 'OlderThan':
    case 'NewerThan':
      return t(key, { value: formatDuration(condition.value, t) });
    case 'MaxDepth':
      return t(key, { count: condition.value });
    case 'Duplicate':
      return t(key);
  }
}

export function describeAction(action: Action, t: Translate): string {
  const key = `action.desc.${action.type}` as TranslationKey;

  switch (action.type) {
    case 'Move':
    case 'Copy':
    case 'Unzip':
      return t(key, { value: action.dest_template || '…' });
    case 'Rename':
      return t(key, { value: action.template || '…' });
    case 'RunCommand':
      return t(key, { value: action.command || '…' });
    case 'Trash':
      return t(key);
  }
}

/** One-line "if … then …" summary for a rule card. */
export function describeRule(rule: Rule, t: Translate): string {
  const when =
    rule.conditions.length === 0
      ? t('cond.anyFile')
      : rule.conditions.map((condition) => describeCondition(condition, t)).join(', ');
  return `${when} → ${describeAction(rule.action, t)}`;
}

/** The destination/name template a given action carries, if any. */
export function templateOf(action: Action): string | null {
  if (action.type === 'Move' || action.type === 'Copy' || action.type === 'Unzip') {
    return action.dest_template;
  }
  if (action.type === 'Rename') return action.template;
  return null;
}

/** Template variables `template.rs` knows how to expand. */
export const TEMPLATE_VARIABLES = [
  '{name}',
  '{ext}',
  '{year}',
  '{month}',
  '{day}',
  '{hour}',
  '{minute}',
  '{counter}',
  '{hash8}',
  '{source_folder}',
] as const;
