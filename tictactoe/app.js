/* =====================================================
   Jogo da Velha — Minimax + Poda Alfa-Beta
   app.js  |  lógica separada da interface
   ===================================================== */

/* ---------- Estado global ---------- */
const STATE = {
  board: Array(9).fill(null), // null | 'X' | 'O'
  humanPlayer: 'X',           // jogador humano
  aiPlayer: 'O',              // jogador IA
  currentTurn: 'X',           // quem joga agora
  gameOver: false,
  mode: 'hvai',               // 'hvai' | 'hvh'
  useAlphaBeta: true,
  stats: {
    nodes_minimax: 0,
    nodes_alphabeta: 0,
    prunings: 0,
    depth_reached: 0,
    last_nodes: 0,
    last_prunings: 0,
    last_depth: 0,
    wins_human: 0,
    wins_ai: 0,
    draws: 0,
  },
  log: [],
};

/* ---------- Utilitários de tabuleiro ---------- */

/** Retorna 'X', 'O' ou null como resultado do estado. */
function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // linhas
    [0,3,6],[1,4,7],[2,5,8], // colunas
    [0,4,8],[2,4,6],          // diagonais
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(c => c !== null)) return { winner: 'draw', line: [] };
  return null;
}

function getAvailableMoves(board) {
  return board.reduce((acc, v, i) => (v === null ? [...acc, i] : acc), []);
}

/* ---------- Algoritmo Minimax puro ---------- */
function minimax(board, isMaximizing, aiPlayer, humanPlayer, depth) {
  STATE.stats.nodes_minimax++;
  if (depth > STATE.stats.depth_reached) STATE.stats.depth_reached = depth;

  const result = checkWinner(board);
  if (result) {
    if (result.winner === aiPlayer)    return  10 - depth;
    if (result.winner === humanPlayer) return -10 + depth;
    return 0;
  }

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      board[move] = aiPlayer;
      best = Math.max(best, minimax(board, false, aiPlayer, humanPlayer, depth + 1));
      board[move] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      board[move] = humanPlayer;
      best = Math.min(best, minimax(board, true, aiPlayer, humanPlayer, depth + 1));
      board[move] = null;
    }
    return best;
  }
}

/* ---------- Algoritmo Minimax com Poda Alfa-Beta ---------- */
function minimaxAlphaBeta(board, isMaximizing, aiPlayer, humanPlayer, depth, alpha, beta) {
  STATE.stats.nodes_alphabeta++;
  if (depth > STATE.stats.depth_reached) STATE.stats.depth_reached = depth;

  const result = checkWinner(board);
  if (result) {
    if (result.winner === aiPlayer)    return  10 - depth;
    if (result.winner === humanPlayer) return -10 + depth;
    return 0;
  }

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      board[move] = aiPlayer;
      const val = minimaxAlphaBeta(board, false, aiPlayer, humanPlayer, depth + 1, alpha, beta);
      board[move] = null;
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) {
        STATE.stats.prunings++;
        break; // poda beta
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      board[move] = humanPlayer;
      const val = minimaxAlphaBeta(board, true, aiPlayer, humanPlayer, depth + 1, alpha, beta);
      board[move] = null;
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) {
        STATE.stats.prunings++;
        break; // poda alfa
      }
    }
    return best;
  }
}

/* ---------- Decisão da IA ---------- */
function getBestMove(board, aiPlayer, humanPlayer, useAlphaBeta) {
  // Reset contadores por jogada
  STATE.stats.nodes_minimax = 0;
  STATE.stats.nodes_alphabeta = 0;
  STATE.stats.prunings = 0;
  STATE.stats.depth_reached = 0;

  let bestScore = -Infinity;
  let bestMove = -1;
  const moves = getAvailableMoves(board);

  for (const move of moves) {
    board[move] = aiPlayer;
    let score;
    if (useAlphaBeta) {
      score = minimaxAlphaBeta(board, false, aiPlayer, humanPlayer, 1, -Infinity, Infinity);
    } else {
      score = minimax(board, false, aiPlayer, humanPlayer, 1);
    }
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Salva stats da jogada
  STATE.stats.last_nodes    = useAlphaBeta ? STATE.stats.nodes_alphabeta : STATE.stats.nodes_minimax;
  STATE.stats.last_prunings = STATE.stats.prunings;
  STATE.stats.last_depth    = STATE.stats.depth_reached;

  return { move: bestMove, score: bestScore };
}

/* =====================================================
   Interface — funções chamadas pelo HTML
   ===================================================== */

function addLog(msg, cls = '') {
  STATE.log.unshift({ msg, cls });
  if (STATE.log.length > 60) STATE.log.pop();
  renderLog();
}

function renderLog() {
  const html = STATE.log
    .map(e => `<div${e.cls ? ` class="${e.cls}"` : ''}>&gt; ${e.msg}</div>`)
    .join('');
  const box1 = document.getElementById('logBox');
  const box2 = document.getElementById('logBoxCmp');
  if (box1) box1.innerHTML = html;
  if (box2) box2.innerHTML = html;
}

/* ---------- Renderização do tabuleiro ---------- */
function renderBoard() {
  const result = checkWinner(STATE.board);
  const winLine = result && result.winner !== 'draw' ? result.line : [];

  for (let i = 0; i < 9; i++) {
    const cell = document.getElementById(`cell-${i}`);
    if (!cell) continue;

    cell.className = 'ttt-cell';
    const val = STATE.board[i];
    cell.textContent = val || '';

    if (val === 'X') cell.classList.add('x');
    if (val === 'O') cell.classList.add('o');
    if (winLine.includes(i)) cell.classList.add('win');
    if (!val && !STATE.gameOver) cell.classList.add('empty');
  }
}

function renderStats() {
  const s = STATE.stats;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('stat-nodes',    s.last_nodes.toLocaleString('pt-BR'));
  set('stat-prunings', s.last_prunings.toLocaleString('pt-BR'));
  set('stat-depth',    s.last_depth);
  set('stat-wins-h',   s.wins_human);
  set('stat-wins-ai',  s.wins_ai);
  set('stat-draws',    s.draws);

  // Eficiência: redução de nós em relação ao minimax puro
  if (s.nodes_minimax > 0 && s.nodes_alphabeta > 0) {
    const pct = Math.round((1 - s.nodes_alphabeta / s.nodes_minimax) * 100);
    set('stat-efficiency', pct + '%');
  } else {
    set('stat-efficiency', '—');
  }
}

function renderStatus(msg, type = '') {
  const el = document.getElementById('statusBar');
  if (!el) return;
  el.className = 'status-bar' + (type ? ' ' + type : '');
  el.textContent = msg;
}

/* ---------- Lógica de turno ---------- */
function handleCellClick(index) {
  if (STATE.gameOver) return;
  if (STATE.board[index] !== null) return;

  // Em HvAI, só aceita clique do humano
  if (STATE.mode === 'hvai' && STATE.currentTurn !== STATE.humanPlayer) return;

  makeMove(index, STATE.currentTurn);
}

function makeMove(index, player) {
  STATE.board[index] = player;
  addLog(`${player} jogou na posição ${index + 1}`, player === 'X' ? 'log-x' : 'log-o');
  renderBoard();

  const result = checkWinner(STATE.board);
  if (result) {
    endGame(result);
    return;
  }

  // Troca turno
  STATE.currentTurn = player === 'X' ? 'O' : 'X';

  if (STATE.mode === 'hvai' && STATE.currentTurn === STATE.aiPlayer) {
    renderStatus('IA está pensando...', 'thinking');
    setTimeout(aiTurn, 180);
  } else {
    const who = STATE.currentTurn === STATE.humanPlayer ? 'Sua vez' : `Vez do Jogador ${STATE.currentTurn}`;
    renderStatus(`${who} (${STATE.currentTurn})`);
  }
}

function aiTurn() {
  if (STATE.gameOver) return;

  const boardCopy = [...STATE.board];
  const { move } = getBestMove(boardCopy, STATE.aiPlayer, STATE.humanPlayer, STATE.useAlphaBeta);

  const algo = STATE.useAlphaBeta ? 'Alfa-Beta' : 'Minimax puro';
  addLog(
    `IA (${algo}): posição ${move + 1} | nós: ${STATE.stats.last_nodes} | podas: ${STATE.stats.last_prunings}`,
    'log-ai'
  );
  renderStats();

  // Comparação se ambos algoritmos foram executados (modo comparação)
  if (STATE.compareMode) runComparison(move);

  makeMove(move, STATE.aiPlayer);
}

function endGame(result) {
  STATE.gameOver = true;
  renderBoard();

  if (result.winner === 'draw') {
    STATE.stats.draws++;
    addLog('Empate! 🤝', 'log-draw');
    renderStatus('Empate!', 'draw');
  } else if (result.winner === STATE.humanPlayer || STATE.mode === 'hvh') {
    if (STATE.mode === 'hvai') {
      STATE.stats.wins_human++;
      addLog(`Você venceu! 🎉`, 'log-win');
      renderStatus(`Vitória! ${result.winner} venceu! 🎉`, 'win');
    } else {
      addLog(`Jogador ${result.winner} venceu! 🎉`, 'log-win');
      renderStatus(`Jogador ${result.winner} venceu! 🎉`, 'win');
    }
  } else {
    STATE.stats.wins_ai++;
    addLog('IA venceu! 🤖', 'log-lose');
    renderStatus('IA venceu! 🤖', 'lose');
  }

  renderStats();
}

/* ---------- Controles públicos ---------- */
function newGame() {
  STATE.board = Array(9).fill(null);
  STATE.currentTurn = 'X';
  STATE.gameOver = false;
  addLog('──── Nova partida ────', 'log-sep');
  renderBoard();

  if (STATE.mode === 'hvai') {
    renderStatus(`Sua vez (${STATE.humanPlayer})`);
    // Se humano for O, IA começa
    if (STATE.humanPlayer === 'O') {
      renderStatus('IA abre o jogo...');
      setTimeout(aiTurn, 300);
    }
  } else {
    renderStatus('Vez do Jogador X');
  }
}

function setMode(mode) {
  STATE.mode = mode;
  document.getElementById('btnHvAI').classList.toggle('active', mode === 'hvai');
  document.getElementById('btnHvH').classList.toggle('active',  mode === 'hvh');
  newGame();
}

function setAlgo(useAB) {
  STATE.useAlphaBeta = useAB;
  document.getElementById('btnAB').classList.toggle('active',      useAB);
  document.getElementById('btnMinimax').classList.toggle('active', !useAB);
  addLog(`Algoritmo: ${useAB ? 'Minimax + Poda Alfa-Beta' : 'Minimax puro'}`, 'log-sys');
}

function setHumanPlayer(p) {
  STATE.humanPlayer = p;
  STATE.aiPlayer    = p === 'X' ? 'O' : 'X';
  document.getElementById('btnPlayX').classList.toggle('active', p === 'X');
  document.getElementById('btnPlayO').classList.toggle('active', p === 'O');
  newGame();
}

function resetScore() {
  STATE.stats.wins_human = 0;
  STATE.stats.wins_ai    = 0;
  STATE.stats.draws      = 0;
  renderStats();
  addLog('Placar zerado.', 'log-sys');
}

/* ---------- Modo Comparação: roda ambos algoritmos e mostra diferença ---------- */
function runComparison(aiMove) {
  // Minimax puro no board atual (antes do move ser feito)
  const tmpBoard = [...STATE.board];
  STATE.stats.nodes_minimax    = 0;
  STATE.stats.nodes_alphabeta  = 0;
  STATE.stats.prunings         = 0;
  STATE.stats.depth_reached    = 0;

  getBestMove([...tmpBoard], STATE.aiPlayer, STATE.humanPlayer, false); // puro
  const nodesPure = STATE.stats.nodes_minimax;

  getBestMove([...tmpBoard], STATE.aiPlayer, STATE.humanPlayer, true);  // alfa-beta
  const nodesAB = STATE.stats.nodes_alphabeta;
  const prunings = STATE.stats.prunings;

  const reduction = nodesPure > 0 ? Math.round((1 - nodesAB / nodesPure) * 100) : 0;
  addLog(`Comparação → Minimax: ${nodesPure} nós | Alfa-Beta: ${nodesAB} nós | Redução: ${reduction}% | Podas: ${prunings}`, 'log-cmp');

  updateCompareTable(nodesPure, nodesAB, prunings, reduction);
}

function updateCompareTable(nodesPure, nodesAB, prunings, reduction) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cmp-nodes-mm',  nodesPure.toLocaleString('pt-BR'));
  set('cmp-nodes-ab',  nodesAB.toLocaleString('pt-BR'));
  set('cmp-prunings',  prunings.toLocaleString('pt-BR'));
  set('cmp-reduction', reduction + '%');
}

/* ---------- Tab switching ---------- */
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');

  STATE.compareMode = (tab === 'compare');
}

/* ---------- Init ---------- */
window.addEventListener('DOMContentLoaded', () => {
  setAlgo(true);
  setMode('hvai');
  renderStats();
  addLog('Jogo da Velha — Minimax + Poda Alfa-Beta', 'log-sys');
  addLog('Modo: Humano vs IA | Algoritmo: Alfa-Beta', 'log-sys');
});
