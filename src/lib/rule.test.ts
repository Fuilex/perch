import { describe, expect, it } from 'vitest';
import {
  changeActionKind,
  needsTemplate,
  newCondition,
  newRule,
  ruleProblem,
  splitAge,
  splitSize,
  toBytes,
  toSeconds,
  withTemplate,
} from './rule';
import type { Rule } from './ipc';

const base = (patch: Partial<Rule> = {}): Rule => ({ ...newRule(0), name: 'Test', ...patch });

describe('newRule', () => {
  it('starts enabled, with a Move action and the given order', () => {
    const rule = newRule(3);
    expect(rule.enabled).toBe(true);
    expect(rule.order).toBe(3);
    expect(rule.action).toEqual({ type: 'Move', dest_template: '' });
    expect(rule.conditions).toEqual([]);
  });
});

describe('newCondition', () => {
  it('gives text conditions an empty value', () => {
    expect(newCondition('Extension')).toEqual({ type: 'Extension', value: '' });
  });

  it('gives numeric conditions a usable starting point', () => {
    expect(newCondition('SizeGreater')).toEqual({ type: 'SizeGreater', value: 10 * 1024 ** 2 });
    expect(newCondition('OlderThan')).toEqual({ type: 'OlderThan', value: 30 * 86400 });
  });

  it('carries no value for Duplicate', () => {
    expect(newCondition('Duplicate')).toEqual({ type: 'Duplicate' });
  });
});

describe('changeActionKind', () => {
  it('carries the destination across compatible kinds', () => {
    const action = changeActionKind({ type: 'Move', dest_template: '~/Docs' }, 'Copy');
    expect(action).toEqual({ type: 'Copy', dest_template: '~/Docs' });
  });

  it('carries a destination into a rename template', () => {
    const action = changeActionKind({ type: 'Move', dest_template: '{name}.{ext}' }, 'Rename');
    expect(action).toEqual({ type: 'Rename', template: '{name}.{ext}' });
  });

  it('drops the template for kinds that have none', () => {
    expect(changeActionKind({ type: 'Move', dest_template: '~/Docs' }, 'Trash')).toEqual({
      type: 'Trash',
    });
  });

  it('leaves Trash with nothing to carry', () => {
    expect(changeActionKind({ type: 'Trash' }, 'Move')).toEqual({ type: 'Move', dest_template: '' });
  });
});

describe('withTemplate', () => {
  it('writes to whichever field the kind uses', () => {
    expect(withTemplate({ type: 'Move', dest_template: '' }, '~/a')).toEqual({
      type: 'Move',
      dest_template: '~/a',
    });
    expect(withTemplate({ type: 'Rename', template: '' }, '{name}')).toEqual({
      type: 'Rename',
      template: '{name}',
    });
  });

  it('leaves actions without a template untouched', () => {
    expect(withTemplate({ type: 'Trash' }, 'ignored')).toEqual({ type: 'Trash' });
  });
});

describe('needsTemplate', () => {
  it('knows which kinds carry one', () => {
    expect(needsTemplate('Move')).toBe(true);
    expect(needsTemplate('Rename')).toBe(true);
    expect(needsTemplate('Trash')).toBe(false);
    expect(needsTemplate('RunCommand')).toBe(false);
  });
});

describe('size conversion', () => {
  it('round-trips through the largest clean unit', () => {
    expect(splitSize(10 * 1024 ** 2)).toEqual({ amount: 10, unit: 'MB' });
    expect(splitSize(2 * 1024 ** 3)).toEqual({ amount: 2, unit: 'GB' });
  });

  it('falls back to bytes rather than rounding a size it cannot divide', () => {
    expect(splitSize(1536)).toEqual({ amount: 1536, unit: 'B' });
    // Round-tripping must not change the stored value.
    const { amount, unit } = splitSize(1536);
    expect(toBytes(amount, unit)).toBe(1536);
  });

  it('converts back to bytes', () => {
    expect(toBytes(10, 'MB')).toBe(10 * 1024 ** 2);
    expect(toBytes(1, 'GB')).toBe(1024 ** 3);
    expect(toBytes(512, 'B')).toBe(512);
  });

  it('never returns a negative size', () => {
    expect(toBytes(-5, 'MB')).toBe(0);
  });
});

describe('age conversion', () => {
  it('picks the largest clean unit', () => {
    expect(splitAge(30 * 86400)).toEqual({ amount: 30, unit: 'days' });
    expect(splitAge(14 * 86400)).toEqual({ amount: 2, unit: 'weeks' });
    expect(splitAge(90 * 60)).toEqual({ amount: 90, unit: 'minutes' });
  });

  it('converts back to seconds', () => {
    expect(toSeconds(30, 'days')).toBe(30 * 86400);
    expect(toSeconds(2, 'hours')).toBe(7200);
  });
});

describe('ruleProblem', () => {
  it('accepts a complete rule', () => {
    expect(
      ruleProblem(
        base({
          conditions: [{ type: 'Extension', value: 'pdf' }],
          action: { type: 'Move', dest_template: '~/Documents' },
        }),
      ),
    ).toBeNull();
  });

  it('requires a name', () => {
    expect(ruleProblem(base({ name: '  ' }))).toBe('editor.needName');
  });

  it('requires a destination for Move', () => {
    expect(ruleProblem(base({ action: { type: 'Move', dest_template: '' } }))).toBe(
      'editor.needDestination',
    );
  });

  it('requires a template for Rename', () => {
    expect(ruleProblem(base({ action: { type: 'Rename', template: '' } }))).toBe(
      'editor.needTemplate',
    );
  });

  it('needs nothing extra for Trash', () => {
    expect(ruleProblem(base({ action: { type: 'Trash' } }))).toBeNull();
  });

  it('rejects an empty condition value', () => {
    expect(
      ruleProblem(
        base({
          conditions: [{ type: 'Extension', value: '' }],
          action: { type: 'Trash' },
        }),
      ),
    ).toBe('editor.emptyCondition');
  });

  it('rejects an unparseable regex', () => {
    expect(
      ruleProblem(
        base({
          conditions: [{ type: 'Regex', value: '([' }],
          action: { type: 'Trash' },
        }),
      ),
    ).toBe('editor.badRegex');
  });

  it('allows a rule with no conditions — it matches everything on purpose', () => {
    expect(ruleProblem(base({ conditions: [], action: { type: 'Trash' } }))).toBeNull();
  });
});
