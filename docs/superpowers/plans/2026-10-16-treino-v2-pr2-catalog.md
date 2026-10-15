# Treino v2 · PR 2 — Catálogo de exercícios, fotos e migração nome → id — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exercício vira entidade com id, nome em inglês e fotos (free-exercise-db) com variantes trocáveis arrastando; ficha e histórico migram de nome para id; Ajustes escolhe exercício num seletor de busca.

**Architecture:** `entities/exercise-catalog` é somente leitura (JSON gerado por script + entradas próprias `cg:` que reaproveitam fotos do acervo). A migração é uma função pura congelada em `shared/db/migrations/` (o mapa nome → id vive ali, não na entity, porque `shared` não importa `entities`), aplicada pelo `upgrade` do Dexie v2, pela importação do legado e pela importação de backup v1. Componentes genéricos (`SearchPicker`, `ExerciseImage`) vão para `shared/ui`; os módulos resolvem o nome com `exerciseName(id)`.

**Tech Stack:** React 19 · TypeScript strict · Zustand 5 · Dexie 4.4.6 · sharp `0.34.5` (devDependency, só no script) · Lucide · Vitest + RTL + fake-indexeddb.

**Spec:** [`docs/superpowers/specs/2026-10-16-treino-v2-design.md`](../specs/2026-10-16-treino-v2-design.md) — seção 3 (PR 2). A PR 1 (Dexie + backup) já está na `main`.

## Global Constraints

- Camadas: `app → modules → entities → shared`; `modules/*` nunca importa outro `modules/*`; **entity não importa outra entity**; cruzar fronteira só pelo `index.ts`; `index.ts` de entity exporta só hooks, ações, funções puras e tipos — **nenhum componente**.
- **Dexie só é importado dentro de `src/shared/db/`** (regra de lint da PR 1).
- Fotos **nunca desenhadas**: só as do free-exercise-db; entradas `cg:` apontam para fotos do acervo. Commit do acervo fixado: `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`.
- Nomes de **exercícios em inglês** (acervo); nomes dos **dias** continuam em português. Textos de UI em português; identificadores em inglês.
- Variantes de foto são **só visuais**: o histórico de carga é único por `exerciseId`.
- Foto: WebP, 400 px de largura, qualidade 70, em `public/exercises/<id>/<0|1>.webp`.
- Versões fixas: `sharp@0.34.5` (≥ 2 semanas). Nenhuma outra dependência nova.
- Lógica nova com **TDD** (teste primeiro, ver falhar, implementar, ver passar). Comentário só quando estritamente necessário.
- Commits de uma linha `type: [scope] - resumo` (inglês, imperativo, sem ponto final), **sem `Co-authored-by`**. Pre-commit roda Prettier + ESLint + testes — não commitar com suíte vermelha nem `npm run typecheck` sujo.
- **Não rodar `npx cap sync`, build de release nem `adb install` sem pedir ao usuário.**
- Branch: `feat/treino-v2-catalog`, criada a partir de `docs/treino-v2-pr2-plan` (leva este plano junto na PR). Entre as Tasks 3 e 5 a branch **não é estável** (o banco já é v2 mas as telas ainda leem nome): nada é mergeado antes da Task 7.

## Review Focus

1. **Histórico real do usuário (backup de 2026-10-16: 28 nomes, 2 treinos) depois do upgrade** → nenhum exercício vira `legacy:`; "última vez" e delta continuam aparecendo. Testes: `legacyNameMap.test.ts` "cobre todos os nomes do backup real" (Task 3), `todayWorkout.test.ts` "usa a carga de um histórico migrado do v1" (Task 5).
2. **Exercício fora do mapa (nome que o usuário digitou na ficha, ou exercício que já saiu da ficha mas está no histórico)** → vira `legacy:<nome>`, aparece com o nome original, sem foto, sem quebrar nenhuma tela. Testes: `migrateV1toV2.test.ts` (Task 3), `catalog.test.ts` "legacy: devolve o nome original" (Task 2), `TrainingScreen.test.tsx` "exercício legacy mostra o nome e o ícone neutro, sem foto" (Task 6).
3. **Importar o backup v1 que o usuário já exportou, depois de atualizar o app** → config e histórico entram com ids (e um backup v2 não é convertido de novo). Teste: `backup.test.ts` "importAll · backup v1" (Task 3).
4. **Variante escolhida fora do intervalo (catálogo mudou, valor salvo = 5 com 2 variantes)** → mostra uma foto válida, não quebra. Testes: `ExerciseImage.test.tsx` "índice fora do intervalo cai na última variante" (Task 4), `TrainingScreen.test.tsx` "escolha salva fora do intervalo mostra uma foto válida" (Task 6).
5. **Mesmo exercício duas vezes no mesmo dia (acontece ao adicionar pelo picker)** → duas linhas renderizam sem erro de `key` e sem travar. Teste: `TrainingScreen.test.tsx` "exercício repetido no dia renderiza duas linhas sem erro de key" (Task 5).

---

### Task 1: Script do catálogo + fotos geradas

**Files:**

- Create: `scripts/catalog/build-catalog.mjs`, `public/exercises/**` (gerado), `src/entities/exercise-catalog/data/catalog.json` (gerado)
- Modify: `package.json` (devDependency + script), `eslint.config.ts` (ignorar `scripts`)

**Interfaces:**

- Produces:
  - `npm run catalog:build` — baixa o acervo no commit fixado e regenera os dois artefatos (idempotente: pula WebP que já existe)
  - `catalog.json`: `CatalogExercise[]` ordenado por nome, **só** os campos `id`, `name`, `primaryMuscles`, `equipment` (`string | null`), `variants: [{ sourceId: id, images: ['<id>/0.webp', '<id>/1.webp'] }]` — apenas exercícios com 2 fotos (873 de 876; `Kettlebell_Halo`, `Kettlebell_Halo_With_Overhead_Extension` e `Kettlebell_Overhead_Triceps_Extension` não têm foto e ficam de fora)

Este script é gerador manual de artefatos; ele não tem teste unitário próprio — o teste de integridade da Task 2 valida o `catalog.json` e a existência de todos os arquivos de foto.

- [ ] **Step 1: Criar a branch e instalar o sharp**

```bash
git checkout docs/treino-v2-pr2-plan
git checkout -b feat/treino-v2-catalog
npm install -D sharp@0.34.5
```

- [ ] **Step 2: Ignorar `scripts/` no ESLint**

Em `eslint.config.ts`, trocar a primeira linha do `tseslint.config(`:

```ts
  { ignores: ['dist', 'coverage', 'android', 'node_modules'] },
```

por:

```ts
  { ignores: ['dist', 'coverage', 'android', 'node_modules', 'scripts'] },
```

- [ ] **Step 3: Escrever o script**

`scripts/catalog/build-catalog.mjs`:

```js
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
const RAW = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}`
const ROOT = path.resolve(import.meta.dirname, '../..')
const IMAGES_DIR = path.join(ROOT, 'public/exercises')
const CATALOG_FILE = path.join(ROOT, 'src/entities/exercise-catalog/data/catalog.json')
const WIDTH = 400
const QUALITY = 70
const CONCURRENCY = 8

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

async function convert(sourcePath) {
  const outFile = path.join(IMAGES_DIR, sourcePath.replace(/\.jpg$/, '.webp'))
  if (existsSync(outFile)) return
  const jpg = await download(`${RAW}/exercises/${sourcePath}`)
  await mkdir(path.dirname(outFile), { recursive: true })
  await sharp(jpg)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outFile)
}

async function runPool(items, worker) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item)
    }),
  )
}

const source = JSON.parse((await download(`${RAW}/dist/exercises.json`)).toString('utf8'))
const withPhotos = source.filter((exercise) => exercise.images.length >= 2)

await runPool(
  withPhotos.flatMap((exercise) => exercise.images.slice(0, 2)),
  convert,
)

const catalog = withPhotos
  .map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    primaryMuscles: exercise.primaryMuscles,
    equipment: exercise.equipment ?? null,
    variants: [
      {
        sourceId: exercise.id,
        images: exercise.images.slice(0, 2).map((image) => image.replace(/\.jpg$/, '.webp')),
      },
    ],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

await mkdir(path.dirname(CATALOG_FILE), { recursive: true })
await writeFile(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n')
console.log(
  `${catalog.length} exercícios, ${catalog.length * 2} fotos (acervo ${COMMIT.slice(0, 7)})`,
)
```

- [ ] **Step 4: Registrar o script no `package.json`**

Em `"scripts"`, depois de `"cap:sync"`, acrescentar:

```json
    "catalog:build": "node scripts/catalog/build-catalog.mjs",
```

- [ ] **Step 5: Rodar o script**

Run: `npm run catalog:build`
Expected: última linha `873 exercícios, 1746 fotos (acervo f00c92c)`. Depois:

```bash
find public/exercises -name '*.webp' | wc -l
du -sh public/exercises
```

Expected: `1746` e um tamanho entre ~10 MB e ~40 MB. Se passar de 40 MB, trocar `QUALITY` para `60`, apagar `public/exercises` e rodar de novo.

- [ ] **Step 6: Conferir o JSON e as três exclusões**

```bash
node -e "const c=require('./src/entities/exercise-catalog/data/catalog.json');console.log(c.length, c.find(e=>e.id==='Hammer_Curls'), c.some(e=>e.id==='Kettlebell_Halo'))"
```

Expected: `873`, o objeto de `Hammer_Curls` com `images: ['Hammer_Curls/0.webp','Hammer_Curls/1.webp']`, e `false` no final.

- [ ] **Step 7: Suíte, lint e commit**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde (nada em `src/` usa o JSON ainda).

```bash
git add package.json package-lock.json eslint.config.ts scripts public src/entities/exercise-catalog
git commit -m "feat: [catalog] - add exercise catalog build script and generated photos"
```

---

### Task 2: Entity `exercise-catalog` (tipos, entradas próprias, API, busca)

**Files:**

- Create: `src/entities/exercise-catalog/exercise-catalog.types.ts`, `src/entities/exercise-catalog/data/custom.ts`, `src/entities/exercise-catalog/search.ts`, `src/entities/exercise-catalog/catalog.ts`, `src/entities/exercise-catalog/index.ts`
- Test: `src/entities/exercise-catalog/search.test.ts`, `src/entities/exercise-catalog/catalog.test.ts`
- Modify: `tsconfig.app.json` (types do node, para o teste de integridade ler `public/`)

**Interfaces:**

- Consumes: `data/catalog.json` (Task 1)
- Produces (`@/entities/exercise-catalog`):
  - tipos `CatalogExercise`, `ImageVariant`
  - `exerciseById(id: string): CatalogExercise | undefined`
  - `exerciseName(id: string): string` — `legacy:<nome>` → `<nome>`; id desconhecido → o próprio id
  - `searchExercises(query: string, priorityIds?: string[]): CatalogExercise[]` — substring sem acento/caixa, prioritários primeiro, máx. 50
  - `imageUrl(path: string): string` — `/exercises/<path>` (respeita `BASE_URL`)
  - `exerciseImages(id: string): string[][]` — uma lista `[início, fim]` de URLs por variante; `[]` sem variantes
  - (Task 6 acrescenta `useImageChoice`)

- [ ] **Step 1: Habilitar tipos do node nos testes**

Em `tsconfig.app.json`, trocar:

```json
    "types": ["vitest/globals", "@testing-library/jest-dom"],
```

por:

```json
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"],
```

- [ ] **Step 2: Tipos**

`src/entities/exercise-catalog/exercise-catalog.types.ts`:

```ts
/** um conjunto de fotos de um exercício do acervo: [início, fim] */
export type ImageVariant = { sourceId: string; images: string[] }

export type CatalogExercise = {
  /** id do free-exercise-db (ex. "Hammer_Curls") ou "cg:<slug>" para os próprios */
  id: string
  /** nome em inglês */
  name: string
  primaryMuscles: string[]
  equipment: string | null
  /** ≥ 1 variante; a primeira é a padrão */
  variants: ImageVariant[]
}
```

- [ ] **Step 3: Teste da busca (falha)**

`src/entities/exercise-catalog/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CatalogExercise } from './exercise-catalog.types'
import { searchIn } from './search'

function make(id: string, name: string): CatalogExercise {
  return {
    id,
    name,
    primaryMuscles: [],
    equipment: null,
    variants: [{ sourceId: id, images: [`${id}/0.webp`, `${id}/1.webp`] }],
  }
}

const LIST = [
  make('A', 'Barbell Curl'),
  make('B', 'Hammer Curls'),
  make('C', 'Crunches'),
  make('D', 'Café Press'),
]

describe('searchIn', () => {
  it('busca por substring sem diferenciar caixa', () => {
    expect(searchIn(LIST, 'CURL').map((e) => e.id)).toEqual(['A', 'B'])
  })

  it('ignora acento na busca e no nome', () => {
    expect(searchIn(LIST, 'cafe').map((e) => e.id)).toEqual(['D'])
    expect(searchIn(LIST, 'Café').map((e) => e.id)).toEqual(['D'])
  })

  it('ids prioritários vêm primeiro', () => {
    expect(searchIn(LIST, 'curl', ['B']).map((e) => e.id)).toEqual(['B', 'A'])
  })

  it('consulta vazia devolve tudo, prioritários primeiro', () => {
    expect(searchIn(LIST, '  ', ['C']).map((e) => e.id)).toEqual(['C', 'A', 'B', 'D'])
  })

  it('sem resultado devolve lista vazia', () => {
    expect(searchIn(LIST, 'zzz')).toEqual([])
  })

  it('limita a 50 resultados', () => {
    const many = Array.from({ length: 80 }, (_, i) => make(`X${i}`, `Curl ${i}`))
    expect(searchIn(many, 'curl')).toHaveLength(50)
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/entities/exercise-catalog/search.test.ts`
Expected: FAIL — `Failed to resolve import "./search"`.

- [ ] **Step 5: Implementar a busca**

`src/entities/exercise-catalog/search.ts`:

```ts
import type { CatalogExercise } from './exercise-catalog.types'

const LIMIT = 50

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function searchIn(
  list: CatalogExercise[],
  query: string,
  priorityIds: string[] = [],
): CatalogExercise[] {
  const needle = normalize(query)
  const matches = list.filter((exercise) => normalize(exercise.name).includes(needle))
  const priority = new Set(priorityIds)
  return [
    ...matches.filter((exercise) => priority.has(exercise.id)),
    ...matches.filter((exercise) => !priority.has(exercise.id)),
  ].slice(0, LIMIT)
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/entities/exercise-catalog/search.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 7: Testes da API e da integridade (falham)**

`src/entities/exercise-catalog/catalog.test.ts`:

```ts
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CUSTOM_DEFINITIONS } from './data/custom'
import {
  CATALOG,
  exerciseById,
  exerciseImages,
  exerciseName,
  imageUrl,
  searchExercises,
} from './catalog'

describe('exerciseName', () => {
  it('nome do acervo', () => {
    expect(exerciseName('Hammer_Curls')).toBe('Hammer Curls')
  })

  it('nome da entrada própria', () => {
    expect(exerciseName('cg:reverse-fly')).toBe('Reverse Fly')
  })

  it('legacy: devolve o nome original', () => {
    expect(exerciseName('legacy:Supino reto')).toBe('Supino reto')
  })

  it('id desconhecido devolve o próprio id', () => {
    expect(exerciseName('Nao_Existe')).toBe('Nao_Existe')
  })
})

describe('exerciseById', () => {
  it('acha o acervo e as entradas próprias', () => {
    expect(exerciseById('Hammer_Curls')?.name).toBe('Hammer Curls')
    expect(exerciseById('cg:pullup-lat-pulldown')?.name).toBe('Pull-up / Lat Pulldown')
  })

  it('legacy: não está no catálogo', () => {
    expect(exerciseById('legacy:Supino reto')).toBeUndefined()
  })
})

describe('entradas próprias (cg:)', () => {
  it('toda foto de origem existe no acervo, na ordem definida', () => {
    for (const definition of CUSTOM_DEFINITIONS) {
      const entry = exerciseById(definition.id)
      expect(entry?.variants.map((variant) => variant.sourceId)).toEqual(definition.sources)
    }
  })

  it('a foto padrão da elevação lateral na polia é a em pé', () => {
    expect(exerciseById('cg:cable-lateral-raise')?.variants[0]?.sourceId).toBe(
      'Standing_Low-Pulley_Deltoid_Raise',
    )
  })

  it('o agachamento búlgaro tem 3 variantes', () => {
    expect(exerciseById('cg:bulgarian-split-squat')?.variants).toHaveLength(3)
  })
})

describe('integridade do catálogo', () => {
  it('ids são únicos', () => {
    expect(new Set(CATALOG.map((exercise) => exercise.id)).size).toBe(CATALOG.length)
  })

  it('todo exercício tem ≥ 1 variante com 2 fotos que existem em public/', () => {
    const missing: string[] = []
    for (const exercise of CATALOG) {
      expect(exercise.variants.length).toBeGreaterThan(0)
      for (const variant of exercise.variants) {
        expect(variant.images).toHaveLength(2)
        for (const image of variant.images) {
          if (!existsSync(path.join(process.cwd(), 'public/exercises', image))) missing.push(image)
        }
      }
    }
    expect(missing).toEqual([])
  })
})

describe('imagens', () => {
  it('imageUrl aponta para /exercises', () => {
    expect(imageUrl('Hammer_Curls/0.webp')).toBe('/exercises/Hammer_Curls/0.webp')
  })

  it('exerciseImages devolve [início, fim] por variante', () => {
    const images = exerciseImages('cg:reverse-fly')
    expect(images).toHaveLength(2)
    expect(images[0]).toEqual([
      '/exercises/Reverse_Machine_Flyes/0.webp',
      '/exercises/Reverse_Machine_Flyes/1.webp',
    ])
  })

  it('legacy: não tem foto', () => {
    expect(exerciseImages('legacy:Supino reto')).toEqual([])
  })
})

describe('searchExercises', () => {
  it('busca no catálogo inteiro', () => {
    expect(searchExercises('hammer curl').map((exercise) => exercise.id)).toContain('Hammer_Curls')
  })

  it('prioriza ids da ficha', () => {
    expect(searchExercises('curl', ['Hammer_Curls'])[0]?.id).toBe('Hammer_Curls')
  })
})
```

- [ ] **Step 8: Rodar e ver falhar**

Run: `npx vitest run src/entities/exercise-catalog/catalog.test.ts`
Expected: FAIL — `Failed to resolve import "./data/custom"`.

- [ ] **Step 9: Implementar entradas próprias, catálogo e `index.ts`**

`src/entities/exercise-catalog/data/custom.ts`:

```ts
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
```

`src/entities/exercise-catalog/catalog.ts`:

```ts
import raw from './data/catalog.json'
import { CUSTOM_DEFINITIONS } from './data/custom'
import type { CatalogExercise, ImageVariant } from './exercise-catalog.types'
import { searchIn } from './search'

const LEGACY_PREFIX = 'legacy:'

const ACERVO = raw as CatalogExercise[]
const acervoById = new Map(ACERVO.map((exercise) => [exercise.id, exercise]))

const CUSTOM: CatalogExercise[] = CUSTOM_DEFINITIONS.map((definition) => {
  const sources = definition.sources
    .map((id) => acervoById.get(id))
    .filter((source): source is CatalogExercise => source !== undefined)
  const variants: ImageVariant[] = sources.flatMap((source) => source.variants.slice(0, 1))
  return {
    id: definition.id,
    name: definition.name,
    primaryMuscles: sources[0]?.primaryMuscles ?? [],
    equipment: sources[0]?.equipment ?? null,
    variants,
  }
})

export const CATALOG: CatalogExercise[] = [...CUSTOM, ...ACERVO]

const byId = new Map(CATALOG.map((exercise) => [exercise.id, exercise]))

export function exerciseById(id: string): CatalogExercise | undefined {
  return byId.get(id)
}

export function exerciseName(id: string): string {
  const found = byId.get(id)
  if (found !== undefined) return found.name
  return id.startsWith(LEGACY_PREFIX) ? id.slice(LEGACY_PREFIX.length) : id
}

export function searchExercises(query: string, priorityIds: string[] = []): CatalogExercise[] {
  return searchIn(CATALOG, query, priorityIds)
}

export function imageUrl(path: string): string {
  return `${import.meta.env.BASE_URL}exercises/${path}`
}

export function exerciseImages(id: string): string[][] {
  return (byId.get(id)?.variants ?? []).map((variant) => variant.images.map(imageUrl))
}
```

`src/entities/exercise-catalog/index.ts`:

```ts
export type { CatalogExercise, ImageVariant } from './exercise-catalog.types'
export { exerciseById, exerciseImages, exerciseName, imageUrl, searchExercises } from './catalog'
```

Observação: `CATALOG` e `CUSTOM_DEFINITIONS` ficam fora do `index.ts`; os testes importam direto dos arquivos (testes podem usar import profundo).

- [ ] **Step 10: Rodar e ver passar**

Run: `npx vitest run src/entities/exercise-catalog && npm run typecheck && npm run lint`
Expected: PASS. Se o `typecheck` reclamar do `raw as CatalogExercise[]`, trocar por `raw as unknown as CatalogExercise[]`.

- [ ] **Step 11: Commit**

```bash
git add tsconfig.app.json src/entities/exercise-catalog
git commit -m "feat: [exercise-catalog] - add read-only catalog entity with search and custom entries"
```

---

### Task 3: Banco v2 — `imageChoice`, mapa nome → id, migração (upgrade, legado e backup)

**Files:**

- Create: `src/shared/db/migrations/legacyNameMap.ts`, `src/shared/db/migrations/migrateV1toV2.ts`, `src/app/integrity.test.ts`
- Test: `src/shared/db/migrations/migrateV1toV2.test.ts`, `src/shared/db/migrations/legacyNameMap.test.ts`, `src/shared/db/db.test.ts` (reescrever), `src/shared/db/importLegacy.test.ts`, `src/shared/db/backup.test.ts`
- Modify: `src/shared/db/db.ts`, `src/shared/db/importLegacy.ts`, `src/shared/db/backup.ts`, `src/shared/db/index.ts`

**Interfaces:**

- Consumes: `exerciseById` de `@/entities/exercise-catalog` (só no teste de integridade, em `src/app/`)
- Produces (`@/shared/db`):
  - `DB_VERSION = 2`; `defineSchema(target: Dexie): Dexie` (declara v1 + v2; exportado para o teste de upgrade); tabela nova `imageChoice` (chave `exerciseId`, linha `{ exerciseId: string; variantIndex: number }`)
  - `LEGACY_NAME_MAP: Readonly<Record<string, string>>` — 28 nomes pt → id
  - `exerciseIdForName(name: string, map?): string` — id do mapa ou `legacy:<nome>`
  - `migrateConfigV1toV2(config: unknown, map?): unknown`, `migrateSessionV1toV2(session: unknown, map?): unknown`, `migrateV1toV2<C, S>(snapshot: { config: C; trainingLog: S[] }, map?)` — puras, idempotentes (item que já tem `exerciseId` não muda)
  - `importLegacyLocalStorage` e `importAll` passam a converter dados v1; `exportAll` grava `schemaVersion: 2`

- [ ] **Step 1: Teste da migração pura (falha)**

`src/shared/db/migrations/migrateV1toV2.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  exerciseIdForName,
  migrateConfigV1toV2,
  migrateSessionV1toV2,
  migrateV1toV2,
} from './migrateV1toV2'

const MAP = { 'Rosca martelo': 'Hammer_Curls', 'Leg press': 'Leg_Press' }

const CONFIG_V1 = {
  targetCalories: 3150,
  trainingSplit: [
    {
      weekday: 1,
      name: 'Push',
      focus: 'x',
      exercises: [
        { name: 'Rosca martelo', sets: 3, reps: '8-15' },
        { name: 'Exercício que o usuário digitou', sets: 2, reps: '8' },
      ],
    },
    { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
  ],
}

const SESSION_V1 = {
  date: '2026-09-02',
  dayName: 'Pernas',
  exercises: [{ name: 'Leg press', sets: [{ weight: 120, reps: 8 }] }],
}

describe('exerciseIdForName', () => {
  it('usa o mapa', () => {
    expect(exerciseIdForName('Leg press', MAP)).toBe('Leg_Press')
  })

  it('nome fora do mapa vira legacy:<nome>', () => {
    expect(exerciseIdForName('Supino reto', MAP)).toBe('legacy:Supino reto')
  })

  it('nome que coincide com propriedade de Object não vaza do protótipo', () => {
    expect(exerciseIdForName('constructor', MAP)).toBe('legacy:constructor')
  })
})

describe('migrateConfigV1toV2', () => {
  it('troca name por exerciseId e preserva o resto', () => {
    expect(migrateConfigV1toV2(CONFIG_V1, MAP)).toEqual({
      targetCalories: 3150,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push',
          focus: 'x',
          exercises: [
            { exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' },
            { exerciseId: 'legacy:Exercício que o usuário digitou', sets: 2, reps: '8' },
          ],
        },
        { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
      ],
    })
  })

  it('é idempotente', () => {
    const once = migrateConfigV1toV2(CONFIG_V1, MAP)
    expect(migrateConfigV1toV2(once, MAP)).toEqual(once)
  })

  it('não quebra com formato inesperado', () => {
    expect(migrateConfigV1toV2(null, MAP)).toBeNull()
    expect(migrateConfigV1toV2({ targetCalories: 1 }, MAP)).toEqual({ targetCalories: 1 })
    expect(migrateConfigV1toV2({ trainingSplit: ['x', { exercises: 'y' }] }, MAP)).toEqual({
      trainingSplit: ['x', { exercises: 'y' }],
    })
  })
})

describe('migrateSessionV1toV2', () => {
  it('troca name por exerciseId no histórico', () => {
    expect(migrateSessionV1toV2(SESSION_V1, MAP)).toEqual({
      date: '2026-09-02',
      dayName: 'Pernas',
      exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
    })
  })

  it('é idempotente', () => {
    const once = migrateSessionV1toV2(SESSION_V1, MAP)
    expect(migrateSessionV1toV2(once, MAP)).toEqual(once)
  })
})

describe('migrateV1toV2', () => {
  it('converte config e todas as sessões', () => {
    const out = migrateV1toV2({ config: CONFIG_V1, trainingLog: [SESSION_V1] }, MAP)
    expect(out.trainingLog).toEqual([migrateSessionV1toV2(SESSION_V1, MAP)])
    expect(out.config).toEqual(migrateConfigV1toV2(CONFIG_V1, MAP))
  })
})
```

- [ ] **Step 2: Teste do mapa contra o backup real (falha)**

`src/shared/db/migrations/legacyNameMap.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LEGACY_NAME_MAP } from './legacyNameMap'
import { exerciseIdForName } from './migrateV1toV2'

// copiado do backup real exportado em 2026-10-16 (ficha atual + histórico)
const NOMES_DO_BACKUP_REAL = [
  'Abdominal Infra',
  'Abdominal Supra',
  'Agachamento búlgaro',
  'Agachamento hack',
  'Barra fixa / puxada alta',
  'Cadeira extensora',
  'Crucifixo inverso',
  'Elevação de pernas na barra',
  'Elevação lateral na máquina',
  'Elevação lateral na polia',
  'Elevação pélvica',
  'Leg press',
  'Mesa flexora',
  'Mesa flexora sentado',
  'Panturrilha em pé',
  'Panturrilha sentado',
  'Puxada unilateral na polia',
  'Remada baixa ao quadril',
  'Remada com apoio no peito',
  'Rosca inclinada com halteres',
  'Rosca martelo',
  'Rosca scott',
  'Serrátil na polia',
  'Supino inclinado com halteres',
  'Supino inclinado máquina/Smith',
  'Terra romeno',
  'Tríceps corda',
  'Tríceps francês na polia',
]

describe('LEGACY_NAME_MAP', () => {
  it('cobre todos os nomes do backup real (nenhum vira legacy:)', () => {
    const unmapped = NOMES_DO_BACKUP_REAL.filter((name) =>
      exerciseIdForName(name).startsWith('legacy:'),
    )
    expect(unmapped).toEqual([])
  })

  it('mapeia exatamente os nomes do backup (sem sobras)', () => {
    expect(Object.keys(LEGACY_NAME_MAP).sort()).toEqual([...NOMES_DO_BACKUP_REAL].sort())
  })

  it('casos-chave do spec', () => {
    expect(LEGACY_NAME_MAP['Rosca martelo']).toBe('Hammer_Curls')
    expect(LEGACY_NAME_MAP['Crucifixo inverso']).toBe('cg:reverse-fly')
    expect(LEGACY_NAME_MAP['Barra fixa / puxada alta']).toBe('cg:pullup-lat-pulldown')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/shared/db/migrations`
Expected: FAIL — `Failed to resolve import "./migrateV1toV2"` / `"./legacyNameMap"`.

- [ ] **Step 4: Implementar o mapa e a migração**

`src/shared/db/migrations/legacyNameMap.ts`:

```ts
/** Nome (pt) da ficha v1 → id do catálogo. Congelado: é o contrato da migração v1 → v2. */
export const LEGACY_NAME_MAP: Readonly<Record<string, string>> = {
  'Abdominal Infra': 'Reverse_Crunch',
  'Abdominal Supra': 'Crunches',
  'Agachamento hack': 'Hack_Squat',
  'Cadeira extensora': 'Leg_Extensions',
  'Elevação de pernas na barra': 'Hanging_Leg_Raise',
  'Elevação pélvica': 'Barbell_Hip_Thrust',
  'Leg press': 'Leg_Press',
  'Mesa flexora': 'Lying_Leg_Curls',
  'Mesa flexora sentado': 'Seated_Leg_Curl',
  'Panturrilha em pé': 'Standing_Calf_Raises',
  'Panturrilha sentado': 'Seated_Calf_Raise',
  'Puxada unilateral na polia': 'One_Arm_Lat_Pulldown',
  'Remada baixa ao quadril': 'Seated_Cable_Rows',
  'Rosca inclinada com halteres': 'Incline_Dumbbell_Curl',
  'Rosca martelo': 'Hammer_Curls',
  'Rosca scott': 'Preacher_Curl',
  'Supino inclinado com halteres': 'Incline_Dumbbell_Press',
  'Supino inclinado máquina/Smith': 'Smith_Machine_Incline_Bench_Press',
  'Terra romeno': 'Romanian_Deadlift',
  'Tríceps corda': 'Triceps_Pushdown_-_Rope_Attachment',
  'Tríceps francês na polia': 'Cable_Rope_Overhead_Triceps_Extension',
  'Agachamento búlgaro': 'cg:bulgarian-split-squat',
  'Barra fixa / puxada alta': 'cg:pullup-lat-pulldown',
  'Crucifixo inverso': 'cg:reverse-fly',
  'Elevação lateral na polia': 'cg:cable-lateral-raise',
  'Remada com apoio no peito': 'cg:chest-supported-row',
  'Elevação lateral na máquina': 'cg:machine-lateral-raise',
  'Serrátil na polia': 'cg:cable-serratus',
}
```

`src/shared/db/migrations/migrateV1toV2.ts`:

```ts
import { LEGACY_NAME_MAP } from './legacyNameMap'

type NameMap = Readonly<Record<string, string>>
type Json = Record<string, unknown>

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function exerciseIdForName(name: string, map: NameMap = LEGACY_NAME_MAP): string {
  return Object.hasOwn(map, name) ? (map[name] ?? `legacy:${name}`) : `legacy:${name}`
}

function migrateExercise(item: unknown, map: NameMap): unknown {
  if (!isRecord(item) || 'exerciseId' in item) return item
  const { name, ...rest } = item
  if (typeof name !== 'string') return item
  return { exerciseId: exerciseIdForName(name, map), ...rest }
}

function migrateExercises(list: unknown, map: NameMap): unknown {
  return Array.isArray(list) ? list.map((item: unknown) => migrateExercise(item, map)) : list
}

export function migrateConfigV1toV2(config: unknown, map: NameMap = LEGACY_NAME_MAP): unknown {
  if (!isRecord(config) || !Array.isArray(config.trainingSplit)) return config
  const trainingSplit = config.trainingSplit.map((day: unknown) =>
    isRecord(day) ? { ...day, exercises: migrateExercises(day.exercises, map) } : day,
  )
  return { ...config, trainingSplit }
}

export function migrateSessionV1toV2(session: unknown, map: NameMap = LEGACY_NAME_MAP): unknown {
  if (!isRecord(session)) return session
  return { ...session, exercises: migrateExercises(session.exercises, map) }
}

export function migrateV1toV2<C, S>(
  snapshot: { config: C; trainingLog: S[] },
  map: NameMap = LEGACY_NAME_MAP,
): { config: unknown; trainingLog: unknown[] } {
  return {
    config: migrateConfigV1toV2(snapshot.config, map),
    trainingLog: snapshot.trainingLog.map((session) => migrateSessionV1toV2(session, map)),
  }
}
```

Atenção ao teste "não quebra com formato inesperado": `{ trainingSplit: ['x', { exercises: 'y' }] }` — o dia `{ exercises: 'y' }` passa por `migrateExercises('y')` que devolve `'y'`, e o `'x'` passa direto; o resultado é igual à entrada. Se `migrateSessionV1toV2` receber sessão sem `exercises`, o spread grava `exercises: undefined` — aceitável (JSON/Dexie descartam `undefined`), e o teste de sessão cobre só o caso normal.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/shared/db/migrations`
Expected: PASS.

- [ ] **Step 6: Reescrever `db.test.ts` com o upgrade v1 → v2 (falha)**

`src/shared/db/db.test.ts` (substituir inteiro):

```ts
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { CONFIG_ROW_ID, DB_VERSION, db, defineSchema } from './db'

describe('db', () => {
  it('tem as tabelas do schema v2', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'config',
      'imageChoice',
      'meta',
      'supplementLog',
      'trainingLog',
      'weightLog',
    ])
    expect(DB_VERSION).toBe(2)
  })

  it('usa date como chave dos logs e id fixo pra config', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await db.table('config').put({ id: CONFIG_ROW_ID, config: { targetCalories: 3150 } })
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 80 })
    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { targetCalories: 3150 },
    })
  })

  it('imageChoice usa exerciseId como chave', async () => {
    await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
    expect(await db.table('imageChoice').get('cg:reverse-fly')).toEqual({
      exerciseId: 'cg:reverse-fly',
      variantIndex: 1,
    })
  })
})

describe('upgrade v1 → v2', () => {
  it('converte ficha e histórico para exerciseId e preserva o resto', async () => {
    const name = 'claudgym-upgrade-test'
    const v1 = new Dexie(name)
    v1.version(1).stores({
      config: 'id',
      weightLog: 'date',
      trainingLog: 'date',
      supplementLog: 'date',
      meta: 'key',
    })
    await v1.table('config').put({
      id: 'main',
      config: {
        targetCalories: 3150,
        trainingSplit: [
          {
            weekday: 5,
            name: 'Posterior + Glúteo',
            focus: 'Pernas',
            exercises: [
              { name: 'Terra romeno', sets: 3, reps: '6-10' },
              { name: 'Exercício que o usuário digitou', sets: 2, reps: '8' },
            ],
          },
        ],
      },
    })
    await v1.table('weightLog').put({ date: '2026-09-08', kg: 64 })
    await v1.table('trainingLog').put({
      date: '2026-09-02',
      dayName: 'Pernas — quadríceps',
      exercises: [{ name: 'Leg press', sets: [{ weight: 120, reps: 8 }] }],
    })
    v1.close()

    const upgraded = defineSchema(new Dexie(name))
    await upgraded.open()
    try {
      expect(await upgraded.table('config').get('main')).toEqual({
        id: 'main',
        config: {
          targetCalories: 3150,
          trainingSplit: [
            {
              weekday: 5,
              name: 'Posterior + Glúteo',
              focus: 'Pernas',
              exercises: [
                { exerciseId: 'Romanian_Deadlift', sets: 3, reps: '6-10' },
                { exerciseId: 'legacy:Exercício que o usuário digitou', sets: 2, reps: '8' },
              ],
            },
          ],
        },
      })
      expect(await upgraded.table('trainingLog').toArray()).toEqual([
        {
          date: '2026-09-02',
          dayName: 'Pernas — quadríceps',
          exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
        },
      ])
      expect(await upgraded.table('weightLog').toArray()).toEqual([{ date: '2026-09-08', kg: 64 }])
      expect(await upgraded.table('imageChoice').count()).toBe(0)
    } finally {
      upgraded.close()
      await Dexie.delete(name)
    }
  })
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/shared/db/db.test.ts`
Expected: FAIL — `defineSchema` não exportado / `DB_VERSION` é 1.

- [ ] **Step 8: Implementar o schema v2**

`src/shared/db/db.ts` (substituir inteiro):

```ts
import Dexie from 'dexie'
import { migrateConfigV1toV2, migrateSessionV1toV2 } from './migrations/migrateV1toV2'

/** Versão do schema. Toda mudança de formato persistido sobe este número (ver doc 05). */
export const DB_VERSION = 2

export const CONFIG_ROW_ID = 'main'

export function defineSchema(target: Dexie): Dexie {
  target.version(1).stores({
    config: 'id',
    weightLog: 'date',
    trainingLog: 'date',
    supplementLog: 'date',
    meta: 'key',
  })

  target
    .version(2)
    .stores({ imageChoice: 'exerciseId' })
    .upgrade(async (tx) => {
      await tx
        .table('config')
        .toCollection()
        .modify((row: { config: unknown }) => {
          row.config = migrateConfigV1toV2(row.config)
        })
      await tx
        .table('trainingLog')
        .toCollection()
        .modify((row: { exercises?: unknown }) => {
          row.exercises = (migrateSessionV1toV2(row) as { exercises?: unknown }).exercises
        })
    })

  return target
}

export const db = defineSchema(new Dexie('claudgym'))

/** Pede ao WebView que não despeje o banco sob pressão de espaço. Sem suporte → segue. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // sem suporte ou negado: o backup manual cobre
  }
}
```

`src/shared/db/index.ts` (substituir inteiro):

```ts
export { BackupError, exportAll, importAll, type BackupFile } from './backup'
export { CONFIG_ROW_ID, DB_VERSION, db, defineSchema, requestPersistentStorage } from './db'
export { importLegacyLocalStorage } from './importLegacy'
export { LEGACY_NAME_MAP } from './migrations/legacyNameMap'
export {
  exerciseIdForName,
  migrateConfigV1toV2,
  migrateSessionV1toV2,
  migrateV1toV2,
} from './migrations/migrateV1toV2'
export { persist, settled } from './persist'
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run src/shared/db/db.test.ts src/shared/db/migrations`
Expected: PASS. (O `backup.test.ts` ainda falha em `schemaVersion: 1` — é o próximo passo.)

- [ ] **Step 10: Testes de importação do legado e do backup v1 (falham)**

Em `src/shared/db/importLegacy.test.ts`, acrescentar dentro do `describe('importLegacyLocalStorage', ...)`:

```ts
it('converte nomes de exercício em ids sem tocar no localStorage', async () => {
  localStorage.setItem(
    'cg:config',
    JSON.stringify({
      targetCalories: 3300,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push',
          focus: 'x',
          exercises: [{ name: 'Rosca martelo', sets: 3, reps: '8-15' }],
        },
      ],
    }),
  )
  localStorage.setItem(
    'cg:trainingLog',
    JSON.stringify([
      {
        date: '2026-08-10',
        dayName: 'Push',
        exercises: [{ name: 'Leg press', sets: [{ weight: 100, reps: 8 }] }],
      },
    ]),
  )

  await importLegacyLocalStorage(NOW)

  expect(await db.table('config').get('main')).toEqual({
    id: 'main',
    config: {
      targetCalories: 3300,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push',
          focus: 'x',
          exercises: [{ exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' }],
        },
      ],
    },
  })
  expect(await db.table('trainingLog').toArray()).toEqual([
    {
      date: '2026-08-10',
      dayName: 'Push',
      exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 100, reps: 8 }] }],
    },
  ])
  expect(localStorage.getItem('cg:trainingLog')).toContain('Leg press')
})
```

Em `src/shared/db/backup.test.ts`:

(a) No `describe('exportAll')`, no teste "serializa cabeçalho…", trocar `schemaVersion: 1,` por `schemaVersion: 2,` (só no `toEqual` do `file`, não nas fixtures de `backupWith`).

(b) Acrescentar ao fim do arquivo:

```ts
describe('importAll · backup v1', () => {
  const FICHA_V1 = [
    {
      weekday: 1,
      name: 'Push',
      focus: 'x',
      exercises: [
        { name: 'Rosca martelo', sets: 3, reps: '8-15' },
        { name: 'Exercício antigo', sets: 2, reps: '8' },
      ],
    },
  ]
  const SESSAO_V1 = {
    date: '2026-09-02',
    dayName: 'Pernas',
    exercises: [{ name: 'Leg press', sets: [{ weight: 120, reps: 8 }] }],
  }

  it('converte nomes em ids ao importar', async () => {
    await importAll(
      backupWith({
        config: { ...CONFIG, trainingSplit: FICHA_V1 },
        trainingLog: [SESSAO_V1],
      }),
    )

    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: {
        ...CONFIG,
        trainingSplit: [
          {
            weekday: 1,
            name: 'Push',
            focus: 'x',
            exercises: [
              { exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' },
              { exerciseId: 'legacy:Exercício antigo', sets: 2, reps: '8' },
            ],
          },
        ],
      },
    })
    expect(await db.table('trainingLog').toArray()).toEqual([
      {
        date: '2026-09-02',
        dayName: 'Pernas',
        exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
      },
    ])
  })

  it('backup v2 não é convertido de novo', async () => {
    const sessionV2 = {
      date: '2026-09-02',
      dayName: 'Pernas',
      exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
    }
    await importAll(backupWith({ schemaVersion: 2, trainingLog: [sessionV2] }))
    expect(await db.table('trainingLog').toArray()).toEqual([sessionV2])
  })
})
```

- [ ] **Step 11: Rodar e ver falhar**

Run: `npx vitest run src/shared/db`
Expected: FAIL — `serializa cabeçalho…` (recebe `schemaVersion: 2` do `DB_VERSION`, passa; os outros falham) e os testes novos de legado/backup v1 (nomes não convertidos).

- [ ] **Step 12: Implementar a conversão no legado e no backup**

Em `src/shared/db/importLegacy.ts`, trocar o import e o corpo da transação:

```ts
import { kvGet } from '@/shared/storage'
import { CONFIG_ROW_ID, db } from './db'
import { migrateV1toV2 } from './migrations/migrateV1toV2'
```

e dentro de `db.transaction(...)`, substituir da linha `const config = kvGet...` até o `bulkPut` do `trainingLog` por:

```ts
const migrated = migrateV1toV2({
  config: kvGet<unknown>('config', null),
  trainingLog: datedRows('trainingLog'),
})
if (typeof migrated.config === 'object' && migrated.config !== null) {
  await db.table('config').put({ id: CONFIG_ROW_ID, config: migrated.config })
}
await db.table('weightLog').bulkPut(datedRows('weightLog'))
await db.table('trainingLog').bulkPut(migrated.trainingLog)
```

(mantendo o `bulkPut` de `supplementLog` e o `meta.put` como estão).

Em `src/shared/db/backup.ts`: acrescentar `import { migrateV1toV2 } from './migrations/migrateV1toV2'` e trocar o corpo de `importAll` por:

```ts
export async function importAll(json: string): Promise<void> {
  const file = parseBackup(json)
  await settled()
  const snapshot = { config: file.config, trainingLog: file.trainingLog }
  const migrated = file.schemaVersion < 2 ? migrateV1toV2(snapshot) : snapshot
  const rows: Record<(typeof LOG_TABLES)[number], unknown[]> = {
    weightLog: file.weightLog,
    trainingLog: migrated.trainingLog,
    supplementLog: file.supplementLog,
  }
  const tables = [db.table('config'), ...LOG_TABLES.map((name) => db.table(name))]
  await db.transaction('rw', tables, async () => {
    await db.table('config').put({ id: CONFIG_ROW_ID, config: migrated.config })
    for (const name of LOG_TABLES) {
      await db.table(name).clear()
      await db.table(name).bulkPut(rows[name])
    }
  })
}
```

- [ ] **Step 13: Teste de integridade do mapa contra o catálogo**

`src/app/integrity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { exerciseById } from '@/entities/exercise-catalog'
import { LEGACY_NAME_MAP } from '@/shared/db'

describe('integridade entre camadas', () => {
  it('todo id do mapa de migração existe no catálogo', () => {
    const missing = Object.entries(LEGACY_NAME_MAP).filter(
      ([, id]) => exerciseById(id) === undefined,
    )
    expect(missing).toEqual([])
  })
})
```

- [ ] **Step 14: Rodar tudo**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde. (Telas e entities ainda trabalham com `name` — nenhum teste existente cria o banco v1, então nada mais quebra.)

- [ ] **Step 15: Commit**

```bash
git add src/shared/db src/app/integrity.test.ts
git commit -m "feat: [db] - add schema v2 with name to id migration for config, history and backups"
```

---

### Task 4: Componentes genéricos — `SearchPicker` e `ExerciseImage`

**Files:**

- Create: `src/shared/ui/SearchPicker.tsx`, `src/shared/ui/ExerciseImage.tsx`
- Test: `src/shared/ui/SearchPicker.test.tsx`, `src/shared/ui/ExerciseImage.test.tsx`

**Interfaces:**

- Produces (`@/shared/ui/...`):
  - `SearchPicker<T>` props `{ title: string; items: T[]; emptyText: string; getKey(item: T): string; renderItem(item: T): ReactNode; onQuery(query: string): void; onPick(item: T): void; onClose(): void }` — diálogo em tela cheia com campo `aria-label="Buscar"`
  - `ExerciseImage` props `{ variants: string[][]; selected: number; onSelect(index: number): void; alt: string; className?: string }` — `variants[i] = [urlInício, urlFim]`; sem variantes mostra ícone neutro

- [ ] **Step 1: Teste do `SearchPicker` (falha)**

`src/shared/ui/SearchPicker.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchPicker } from './SearchPicker'

type Item = { id: string; label: string }

function setup(
  items: Item[] = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
  ],
) {
  const onQuery = vi.fn()
  const onPick = vi.fn()
  const onClose = vi.fn()
  render(
    <SearchPicker<Item>
      title="Escolher"
      items={items}
      emptyText="Nada por aqui."
      getKey={(item) => item.id}
      renderItem={(item) => <span>{item.label}</span>}
      onQuery={onQuery}
      onPick={onPick}
      onClose={onClose}
    />,
  )
  return { onQuery, onPick, onClose }
}

describe('SearchPicker', () => {
  it('lista os itens e entrega o escolhido', async () => {
    const { onPick } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Beta' }))
    expect(onPick).toHaveBeenCalledWith({ id: 'b', label: 'Beta' })
  })

  it('avisa a busca a cada digitação', async () => {
    const { onQuery } = setup()
    await userEvent.type(screen.getByLabelText('Buscar'), 'al')
    expect(onQuery).toHaveBeenLastCalledWith('al')
  })

  it('mostra o texto de vazio sem itens', () => {
    setup([])
    expect(screen.getByText('Nada por aqui.')).toBeInTheDocument()
  })

  it('fecha pelo botão', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/shared/ui/SearchPicker.test.tsx`
Expected: FAIL — `Failed to resolve import "./SearchPicker"`.

- [ ] **Step 3: Implementar o `SearchPicker`**

`src/shared/ui/SearchPicker.tsx`:

```tsx
import { useId, useState, type ReactNode } from 'react'
import { Button } from './Button'

type Props<T> = {
  title: string
  items: T[]
  emptyText: string
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onQuery: (query: string) => void
  onPick: (item: T) => void
  onClose: () => void
}

export function SearchPicker<T>({
  title,
  items,
  emptyText,
  getKey,
  renderItem,
  onQuery,
  onPick,
  onClose,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const titleId = useId()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="bg-concrete text-graphite fixed inset-0 z-50 flex flex-col gap-3 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-2xl font-black uppercase">
          {title}
        </h2>
        <Button variant="ghost" onClick={onClose} className="px-3 text-xs">
          Fechar
        </Button>
      </div>

      <input
        type="search"
        aria-label="Buscar"
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          onQuery(event.target.value)
        }}
        className="border-hairline bg-chalk text-graphite focus:border-iron w-full rounded border px-3 py-2 text-base focus:outline-none"
      />

      {items.length === 0 ? (
        <p className="text-graphite-soft text-sm">{emptyText}</p>
      ) : (
        <ul className="divide-hairline border-hairline min-h-0 flex-1 divide-y overflow-y-auto border-t">
          {items.map((item) => (
            <li key={getKey(item)}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="hover:bg-chalk w-full py-3 text-left"
              >
                {renderItem(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/shared/ui/SearchPicker.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Teste do `ExerciseImage` (falha)**

`src/shared/ui/ExerciseImage.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseImage } from './ExerciseImage'

const A = ['/exercises/A/0.webp', '/exercises/A/1.webp']
const B = ['/exercises/B/0.webp', '/exercises/B/1.webp']
const C = ['/exercises/C/0.webp', '/exercises/C/1.webp']

function pointer(element: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
  fireEvent(element, new MouseEvent(type, { bubbles: true, clientX }))
}

function setup(variants: string[][], selected = 0) {
  const onSelect = vi.fn()
  const view = render(
    <ExerciseImage
      variants={variants}
      selected={selected}
      onSelect={onSelect}
      alt="Hammer Curls"
    />,
  )
  const thumb = screen.queryByRole('button', { name: /ampliar/i })
  return { onSelect, thumb, container: view.container }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ExerciseImage · miniatura', () => {
  it('mostra a foto de início da variante selecionada', () => {
    const { container } = setup([A, B], 1)
    expect(container.querySelector('img')).toHaveAttribute('src', B[0])
  })

  it('com 2+ variantes, indica qual está selecionada', () => {
    setup([A, B, C], 1)
    expect(screen.getByText('Foto 2 de 3')).toBeInTheDocument()
  })

  it('com uma variante só, não mostra indicador', () => {
    setup([A])
    expect(screen.queryByText(/Foto \d+ de/)).not.toBeInTheDocument()
  })

  it('sem variantes, mostra o ícone neutro e nenhum botão', () => {
    const { container, thumb } = setup([])
    expect(thumb).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('índice fora do intervalo cai na última variante', () => {
    const { container } = setup([A, B], 5)
    expect(container.querySelector('img')).toHaveAttribute('src', B[0])
  })
})

describe('ExerciseImage · arrastar', () => {
  it('arrastar para a esquerda além do limiar vai para a próxima', () => {
    const { onSelect, thumb } = setup([A, B, C], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 140)
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('arrastar para a direita volta (com volta ao fim)', () => {
    const { onSelect, thumb } = setup([A, B, C], 0)
    pointer(thumb!, 'pointerdown', 100)
    pointer(thumb!, 'pointerup', 160)
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('arrasto curto não troca de variante', () => {
    const { onSelect, thumb } = setup([A, B], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 180)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('com uma variante só, arrastar não faz nada', () => {
    const { onSelect, thumb } = setup([A])
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 100)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('depois de arrastar, o clique do fim do gesto não abre a vista ampliada', () => {
    const { thumb } = setup([A, B], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 120)
    fireEvent.click(thumb!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('ExerciseImage · vista ampliada', () => {
  it('toque abre e alterna início/fim a cada ~1 s; fechar remove', async () => {
    vi.useFakeTimers()
    const { thumb } = setup([A])
    fireEvent.click(thumb!)

    const dialog = screen.getByRole('dialog', { name: 'Hammer Curls' })
    const image = () => dialog.querySelector('img')
    expect(image()).toHaveAttribute('src', A[0])

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(image()).toHaveAttribute('src', A[1])

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(image()).toHaveAttribute('src', A[0])

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('arrastar na vista ampliada também troca de variante', async () => {
    const { onSelect, thumb } = setup([A, B], 0)
    await userEvent.click(thumb!)
    const image = screen.getByRole('dialog').querySelector('img')!
    pointer(image, 'pointerdown', 220)
    pointer(image, 'pointerup', 150)
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npx vitest run src/shared/ui/ExerciseImage.test.tsx`
Expected: FAIL — `Failed to resolve import "./ExerciseImage"`.

- [ ] **Step 7: Implementar o `ExerciseImage`**

`src/shared/ui/ExerciseImage.tsx`:

```tsx
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const SWIPE_PX = 40
const FLIP_MS = 1000

type Props = {
  /** variants[i] = [url do início, url do fim] */
  variants: string[][]
  selected: number
  onSelect: (index: number) => void
  alt: string
  className?: string
}

function useSwipe(onSwipe: (direction: -1 | 1) => void) {
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)
  return {
    swiped,
    handlers: {
      onPointerDown: (event: PointerEvent) => {
        startX.current = event.clientX
        swiped.current = false
      },
      onPointerUp: (event: PointerEvent) => {
        if (startX.current === null) return
        const delta = event.clientX - startX.current
        startX.current = null
        if (Math.abs(delta) < SWIPE_PX) return
        swiped.current = true
        onSwipe(delta < 0 ? 1 : -1)
      },
      onPointerCancel: () => {
        startX.current = null
      },
    },
  }
}

type ViewerProps = {
  images: string[]
  alt: string
  onClose: () => void
  swipeHandlers: ReturnType<typeof useSwipe>['handlers'] | undefined
}

function Viewer({ images, alt, onClose, swipeHandlers }: ViewerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((current) => (current + 1) % images.length), FLIP_MS)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-5"
    >
      <img
        src={images[frame]}
        alt=""
        draggable={false}
        className="max-h-[70dvh] w-full max-w-md touch-pan-y bg-white object-contain"
        {...swipeHandlers}
      />
      <button
        type="button"
        onClick={onClose}
        className="border-hairline bg-chalk text-graphite border px-4 py-2 text-sm font-semibold"
      >
        Fechar
      </button>
    </div>
  )
}

export function ExerciseImage({ variants, selected, onSelect, alt, className }: Props) {
  const [open, setOpen] = useState(false)
  const count = variants.length
  const index = Math.min(Math.max(selected, 0), count - 1)
  const swipe = useSwipe((direction) => onSelect((index + direction + count) % count))

  if (count === 0) {
    return (
      <div
        aria-hidden
        className={cn(
          'bg-chalk text-steel border-hairline flex size-16 shrink-0 items-center justify-center border',
          className,
        )}
      >
        <Dumbbell className="size-6" />
      </div>
    )
  }

  const images = variants[index] ?? []
  const handlers = count > 1 ? swipe.handlers : undefined

  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-1', className)}>
      <button
        type="button"
        aria-label={`Ampliar foto de ${alt}`}
        onClick={() => {
          if (swipe.swiped.current) {
            swipe.swiped.current = false
            return
          }
          setOpen(true)
        }}
        className="border-hairline block size-16 touch-pan-y overflow-hidden border bg-white"
        {...handlers}
      >
        <img src={images[0]} alt="" draggable={false} className="size-full object-cover" />
      </button>

      {count > 1 && (
        <>
          <span className="sr-only">
            Foto {index + 1} de {count}
          </span>
          <span aria-hidden className="flex gap-1">
            {variants.map((_, position) => (
              <i
                key={position}
                className={cn(
                  'size-1.5 rounded-full',
                  position === index ? 'bg-graphite' : 'bg-steel',
                )}
              />
            ))}
          </span>
        </>
      )}

      {open && (
        <Viewer
          key={index}
          images={images}
          alt={alt}
          swipeHandlers={handlers}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/shared/ui && npm run typecheck && npm run lint`
Expected: PASS. Se `fireEvent(element, new MouseEvent('pointerdown', …))` não disparar o handler do React, trocar o helper `pointer` por `fireEvent.pointerDown(element, { clientX })` / `fireEvent.pointerUp(...)` e rodar de novo.

- [ ] **Step 9: Commit**

```bash
git add src/shared/ui
git commit -m "feat: [ui] - add SearchPicker and swipeable ExerciseImage components"
```

---

### Task 5: Ficha e histórico por `exerciseId` + seletor no Ajustes

Esta é a task que fecha o tipo: `Exercise` e `LoggedExercise` passam a ter `exerciseId` em vez de `name`, então tudo que lia o nome muda junto (o `typecheck` aponta qualquer ponto esquecido). Ao fim dela a branch volta a ficar estável.

**Files:**

- Modify: `src/entities/config/config.types.ts`, `src/entities/config/seed.ts`, `src/entities/training-log/training-log.types.ts`, `src/entities/training-log/training-log.selectors.ts`, `src/entities/training-log/training-log.store.ts`, `src/modules/today/domain/todayWorkout.ts`, `src/modules/today/ui/WorkoutList.tsx`, `src/modules/training/TrainingScreen.tsx`, `src/modules/training/ui/ExerciseCard.tsx`, `src/modules/settings/ui/ExerciseRow.tsx`, `src/modules/settings/ui/TrainingDayEditor.tsx`, `src/app/integrity.test.ts`
- Test: `training-log.selectors.test.ts`, `training-log.store.test.ts`, `todayWorkout.test.ts`, `weekStatus.test.ts`, `editConfig.test.ts`, `TrainingScreen.test.tsx`, `SettingsScreen.test.tsx`

**Interfaces:**

- Consumes: `exerciseName`, `searchExercises`, `CatalogExercise` (Task 2); `SearchPicker` (Task 4); `migrateV1toV2` (Task 3, só em teste)
- Produces:
  - `Exercise = { exerciseId: string; sets: number; reps: string }`; `LoggedExercise = { exerciseId: string; sets: LoggedSet[] }`
  - `lastLoadForExercise(sessions, exerciseId, before?)`; `logSet(date, dayName, exerciseId, set)`; `removeSet(date, exerciseId, index)`
  - `WorkoutRow = { exerciseId: string; target: string; last: number | null; delta: number | null }` (a UI resolve o nome)
  - `CONFIG_SEED` com ids do catálogo

- [ ] **Step 1: Atualizar os testes existentes (mecânico)**

```bash
sed -i "s/name: 'Supino reto'/exerciseId: 'Hammer_Curls'/g; s/'Supino reto'/'Hammer_Curls'/g; s/'Agachamento'/'Leg_Press'/g" \
  src/entities/training-log/training-log.selectors.test.ts

sed -i "s/name: 'Supino'/exerciseId: 'Hammer_Curls'/g; s/name: 'Remada'/exerciseId: 'Seated_Cable_Rows'/g; s/'Supino'/'Hammer_Curls'/g; s/'Remada'/'Seated_Cable_Rows'/g" \
  src/entities/training-log/training-log.store.test.ts

sed -i "s/{ name: string; sets: number; reps: string }/{ exerciseId: string; sets: number; reps: string }/; s/{ name: string; sets: Array<\[number, number\]> }/{ exerciseId: string; sets: Array<[number, number]> }/; s/name: e\.name,/exerciseId: e.exerciseId,/; s/name: 'Remada'/exerciseId: 'Seated_Cable_Rows'/g; s/name: 'Supino'/exerciseId: 'Hammer_Curls'/g" \
  src/modules/today/domain/todayWorkout.test.ts

sed -i "s/{ name: 'X', sets/{ exerciseId: 'Hammer_Curls', sets/" src/modules/today/domain/weekStatus.test.ts

sed -i "s/{ name: '\([ABC]\)'/{ exerciseId: '\1'/g; s/{ name: 'Supino reto'/{ exerciseId: 'Hammer_Curls'/g; s/{ name: 'Supino'/{ exerciseId: 'Hammer_Curls'/g; s/(e) => e\.name)/(e) => e.exerciseId)/g" \
  src/modules/settings/domain/editConfig.test.ts

sed -i "s/name: 'Supino reto'/exerciseId: 'Hammer_Curls'/g" src/modules/training/TrainingScreen.test.tsx
sed -i "s/{ name: 'Supino', sets: 4, reps: '5' }/{ exerciseId: 'Leg_Press', sets: 4, reps: '5' }/" src/modules/settings/SettingsScreen.test.tsx
```

Conferir que sobrou `name:` só em dias/refeições:

```bash
grep -n "name: '" src/modules/today/domain/todayWorkout.test.ts src/modules/training/TrainingScreen.test.tsx src/modules/settings/domain/editConfig.test.ts | head -20
```

Expected: apenas nomes de **dia** (`'Puxar'`, `'Descanso'`, `'Push A'`) e de refeição (`'Nova refeição'`, `'Brunch'`), nenhum exercício.

- [ ] **Step 2: Escrever os testes novos (falham)**

**2a.** Em `src/modules/today/domain/todayWorkout.test.ts`: acrescentar `import { migrateV1toV2 } from '@/shared/db'` junto dos imports e este teste ao fim do `describe('todayWorkout')`:

```ts
it('usa a carga de um histórico migrado do v1 (nome → id)', () => {
  const migrated = migrateV1toV2({
    config: {
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 2,
          name: 'Puxar',
          focus: 'x',
          exercises: [{ name: 'Remada baixa ao quadril', sets: 2, reps: '10-15' }],
        },
      ],
    },
    trainingLog: [
      {
        date: '2026-08-18',
        dayName: 'Puxar',
        exercises: [{ name: 'Remada baixa ao quadril', sets: [{ weight: 40, reps: 8 }] }],
      },
    ],
  })

  const out = todayWorkout(
    migrated.config as Config,
    migrated.trainingLog as TrainingSession[],
    TUESDAY,
  )

  expect(out.rows).toEqual([
    { exerciseId: 'Seated_Cable_Rows', target: '2×10-15', last: 40, delta: null },
  ])
})
```

**2b.** Em `src/modules/training/TrainingScreen.test.tsx`: no teste existente "lança uma série e persiste no log", logo depois do `expect(screen.getByText('40kg × 6'))…`, acrescentar `expect(screen.getByText('Hammer Curls')).toBeInTheDocument()`. Acrescentar `vi` ao import do vitest (`import { beforeEach, describe, expect, it, vi } from 'vitest'`) e estes testes dentro do mesmo `describe`:

```tsx
it('mostra o nome original de um exercício legacy', () => {
  useConfigStore.getState().replaceConfig({
    ...CONFIG_SEED,
    trainingSplit: [
      {
        weekday: 1,
        name: 'Push A',
        focus: 'Força',
        exercises: [{ exerciseId: 'legacy:Supino reto', sets: 4, reps: '4-6' }],
      },
    ],
  })
  render(<TrainingScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  expect(screen.getByText('Supino reto')).toBeInTheDocument()
})

it('exercício repetido no dia renderiza duas linhas sem erro de key', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  useConfigStore.getState().replaceConfig({
    ...CONFIG_SEED,
    trainingSplit: [
      {
        weekday: 1,
        name: 'Push A',
        focus: 'Força',
        exercises: [
          { exerciseId: 'Hammer_Curls', sets: 3, reps: '8' },
          { exerciseId: 'Hammer_Curls', sets: 2, reps: '12' },
        ],
      },
    ],
  })
  render(<TrainingScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  expect(screen.getAllByText('Hammer Curls')).toHaveLength(2)
  expect(error).not.toHaveBeenCalled()
  error.mockRestore()
})
```

e acrescentar `fireEvent` ao import de `@testing-library/react` desse arquivo.

**2c.** Em `src/modules/settings/SettingsScreen.test.tsx`, substituir o teste "adiciona um exercício ao dia aberto" inteiro por:

```tsx
it('adiciona o exercício escolhido no seletor', async () => {
  const user = userEvent.setup()
  useConfigStore.getState().replaceConfig({
    ...CONFIG_SEED,
    trainingSplit: CONFIG_SEED.trainingSplit.map((day) => ({ ...day, exercises: [] })),
  })
  render(<SettingsScreen />)

  await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))
  await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))
  await user.type(screen.getByLabelText('Buscar'), 'romanian')
  await user.click(screen.getByText('Romanian Deadlift'))

  const monday = (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)
  expect(monday?.exercises).toEqual([{ exerciseId: 'Romanian_Deadlift', sets: 3, reps: '8-12' }])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('troca o exercício pelo seletor mantendo séries e reps', async () => {
  const user = userEvent.setup()
  useConfigStore.getState().replaceConfig({
    ...CONFIG_SEED,
    trainingSplit: [
      {
        weekday: 1,
        name: 'Push A',
        focus: 'Força',
        exercises: [{ exerciseId: 'Leg_Press', sets: 4, reps: '5' }],
      },
    ],
  })
  render(<SettingsScreen />)

  await user.click(screen.getByRole('button', { name: /push a/i }))
  await user.click(screen.getByRole('button', { name: /trocar exercício leg press/i }))
  await user.type(screen.getByLabelText('Buscar'), 'romanian')
  await user.click(screen.getByText('Romanian Deadlift'))

  const monday = (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)
  expect(monday?.exercises).toEqual([{ exerciseId: 'Romanian_Deadlift', sets: 4, reps: '5' }])
})

it('o seletor mostra aviso quando a busca não acha nada', async () => {
  const user = userEvent.setup()
  render(<SettingsScreen />)

  await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))
  await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))
  await user.type(screen.getByLabelText('Buscar'), 'zzzzzz')

  expect(screen.getByText('Nenhum exercício encontrado.')).toBeInTheDocument()
})
```

**2d.** Em `src/app/integrity.test.ts`, acrescentar `import { CONFIG_SEED } from '@/entities/config'` e, dentro do `describe`:

```ts
it('todo exercício da ficha semente existe no catálogo', () => {
  const ids = CONFIG_SEED.trainingSplit.flatMap((day) =>
    day.exercises.map((exercise) => exercise.exerciseId),
  )
  expect(ids.length).toBeGreaterThan(0)
  expect(ids.filter((id) => exerciseById(id) === undefined)).toEqual([])
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:run`
Expected: FAIL em vários arquivos — `lastLoadForExercise` não acha nada (ainda compara `name`), `logSet` grava `name`, `todayWorkout` devolve `name`, telas sem `exerciseName`, o seletor não existe. (O `typecheck` também já acusa os tipos; ele só passa no Step 7.)

- [ ] **Step 4: Tipos, semente e `training-log`**

`src/entities/config/config.types.ts`: trocar o tipo `Exercise` por:

```ts
export type Exercise = {
  /** id do exercise-catalog: do acervo, `cg:<slug>` ou `legacy:<nome>` */
  exerciseId: string
  sets: number
  /** faixa de repetições como texto livre, ex: "4-6" */
  reps: string
}
```

Semente — converter os 41 exercícios do `seed.ts` usando o mesmo mapa da migração (falha com `KeyError` se algum nome não estiver mapeado):

```bash
python3 - <<'PY'
import re
mapping = dict(re.findall(r"'([^']+)':\s*'([^']+)'", open('src/shared/db/migrations/legacyNameMap.ts', encoding='utf8').read()))
path = 'src/entities/config/seed.ts'
source = open(path, encoding='utf8').read()
converted, count = re.subn(r"\{ name: '([^']+)',(?= sets:)", lambda m: "{ exerciseId: '%s'," % mapping[m.group(1)], source)
open(path, 'w', encoding='utf8').write(converted)
print(count, 'exercícios convertidos')
PY
grep -c "exerciseId:" src/entities/config/seed.ts
```

Expected: `41 exercícios convertidos` e `41`.

`src/entities/training-log/training-log.types.ts`: trocar a linha de `LoggedExercise` por:

```ts
export type LoggedExercise = { exerciseId: string; sets: LoggedSet[] }
```

`src/entities/training-log/training-log.selectors.ts`: trocar a assinatura e o `find`:

```ts
export function lastLoadForExercise(
  sessions: TrainingSession[],
  exerciseId: string,
  before?: string,
): LastLoad | undefined {
  const latest = sessions
    .filter((s) => before === undefined || s.date < before)
    .map((s) => ({
      date: s.date,
      sets: s.exercises.find((e) => e.exerciseId === exerciseId)?.sets ?? [],
    }))
```

(o resto da função fica igual).

`src/entities/training-log/training-log.store.ts`: três trocas — no tipo `TrainingLogState`:

```ts
  logSet: (date: string, dayName: string, exerciseId: string, set: LoggedSet) => void
  removeSet: (date: string, exerciseId: string, index: number) => void
```

em `logSet`:

```ts
  logSet: (date, dayName, exerciseId, newSet) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date) ?? { date, dayName, exercises: [] }
    const hasExercise = current.exercises.some((e) => e.exerciseId === exerciseId)
    const exercises = hasExercise
      ? current.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e,
        )
      : [...current.exercises, { exerciseId, sets: [newSet] }]
```

(o resto de `logSet` fica igual) e em `removeSet`:

```ts
  removeSet: (date, exerciseId, index) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date)
    if (current === undefined) return
    const exercises = current.exercises
      .map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e,
      )
      .filter((e) => e.sets.length > 0)
```

(o resto de `removeSet` fica igual).

- [ ] **Step 5: Domínio e telas de leitura (Hoje e Treino)**

`src/modules/today/domain/todayWorkout.ts`:

```bash
sed -i "s/^  name: string$/  exerciseId: string/; s/lastLoadForExercise(sessions, exercise\.name/lastLoadForExercise(sessions, exercise.exerciseId/g; s/^      name: exercise\.name,$/      exerciseId: exercise.exerciseId,/" src/modules/today/domain/todayWorkout.ts
grep -n "exerciseId\|name" src/modules/today/domain/todayWorkout.ts
```

Expected: `WorkoutRow` com `exerciseId: string`, duas chamadas `lastLoadForExercise(sessions, exercise.exerciseId…`, o `return` com `exerciseId: exercise.exerciseId,`, e `name` só em `dayName`, `day.name` e `s.dayName`.

`src/modules/today/ui/WorkoutList.tsx`: acrescentar `import { exerciseName } from '@/entities/exercise-catalog'` junto dos imports de entity e aplicar:

```bash
sed -i "s/{row\.name}/{exerciseName(row.exerciseId)}/g" src/modules/today/ui/WorkoutList.tsx
```

depois trocar os dois `.map` que usavam `key={row.name}` para chaves com índice:

```tsx
          {workout.rows.map((row, index) => (
            <li
              key={`${index}:${row.exerciseId}`}
              className="flex items-baseline justify-between gap-3"
            >
```

e

```tsx
{
  rest.map((row, index) => <RestRow key={`${index}:${row.exerciseId}`} row={row} />)
}
```

`src/modules/training/TrainingScreen.tsx`: trocar o `.map` dos cards:

```tsx
{
  day.exercises.map((exercise, index) => (
    <ExerciseCard
      key={`${index}:${exercise.exerciseId}`}
      exercise={exercise}
      dayName={day.name}
      date={date}
    />
  ))
}
```

`src/modules/training/ui/ExerciseCard.tsx`: acrescentar `import { exerciseName } from '@/entities/exercise-catalog'` e aplicar:

```bash
sed -i "s/entry\.name === exercise\.name/entry.exerciseId === exercise.exerciseId/; s/lastLoadForExercise(sessions, exercise\.name, date)/lastLoadForExercise(sessions, exercise.exerciseId, date)/; s/logSet(date, dayName, exercise\.name,/logSet(date, dayName, exercise.exerciseId,/; s/removeSet(date, exercise\.name, index)/removeSet(date, exercise.exerciseId, index)/; s/{exercise\.name}<\/span>/{exerciseName(exercise.exerciseId)}<\/span>/" src/modules/training/ui/ExerciseCard.tsx
grep -n "exercise\.name" src/modules/training/ui/ExerciseCard.tsx
```

Expected: o `grep` não imprime nada.

- [ ] **Step 6: Ajustes — linha com botão de trocar e seletor**

`src/modules/settings/ui/ExerciseRow.tsx` (substituir inteiro):

```tsx
import type { Exercise } from '@/entities/config'
import { exerciseName } from '@/entities/exercise-catalog'
import { cn } from '@/shared/lib/cn'
import { useLeave } from '@/shared/lib/useLeave'

type Props = {
  exercise: Exercise
  canMoveUp: boolean
  canMoveDown: boolean
  onPatch: (patch: Partial<Exercise>) => void
  onChangeExercise: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

const NUM_FIELD =
  'border-hairline bg-chalk text-graphite focus:border-iron w-full rounded border py-1 text-center font-mono text-sm focus:outline-none'

export function ExerciseRow({
  exercise,
  canMoveUp,
  canMoveDown,
  onPatch,
  onChangeExercise,
  onRemove,
  onMove,
}: Props) {
  const { leaving, leave } = useLeave(onRemove)
  const name = exerciseName(exercise.exerciseId)

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_2.5rem_4rem_4.5rem] items-center gap-2 py-1.5',
        leaving ? 'cg-leave' : 'cg-enter',
      )}
    >
      <button
        type="button"
        aria-label={`Trocar exercício ${name}`}
        onClick={onChangeExercise}
        className="text-graphite hover:bg-chalk font-body min-w-0 truncate rounded px-1 py-1 text-left text-sm"
      >
        {name}
      </button>

      <input
        aria-label="Séries"
        inputMode="numeric"
        defaultValue={exercise.sets}
        className={NUM_FIELD}
        onBlur={(event) => {
          const value = Math.round(Number(event.target.value))
          if (Number.isFinite(value) && value > 0) {
            if (value !== exercise.sets) onPatch({ sets: value })
          } else event.target.value = String(exercise.sets)
        }}
      />

      <input
        aria-label="Reps"
        defaultValue={exercise.reps}
        className={NUM_FIELD}
        onBlur={(event) => {
          const value = event.target.value.trim()
          if (value && value !== exercise.reps) onPatch({ reps: value })
          else event.target.value = exercise.reps
        }}
      />

      <div className="text-graphite-soft flex items-center justify-end gap-0.5">
        <button
          type="button"
          aria-label="Subir exercício"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
          className="hover:text-graphite p-1 transition-transform active:scale-90 disabled:opacity-25"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Descer exercício"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
          className="hover:text-graphite p-1 transition-transform active:scale-90 disabled:opacity-25"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Remover exercício"
          onClick={leave}
          className="hover:text-rust p-1 transition-colors active:scale-90"
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

`src/modules/settings/ui/TrainingDayEditor.tsx` (substituir inteiro):

```tsx
import { useState } from 'react'
import type { Config, TrainingDay } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { searchExercises, type CatalogExercise } from '@/entities/exercise-catalog'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { SearchPicker } from '@/shared/ui/SearchPicker'
import { addExercise, moveExercise, removeExercise, setExercise } from '../domain/editConfig'
import { ExerciseRow } from './ExerciseRow'

type Props = {
  day: TrainingDay
  open: boolean
  onToggle: () => void
}

type PickerTarget = { kind: 'add' } | { kind: 'swap'; index: number }

export function TrainingDayEditor({ day, open, onToggle }: Props) {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const apply = (next: Config) => updateConfig(next)
  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [query, setQuery] = useState('')

  const priorityIds = config.trainingSplit.flatMap((split) =>
    split.exercises.map((exercise) => exercise.exerciseId),
  )

  const openPicker = (target: PickerTarget) => {
    setQuery('')
    setPicker(target)
  }

  const pick = (exercise: CatalogExercise) => {
    if (picker?.kind === 'add') {
      apply(addExercise(config, day.weekday, { exerciseId: exercise.id, sets: 3, reps: '8-12' }))
    } else if (picker?.kind === 'swap') {
      apply(setExercise(config, day.weekday, picker.index, { exerciseId: exercise.id }))
    }
    setPicker(null)
  }

  return (
    <div className="border-hairline border-b">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-baseline gap-2 py-2.5 text-left"
      >
        <span className="text-graphite flex-1 text-sm font-semibold">{day.name}</span>
        <span className="text-graphite-soft text-[11px]">{day.focus}</span>
        <span className="font-display text-graphite text-base font-bold tabular-nums">
          {day.exercises.length}
        </span>
        <span
          className={cn('text-graphite-soft shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-1 pt-1 pb-4">
          {day.exercises.length === 0 ? (
            <p className="text-graphite-soft text-xs">Nenhum exercício ainda.</p>
          ) : (
            <div className="text-graphite-soft grid grid-cols-[1fr_2.5rem_4rem_4.5rem] items-center gap-2 px-1 text-[0.65rem] font-semibold tracking-wide uppercase">
              <span>Exercício</span>
              <span className="text-center">Sér</span>
              <span className="text-center">Reps</span>
              <span />
            </div>
          )}

          <div className="divide-hairline divide-y">
            {day.exercises.map((exercise, index) => (
              <ExerciseRow
                key={`${index}:${exercise.exerciseId}`}
                exercise={exercise}
                canMoveUp={index > 0}
                canMoveDown={index < day.exercises.length - 1}
                onPatch={(patch) => apply(setExercise(config, day.weekday, index, patch))}
                onChangeExercise={() => openPicker({ kind: 'swap', index })}
                onRemove={() => apply(removeExercise(config, day.weekday, index))}
                onMove={(direction) => apply(moveExercise(config, day.weekday, index, direction))}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => openPicker({ kind: 'add' })}
            className="mt-2 self-start px-3 text-xs"
          >
            + Adicionar exercício
          </Button>
        </div>
      )}

      {picker !== null && (
        <SearchPicker<CatalogExercise>
          title="Escolher exercício"
          items={searchExercises(query, priorityIds)}
          emptyText="Nenhum exercício encontrado."
          getKey={(exercise) => exercise.id}
          renderItem={(exercise) => (
            <>
              <span className="text-graphite block text-sm font-medium">{exercise.name}</span>
              <span className="text-graphite-soft block text-xs">
                {[exercise.primaryMuscles[0], exercise.equipment].filter(Boolean).join(' · ')}
              </span>
            </>
          )}
          onQuery={setQuery}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Rodar tudo**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde. Se o `typecheck` apontar algum `.name` de exercício esquecido, trocar por `.exerciseId` (ou `exerciseName(...)` quando for texto na tela).

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "refactor: [training] - reference exercises by catalog id and pick them in settings"
```

---

### Task 6: Escolha de foto persistida + miniatura no card do Treino

**Files:**

- Create: `src/entities/exercise-catalog/image-choice.repo.ts`, `src/entities/exercise-catalog/image-choice.store.ts`
- Test: `src/entities/exercise-catalog/image-choice.store.test.ts`, `src/app/bootstrap.test.ts`, `src/modules/training/TrainingScreen.test.tsx`
- Modify: `src/entities/exercise-catalog/index.ts`, `src/app/bootstrap.ts`, `src/modules/training/ui/ExerciseCard.tsx`

**Interfaces:**

- Consumes: tabela `imageChoice` (Task 3); `ExerciseImage` (Task 4); `exerciseImages`, `exerciseName` (Task 2)
- Produces (`@/entities/exercise-catalog`):
  - `useImageChoiceStore` — `{ choices: Record<string, number>; hydrate(): Promise<void>; select(exerciseId: string, variantIndex: number): void }`
  - `useImageChoice(exerciseId: string): { selected: number; select(index: number): void }` — padrão `0`

- [ ] **Step 1: Testes do store (falham)**

`src/entities/exercise-catalog/image-choice.store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { db, settled } from '@/shared/db'
import { useImageChoice, useImageChoiceStore } from './image-choice.store'

beforeEach(() => {
  useImageChoiceStore.setState({ choices: {} })
})

describe('image-choice store', () => {
  it('sem escolha salva, a variante padrão é 0', () => {
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))
    expect(result.current.selected).toBe(0)
  })

  it('select atualiza na hora e grava no banco', async () => {
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))

    act(() => {
      result.current.select(1)
    })

    await settled()
    expect(useImageChoiceStore.getState().choices).toEqual({ 'cg:reverse-fly': 1 })
    expect(await db.table('imageChoice').toArray()).toEqual([
      { exerciseId: 'cg:reverse-fly', variantIndex: 1 },
    ])
  })

  it('hydrate reidrata as escolhas salvas', async () => {
    await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
    await useImageChoiceStore.getState().hydrate()
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))
    expect(result.current.selected).toBe(1)
  })

  it('escolher de novo sobrescreve', async () => {
    useImageChoiceStore.getState().select('cg:reverse-fly', 1)
    useImageChoiceStore.getState().select('cg:reverse-fly', 0)
    await settled()
    expect(await db.table('imageChoice').toArray()).toEqual([
      { exerciseId: 'cg:reverse-fly', variantIndex: 0 },
    ])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/entities/exercise-catalog/image-choice.store.test.ts`
Expected: FAIL — `Failed to resolve import "./image-choice.store"`.

- [ ] **Step 3: Implementar repo e store**

`src/entities/exercise-catalog/image-choice.repo.ts`:

```ts
import { db } from '@/shared/db'

type ImageChoiceRow = { exerciseId: string; variantIndex: number }

const table = () => db.table<ImageChoiceRow, string>('imageChoice')

export async function loadImageChoices(): Promise<Record<string, number>> {
  const rows = await table().toArray()
  return Object.fromEntries(rows.map((row) => [row.exerciseId, row.variantIndex]))
}

export async function putImageChoice(row: ImageChoiceRow): Promise<void> {
  await table().put(row)
}
```

`src/entities/exercise-catalog/image-choice.store.ts`:

```ts
import { create } from 'zustand'
import { persist } from '@/shared/db'
import { loadImageChoices, putImageChoice } from './image-choice.repo'

type ImageChoiceState = {
  choices: Record<string, number>
  hydrate: () => Promise<void>
  select: (exerciseId: string, variantIndex: number) => void
}

export const useImageChoiceStore = create<ImageChoiceState>((set, get) => ({
  choices: {},
  hydrate: async () => {
    set({ choices: await loadImageChoices() })
  },
  select: (exerciseId, variantIndex) => {
    set({ choices: { ...get().choices, [exerciseId]: variantIndex } })
    persist(putImageChoice({ exerciseId, variantIndex }))
  },
}))

/** Variante de foto escolhida para o exercício (padrão 0) e como trocá-la. */
export function useImageChoice(exerciseId: string): {
  selected: number
  select: (index: number) => void
} {
  const selected = useImageChoiceStore((state) => state.choices[exerciseId] ?? 0)
  const select = useImageChoiceStore((state) => state.select)
  return { selected, select: (index) => select(exerciseId, index) }
}
```

`src/entities/exercise-catalog/index.ts`: acrescentar ao fim:

```ts
export { useImageChoice, useImageChoiceStore } from './image-choice.store'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/entities/exercise-catalog`
Expected: PASS.

- [ ] **Step 5: Teste do bootstrap (falha) e implementação**

Em `src/app/bootstrap.test.ts`: acrescentar `import { useImageChoiceStore } from '@/entities/exercise-catalog'` aos imports e este teste ao fim do `describe`:

```ts
it('hidrata as escolhas de foto a partir do banco', async () => {
  await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
  await bootstrap()
  expect(useImageChoiceStore.getState().choices).toEqual({ 'cg:reverse-fly': 1 })
})
```

Run: `npx vitest run src/app/bootstrap.test.ts`
Expected: FAIL — `choices` vem `{}`.

Em `src/app/bootstrap.ts`: acrescentar `import { useImageChoiceStore } from '@/entities/exercise-catalog'` (ordem alfabética dos imports de entity) e incluir `useImageChoiceStore.getState().hydrate(),` dentro do `Promise.all`.

Run: `npx vitest run src/app/bootstrap.test.ts`
Expected: PASS.

- [ ] **Step 6: Testes do card com miniatura (falham)**

Em `src/modules/training/TrainingScreen.test.tsx`: acrescentar `import { useImageChoiceStore } from '@/entities/exercise-catalog'`, `waitFor`/`screen` já existem; acrescentar no `beforeEach` existente `useImageChoiceStore.setState({ choices: {} })`; e estes testes no `describe`:

```tsx
function pointer(element: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
  fireEvent(element, new MouseEvent(type, { bubbles: true, clientX }))
}

function configWith(exerciseId: string): void {
  useConfigStore.getState().replaceConfig({
    ...CONFIG_SEED,
    trainingSplit: [
      {
        weekday: 1,
        name: 'Push A',
        focus: 'Força',
        exercises: [{ exerciseId, sets: 3, reps: '8-12' }],
      },
    ],
  })
}
```

(as duas funções vão fora do `describe`, logo depois do `beforeEach`) e dentro do `describe`:

```tsx
it('mostra a miniatura da foto padrão e o nome em inglês', () => {
  configWith('cg:reverse-fly')
  const { container } = render(<TrainingScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  expect(screen.getByText('Reverse Fly')).toBeInTheDocument()
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    '/exercises/Reverse_Machine_Flyes/0.webp',
  )
})

it('arrastar a miniatura troca de foto e lembra a escolha', async () => {
  configWith('cg:reverse-fly')
  const { container } = render(<TrainingScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  const thumb = screen.getByRole('button', { name: /ampliar foto de reverse fly/i })
  pointer(thumb, 'pointerdown', 220)
  pointer(thumb, 'pointerup', 150)

  expect(container.querySelector('img')).toHaveAttribute('src', '/exercises/Reverse_Flyes/0.webp')
  await settled()
  expect(await db.table('imageChoice').toArray()).toEqual([
    { exerciseId: 'cg:reverse-fly', variantIndex: 1 },
  ])
})

it('escolha salva fora do intervalo mostra uma foto válida', () => {
  useImageChoiceStore.setState({ choices: { 'cg:reverse-fly': 5 } })
  configWith('cg:reverse-fly')
  const { container } = render(<TrainingScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  expect(container.querySelector('img')).toHaveAttribute('src', '/exercises/Reverse_Flyes/0.webp')
})

it('exercício legacy mostra o nome e o ícone neutro, sem foto', () => {
  configWith('legacy:Supino reto')
  const { container } = render(<TrainingScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

  expect(screen.getByText('Supino reto')).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/modules/training`
Expected: FAIL — `img` é `null` (o card ainda não mostra foto).

- [ ] **Step 8: Miniatura no `ExerciseCard`**

Em `src/modules/training/ui/ExerciseCard.tsx`: ajustar o import do catálogo para

```tsx
import { exerciseImages, exerciseName, useImageChoice } from '@/entities/exercise-catalog'
```

acrescentar `import { ExerciseImage } from '@/shared/ui/ExerciseImage'`, e dentro do componente, logo depois de `const [reps, setReps] = useState('')`:

```tsx
const { selected, select } = useImageChoice(exercise.exerciseId)
const name = exerciseName(exercise.exerciseId)
```

Trocar o bloco do cabeçalho do card (o `<div className="flex items-baseline justify-between gap-2">` com nome e `sets×reps`) por:

```tsx
<div className="flex items-center gap-3">
  <ExerciseImage
    variants={exerciseImages(exercise.exerciseId)}
    selected={selected}
    onSelect={select}
    alt={name}
  />
  <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
    <span className="text-graphite text-sm font-semibold">{name}</span>
    <span className="text-graphite-soft shrink-0 text-xs">
      {exercise.sets}×{exercise.reps}
    </span>
  </div>
</div>
```

- [ ] **Step 9: Rodar tudo**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 10: Commit**

```bash
git add src
git commit -m "feat: [training] - show exercise photo thumbnails with swipeable variants"
```

---

### Task 7: Documentação e verificação final

**Files:**

- Modify: `docs/padroes/05-dados-e-storage/README.md`, `docs/padroes/03-arquitetura-modular/README.md`, `CLAUDE.md`

- [ ] **Step 1: Doc 05**

Em `docs/padroes/05-dados-e-storage/README.md`:

(a) Na tabela da seção 5.1, depois da linha `meta`, acrescentar a linha (o Prettier realinha a tabela no commit):

```markdown
| `imageChoice` | `exerciseId` | `{ exerciseId, variantIndex }` — foto escolhida |
```

(b) Substituir a seção **5.3** inteira por:

```markdown
## 5.3 Versão de schema e migração

- `DB_VERSION` em `shared/db/db.ts` (hoje **2**). Toda mudança de formato persistido = nova `version(n).stores(...).upgrade(...)` dentro de `defineSchema` + teste que cria o banco na versão anterior (ver `db.test.ts`).
- A transformação de dado é **função pura** em `shared/db/migrations/` e reaproveitada pelo `upgrade`, por `importLegacyLocalStorage` e por `importAll` (backups de versão antiga).
- **v1 → v2**: exercício deixa de ser nome e vira `exerciseId` (`migrateV1toV2` + `LEGACY_NAME_MAP`). Nome fora do mapa vira `legacy:<nome>` (aparece com o nome antigo, sem foto). O mapa é **congelado**: nunca editar, só acrescentar numa migração nova.
```

(c) Acrescentar ao fim:

```markdown
## 5.6 Catálogo de exercícios

Somente leitura, vive no código (não no banco): `entities/exercise-catalog/data/catalog.json` (gerado) + `data/custom.ts` (entradas `cg:` que reaproveitam fotos do acervo). Fotos em `public/exercises/<id>/<0|1>.webp`. Para regenerar: `npm run catalog:build` (rede necessária; commit do acervo fixado no script). Só a escolha de foto por exercício (`imageChoice`) é dado do usuário.
```

- [ ] **Step 2: Doc 03 e CLAUDE.md**

Em `docs/padroes/03-arquitetura-modular/README.md`, na árvore, trocar `│   └── supplement-log/` por:

```
│   ├── supplement-log/
│   └── exercise-catalog/     # catálogo read-only: exerciseById(), exerciseName(), searchExercises(), useImageChoice()
```

Em `CLAUDE.md`, na seção **Comandos**, depois da linha `npm run typecheck`, acrescentar:

```markdown
- `npm run catalog:build` — regenera `catalog.json` e as fotos em `public/exercises/` (precisa de rede; só quando o catálogo mudar)
```

- [ ] **Step 3: Verificação final**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build`
Expected: tudo verde; `dist/exercises/` existe e `du -sh dist` mostra ~20–45 MB.

- [ ] **Step 4: Conferência no navegador (headless ou manual)**

Run: `npm run dev`, abrir no navegador com um perfil que já tenha dados v1 (ou colar o backup antigo em Ajustes → Importar):

- Treino: cada exercício mostra nome em inglês e miniatura; arrastar a miniatura de "Reverse Fly" troca a foto e a escolha sobrevive a recarregar a página.
- Ajustes: abrir um dia → tocar no nome de um exercício abre o seletor; buscar "romanian" e escolher troca o exercício mantendo séries/reps; "+ Adicionar exercício" adiciona o escolhido.
- Hoje: o treino do dia lista os nomes em inglês e "última vez" continua aparecendo para o histórico antigo.

- [ ] **Step 5: Commit**

```bash
git add docs CLAUDE.md
git commit -m "docs: [catalog] - document exercise catalog, schema v2 and catalog build script"
```

- [ ] **Step 6: Antes de abrir a PR — pedir ao usuário**

Perguntar ao usuário se pode rodar `npm run cap:sync` + build + `adb install -r` no Xiaomi (o APK cresce ~20 MB por causa das fotos; o `-r` mantém os dados e o upgrade v1 → v2 roda na primeira abertura). **Não rodar sem o OK.** Antes de instalar, pedir um backup novo (Ajustes → Exportar) como rede de segurança. Depois de instalar, o usuário confere: ficha com nomes em inglês, histórico (dois treinos de setembro) com "última vez", miniaturas, arrastar para trocar foto, seletor em Ajustes.
