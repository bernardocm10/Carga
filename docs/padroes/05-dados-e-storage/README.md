# 05 · Camada de dados e storage

[↑ Índice](../README.md)

## 5.1 Banco

IndexedDB via **Dexie**, instância única em `src/shared/db/db.ts` (banco `claudgym`). `claudgym` é o nome legado de antes do app virar **Carga** e continua de propósito no nome do banco e no campo `app` do backup: renomear apaga os dados locais e invalida backups antigos. Só `src/shared/db/` importa `dexie` (regra de lint).

| Tabela          | Chave        | Conteúdo                                          |
| --------------- | ------------ | ------------------------------------------------- |
| `config`        | `id`         | `{ id: 'main', config: Config }`                  |
| `weightLog`     | `date`       | `WeightEntry`                                     |
| `trainingLog`   | `date`       | `TrainingSession`                                 |
| `supplementLog` | `date`       | `SupplementDay`                                   |
| `meta`          | `key`        | `{ key, value }` — ex. `importedFromLocalStorage` |
| `imageChoice`   | `exerciseId` | `{ exerciseId, variantIndex }` — foto escolhida   |

Nenhum arquivo fora de `shared/db` e dos `*.repo.ts` conhece nomes de tabela.

**Exceção:** o tema fica em `localStorage` (`cg:theme`), porque o script inline do `index.html` lê de forma síncrona antes do 1º paint.

## 5.2 Repos e stores

- Repo: funções assíncronas e granulares (`load*`, `put*`, `delete*`).
- Store Zustand: nasce vazio (ou com a semente, no caso da config), ganha `hydrate()`. Ações são síncronas para a UI: atualizam a memória e chamam `persist(promessaDeEscrita)`.
- `persist` rastreia a escrita; `settled()` espera todas — usado por testes e pelo backup.
- `app/bootstrap.ts` (async): importa o legado → hidrata todos os stores → pede `navigator.storage.persist()`. `main.tsx` só renderiza depois.

## 5.3 Versão de schema e migração

- `DB_VERSION` em `shared/db/db.ts` (hoje **2**). Toda mudança de formato persistido = nova `version(n).stores(...).upgrade(...)` dentro de `defineSchema` + teste que cria o banco na versão anterior (ver `db.test.ts`).
- A transformação de dado é **função pura** em `shared/db/migrations/` e reaproveitada pelo `upgrade`, por `importLegacyLocalStorage` e por `importAll` (backups de versão antiga).
- **v1 → v2**: exercício deixa de ser nome e vira `exerciseId` (`migrateV1toV2` + `LEGACY_NAME_MAP`). Nome fora do mapa vira `legacy:<nome>` (aparece com o nome antigo, sem foto). O mapa é **congelado**: nunca editar, só acrescentar numa migração nova.

## 5.4 Legado (localStorage)

`importLegacyLocalStorage()` copia `cg:config`, `cg:weightLog`, `cg:trainingLog`, `cg:supplementLog` para o banco **uma vez** (marca em `meta`). As chaves antigas **não são apagadas**.

## 5.5 Backup

- `exportAll()` → JSON `{ app, schemaVersion, exportedAt, config, weightLog, trainingLog, supplementLog }`.
- `importAll(json)` valida o arquivo inteiro antes de escrever (`BackupError` com mensagem pronta pra UI), recusa versão mais nova que o app e substitui config + logs numa transação. `meta` não é tocado.
- Aba **Ajustes → Backup**: exportar abre o share sheet no Android (`@capacitor/filesystem` + `@capacitor/share`) e baixa o arquivo no navegador; importar pede confirmação e recarrega o app.

## 5.6 Catálogo de exercícios

Somente leitura, vive no código (não no banco): `entities/exercise-catalog/data/catalog.json` (gerado) + `data/custom.ts` (entradas `cg:` que reaproveitam fotos do acervo). Fotos em `public/exercises/<id>/<0|1>.webp`. Para regenerar: `npm run catalog:build` (rede necessária; commit do acervo fixado no script). Só a escolha de foto por exercício (`imageChoice`) é dado do usuário.
