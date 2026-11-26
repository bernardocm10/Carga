# 08 · Git e commits

[↑ Índice](../README.md)

- **Branch por feature:** `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`. **Nada direto na `main`.**
- **Commit a cada mudança que valha a pena salvar** — granular, não acumula um dia de trabalho num commit só.
- **Mensagem de uma linha só.** Sem corpo, sem rodapé. Formato:

  ```
  <type>: [<scope>] - <resumo no imperativo>
  ```

  - `type`: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `style` · `perf`
  - `scope`: a fatia ou camada — `weight`, `today`, `storage`, `ui`, `entities`, `app`, `standards`. Sem escopo natural → omitir o `[<scope>] - ` inteiro (`chore: bump vite to 8.2`)
  - resumo: imperativo, minúsculo, em **inglês**, sem ponto final, ≤ ~72 caracteres
  - exemplos:

    ```
    feat: [weight] - add 7d vs 7d average protocol banner
    fix: [storage] - fall back to seed on invalid config json
    test: [training] - cover last-load lookup with empty history
    docs: add development standards v1
    ```

- **Sem co-authoring.** Nenhum trailer `Co-authored-by`, nenhuma assinatura de ferramenta na mensagem.
- **Testes rodam no pre-commit** (ver [doc 09](../09-tooling-e-hooks/README.md)). Commit não sai com suíte vermelha.
- Merge da branch na `main` quando estiver verde. Solo — sem obrigação de PR; se abrir PR, o título segue o mesmo formato de uma linha.
- Reescrever histórico já publicado (rebase + `--force-with-lease`) só a pedido explícito, e só neste repo solo.

## Versionamento

- Versão do app em `package.json`, no esquema [Pride Versioning](https://pridever.org) `PROUD.DEFAULT.SHAME`:
  - **PROUD** — release de que dá orgulho;
  - **DEFAULT** — release normal, "ok";
  - **SHAME** — conserto vergonhoso demais pra admitir.
- O Android deriva tudo do `package.json`: `versionName` = versão, `versionCode` = `PROUD·1_000_000 + DEFAULT·1_000 + SHAME` (por isso DEFAULT e SHAME ficam abaixo de 1000).

## Release

1. Subir a versão no `package.json` (e no `package-lock.json`, via `npm version <x.y.z> --no-git-tag-version`) e commitar: `chore: [release] - bump version to x.y.z`.
2. Criar e enviar a tag `vX.Y.Z` (tem que bater com o `package.json`): `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. O workflow [`release.yml`](../../../.github/workflows/release.yml) roda typecheck, lint e testes, gera o APK e publica a GitHub Release com o `.apk` anexado. Versões `0.*` saem como pre-release.
4. Assinatura: com os secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD` o APK sai com a chave de release. Sem eles, sai com uma chave de debug descartável — serve pra teste, mas a próxima release não instala por cima sem desinstalar (e desinstalar apaga os dados: exportar o backup antes).
5. Build local: `android/keystore.properties` (ignorado pelo git) com `storeFile`, `storePassword`, `keyAlias`, `keyPassword`; depois `npm run cap:sync && cd android && ./gradlew assembleRelease`.

- Versão do formato de dados em `SCHEMA_VERSION` ([doc 05](../05-dados-e-storage/README.md)) — independente da versão do app.
- `CHANGELOG.md`: manter só se passar a ser útil; não obrigatório na v1.
