import type { Config } from './config.types'

/**
 * Semente inicial da Config. Copiada para o storage no 1º launch; depois disso
 * o que vale é o que está salvo (editável pela aba Ajustes).
 * Valores validados em app_arquitetura_v1.md §3.1.
 *
 * A lista de exercícios de cada dia ainda não foi fechada — os dias existem
 * com nome/foco e `exercises: []`; preencher pela aba Ajustes ou numa conversa.
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
      dose: '4g beta-alanina + 2g taurina + 4g arginina',
      timing: 'antes do treino',
    },
  ],

  trainingSplit: [
    { weekday: 1, name: 'Push A', focus: 'Força', exercises: [] },
    { weekday: 2, name: 'Pull A', focus: 'Força', exercises: [] },
    { weekday: 3, name: 'Legs A', focus: 'Força + cardio leve', exercises: [] },
    { weekday: 4, name: 'Push B', focus: 'Hipertrofia', exercises: [] },
    { weekday: 5, name: 'Pull B', focus: 'Hipertrofia', exercises: [] },
    { weekday: 6, name: 'Legs B', focus: 'Hipertrofia + cardio', exercises: [] },
    { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
  ],
}
