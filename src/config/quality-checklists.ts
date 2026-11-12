export interface QualityCheckItem {
  id: string;
  label: string;
}

export const QUALITY_CHECKLISTS: Record<number, QualityCheckItem[]> = {
  1: [
    { id: 's01_evidence', label: 'Research brief has concrete evidence.' },
    { id: 's01_fact_sep', label: 'Facts and interpretations are separated.' },
    { id: 's01_angle_ready', label: 'Angle-ready material exists.' },
    { id: 's01_visual', label: 'Visual opportunities are present.' },
    { id: 's01_source_check', label: 'Source/fact-check warnings are included.' },
  ],
  2: [
    { id: 's02_distinct', label: 'Angles are distinct.' },
    { id: 's02_thesis', label: 'Each angle has a thesis.' },
    { id: 's02_wounds', label: 'Emotional wounds are specific.' },
    { id: 's02_visual', label: 'Visual potential is described.' },
    { id: 's02_recommendation', label: 'Final recommendation is decisive.' },
  ],
  3: [
    { id: 's03_critical', label: 'Evaluation is critical, not generic.' },
    { id: 's03_stress', label: 'Top angles are stress-tested.' },
    { id: 's03_clear', label: 'Final recommendation is clear.' },
    { id: 's03_human', label: 'Human decision can be extracted.' },
  ],
  4: [
    { id: 's04_thesis', label: 'Thesis is clear.' },
    { id: 's04_spine', label: 'Argument spine exists.' },
    { id: 's04_midpoint', label: 'Midpoint turn exists.' },
    { id: 's04_counter', label: 'Counterpoint exists.' },
    { id: 's04_evidence', label: 'Evidence map is specific.' },
    { id: 's04_rules', label: 'Execution rules are usable.' },
  ],
  5: [
    { id: 's05_complete', label: 'Script versions are complete.' },
    { id: 's05_differ', label: 'Versions differ meaningfully.' },
    { id: 's05_thesis', label: 'All versions preserve thesis.' },
    { id: 's05_comparison', label: 'Post-generation comparison is useful.' },
  ],
};
