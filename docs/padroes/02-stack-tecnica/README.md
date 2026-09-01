# 02 · Stack técnica

[↑ Índice](../README.md)

| Área | Escolha | Observação |
|---|---|---|
| Invólucro | React web + **Capacitor** → `.apk` | instalado no device via `adb install` / depuração USB |
| Linguagem | **TypeScript** (`strict: true`) | sem `any`; `type` para dados, `interface` só com `extends` |
| Build / dev | **Vite** | path alias `@/` → `src/` |
| Estilo | **Tailwind v4** (CSS-first) | paleta "logbook" e fontes no `@theme` de `shared/styles/tokens.css`; plugin `@tailwindcss/vite`, sem `tailwind.config` |
| Estado | **Zustand** | um store por `entity`; sem store global monolítico |
| Persistência | **localStorage** atrás de uma camada de acesso | chaves namespaced, versão de schema, migração, export/import |
| Gráfico | **Recharts** | só na fatia `weight` |
| Ícones | **Lucide** | |
| Testes | **Vitest** + **React Testing Library** | lógica de domínio via TDD; telas críticas via RTL; sem E2E |
| Lint / format | **ESLint** + **Prettier** | config commitada, format on save |
| Git hooks | **Husky** + **lint-staged** | pre-commit e pre-push (ver docs [08](../08-git-e-commits/README.md) e [09](../09-tooling-e-hooks/README.md)) |

## Idioma

- Identificadores, tipos e campos persistidos em **inglês**.
- Strings visíveis ao usuário em **PT-BR**, inline (sem lib de i18n na v1).
- Vocabulário de domínio fica em inglês mesmo quando a UI mostra outra coisa: `push`, `pull`, `legs`, `sets`, `reps`, `load`, `split`, `supplement`.
