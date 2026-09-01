# 09 · Tooling e git hooks

[↑ Índice](../README.md)

## Husky

| Hook | Roda | Objetivo |
|---|---|---|
| **pre-commit** | `lint-staged` → Prettier + ESLint nos arquivos staged; depois `npm run test:run` | não deixa entrar código malformatado, com erro de lint, ou que quebra teste |
| **pre-push** | `npm run typecheck` + `npm run test:run` (suíte inteira) | barra push com tipo quebrado ou regressão |

`lint-staged` (no `package.json`):

```jsonc
"lint-staged": {
  "*.{ts,tsx}": ["prettier --write", "eslint --fix --max-warnings=0"],
  "*.{json,css,md}": ["prettier --write"]
}
```

## ESLint

- Base: `@eslint/js` recomendado + `typescript-eslint` (type-checked) + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`. (`eslint-plugin-jsx-a11y` volta quando suportar ESLint 10 — ver "Estado da implementação" no índice.)
- **`eslint-plugin-boundaries`** (regra `boundaries/dependencies` + `eslint-import-resolver-typescript` pro alias `@/`) aplica o [doc 03 §3.2](../03-arquitetura-modular/README.md#32-regras-de-encaixe): elementos `app` / `module` / `entity` / `shared` / `root`, import só desce, `module` não importa `module` irmão, `entity` não importa `entity` irmã. Falta travar deep-import por non-`index.ts` (pendente da migração do entry-point).
- `--max-warnings=0` no `lint-staged` — warning é erro.

## Prettier

- Config default do projeto, commitada. Sem override por editor.
- Format on save ligado no repo (`.vscode/settings.json` commitado).

## tsconfig

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `erasableSyntaxOnly: true`. Solution tsconfig com refs pra `tsconfig.app.json` (browser) e `tsconfig.node.json` (config files).
- Path alias `@/*` → `src/*` (no `tsconfig.app.json` e espelhado no `resolve.alias` do `vite.config.ts`; a config do Vitest vive dentro do próprio `vite.config.ts`).
