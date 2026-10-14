# Treino v2 — banco local, catálogo de exercícios e treino personalizado

Data: 2026-10-16 · Status: aprovado

## 1. Objetivo

Três mudanças encadeadas, entregues em 3 PRs independentes:

1. **Banco local** — sair do `localStorage` para IndexedDB (Dexie), com backup exportável.
2. **Catálogo de exercícios** — exercício vira entidade com id, nome em inglês e foto (free-exercise-db), com migração do histórico.
3. **Treino personalizado por data** — montar/alterar o treino de um dia específico, com estatísticas **previsto × feito** ao vivo.

### O que foi decidido na conversa

- O treino personalizado vale **só para a data**; a ficha semanal não muda.
- Imagens vêm do **free-exercise-db** (Unlicense; ~876 exercícios, 2 fotos cada: início e fim). Quem providencia é o desenvolvimento, não o usuário.
- App continua **offline, sem conta, sem nuvem**. Rede só em tempo de desenvolvimento (script de catálogo).
- Estatísticas: **séries e volume (Σ séries × reps × kg)**, **previsto e feito sempre lado a lado**.
- Na UI, **kg fica colado nas reps** (`3 × 8-12 · 40 kg`, `40 kg × 8`).
- **Nenhuma imagem desenhada**: só fotos do acervo. Quando há mais de uma foto plausível, o exercício guarda todas como variantes e **arrastar a imagem para o lado troca de foto**.
- Ao personalizar: escolher entre **partir do treino do dia** ou **começar do zero**.
- Adicionar exercício escolhe da **ficha + catálogo inteiro**; nomes de **exercícios em inglês** (os do acervo). Nomes dos **dias** continuam em português.

### Fora do escopo (specs futuros)

- Dashboards.
- Refresh de design (inclui foto na aba Hoje).
- Séries por grupo muscular (o dado `primaryMuscles` já vem no catálogo, mas não é usado aqui).
- Reordenar exercícios no treino personalizado.
- Salvar um treino personalizado como modelo reutilizável.

---

## 2. PR 1 — Troca de storage (sem mudança visível)

### 2.1 Banco

`shared/db/` exporta uma instância Dexie (`db`) com as tabelas:

| Tabela          | Chave primária  | Conteúdo                                          |
| --------------- | --------------- | ------------------------------------------------- |
| `config`        | `id` (`'main'`) | `Config`                                          |
| `weightLog`     | `date`          | `WeightEntry`                                     |
| `trainingLog`   | `date`          | `TrainingSession`                                 |
| `supplementLog` | `date`          | `SupplementDay`                                   |
| `meta`          | `key`           | `{ key, value }` — ex. `importedFromLocalStorage` |

- Só `shared/db` e os `*.repo.ts` importam Dexie (regra de lint em `eslint-plugin-boundaries`).
- **Tema continua no `localStorage`**: o script inline do `index.html` precisa lê-lo de forma síncrona antes do 1º paint.

### 2.2 Repos e stores

- Repos passam a ser assíncronos (`load*(): Promise<T>`) e com escrita granular (`put` de uma sessão/entrada, `delete` por data) em vez de regravar o array inteiro.
- Stores Zustand nascem com estado vazio e ganham `hydrate(): Promise<void>`.
- Ações continuam síncronas para a UI: atualizam a memória e disparam a persistência em seguida. Falha de escrita segue a política atual (não derruba a UI), mas passa a `console.error`.
- `bootstrap()` vira `async`: importa do `localStorage` se preciso (2.3), roda os `hydrate()` em paralelo, chama `navigator.storage.persist()` (ignorando falha) e só então `main.tsx` faz o `render`.

### 2.3 Importação única do localStorage

No bootstrap, se `meta.importedFromLocalStorage` não existe:

1. Lê `cg:config`, `cg:weightLog`, `cg:trainingLog`, `cg:supplementLog` via `kvGet`.
2. Grava tudo numa única transação Dexie (config ausente → semente).
3. Grava `meta.importedFromLocalStorage = <ISO datetime>`.

As chaves `cg:*` **não são apagadas** — ficam como rede de segurança.

### 2.4 Versionamento

O versionamento do Dexie (`db.version(n).stores(...).upgrade(tx => ...)`) substitui o `migrations.ts` previsto no doc 05. Toda mudança de formato persistido = nova `version` + `upgrade` + teste. O doc [`05-dados-e-storage`](../../padroes/05-dados-e-storage/README.md) é atualizado nesta PR.

### 2.5 Backup

`shared/db/backup.ts`:

- `exportAll(): Promise<string>` — JSON `{ schemaVersion, exportedAt, config, weightLog, trainingLog, supplementLog }`.
- `importAll(json): Promise<void>` — valida shape mínimo, recusa `schemaVersion` maior que o do app, substitui as tabelas numa transação e reidrata os stores. Arquivo de versão antiga é aceito e passa pelas mesmas funções de `upgrade` (extraídas como funções puras para isso).

Aba **Ajustes** ganha seção "Backup": **Exportar** (download do `.json` via `<a download>`; no Android o WebView salva em Downloads) e **Importar** (`<input type="file">`, com confirmação "isso substitui todos os dados").

### 2.6 Testes

- `fake-indexeddb/auto` no setup do Vitest; `db.delete()` + `db.open()` em `beforeEach`.
- Repos: round-trip, ordenação, tabela vazia.
- Importação do localStorage: importa, não reimporta, não apaga `cg:*`, semeia config ausente.
- Backup: round-trip export → import; recusa versão futura; recusa JSON inválido.
- Testes de tela existentes passam a aguardar o `hydrate` (helper de render).

---

## 3. PR 2 — Catálogo, fotos, nomes em inglês e migração

### 3.1 Entidade `entities/exercise-catalog`

```ts
/** um conjunto de fotos de um exercício do acervo: [início, fim] */
type ImageVariant = { sourceId: string; images: string[] }

type CatalogExercise = {
  /** id do free-exercise-db (ex. "Hammer_Curls") ou "cg:<slug>" para os próprios */
  id: string
  /** nome em inglês */
  name: string
  primaryMuscles: string[]
  equipment: string | null
  /** ≥ 1 variante; a primeira é a padrão. Vazio só para `legacy:` */
  variants: ImageVariant[]
}
```

- `data/catalog.json`: gerado pelo script (3.2), só os campos acima (~200 KB). Exercício do acervo tem uma variante: as próprias fotos.
- `data/custom.ts`: exercícios próprios com prefixo `cg:` (ver 3.5). **Não têm foto própria**: as variantes apontam para fotos de exercícios do acervo. Nada é desenhado.
- API pública (`index.ts`): tipos, `exerciseById(id): CatalogExercise | undefined`, `exerciseName(id): string`, `searchExercises(query, priorityIds): CatalogExercise[]`, `imageUrl(path): string`, e o store `useImageChoice` (3.6).
- `searchExercises` (TDD): busca sem acento e sem caixa por substring no nome; ids em `priorityIds` (os da ficha) primeiro; limite de 50 resultados.
- `exerciseName` para id `legacy:<nome>` devolve `<nome>`; para id desconhecido devolve o próprio id.
- Catálogo é **somente leitura e vive no código**. Exercício novo fora do acervo = ajuste estrutural (pedir ao desenvolvimento), sempre reaproveitando fotos do acervo.

### 3.2 Fotos

`scripts/catalog/build-catalog.mjs` (rodado manualmente, não no build):

1. Baixa `dist/exercises.json` e as imagens do free-exercise-db (commit fixado no script).
2. Converte cada JPG para **WebP, 400 px de largura, qualidade ~70** (`sharp`, devDependency).
3. Grava `public/exercises/<id>/<0|1>.webp` e `src/entities/exercise-catalog/data/catalog.json`.

Estimativa: ~1.750 imagens × ~12 KB ≈ 20 MB, versionados no git. Tudo offline no app.

### 3.3 Formato de dados (Dexie versão 2)

```ts
// entities/config
type Exercise = { exerciseId: string; sets: number; reps: string }

// entities/training-log
type LoggedExercise = { exerciseId: string; sets: LoggedSet[] }
```

Tabela nova `imageChoice` (chave `exerciseId`): `{ exerciseId, variantIndex }` — qual variante de foto o usuário deixou selecionada.

`lastLoadForExercise` e `todayWorkout` passam a comparar por `exerciseId`. A UI resolve o nome via `exerciseName`.

### 3.4 Migração nome → id

`upgrade` da versão 2, função pura `migrateV1toV2(snapshot, legacyNameMap)`:

- Converte `config.trainingSplit[].exercises[].name` e `trainingLog[].exercises[].name` usando `legacyNameMap` (3.5).
- Nome sem mapeamento → `legacy:<nome original>` (aparece com o nome antigo, sem foto; histórico preservado).
- Ordem obrigatória antes de rodar em produção: usuário exporta backup (PR 1) → desenvolvimento lê o backup e confere que o mapa cobre **todo** nome presente no histórico, incluindo exercícios que já saíram da ficha → ajusta o mapa se preciso.

### 3.5 Mapa da ficha atual

Regra: quando um exercício da ficha corresponde a **um** exercício do acervo, usa o id do acervo. Quando corresponde a **vários** (variações que o usuário alterna, ou equipamento indiferente) ou a **nenhum** exato, vira uma entrada `cg:` com nome próprio em inglês e as fotos do acervo como variantes (troca arrastando para o lado).

**Um para um (acervo):**

| Nome atual (pt)                | id                                      | Nome exibido (en)                     |
| ------------------------------ | --------------------------------------- | ------------------------------------- |
| Abdominal Infra                | `Reverse_Crunch`                        | Reverse Crunch                        |
| Abdominal Supra                | `Crunches`                              | Crunches                              |
| Agachamento hack               | `Hack_Squat`                            | Hack Squat                            |
| Cadeira extensora              | `Leg_Extensions`                        | Leg Extensions                        |
| Elevação de pernas na barra    | `Hanging_Leg_Raise`                     | Hanging Leg Raise                     |
| Elevação pélvica               | `Barbell_Hip_Thrust`                    | Barbell Hip Thrust                    |
| Leg press                      | `Leg_Press`                             | Leg Press                             |
| Mesa flexora                   | `Lying_Leg_Curls`                       | Lying Leg Curls                       |
| Mesa flexora sentado           | `Seated_Leg_Curl`                       | Seated Leg Curl                       |
| Panturrilha em pé              | `Standing_Calf_Raises`                  | Standing Calf Raises                  |
| Panturrilha sentado            | `Seated_Calf_Raise`                     | Seated Calf Raise                     |
| Puxada unilateral na polia     | `One_Arm_Lat_Pulldown`                  | One Arm Lat Pulldown                  |
| Remada baixa ao quadril        | `Seated_Cable_Rows`                     | Seated Cable Rows                     |
| Rosca inclinada com halteres   | `Incline_Dumbbell_Curl`                 | Incline Dumbbell Curl                 |
| Rosca martelo                  | `Hammer_Curls`                          | Hammer Curls                          |
| Rosca scott                    | `Preacher_Curl`                         | Preacher Curl                         |
| Supino inclinado com halteres  | `Incline_Dumbbell_Press`                | Incline Dumbbell Press                |
| Supino inclinado máquina/Smith | `Smith_Machine_Incline_Bench_Press`     | Smith Machine Incline Bench Press     |
| Terra romeno                   | `Romanian_Deadlift`                     | Romanian Deadlift                     |
| Tríceps corda                  | `Triceps_Pushdown_-_Rope_Attachment`    | Triceps Pushdown - Rope Attachment    |
| Tríceps francês na polia       | `Cable_Rope_Overhead_Triceps_Extension` | Cable Rope Overhead Triceps Extension |

**Entradas próprias (`cg:`) com variantes do acervo** (a primeira é a padrão):

| Nome atual (pt)             | id                         | Nome exibido (en)      | Variantes de foto                                                                              |
| --------------------------- | -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| Agachamento búlgaro         | `cg:bulgarian-split-squat` | Bulgarian Split Squat  | `Split_Squat_with_Dumbbells`, `One_Leg_Barbell_Squat`, `Smith_Single-Leg_Split_Squat`          |
| Barra fixa / puxada alta    | `cg:pullup-lat-pulldown`   | Pull-up / Lat Pulldown | `Pullups`, `Wide-Grip_Lat_Pulldown`                                                            |
| Crucifixo inverso           | `cg:reverse-fly`           | Reverse Fly            | `Reverse_Machine_Flyes`, `Reverse_Flyes`                                                       |
| Elevação lateral na polia   | `cg:cable-lateral-raise`   | Cable Lateral Raise    | `Standing_Low-Pulley_Deltoid_Raise`, `Cable_Seated_Lateral_Raise`                              |
| Remada com apoio no peito   | `cg:chest-supported-row`   | Chest-Supported Row    | `Dumbbell_Incline_Row`, `Lying_T-Bar_Row`                                                      |
| Elevação lateral na máquina | `cg:machine-lateral-raise` | Machine Lateral Raise  | `Seated_Side_Lateral_Raise`, `Side_Lateral_Raise` _(aproximadas: acervo não tem a máquina)_    |
| Serrátil na polia           | `cg:cable-serratus`        | Cable Serratus         | `Straight-Arm_Pulldown`, `Rope_Straight-Arm_Pulldown` _(aproximadas: acervo não tem serrátil)_ |

Nota: variantes são **só visuais**. Alternar entre máquina e halteres no mesmo exercício mantém um histórico de carga único; se um dia fizer sentido separar, vira dois exercícios (ajuste estrutural).

### 3.6 UI

Entity não exporta componente (doc 03), então:

- `shared/ui/SearchPicker` — sheet com campo de busca e lista; recebe `items`, `onQuery`, `renderItem`, `onPick`. Genérico, sem saber de exercício.
- `shared/ui/ExerciseImage` — recebe `variants: string[][]`, `selected`, `onSelect`, `alt`.
  - Miniatura mostra a foto de início da variante selecionada; com mais de uma variante, mostra pontinhos indicadores.
  - **Arrastar para o lado** (pointer events, limiar ~40 px, sem biblioteca) troca de variante, na miniatura e na vista ampliada.
  - Toque abre ampliada alternando início/fim a cada ~1 s.
  - Sem variantes (`legacy:`) → ícone neutro (Lucide `Dumbbell`).
- `useImageChoice` (store em `exercise-catalog`, persistido na tabela `imageChoice`): lembra a variante escolhida por exercício; padrão 0.
- **Treino**: `ExerciseCard` ganha a miniatura à esquerda do nome.
- **Ajustes**: "adicionar exercício" em `TrainingDayEditor` deixa de ser texto livre e abre o `SearchPicker` ligado a `searchExercises`. Trocar exercício também usa o picker.

### 3.7 Testes

- `searchExercises`: acento/caixa, prioridade da ficha, limite.
- `exerciseName`: catálogo, `cg:`, `legacy:`, desconhecido.
- `custom.ts`: toda variante aponta para um id existente no `catalog.json` (teste de integridade).
- `migrateV1toV2`: ficha e histórico convertidos; nome sem mapa vira `legacy:`; idempotência (rodar sobre dado já v2 não muda nada).
- `upgrade` Dexie v1 → v2 com dados reais de exemplo.
- `useImageChoice`: padrão 0, persiste e reidrata.
- `ExerciseImage`: arrasto além do limiar troca variante e chama `onSelect`; arrasto curto não troca; uma variante só não mostra indicadores.
- Tela: picker em Ajustes adiciona exercício pelo id; card de Treino mostra miniatura e nome em inglês.

---

## 4. PR 3 — Treino personalizado por data

### 4.1 Dado

O plano personalizado mora **dentro da sessão da data**, em `entities/training-log`:

```ts
type PlannedExercise = { exerciseId: string; sets: number; reps: string }

type TrainingSession = {
  date: string
  /** nome do dia da ficha no momento (inalterado) */
  dayName: string
  /** presente só quando o treino da data foi personalizado */
  plan?: PlannedExercise[]
  exercises: LoggedExercise[]
}
```

`PlannedExercise` é estruturalmente igual a `Exercise` da Config — sem import entre entities.

Campo opcional novo não exige migração de dado (ausente = não personalizado), mas o backup passa a carregá-lo.

Regras (selectors em `training-log`, TDD):

- `plannedExercises(fichaDoDia, session)` → `session.plan ?? fichaDoDia`.
- `plan: []` ≠ sem plano: personalizado e vazio, **não** cai para a ficha.
- Lista exibida = plano **∪** exercícios com série registrada na data que não estão no plano (marcados "fora do plano"). Série registrada nunca some da tela.
- `removeSet` só apaga a sessão se ficar sem séries **e** sem `plan`.

Ações novas no store: `startCustomPlan(date, dayName, from: PlannedExercise[])`, `updatePlan(date, plan)`, `clearPlan(date)`.

### 4.2 Fluxo (aba Treino)

1. Abaixo de "nome do dia · foco", botão **Treino personalizado**.
2. Toque abre escolha: **Partir do treino de <dia>** (copia a ficha) / **Começar do zero** (`plan: []`). Em dia de descanso, só "Começar do zero" (vai direto, sem escolha).
3. Com plano ativo:
   - selo **personalizado** ao lado do nome do dia;
   - cada exercício tem × (remover) e séries/reps editáveis na linha;
   - **+ adicionar exercício** abre o `SearchPicker` (ficha primeiro, depois catálogo); entra no fim com `3 × 8-12` como padrão editável;
   - **voltar à ficha** com confirmação → `clearPlan`; séries registradas permanecem.
4. Registrar séries funciona igual a hoje, por exercício.

### 4.3 Estatísticas ao vivo

Painel fixo no topo da lista, previsto e feito lado a lado:

```
PREVISTO            FEITO
18 séries           7 séries   ▓▓▓▓░░░░░░
~9.400 kg           3.200 kg
```

`modules/training/domain/workoutStats.ts` (TDD):

- `repsMidpoint(reps: string): number | null` — `"8-12"` → 10, `"10"` → 10, `"6-10"` → 8, não numérico → `null`.
- **Séries previstas** = Σ `sets` do plano exibido.
- **Volume previsto** = Σ `sets × repsMidpoint × lastLoad.topSet.weight` (última sessão anterior à data). Exercício sem histórico ou com reps `null` fica fora e conta em `missingEstimate` ("2 sem histórico"). Exibido com `~` e arredondado para dezena.
- **Séries feitas** = contagem das séries registradas na data.
- **Volume feito** = Σ `weight × reps` das séries registradas.
- Barra = séries feitas / previstas (limitada a 100%).
- Previsto 0 (plano vazio) → painel mostra "adicione exercícios".

### 4.4 Kg junto das reps

- Meta no card: `3 × 8-12 · 40 kg` (kg = topo da última vez; sem histórico, sem o trecho de kg).
- Chips de série: `40 kg × 8`.

### 4.5 Aba Hoje

`todayWorkout` passa a usar `plannedExercises` para a data de hoje. Tira semanal inalterada.

### 4.6 Testes

- `plannedExercises`, regra de união com "fora do plano", `removeSet` com plano.
- `repsMidpoint`, `workoutStats` (com/sem histórico, reps não numéricas, plano vazio).
- Tela: partir da ficha; começar do zero; adicionar pelo picker e ver o painel mudar; registrar série e ver "feito" mudar; voltar à ficha mantendo séries; dia de descanso.
- Hoje: mostra o plano personalizado quando existe.

---

## 5. Riscos

| Risco                                                     | Mitigação                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Migração nome → id perde histórico                        | Backup obrigatório antes; conferência do mapa contra o backup real; fallback `legacy:`; chaves `cg:*` antigas preservadas |
| WebView despeja o IndexedDB                               | `navigator.storage.persist()`; backup manual                                                                              |
| Foto aproximada em 2 exercícios sem equivalente no acervo | Marcadas no mapa; trocar quando aparecer foto melhor                                                                      |
| APK ~20 MB maior                                          | Aceito para app pessoal; alternativa (só fotos da ficha + download sob demanda) descartada por complexidade               |
| Procedência das fotos do acervo não documentada           | Uso pessoal, sem distribuição; rever antes de qualquer publicação                                                         |
| Hidratação assíncrona causa flash vazio                   | `render` só após `bootstrap()`; fundo do `index.html` cobre o intervalo                                                   |
