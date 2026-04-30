// ─────────────────────────────────────────────
// queens/app.js — Lógica completa das 8 Rainhas
// Hill Climbing · Simulated Annealing · Algoritmo Genético
// Disciplina de Inteligência Artificial - IFRS Campus Ibirubá
// ─────────────────────────────────────────────


// ══════════════════════════════════════════════
// UTILITÁRIOS GERAIS
// ══════════════════════════════════════════════

/**
 * Atualiza o relógio exibido na barra de tarefas da interface.
 * Lê a hora e os minutos do sistema e formata como "HH:MM".
 * É chamada uma vez ao carregar a página e depois a cada 10 segundos.
 */
function updateClock() {
  const d = new Date();
  document.getElementById('clock').textContent =
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}
updateClock();
setInterval(updateClock, 10000);

/**
 * Troca a aba ativa na interface, mostrando o painel correspondente
 * e escondendo os demais.
 *
 * @param {string} id - Identificador da aba a ativar.
 *                      Valores possíveis: 'hc', 'sa', 'ga', 'cmp'.
 */
function switchTab(id) {
  ['hc', 'sa', 'ga', 'cmp'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === id);
    document.getElementById('panel-' + t).classList.toggle('active', t === id);
  });
}

/**
 * Conta quantos pares de rainhas estão se atacando em um dado estado.
 *
 * O estado é representado como um vetor de 8 posições, onde cada índice
 * é uma coluna e o valor é a linha onde a rainha dessa coluna está.
 * Como cada coluna tem exatamente uma rainha, conflitos de coluna são
 * impossíveis — só verificamos linha e diagonal.
 *
 * @param {number[]} state - Vetor de 8 inteiros (0 a 7), onde state[col] = linha da rainha.
 * @returns {number} Quantidade de pares de rainhas que se atacam (0 = solução perfeita, máx. 28).
 */
function conflicts(state) {
  let c = 0;
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++) {
      if (state[i] === state[j]) c++;                                // mesma linha
      if (Math.abs(state[i] - state[j]) === Math.abs(i - j)) c++;   // mesma diagonal
    }
  return c;
}

/**
 * Gera um estado inicial aleatório usando o embaralhamento de Fisher-Yates.
 *
 * O estado gerado é sempre uma permutação de [0, 1, 2, 3, 4, 5, 6, 7],
 * o que garante que nenhuma rainha compartilha a mesma linha com outra.
 * Isso reduz o espaço de busca de 8^8 = 16.777.216 para 8! = 40.320 estados.
 *
 * @returns {number[]} Vetor de 8 inteiros, permutação aleatória de 0 a 7.
 */
function randomState() {
  const s = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 7; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

/**
 * Gera todos os estados vizinhos de um estado dado.
 *
 * Um vizinho é criado movendo a rainha de uma coluna para qualquer outra
 * linha dessa mesma coluna. Para cada uma das 8 colunas há 7 linhas
 * alternativas, totalizando 8 × 7 = 56 vizinhos possíveis.
 *
 * @param {number[]} state - Estado atual: vetor de 8 inteiros (linha por coluna).
 * @returns {number[][]} Array com 56 estados vizinhos.
 */
function neighbors(state) {
  const nbrs = [];
  for (let col = 0; col < 8; col++)
    for (let row = 0; row < 8; row++)
      if (row !== state[col]) {
        const n = state.slice();   // cópia do estado atual
        n[col] = row;              // move a rainha da coluna 'col' para a linha 'row'
        nbrs.push(n);
      }
  return nbrs;
}


// ══════════════════════════════════════════════
// RENDERIZAÇÃO DO TABULEIRO
// ══════════════════════════════════════════════

/**
 * Desenha o tabuleiro de xadrez 8×8 com as rainhas posicionadas.
 * Rainhas que estão em conflito com outra são destacadas em vermelho.
 *
 * @param {string}   divId - ID do elemento HTML do tipo .chess-board onde o tabuleiro será desenhado.
 * @param {number[]} state - Vetor de 8 inteiros representando a posição das rainhas (linha por coluna).
 * @param {boolean}  small - Se true, aplica a classe CSS '.sm' para renderizar em tamanho reduzido
 *                           (usado nos mini tabuleiros da aba Comparativo).
 */
function renderBoard(divId, state, small = false) {
  const div = document.getElementById(divId);
  if (!div) return;
  div.innerHTML = '';
  div.className = 'chess-board' + (small ? ' sm' : '');

  // Detecta quais colunas possuem rainhas em situação de conflito
  const conflicted = new Set();
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++) {
      const atacando =
        state[i] === state[j] ||
        Math.abs(state[i] - state[j]) === Math.abs(i - j);
      if (atacando) { conflicted.add(i); conflicted.add(j); }
    }

  // Cria as 64 células (8 linhas × 8 colunas)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      const isLight    = (row + col) % 2 === 0;   // cor da casa (clara ou escura)
      const hasQueen   = state[col] === row;        // há rainha nesta célula?
      const isConflict = hasQueen && conflicted.has(col);  // a rainha está em conflito?

      cell.className = 'cell' + (small ? ' sm' : '') + ' ' + (
        isConflict
          ? (isLight ? 'conflict-light' : 'conflict-dark')
          : (isLight ? 'light' : 'dark')
      );
      if (hasQueen) cell.textContent = '♛';
      div.appendChild(cell);
    }
  }
}

/**
 * Renderiza um tabuleiro completamente vazio (sem rainhas).
 * Usado para limpar a visualização antes de iniciar um algoritmo.
 *
 * @param {string}  divId - ID do elemento HTML do tabuleiro.
 * @param {boolean} small - Se true, usa tamanho reduzido.
 */
function emptyBoard(divId, small = false) {
  renderBoard(divId, Array(8).fill(-1), small);
}

// Inicializa todos os tabuleiros com estado vazio ao carregar a página
['hc', 'sa', 'ga'].forEach(id => emptyBoard('board-' + id));
['hc', 'sa', 'ga'].forEach(id => emptyBoard('cmp-board-' + id, true));


// ══════════════════════════════════════════════
// HELPERS DE INTERFACE (UI)
// ══════════════════════════════════════════════

/**
 * Define o texto de um elemento HTML identificado por seu ID.
 *
 * @param {string} id  - ID do elemento HTML alvo.
 * @param {*}      val - Valor a exibir (será convertido para string automaticamente).
 */
function setVal(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/**
 * Define a mensagem de status exibida em um elemento HTML.
 * Funciona de forma idêntica a setVal, mas semanticamente indica
 * que o conteúdo é uma mensagem de estado (ex.: "Executando...", "Pronto").
 *
 * @param {string} id  - ID do elemento HTML alvo.
 * @param {string} msg - Mensagem de status a exibir.
 */
function setStatus(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }

/**
 * Atualiza a largura de uma barra de progresso.
 *
 * @param {string} id  - ID do elemento HTML da barra de progresso.
 * @param {number} pct - Percentual de progresso (0 a 100). Valores acima de 100 são limitados a 100.
 */
function setProg(id, pct) { const el = document.getElementById(id); if (el) el.style.width = Math.min(100, pct) + '%'; }

/**
 * Adiciona uma nova linha de texto ao terminal de log da interface.
 * O log rola automaticamente para mostrar a linha mais recente.
 *
 * @param {string} boxId - ID do elemento .log-box onde a linha será adicionada.
 * @param {string} msg   - Texto da mensagem a registrar.
 * @param {string} cls   - Classe CSS que define a cor da linha:
 *                         'log-line' = texto padrão (branco),
 *                         'log-warn' = aviso (amarelo),
 *                         'log-ok'   = sucesso (verde),
 *                         'log-err'  = erro (vermelho).
 */
function appendLog(boxId, msg, cls = 'log-line') {
  const box = document.getElementById(boxId);
  if (!box) return;
  const line = document.createElement('div');
  line.className = cls;
  line.textContent = msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}


// ══════════════════════════════════════════════
// GRÁFICO DE LINHA (Canvas nativo, sem dependências)
// ══════════════════════════════════════════════

/**
 * Desenha um gráfico de linhas simples diretamente em um elemento <canvas>.
 * Suporta múltiplas séries de dados com cores e legendas distintas.
 * Inclui grade horizontal e rótulos no eixo vertical.
 *
 * @param {string}     canvasId - ID do elemento <canvas> onde o gráfico será desenhado.
 * @param {number[][]} series   - Array de séries de dados. Cada série é um array de números.
 *                                Ex.: [[10, 8, 5, 2, 0], [12, 9, 6, 3, 1]]
 * @param {string[]}   labels   - Nomes das séries para exibir na legenda.
 *                                Ex.: ['Conflitos HC', 'Conflitos SA']
 * @param {string[]}   colors   - Cores em hexadecimal para cada série.
 *                                Ex.: ['#3a6ea5', '#c04000']
 */
function drawLineChart(canvasId, series, labels, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const W = canvas.offsetWidth || 400, H = 100;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  if (!series || !series.length || !series[0].length) {
    ctx.fillStyle = '#888'; ctx.font = '11px Tahoma';
    ctx.fillText('Sem dados.', 10, H / 2);
    return;
  }

  // Margens internas do gráfico
  const pad = { l: 32, r: 10, t: 10, b: 20 };
  const pw = W - pad.l - pad.r;   // largura útil do gráfico
  const ph = H - pad.t - pad.b;   // altura útil do gráfico

  const allVals = series.flat();
  const minV = Math.min(...allVals), maxV = Math.max(...allVals);
  const range = maxV - minV || 1;   // evita divisão por zero quando todos os valores são iguais

  // Funções de conversão: índice/valor → coordenada de pixel
  const tx = (i, n) => pad.l + (i / (n - 1 || 1)) * pw;
  const ty = v      => pad.t + ph - ((v - minV) / range) * ph;

  // Grade horizontal (5 linhas) com rótulos no eixo Y
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + g * (ph / 4);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.font = '9px Tahoma'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxV - g * (range / 4)), pad.l - 2, y + 3);
  }
  ctx.textAlign = 'left';

  // Desenha cada série como uma linha contínua
  series.forEach((data, si) => {
    ctx.beginPath();
    ctx.strokeStyle = colors[si] || '#333'; ctx.lineWidth = 1.5;
    data.forEach((v, i) => {
      const x = tx(i, data.length), y = ty(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Legenda na parte inferior do gráfico
  labels.forEach((lbl, i) => {
    ctx.fillStyle = colors[i] || '#333';
    ctx.fillRect(pad.l + i * 90, H - 12, 10, 8);   // pequeno quadrado colorido
    ctx.fillStyle = '#333'; ctx.font = '9px Tahoma';
    ctx.fillText(lbl, pad.l + i * 90 + 13, H - 5);
  });
}


// ══════════════════════════════════════════════
// RESULTADOS GLOBAIS (para a aba Comparativo)
// ══════════════════════════════════════════════

/**
 * Objeto que armazena o resultado mais recente de cada algoritmo.
 * Cada chave ('hc', 'sa', 'ga') recebe um objeto com os campos:
 *   - bestState {number[]} : melhor configuração encontrada.
 *   - conf      {number}   : número de conflitos da melhor solução.
 *   - time      {number}   : tempo total de execução em milissegundos.
 *   - iters     {number}   : total de iterações ou gerações realizadas.
 *   - solved    {boolean}  : true se encontrou solução com 0 conflitos.
 */
const results = { hc: null, sa: null, ga: null };

/**
 * Atualiza a aba Comparativo com base nos resultados armazenados em `results`.
 * Exibe os mini tabuleiros, a tabela de métricas com destaque para o melhor
 * valor em cada linha, e um parágrafo de análise textual automática.
 * Também redesenha o gráfico de barras comparativo.
 *
 * Chamada automaticamente ao final de cada algoritmo (finishHC, finishSA, finishGA).
 */
function updateComparison() {
  const r = results;

  // Atualiza mini tabuleiros e rótulos na aba Comparativo
  if (r.hc) { renderBoard('cmp-board-hc', r.hc.bestState, true); setVal('cmp-label-hc', `Conf: ${r.hc.conf} | ${r.hc.time}ms`); }
  if (r.sa) { renderBoard('cmp-board-sa', r.sa.bestState, true); setVal('cmp-label-sa', `Conf: ${r.sa.conf} | ${r.sa.time}ms`); }
  if (r.ga) { renderBoard('cmp-board-ga', r.ga.bestState, true); setVal('cmp-label-ga', `Conf: ${r.ga.conf} | ${r.ga.time}ms`); }

  // Definição das métricas a comparar:
  // - label  : nome exibido na tabela
  // - key    : chave no objeto de resultado
  // - lower  : true se o menor valor é o melhor (ex.: tempo, conflitos)
  // - bool   : true se o valor é booleano (exibe "Sim"/"Não")
  const metrics = [
    { label: 'Conflitos finais',        key: 'conf',   lower: true,  bool: false },
    { label: 'Tempo (ms)',              key: 'time',   lower: true,  bool: false },
    { label: 'Iterações / Gerações',    key: 'iters',  lower: true,  bool: false },
    { label: 'Solução perfeita (0 cf)', key: 'solved', lower: false, bool: true  },
  ];

  const keys = ['hc', 'sa', 'ga'];
  const body = document.getElementById('cmp-body');
  body.innerHTML = '';

  for (const m of metrics) {
    const vals = keys.map(k => r[k] ? r[k][m.key] : null);
    let bestIdx = -1;
    const nonNull = vals.map((v, i) => ({ v, i })).filter(x => x.v !== null);
    if (nonNull.length) {
      if (m.bool)        bestIdx = nonNull.find(x => x.v === true)?.i ?? -1;
      else if (m.lower)  bestIdx = nonNull.reduce((a, b) => a.v <= b.v ? a : b).i;
      else               bestIdx = nonNull.reduce((a, b) => a.v >= b.v ? a : b).i;
    }

    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td class="metric">${m.label}</td>` +
      keys.map((k, i) => {
        const v   = r[k] ? (m.bool ? (r[k][m.key] ? '✔ Sim' : '✘ Não') : r[k][m.key]) : '—';
        const cls = (vals[i] !== null && i === bestIdx) ? 'num win' : (vals[i] !== null ? 'num lose' : 'num');
        return `<td class="${cls}">${v}</td>`;
      }).join('');
    body.appendChild(tr);
  }

  // Texto de análise automática gerado com base nos resultados
  const labels  = { hc: 'Hill Climbing', sa: 'Simulated Annealing', ga: 'Algoritmo Genético' };
  const solved  = keys.filter(k => r[k] && r[k].solved);
  const fastest = keys.filter(k => r[k]).sort((a, b) => r[a].time  - r[b].time)[0];
  const fewest  = keys.filter(k => r[k]).sort((a, b) => r[a].conf  - r[b].conf)[0];

  let txt = '';
  txt += solved.length
    ? `✔ ${solved.map(k => labels[k]).join(' e ')} encontraram solução perfeita (0 conflitos). `
    : '⚠ Nenhum algoritmo encontrou solução perfeita nesta execução. Tente novamente ou ajuste os parâmetros. ';
  if (fastest) txt += `⚡ Mais rápido: ${labels[fastest]} (${r[fastest].time} ms). `;
  if (fewest)  txt += `🎯 Menos conflitos: ${labels[fewest]} (${r[fewest].conf} conflito(s)). `;
  txt += '\n\n📌 HC é rápido mas pode ficar preso em ótimos locais. SA escapa via aceitação probabilística. GA explora em paralelo com população — mais robusto mas mais lento.';

  document.getElementById('cmp-analysis').textContent = txt;
  drawCmpBarChart();
}

/**
 * Desenha o gráfico de barras na aba Comparativo.
 * Cada algoritmo recebe uma barra proporcional ao seu tempo de execução.
 * Uma barra vermelha secundária indica o número de conflitos restantes.
 * Chamada automaticamente por updateComparison().
 */
function drawCmpBarChart() {
  const r = results;
  const canvas = document.getElementById('cmp-chart');
  if (!canvas) return;
  const W = canvas.offsetWidth || 400, H = 120;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const keys   = ['hc', 'sa', 'ga'];
  const colors = ['#3a6ea5', '#c04000', '#206820'];
  const lbls   = ['HC', 'SA', 'GA'];
  const times  = keys.map(k => r[k] ? r[k].time : 0);   // tempos de execução (ms)
  const confs  = keys.map(k => r[k] ? r[k].conf : 0);   // conflitos finais

  const padL = 36, padB = 28, padT = 10;
  const ph   = H - padT - padB;           // altura útil do gráfico
  const maxT = Math.max(...times, 1);     // maior tempo (referência para escala)

  // Eixos
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB);
  ctx.lineTo(W - 10, H - padB); ctx.stroke();

  const bw   = 28;                             // largura de cada barra
  const step = (W - padL - 20) / 3;           // espaçamento entre grupos de barras

  keys.forEach((k, i) => {
    const x  = padL + 14 + i * step;
    // Barra principal: proporcional ao tempo de execução
    if (times[i]) {
      const bh = (times[i] / maxT) * ph;      // altura da barra em pixels
      ctx.fillStyle = colors[i] + 'aa';
      ctx.fillRect(x, H - padB - bh, bw, bh);
      ctx.strokeStyle = colors[i]; ctx.lineWidth = 1;
      ctx.strokeRect(x, H - padB - bh, bw, bh);
      ctx.fillStyle = '#333'; ctx.font = '9px Tahoma'; ctx.textAlign = 'center';
      ctx.fillText(times[i] + 'ms', x + bw / 2, H - padB - bh - 3);
    }
    // Barra vermelha secundária: proporcional ao número de conflitos (máx. 28)
    if (confs[i] !== undefined && maxT) {
      const bh2 = (confs[i] / 28) * ph * 0.5;
      ctx.fillStyle = '#ff000055';
      ctx.fillRect(x + bw + 2, H - padB - bh2, 10, bh2);
      if (bh2 > 6) {
        ctx.fillStyle = '#cc0000'; ctx.font = '9px Tahoma';
        ctx.fillText(confs[i] + 'c', x + bw + 7, H - padB - bh2 - 2);
      }
    }
    // Rótulo do algoritmo abaixo da barra
    ctx.fillStyle = '#333'; ctx.font = '10px Tahoma'; ctx.textAlign = 'center';
    ctx.fillText(lbls[i], x + bw / 2, H - padB + 12);
  });

  ctx.fillStyle = '#555'; ctx.font = '9px Tahoma'; ctx.textAlign = 'left';
  ctx.fillText('Barras = tempo (ms)  |  Vermelho = conflitos', padL + 2, padT + 8);
}


// ══════════════════════════════════════════════
// HILL CLIMBING COM REINÍCIO ALEATÓRIO
// ══════════════════════════════════════════════

/** Indica se o HC está em execução. Impede múltiplas execuções simultâneas. */
let hcRunning = false;

/** Histórico de conflitos registrado a cada iteração, usado para desenhar o gráfico. */
let hcCurve = [];

/**
 * Executa o algoritmo Hill Climbing com Reinício Aleatório de forma assíncrona.
 *
 * Funcionamento:
 *   1. Gera um estado inicial aleatório.
 *   2. A cada iteração, avalia todos os 56 vizinhos e move para o de menor conflito.
 *   3. Se nenhum vizinho melhorar o estado atual (ótimo local), reinicia com novo estado aleatório.
 *   4. Para quando encontrar 0 conflitos ou atingir o limite de reinícios.
 *
 * A execução é dividida em fatias via setTimeout para não travar o navegador.
 * Os parâmetros são lidos diretamente dos campos de entrada da interface.
 *
 * Variáveis principais:
 *   - maxRestarts {number} : Limite de reinícios aleatórios (lido do campo 'hc-restarts').
 *   - maxIter     {number} : Limite de iterações por reinício (lido do campo 'hc-maxiter').
 *   - bestState   {number[]}: Melhor configuração encontrada em todos os reinícios.
 *   - bestConf    {number} : Número de conflitos do melhor estado encontrado.
 *   - totalIter   {number} : Contador acumulado de iterações em todos os reinícios.
 *   - restart     {number} : Contador de reinícios realizados.
 *   - solved      {boolean}: true assim que encontrar uma solução com 0 conflitos.
 *   - t0          {number} : Timestamp do início da execução (via performance.now()).
 */
function runHC() {
  if (hcRunning) return;
  hcRunning = true;

  const maxRestarts = parseInt(document.getElementById('hc-restarts').value) || 100;
  const maxIter     = parseInt(document.getElementById('hc-maxiter').value)  || 1000;

  // Limpa a interface antes de iniciar
  document.getElementById('hc-log').innerHTML = '';
  setProg('hc-prog', 0);
  setStatus('hc-status', '🔄 Executando...');
  ['hc-sol', 'hc-conf', 'hc-iters', 'hc-rest', 'hc-time'].forEach(id => setVal(id, '—'));
  hcCurve = [];

  const t0 = performance.now();
  let bestState = randomState(), bestConf = conflicts(bestState);
  let totalIter = 0, restart = 0, solved = false;

  appendLog('hc-log', `▶ Iniciando: max_reinícios=${maxRestarts}, max_iter=${maxIter}`, 'log-line');

  /**
   * Executa um único reinício do HC.
   * Ao terminar, agenda o próximo reinício via setTimeout (libera a thread do navegador).
   */
  function step() {
    if (!hcRunning || restart >= maxRestarts || solved) {
      finishHC(bestState, bestConf, totalIter, restart, performance.now() - t0, solved);
      return;
    }

    // Começa este reinício a partir de um estado aleatório novo
    let state = randomState();
    let conf  = conflicts(state);

    for (let it = 0; it < maxIter; it++) {
      totalIter++;
      hcCurve.push(conf);   // registra o conflito atual para o gráfico

      if (conf === 0) { solved = true; bestState = state.slice(); bestConf = 0; break; }

      // Busca o vizinho com menor conflito (passo guloso / de encosta)
      let bestNbr = null, bestNbrConf = conf;
      for (const n of neighbors(state)) {
        const c = conflicts(n);
        if (c < bestNbrConf) { bestNbrConf = c; bestNbr = n; }
      }

      if (bestNbr === null) break;   // nenhum vizinho melhorou → ótimo local, sai do loop
      state = bestNbr; conf = bestNbrConf;
      if (conf < bestConf) { bestConf = conf; bestState = state.slice(); }
    }

    restart++;
    setProg('hc-prog', (restart / maxRestarts) * 100);

    if (restart % 10 === 0)
      appendLog('hc-log',
        `  Reinício ${restart}: melhor conflito = ${bestConf}`,
        bestConf === 0 ? 'log-ok' : 'log-warn'
      );

    if (solved) finishHC(bestState, 0, totalIter, restart, performance.now() - t0, true);
    else        setTimeout(step, 0);   // cede o controle ao navegador antes do próximo reinício
  }
  setTimeout(step, 0);
}

/**
 * Finaliza a execução do HC, atualiza toda a interface com os resultados
 * e salva o resultado no objeto global `results` para o Comparativo.
 *
 * @param {number[]} state  - Melhor estado encontrado.
 * @param {number}   conf   - Número de conflitos do melhor estado.
 * @param {number}   iters  - Total de iterações realizadas.
 * @param {number}   rest   - Total de reinícios realizados.
 * @param {number}   time   - Tempo total decorrido em milissegundos.
 * @param {boolean}  solved - true se encontrou solução com 0 conflitos.
 */
function finishHC(state, conf, iters, rest, time, solved) {
  hcRunning = false;
  renderBoard('board-hc', state);
  setVal('hc-sol',   state.join(' '));
  setVal('hc-conf',  conf);
  setVal('hc-iters', iters);
  setVal('hc-rest',  rest);
  setVal('hc-time',  Math.round(time));
  setProg('hc-prog', 100);
  setStatus('hc-status', solved ? '✔ Solução encontrada!' : `⚠ Melhor: ${conf} conflito(s)`);
  appendLog('hc-log',
    solved
      ? `✔ SOLUÇÃO em ${rest} reinícios, ${iters} iterações, ${Math.round(time)} ms`
      : `✘ Parou com ${conf} conflito(s) após ${rest} reinícios`,
    solved ? 'log-ok' : 'log-err'
  );
  setStatus('status-left', `HC | Conflitos: ${conf} | ${Math.round(time)} ms`);

  // Amostra até 200 pontos do histórico de conflitos para não sobrecarregar o gráfico
  const step  = Math.max(1, Math.floor(hcCurve.length / 200));
  const curve = hcCurve.filter((_, i) => i % step === 0);
  drawLineChart('hc-chart', [curve], ['Conflitos'], ['#3a6ea5']);

  results.hc = { bestState: state.slice(), conf, time: Math.round(time), iters, solved: conf === 0 };
  updateComparison();
}


// ══════════════════════════════════════════════
// SIMULATED ANNEALING (TÊMPERA SIMULADA)
// ══════════════════════════════════════════════

/** Indica se o SA está em execução. Impede múltiplas execuções simultâneas. */
let saRunning = false;

/**
 * Executa o algoritmo Têmpera Simulada de forma assíncrona.
 *
 * Funcionamento:
 *   1. Começa de um estado aleatório com temperatura T = T0.
 *   2. A cada passo, sorteia um vizinho aleatório (uma rainha, uma linha diferente).
 *   3. Se o vizinho for melhor (ΔE < 0), aceita sempre.
 *      Se for pior (ΔE ≥ 0), aceita com probabilidade e^(−ΔE/T).
 *   4. A temperatura cai: T = T × α. Quando T < Tmin, a rodada termina.
 *   5. Se configurado, reinicia com nova temperatura e estado aleatório.
 *
 * Parâmetros lidos da interface:
 *   - T0      {number} : Temperatura inicial (campo 'sa-t0'). Controla a "liberdade" inicial.
 *                        Valores típicos: 10 a 100.
 *   - alpha   {number} : Taxa de resfriamento (campo 'sa-alpha'). Deve estar entre 0 e 1.
 *                        Valores próximos de 1 (ex.: 0,995) resfriam devagar → mais iterações.
 *   - Tmin    {number} : Temperatura mínima (campo 'sa-tmin'). Quando T cai abaixo disso, para.
 *   - maxRest {number} : Número máximo de reinícios (campo 'sa-restarts').
 *
 * Variáveis principais por rodada:
 *   - state     {number[]}: Estado atual sendo explorado.
 *   - conf      {number}  : Conflitos do estado atual.
 *   - T         {number}  : Temperatura atual (decresce a cada iteração).
 *   - bestState {number[]}: Melhor estado encontrado globalmente.
 *   - bestConf  {number}  : Conflitos do melhor estado global.
 *   - totalIter {number}  : Total acumulado de iterações.
 *   - restDone  {number}  : Contador de reinícios realizados.
 *   - solved    {boolean} : true ao encontrar 0 conflitos.
 */
function runSA() {
  if (saRunning) return;
  saRunning = true;

  const T0      = parseFloat(document.getElementById('sa-t0').value)    || 30;
  const alpha   = parseFloat(document.getElementById('sa-alpha').value)  || 0.995;
  const Tmin    = parseFloat(document.getElementById('sa-tmin').value)   || 0.01;
  const maxRest = parseInt(document.getElementById('sa-restarts').value) || 5;

  document.getElementById('sa-log').innerHTML = '';
  setProg('sa-prog', 0);
  setStatus('sa-status', '🔄 Executando...');
  ['sa-sol', 'sa-conf', 'sa-iters', 'sa-tfinal', 'sa-time'].forEach(id => setVal(id, '—'));

  const confCurve = [];   // histórico de conflitos amostrado a cada 500 iterações
  const t0 = performance.now();
  let bestState = randomState(), bestConf = conflicts(bestState);
  let totalIter = 0, restDone = 0, solved = false;

  appendLog('sa-log', `▶ T₀=${T0}, α=${alpha}, Tmin=${Tmin}, reinícios=${maxRest}`, 'log-line');

  /**
   * Inicia um novo ciclo de resfriamento (reinício) a partir de estado aleatório.
   * Ao terminar (T < Tmin ou solução encontrada), agenda o próximo via setTimeout.
   */
  function doRestart() {
    if (!saRunning || restDone >= maxRest || solved) {
      finishSA(bestState, bestConf, totalIter, confCurve, performance.now() - t0, solved);
      return;
    }

    let state = randomState();
    let conf  = conflicts(state);
    let T     = T0;   // temperatura reinicia em T0 a cada novo ciclo

    /**
     * Processa um bloco (chunk) de 500 iterações por vez,
     * cedendo o controle ao navegador entre cada bloco.
     */
    function annealChunk() {
      const CHUNK = 500;

      for (let c = 0; c < CHUNK && T > Tmin; c++) {
        totalIter++;

        // Sorteia uma coluna e uma linha diferente da atual para gerar o vizinho
        const col = Math.floor(Math.random() * 8);
        let   row = Math.floor(Math.random() * 7);
        if (row >= state[col]) row++;   // garante que row ≠ state[col]

        const next     = state.slice();
        next[col]      = row;
        const nextConf = conflicts(next);
        const dE       = nextConf - conf;   // variação de qualidade (positivo = piora)

        // Critério de Metropolis: aceita melhoras sempre, aceita pioras com probabilidade e^(-dE/T)
        if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
          state = next; conf = nextConf;
        }

        if (conf < bestConf) { bestConf = conf; bestState = state.slice(); }
        if (conf === 0) { solved = true; break; }

        T *= alpha;   // resfriamento multiplicativo
        if (totalIter % 500 === 0) confCurve.push(conf);   // amostra para o gráfico
      }

      if (solved || T <= Tmin) {
        appendLog('sa-log',
          `  Reinício ${restDone + 1}: T_final=${T.toFixed(5)}, melhor conf=${bestConf}`,
          bestConf === 0 ? 'log-ok' : 'log-warn'
        );
        restDone++;
        setProg('sa-prog', (restDone / maxRest) * 100);
        if (solved) finishSA(bestState, 0, totalIter, confCurve, performance.now() - t0, true);
        else        setTimeout(doRestart, 0);
      } else {
        setTimeout(annealChunk, 0);   // próximo bloco de iterações
      }
    }
    annealChunk();
  }
  doRestart();
}

/**
 * Finaliza a execução do SA, atualiza a interface e salva o resultado no Comparativo.
 *
 * @param {number[]} state     - Melhor estado encontrado.
 * @param {number}   conf      - Número de conflitos do melhor estado.
 * @param {number}   iters     - Total de iterações realizadas.
 * @param {number[]} confCurve - Histórico de conflitos amostrado (para o gráfico).
 * @param {number}   time      - Tempo total decorrido em milissegundos.
 * @param {boolean}  solved    - true se encontrou solução com 0 conflitos.
 */
function finishSA(state, conf, iters, confCurve, time, solved) {
  saRunning = false;
  renderBoard('board-sa', state);
  setVal('sa-sol',    state.join(' '));
  setVal('sa-conf',   conf);
  setVal('sa-iters',  iters);
  setVal('sa-tfinal', confCurve.length ? '—' : '—');
  setVal('sa-time',   Math.round(time));
  setProg('sa-prog', 100);
  setStatus('sa-status', solved ? '✔ Solução encontrada!' : `⚠ Melhor: ${conf} conflito(s)`);
  appendLog('sa-log',
    solved
      ? `✔ SOLUÇÃO em ${iters} iterações, ${Math.round(time)} ms`
      : `✘ Parou com ${conf} conflito(s)`,
    solved ? 'log-ok' : 'log-err'
  );
  setStatus('status-left', `SA | Conflitos: ${conf} | ${Math.round(time)} ms`);
  drawLineChart('sa-chart', [confCurve], ['Conflitos SA'], ['#c04000']);

  results.sa = { bestState: state.slice(), conf, time: Math.round(time), iters, solved: conf === 0 };
  updateComparison();
}


// ══════════════════════════════════════════════
// ALGORITMO GENÉTICO
// ══════════════════════════════════════════════

/** Indica se o GA está em execução. Impede múltiplas execuções simultâneas. */
let gaRunning = false;

/**
 * Executa o Algoritmo Genético de forma assíncrona.
 *
 * Representação:
 *   Cada indivíduo (cromossomo) é um vetor de 8 inteiros (genes), onde
 *   gene[col] = linha da rainha na coluna col. Não há conflito de coluna
 *   por construção, pois cada posição do vetor representa uma coluna diferente.
 *
 * Fitness:
 *   f(s) = 28 − conflitos(s). Máximo = 28 (solução perfeita, 0 conflitos).
 *
 * Operadores genéticos:
 *   - Seleção por torneio: sorteia tournK indivíduos e retorna o de maior fitness.
 *   - Crossover de 1 ponto: com probabilidade crossRate, troca os genes após um ponto aleatório.
 *   - Mutação: cada gene tem chance mutRate de ser substituído por valor aleatório (0–7).
 *   - Elitismo: os (eliteP%) melhores de cada geração passam direto para a próxima.
 *
 * Parâmetros lidos da interface:
 *   - popSize   {number}: Tamanho da população (campo 'ga-pop'). Mais indivíduos = mais diversidade, mais lento.
 *   - maxGens   {number}: Número máximo de gerações (campo 'ga-gens').
 *   - mutRate   {number}: Probabilidade de mutação por gene (campo 'ga-mut'). Ex.: 0,05 = 5%.
 *   - crossRate {number}: Probabilidade de cruzamento entre dois pais (campo 'ga-cross'). Ex.: 0,85 = 85%.
 *   - eliteP    {number}: Percentual de elitismo (campo 'ga-elite'). Ex.: 5 = 5% da população.
 *   - tournK    {number}: Tamanho do torneio de seleção (campo 'ga-tourn').
 *
 * Variáveis principais:
 *   - pop       {number[][]}: Array com todos os indivíduos da geração atual.
 *   - bestState {number[]}  : Melhor indivíduo encontrado em toda a execução.
 *   - bestConf  {number}    : Conflitos do melhor indivíduo global.
 *   - bestCurve {number[]}  : Histórico do melhor fitness por geração (para o gráfico).
 *   - avgCurve  {number[]}  : Histórico do fitness médio da população por geração.
 *   - gen       {number}    : Contador de gerações realizadas.
 *   - ec        {number}    : Número de indivíduos preservados pelo elitismo.
 *   - solved    {boolean}   : true ao encontrar um indivíduo com 0 conflitos.
 */
function runGA() {
  if (gaRunning) return;
  gaRunning = true;

  const popSize   = parseInt(document.getElementById('ga-pop').value)     || 200;
  const maxGens   = parseInt(document.getElementById('ga-gens').value)    || 2000;
  const mutRate   = parseFloat(document.getElementById('ga-mut').value)   || 0.05;
  const crossRate = parseFloat(document.getElementById('ga-cross').value) || 0.85;
  const eliteP    = parseInt(document.getElementById('ga-elite').value)   || 5;
  const tournK    = parseInt(document.getElementById('ga-tourn').value)   || 5;

  document.getElementById('ga-log').innerHTML = '';
  setProg('ga-prog', 0);
  setStatus('ga-status', '🔄 Evoluindo...');
  ['ga-sol', 'ga-conf', 'ga-gen', 'ga-fit', 'ga-time'].forEach(id => setVal(id, '—'));

  const MAX_FITNESS = 28;   // C(8,2) = 28 pares possíveis; fitness máximo = 28 − 0 conflitos
  const fitness = s => MAX_FITNESS - conflicts(s);

  // Inicializa a população com permutações aleatórias
  let pop = Array.from({ length: popSize }, randomState);
  let bestState = pop[0].slice(), bestConf = conflicts(pop[0]);
  const bestCurve = [], avgCurve = [];
  let gen = 0, solved = false;
  const ec = Math.max(1, Math.round(popSize * eliteP / 100));   // qtd. de indivíduos de elite

  const t0 = performance.now();
  appendLog('ga-log', `▶ Pop=${popSize}, gens=${maxGens}, mut=${mutRate}, cross=${crossRate}, elite=${eliteP}%, torneio=${tournK}`, 'log-line');

  /**
   * Seleção por torneio: sorteia tournK indivíduos aleatórios da população
   * e retorna o estado (cromossomo) do que tiver maior fitness.
   *
   * @param {{ s: number[], f: number, c: number }[]} popFit - População com fitness calculado.
   * @returns {number[]} Cromossomo vencedor do torneio.
   */
  function tournamentSelect(popFit) {
    let best = null, bestF = -1;
    for (let i = 0; i < tournK; i++) {
      const idx = Math.floor(Math.random() * popFit.length);
      if (popFit[idx].f > bestF) { bestF = popFit[idx].f; best = popFit[idx].s; }
    }
    return best;
  }

  /**
   * Crossover de um ponto entre dois cromossomos pais.
   * Com probabilidade crossRate, os genes após o ponto de corte são trocados.
   * Sem cruzamento, os filhos são cópias dos pais.
   *
   * @param {number[]} a - Cromossomo do primeiro pai.
   * @param {number[]} b - Cromossomo do segundo pai.
   * @returns {number[][]} Array com dois filhos [c1, c2].
   */
  function crossover(a, b) {
    if (Math.random() > crossRate) return [a.slice(), b.slice()];
    const pt = 1 + Math.floor(Math.random() * 7);   // ponto de corte (1 a 7)
    return [
      [...a.slice(0, pt), ...b.slice(pt)],
      [...b.slice(0, pt), ...a.slice(pt)]
    ];
  }

  /**
   * Aplica mutação em um cromossomo.
   * Cada gene tem probabilidade mutRate de ser substituído por um valor aleatório de 0 a 7.
   *
   * @param {number[]} s - Cromossomo a sofrer mutação.
   * @returns {number[]} Novo cromossomo com mutações aplicadas (o original não é modificado).
   */
  function mutate(s) {
    const c = s.slice();
    for (let i = 0; i < 8; i++)
      if (Math.random() < mutRate) c[i] = Math.floor(Math.random() * 8);
    return c;
  }

  /**
   * Processa um bloco de 50 gerações por vez, cedendo o controle ao navegador entre os blocos.
   * Ao final de cada bloco, atualiza os contadores na interface.
   */
  function evolveChunk() {
    const CHUNK = 50;   // gerações processadas por fatia de CPU

    for (let g = 0; g < CHUNK && gen < maxGens && !solved; g++, gen++) {
      // Calcula o fitness de todos os indivíduos e ordena do melhor para o pior
      const popFit = pop.map(s => ({ s, f: fitness(s), c: conflicts(s) }));
      popFit.sort((a, b) => b.f - a.f);

      // Atualiza o melhor global se necessário
      if (popFit[0].c < bestConf) { bestConf = popFit[0].c; bestState = popFit[0].s.slice(); }
      if (bestConf === 0) { solved = true; break; }

      // Registra curvas de convergência a cada 10 gerações
      if (gen % 10 === 0) {
        bestCurve.push(popFit[0].f);
        avgCurve.push(popFit.reduce((s, x) => s + x.f, 0) / popFit.length);
      }

      // Monta a nova geração: elite + filhos gerados por seleção/cruzamento/mutação
      const newPop = popFit.slice(0, ec).map(x => x.s.slice());   // elitismo
      while (newPop.length < popSize) {
        const p1 = tournamentSelect(popFit);
        const p2 = tournamentSelect(popFit);
        const [c1, c2] = crossover(p1, p2);
        newPop.push(mutate(c1));
        if (newPop.length < popSize) newPop.push(mutate(c2));
      }
      pop = newPop;
    }

    // Atualiza contadores na interface ao final de cada bloco
    const elapsed = performance.now() - t0;
    setProg('ga-prog', Math.min(100, (gen / maxGens) * 100));
    setVal('ga-gen',  gen);
    setVal('ga-conf', bestConf);
    setVal('ga-fit',  MAX_FITNESS - bestConf);
    setVal('ga-time', Math.round(elapsed));

    if (gen % 100 === 0)
      appendLog('ga-log',
        `  Gen ${gen}: melhor fitness=${MAX_FITNESS - bestConf}, conflitos=${bestConf}`,
        bestConf <= 2 ? 'log-ok' : bestConf <= 5 ? 'log-warn' : 'log-line'
      );

    if (solved || gen >= maxGens || !gaRunning)
      finishGA(bestState, bestConf, gen, bestCurve, avgCurve, performance.now() - t0, solved);
    else
      setTimeout(evolveChunk, 0);   // próximo bloco de gerações
  }
  setTimeout(evolveChunk, 0);
}

/**
 * Finaliza a execução do GA, atualiza a interface e salva o resultado no Comparativo.
 *
 * @param {number[]} state     - Melhor cromossomo encontrado.
 * @param {number}   conf      - Conflitos do melhor cromossomo.
 * @param {number}   gen       - Número de gerações realizadas.
 * @param {number[]} bestCurve - Histórico do melhor fitness por geração (para o gráfico).
 * @param {number[]} avgCurve  - Histórico do fitness médio da população por geração.
 * @param {number}   time      - Tempo total decorrido em milissegundos.
 * @param {boolean}  solved    - true se encontrou solução com 0 conflitos.
 */
function finishGA(state, conf, gen, bestCurve, avgCurve, time, solved) {
  gaRunning = false;
  renderBoard('board-ga', state);
  setVal('ga-sol',  state.join(' '));
  setVal('ga-conf', conf);
  setVal('ga-gen',  gen);
  setVal('ga-fit',  28 - conf);
  setVal('ga-time', Math.round(time));
  setProg('ga-prog', 100);
  setStatus('ga-status', solved ? '✔ Solução encontrada!' : `⚠ Melhor: ${conf} conflito(s)`);
  appendLog('ga-log',
    solved
      ? `✔ SOLUÇÃO na geração ${gen}, ${Math.round(time)} ms`
      : `✘ Parou com ${conf} conflito(s) na geração ${gen}`,
    solved ? 'log-ok' : 'log-err'
  );
  setStatus('status-left', `GA | Conflitos: ${conf} | ${Math.round(time)} ms`);
  drawLineChart('ga-chart', [bestCurve, avgCurve], ['Melhor', 'Média'], ['#206820', '#88c888']);

  results.ga = { bestState: state.slice(), conf, time: Math.round(time), iters: gen, solved: conf === 0 };
  updateComparison();
}


// ══════════════════════════════════════════════
// CONTROLES GLOBAIS
// ══════════════════════════════════════════════

/**
 * Dispara os três algoritmos simultaneamente (HC, SA e GA).
 * Cada um roda de forma independente e assíncrona.
 */
function runAll() { runHC(); runSA(); runGA(); }

/**
 * Interrompe todos os algoritmos que estiverem em execução.
 * Define as flags de controle como false; os algoritmos verificam
 * essa flag no início de cada iteração e param naturalmente.
 */
function stopAll() {
  hcRunning = false; saRunning = false; gaRunning = false;
  setStatus('status-left', 'Parado pelo usuário.');
}

/**
 * Para todos os algoritmos e reinicia completamente a interface:
 * limpa tabuleiros, logs, barras de progresso, estatísticas e o objeto `results`.
 */
function resetAll() {
  stopAll();
  ['hc', 'sa', 'ga'].forEach(id => {
    emptyBoard('board-' + id);
    emptyBoard('cmp-board-' + id, true);
    document.getElementById(id + '-log').innerHTML = '';
    setProg(id + '-prog', 0);
    setStatus(id + '-status', 'Aguardando...');
    ['sol', 'conf', 'iters', 'time'].forEach(k => setVal(id + '-' + k, '—'));
  });
  setVal('hc-rest', '—'); setVal('sa-tfinal', '—'); setVal('ga-gen', '—'); setVal('ga-fit', '—');
  results.hc = null; results.sa = null; results.ga = null;
  document.getElementById('cmp-body').innerHTML =
    '<tr><td colspan="4" style="text-align:center;color:#888;padding:12px;">Execute os algoritmos para ver comparação.</td></tr>';
  document.getElementById('cmp-analysis').textContent = 'Execute os algoritmos para ver análise.';
  ['cmp-label-hc', 'cmp-label-sa', 'cmp-label-ga'].forEach(id => setVal(id, '—'));
  setStatus('status-left', 'Pronto');
}


// ══════════════════════════════════════════════
// BATCH — EXECUTA N VEZES PARA ESTATÍSTICAS
// ══════════════════════════════════════════════

/**
 * Executa os três algoritmos N vezes seguidas de forma síncrona (sem animação)
 * e exibe estatísticas consolidadas (tempo médio, conflitos médios, taxa de sucesso)
 * na aba Comparativo.
 *
 * Útil para avaliar a consistência e robustez dos algoritmos ao longo de várias rodadas,
 * eliminando o efeito de resultados atípicos em uma única execução.
 *
 * @param {number} n - Quantidade de execuções a realizar para cada algoritmo.
 *
 * Variáveis internas:
 *   - batch {object}: Acumula arrays de tempos e conflitos e conta soluções perfeitas
 *                     separadamente para HC, SA e GA.
 */
function runBatch(n) {
  const batch = {
    hc: { times: [], confs: [], solved: 0 },
    sa: { times: [], confs: [], solved: 0 },
    ga: { times: [], confs: [], solved: 0 },
  };

  /**
   * Executa a rodada de índice i e agenda a próxima via setTimeout.
   * Ao completar n rodadas, chama showBatchResults para exibir os resultados.
   *
   * @param {number} i - Índice da rodada atual (começa em 0).
   */
  function nextRun(i) {
    if (i >= n) { showBatchResults(batch, n); return; }
    setStatus('status-left', `Batch: execução ${i + 1}/${n}...`);

    const [, hcConf, hcTime] = runHCSync();
    batch.hc.times.push(hcTime); batch.hc.confs.push(hcConf);
    if (hcConf === 0) batch.hc.solved++;

    const [, saConf, saTime] = runSASync();
    batch.sa.times.push(saTime); batch.sa.confs.push(saConf);
    if (saConf === 0) batch.sa.solved++;

    const [, gaConf, gaTime] = runGASync();
    batch.ga.times.push(gaTime); batch.ga.confs.push(gaConf);
    if (gaConf === 0) batch.ga.solved++;

    setTimeout(() => nextRun(i + 1), 0);
  }
  nextRun(0);
}

/**
 * Calcula a média aritmética de um array de números, arredondada a 1 casa decimal.
 *
 * @param {number[]} arr - Array de valores numéricos.
 * @returns {number} Média dos valores, ou 0 se o array estiver vazio.
 */
const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

/**
 * Exibe os resultados consolidados do batch na aba Comparativo.
 * Monta a tabela de estatísticas e um gráfico de barras com min/max/média de tempo.
 *
 * @param {{ hc, sa, ga: { times: number[], confs: number[], solved: number } }} b - Dados acumulados do batch.
 * @param {number} n - Número de execuções realizadas.
 */
function showBatchResults(b, n) {
  const keys = ['hc', 'sa', 'ga'];
  const body = document.getElementById('cmp-body');
  body.innerHTML = `
    <tr>
      <td class="metric">Tempo médio (ms)</td>
      ${keys.map(k => `<td class="num">${avg(b[k].times)}</td>`).join('')}
    </tr><tr>
      <td class="metric">Conflitos médios</td>
      ${keys.map(k => `<td class="num">${avg(b[k].confs)}</td>`).join('')}
    </tr><tr>
      <td class="metric">Soluções perfeitas / ${n}</td>
      ${keys.map(k => `<td class="num ${b[k].solved === n ? 'win' : b[k].solved > 0 ? '' : 'lose'}">${b[k].solved}</td>`).join('')}
    </tr>`;
  switchTab('cmp');
  setStatus('status-left', `Batch de ${n} execuções concluído.`);

  // Gráfico de barras com intervalo min-max e traço de média para cada algoritmo
  const canvas = document.getElementById('cmp-chart');
  if (!canvas) return;
  const W = canvas.offsetWidth || 400, H = 120;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const colors = { hc: '#3a6ea5', sa: '#c04000', ga: '#206820' };
  const allT   = [...b.hc.times, ...b.sa.times, ...b.ga.times];
  const maxT   = Math.max(...allT, 1);
  const padL = 36, padB = 28, padT = 10;
  const ph   = H - padT - padB;

  keys.forEach((k, i) => {
    const x  = padL + 20 + i * ((W - padL - 20) / 3);
    const mn = Math.min(...b[k].times);   // tempo mínimo da série
    const mx = Math.max(...b[k].times);   // tempo máximo da série
    const av = avg(b[k].times);           // tempo médio da série
    const y1 = H - padB - (mn / maxT) * ph;
    const y2 = H - padB - (mx / maxT) * ph;
    const yA = H - padB - (av / maxT) * ph;

    // Barra representando o intervalo min–max
    ctx.strokeStyle = colors[k]; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 15, y1); ctx.lineTo(x + 15, y2); ctx.stroke();
    ctx.fillStyle = colors[k] + '88'; ctx.fillRect(x + 5, y2, 20, y1 - y2);
    ctx.strokeRect(x + 5, y2, 20, y1 - y2);
    // Traço branco indicando a média
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 5, yA); ctx.lineTo(x + 25, yA); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = '10px Tahoma'; ctx.textAlign = 'center';
    ctx.fillText(['HC', 'SA', 'GA'][i], x + 15, H - padB + 12);
  });
  ctx.fillStyle = '#555'; ctx.font = '9px Tahoma'; ctx.textAlign = 'left';
  ctx.fillText(`Batch ${n}× — barra = tempo (ms), traço branco = média`, padL + 2, padT + 8);
}


// ══════════════════════════════════════════════
// VERSÕES SÍNCRONAS (para uso no Batch)
// ══════════════════════════════════════════════

/**
 * Versão síncrona do Hill Climbing — sem atualização de interface.
 * Usada exclusivamente pelo modo Batch para coletar estatísticas rapidamente.
 * Lê os parâmetros dos mesmos campos da versão assíncrona.
 *
 * @returns {[number[], number, number]} Tupla [melhorEstado, conflitos, tempoMs].
 */
function runHCSync() {
  const maxR = parseInt(document.getElementById('hc-restarts').value) || 100;
  const maxI = parseInt(document.getElementById('hc-maxiter').value)  || 1000;
  const t0 = performance.now();
  let best = randomState(), bc = conflicts(best);
  for (let r = 0; r < maxR && bc > 0; r++) {
    let s = randomState(), c = conflicts(s);
    for (let i = 0; i < maxI && c > 0; i++) {
      let bn = null, bnc = c;
      for (const n of neighbors(s)) { const nc = conflicts(n); if (nc < bnc) { bnc = nc; bn = n; } }
      if (!bn) break;
      s = bn; c = bnc;
      if (c < bc) { bc = c; best = s.slice(); }
    }
  }
  return [best, bc, Math.round(performance.now() - t0)];
}

/**
 * Versão síncrona do Simulated Annealing — sem atualização de interface.
 * Usada exclusivamente pelo modo Batch.
 * Lê os parâmetros dos mesmos campos da versão assíncrona.
 *
 * @returns {[number[], number, number]} Tupla [melhorEstado, conflitos, tempoMs].
 */
function runSASync() {
  const T0    = parseFloat(document.getElementById('sa-t0').value)    || 30;
  const alpha = parseFloat(document.getElementById('sa-alpha').value)  || 0.995;
  const Tmin  = parseFloat(document.getElementById('sa-tmin').value)   || 0.01;
  const maxR  = parseInt(document.getElementById('sa-restarts').value) || 5;
  const t0 = performance.now();
  let best = randomState(), bc = conflicts(best);
  for (let r = 0; r < maxR && bc > 0; r++) {
    let s = randomState(), c = conflicts(s), T = T0;
    while (T > Tmin && c > 0) {
      const col = Math.floor(Math.random() * 8);
      let   row = Math.floor(Math.random() * 7);
      if (row >= s[col]) row++;
      const n = s.slice(); n[col] = row;
      const nc = conflicts(n), dE = nc - c;
      if (dE < 0 || Math.random() < Math.exp(-dE / T)) { s = n; c = nc; }
      if (c < bc) { bc = c; best = s.slice(); }
      T *= alpha;
    }
  }
  return [best, bc, Math.round(performance.now() - t0)];
}

/**
 * Versão síncrona do Algoritmo Genético — sem atualização de interface.
 * Usada exclusivamente pelo modo Batch.
 * Lê os parâmetros dos mesmos campos da versão assíncrona.
 *
 * @returns {[number[], number, number]} Tupla [melhorEstado, conflitos, tempoMs].
 */
function runGASync() {
  const popSize   = parseInt(document.getElementById('ga-pop').value)     || 200;
  const maxGens   = parseInt(document.getElementById('ga-gens').value)    || 2000;
  const mutRate   = parseFloat(document.getElementById('ga-mut').value)   || 0.05;
  const crossRate = parseFloat(document.getElementById('ga-cross').value) || 0.85;
  const eliteP    = parseInt(document.getElementById('ga-elite').value)   || 5;
  const tournK    = parseInt(document.getElementById('ga-tourn').value)   || 5;
  const MAX_FITNESS = 28;
  const fit = s => MAX_FITNESS - conflicts(s);
  const t0  = performance.now();
  let pop   = Array.from({ length: popSize }, randomState);
  let best  = pop[0].slice(), bc = conflicts(pop[0]);
  const ec  = Math.max(1, Math.round(popSize * eliteP / 100));
  // Seleção por torneio (inline para manter a versão síncrona compacta)
  const sel = pf => {
    let b = null, bf = -1;
    for (let i = 0; i < tournK; i++) {
      const idx = Math.floor(Math.random() * pf.length);
      if (pf[idx].f > bf) { bf = pf[idx].f; b = pf[idx].s; }
    }
    return b;
  };
  // Mutação (inline)
  const mut = s => {
    const c = s.slice();
    for (let i = 0; i < 8; i++) if (Math.random() < mutRate) c[i] = Math.floor(Math.random() * 8);
    return c;
  };
  for (let g = 0; g < maxGens && bc > 0; g++) {
    const pf = pop.map(s => ({ s, f: fit(s), c: conflicts(s) }));
    pf.sort((a, b) => b.f - a.f);
    if (pf[0].c < bc) { bc = pf[0].c; best = pf[0].s.slice(); }
    if (bc === 0) break;
    const np = pf.slice(0, ec).map(x => x.s.slice());   // elite
    while (np.length < popSize) {
      const p1 = sel(pf), p2 = sel(pf);
      let c1, c2;
      if (Math.random() < crossRate) {
        const pt = 1 + Math.floor(Math.random() * 7);
        c1 = [...p1.slice(0, pt), ...p2.slice(pt)];
        c2 = [...p2.slice(0, pt), ...p1.slice(pt)];
      } else {
        c1 = p1.slice(); c2 = p2.slice();
      }
      np.push(mut(c1));
      if (np.length < popSize) np.push(mut(c2));
    }
    pop = np;
  }
  return [best, bc, Math.round(performance.now() - t0)];
}