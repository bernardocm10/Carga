# CLAUDE.md

Resumo operacional. Os padrões completos vivem em [`docs/padroes/`](docs/padroes/README.md); o que o app faz, em [`docs/app_arquitetura_v1.md`](docs/app_arquitetura_v1.md). **Ler o índice de padrões antes de mexer no código.**

## Stack

React web + Capacitor (`.apk` via `adb install`) · TypeScript strict · Vite · Tailwind · Zustand · localStorage atrás de camada de acesso · Recharts · Lucide · Vitest + React Testing Library.

## Arquitetura (ver [doc 03](docs/padroes/03-arquitetura-modular/README.md))

Camadas, import **só desce**:

```
app  →  modules  →  entities  →  shared
```

- `modules/*` nunca importa outro `modules/*`. Dado compartilhado entre telas vira `entity`.
- Cruzar fronteira **só pelo `index.ts`** da pasta de destino. Import profundo é erro de lint.
- **Lógica de negócio nunca em componente** — vai pra `domain/`, com **TDD** (teste primeiro).
- Aba nova = `modules/<nova>/` + 1 linha em `app/tabs.ts`.

## Comandos

- `npm run dev` — dev server
- `npm test` — testes em watch
- `npm run test:run` — rodada única (hooks/CI)
- `npm run typecheck` — `tsc --noEmit`

## Git (ver [doc 08](docs/padroes/08-git-e-commits/README.md))

- Branch por feature (`feat/<slug>`), nunca direto na `main`.
- Commit **de uma linha**: `type(scope): resumo` — imperativo, inglês, sem ponto final.
- **Sem co-authoring.** Nenhum trailer `Co-authored-by`.
- Commit granular, a cada mudança que valha salvar.
- Pre-commit roda Prettier + ESLint + testes; não commitar com suíte vermelha ou `typecheck` sujo.

## Fluxo (ver [doc 07](docs/padroes/07-fluxo-com-ia/README.md))

- Trabalho criativo passa por **brainstorming** antes do código; bug passa por **debugging sistemático**.
- **Ajuste de dado** (kcal, dose, trocar exercício) é do usuário na aba Ajustes — sem código.
- **Ajuste estrutural** (lógica, aba, gráfico, formato de dado) passa por brainstorming → implementação → commit.
- Não rodar build de release / `adb install` / deploy sem pedir antes.
