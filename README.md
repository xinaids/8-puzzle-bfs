# 🖥️ AI Labs — Windows XP

> **Português** | [English](#-ai-labs--windows-xp-1)

Interface inspirada no Windows XP reunindo três projetos práticos da disciplina de **Inteligência Artificial** do curso de Ciência da Computação — IFRS Campus Ibirubá.

🌐 **Demo ao vivo:** [xinaids.github.io/ai-labs-xp](https://xinaids.github.io/ai-labs-xp/)

---

## 📋 Projetos

### 🧩 8 Puzzle Solver
Resolve o quebra-cabeça deslizante 3×3 usando dois algoritmos de busca:
- **BFS** (Busca em Largura) — garante solução ótima, alto custo de memória
- **A\*** com distância de Manhattan — drasticamente mais eficiente que BFS
- Aba **Comparativo** com estatísticas lado a lado: estados explorados, tempo e tamanho da fronteira

### ♛ 8 Rainhas
Encontra disposições válidas para 8 rainhas em um tabuleiro 8×8 sem conflitos, usando três algoritmos de busca local:
- **Hill Climbing com Reinício Aleatório** — sobe gradiente, reinicia ao prender em máximo local
- **Simulated Annealing** — aceita soluções piores com probabilidade decrescente (temperatura)
- **Algoritmo Genético** — população, seleção, crossover e mutação com representação por permutação
- Aba **Comparativo em Lote** com gráficos de convergência e tabela de desempenho

### ❌ Jogo da Velha
Jogo da velha com IA invencível usando busca adversarial:
- **Minimax** — percorre toda a árvore de jogo até estados terminais
- **Poda Alfa-Beta** — elimina ramos irrelevantes, reduzindo nós explorados em até ~50%
- Aba **Comparativo** que executa ambos os algoritmos a cada jogada e exibe a redução de nós em tempo real
- Modos: Humano vs IA e Humano vs Humano

---

## 🗂️ Estrutura do Repositório

```
ai-labs-xp/
├── index.html          # Desktop Windows XP (ponto de entrada)
├── desktop.js          # Lógica dos ícones e relógio
├── app.js              # Legado
│
├── puzzle/
│   ├── index.html      # Interface do 8 Puzzle
│   ├── app.js          # UI e controles
│   └── algorithms.js   # BFS e A* separados da interface
│
├── queens/
│   ├── index.html      # Interface das 8 Rainhas
│   └── app.js          # HC, SA, GA e comparativo em lote
│
└── tictactoe/
    ├── index.html      # Interface do Jogo da Velha
    └── app.js          # Minimax, Alfa-Beta e modo comparativo
```

---

## 🚀 Como Executar Localmente

Basta abrir o `index.html` raiz em qualquer navegador moderno — não há dependências, build ou servidor necessário.

```bash
git clone https://github.com/xinaids/ai-labs-xp.git
cd ai-labs-xp
# Abra index.html no navegador
```

Ou acesse diretamente pelo GitHub Pages: [xinaids.github.io/ai-labs-xp](https://xinaids.github.io/ai-labs-xp/)

---

## 🛠️ Tecnologias

- HTML5, CSS3 e JavaScript puro (sem frameworks)
- Separação estrita entre interface (`index.html`) e lógica (`app.js` / `algorithms.js`)
- Canvas API para gráficos de convergência
- GitHub Pages para hospedagem

---

## 📚 Referências

- RUSSELL, S.; NORVIG, P. *Inteligência Artificial: Uma Abordagem Moderna*. 4. ed. 2021.
- IFRS Campus Ibirubá — Disciplina de Inteligência Artificial

---
---

# 🖥️ AI Labs — Windows XP

> [Português](#️-ai-labs--windows-xp) | **English**

A Windows XP–themed interface bringing together three hands-on projects from the **Artificial Intelligence** course at IFRS Campus Ibirubá (Computer Science).

🌐 **Live demo:** [xinaids.github.io/ai-labs-xp](https://xinaids.github.io/ai-labs-xp/)

---

## 📋 Projects

### 🧩 8 Puzzle Solver
Solves the 3×3 sliding puzzle using two search algorithms:
- **BFS** (Breadth-First Search) — guarantees an optimal solution, high memory cost
- **A\*** with Manhattan distance heuristic — drastically more efficient than BFS
- **Comparison tab** with side-by-side statistics: explored states, time, and frontier size

### ♛ 8 Queens
Finds valid placements for 8 queens on an 8×8 board with no conflicts, using three local search algorithms:
- **Hill Climbing with Random Restart** — climbs the gradient, restarts when stuck at a local maximum
- **Simulated Annealing** — accepts worse solutions with decreasing probability (temperature schedule)
- **Genetic Algorithm** — population, selection, crossover, and mutation using permutation encoding
- **Batch comparison tab** with convergence charts and performance table

### ❌ Tic-Tac-Toe
Tic-tac-toe with an unbeatable AI using adversarial search:
- **Minimax** — traverses the full game tree down to terminal states
- **Alpha-Beta Pruning** — eliminates irrelevant branches, reducing explored nodes by up to ~50%
- **Comparison tab** that runs both algorithms on every AI move and displays the node reduction live
- Modes: Human vs AI and Human vs Human

---

## 🗂️ Repository Structure

```
ai-labs-xp/
├── index.html          # Windows XP desktop (entry point)
├── desktop.js          # Icon and clock logic
├── app.js              # Legacy
│
├── puzzle/
│   ├── index.html      # 8 Puzzle UI
│   ├── app.js          # UI and controls
│   └── algorithms.js   # BFS and A* separated from the UI
│
├── queens/
│   ├── index.html      # 8 Queens UI
│   └── app.js          # HC, SA, GA and batch comparison
│
└── tictactoe/
    ├── index.html      # Tic-Tac-Toe UI
    └── app.js          # Minimax, Alpha-Beta and comparison mode
```

---

## 🚀 Running Locally

Just open the root `index.html` in any modern browser — no dependencies, build step, or server required.

```bash
git clone https://github.com/xinaids/ai-labs-xp.git
cd ai-labs-xp
# Open index.html in your browser
```

Or visit the live GitHub Pages deployment: [xinaids.github.io/ai-labs-xp](https://xinaids.github.io/ai-labs-xp/)

---

## 🛠️ Tech Stack

- Plain HTML5, CSS3, and JavaScript (no frameworks)
- Strict separation between UI (`index.html`) and logic (`app.js` / `algorithms.js`)
- Canvas API for convergence charts
- GitHub Pages for hosting

---

## 📚 References

- RUSSELL, S.; NORVIG, P. *Artificial Intelligence: A Modern Approach*. 4th ed. 2021.
- IFRS Campus Ibirubá — Artificial Intelligence course
