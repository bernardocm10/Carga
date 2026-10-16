# 06 · Testes

[↑ Índice](../README.md)

| Alvo                                           | Ferramenta              | Nível esperado                                                                  |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `modules/*/domain/`, `shared/date/`            | Vitest                  | **TDD**, cobertura alta, casos de borda explícitos                              |
| `shared/db/` (migração, legado, backup)        | Vitest + fake-indexeddb | todo `upgrade` + legado malformado + backup inválido                            |
| `entities/*/` (repo ↔ store, seleção)          | Vitest                  | round-trip persistido↔memória; mutação persiste                                 |
| Telas críticas (`today`, `weight`, `training`) | React Testing Library   | renderiza, interage, verifica o que aparece; stores mockadas                    |
| `shared/ui/` puros                             | RTL                     | só se houver lógica visual não-trivial (ex: proporção de anilha na `LoadedBar`) |
| Fluxo ponta-a-ponta no navegador               | —                       | **fora de escopo na v1**                                                        |

## Casos de borda obrigatórios

Têm que ter teste: semana incompleta, histórico vazio, lançamento retroativo de data, virada de semana, primeiro uso (storage vazio).

## TDD em `domain/`

Escreve o teste que falha, implementa o mínimo, refatora. Sem exceção nessa camada.

## Comandos

- `npm test` — watch, no dev.
- `npm run test:run` — rodada única (usado nos hooks e no CI, se houver).
- `npm run typecheck` — `tsc --noEmit`.
