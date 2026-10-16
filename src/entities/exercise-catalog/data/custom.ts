/**
 * Exercícios próprios: sem foto própria. `sources` são ids do acervo; a 1ª é a foto padrão
 * e as demais viram variantes (trocáveis arrastando). Músculo e equipamento vêm da 1ª.
 */
export type CustomDefinition = { id: string; name: string; sources: string[] }

export const CUSTOM_DEFINITIONS: CustomDefinition[] = [
  {
    id: 'cg:bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    sources: [
      'Split_Squat_with_Dumbbells',
      'One_Leg_Barbell_Squat',
      'Smith_Single-Leg_Split_Squat',
    ],
  },
  {
    id: 'cg:pullup-lat-pulldown',
    name: 'Pull-up / Lat Pulldown',
    sources: ['Pullups', 'Wide-Grip_Lat_Pulldown'],
  },
  {
    id: 'cg:reverse-fly',
    name: 'Reverse Fly',
    sources: ['Reverse_Machine_Flyes', 'Reverse_Flyes'],
  },
  {
    id: 'cg:cable-lateral-raise',
    name: 'Cable Lateral Raise',
    sources: ['Standing_Low-Pulley_Deltoid_Raise', 'Cable_Seated_Lateral_Raise'],
  },
  {
    id: 'cg:chest-supported-row',
    name: 'Chest-Supported Row',
    sources: ['Dumbbell_Incline_Row', 'Lying_T-Bar_Row'],
  },
  {
    id: 'cg:machine-lateral-raise',
    name: 'Machine Lateral Raise',
    sources: ['Seated_Side_Lateral_Raise', 'Side_Lateral_Raise'],
  },
  {
    id: 'cg:cable-serratus',
    name: 'Cable Serratus',
    sources: ['Straight-Arm_Pulldown', 'Rope_Straight-Arm_Pulldown'],
  },
]
