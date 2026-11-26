# 🧱 Padrões de Desenvolvimento — v1

> Este é o **índice** dos padrões de desenvolvimento do **Carga**.
> Define **como** o código é escrito, organizado e versionado.
> Complementa o [`app_arquitetura_v1.md`](../app_arquitetura_v1.md), que descreve **o que** o app faz.

**Regra geral:** instrução destes docs > comportamento padrão. Se algo aqui atrapalhar, a gente atualiza o doc — não ignora em silêncio.

---

## Documentos

| #   | Doc                                                         | Assunto                                                      |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 01  | [Princípios](01-principios/README.md)                       | as 6 diretrizes que tudo abaixo obedece                      |
| 02  | [Stack técnica](02-stack-tecnica/README.md)                 | ferramentas, versões, regra de idioma                        |
| 03  | [Arquitetura modular](03-arquitetura-modular/README.md)     | camadas, regras de encaixe, pastas, aba-como-plugin          |
| 04  | [Nomenclatura e estilo](04-nomenclatura-e-estilo/README.md) | nomes de arquivo, estilo de código, estilo visual            |
| 05  | [Dados e storage](05-dados-e-storage/README.md)             | chaves `cg:*`, schema, migração, falha suave, backup         |
| 06  | [Testes](06-testes/README.md)                               | o que testar, com o quê, casos de borda obrigatórios         |
| 07  | [Fluxo com IA (Claude)](07-fluxo-com-ia/README.md)          | brainstorming, TDD, ajuste de dado vs estrutural, limites    |
| 08  | [Git e commits](08-git-e-commits/README.md)                 | branch, commit de uma linha, sem co-authoring, versionamento |
| 09  | [Tooling e git hooks](09-tooling-e-hooks/README.md)         | Husky, ESLint, Prettier, tsconfig                            |
| 10  | [`CLAUDE.md`](10-claude-md/README.md)                       | o que vive no resumo operacional da raiz                     |

---

## Estado da implementação

Scaffold montado (Vite 8 + React 19 + Tailwind v4 + Zustand 5 + Vitest 4 + Husky 9 + Capacitor 8, estrutura do doc 03). Desvios conscientes em relação aos docs, por realidade de toolchain em 2026-09:

| Doc diz                                     | Scaffold faz                                                                                    | Motivo                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `TypeScript strict` (implícito: latest)     | TS **6.0.3**, não 7.0                                                                           | `typescript-eslint` ainda tem peer `typescript <6.1`; TS 7 quebraria o lint type-aware. Bump quando o ts-eslint alcançar.           |
| ESLint base inclui `eslint-plugin-jsx-a11y` | **omitido** por ora                                                                             | peer do plugin ainda trava em ESLint 9; volta quando suportar ESLint 10.                                                            |
| `cn()` = clsx + tailwind-merge              | `cn()` sem deps (join simples)                                                                  | YAGNI (princípio 6) — entra clsx/tailwind-merge quando conflito de classe doer.                                                     |
| "import profundo é erro de lint"            | só a **camada** é travada (`boundaries/dependencies`); deep-import via non-`index.ts` ainda não | regra de entry-point do plugin foi de. na v7; migrar pro seletor de arquivo do `dependencies`. Convenção mantida por review até lá. |
| —                                           | `npm audit`: 3 moderate em `@capacitor/cli` → `xcode` → `uuid`                                  | caminho iOS-only de dev-dep; não afeta o build Android. `audit fix --force` só faz downgrade.                                       |

_Próximo: construir as fatias `weight`, `training`, `settings`, `guide` — cada uma via brainstorming → TDD no `domain/` → commit._
