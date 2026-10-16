import type { Config } from './config.types'

/**
 * Semente inicial da Config. Copiada para o storage no 1º launch; depois disso
 * o que vale é o que está salvo (editável pela aba Ajustes).
 * Valores validados em app_arquitetura_v1.md §3.1.
 *
 * Split de 5 dias (seg–sex) + sáb/dom de descanso. `rir` e agrupamento por
 * músculo do plano original não cabem no modelo (`Exercise` = nome/sets/reps);
 * ajuste fino é pela aba Ajustes.
 */
export const CONFIG_SEED: Config = {
  targetCalories: 3150,
  macros: { protein: 150, carbs: 425, fat: 95 },
  weightGoalMinG: 150,
  weightGoalMaxG: 220,
  weightAlertPct: 0.5,

  supplements: [
    { name: 'Creatina', dose: '5g', timing: 'qualquer, todo dia' },
    { name: 'Albumina/Proteína', dose: 'conforme necessário', timing: 'horários difíceis' },
    {
      name: 'Pré-treino',
      dose: '4g beta-alanina + 2g taurina + 6-8g citrulina malato',
      timing: 'antes do treino',
    },
  ],

  trainingSplit: [
    {
      weekday: 1,
      name: 'Ombro + Peito Sup. + Tríceps',
      focus: 'Empurrar',
      exercises: [
        { exerciseId: 'Incline_Dumbbell_Press', sets: 3, reps: '6-10' },
        { exerciseId: 'Smith_Machine_Incline_Bench_Press', sets: 2, reps: '8-12' },
        { exerciseId: 'cg:cable-lateral-raise', sets: 4, reps: '10-20' },
        { exerciseId: 'cg:machine-lateral-raise', sets: 3, reps: '10-20' },
        { exerciseId: 'cg:reverse-fly', sets: 3, reps: '12-20' },
        { exerciseId: 'Cable_Rope_Overhead_Triceps_Extension', sets: 3, reps: '8-15' },
        { exerciseId: 'Triceps_Pushdown_-_Rope_Attachment', sets: 2, reps: '10-15' },
      ],
    },
    {
      weekday: 2,
      name: 'Costas + Bíceps',
      focus: 'Puxar',
      exercises: [
        { exerciseId: 'cg:pullup-lat-pulldown', sets: 3, reps: '6-10' },
        { exerciseId: 'One_Arm_Lat_Pulldown', sets: 3, reps: '8-15' },
        { exerciseId: 'cg:chest-supported-row', sets: 3, reps: '8-12' },
        { exerciseId: 'Seated_Cable_Rows', sets: 2, reps: '10-15' },
        { exerciseId: 'cg:reverse-fly', sets: 2, reps: '12-20' },
        { exerciseId: 'Incline_Dumbbell_Curl', sets: 3, reps: '8-15' },
        { exerciseId: 'Preacher_Curl', sets: 2, reps: '8-15' },
        { exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' },
      ],
    },
    {
      weekday: 3,
      name: 'Pernas — quadríceps',
      focus: 'Pernas + core',
      exercises: [
        { exerciseId: 'Hack_Squat', sets: 3, reps: '6-10' },
        { exerciseId: 'Leg_Press', sets: 3, reps: '8-15' },
        { exerciseId: 'Leg_Extensions', sets: 3, reps: '10-15' },
        { exerciseId: 'Romanian_Deadlift', sets: 2, reps: '6-10' },
        { exerciseId: 'Seated_Leg_Curl', sets: 2, reps: '10-15' },
        { exerciseId: 'Standing_Calf_Raises', sets: 3, reps: '8-15' },
        { exerciseId: 'Seated_Calf_Raise', sets: 2, reps: '10-20' },
        { exerciseId: 'Crunches', sets: 3, reps: '8-15' },
        { exerciseId: 'Hanging_Leg_Raise', sets: 2, reps: '8-15' },
      ],
    },
    {
      weekday: 4,
      name: 'Ombro + Braços',
      focus: 'Ombro + braços',
      exercises: [
        { exerciseId: 'cg:machine-lateral-raise', sets: 4, reps: '10-20' },
        { exerciseId: 'cg:cable-lateral-raise', sets: 3, reps: '12-20' },
        { exerciseId: 'cg:reverse-fly', sets: 2, reps: '12-20' },
        { exerciseId: 'Incline_Dumbbell_Curl', sets: 2, reps: '8-15' },
        { exerciseId: 'Preacher_Curl', sets: 2, reps: '10-15' },
        { exerciseId: 'Hammer_Curls', sets: 2, reps: '10-15' },
        { exerciseId: 'Cable_Rope_Overhead_Triceps_Extension', sets: 3, reps: '8-15' },
        { exerciseId: 'Triceps_Pushdown_-_Rope_Attachment', sets: 3, reps: '8-15' },
        { exerciseId: 'cg:cable-serratus', sets: 2, reps: '10-20' },
      ],
    },
    {
      weekday: 5,
      name: 'Posterior + Glúteo',
      focus: 'Pernas — posterior',
      exercises: [
        { exerciseId: 'Romanian_Deadlift', sets: 3, reps: '6-10' },
        { exerciseId: 'Lying_Leg_Curls', sets: 3, reps: '8-15' },
        { exerciseId: 'Hack_Squat', sets: 2, reps: '8-12' },
        { exerciseId: 'cg:bulgarian-split-squat', sets: 2, reps: '8-12' },
        { exerciseId: 'Leg_Extensions', sets: 2, reps: '10-15' },
        { exerciseId: 'Barbell_Hip_Thrust', sets: 2, reps: '8-12' },
        { exerciseId: 'Standing_Calf_Raises', sets: 3, reps: '8-15' },
        { exerciseId: 'Reverse_Crunch', sets: 2, reps: '8-15' },
      ],
    },
    { weekday: 6, name: 'Descanso', focus: '—', exercises: [] },
    { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
  ],

  meals: [
    {
      name: 'Café da manhã',
      when: 'grab-and-go, ao sair de casa',
      kcal: 500,
      macros: { protein: 25, carbs: 60, fat: 15 },
      items: [
        'A (ovo): 1 ciabatta ~90g + 3 ovos cozidos + 1 fruta média (banana/mamão)',
        'B (whey): 1 ciabatta ~90g + shake 30g whey/albumina + 1 fruta',
      ],
      note: 'Deixe 6-8 ovos cozidos prontos no domingo — resolve a semana.',
    },
    {
      name: 'Almoço',
      when: 'self-service — monte no olho, sem pesar',
      kcal: 900,
      macros: { protein: 45, carbs: 120, fat: 25 },
      items: [
        'Proteína: 200-220g cozido (1 vermelha + 1 frango, ou dobrar a concha)',
        'Arroz: 5-6 colheres de servir cheias (~200g)',
        'Feijão: 2 conchas (~150g)',
        'Salada/legumes: à vontade',
        'Azeite: 1 fio na salada',
      ],
    },
    {
      name: 'Pré/pós-treino',
      when: 'colada ao treino, não em horário fixo',
      kcal: 450,
      macros: { protein: 30, carbs: 70, fat: 8 },
      items: [
        'Pré: 1 banana + 1 fatia de pão + shake de whey (30g)',
        'Pós: shake de whey (30g) + 60-70g carbo rápido (mel, dextrose ou 2 fatias de pão)',
      ],
    },
    {
      name: 'Jantar',
      when: 'em casa',
      kcal: 800,
      macros: { protein: 40, carbs: 100, fat: 25 },
      items: [
        'Carne (preferência vermelha): 180-200g cozido',
        'Arroz: 150-180g cozido',
        'Feijão: 1 concha',
        'Salada: à vontade',
      ],
    },
    {
      name: 'Ceia',
      when: 'antes de dormir',
      kcal: 500,
      macros: { protein: 15, carbs: 75, fat: 20 },
      items: [
        'A: hipercalórico (1 scoop, ~50g pó, conforme rótulo)',
        'B: albumina + aveia (40g) + 1 fruta',
      ],
    },
  ],

  micronotes: [
    {
      topic: 'Fibra',
      detail:
        'Com 425g de carbo/dia a salada "à vontade" precisa ser de verdade — controle glicêmico, histórico de pré-diabetes resolvido.',
    },
    {
      topic: 'Ferro',
      detail: 'Hemoglobina levemente alta — não suplementar, só acompanhar em exame.',
    },
    {
      topic: 'Ômega-3',
      detail: 'Consumo de peixe baixo — considerar cápsula ou chia/linhaça.',
    },
    {
      topic: 'Vitamina D',
      detail: 'Academia com ar-condicionado — garantir exposição solar fora dela.',
    },
    {
      topic: 'Cálcio',
      detail:
        'Se cortar leite pela intolerância, compensar com iogurte, queijo ou fonte alternativa.',
    },
  ],
}
