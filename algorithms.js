// ─────────────────────────────────────────────
// algorithms.js — BFS e A* (Manhattan) para o 8 Puzzle
// Disciplina de Inteligência Artificial - IFRS Campus Ibirubá
// ─────────────────────────────────────────────

// ── Constantes ────────────────────────────────────────────

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];

// Posição-alvo de cada peça no estado final
// Ex: peça 1 → índice 0, peça 2 → índice 1, ..., vazio (0) → índice 8
const GOAL_POS = {};
GOAL.forEach((v, i) => { GOAL_POS[v] = i; });

// ── Funções compartilhadas ────────────────────────────────

/**
 * Verifica se o estado é solúvel contando inversões.
 * Número par de inversões → solúvel.
 */
function isSolvable(state) {
  const nums = state.filter(x => x !== 0);
  let inv = 0;
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] > nums[j]) inv++;
  return inv % 2 === 0;
}

/** Compara dois arrays elemento a elemento. */
function arrEq(a, b) { return a.every((v, i) => v === b[i]); }

/**
 * Gera todos os estados sucessores a partir de um estado.
 * Retorna array de { state, move }.
 */
function getMoves(state) {
  const moves = [];
  const idx = state.indexOf(0);
  const r = Math.floor(idx / 3), c = idx % 3;

  for (const [name, dr, dc] of [
    ['cima', -1, 0], ['baixo', 1, 0],
    ['esquerda', 0, -1], ['direita', 0, 1]
  ]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const ni = nr * 3 + nc;
      const ns = [...state];
      [ns[idx], ns[ni]] = [ns[ni], ns[idx]];
      moves.push({ state: ns, move: name });
    }
  }
  return moves;
}

// ── BFS — Busca em Largura ────────────────────────────────

/**
 * Busca em Largura (BFS).
 *
 * Explora o espaço de estados nível por nível usando uma fila FIFO.
 * Garante solução ótima (menor número de movimentos), mas expande
 * todos os estados sem usar nenhuma informação sobre o objetivo.
 *
 * Retorna { path, tested } ou null se sem solução.
 */
function bfs(initial) {
  if (arrEq(initial, GOAL)) return { path: [], tested: 0 };

  const queue   = [[initial, []]];
  const visited = new Set([initial.join(',')]);
  let tested = 0;

  while (queue.length) {
    const [state, path] = queue.shift();
    tested++;

    for (const { state: ns, move } of getMoves(state)) {
      const key = ns.join(',');
      if (!visited.has(key)) {
        const np = [...path, { move, state: ns }];
        if (arrEq(ns, GOAL)) return { path: np, tested: tested + 1 };
        visited.add(key);
        queue.push([ns, np]);
      }
    }
  }
  return null;
}

// ── A* — Busca Heurística com Distância Manhattan ─────────

/**
 * Heurística da Distância Manhattan.
 *
 * Para cada peça (exceto o espaço vazio), calcula a soma das
 * distâncias horizontal e vertical até a sua posição-alvo.
 *
 * É ADMISSÍVEL  → nunca superestima o custo real
 * É CONSISTENTE → satisfaz a desigualdade triangular
 * Ambas as propriedades garantem solução ótima com o A*.
 *
 * Fórmula: h(n) = Σ |linha_atual − linha_alvo| + |col_atual − col_alvo|
 */
function manhattan(state) {
  let dist = 0;
  for (let i = 0; i < 9; i++) {
    const v = state[i];
    if (v !== 0) {
      const goalIdx = GOAL_POS[v];
      dist += Math.abs(Math.floor(i / 3) - Math.floor(goalIdx / 3))
            + Math.abs((i % 3) - (goalIdx % 3));
    }
  }
  return dist;
}

/**
 * Busca A* para o 8 Puzzle.
 *
 * Seleciona sempre o nó com menor f(n) = g(n) + h(n):
 *   g(n) = custo real até n (número de movimentos)
 *   h(n) = heurística Manhattan (estimativa do custo restante)
 *
 * Usa um array ordenado como fila de prioridade (min-heap simples).
 * Válido para o 8-puzzle dado o espaço de estados pequeno (≤ 181.440).
 *
 * Retorna { path, tested } ou null se sem solução.
 */
function astar(initial) {
  if (arrEq(initial, GOAL)) return { path: [], tested: 0 };

  // Min-heap: cada entrada é [f, g, state, path]
  const heap = [];
  const heapPush = (item) => {
    heap.push(item);
    // Ordena por f crescente; desempata pelo menor g (menos movimentos feitos)
    heap.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  const heapPop = () => heap.shift();

  heapPush([manhattan(initial), 0, initial, []]);

  // Mapeia state key → menor g já registrado (evita reprocessamento)
  const visited = new Map();
  let tested = 0;

  while (heap.length) {
    const [f, g, state, path] = heapPop();
    const key = state.join(',');

    // Descarta se já processamos este estado com custo menor ou igual
    if (visited.has(key) && visited.get(key) <= g) continue;
    visited.set(key, g);
    tested++;

    for (const { state: ns, move } of getMoves(state)) {
      const nk = ns.join(',');
      const ng = g + 1; // custo uniforme: cada movimento custa 1

      if (!visited.has(nk) || visited.get(nk) > ng) {
        const np = [...path, { move, state: ns }];
        if (arrEq(ns, GOAL)) return { path: np, tested: tested + 1 };
        heapPush([manhattan(ns), ng, ns, np]);
      }
    }
  }
  return null;
}
