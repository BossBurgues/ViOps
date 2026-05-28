# Backend Foundation

## Stack escolhida

- Node.js + TypeScript.
- PostgreSQL local via Docker Compose.
- Prisma ORM para schema, migrations, client e seed.
- Seed TypeScript via `tsx`.

Nesta rodada nao foi criado `server/` nem `apps/api`. A escolha foi manter a fundacao em `prisma/` porque o frontend atual ainda usa mocks e nao consome API. A futura API pode ser adicionada em `server/` usando o Prisma Client gerado.

## Estrutura criada

- `docker-compose.yml`: PostgreSQL local com volume persistente.
- `.env.example`: variaveis minimas para banco, seed local e futura API.
- `prisma/schema.prisma`: modelo inicial dos bounded contexts.
- `prisma/seed.ts`: seed demo alinhado aos mocks atuais.
- `prisma/migrations`: migrations locais do schema Prisma.
- `docs/backend-foundation.md`: esta documentacao.

## PostgreSQL local

Subir o banco:

```bash
docker compose up -d postgres
```

O banco roda isolado no Compose do ViOps:

- container: `viops-postgres`
- database: `viops`
- user: `viops_dev`
- password local: `change_me` no `.env.example`
- porta externa: `localhost:5433`
- porta interna do container: `5432`

O uso de `5433` evita conflito com outros PostgreSQL locais, incluindo ambientes de outros projetos como FCX. A `DATABASE_URL` local deve apontar para `localhost:5433`:

```bash
DATABASE_URL="postgresql://viops_dev:change_me@localhost:5433/viops?schema=public"
```

Crie um `.env` local a partir de `.env.example`. O `.env` real nao deve ser versionado.

## Seed local destrutivo

O seed atual limpa e recria dados demo. Ele e apenas para desenvolvimento local.

Para executar, o ambiente precisa atender a todas as travas:

- `ALLOW_DESTRUCTIVE_SEED=true`
- `NODE_ENV` diferente de `production`
- `DATABASE_URL` apontando para `localhost`, `127.0.0.1` ou `viops-postgres`

Essas travas reduzem o risco de executar `deleteMany()` contra um banco que nao seja local.

## Fluxo recomendado

Gerar Prisma Client:

```bash
npm run db:generate
```

Criar/aplicar migration local:

```bash
npx prisma migrate dev
```

Rodar seed:

```bash
npm run db:seed
```

Abrir Prisma Studio:

```bash
npm run db:studio
```

Validar o projeto:

```bash
npm run validate
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
- `Payment.chargeId` e opcional no MVP, mas possui relacao real com `Charge`.
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

1. Criar um `server/` minimo com health check e injetar Prisma Client.
2. Implementar endpoints somente de leitura para `Tenant`, `Unit`, `Client` e `ServiceOrder`.
3. Adicionar camada de aplicacao para regras de OS externa e estoque antes de endpoints de escrita.
4. Criar testes de dominio para baixa por OS, unidade operacional e bloqueio de saldo negativo.
5. Migrar telas gradualmente para API mantendo mocks como fallback temporario apenas durante transicao.
