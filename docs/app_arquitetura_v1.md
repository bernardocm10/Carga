# 🏗️ App de Acompanhamento — Documentação de Arquitetura v1

> Este documento descreve como o app vai ser construído, antes de qualquer código.
> Objetivo: você entender a estrutura e validar (ou pedir mudanças) antes de eu implementar.

---

## 1. Filosofia — por que modular

O problema que essa arquitetura resolve: **separar o que muda por decisão (metas, treino, suplementos) do que muda por uso diário (peso, séries feitas, suplemento tomado).**

Revisão importante desta versão: a Config **não fica mais fixa no código** — ela vira dado editável, com uma tela própria (**Ajustes**) pra você mexer direto, sem precisar de mim pra trocar um número ou um exercício.

Isso separa os ajustes em dois níveis:

- **Ajuste de dado** (subir caloria, trocar um exercício, mudar dose de suplemento, adicionar um item novo) → você mesmo edita na aba Ajustes, salva na hora, o app já reflete no próximo carregamento
- **Ajuste estrutural** (mudar a lógica de uma tela, adicionar uma aba nova, mudar como o gráfico calcula tendência) → isso é código de verdade, exige mexer no arquivo — aí sim precisa de mim

Na prática: se daqui a 3 semanas a gente decidir subir a caloria pra 3300kcal, você abre Ajustes e muda o número ali mesmo. Seu histórico de peso e treino continua intacto — a Config editável e os dados registrados são compartimentos separados, um nunca afeta o outro.

---

## 2. Telas do app (4 abas)

### 🗓️ Hoje
Visão do dia atual: qual treino é hoje (baseado no dia da semana), metas de caloria/macro do dia, registro rápido de peso, checklist de suplementos do dia. Também mostra uma tira semanal (Seg-Dom) com indicador visual de quais dias já têm treino registrado.

### ⚖️ Peso
Formulário para registrar peso (com data, permite lançar dias retroativos também). Gráfico de evolução. E o ponto mais importante: **feedback automático seguindo o protocolo de ajuste** que já definimos —
compara a média dos últimos 7 dias com os 7 anteriores e avisa se o ganho está abaixo da meta (150-220g/semana → sugestão de subir kcal), acima do limite (>0,5%/semana → sugestão de cortar), ou dentro do esperado. Sem necessidade de você calcular nada manualmente.

### 🏋️ Treino
Seletor dos 6 dias de treino (Push A/B, Pull A/B, Legs A/B). Pra cada exercício do dia selecionado: mostra a meta de séries/reps, mostra **a última carga que você usou** naquele exercício (puxado do seu próprio histórico, pra você saber se progrediu), e permite lançar as séries feitas (peso x reps) daquele treino.

### ⚙️ Ajustes (nova)
Tela de edição direta da Config: metas de caloria/macro, lista de suplementos (adicionar, remover, editar dose/horário), e a estrutura semanal de treino (editar séries/reps de um exercício, trocar exercício, adicionar ou remover exercício de um dia). Salva na hora — sem precisar de mim pra mudanças de dado.

### 📖 Guia
Referência rápida — a versão resumida do documento de dieta (metas de macro, estrutura de refeições, pontos de atenção em micronutrientes). Pensada pra consulta rápida no celular, sem precisar abrir o `.md` completo.

---

## 3. Modelo de dados

### 3.1 Config (editável — vive no armazenamento, não fixa no código)

Os valores abaixo (os que você já validou até aqui) continuam existindo no código como uma **semente inicial**: na primeira vez que o app abrir, ele copia esses valores pro armazenamento editável. A partir daí, o que vale é o que está salvo, não o que está no código — e você edita isso direto pela aba Ajustes.

```
CONFIG = {
  targetCalories: 3150,
  macros: { protein: 150, carbs: 425, fat: 95 },
  weightGoalMinG: 150,        // meta mínima de ganho semanal
  weightGoalMaxG: 220,        // meta máxima de ganho semanal
  weightAlertPct: 0.5,        // % semanal que dispara alerta de "rápido demais"

  supplements: [
    { nome: "Creatina", dose: "5g", horário: "qualquer, todo dia" },
    { nome: "Albumina/Proteína", dose: "conforme necessário", horário: "horários difíceis" },
    { nome: "Pré-treino", dose: "4g beta-alanina + 2g taurina + 4g arginina", horário: "antes do treino" },
  ],

  trainingSplit: [
    { dia: "Segunda", nome: "Push A", foco: "Força", exercícios: [...] },
    { dia: "Terça",   nome: "Pull A", foco: "Força", exercícios: [...] },
    { dia: "Quarta",  nome: "Legs A", foco: "Força + cardio leve", exercícios: [...] },
    { dia: "Quinta",  nome: "Push B", foco: "Hipertrofia", exercícios: [...] },
    { dia: "Sexta",   nome: "Pull B", foco: "Hipertrofia", exercícios: [...] },
    { dia: "Sábado",  nome: "Legs B", foco: "Hipertrofia + cardio", exercícios: [...] },
    { dia: "Domingo", nome: "Descanso", exercícios: [] },
  ],

  meals: [...],       // estrutura de refeições
  micronotes: [...],  // pontos de atenção em micronutrientes
}
```

Cada exercício dentro de `trainingSplit` tem: nome, número de séries, faixa de repetições. Exemplo: `{ nome: "Supino reto barra", séries: 4, reps: "4-6" }`.

**Isso é o que eu altero quando conversamos sobre ajustes** — trocar um exercício, mudar a caloria, adicionar um suplemento, etc.

### 3.2 Dados registrados (dinâmico — você alimenta usando o app)

Três registros guardados separadamente, que crescem com o tempo e nunca são tocados por mim:

| Registro        | O que guarda                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **Peso**        | Lista de `{ data, peso }` — um por dia registrado                                                             |
| **Treino**      | Lista de `{ data, treino do dia, exercícios: [{ nome, séries: [{peso, reps}] }] }` — um por sessão registrada |
| **Suplementos** | Por data, quais suplementos foram marcados como tomados                                                       |

Esses dados ficam salvos no seu dispositivo/conta, persistem entre sessões, e são só seus (não compartilhados).

---

## 4. Fluxo de ajustes futuros (como vai funcionar na prática)

**Ajuste de dado (o caso mais comum):**
1. Você decide mudar algo — sozinho, ou depois de conversar comigo sobre o número certo (ex: "bora subir 150kcal essa semana")
2. Abre a aba Ajustes, edita o campo, salva
3. Pronto — já vale no próximo carregamento de qualquer aba, sem precisar de mim mexendo em código

**Ajuste estrutural (mais raro):**
1. Você pede algo que a tela de Ajustes não cobre — uma aba nova, uma lógica diferente de feedback, um novo tipo de gráfico
2. Aí eu mexo no código de verdade e te mando o arquivo atualizado
3. Seus dados registrados (peso, treino, suplementos) e sua Config atual continuam intactos — só a parte estrutural muda

Continuo no papel de te ajudar a decidir os números certos nas conversas — só que agora você aplica direto, sem depender de mim reenviar o arquivo toda vez que muda uma meta ou troca um exercício.

---

## 5. Direção visual — sistema de design

Pra fugir da estética genérica de IA (fundo bege + serifa + terracota, ou preto com neon), a direção puxa pro universo de um **diário de treino/logbook de academia** — concreto de piso, giz de barra, anilha de ferro.

### Paleta

| Papel                      | Nome           | Hex       |
| -------------------------- | -------------- | --------- |
| Fundo                      | Concreto claro | `#EDEAE1` |
| Superfície (cards)         | Giz branco     | `#F7F5EF` |
| Texto principal            | Grafite quente | `#26221D` |
| Texto secundário           | Grafite suave  | `#5C574C` |
| Primária (ações/destaques) | Azul-ferro     | `#28497D` |
| Acento (marcador "hoje")   | Latão          | `#C9963A` |
| Positivo (dentro da meta)  | Verde-tatame   | `#4B7A5B` |
| Alerta (fora da meta)      | Ferrugem       | `#AE3D30` |
| Linhas/bordas              | Hairline       | `#DAD3C2` |

Cada cor funcional remete literalmente a um material do universo da academia — ferro, latão de anilha, ferrugem — em vez de ser uma escolha arbitrária de paleta genérica.

### Tipografia (3 papéis)

- **Display/dados** — *Oswald* (condensada, maiúscula, peso 600-700): números grandes (peso, calorias, cargas) e títulos de seção. Remete a placa de ginásio, quadro de recordes.
- **Corpo** — *Work Sans*: texto corrido, descrições, labels. Neutra, não compete com a Oswald.
- **Utilitária/entrada de dado** — *IBM Plex Mono*: usada nos campos onde você digita peso/reps/séries — reforça a sensação de "ficha de registro" em vez de formulário genérico.

### Layout

Navegação por 5 abas fixas na base da tela (padrão de app nativo, não site rolável). Cards com bordas finas (hairline), sem sombra pesada — visual chapado tipo cartolina/concreto, não vidro.

```
┌─────────────────────────────┐
│  DIÁRIO DE TREINO            │
│  terça-feira, 12 de agosto   │
├─────────────────────────────┤
│ SEG TER• QUA QUI SEX SÁB DOM │ ← tira semanal (estrutural, mostra cumprimento)
├─────────────────────────────┤
│  TERÇA · PULL A · FORÇA      │
├─────────────────────────────┤
│  ▌▌▌▌ [====BARRA====] ▌▌▌▌   │ ← elemento de assinatura (ver abaixo)
│  150g P   425g C   95g F  3150kcal │
├─────────────────────────────┤
│  PESO DE HOJE   [___kg] [Salvar] │
├─────────────────────────────┤
│  SUPLEMENTOS                 │
│  ☑ Creatina 5g                │
│  ☐ Pré-treino ...             │
└─────────────────────────────┘
  [Hoje][Peso][Treino][Ajustes][Guia]
```

### Elemento de assinatura: a barra carregada

Em vez dos 4 cards genéricos de macro (proteína/carbo/gordura/caloria em caixinhas separadas — a saída óbvia que qualquer app de dieta usa), o painel do dia mostra uma **barra olímpica ilustrada com anilhas**:

- A quantidade/tamanho das anilhas de cada lado representa a proporção entre proteína, carboidrato e gordura do dia
- O número de calorias fica no centro da barra, como se fosse a marcação do peso total
- É literalmente "matemática de anilha" — o cálculo que todo praticante já faz de cabeça pra montar a barra — aplicado à leitura dos macros do dia

### Auto-crítica

Cards com número + label seria a saída genérica. A barra carregada muda isso sem perder a leitura rápida do dado — os números continuam visíveis, só que embalados numa metáfora que só faz sentido pra quem treina. O resto da tela (inputs, listas, navegação) fica deliberadamente quieto — o risco visual é gasto só ali, não espalhado em todo canto.

---

## 6. Stack técnica

- React (componente único, sem dependências externas além de gráfico e ícones)
- Gráfico de peso: Recharts
- Ícones: Lucide
- Armazenamento: persistente no dispositivo, dividido em 3 chaves (peso, treino, suplementos) + a Config embutida no código

---

## 7. Limitações da v1 (o que fica pra depois)

- A aba Ajustes edita dentro da estrutura existente (7 dias fixos, exercícios editáveis dentro de cada dia) — mudar o modelo em si (ex: sair de PPL pra outro tipo de divisão, mudar de 7 pra 10 dias) ainda é ajuste estrutural, exige mexer no código
- Sem gráfico de progressão de carga por exercício ainda (só mostra "última vez") — pode entrar numa v2 se fizer falta
- Sem sincronização entre dispositivos diferentes além da conta usada

---

*Quando você validar essa estrutura (ou pedir ajustes nela), eu parto pra implementação.*
