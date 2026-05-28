# Backend Foundation

## Stack escolhida

- Node.js + TypeScript.
- PostgreSQL local via Docker Compose.
- Prisma ORM para schema, migrations, client e seed.
- Seed TypeScript via `tsx`.

Nesta rodada nao foi criado `server/` nem `apps/api`. A escolha foi manter a fundacao em `prisma/` porque o frontend atual ainda nao consome API e criar um bootstrap HTTP sem endpoints reais adicionaria superficie sem entregar valor agora. A futura API pode ser adicionada em `server/` usando o Prisma Client gerado.

## Estrutura criada

- `docker-compose.yml`: PostgreSQL local com volume persistente.
- `.env.example`: variaveis minimas para banco e futura API.
- `prisma/schema.prisma`: modelo inicial dos bounded contexts.
- `prisma/seed.ts`: seed demo alinhado aos mocks atuais.
- `docs/backend-foundation.md`: esta documentacao.

## Como subir PostgreSQL local

```bash
docker compose up -d postgres
```

O banco local usa:

- database: `viops`
- user: `viops_dev`
- password: `viops_dev_password`
- port: `5432`

Crie um `.env` local a partir de `.env.example`. O `.env` real nao deve ser versionado.

## Comandos Prisma

Gerar Prisma Client:

```bash
npm run db:generate
```

Criar migration local:

```bash
npm run db:migrate
```

Aplicar schema sem migration, util para prototipacao local:

```bash
npm run db:push
```

Rodar seed:

```bash
npm run db:seed
```

Abrir Prisma Studio:

```bash
npm run db:studio
```

Reset local:

```bash
npm run db:reset
```

## Decisoes de modelagem

- `Tenant` representa a rede/cliente e possui `stockEnabled`, porque estoque e opcional por rede.
- `Unit` distingue `CENTRAL_FABRICA` e `OTICA`.
- OS externa usa `saleOrigin = EXTERNA`, `operationalChannel = EXTERNA` e deve apontar para a Central/Fabrica.
- `ExternalActionData` estrutura dados da acao externa fora da OS principal.
- `ServiceOrderItem.stockItemId` e opcional, preservando estoque como modulo opcional.
- `StockMovement` permite rastrear `ServiceOrder -> ServiceOrderItem -> StockItem -> StockMovement`.
- `StockReservation` foi modelado para futura reserva, mas o frontend ainda nao usa esse fluxo.
- Financeiro usa `FinancialProvider`, `Charge`, `Payment` e `Installment` sem acoplar o dominio a Sicoob, Mercado Pago ou qualquer provedor especifico.
- `AuditLog` prepara rastreabilidade por tenant, usuario, OS e recurso.
- `StockTransfer`, `StockTransferItem`, `InventoryCount` e `InventoryCountItem` foram incluidos como modelos preparados, sem fluxo implementado.

## O que ficou fora desta rodada

- API HTTP e controllers.
- Autenticacao real.
- Upload real de documentos.
- Integracoes reais com bancos, Pix, boletos, adquirentes ou gateways.
- Conexao do frontend com API.
- Substituicao dos mocks do frontend.
- Regras transacionais de estoque no backend.
- Deploy, filas, jobs ou microsservicos.

## Proximos passos recomendados

1. Rodar migration inicial contra PostgreSQL local e revisar o SQL gerado.
2. Criar um `server/` minimo com health check e injetar Prisma Client.
3. Implementar endpoints somente de leitura para `Tenant`, `Unit`, `Client` e `ServiceOrder`.
4. Adicionar camada de aplicacao para regras de OS externa e estoque antes de endpoints de escrita.
5. Criar testes de dominio para baixa por OS, unidade operacional e bloqueio de saldo negativo.
6. Migrar telas gradualmente para API mantendo mocks como fallback temporario apenas durante transicao.
