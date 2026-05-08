# ViOps — Estado de Refinamento

## Branch ativa
dev

## Regras consolidadas
- Venda externa pertence à Central/Fábrica.
- Venda externa não pertence às óticas.
- Óticas não possuem externa própria.
- Central/Fábrica possui canal Externa.
- Central/Fábrica atende óticas e Externa.
- Estoque consumido pela Externa deve sair da Central/Fábrica.
- Financeiro deve ser genérico por tipo de cobrança e provedor.
- Sicoob é apenas um provedor possível.
- Mercado Pago não deve ser referência fixa.

## Próximas rodadas
1. Consolidar Externa, OS Externa e Estoque.
2. Reformular Financeiro com cobranças genéricas e provedores plugáveis.

## Validação obrigatória
- npm run lint
- npm run build
- npm test

## Não fazer
- Não transformar Externa em filial de ótica.
- Não acoplar financeiro ao Sicoob.
- Não manter Mercado Pago como label fixo.
- Não implementar integração real ainda.
- Não remover funcionalidades consolidadas.