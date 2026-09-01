# 01 · Princípios

[↑ Índice](../README.md)

As 6 diretrizes que todo o resto dos padrões obedece.

1. **Modular e encaixável.** O app é uma soma de fatias (abas) autocontidas. Adicionar uma aba nova ou um novo tipo de dado não deve exigir mexer em quem já existe.
2. **Lógica pura separada de UI.** Todo cálculo (protocolo de peso, macros, última carga, dia→treino) vive fora de componente, em módulos sem React, cobertos por teste.
3. **Uma porta de entrada para os dados.** Só a camada de persistência fala com `localStorage`. O resto do app nunca vê uma chave de storage.
4. **Config e dados registrados são compartimentos isolados.** Editar a Config nunca toca o histórico; registrar peso/treino nunca toca a Config.
5. **Falha suave.** Dado corrompido no storage cai para a semente sem quebrar a tela.
6. **YAGNI.** Não se constrói abstração para um caso que ainda não existe. A modularidade abre espaço para a v2; ela não antecipa features da v2.
