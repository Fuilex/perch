/**
 * Rule construction and the unit juggling the editor needs.
 *
 * The backend stores sizes in bytes and ages in seconds. People think in MB and
 * days, so conversions live here — pure and tested in rule.test.ts.
 */

import type { Action, ActionKind, Condition, ConditionKind, Rule } from './ipc';
import type { TranslationKey } from './i18n';

/** A blank rule, ready for the editor. */
export function newRule(order: number): Rule {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    conditions: [],
    action: { type: 'Move', dest_template: '' },
    stop_on_match: true,
    order,
  };
}

/** A newly added condition of the given kind, with a sensible starting value. */
export function newCondition(kind: ConditionKind): Condition {
  switch (kind) {
    case 'Extension':
      return { type: 'Extension', value: '' };
    case 'Glob':
      return { type: 'Glob', value: '' };
    case 'Regex':
      return { type: 'Regex', value: '' };
    case 'MimeType':
      return { type: 'MimeType', value: '' };
    case 'SizeGreater':
      return { type: 'SizeGreater', value: 10 * 1024 * 1024 };
    case 'SizeSmaller':
      return { type: 'SizeSmaller', value: 1024 * 1024 };
    case 'OlderThan':
      return { type: 'OlderThan', value: 30 * 86400 };
    case 'NewerThan':
      return { type: 'NewerThan', value: 7 * 86400 };
    case 'MaxDepth':
      return { type: 'MaxDepth', value: 1 };
    case 'Duplicate':
      return { type: 'Duplicate' };
  }
}

/** Switches an action's kind, carrying the template across where it makes sense. */
export function changeActionKind(action: Action, kind: ActionKind): Action {
  const carried =
    action.type === 'Move' || action.type === 'Copy' || action.type === 'Unzip'
      ? action.dest_template
      : action.type === 'Rename'
        ? action.template
        : '';

  switch (kind) {
    case 'Move':
      return { type: 'Move', dest_template: carried };
    case 'Copy':
      return { type: 'Copy', dest_template: carried };
    case 'Unzip':
      return { type: 'Unzip', dest_template: carried };
    case 'Rename':
      return { type: 'Rename', template: carried };
    case 'RunCommand':
      return { type: 'RunCommand', command: '' };
    case 'Trash':
      return { type: 'Trash' };
  }
}

/** Replaces an action's template, whichever field the kind keeps it in. */
export function withTemplate(action: Action, template: string): Action {
  switch (action.type) {
    case 'Move':
    case 'Copy':
    case 'Unzip':
      return { ...action, dest_template: template };
    case 'Rename':
      return { ...action, template };
    default:
      return action;
  }
}

/** True when the kind carries a destination or name template. */
export function needsTemplate(kind: ActionKind): boolean {
  return kind === 'Move' || kind === 'Copy' || kind === 'Unzip' || kind === 'Rename';
}

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const SIZE_UNITS = [
  { label: 'B', bytes: 1 },
  { label: 'KB', bytes: 1024 },
  { label: 'MB', bytes: 1024 ** 2 },
  { label: 'GB', bytes: 1024 ** 3 },
] as const;

export type SizeUnit = (typeof SIZE_UNITS)[number]['label'];

/**
 * Splits a byte count into the largest unit that divides it cleanly.
 *
 * Bytes are in the list so there is always an exact answer: a size like 1536
 * that no larger unit divides evenly would otherwise have to be rounded, and
 * the editor would silently rewrite the rule on the next keystroke.
 */
export function splitSize(bytes: number): { amount: number; unit: SizeUnit } {
  for (const { label, bytes: size } of [...SIZE_UNITS].reverse()) {
    if (bytes >= size && bytes % size === 0) {
      return { amount: bytes / size, unit: label };
    }
  }
  return { amount: Math.max(0, Math.round(bytes)), unit: 'B' };
}

export function toBytes(amount: number, unit: SizeUnit): number {
  const found = SIZE_UNITS.find((u) => u.label === unit);
  return Math.max(0, Math.round(amount * (found?.bytes ?? 1)));
}

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

export const AGE_UNITS = [
  { label: 'minutes', seconds: 60 },
  { label: 'hours', seconds: 3600 },
  { label: 'days', seconds: 86400 },
  { label: 'weeks', seconds: 604800 },
] as const;

export type AgeUnit = (typeof AGE_UNITS)[number]['label'];

export function splitAge(seconds: number): { amount: number; unit: AgeUnit } {
  for (const { label, seconds: size } of [...AGE_UNITS].reverse()) {
    if (seconds >= size && seconds % size === 0) {
      return { amount: seconds / size, unit: label };
    }
  }
  return { amount: Math.max(1, Math.round(seconds / 60)), unit: 'minutes' };
}

export function toSeconds(amount: number, unit: AgeUnit): number {
  const found = AGE_UNITS.find((u) => u.label === unit);
  return Math.max(0, Math.round(amount * (found?.seconds ?? 60)));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Why a rule can't be saved yet, as a translation key, or null when it's fine.
 * Deliberately permissive: a rule with no conditions is legal and matches
 * everything, which is a real (if bold) thing to want.
 */
export function ruleProblem(rule: Rule): TranslationKey | null {
  if (!rule.name.trim()) return 'editor.needName';

  for (const condition of rule.conditions) {
    if ('value' in condition && typeof condition.value === 'string' && !condition.value.trim()) {
      return 'editor.emptyCondition';
    }
    if (condition.type === 'Regex') {
      try {
        new RegExp(condition.value);
      } catch {
        return 'editor.badRegex';
      }
    }
  }

  switch (rule.action.type) {
    case 'Move':
    case 'Copy':
    case 'Unzip':
      if (!rule.action.dest_template.trim()) return 'editor.needDestination';
      break;
    case 'Rename':
      if (!rule.action.template.trim()) return 'editor.needTemplate';
      break;
    case 'RunCommand':
      if (!rule.action.command.trim()) return 'editor.needCommand';
      break;
    case 'Trash':
      break;
  }

  return null;
}
