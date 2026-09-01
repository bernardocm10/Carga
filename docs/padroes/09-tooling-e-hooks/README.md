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

- Base: `@eslint/js` recomendado + `typescript-eslint` (type-checked) + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`.
- **`eslint-plugin-boundaries`** aplica as regras do [doc 03 §3.2](../03-arquitetura-modular/README.md#32-regras-de-encaixe): define os elementos (`app`, `modules`, `entities`, `shared`) e proíbe import que sobe de camada, import entre `modules` irmãos, e import que não passa pelo `index.ts`.
- `--max-warnings=0` — warning é erro.

## Prettier

- Config default do projeto, commitada. Sem override por editor.
- Format on save ligado no repo (`.vscode/settings.json` commitado).

## tsconfig

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- Path alias `@/*` → `src/*` (espelhado no `vite.config.ts` e no `vitest.config.ts`).
