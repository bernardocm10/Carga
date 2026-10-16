# Treino v2 · PR 1 — Banco local (Dexie) + backup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o `localStorage` por IndexedDB (Dexie) em todas as entities, importar os dados atuais uma única vez e dar ao usuário exportar/importar backup — sem mudar nenhuma tela além da nova seção "Backup" em Ajustes.

**Architecture:** `src/shared/db/` concentra Dexie (instância, escrita fire-and-forget rastreada, importação do legado, backup). Os `*.repo.ts` das entities passam a ser assíncronos e granulares (`put`/`delete` por data); os stores Zustand ganham `hydrate()` e continuam com ações síncronas para a UI. `bootstrap()` vira assíncrono e o `render` só acontece depois dele.

**Tech Stack:** React 19 · TypeScript strict · Zustand 5 · Dexie `4.4.6` · fake-indexeddb `6.2.5` (testes) · `@capacitor/filesystem` `8.1.4` + `@capacitor/share` `8.0.3` (exportar no Android) · Vitest + RTL.

**Spec:** [`docs/superpowers/specs/2026-10-16-treino-v2-design.md`](../specs/2026-10-16-treino-v2-design.md) — seção 2 (PR 1). Planos da PR 2 e PR 3 serão escritos depois que a anterior for mergeada.

## Global Constraints

- Camadas: `app → modules → entities → shared`; `modules/*` nunca importa outro `modules/*`; entity não importa outra entity; cruzar fronteira só pelo `index.ts`.
- **Dexie só é importado dentro de `src/shared/db/`** (regra de lint criada na Task 1). Repos usam `db` de `@/shared/db`.
- **Tema continua no `localStorage`** (`cg:theme`) — lido de forma síncrona pelo script inline do `index.html`.
- **Chaves `cg:*` antigas nunca são apagadas** nesta PR.
- Lógica nova com **TDD** (teste primeiro, ver falhar, implementar, ver passar).
- Comentário só quando estritamente necessário; textos de teste/UI em português; identificadores em inglês.
- Commits de uma linha `type: [scope] - resumo` (inglês, imperativo, sem ponto final), **sem `Co-authored-by`**. Pre-commit roda Prettier + ESLint + testes — não commitar com suíte vermelha ou `npm run typecheck` sujo.
- Versões fixas: `dexie@4.4.6`, `fake-indexeddb@6.2.5`, `@capacitor/filesystem@8.1.4`, `@capacitor/share@8.0.3`.
- **Não rodar `npx cap sync`, build de release nem `adb install` sem pedir ao usuário.**
- Branch: `feat/treino-v2-storage`, criada a partir de `feat/treino-v2-spec` (leva o spec e este plano junto na PR).

## Review Focus

1. **Usuário com meses de dados no `localStorage` abre o app atualizado pela 1ª vez** → tudo aparece igual (peso, treinos, suplementos, config editada). Teste: `bootstrap.test.ts` "importa o legado e hidrata os stores" (Task 6, versão final).
2. **Registrar algo e exportar o backup em seguida** → o registro está no arquivo (escrita pendente não pode ficar de fora). Teste: `backup.test.ts` "export espera escritas pendentes" (Task 7).
3. **Importar arquivo errado (outro JSON, versão futura, linha sem `date`)** → mensagem clara e **dados atuais intactos**. Teste: `backup.test.ts` "rejeita sem tocar nos dados" (Task 7) + `SettingsScreen.test.tsx` "mostra o erro de backup inválido" (Task 8).
4. **Cancelar o share sheet do Android** → nenhuma mensagem de erro. Teste: `shareFile.test.ts` "cancelar o compartilhamento não é erro" (Task 8).
5. **Legado corrompido (chave não-array, item sem `date`)** → importa o que é válido, não trava o boot. Teste: `importLegacy.test.ts` "ignora legado malformado" (Task 2).

---

### Task 1: Núcleo `shared/db` (Dexie, escrita rastreada, durabilidade, lint, setup de teste)

**Files:**

- Create: `src/shared/db/db.ts`, `src/shared/db/persist.ts`, `src/shared/db/index.ts`
- Test: `src/shared/db/db.test.ts`, `src/shared/db/persist.test.ts`
- Modify: `src/test/setup.ts`, `eslint.config.ts`, `src/app/bootstrap.ts`, `package.json` (deps)

**Interfaces:**

- Produces:
  - `db: Dexie` com tabelas `config` (pk `id`), `weightLog`, `trainingLog`, `supplementLog` (pk `date`), `meta` (pk `key`)
  - `DB_VERSION = 1`, `CONFIG_ROW_ID = 'main'`
  - `persist(write: Promise<unknown>): void` — dispara e rastreia; falha → `console.error('[db] escrita falhou', error)`
  - `settled(): Promise<void>` — resolve quando todas as escritas disparadas terminarem
  - `requestPersistentStorage(): Promise<void>`

- [ ] **Step 1: Criar a branch e instalar dependências**

```bash
git checkout feat/treino-v2-spec
git checkout -b feat/treino-v2-storage
npm install dexie@4.4.6
npm install -D fake-indexeddb@6.2.5
```

- [ ] **Step 2: Escrever os testes que falham**

`src/shared/db/db.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CONFIG_ROW_ID, DB_VERSION, db } from './db'

describe('db', () => {
  it('tem as tabelas do schema v1', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'config',
      'meta',
      'supplementLog',
      'trainingLog',
      'weightLog',
    ])
    expect(DB_VERSION).toBe(1)
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
})
```

`src/shared/db/persist.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { db } from './db'
import { persist, settled } from './persist'

describe('persist', () => {
  it('settled espera a escrita disparada', async () => {
    persist(db.table('weightLog').put({ date: '2026-08-10', kg: 80 }))
    await settled()
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 80 })
  })

  it('settled sem nada pendente resolve na hora', async () => {
    await expect(settled()).resolves.toBeUndefined()
  })

  it('falha de escrita não lança e vai pro console', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    persist(Promise.reject(new Error('quota')))
    await settled()
    expect(error).toHaveBeenCalledWith('[db] escrita falhou', expect.any(Error))
    error.mockRestore()
  })
})
```

- [ ] **Step 3: Atualizar o setup de teste**

`src/test/setup.ts` (substituir inteiro):

```ts
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db, settled } from '@/shared/db'

afterEach(async () => {
  cleanup()
  await settled()
  await Promise.all(db.tables.map((table) => table.clear()))
  localStorage.clear()
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/shared/db`
Expected: FAIL — `Failed to resolve import "./db"` (e o setup falha ao importar `@/shared/db`).

- [ ] **Step 5: Implementar**

`src/shared/db/db.ts`:

```ts
import Dexie from 'dexie'

/** Versão do schema. Toda mudança de formato persistido sobe este número (ver doc 05). */
export const DB_VERSION = 1

export const CONFIG_ROW_ID = 'main'

export const db = new Dexie('claudgym')

db.version(DB_VERSION).stores({
  config: 'id',
  weightLog: 'date',
  trainingLog: 'date',
  supplementLog: 'date',
  meta: 'key',
})

/** Pede ao WebView que não despeje o banco sob pressão de espaço. Sem suporte → segue. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // sem suporte ou negado: o backup manual cobre
  }
}
```

`src/shared/db/persist.ts`:

```ts
const pending = new Set<Promise<void>>()

/** Dispara uma escrita sem bloquear a UI. Falha vai pro console; o estado em memória segue valendo. */
export function persist(write: Promise<unknown>): void {
  const tracked: Promise<void> = write
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error('[db] escrita falhou', error)
    })
    .finally(() => {
      pending.delete(tracked)
    })
  pending.add(tracked)
}

/** Resolve quando todas as escritas disparadas até agora terminarem. */
export async function settled(): Promise<void> {
  while (pending.size > 0) await Promise.all([...pending])
}
```

`src/shared/db/index.ts`:

```ts
export { CONFIG_ROW_ID, DB_VERSION, db, requestPersistentStorage } from './db'
export { persist, settled } from './persist'
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/shared/db`
Expected: PASS (5 testes).

- [ ] **Step 7: Regra de lint — Dexie só em `shared/db`**

Em `eslint.config.ts`, adicionar este bloco logo **antes** do bloco `// Tests: relax boundaries, allow deep imports`:

```ts
  // Dexie é detalhe de shared/db; o resto do app usa a API de @/shared/db
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/db/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'dexie', message: 'Dexie só dentro de src/shared/db — use @/shared/db.' },
          ],
        },
      ],
    },
  },
```

- [ ] **Step 8: Pedir armazenamento persistente no boot**

`src/app/bootstrap.ts` (substituir inteiro):

```ts
import { useConfigStore } from '@/entities/config'
import { requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render. */
export function bootstrap(): void {
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  void requestPersistentStorage()
}
```

- [ ] **Step 9: Verificar suíte inteira, typecheck e lint**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: tudo verde (os testes antigos não dependem do banco ainda).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/shared/db src/test/setup.ts eslint.config.ts src/app/bootstrap.ts
git commit -m "feat: [db] - add dexie database core with tracked writes"
```

---

### Task 2: Importação única do `localStorage` + bootstrap assíncrono

**Files:**

- Create: `src/shared/db/importLegacy.ts`, `src/app/bootstrap.test.ts`
- Test: `src/shared/db/importLegacy.test.ts`
- Modify: `src/shared/db/index.ts`, `src/app/bootstrap.ts`, `src/main.tsx`

**Interfaces:**

- Consumes: `db`, `CONFIG_ROW_ID` (Task 1); `kvGet` de `@/shared/storage`
- Produces:
  - `importLegacyLocalStorage(now?: Date): Promise<boolean>` — `true` se importou nesta chamada
  - `bootstrap(): Promise<void>`; `main.tsx` só renderiza depois dele

- [ ] **Step 1: Escrever os testes que falham**

`src/shared/db/importLegacy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { db } from './db'
import { importLegacyLocalStorage } from './importLegacy'

const NOW = new Date('2026-10-16T12:00:00.000Z')

function seedLegacy(): void {
  localStorage.setItem('cg:config', JSON.stringify({ targetCalories: 3300 }))
  localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))
  localStorage.setItem(
    'cg:trainingLog',
    JSON.stringify([{ date: '2026-08-10', dayName: 'Push A', exercises: [] }]),
  )
  localStorage.setItem(
    'cg:supplementLog',
    JSON.stringify([{ date: '2026-08-10', taken: ['Creatina'] }]),
  )
}

describe('importLegacyLocalStorage', () => {
  it('copia as 4 chaves pro banco e marca a importação', async () => {
    seedLegacy()

    expect(await importLegacyLocalStorage(NOW)).toBe(true)

    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { targetCalories: 3300 },
    })
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
    expect(await db.table('trainingLog').toArray()).toEqual([
      { date: '2026-08-10', dayName: 'Push A', exercises: [] },
    ])
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
    expect(await db.table('meta').get('importedFromLocalStorage')).toEqual({
      key: 'importedFromLocalStorage',
      value: '2026-10-16T12:00:00.000Z',
    })
  })

  it('não reimporta nem sobrescreve o banco na 2ª vez', async () => {
    seedLegacy()
    await importLegacyLocalStorage(NOW)
    await db.table('weightLog').put({ date: '2026-08-10', kg: 81 })

    expect(await importLegacyLocalStorage(NOW)).toBe(false)
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 81 })
  })

  it('mantém as chaves cg:* no localStorage', async () => {
    seedLegacy()
    await importLegacyLocalStorage(NOW)
    expect(localStorage.getItem('cg:weightLog')).not.toBeNull()
    expect(localStorage.getItem('cg:config')).not.toBeNull()
  })

  it('sem legado: marca a importação e deixa o banco vazio', async () => {
    expect(await importLegacyLocalStorage(NOW)).toBe(true)
    expect(await db.table('config').count()).toBe(0)
    expect(await db.table('weightLog').count()).toBe(0)
  })

  it('ignora legado malformado e importa o que é válido', async () => {
    localStorage.setItem('cg:weightLog', JSON.stringify({ not: 'an array' }))
    localStorage.setItem(
      'cg:supplementLog',
      JSON.stringify([{ taken: ['sem data'] }, null, { date: '2026-08-11', taken: ['Creatina'] }]),
    )
    localStorage.setItem('cg:trainingLog', '{quebrado')

    expect(await importLegacyLocalStorage(NOW)).toBe(true)
    expect(await db.table('weightLog').count()).toBe(0)
    expect(await db.table('trainingLog').count()).toBe(0)
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-11', taken: ['Creatina'] },
    ])
  })
})
```

`src/app/bootstrap.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { db } from '@/shared/db'
import { bootstrap } from './bootstrap'

describe('bootstrap', () => {
  it('importa o legado do localStorage pro banco', async () => {
    localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))
    await bootstrap()
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/shared/db/importLegacy.test.ts src/app/bootstrap.test.ts`
Expected: FAIL — `Failed to resolve import "./importLegacy"`; bootstrap: tabela vazia.

- [ ] **Step 3: Implementar**

`src/shared/db/importLegacy.ts`:

```ts
import { kvGet } from '@/shared/storage'
import { CONFIG_ROW_ID, db } from './db'

const FLAG = 'importedFromLocalStorage'

type Dated = { date: string }

function isDated(row: unknown): row is Dated {
  return typeof row === 'object' && row !== null && typeof (row as Dated).date === 'string'
}

function datedRows(key: string): Dated[] {
  const raw = kvGet<unknown>(key, [])
  return Array.isArray(raw) ? raw.filter(isDated) : []
}

/**
 * Copia os dados do localStorage pro banco, uma única vez por instalação.
 * As chaves cg:* ficam intactas como rede de segurança.
 */
export async function importLegacyLocalStorage(now = new Date()): Promise<boolean> {
  const meta = db.table<{ key: string; value: string }, string>('meta')
  return db.transaction('rw', db.tables, async () => {
    if ((await meta.get(FLAG)) !== undefined) return false

    const config = kvGet<unknown>('config', null)
    if (typeof config === 'object' && config !== null) {
      await db.table('config').put({ id: CONFIG_ROW_ID, config })
    }
    await db.table('weightLog').bulkPut(datedRows('weightLog'))
    await db.table('trainingLog').bulkPut(datedRows('trainingLog'))
    await db.table('supplementLog').bulkPut(datedRows('supplementLog'))
    await meta.put({ key: FLAG, value: now.toISOString() })
    return true
  })
}
```

`src/shared/db/index.ts` (substituir inteiro):

```ts
export { CONFIG_ROW_ID, DB_VERSION, db, requestPersistentStorage } from './db'
export { importLegacyLocalStorage } from './importLegacy'
export { persist, settled } from './persist'
```

`src/app/bootstrap.ts` (substituir inteiro):

```ts
import { useConfigStore } from '@/entities/config'
import { importLegacyLocalStorage, requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render: importa o legado e hidrata os stores. */
export async function bootstrap(): Promise<void> {
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  await importLegacyLocalStorage()
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  void requestPersistentStorage()
}
```

`src/main.tsx` (substituir inteiro):

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrap } from '@/app/bootstrap'
import { App } from '@/app/App'
import '@/shared/styles/tokens.css'

function render(): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root element not found')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
  .catch((error: unknown) => {
    console.error('[bootstrap]', error)
  })
  .finally(render)
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/shared/db src/app`
Expected: PASS.

- [ ] **Step 5: Suíte inteira + typecheck + lint**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add src/shared/db src/app/bootstrap.ts src/app/bootstrap.test.ts src/main.tsx
git commit -m "feat: [db] - import legacy localStorage data once on boot"
```

---

### Task 3: `weight-log` no banco

**Files:**

- Modify: `src/entities/weight-log/weight-log.repo.ts`, `src/entities/weight-log/weight-log.store.ts`, `src/app/bootstrap.ts`
- Test: `src/entities/weight-log/weight-log.repo.test.ts` (reescrever), `src/entities/weight-log/weight-log.store.test.ts` (novo), `src/app/bootstrap.test.ts`, `src/modules/weight/WeightScreen.test.tsx`, `src/modules/today/TodayScreen.test.tsx`

**Interfaces:**

- Consumes: `db`, `persist`, `settled` (Task 1)
- Produces:
  - repo: `loadWeightLog(): Promise<WeightEntry[]>` (ordenado por `date`), `putWeightEntry(entry): Promise<void>`, `deleteWeightEntry(date): Promise<void>`
  - store: `useWeightLogStore` com `entries` (inicial `[]`), `hydrate(): Promise<void>`, `addEntry`, `removeEntry` (assinaturas de ação inalteradas)

- [ ] **Step 1: Reescrever o teste do repo (falha)**

`src/entities/weight-log/weight-log.repo.test.ts` (substituir inteiro):

```ts
import { describe, expect, it } from 'vitest'
import { deleteWeightEntry, loadWeightLog, putWeightEntry } from './weight-log.repo'

describe('weight-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadWeightLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80.2 })
    await putWeightEntry({ date: '2026-08-08', kg: 80.0 })
    expect(await loadWeightLog()).toEqual([
      { date: '2026-08-08', kg: 80.0 },
      { date: '2026-08-10', kg: 80.2 },
    ])
  })

  it('put na mesma data sobrescreve', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80 })
    await putWeightEntry({ date: '2026-08-10', kg: 81 })
    expect(await loadWeightLog()).toEqual([{ date: '2026-08-10', kg: 81 }])
  })

  it('apaga por data', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80 })
    await deleteWeightEntry('2026-08-10')
    expect(await loadWeightLog()).toEqual([])
  })
})
```

`src/entities/weight-log/weight-log.store.test.ts` (novo):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useWeightLogStore } from './weight-log.store'

beforeEach(() => {
  useWeightLogStore.setState({ entries: [] })
})

describe('weight-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await useWeightLogStore.getState().hydrate()
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('addEntry atualiza a memória na hora e grava no banco', async () => {
    useWeightLogStore.getState().addEntry({ date: '2026-08-10', kg: 80 })
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
    await settled()
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('removeEntry apaga do banco', async () => {
    useWeightLogStore.getState().addEntry({ date: '2026-08-10', kg: 80 })
    useWeightLogStore.getState().removeEntry('2026-08-10')
    await settled()
    expect(useWeightLogStore.getState().entries).toEqual([])
    expect(await db.table('weightLog').count()).toBe(0)
  })
})
```

Acrescentar em `src/app/bootstrap.test.ts` (import no topo + novo `it` dentro do `describe`):

```ts
import { useWeightLogStore } from '@/entities/weight-log'
```

```ts
it('hidrata o store de peso a partir do banco', async () => {
  await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
  await bootstrap()
  expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/entities/weight-log src/app`
Expected: FAIL — `putWeightEntry` não exportado; `hydrate is not a function`.

- [ ] **Step 3: Implementar repo e store**

`src/entities/weight-log/weight-log.repo.ts` (substituir inteiro):

```ts
import { db } from '@/shared/db'
import type { WeightEntry } from './weight-log.types'

const table = () => db.table<WeightEntry, string>('weightLog')

export function loadWeightLog(): Promise<WeightEntry[]> {
  return table().orderBy('date').toArray()
}

export async function putWeightEntry(entry: WeightEntry): Promise<void> {
  await table().put(entry)
}

export async function deleteWeightEntry(date: string): Promise<void> {
  await table().delete(date)
}
```

`src/entities/weight-log/weight-log.store.ts` (substituir inteiro):

```ts
import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteWeightEntry, loadWeightLog, putWeightEntry } from './weight-log.repo'
import type { WeightEntry } from './weight-log.types'

type WeightLogState = {
  entries: WeightEntry[]
  hydrate: () => Promise<void>
  /** sobrescreve a entrada da mesma data */
  addEntry: (entry: WeightEntry) => void
  removeEntry: (date: string) => void
}

export const useWeightLogStore = create<WeightLogState>((set, get) => ({
  entries: [],
  hydrate: async () => {
    set({ entries: await loadWeightLog() })
  },
  addEntry: (entry) => {
    const next = [...get().entries.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    set({ entries: next })
    persist(putWeightEntry(entry))
  },
  removeEntry: (date) => {
    set({ entries: get().entries.filter((e) => e.date !== date) })
    persist(deleteWeightEntry(date))
  },
}))

export const useWeightLog = (): WeightEntry[] => useWeightLogStore((state) => state.entries)
```

`src/app/bootstrap.ts` (substituir inteiro):

```ts
import { useConfigStore } from '@/entities/config'
import { useWeightLogStore } from '@/entities/weight-log'
import { importLegacyLocalStorage, requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render: importa o legado e hidrata os stores. */
export async function bootstrap(): Promise<void> {
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  await importLegacyLocalStorage()
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  await Promise.all([useWeightLogStore.getState().hydrate()])
  void requestPersistentStorage()
}
```

- [ ] **Step 4: Ajustar os testes de tela que liam `cg:weightLog`**

`src/modules/weight/WeightScreen.test.tsx`: trocar o import do vitest e o `beforeEach`, e a asserção final do 2º teste.

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useWeightLogStore } from '@/entities/weight-log'
import { db, settled } from '@/shared/db'
import { WeightScreen } from './WeightScreen'

beforeEach(() => {
  useWeightLogStore.setState({ entries: [] })
})
```

```ts
await settled()
expect(await db.table('weightLog').toArray()).toEqual([expect.objectContaining({ kg: 80.5 })])
```

`src/modules/today/TodayScreen.test.tsx`: adicionar `import { db, settled } from '@/shared/db'` e, no teste "registra o peso de hoje pelo atalho", trocar as duas linhas do `stored` por:

```ts
await settled()
expect(await db.table('weightLog').toArray()).toEqual([{ date: today, kg: 63.8 }])
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add src/entities/weight-log src/app src/modules/weight src/modules/today
git commit -m "refactor: [weight-log] - persist weight entries in the database"
```

---

### Task 4: `supplement-log` no banco

**Files:**

- Modify: `src/entities/supplement-log/supplement-log.repo.ts`, `src/entities/supplement-log/supplement-log.store.ts`, `src/app/bootstrap.ts`
- Test: `src/entities/supplement-log/supplement-log.repo.test.ts` (reescrever), `src/entities/supplement-log/supplement-log.store.test.ts` (novo), `src/app/bootstrap.test.ts`, `src/modules/today/TodayScreen.test.tsx`

**Interfaces:**

- Consumes: `db`, `persist`, `settled`
- Produces:
  - repo: `loadSupplementLog(): Promise<SupplementDay[]>`, `putSupplementDay(day): Promise<void>`, `deleteSupplementDay(date): Promise<void>`
  - store: `useSupplementLogStore` com `days` (inicial `[]`), `hydrate()`, `toggle(date, name)` (inalterado)

- [ ] **Step 1: Testes (falham)**

`src/entities/supplement-log/supplement-log.repo.test.ts` (substituir inteiro):

```ts
import { describe, expect, it } from 'vitest'
import { deleteSupplementDay, loadSupplementLog, putSupplementDay } from './supplement-log.repo'

describe('supplement-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadSupplementLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putSupplementDay({ date: '2026-08-10', taken: ['Creatina'] })
    await putSupplementDay({ date: '2026-08-08', taken: ['Creatina', 'Pré-treino'] })
    expect((await loadSupplementLog()).map((d) => d.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('apaga por data', async () => {
    await putSupplementDay({ date: '2026-08-10', taken: ['Creatina'] })
    await deleteSupplementDay('2026-08-10')
    expect(await loadSupplementLog()).toEqual([])
  })
})
```

`src/entities/supplement-log/supplement-log.store.test.ts` (novo):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useSupplementLogStore } from './supplement-log.store'

beforeEach(() => {
  useSupplementLogStore.setState({ days: [] })
})

describe('supplement-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
    await useSupplementLogStore.getState().hydrate()
    expect(useSupplementLogStore.getState().days).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
  })

  it('toggle marca e grava o dia', async () => {
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    await settled()
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
  })

  it('desmarcar o último apaga o dia do banco', async () => {
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    await settled()
    expect(useSupplementLogStore.getState().days).toEqual([])
    expect(await db.table('supplementLog').count()).toBe(0)
  })
})
```

Acrescentar em `src/app/bootstrap.test.ts`:

```ts
import { useSupplementLogStore } from '@/entities/supplement-log'
```

```ts
it('hidrata o store de suplementos a partir do banco', async () => {
  await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
  await bootstrap()
  expect(useSupplementLogStore.getState().days).toEqual([
    { date: '2026-08-10', taken: ['Creatina'] },
  ])
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/entities/supplement-log src/app`
Expected: FAIL — `putSupplementDay` não exportado; `hydrate is not a function`.

- [ ] **Step 3: Implementar**

`src/entities/supplement-log/supplement-log.repo.ts` (substituir inteiro):

```ts
import { db } from '@/shared/db'
import type { SupplementDay } from './supplement-log.types'

const table = () => db.table<SupplementDay, string>('supplementLog')

export function loadSupplementLog(): Promise<SupplementDay[]> {
  return table().orderBy('date').toArray()
}

export async function putSupplementDay(day: SupplementDay): Promise<void> {
  await table().put(day)
}

export async function deleteSupplementDay(date: string): Promise<void> {
  await table().delete(date)
}
```

`src/entities/supplement-log/supplement-log.store.ts` (substituir inteiro):

```ts
import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteSupplementDay, loadSupplementLog, putSupplementDay } from './supplement-log.repo'
import type { SupplementDay } from './supplement-log.types'

type SupplementLogState = {
  days: SupplementDay[]
  hydrate: () => Promise<void>
  /** alterna um suplemento na data; cria/remove o registro do dia conforme necessário */
  toggle: (date: string, name: string) => void
}

function byDate(a: SupplementDay, b: SupplementDay): number {
  return a.date.localeCompare(b.date)
}

export const useSupplementLogStore = create<SupplementLogState>((set, get) => ({
  days: [],
  hydrate: async () => {
    set({ days: await loadSupplementLog() })
  },
  toggle: (date, name) => {
    const days = get().days
    const current = days.find((d) => d.date === date) ?? { date, taken: [] }
    const taken = current.taken.includes(name)
      ? current.taken.filter((n) => n !== name)
      : [...current.taken, name]
    const rest = days.filter((d) => d.date !== date)
    if (taken.length > 0) {
      const day = { date, taken }
      set({ days: [...rest, day].sort(byDate) })
      persist(putSupplementDay(day))
    } else {
      set({ days: rest })
      persist(deleteSupplementDay(date))
    }
  },
}))

/** referência estável pro caso "nenhum suplemento nessa data" — evita loop de render no seletor */
const NONE: string[] = []

/** Suplementos marcados como tomados numa data. */
export const useTakenOn = (date: string): string[] =>
  useSupplementLogStore((state) => state.days.find((d) => d.date === date)?.taken ?? NONE)
```

Em `src/app/bootstrap.ts`: adicionar `import { useSupplementLogStore } from '@/entities/supplement-log'` e trocar a linha do `Promise.all` por:

```ts
await Promise.all([
  useWeightLogStore.getState().hydrate(),
  useSupplementLogStore.getState().hydrate(),
])
```

- [ ] **Step 4: Ajustar `TodayScreen.test.tsx`**

No teste "marca um suplemento e persiste na data de hoje", trocar as duas linhas do `stored` por:

```ts
await settled()
expect(await db.table('supplementLog').toArray()).toEqual([{ date: today, taken: ['Creatina'] }])
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add src/entities/supplement-log src/app src/modules/today
git commit -m "refactor: [supplement-log] - persist supplement days in the database"
```

---

### Task 5: `training-log` no banco

**Files:**

- Modify: `src/entities/training-log/training-log.repo.ts`, `src/entities/training-log/training-log.store.ts`, `src/app/bootstrap.ts`
- Test: `src/entities/training-log/training-log.repo.test.ts` (reescrever), `src/entities/training-log/training-log.store.test.ts` (novo), `src/app/bootstrap.test.ts`, `src/modules/training/TrainingScreen.test.tsx`

**Interfaces:**

- Consumes: `db`, `persist`, `settled`
- Produces:
  - repo: `loadTrainingLog(): Promise<TrainingSession[]>`, `putSession(session): Promise<void>`, `deleteSession(date): Promise<void>`
  - store: `useTrainingLogStore` com `sessions` (inicial `[]`), `hydrate()`, `logSet`, `removeSet`, `removeSession` (assinaturas inalteradas)

- [ ] **Step 1: Testes (falham)**

`src/entities/training-log/training-log.repo.test.ts` (substituir inteiro):

```ts
import { describe, expect, it } from 'vitest'
import { deleteSession, loadTrainingLog, putSession } from './training-log.repo'

describe('training-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadTrainingLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putSession({ date: '2026-08-10', dayName: 'Pull A', exercises: [] })
    await putSession({ date: '2026-08-08', dayName: 'Push A', exercises: [] })
    expect((await loadTrainingLog()).map((s) => s.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('apaga por data', async () => {
    await putSession({ date: '2026-08-10', dayName: 'Pull A', exercises: [] })
    await deleteSession('2026-08-10')
    expect(await loadTrainingLog()).toEqual([])
  })
})
```

`src/entities/training-log/training-log.store.test.ts` (novo):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useTrainingLogStore } from './training-log.store'

beforeEach(() => {
  useTrainingLogStore.setState({ sessions: [] })
})

describe('training-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
    await useTrainingLogStore.getState().hydrate()
    expect(useTrainingLogStore.getState().sessions).toEqual([
      { date: '2026-08-10', dayName: 'Push A', exercises: [] },
    ])
  })

  it('logSet grava a sessão do dia', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 42, reps: 5 })
    await settled()
    expect(await db.table('trainingLog').toArray()).toEqual([
      {
        date: '2026-08-10',
        dayName: 'Push A',
        exercises: [
          {
            name: 'Supino',
            sets: [
              { weight: 40, reps: 6 },
              { weight: 42, reps: 5 },
            ],
          },
        ],
      },
    ])
  })

  it('removeSet da última série apaga a sessão do banco', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Supino', 0)
    await settled()
    expect(useTrainingLogStore.getState().sessions).toEqual([])
    expect(await db.table('trainingLog').count()).toBe(0)
  })

  it('removeSet com outras séries regrava a sessão', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Remada', { weight: 30, reps: 8 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Supino', 0)
    await settled()
    expect(await db.table('trainingLog').get('2026-08-10')).toEqual({
      date: '2026-08-10',
      dayName: 'Push A',
      exercises: [{ name: 'Remada', sets: [{ weight: 30, reps: 8 }] }],
    })
  })

  it('removeSession apaga do banco', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSession('2026-08-10')
    await settled()
    expect(await db.table('trainingLog').count()).toBe(0)
  })
})
```

Acrescentar em `src/app/bootstrap.test.ts`:

```ts
import { useTrainingLogStore } from '@/entities/training-log'
```

```ts
it('hidrata o store de treino a partir do banco', async () => {
  await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
  await bootstrap()
  expect(useTrainingLogStore.getState().sessions).toEqual([
    { date: '2026-08-10', dayName: 'Push A', exercises: [] },
  ])
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/entities/training-log src/app`
Expected: FAIL — `putSession` não exportado; `hydrate is not a function`.

- [ ] **Step 3: Implementar**

`src/entities/training-log/training-log.repo.ts` (substituir inteiro):

```ts
import { db } from '@/shared/db'
import type { TrainingSession } from './training-log.types'

const table = () => db.table<TrainingSession, string>('trainingLog')

export function loadTrainingLog(): Promise<TrainingSession[]> {
  return table().orderBy('date').toArray()
}

export async function putSession(session: TrainingSession): Promise<void> {
  await table().put(session)
}

export async function deleteSession(date: string): Promise<void> {
  await table().delete(date)
}
```

`src/entities/training-log/training-log.store.ts` (substituir inteiro):

```ts
import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteSession, loadTrainingLog, putSession } from './training-log.repo'
import type { LoggedSet, TrainingSession } from './training-log.types'

type TrainingLogState = {
  sessions: TrainingSession[]
  hydrate: () => Promise<void>
  logSet: (date: string, dayName: string, exerciseName: string, set: LoggedSet) => void
  removeSet: (date: string, exerciseName: string, index: number) => void
  removeSession: (date: string) => void
}

function byDate(a: TrainingSession, b: TrainingSession): number {
  return a.date.localeCompare(b.date)
}

export const useTrainingLogStore = create<TrainingLogState>((set, get) => ({
  sessions: [],
  hydrate: async () => {
    set({ sessions: await loadTrainingLog() })
  },
  logSet: (date, dayName, exerciseName, newSet) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date) ?? { date, dayName, exercises: [] }
    const hasExercise = current.exercises.some((e) => e.name === exerciseName)
    const exercises = hasExercise
      ? current.exercises.map((e) =>
          e.name === exerciseName ? { ...e, sets: [...e.sets, newSet] } : e,
        )
      : [...current.exercises, { name: exerciseName, sets: [newSet] }]
    const updated = { ...current, exercises }
    set({ sessions: [...sessions.filter((s) => s.date !== date), updated].sort(byDate) })
    persist(putSession(updated))
  },
  removeSet: (date, exerciseName, index) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date)
    if (current === undefined) return
    const exercises = current.exercises
      .map((e) =>
        e.name === exerciseName ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e,
      )
      .filter((e) => e.sets.length > 0)
    const rest = sessions.filter((s) => s.date !== date)
    if (exercises.length === 0) {
      set({ sessions: rest })
      persist(deleteSession(date))
      return
    }
    const updated = { ...current, exercises }
    set({ sessions: [...rest, updated].sort(byDate) })
    persist(putSession(updated))
  },
  removeSession: (date) => {
    set({ sessions: get().sessions.filter((s) => s.date !== date) })
    persist(deleteSession(date))
  },
}))

export const useTrainingLog = (): TrainingSession[] =>
  useTrainingLogStore((state) => state.sessions)
```

Em `src/app/bootstrap.ts`: adicionar `import { useTrainingLogStore } from '@/entities/training-log'` e incluir `useTrainingLogStore.getState().hydrate(),` dentro do `Promise.all`.

- [ ] **Step 4: Ajustar `TrainingScreen.test.tsx`**

Adicionar `import { db, settled } from '@/shared/db'` e trocar a linha `const stored: unknown = JSON.parse(localStorage.getItem('cg:trainingLog') ?? '[]')` por:

```ts
await settled()
const stored: unknown = await db.table('trainingLog').toArray()
```

(a asserção `expect(stored).toEqual([...])` logo abaixo fica igual).

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add src/entities/training-log src/app src/modules/training
git commit -m "refactor: [training-log] - persist training sessions in the database"
```

---

### Task 6: `config` no banco (fecha o bootstrap)

**Files:**

- Modify: `src/entities/config/config.repo.ts`, `src/entities/config/config.store.ts`, `src/app/bootstrap.ts`
- Test: `src/entities/config/config.repo.test.ts` (novo), `src/entities/config/config.store.test.ts` (novo), `src/app/bootstrap.test.ts`, `src/modules/settings/SettingsScreen.test.tsx`

**Interfaces:**

- Consumes: `db`, `CONFIG_ROW_ID`, `persist`, `settled`
- Produces:
  - repo: `loadConfig(): Promise<Config>` (semeia `CONFIG_SEED` se ausente), `saveConfig(config): Promise<void>`
  - store: `useConfigStore` com `config` (inicial `CONFIG_SEED`), `hydrate()`, `updateConfig`, `replaceConfig` (inalterados)
  - `bootstrap()` final: importa legado → hidrata os 4 stores em paralelo → pede persistência

- [ ] **Step 1: Testes (falham)**

`src/entities/config/config.repo.test.ts` (novo):

```ts
import { describe, expect, it } from 'vitest'
import { db } from '@/shared/db'
import { loadConfig, saveConfig } from './config.repo'
import { CONFIG_SEED } from './seed'

describe('config repo', () => {
  it('sem config salva devolve a semente e grava no banco', async () => {
    expect(await loadConfig()).toEqual(CONFIG_SEED)
    expect(await db.table('config').get('main')).toEqual({ id: 'main', config: CONFIG_SEED })
  })

  it('com config salva devolve o que está salvo', async () => {
    await saveConfig({ ...CONFIG_SEED, targetCalories: 3300 })
    expect((await loadConfig()).targetCalories).toBe(3300)
  })
})
```

`src/entities/config/config.store.test.ts` (novo):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { CONFIG_SEED } from './seed'
import { useConfigStore } from './config.store'

beforeEach(() => {
  useConfigStore.setState({ config: CONFIG_SEED })
})

describe('config store', () => {
  it('hydrate carrega a config salva', async () => {
    await db.table('config').put({ id: 'main', config: { ...CONFIG_SEED, targetCalories: 3300 } })
    await useConfigStore.getState().hydrate()
    expect(useConfigStore.getState().config.targetCalories).toBe(3300)
  })

  it('updateConfig aplica o patch e grava', async () => {
    useConfigStore.getState().updateConfig({ targetCalories: 3400 })
    expect(useConfigStore.getState().config.targetCalories).toBe(3400)
    await settled()
    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { ...CONFIG_SEED, targetCalories: 3400 },
    })
  })
})
```

Em `src/app/bootstrap.test.ts`, adicionar import e **substituir** o 1º teste ("importa o legado do localStorage pro banco") por esta versão, que cobre o item 1 do Review Focus:

```ts
import { useConfigStore } from '@/entities/config'
```

```ts
it('importa o legado e hidrata os stores', async () => {
  localStorage.setItem(
    'cg:config',
    JSON.stringify({ ...useConfigStore.getState().config, targetCalories: 3300 }),
  )
  localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))

  await bootstrap()

  expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  expect(useConfigStore.getState().config.targetCalories).toBe(3300)
  expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/entities/config src/app`
Expected: FAIL — `loadConfig()` devolve objeto síncrono / `hydrate is not a function`.

- [ ] **Step 3: Implementar**

`src/entities/config/config.repo.ts` (substituir inteiro):

```ts
import { CONFIG_ROW_ID, db } from '@/shared/db'
import { CONFIG_SEED } from './seed'
import type { Config } from './config.types'

type ConfigRow = { id: string; config: Config }

const table = () => db.table<ConfigRow, string>('config')

/** Na primeira vez (sem linha salva) grava a semente e a devolve; daí em diante, o que está salvo. */
export async function loadConfig(): Promise<Config> {
  const row = await table().get(CONFIG_ROW_ID)
  if (row !== undefined) return row.config
  await table().put({ id: CONFIG_ROW_ID, config: CONFIG_SEED })
  return CONFIG_SEED
}

export async function saveConfig(config: Config): Promise<void> {
  await table().put({ id: CONFIG_ROW_ID, config })
}
```

`src/entities/config/config.store.ts` (substituir inteiro):

```ts
import { create } from 'zustand'
import { persist } from '@/shared/db'
import { loadConfig, saveConfig } from './config.repo'
import { CONFIG_SEED } from './seed'
import type { Config } from './config.types'

type ConfigState = {
  config: Config
  hydrate: () => Promise<void>
  /** aplica um patch raso e persiste */
  updateConfig: (patch: Partial<Config>) => void
  /** substitui a Config inteira e persiste */
  replaceConfig: (config: Config) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: CONFIG_SEED,
  hydrate: async () => {
    set({ config: await loadConfig() })
  },
  updateConfig: (patch) => {
    const next = { ...get().config, ...patch }
    set({ config: next })
    persist(saveConfig(next))
  },
  replaceConfig: (config) => {
    set({ config })
    persist(saveConfig(config))
  },
}))

/** Hook de leitura — a Config atual. */
export const useConfig = (): Config => useConfigStore((state) => state.config)
```

`src/app/bootstrap.ts` (substituir inteiro):

```ts
import { useConfigStore } from '@/entities/config'
import { useSupplementLogStore } from '@/entities/supplement-log'
import { useTrainingLogStore } from '@/entities/training-log'
import { useWeightLogStore } from '@/entities/weight-log'
import { importLegacyLocalStorage, requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render: importa o legado e hidrata os stores. */
export async function bootstrap(): Promise<void> {
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  await importLegacyLocalStorage()
  await Promise.all([
    useConfigStore.getState().hydrate(),
    useWeightLogStore.getState().hydrate(),
    useSupplementLogStore.getState().hydrate(),
    useTrainingLogStore.getState().hydrate(),
  ])
  void requestPersistentStorage()
}
```

- [ ] **Step 4: Ajustar `SettingsScreen.test.tsx`**

Trocar o helper `storedConfig` e o import, e adicionar `await` em cada uso (linhas com `storedConfig()`):

```ts
import { CONFIG_ROW_ID, db, settled } from '@/shared/db'
```

```ts
async function storedConfig(): Promise<Config> {
  await settled()
  const row = await db.table<{ id: string; config: Config }, string>('config').get(CONFIG_ROW_ID)
  if (row === undefined) throw new Error('config não gravada')
  return row.config
}
```

Usos:

```ts
expect((await storedConfig()).macros.protein).toBe(185)
```

```ts
const monday = (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)
```

```ts
expect((await storedConfig()).trainingSplit.find((day) => day.weekday === 1)?.exercises).toEqual([])
```

Se o último uso estiver dentro de um callback de `waitFor`, tornar o callback `async` (`await waitFor(async () => { ... })`).

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 6: Conferir no navegador**

Run: `npm run dev`, abrir no navegador, registrar um peso, recarregar a página. Expected: o peso continua lá; DevTools → Application → IndexedDB → `claudgym` → `weightLog` tem a linha; `localStorage` ainda tem as chaves `cg:*` antigas.

- [ ] **Step 7: Commit**

```bash
git add src/entities/config src/app src/modules/settings
git commit -m "refactor: [config] - persist config in the database and hydrate all stores on boot"
```

---

### Task 7: Backup — `exportAll` / `importAll`

**Files:**

- Create: `src/shared/db/backup.ts`
- Test: `src/shared/db/backup.test.ts`
- Modify: `src/shared/db/index.ts`

**Interfaces:**

- Consumes: `db`, `DB_VERSION`, `CONFIG_ROW_ID`, `settled`, `persist`
- Produces:
  - `type BackupFile = { app: 'claudgym'; schemaVersion: number; exportedAt: string; config: object; weightLog: Dated[]; trainingLog: Dated[]; supplementLog: Dated[] }`
  - `class BackupError extends Error` — mensagem pronta pra UI
  - `exportAll(now?: Date): Promise<string>` — JSON indentado; espera escritas pendentes
  - `importAll(json: string): Promise<void>` — valida tudo antes de escrever; substitui `config` + 3 logs numa transação; não toca em `meta`

- [ ] **Step 1: Testes (falham)**

`src/shared/db/backup.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BackupError, exportAll, importAll } from './backup'
import { db } from './db'
import { persist } from './persist'

const NOW = new Date('2026-10-16T12:00:00.000Z')

async function seed(): Promise<void> {
  await db.table('config').put({ id: 'main', config: { targetCalories: 3150 } })
  await db.table('weightLog').bulkPut([
    { date: '2026-08-10', kg: 80 },
    { date: '2026-08-08', kg: 79.5 },
  ])
  await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
  await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
}

async function snapshot() {
  return {
    config: await db.table('config').toArray(),
    weightLog: await db.table('weightLog').toArray(),
    trainingLog: await db.table('trainingLog').toArray(),
    supplementLog: await db.table('supplementLog').toArray(),
  }
}

describe('exportAll', () => {
  it('serializa cabeçalho, config e logs ordenados', async () => {
    await seed()
    const file = JSON.parse(await exportAll(NOW)) as Record<string, unknown>
    expect(file).toEqual({
      app: 'claudgym',
      schemaVersion: 1,
      exportedAt: '2026-10-16T12:00:00.000Z',
      config: { targetCalories: 3150 },
      weightLog: [
        { date: '2026-08-08', kg: 79.5 },
        { date: '2026-08-10', kg: 80 },
      ],
      trainingLog: [{ date: '2026-08-10', dayName: 'Push A', exercises: [] }],
      supplementLog: [{ date: '2026-08-10', taken: ['Creatina'] }],
    })
  })

  it('export espera escritas pendentes', async () => {
    await seed()
    persist(db.table('weightLog').put({ date: '2026-08-12', kg: 80.4 }))
    const file = JSON.parse(await exportAll(NOW)) as { weightLog: Array<{ date: string }> }
    expect(file.weightLog.map((e) => e.date)).toContain('2026-08-12')
  })
})

describe('importAll', () => {
  it('round-trip: exportar, apagar e importar devolve o mesmo banco', async () => {
    await seed()
    const before = await snapshot()
    const json = await exportAll(NOW)
    await Promise.all(db.tables.map((table) => table.clear()))

    await importAll(json)

    expect(await snapshot()).toEqual(before)
  })

  it('substitui: linhas que não estão no backup somem', async () => {
    await seed()
    const json = await exportAll(NOW)
    await db.table('weightLog').put({ date: '2026-09-01', kg: 82 })

    await importAll(json)

    expect(await db.table('weightLog').get('2026-09-01')).toBeUndefined()
  })

  it('não toca no meta', async () => {
    await seed()
    await db.table('meta').put({ key: 'importedFromLocalStorage', value: 'x' })
    await importAll(await exportAll(NOW))
    expect(await db.table('meta').get('importedFromLocalStorage')).toEqual({
      key: 'importedFromLocalStorage',
      value: 'x',
    })
  })

  it.each([
    ['JSON inválido', '{quebrado', 'O arquivo não é um JSON válido.'],
    ['outro app', JSON.stringify({ app: 'outro' }), 'Esse arquivo não é um backup do claudgym.'],
    [
      'versão futura',
      JSON.stringify({ app: 'claudgym', schemaVersion: 99 }),
      'Backup de uma versão mais nova do app — atualize o app antes de importar.',
    ],
    [
      'sem config',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        weightLog: [],
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup incompleto: falta a config.',
    ],
    [
      'log que não é lista',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        config: {},
        weightLog: {},
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup inválido: weightLog.',
    ],
    [
      'linha sem date',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        config: {},
        weightLog: [{ kg: 80 }],
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup inválido: weightLog.',
    ],
  ])('rejeita sem tocar nos dados: %s', async (_case, json, message) => {
    await seed()
    const before = await snapshot()

    await expect(importAll(json)).rejects.toThrow(new BackupError(message))

    expect(await snapshot()).toEqual(before)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/shared/db/backup.test.ts`
Expected: FAIL — `Failed to resolve import "./backup"`.

- [ ] **Step 3: Implementar**

`src/shared/db/backup.ts`:

```ts
import { CONFIG_ROW_ID, DB_VERSION, db } from './db'
import { settled } from './persist'

type Dated = { date: string }

const LOG_TABLES = ['weightLog', 'trainingLog', 'supplementLog'] as const

export type BackupFile = {
  app: 'claudgym'
  schemaVersion: number
  exportedAt: string
  config: object
  weightLog: Dated[]
  trainingLog: Dated[]
  supplementLog: Dated[]
}

export class BackupError extends Error {
  override name = 'BackupError'
}

function isDatedList(value: unknown): value is Dated[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => typeof row === 'object' && row !== null && typeof (row as Dated).date === 'string',
    )
  )
}

function parseBackup(json: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new BackupError('O arquivo não é um JSON válido.')
  }
  const file = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<
    Record<keyof BackupFile, unknown>
  >
  if (file.app !== 'claudgym') throw new BackupError('Esse arquivo não é um backup do claudgym.')
  if (typeof file.schemaVersion !== 'number') {
    throw new BackupError('Esse arquivo não é um backup do claudgym.')
  }
  if (file.schemaVersion > DB_VERSION) {
    throw new BackupError(
      'Backup de uma versão mais nova do app — atualize o app antes de importar.',
    )
  }
  if (typeof file.config !== 'object' || file.config === null) {
    throw new BackupError('Backup incompleto: falta a config.')
  }
  for (const name of LOG_TABLES) {
    if (!isDatedList(file[name])) throw new BackupError(`Backup inválido: ${name}.`)
  }
  return file as BackupFile
}

/** Serializa todos os dados do usuário (sem o meta). Espera as escritas pendentes. */
export async function exportAll(now = new Date()): Promise<string> {
  await settled()
  const configRow = await db
    .table<{ id: string; config: object }, string>('config')
    .get(CONFIG_ROW_ID)
  const file: BackupFile = {
    app: 'claudgym',
    schemaVersion: DB_VERSION,
    exportedAt: now.toISOString(),
    config: configRow?.config ?? {},
    weightLog: await db.table<Dated, string>('weightLog').orderBy('date').toArray(),
    trainingLog: await db.table<Dated, string>('trainingLog').orderBy('date').toArray(),
    supplementLog: await db.table<Dated, string>('supplementLog').orderBy('date').toArray(),
  }
  return JSON.stringify(file, null, 2)
}

/** Valida o arquivo inteiro e só então substitui config + logs numa transação. */
export async function importAll(json: string): Promise<void> {
  const file = parseBackup(json)
  await settled()
  const tables = [db.table('config'), ...LOG_TABLES.map((name) => db.table(name))]
  await db.transaction('rw', tables, async () => {
    await db.table('config').put({ id: CONFIG_ROW_ID, config: file.config })
    for (const name of LOG_TABLES) {
      await db.table(name).clear()
      await db.table(name).bulkPut(file[name])
    }
  })
}
```

`src/shared/db/index.ts` (substituir inteiro):

```ts
export { BackupError, exportAll, importAll, type BackupFile } from './backup'
export { CONFIG_ROW_ID, DB_VERSION, db, requestPersistentStorage } from './db'
export { importLegacyLocalStorage } from './importLegacy'
export { persist, settled } from './persist'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/shared/db && npm run typecheck && npm run lint`
Expected: verde. (Se `toThrow(new BackupError(...))` comparar só a mensagem — comportamento padrão do Vitest — está correto; não trocar por `toThrowError(BackupError)` sozinho, que perderia a checagem da mensagem.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/db
git commit -m "feat: [db] - add backup export and validated import"
```

---

### Task 8: Seção "Backup" em Ajustes (share sheet no Android, download no navegador)

**Files:**

- Create: `src/shared/lib/shareFile.ts`, `src/shared/lib/readFileText.ts`, `src/shared/lib/reloadApp.ts`, `src/modules/settings/ui/BackupSection.tsx`
- Test: `src/shared/lib/shareFile.test.ts`, `src/modules/settings/SettingsScreen.test.tsx`
- Modify: `src/modules/settings/SettingsScreen.tsx`, `package.json`

**Interfaces:**

- Consumes: `exportAll`, `importAll`, `BackupError` (Task 7); `toISODate` de `@/shared/date/week`; `Button` de `@/shared/ui/Button`; `Section` de `@/shared/ui/Page`
- Produces:
  - `shareTextFile(filename: string, text: string): Promise<void>` — nativo: grava em `Directory.Cache` e abre o share sheet; navegador: download via `<a download>`; cancelamento do share = sucesso silencioso
  - `readFileText(file: File): Promise<string>` — via `FileReader`
  - `reloadApp(): void`
  - `<BackupSection />` com botões "Exportar backup" e "Importar backup"

- [ ] **Step 1: Instalar plugins Capacitor**

```bash
npm install @capacitor/filesystem@8.1.4 @capacitor/share@8.0.3
```

(`npx cap sync android` **não** é rodado aqui — fica para quando o usuário pedir o build. O `android/app/src/main/res/xml/file_paths.xml` já tem `<cache-path>`, exigido pelo Share.)

- [ ] **Step 2: Testes de `shareTextFile` (falham)**

`src/shared/lib/shareFile.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareTextFile } from './shareFile'

// vi.mock é içado pro topo do arquivo; os mocks precisam nascer junto via vi.hoisted
const { isNativePlatform, writeFile, share } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  writeFile: vi.fn(() => Promise.resolve({ uri: 'file:///cache/backup.json' })),
  share: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share } }))

afterEach(() => {
  vi.clearAllMocks()
  isNativePlatform.mockReturnValue(false)
})

describe('shareTextFile', () => {
  it('no Android grava no cache e abre o share sheet', async () => {
    isNativePlatform.mockReturnValue(true)
    await shareTextFile('backup.json', '{}')
    expect(writeFile).toHaveBeenCalledWith({
      path: 'backup.json',
      data: '{}',
      directory: 'CACHE',
      encoding: 'utf8',
    })
    expect(share).toHaveBeenCalledWith({
      title: 'backup.json',
      files: ['file:///cache/backup.json'],
    })
  })

  it('cancelar o compartilhamento não é erro', async () => {
    isNativePlatform.mockReturnValue(true)
    share.mockRejectedValueOnce(new Error('Share canceled'))
    await expect(shareTextFile('backup.json', '{}')).resolves.toBeUndefined()
  })

  it('outra falha do share propaga', async () => {
    isNativePlatform.mockReturnValue(true)
    share.mockRejectedValueOnce(new Error('No activity found'))
    await expect(shareTextFile('backup.json', '{}')).rejects.toThrow('No activity found')
  })

  it('no navegador baixa via link', async () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await shareTextFile('backup.json', '{}')

    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
    expect(writeFile).not.toHaveBeenCalled()
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/shared/lib/shareFile.test.ts`
Expected: FAIL — `Failed to resolve import "./shareFile"`.

- [ ] **Step 4: Implementar os helpers**

`src/shared/lib/shareFile.ts`:

```ts
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function isCancel(error: unknown): boolean {
  return error instanceof Error && /cancel/i.test(error.message)
}

/** Entrega um arquivo de texto ao usuário: share sheet no Android, download no navegador. */
export async function shareTextFile(filename: string, text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    try {
      await Share.share({ title: filename, files: [uri] })
    } catch (error) {
      if (!isCancel(error)) throw error
    }
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

`src/shared/lib/readFileText.ts`:

```ts
/** Lê um arquivo escolhido pelo usuário como texto UTF-8. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('falha ao ler o arquivo'))
    reader.readAsText(file)
  })
}
```

`src/shared/lib/reloadApp.ts`:

```ts
/** Recarrega o app inteiro — o bootstrap reidrata tudo a partir do banco. */
export function reloadApp(): void {
  window.location.reload()
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/shared/lib`
Expected: PASS.

- [ ] **Step 6: Testes de tela da seção Backup (falham)**

Em `src/modules/settings/SettingsScreen.test.tsx`, acrescentar `vi` ao import existente do vitest (`import { beforeEach, describe, expect, it, vi } from 'vitest'`), `exportAll` ao import de `@/shared/db` criado na Task 6 (`import { CONFIG_ROW_ID, db, exportAll, settled } from '@/shared/db'`) e, depois dos imports:

```ts
import { shareTextFile } from '@/shared/lib/shareFile'
import { reloadApp } from '@/shared/lib/reloadApp'

vi.mock('@/shared/lib/shareFile', () => ({ shareTextFile: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/lib/reloadApp', () => ({ reloadApp: vi.fn() }))

function backupFile(json: string): File {
  return new File([json], 'backup.json', { type: 'application/json' })
}
```

E um novo `describe` no fim do arquivo:

```ts
describe('SettingsScreen · backup', () => {
  it('exporta o backup com nome datado', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /exportar backup/i }))

    await waitFor(() => expect(shareTextFile).toHaveBeenCalledOnce())
    const [filename, text] = vi.mocked(shareTextFile).mock.calls[0] ?? []
    expect(filename).toMatch(/^claudgym-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(JSON.parse(text ?? '{}')).toMatchObject({ app: 'claudgym', schemaVersion: 1 })
  })

  it('importa um backup válido depois de confirmar e recarrega', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({ ...CONFIG_SEED, targetCalories: 3500 })
    const json = await exportAll()
    useConfigStore.getState().replaceConfig(CONFIG_SEED)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsScreen />)

    await user.upload(screen.getByLabelText(/importar backup/i), backupFile(json))

    await waitFor(() => expect(reloadApp).toHaveBeenCalledOnce())
    expect((await storedConfig()).targetCalories).toBe(3500)
  })

  it('não importa se o usuário cancelar a confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<SettingsScreen />)

    await user.upload(
      screen.getByLabelText(/importar backup/i),
      backupFile(JSON.stringify({ app: 'outro' })),
    )

    expect(reloadApp).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra o erro de backup inválido e não recarrega', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsScreen />)

    await user.upload(
      screen.getByLabelText(/importar backup/i),
      backupFile(JSON.stringify({ app: 'outro' })),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esse arquivo não é um backup do claudgym.',
    )
    expect(reloadApp).not.toHaveBeenCalled()
  })
})
```

Adicionar também ao `beforeEach` existente do arquivo: `vi.clearAllMocks()` e `vi.restoreAllMocks()` (nessa ordem: `vi.restoreAllMocks(); vi.clearAllMocks()`), para os `spyOn(window, 'confirm')` não vazarem entre testes.

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/modules/settings`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name /exportar backup/i`.

- [ ] **Step 8: Implementar a seção**

`src/modules/settings/ui/BackupSection.tsx`:

```tsx
import { useRef, useState, type ChangeEvent } from 'react'
import { BackupError, exportAll, importAll } from '@/shared/db'
import { toISODate } from '@/shared/date/week'
import { readFileText } from '@/shared/lib/readFileText'
import { reloadApp } from '@/shared/lib/reloadApp'
import { shareTextFile } from '@/shared/lib/shareFile'
import { Button } from '@/shared/ui/Button'
import { Section } from '@/shared/ui/Page'

export function BackupSection() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const exportBackup = async () => {
    setError(null)
    try {
      await shareTextFile(`claudgym-backup-${toISODate(new Date())}.json`, await exportAll())
    } catch (cause) {
      console.error('[backup] export', cause)
      setError('Não foi possível exportar o backup.')
    }
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    if (!window.confirm('Importar substitui todos os dados atuais pelos do backup. Continuar?')) {
      return
    }
    setError(null)
    try {
      await importAll(await readFileText(file))
      reloadApp()
    } catch (cause) {
      if (cause instanceof BackupError) {
        setError(cause.message)
        return
      }
      console.error('[backup] import', cause)
      setError('Não foi possível importar o backup.')
    }
  }

  return (
    <Section label="backup">
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void exportBackup()}>
          Exportar backup
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => fileInput.current?.click()}>
          Importar backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label="Importar backup"
          className="hidden"
          onChange={(event) => void importBackup(event)}
        />
      </div>
      {error !== null && (
        <p role="alert" className="text-rust mt-2 text-sm">
          {error}
        </p>
      )}
    </Section>
  )
}
```

Em `src/modules/settings/SettingsScreen.tsx`: adicionar `import { BackupSection } from './ui/BackupSection'` e renderizar `<BackupSection />` logo depois de `<AppearanceSection />`.

Observação: o `getByLabelText(/importar backup/i)` dos testes casa com o `<input aria-label>` (o botão tem o mesmo texto mas não é `label` de nada); se o RTL reclamar de múltiplos elementos, trocar nos testes por `screen.getByLabelText('Importar backup', { selector: 'input' })`.

- [ ] **Step 9: Rodar e ver passar**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: verde.

- [ ] **Step 10: Conferir no navegador**

Run: `npm run dev` → Ajustes → **Exportar backup** baixa `claudgym-backup-AAAA-MM-DD.json`; editar `targetCalories` no app; **Importar backup** com o arquivo baixado → confirma → app recarrega com o valor do arquivo. Importar um `.json` qualquer → mensagem "Esse arquivo não é um backup do claudgym." e nada muda.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/shared/lib src/modules/settings
git commit -m "feat: [settings] - add backup export and import section"
```

---

### Task 9: Documentação e verificação final

**Files:**

- Modify: `docs/padroes/05-dados-e-storage/README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-10-16-treino-v2-design.md`

- [ ] **Step 1: Reescrever o doc 05**

`docs/padroes/05-dados-e-storage/README.md` (substituir inteiro):

```markdown
# 05 · Camada de dados e storage

[↑ Índice](../README.md)

## 5.1 Banco

IndexedDB via **Dexie**, instância única em `src/shared/db/db.ts` (banco `claudgym`). Só `src/shared/db/` importa `dexie` (regra de lint).

| Tabela          | Chave  | Conteúdo                                          |
| --------------- | ------ | ------------------------------------------------- |
| `config`        | `id`   | `{ id: 'main', config: Config }`                  |
| `weightLog`     | `date` | `WeightEntry`                                     |
| `trainingLog`   | `date` | `TrainingSession`                                 |
| `supplementLog` | `date` | `SupplementDay`                                   |
| `meta`          | `key`  | `{ key, value }` — ex. `importedFromLocalStorage` |

Nenhum arquivo fora de `shared/db` e dos `*.repo.ts` conhece nomes de tabela.

**Exceção:** o tema fica em `localStorage` (`cg:theme`), porque o script inline do `index.html` lê de forma síncrona antes do 1º paint.

## 5.2 Repos e stores

- Repo: funções assíncronas e granulares (`load*`, `put*`, `delete*`).
- Store Zustand: nasce vazio (ou com a semente, no caso da config), ganha `hydrate()`. Ações são síncronas para a UI: atualizam a memória e chamam `persist(promessaDeEscrita)`.
- `persist` rastreia a escrita; `settled()` espera todas — usado por testes e pelo backup.
- `app/bootstrap.ts` (async): importa o legado → hidrata todos os stores → pede `navigator.storage.persist()`. `main.tsx` só renderiza depois.

## 5.3 Versão de schema e migração

- `DB_VERSION` em `shared/db/db.ts`. Toda mudança de formato persistido = nova `db.version(n).stores(...).upgrade(...)` + teste.
- A transformação de dado do `upgrade` é escrita como **função pura** e reaproveitada pelo `importAll` para backups de versão antiga.

## 5.4 Legado (localStorage)

`importLegacyLocalStorage()` copia `cg:config`, `cg:weightLog`, `cg:trainingLog`, `cg:supplementLog` para o banco **uma vez** (marca em `meta`). As chaves antigas **não são apagadas**.

## 5.5 Backup

- `exportAll()` → JSON `{ app, schemaVersion, exportedAt, config, weightLog, trainingLog, supplementLog }`.
- `importAll(json)` valida o arquivo inteiro antes de escrever (`BackupError` com mensagem pronta pra UI), recusa versão mais nova que o app e substitui config + logs numa transação. `meta` não é tocado.
- Aba **Ajustes → Backup**: exportar abre o share sheet no Android (`@capacitor/filesystem` + `@capacitor/share`) e baixa o arquivo no navegador; importar pede confirmação e recarrega o app.
```

- [ ] **Step 2: Atualizar `CLAUDE.md` e o spec**

Em `CLAUDE.md`, linha da Stack: trocar `localStorage atrás de camada de acesso` por `IndexedDB (Dexie) atrás de repos`.

No spec, seção **2.5 Backup**, trocar a frase do botão Exportar por:

```markdown
Aba **Ajustes** ganha seção "Backup": **Exportar** (no Android grava em cache e abre o share sheet — `@capacitor/filesystem` + `@capacitor/share`, pois o WebView não trata `<a download>` de blob; no navegador, download via `<a download>`) e **Importar** (`<input type="file">`, com confirmação "isso substitui todos os dados").
```

- [ ] **Step 3: Verificação final**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build`
Expected: tudo verde; `build` gera `dist/` sem erro.

- [ ] **Step 4: Commit**

```bash
git add docs CLAUDE.md
git commit -m "docs: [db] - document dexie storage, legacy import and backup"
```

- [ ] **Step 5: Antes de abrir a PR — pedir ao usuário**

Perguntar ao usuário se pode rodar `npm run cap:sync` + build/instalação no celular para testar o share sheet de verdade (plugins nativos novos). **Não rodar sem o OK.** Depois da instalação, o usuário exporta o backup e o envia para conferência do mapa nome → id (pré-requisito da PR 2).
