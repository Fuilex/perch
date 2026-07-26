/**
 * Ready-made rules.
 *
 * A blank rule editor is the hardest part of a tool like this: you have to guess
 * what a good rule looks like before you have ever seen one. These are the
 * obvious six, offered during onboarding and from the empty Rules screen. Each
 * one opens in the editor rather than being saved silently, so nothing starts
 * moving files behind the user's back.
 *
 * Destinations use `~`, which the backend expands to the home folder, and the
 * folder names are English because that is what the folders on disk are called.
 */

import type { Rule } from './ipc';
import type { TranslationKey } from './i18n';

export interface Preset {
  id: string;
  /** Dictionary keys — `preset.<id>.name` and `.desc`. */
  nameKey: TranslationKey;
  descKey: TranslationKey;
  icon: 'image' | 'document' | 'archive' | 'camera' | 'weight' | 'trash';
  /** Everything but the id and the order, which are assigned on use. */
  build: () => Omit<Rule, 'id' | 'order' | 'name'>;
}

export const PRESETS: Preset[] = [
  {
    id: 'images',
    nameKey: 'preset.images.name',
    descKey: 'preset.images.desc',
    icon: 'image',
    build: () => ({
      enabled: true,
      conditions: [{ type: 'Glob', value: '*.{png,jpg,jpeg,webp,gif,heic}' }],
      action: { type: 'Move', dest_template: '~/Pictures/{year}' },
      stop_on_match: true,
    }),
  },
  {
    id: 'docs',
    nameKey: 'preset.docs.name',
    descKey: 'preset.docs.desc',
    icon: 'document',
    build: () => ({
      enabled: true,
      conditions: [{ type: 'Glob', value: '*.{pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf}' }],
      action: { type: 'Move', dest_template: '~/Documents/{year}' },
      stop_on_match: true,
    }),
  },
  {
    id: 'archives',
    nameKey: 'preset.archives.name',
    descKey: 'preset.archives.desc',
    icon: 'archive',
    build: () => ({
      enabled: true,
      conditions: [{ type: 'Glob', value: '*.{zip,rar,7z,tar,gz}' }],
      action: { type: 'Move', dest_template: '~/Downloads/Archives' },
      stop_on_match: true,
    }),
  },
  {
    id: 'screenshots',
    nameKey: 'preset.screenshots.name',
    descKey: 'preset.screenshots.desc',
    icon: 'camera',
    build: () => ({
      enabled: true,
      conditions: [
        { type: 'Glob', value: 'Screenshot*' },
        { type: 'OlderThan', value: 30 * 86400 },
      ],
      action: { type: 'Move', dest_template: '~/Pictures/Screenshots/{year}-{month}' },
      stop_on_match: true,
    }),
  },
  {
    id: 'big',
    nameKey: 'preset.big.name',
    descKey: 'preset.big.desc',
    icon: 'weight',
    build: () => ({
      enabled: true,
      conditions: [{ type: 'SizeGreater', value: 500 * 1024 ** 2 }],
      action: { type: 'Move', dest_template: '~/Downloads/Large' },
      stop_on_match: false,
    }),
  },
  {
    id: 'installers',
    nameKey: 'preset.installers.name',
    descKey: 'preset.installers.desc',
    icon: 'trash',
    build: () => ({
      enabled: true,
      conditions: [
        { type: 'Glob', value: '*.{exe,msi,dmg,pkg}' },
        { type: 'OlderThan', value: 14 * 86400 },
      ],
      action: { type: 'Trash' },
      stop_on_match: true,
    }),
  },
];

/** A preset turned into a real rule, ready for the editor. */
export function ruleFromPreset(preset: Preset, name: string, order: number): Rule {
  return { id: crypto.randomUUID(), name, order, ...preset.build() };
}
