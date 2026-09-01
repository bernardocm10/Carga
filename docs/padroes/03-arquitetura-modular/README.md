# 03 · Arquitetura modular

[↑ Índice](../README.md)

Arquitetura de fatias modulares (estilo Feature-Sliced Design, versão enxuta): cada peça tem uma API pública e ninguém mete a mão no interior da outra.

## 3.1 Camadas

O import **só desce**, nunca sobe:

```
app  →  modules  →  entities  →  shared
```

| Camada | O que é | Pode importar |
|---|---|---|
| `app/` | bootstrap, providers, shell de navegação, registro de abas | `modules`, `entities`, `shared` |
| `modules/` | uma fatia por aba — autocontida (UI + lógica da feature + composição de dados) | `entities`, `shared` |
| `entities/` | dado de domínio que cruza features: model + persistência, agnóstico de tela | `shared` |
| `shared/` | design system, engine de storage, date, libs genéricas — zero regra de negócio | só `shared` |

## 3.2 Regras de encaixe

- `modules/*` **nunca importa outro `modules/*`.** Se duas telas precisam do mesmo dado, esse dado vira uma `entity`.
- `entities/*` não importa `entity` irmã. `shared/*` não conhece `entities` nem `modules`.
- Cruzar fronteira de camada **só pelo `index.ts`** (API pública) da pasta de destino. Import profundo (`@/modules/weight/domain/foo`) é **erro de lint** (`eslint-plugin-boundaries`).
- Regra de negócio **nunca** dentro de componente. Se aparece cálculo numa tela, extrai para `domain/`.

## 3.3 Estrutura de pastas

```
src/
├── app/
│   ├── App.tsx            # providers + <TabBar/> + tela ativa
│   ├── tabs.ts            # registro: [todayTab, weightTab, ...] — nova aba = +1 linha
│   └── bootstrap.ts       # roda migrations + semeia Config no 1º launch
│
├── modules/
│   ├── today/
│   │   ├── index.ts       # API pública: exporta o tab descriptor
│   │   ├── TodayScreen.tsx
│   │   ├── ui/            # componentes privados da fatia
│   │   ├── domain/        # lógica pura da feature (+ testes)
│   │   └── model/         # hooks/selectors compondo entities
│   ├── weight/
│   │   ├── domain/weightProtocol.ts   # média 7d vs 7d → sugestão de ajuste (+ test)
│   │   └── ui/            # WeightChart.tsx, FeedbackBanner.tsx
│   ├── training/
│   │   └── domain/        # lastLoad.ts, progression.ts
│   ├── settings/          # edita entities/config pela API pública dela
│   └── guide/             # view read-only sobre entities/config (meals, micronotes)
│
├── entities/
│   ├── config/
│   │   ├── index.ts          # useConfig(), updateConfig(), tipos
│   │   ├── seed.ts           # CONFIG semente (valores já validados na arquitetura)
│   │   ├── config.repo.ts
│   │   ├── config.store.ts
│   │   └── config.types.ts
│   ├── weight-log/           # useWeightLog(), addWeightEntry(), WeightEntry
│   ├── training-log/
│   └── supplement-log/
│
├── shared/
│   ├── ui/                # Card, NumberField, Button, Tag, Sheet, WeekStrip, LoadedBar
│   ├── storage/           # kvGet/kvSet<T>, schema.ts, migrations.ts, backup.ts
│   ├── date/              # week(), dayToWorkout(), dateRange(), today()
│   ├── lib/               # cn(), formatters
│   └── styles/            # tokens.css (@import 'tailwindcss' + @theme com a paleta/fontes)
│
├── types/                 # só tipos globais/ambient de verdade
└── main.tsx
```

## 3.4 Anatomia de uma fatia (`modules/*`)

Cada módulo expõe **um** `index.ts` como fachada. Tudo o mais é privado.

```
modules/<feature>/
├── index.ts        # ÚNICO ponto de import externo — exporta o tab descriptor e nada mais além do necessário
├── <Feature>Screen.tsx
├── ui/             # componentes usados só aqui
├── domain/         # funções puras da feature + *.test.ts (TDD)
├── model/          # hooks e selectors que compõem entities + estado local da tela
└── types.ts
```

Os subdiretórios `ui/ domain/ model/` só aparecem quando há **mais de ~3 arquivos** do tipo. Módulo pequeno fica flat na raiz da fatia.

## 3.5 Anatomia de uma `entity`

```
entities/<name>/
├── index.ts          # API pública: hook(s), ações, tipos. Nada mais sai daqui.
├── <name>.types.ts   # shape em memória + shape persistido
├── <name>.repo.ts    # leitura/escrita via shared/storage; converte persistido ↔ memória
├── <name>.store.ts   # store Zustand; inicializa a partir do repo, persiste em cada mutação
└── <name>.selectors.ts  # (opcional) derivações puras sobre o estado
```

- A `store` é a única a chamar a `repo`. Módulos falam com a `store` via hook exportado no `index.ts`.
- `seed.ts` existe só nas entities que têm semente (hoje: `config`).

## 3.6 Aba como plugin

```ts
// shared/ui/tab-module.ts
export type TabModule = {
  id: string
  label: string           // texto PT-BR da barra
  icon: LucideIcon
  Screen: React.ComponentType
}
```

```ts
// modules/weight/index.ts
import { Scale } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { WeightScreen } from './WeightScreen'

export const weightTab: TabModule = {
  id: 'weight', label: 'Peso', icon: Scale, Screen: WeightScreen,
}
```

```ts
// app/tabs.ts
import { todayTab } from '@/modules/today'
import { weightTab } from '@/modules/weight'
import { trainingTab } from '@/modules/training'
import { settingsTab } from '@/modules/settings'
import { guideTab } from '@/modules/guide'

export const TABS: TabModule[] = [todayTab, weightTab, trainingTab, settingsTab, guideTab]
```

**v2 na prática:**
- **Nova aba** → cria `modules/<nova>/`, exporta o descriptor no `index.ts`, adiciona 1 linha em `tabs.ts`. Nada mais é tocado.
- **Novo dado persistido** → cria `entities/<nova>-log/`, registra a chave e a migração em `shared/storage`. Módulos aderem importando o hook.
- **Novo primitivo visual** → adiciona em `shared/ui/`, exporta no barrel.
