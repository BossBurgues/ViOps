# Fundação da API ViOps

## Stack

- Node.js + TypeScript.
- Express para uma API HTTP mínima e simples.
- Prisma Client para leitura do PostgreSQL já criado.
- `dotenv` para carregar `DATABASE_URL` e `API_PORT`.
- `cors` habilitado para desenvolvimento local.

Express foi escolhido por ser suficiente para esta primeira rodada de leitura, sem impor a estrutura de um framework maior. O frontend React/Vite continua separado e usando mocks.

## Estrutura

```text
server/
├── app.ts
├── index.ts
├── config/
│   └── env.ts
├── infra/
│   └── prisma.ts
├── modules/
│   ├── audit/
│   ├── clients/
│   ├── financial/
│   ├── health/
│   ├── service-orders/
│   ├── stock/
│   └── units/
└── shared/
    ├── async-handler.ts
    ├── errors.ts
    └── query.ts
```

As rotas apenas recebem a requisição e delegam para services. O Prisma Client fica encapsulado em `server/infra/prisma.ts`.

## Variáveis

Use `.env.example` como base:

```env
API_PORT=3333
CORS_ORIGIN=*
DATABASE_URL="postgresql://viops_dev:change_me@localhost:5433/viops?schema=public"
```

O PostgreSQL local usa porta externa `5433` e porta interna `5432` no Docker Compose, isolado de outros bancos locais como FCX.

## Como Rodar

```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run api:dev
```

A API sobe por padrão em:

```text
http://localhost:3333
```

Para build isolado da API:

```bash
npm run api:build
npm run api:start
```

## Endpoints

Health:

- `GET /health`
- `GET /health/db`

Units:

- `GET /units`
- `GET /units/:id`
- Filtros: `tenantId`, `limit`, `offset`

Clients:

- `GET /clients`
- `GET /clients/:id`
- Filtros: `tenantId`, `search`, `limit`, `offset`

Service Orders:

- `GET /service-orders`
- `GET /service-orders/:id`
- Filtros: `tenantId`, `unitId`, `status`, `saleOrigin`, `operationalChannel`, `limit`, `offset`

Financial:

- `GET /financial/providers`
- `GET /financial/charges`
- Filtros de cobranças: `tenantId`, `status`, `type`, `providerId`, `limit`, `offset`

Stock:

- `GET /stock/items`
- `GET /stock/movements`
- Filtros de itens: `tenantId`, `unitId`, `category`, `active`, `limit`, `offset`
- Filtros de movimentações: `tenantId`, `unitId`, `stockItemId`, `serviceOrderId`, `limit`, `offset`

Audit:

- `GET /audit-logs`
- Filtros: `tenantId`, `entityType`, `entityId`, `limit`, `offset`

## Exemplos

```bash
curl http://localhost:3333/health
curl http://localhost:3333/health/db
curl "http://localhost:3333/units?limit=10"
curl "http://localhost:3333/service-orders?tenantId=<tenantId>&saleOrigin=EXTERNA"
curl "http://localhost:3333/stock/movements?serviceOrderId=<serviceOrderId>"
```

## Fora Desta Rodada

- Conexão do frontend com a API.
- Remoção dos mocks.
- Endpoints de criação, edição ou exclusão.
- Autenticação, JWT e RBAC real.
- Upload real de documentos.
- Integrações bancárias, boletos, Pix, gateways ou provedores financeiros.
- Alterações de schema Prisma.

## Próximos Passos

- Adicionar autenticação e escopo de tenant no backend antes de expor a API ao frontend.
- Criar paginação padronizada com metadados.
- Adicionar testes automatizados para rotas e filtros críticos.
- Implementar endpoints de escrita por caso de uso, começando por cadastros com menor risco.
- Conectar o frontend módulo a módulo, mantendo fallback para mocks durante a transição.
