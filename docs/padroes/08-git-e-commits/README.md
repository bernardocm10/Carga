# 08 · Git e commits

[↑ Índice](../README.md)

- **Branch por feature:** `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`. **Nada direto na `main`.**
- **Commit a cada mudança que valha a pena salvar** — granular, não acumula um dia de trabalho num commit só.
- **Mensagem de uma linha só.** Sem corpo, sem rodapé. Formato:

  ```
  <type>(<scope>): <resumo no imperativo>
  ```

  - `type`: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `style` · `perf`
  - `scope`: a fatia ou camada — `weight`, `today`, `storage`, `ui`, `entities`, `app`, `docs`
  - resumo: imperativo, minúsculo, em **inglês**, sem ponto final, ≤ ~72 caracteres
  - exemplos:

    ```
    feat(weight): add 7d vs 7d average protocol banner
    fix(storage): fall back to seed on invalid config json
    test(training): cover last-load lookup with empty history
    docs: add development standards v1
    ```

- **Sem co-authoring.** Nenhum trailer `Co-authored-by`, nenhuma assinatura de ferramenta na mensagem.
- **Testes rodam no pre-commit** (ver [doc 09](../09-tooling-e-hooks/README.md)). Commit não sai com suíte vermelha.
- Merge da branch na `main` quando estiver verde. Solo — sem obrigação de PR; se abrir PR, o título segue o mesmo formato de uma linha.

## Versionamento

- Versão do app em `package.json` (semver).
- Versão do formato de dados em `SCHEMA_VERSION` ([doc 05](../05-dados-e-storage/README.md)) — independente da versão do app.
- `CHANGELOG.md`: manter só se passar a ser útil; não obrigatório na v1.
