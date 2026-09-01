# 04 · Nomenclatura e estilo de código

[↑ Índice](../README.md)

## 4.1 Arquivos

| Tipo                 | Convenção                     | Exemplo                                |
| -------------------- | ----------------------------- | -------------------------------------- |
| Componente / tela    | `PascalCase.tsx`              | `TodayScreen.tsx`, `LoadedBar.tsx`     |
| Lógica / util / hook | `camelCase.ts`                | `weightProtocol.ts`, `useWeightLog.ts` |
| Repo de entity       | `<name>.repo.ts`              | `config.repo.ts`                       |
| Store de entity      | `<name>.store.ts`             | `weight-log.store.ts`                  |
| Teste                | co-localizado, `*.test.ts(x)` | `weightProtocol.test.ts`               |
| Barrel / fachada     | `index.ts`                    | um por `module` e por `entity`         |

Pastas de `entities` em `kebab-case` (`weight-log`). Pastas de `modules` em uma palavra (`weight`, `training`).

## 4.2 Código

- **Sem `any`.** Sem `@ts-ignore` sem comentário explicando o porquê na linha de cima.
- **`type` para dados, `interface` só quando precisa `extends`/merge.**
- Componente: função nomeada, props tipadas com `type Props`, **sem default export** (exceto onde `React.lazy` exigir).
- Componente passou de **~150 linhas** → quebrar.
- Função: pequena, early return, sem `else` depois de `return`.
- **Comentário só quando estritamente necessário**: um **porquê** não óbvio, uma decisão que evita um "conserto" errado, ou um ponteiro pra doc externa. Nunca reafirma o que o código já diz. Sem comentário-título de seção, sem JSDoc que só repete o nome da função/campo.
- Imports ordenados: externos → `@/` (aliases internos) → relativos. Linha em branco entre grupos.
- Nada de lógica assíncrona onde não precisa — `localStorage` é síncrono; a camada `repo` é síncrona.
- Strings de UI em PT-BR, inline no JSX. Sem catálogo de i18n na v1.

## 4.3 Estilo visual

- Tailwind v4 com os tokens no bloco `@theme` de `shared/styles/tokens.css`; a paleta e as 3 famílias de fonte do [`app_arquitetura_v1.md` §5](../../app_arquitetura_v1.md) são a **única** fonte de cor/tipografia. Nada de hex solto no JSX — usar as utilitárias geradas (`bg-concrete`, `text-iron`, `font-display`...).
- O `@theme` também expõe cada token como custom property (`var(--color-iron)`), para uso fora das classes (ex: SVG da `LoadedBar`, cores do Recharts).
- Cards com borda hairline, sem sombra pesada (visual chapado). O "risco visual" é gasto só na `LoadedBar`; o resto fica quieto.
