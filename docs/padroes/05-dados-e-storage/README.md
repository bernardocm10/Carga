# 05 · Camada de dados e storage

[↑ Índice](../README.md)

## 5.1 Chaves

Namespaced, uma por entity, prefixo `cg:` (claudgym):

```
cg:schemaVersion      → number
cg:config             → Config
cg:weightLog          → WeightEntry[]
cg:trainingLog        → TrainingSession[]
cg:supplementLog      → Record<ISODate, string[]>
```

Nenhum arquivo fora de `shared/storage` e das `*.repo.ts` conhece essas strings.

## 5.2 Versão de schema e migração

- `shared/storage/schema.ts` exporta `SCHEMA_VERSION` (inteiro) e o shape persistido de cada chave.
- `shared/storage/migrations.ts` é uma lista ordenada `{ to: number, run(raw): raw }`.
- `app/bootstrap.ts` roda no 1º render: lê `cg:schemaVersion`, aplica as migrações pendentes em ordem, grava a versão nova.
- **Toda mudança no formato de um dado persistido** exige: bump de `SCHEMA_VERSION` + uma migração + teste da migração.

## 5.3 Falha e semente

- `kvGet<T>` faz `JSON.parse` dentro de `try/catch`. Erro, chave ausente ou shape inválido → retorna o default fornecido (para `config`, a `seed`; para os logs, `[]`/`{}`).
- Semear a Config acontece só quando `cg:config` não existe. Depois disso, o que vale é o storage — a `seed` nunca sobrescreve.

## 5.4 Backup

- `shared/storage/backup.ts`: `exportAll()` serializa as 5 chaves num JSON único; `importAll(json)` valida e regrava (rodando migração se a versão do arquivo for antiga).
- A aba **Ajustes** expõe exportar/importar. É o único mecanismo de "sync" da v1.
