# 10 · `CLAUDE.md`

[↑ Índice](../README.md)

O `CLAUDE.md` na raiz do repo é o **resumo operacional** pra IA: curto, sem duplicar conteúdo, apontando pra estes docs. Conteúdo mínimo:

- Stack em uma linha + link pra este índice e pro [`app_arquitetura_v1.md`](../../app_arquitetura_v1.md).
- As 4 camadas e a regra "import só desce, cruza fronteira só pelo `index.ts`".
- "Lógica de negócio nunca em componente — vai pra `domain/`, com TDD."
- Comandos: `npm run dev` · `npm test` · `npm run test:run` · `npm run typecheck`.
- Git: branch por feature, commit de uma linha, sem co-authoring, pre-commit roda testes.
- "Ajuste de dado é do usuário (aba Ajustes); ajuste estrutural passa por brainstorming."

O arquivo vive em `/CLAUDE.md` (raiz), não aqui em `docs/`.
