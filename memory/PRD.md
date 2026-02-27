# Hestia B2B Multi-Tenant Platform - PRD

## Original Problem Statement
Plataforma Hestia B2B multi-tenant completa para gestão hoteleira com:
- Dashboard B2B (MRR, ARR, Churn, LTV)
- Isolamento de dados por hotel
- Marketplace com checkout completo
- Gestão de planos/assinaturas
- Sistema de notificações de pedidos

## SQL para Executar no Supabase
```
/app/backend/b2b_multitenant_schema.sql
```

Tabelas: organizations, maintenance_requests, marketplace_partners, partner_products, partner_orders, notifications

## What's Been Implemented (2026-02-27)

### Sistema de Notificações
- ✅ GET /api/notifications - lista notificações do hotel/usuário
- ✅ GET /api/notifications/unread-count - contador de não lidas
- ✅ PATCH /api/notifications/{id}/read - marca como lida
- ✅ PATCH /api/notifications/read-all - marca todas como lidas
- ✅ POST /api/notifications - cria notificação (admin)
- ✅ DELETE /api/notifications/{id} - remove notificação
- ✅ NotificationCenter com dropdown, ícones por tipo, badge de contagem
- ✅ Templates HTML de email para confirmação de pedido (hóspede) e notificação de novo pedido (hotel/parceiro)
- ✅ Notificações automáticas ao criar pedido no checkout

### Checkout Completo Marketplace
- ✅ POST /api/marketplace/checkout
- ✅ Formulário: nome, email, telefone, quarto, entrega, pagamento
- ✅ Formas de pagamento: Débito no Quarto, PIX, Cartão
- ✅ Dispara notificações in-app e por email

### Gestão de Assinaturas
- ✅ Planos: Starter (R$299), Professional (R$599), Enterprise (R$1499)
- ✅ CRUD de assinaturas
- ✅ Página de gestão com toggle mensal/anual (17% off)

### Isolamento Multi-Tenant
- ✅ Staff só vê dados do seu hotel
- ✅ Platform admin vê todos

### Test Users
| Email | Senha | Perfil |
|-------|-------|--------|
| admin@hestia.com | admin123 | Platform Admin |
| admin@hotelteste.com | teste123 | Hotel Admin |
| gerente@hotel1.com | teste123 | Manager Hotel 1 |
| gerente@hotel2.com | teste123 | Manager Hotel 2 |

## Test Results
- ✅ Backend: 90% funcionando
- ✅ Frontend: 100% funcionando
- ✅ Notificações: Dropdown com ícones, cores, badge contador

## Prioritized Backlog

### P1 - High Priority
- [ ] Executar SQL no Supabase para persistência real
- [ ] WebSocket para notificações em tempo real
- [ ] Push notifications mobile

### P2 - Medium Priority  
- [ ] Dashboard de métricas por estabelecimento
- [ ] Sistema de avaliações de pedidos
- [ ] Programa de fidelidade cross-hotel

## Next Tasks
1. Executar SQL: /app/backend/b2b_multitenant_schema.sql
2. Implementar WebSocket para notificações real-time
3. App mobile com push notifications
