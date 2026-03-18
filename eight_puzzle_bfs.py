from collections import deque
import time

# Estado final desejado
ESTADO_FINAL = (1, 2, 3, 4, 5, 6, 7, 8, 0)

def is_solvable(estado):
    """Verifica se o estado inicial é solúvel contando inversões.
    Uma inversão ocorre quando uma peça de valor maior aparece antes
    de uma peça de valor menor na sequência linear do tabuleiro.
    Se o número de inversões for ímpar, o estado é insolúvel.
    """
    nums = [x for x in estado if x != 0]
    inversoes = sum(
        1 for i in range(len(nums))
          for j in range(i + 1, len(nums))
          if nums[i] > nums[j]
    )
    return inversoes % 2 == 0

def encontrar_zero(estado):
    """Retorna o índice do espaço vazio (0) no estado."""
    return estado.index(0)

def gerar_movimentos(estado):
    """Gera todos os estados possíveis a partir do estado atual."""
    movimentos = []
    idx_zero = encontrar_zero(estado)
    linha, col = divmod(idx_zero, 3)

    # Direções possíveis: cima, baixo, esquerda, direita
    direcoes = {
        'cima':    (-1,  0),
        'baixo':   ( 1,  0),
        'esquerda':(  0, -1),
        'direita': (  0,  1),
    }

    for nome, (dl, dc) in direcoes.items():
        nova_linha, nova_col = linha + dl, col + dc
        if 0 <= nova_linha < 3 and 0 <= nova_col < 3:
            novo_idx = nova_linha * 3 + nova_col
            novo_estado = list(estado)
            novo_estado[idx_zero], novo_estado[novo_idx] = novo_estado[novo_idx], novo_estado[idx_zero]
            movimentos.append((tuple(novo_estado), nome))

    return movimentos

def bfs(estado_inicial):
    """
    Busca em Largura (BFS) para resolver o 8 Puzzle.
    Retorna: (caminho, total_estados_testados)
    """
    if estado_inicial == ESTADO_FINAL:
        return [], 0

    fila = deque()
    fila.append((estado_inicial, []))  # (estado_atual, caminho_percorrido)

    visitados = {estado_inicial}
    total_testados = 0

    while fila:
        estado_atual, caminho = fila.popleft()
        total_testados += 1

        for novo_estado, movimento in gerar_movimentos(estado_atual):
            if novo_estado not in visitados:
                novo_caminho = caminho + [(movimento, novo_estado)]

                if novo_estado == ESTADO_FINAL:
                    return novo_caminho, total_testados + 1

                visitados.add(novo_estado)
                fila.append((novo_estado, novo_caminho))

    return None, total_testados  # Sem solução

def imprimir_grade(estado, titulo=""):
    """Imprime o estado do puzzle em formato de grade 3x3."""
    if titulo:
        print(f"\n{titulo}")
    print("┌───┬───┬───┐")
    for i in range(0, 9, 3):
        linha = "│"
        for j in range(3):
            val = estado[i + j]
            linha += f" {'_' if val == 0 else val} │"
        print(linha)
        if i < 6:
            print("├───┼───┼───┤")
    print("└───┴───┴───┘")

def resolver(entrada):
    """Função principal que resolve o puzzle e exibe a solução."""
    # Processar entrada — aceita "123456780" ou "1 2 3 4 5 6 7 8 0"
    try:
        clean = entrada.strip()
        if len(clean) == 9 and clean.isdigit():
            numeros = [int(c) for c in clean]   # formato colado
        else:
            numeros = list(map(int, clean.split()))  # formato com espaços
        if len(numeros) != 9 or sorted(numeros) != list(range(9)):
            raise ValueError("Entrada inválida.")
        estado_inicial = tuple(numeros)
    except Exception as e:
        print(f"Erro na entrada: {e}")
        return

    print("\n" + "="*40)
    print("   RESOLVEDOR DE 8 PUZZLE - BFS")
    print("="*40)

    imprimir_grade(estado_inicial, "Estado Inicial:")
    imprimir_grade(ESTADO_FINAL, "Estado Final:")

    if not is_solvable(estado_inicial):
        print("\n❌ Sem solução para este estado inicial.")
        print("   (número ímpar de inversões — estado insolúvel)")
        return

    print("\nBuscando solução...")
    inicio = time.time()
    caminho, total_testados = bfs(estado_inicial)
    tempo = time.time() - inicio

    if caminho is None:
        print("\n❌ Sem solução para este estado inicial.")
        return

    print(f"\n✅ Solução encontrada!")
    print(f"   Movimentos necessários : {len(caminho)}")
    print(f"   Estados testados        : {total_testados}")
    print(f"   Tempo de execução       : {tempo:.4f}s")

    print("\n" + "="*40)
    print("         SEQUÊNCIA DE MOVIMENTOS")
    print("="*40)

    estado_atual = estado_inicial
    imprimir_grade(estado_atual, "Passo 0 - Estado Inicial:")
    for i, (movimento, estado) in enumerate(caminho, 1):
        imprimir_grade(estado, f"Passo {i} - Movimento: {movimento.upper()}")

    print("\n" + "="*40)
    print(f"Sequência: {' → '.join(m.upper() for m, _ in caminho)}")
    print("="*40)


if __name__ == "__main__":
    print("8 PUZZLE - BUSCA EM LARGURA (BFS)")
    print("Informe o estado inicial:")
    print("  Formato colado : 123456708")
    print("  Formato espaço : 1 2 3 4 5 6 7 0 8")
    print()
    entrada = input("Estado inicial: ")
    resolver(entrada)