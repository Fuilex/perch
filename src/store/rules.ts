import { create } from 'zustand';

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Array<{ type: string; value?: string | number }>;
  action: { type: string; dest_template?: string; template?: string; command?: string };
  stop_on_match: boolean;
  order: number;
}

interface PlannedOp {
  id: string;
  source: string;
  destination: string | null;
  action_type: string;
  rule_id: string;
  rule_name: string;
  selected: boolean;
}

interface RulesState {
  rules: Rule[];
  dryRunResults: PlannedOp[];
  editingRule: Rule | null;
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  updateRule: (rule: Rule) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  reorderRules: (ids: string[]) => void;
  setEditingRule: (rule: Rule | null) => void;
  setDryRunResults: (results: PlannedOp[]) => void;
  toggleDryRunItem: (id: string) => void;
}

export const useRulesStore = create<RulesState>((set) => ({
  rules: [],
  dryRunResults: [],
  editingRule: null,
  setRules: (rules) => set({ rules }),
  addRule: (rule) => set((s) => ({ rules: [...s.rules, rule] })),
  updateRule: (rule) => set((s) => ({ rules: s.rules.map((r) => (r.id === rule.id ? rule : r)) })),
  deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
  toggleRule: (id) => set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })),
  reorderRules: (ids) => set((s) => {
    const map = new Map(s.rules.map((r) => [r.id, r]));
    return { rules: ids.map((id, i) => ({ ...map.get(id)!, order: i })) };
  }),
  setEditingRule: (rule) => set({ editingRule: rule }),
  setDryRunResults: (results) => set({ dryRunResults: results }),
  toggleDryRunItem: (id) => set((s) => ({
    dryRunResults: s.dryRunResults.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
  })),
}));
