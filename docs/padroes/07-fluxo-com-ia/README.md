# 07 · Fluxo de trabalho com IA (Claude)

[↑ Índice](../README.md)

## 7.1 Antes de código

- Trabalho criativo (feature nova, mudança de comportamento, componente novo) passa por **brainstorming** primeiro. Nada de partir pro código sem a estrutura validada.
- Bug: **debugging sistemático** antes de propor correção — reproduz, isola, entende, então conserta.

## 7.2 Durante

- `domain/` é **TDD** — teste primeiro, sempre.
- Seguir os padrões destes docs. Divergência só com o doc atualizado junto, no mesmo commit.
- Arquivo grande demais é sinal de responsabilidade demais — quebrar enquanto se mexe nele, sem refatoração não relacionada de carona.

## 7.3 Ajuste de dado vs. ajuste estrutural

| | Quem faz | Como |
|---|---|---|
| **Ajuste de dado** (kcal, dose de suplemento, trocar exercício, macro) | o usuário | aba **Ajustes**, sem código, sem commit |
| **Ajuste estrutural** (lógica de tela, aba nova, novo gráfico, formato de dado) | Claude | brainstorming → implementação → commit |

Claude continua ajudando a **decidir os números** nas conversas; quem **aplica** o número é o usuário na aba Ajustes.

## 7.4 Limites

- Claude **não** roda build de release nem `adb install` / deploy no device sem pedir antes.
- Claude **não** commita com teste vermelho ou `typecheck` sujo.
- Ações destrutivas ou difíceis de reverter: confirmar antes.
