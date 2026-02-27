# Hestia B2B Multi-Tenant Platform - PRD

## Original Problem Statement
Plataforma Hestia B2B multi-tenant para gestão hoteleira centralizada com:
- Dashboard de receita B2B (MRR, ARR, Churn, LTV)
- Isolamento de dados por hotel para staff
- Marketplace de hóspedes com checkout completo
- Gestão de planos e assinaturas

## SQL para Executar no Supabase
```
/app/backend/b2b_multitenant_schema.sql
```

Tabelas criadas:
- organizations (dados PJ do hotel)
- maintenance_requests (solicitações de manutenção)
- marketplace_partners (parceiros do marketplace)
- partner_products (produtos dos parceiros)
- partner_orders (pedidos do marketplace)

## What's Been Implemented (2026-02-27)

### Checkout Completo do Marketplace
- ✅ POST /api/marketplace/checkout - processa pedido com dados do hóspede
- ✅ Formulário de checkout: nome, email, telefone, quarto, tipo entrega, pagamento
- ✅ Formas de pagamento: Débito no Quarto, PIX, Cartão
- ✅ Tipos de entrega: Entrega no Quarto (+R$5), Retirada
- ✅ Modal de sucesso com número do pedido e tempo estimado

### Gestão de Planos e Assinaturas
- ✅ GET /api/subscriptions/plans - lista planos (PÚBLICO)
- ✅ POST /api/subscriptions/subscribe - cria assinatura
- ✅ GET /api/subscriptions/{hotel_id} - detalhes da assinatura
- ✅ POST /api/subscriptions/{hotel_id}/cancel - cancela assinatura
- ✅ POST /api/subscriptions/{hotel_id}/upgrade - upgrade de plano
- ✅ GET /api/platform/subscriptions - lista todas (admin plataforma)

### Planos Disponíveis
| Plano | Mensal | Anual | Features |
|-------|--------|-------|----------|
| Starter | R$ 299 | R$ 2.990 | Até 30 quartos, Motor de Reservas, 1 usuário |
| Professional | R$ 599 | R$ 5.990 | Até 100 quartos, OTAs, Revenue Management, 5 usuários |
| Enterprise | R$ 1.499 | R$ 14.990 | Ilimitado, API, Gerente dedicado, SLA 99.9% |

### Test Users
| Email | Password | Role | Hotel |
|-------|----------|------|-------|
| admin@hestia.com | admin123 | Platform Admin | Todos |
| admin@hotelteste.com | teste123 | Hotel Admin | Hotel Teste SP |
| gerente@hotel1.com | teste123 | Manager | Grand Hestia Palace |
| recepcionista@hotel1.com | teste123 | Receptionist | Grand Hestia Palace |
| gerente@hotel2.com | teste123 | Manager | Hotel Teste SP |

## Test Results (iteration_15.json)
- ✅ Backend: 89.1% (57/64 - apenas chat AI com erro de API key)
- ✅ Frontend: 100% (todas features B2B funcionando)

## Prioritized Backlog

### P0 - Critical
- [x] Checkout completo do marketplace ✅
- [x] Gestão de planos/assinaturas ✅
- [ ] Executar SQL no Supabase para persistência

### P1 - High Priority
- [ ] Integração com gateway de pagamento real (Stripe)
- [ ] Notificações por email/WhatsApp
- [ ] App mobile integrado

### P2 - Medium Priority
- [ ] Dashboard de métricas por estabelecimento
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade cross-hotel

## Next Tasks
1. Executar SQL no Supabase: /app/backend/b2b_multitenant_schema.sql
2. Integrar pagamentos reais (Stripe/MercadoPago)
3. Implementar notificações de pedidos
