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
      dose: '4g beta-alanina + 2g taurina + 4g arginina',
      timing: 'antes do treino',
    },
  ],

  trainingSplit: [
    {
      weekday: 1,
      name: 'Ombro + Peito Sup. + Tríceps',
      focus: 'Empurrar',
      exercises: [
        { name: 'Supino inclinado com halteres', sets: 3, reps: '6-10' },
        { name: 'Supino inclinado máquina/Smith', sets: 2, reps: '8-12' },
        { name: 'Elevação lateral na polia', sets: 4, reps: '10-20' },
        { name: 'Elevação lateral na máquina', sets: 3, reps: '10-20' },
        { name: 'Crucifixo inverso', sets: 3, reps: '12-20' },
        { name: 'Tríceps francês na polia', sets: 3, reps: '8-15' },
        { name: 'Tríceps corda', sets: 2, reps: '10-15' },
      ],
    },
    {
      weekday: 2,
      name: 'Costas + Bíceps',
      focus: 'Puxar',
      exercises: [
        { name: 'Barra fixa / puxada alta', sets: 3, reps: '6-10' },
        { name: 'Puxada unilateral na polia', sets: 3, reps: '8-15' },
        { name: 'Remada com apoio no peito', sets: 3, reps: '8-12' },
        { name: 'Remada baixa ao quadril', sets: 2, reps: '10-15' },
        { name: 'Crucifixo inverso', sets: 2, reps: '12-20' },
        { name: 'Rosca inclinada com halteres', sets: 3, reps: '8-15' },
        { name: 'Rosca scott', sets: 2, reps: '8-15' },
        { name: 'Rosca martelo', sets: 3, reps: '8-15' },
      ],
    },
    {
      weekday: 3,
      name: 'Pernas — quadríceps',
      focus: 'Pernas + core',
      exercises: [
        { name: 'Agachamento hack', sets: 3, reps: '6-10' },
        { name: 'Leg press', sets: 3, reps: '8-15' },
        { name: 'Cadeira extensora', sets: 3, reps: '10-15' },
        { name: 'Terra romeno', sets: 2, reps: '6-10' },
        { name: 'Mesa flexora sentado', sets: 2, reps: '10-15' },
        { name: 'Panturrilha em pé', sets: 3, reps: '8-15' },
        { name: 'Panturrilha sentado', sets: 2, reps: '10-20' },
        { name: 'Abdominal na polia', sets: 3, reps: '8-15' },
        { name: 'Elevação de pernas na barra', sets: 2, reps: '8-15' },
      ],
    },
    {
      weekday: 4,
      name: 'Ombro + Braços',
      focus: 'Ombro + braços',
      exercises: [
        { name: 'Elevação lateral na máquina', sets: 4, reps: '10-20' },
        { name: 'Elevação lateral na polia', sets: 3, reps: '12-20' },
        { name: 'Crucifixo inverso', sets: 2, reps: '12-20' },
        { name: 'Rosca inclinada com halteres', sets: 2, reps: '8-15' },
        { name: 'Rosca scott', sets: 2, reps: '10-15' },
        { name: 'Rosca martelo', sets: 2, reps: '10-15' },
        { name: 'Tríceps francês na polia', sets: 3, reps: '8-15' },
        { name: 'Tríceps corda', sets: 3, reps: '8-15' },
        { name: 'Serrátil na polia', sets: 2, reps: '10-20' },
      ],
    },
    {
      weekday: 5,
      name: 'Posterior + Glúteo',
      focus: 'Pernas — posterior',
      exercises: [
        { name: 'Terra romeno', sets: 3, reps: '6-10' },
        { name: 'Mesa flexora', sets: 3, reps: '8-15' },
        { name: 'Agachamento hack', sets: 2, reps: '8-12' },
        { name: 'Agachamento búlgaro', sets: 2, reps: '8-12' },
        { name: 'Cadeira extensora', sets: 2, reps: '10-15' },
        { name: 'Elevação pélvica', sets: 2, reps: '8-12' },
        { name: 'Panturrilha em pé', sets: 3, reps: '8-15' },
        { name: 'Abdominal na polia', sets: 2, reps: '8-15' },
      ],
    },
    { weekday: 6, name: 'Descanso', focus: '—', exercises: [] },
    { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
  ],
}
