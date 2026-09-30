/** Curated list: update when an Engine is registered in the website. */
export const engines = [
  {
    name: 'Classic',
    id: 'engine-classic',
    status: 'Implemented',
    description: 'The original planner → scoped Character writer pipeline, adapted to all nine Hooks. Plays existing Stories stored in the relational story tables.',
    source: 'https://github.com/Imbustai/imbustai-app/tree/main/packages/engine-classic',
  },
  {
    name: 'Voss',
    id: 'engine-voss',
    status: 'Planned',
    description: 'The Rome 1987 Story’s dedicated Engine. Its mechanics and writing pipeline are being developed; it is not registered in this checkout.',
    source: 'https://github.com/Imbustai/imbustai-app/issues/9',
  },
] as const;
