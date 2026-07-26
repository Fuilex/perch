import { describe, expect, it } from 'vitest';
import {
  basename,
  conditionLabel,
  describeCondition,
  describeRule,
  ellipsisPath,
  formatBytes,
  formatClock,
  formatDuration,
  parentOf,
  relativeTime,
  templateOf,
} from './format';
import { translate, type Translate } from './i18n';
import type { Rule } from './ipc';

/** The real dictionaries, so these also cover the translation wiring. */
const en: Translate = (key, params) => translate('en', key, params);
const ru: Translate = (key, params) => translate('ru', key, params);

describe('basename', () => {
  it('handles both separators', () => {
    expect(basename('C:\\Users\\me\\report.pdf')).toBe('report.pdf');
    expect(basename('/home/me/report.pdf')).toBe('report.pdf');
  });

  it('ignores a trailing separator', () => {
    expect(basename('C:\\Users\\me\\Downloads\\')).toBe('Downloads');
  });

  it('returns the input when there is no separator', () => {
    expect(basename('report.pdf')).toBe('report.pdf');
  });
});

describe('parentOf', () => {
  it('drops the last segment', () => {
    expect(parentOf('C:\\Users\\me\\report.pdf')).toBe('C:\\Users\\me');
  });

  it('is empty when there is no parent', () => {
    expect(parentOf('report.pdf')).toBe('');
  });
});

describe('ellipsisPath', () => {
  it('leaves short paths alone', () => {
    expect(ellipsisPath('/a/b.txt', 20)).toBe('/a/b.txt');
  });

  it('keeps the end of a long path', () => {
    const result = ellipsisPath('/very/long/path/to/some/file.txt', 12);
    expect(result).toHaveLength(12);
    expect(result.endsWith('file.txt')).toBe(true);
  });
});

describe('formatBytes', () => {
  it('scales to the right unit', () => {
    expect(formatBytes(0, en)).toBe('0 B');
    expect(formatBytes(512, en)).toBe('512 B');
    expect(formatBytes(1024, en)).toBe('1 KB');
    expect(formatBytes(1536, en)).toBe('1.5 KB');
    expect(formatBytes(10 * 1024 ** 2, en)).toBe('10 MB');
    expect(formatBytes(1024 ** 3, en)).toBe('1 GB');
  });

  it('uses the Russian units', () => {
    expect(formatBytes(10 * 1024 ** 2, ru)).toBe('10 МБ');
    expect(formatBytes(512, ru)).toBe('512 Б');
  });

  it('does not go past the largest unit it knows', () => {
    expect(formatBytes(1024 ** 6, en)).toContain('GB');
  });
});

describe('formatDuration', () => {
  it('picks the largest whole unit', () => {
    expect(formatDuration(30, en)).toBe('30 seconds');
    expect(formatDuration(3600, en)).toBe('1 hour');
    expect(formatDuration(30 * 86400, en)).toBe('30 days');
  });

  it('uses the singular form for one', () => {
    expect(formatDuration(60, en)).toBe('1 minute');
    expect(formatDuration(86400, ru)).toBe('1 день');
  });

  it('uses the Russian plural form', () => {
    expect(formatDuration(30 * 86400, ru)).toBe('30 дней');
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-07-26T12:00:00Z');

  it('describes recent moments loosely', () => {
    expect(relativeTime('2026-07-26T11:59:50Z', en, now)).toBe('just now');
    expect(relativeTime('2026-07-26T11:50:00Z', en, now)).toBe('10 min ago');
    expect(relativeTime('2026-07-26T09:00:00Z', en, now)).toBe('3 hours ago');
    expect(relativeTime('2026-07-24T12:00:00Z', en, now)).toBe('2 days ago');
  });

  it('translates', () => {
    expect(relativeTime('2026-07-26T11:59:50Z', ru, now)).toBe('только что');
    expect(relativeTime('2026-07-24T12:00:00Z', ru, now)).toBe('2 дн назад');
  });

  it('survives a bad timestamp', () => {
    expect(relativeTime('not a date', en, now)).toBe('—');
  });
});

describe('formatClock', () => {
  it('pads to two digits', () => {
    expect(formatClock(8, 0)).toBe('08:00');
    expect(formatClock(22, 30)).toBe('22:30');
  });
});

describe('conditionLabel', () => {
  it('comes out of the dictionary in both languages', () => {
    expect(conditionLabel('OlderThan', en)).toBe('Older than');
    expect(conditionLabel('OlderThan', ru)).toBe('Старше чем');
  });
});

describe('describeCondition', () => {
  it('renders each kind in plain language', () => {
    expect(describeCondition({ type: 'Extension', value: 'pdf' }, en)).toBe('extension is pdf');
    expect(describeCondition({ type: 'SizeGreater', value: 10 * 1024 ** 2 }, en)).toBe(
      'larger than 10 MB',
    );
    expect(describeCondition({ type: 'OlderThan', value: 30 * 86400 }, en)).toBe(
      'older than 30 days',
    );
    expect(describeCondition({ type: 'Duplicate' }, en)).toBe('is a duplicate');
    expect(describeCondition({ type: 'MaxDepth', value: 1 }, en)).toBe('at most 1 folders deep');
  });

  it('renders in Russian too, units included', () => {
    expect(describeCondition({ type: 'Extension', value: 'pdf' }, ru)).toBe('расширение pdf');
    expect(describeCondition({ type: 'OlderThan', value: 30 * 86400 }, ru)).toBe('старше 30 дней');
  });

  it('marks an empty value rather than rendering nothing', () => {
    expect(describeCondition({ type: 'Extension', value: '' }, en)).toBe('extension is …');
  });
});

describe('describeRule', () => {
  const rule: Rule = {
    id: 'a',
    name: 'PDFs',
    enabled: true,
    conditions: [{ type: 'Extension', value: 'pdf' }],
    action: { type: 'Move', dest_template: '~/Documents' },
    stop_on_match: true,
    order: 0,
  };

  it('joins several conditions', () => {
    expect(
      describeRule(
        {
          ...rule,
          conditions: [
            { type: 'Extension', value: 'pdf' },
            { type: 'OlderThan', value: 86400 },
          ],
        },
        en,
      ),
    ).toBe('extension is pdf, older than 1 day → move to ~/Documents');
  });

  it('says so when a rule matches everything', () => {
    expect(describeRule({ ...rule, conditions: [] }, en)).toBe('any file → move to ~/Documents');
    expect(describeRule({ ...rule, conditions: [] }, ru)).toBe(
      'любой файл → переместить в ~/Documents',
    );
  });
});

describe('templateOf', () => {
  it('finds the template wherever the action keeps it', () => {
    expect(templateOf({ type: 'Move', dest_template: '~/a' })).toBe('~/a');
    expect(templateOf({ type: 'Rename', template: '{name}' })).toBe('{name}');
    expect(templateOf({ type: 'Trash' })).toBeNull();
  });
});
