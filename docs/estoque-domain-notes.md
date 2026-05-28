# Estoque - Notas de Dominio

## Estado atual

O modulo de Estoque e opcional por rede/cliente e ainda roda em frontend com mocks. Os itens de estoque sao vinculados a uma unidade operacional por `unidadeId`. As movimentacoes registram item, unidade, tipo, quantidade positiva, usuario, data e, quando aplicavel, OS vinculada.

O helper canonico de dominio do estoque e `src/lib/estoqueStatus.ts`. O arquivo `src/lib/stock.ts` fica apenas como fachada de compatibilidade para evitar duplicacao de regra.

## Regras consolidadas

- Central/Fabrica e uma unidade propria.
- Oticas podem ter estoque proprio.
- Externa pertence a Central/Fabrica.
- Externa nao pertence as oticas.
- Estoque consumido pela Externa deve sair da Central/Fabrica.
- OS de otica deve consumir preferencialmente estoque da propria otica.
- Baixa por OS deve ser rastreavel por OS, item de estoque e, quando houver vinculo, item da OS.
- Quantidade de movimentacao deve ser sempre positiva; a direcao vem do tipo da movimentacao.
- Transferencia permanece no dominio, mas oculta na UI ate existir fluxo de origem/destino e recebimento.

## Reserva, baixa, devolucao e ajuste

- Reserva: separa saldo para uma OS sem retirar fisicamente do estoque. Deve ser liberada se a OS for cancelada ou se a reserva expirar.
- Baixa: consome o item e reduz saldo disponivel. Em OS, deve ocorrer uma unica vez por item consumido ou ser idempotente no backend.
- Devolucao: retorna saldo ao estoque apos cancelamento, troca ou estorno operacional.
- Cancelamento de reserva: libera quantidade reservada sem criar entrada fisica.
- Ajuste: corrige divergencia de contagem fisica, sempre com justificativa e usuario responsavel.

Impacto no ciclo da OS:

- OS em producao: pode manter reserva ativa ou consumir no inicio da producao, conforme regra operacional da rede.
- OS entregue: deve ter baixa consumada, nao apenas reserva.
- OS cancelada: deve cancelar reservas pendentes ou gerar devolucao se ja houve baixa.

## Entidades futuras para banco

- `StockItem`: SKU por unidade/rede, categoria, referencia, saldo materializado ou calculado, custo/preco atuais e status.
- `StockMovement`: historico imutavel de entradas, saidas, baixas por OS, ajustes, devolucoes e transferencias.
- `StockReservation`: reserva por OS e item da OS, com status, quantidade e datas.
- `StockTransfer`: cabecalho de transferencia entre unidades, com origem, destino, status, envio e recebimento.
- `StockTransferItem`: itens e quantidades de uma transferencia.
- `InventoryCount`: inventario fisico por unidade.
- `InventoryCountItem`: saldo sistemico, saldo contado, diferenca e justificativa por item.

## Endpoints futuros recomendados

- `GET /stock/items`
- `POST /stock/items`
- `PATCH /stock/items/:id`
- `GET /stock/items/:id/movements`
- `POST /stock/movements/manual`
- `POST /stock/os/:osId/reservations`
- `POST /stock/os/:osId/consume`
- `POST /stock/os/:osId/release-reservations`
- `POST /stock/os/:osId/return`
- `POST /stock/transfers`
- `POST /stock/transfers/:id/ship`
- `POST /stock/transfers/:id/receive`
- `POST /stock/inventory-counts`
- `POST /stock/inventory-counts/:id/close`

## Regras que devem ir para backend

- Validar se a OS existe e pertence a rede correta.
- Validar se o item pertence a unidade operacional correta.
- Bloquear baixa duplicada por OS e item de estoque.
- Bloquear saldo negativo considerando saldo disponivel e reservas.
- Exigir permissao para cadastro, ajuste, baixa e transferencia.
- Exigir justificativa para ajustes.
- Garantir transacao em baixa por OS, devolucao, transferencia e fechamento de inventario.
- Validar que OS externa consome somente estoque da Central/Fabrica.
- Validar que OS de otica nao consome estoque de outra unidade sem transferencia formal.

## Limitacoes atuais do mock/frontend

- Saldo ainda e campo local em `ItemEstoque`, embora no banco deva ser derivado ou materializado a partir de movimentos.
- A deduplicacao de baixa por OS e apenas em memoria da sessao.
- Nem todos os itens de OS possuem `estoqueItemId`, porque estoque e opcional e os mocks antigos tem descricoes livres.
- Reserva, transferencia real e inventario fisico ainda nao estao implementados.
- O modulo usa mocks e nao tem concorrencia, transacao ou persistencia real.
