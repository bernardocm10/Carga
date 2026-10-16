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
