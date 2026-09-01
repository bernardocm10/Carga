# 🧱 Padrões de Desenvolvimento — v1

> Este é o **índice** dos padrões de desenvolvimento do `claudgym`.
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

*Quando estes padrões estiverem validados, o próximo passo é o plano de implementação do scaffold: Vite + TS + Tailwind + Zustand + Vitest + Husky + Capacitor, já na estrutura de pastas do doc 03.*
