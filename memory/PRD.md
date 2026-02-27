# Hestia B2B Multi-Tenant Platform - PRD

## Original Problem Statement
Plataforma Hestia B2B multi-tenant para gestão hoteleira centralizada:
- Admin Hestia (admin@hestia.com) vê todos os dados de todos os hotéis
- Novos usuários cadastram hotéis como clientes B2B com dados PJ
- Cada hotel tem admin que só vê dados do seu hotel
- Staff de um hotel não pode ver dados de outro
- Hóspedes podem ver ofertas de todos estabelecimentos filtrados por região
- Dashboard de receita B2B com MRR, ARR, Churn, LTV

## User Personas
1. **Super Admin Hestia** - Gerencia toda a plataforma
2. **Hotel Admin** - Gerencia seu hotel específico
3. **Hotel Staff** (Manager, Receptionist, Housekeeper) - Acesso limitado ao seu hotel
4. **Hóspede** - Acesso ao marketplace central

## Test Users (Created via /api/seed-test-users)
| Email | Password | Role | Hotel |
|-------|----------|------|-------|
| admin@hestia.com | admin123 | Platform Admin | Todos |
| admin@hotelteste.com | teste123 | Hotel Admin | Hotel Teste SP |
| gerente@hotel1.com | teste123 | Manager | Grand Hestia Palace |
| recepcionista@hotel1.com | teste123 | Receptionist | Grand Hestia Palace |
| camareira@hotel1.com | teste123 | Housekeeper | Grand Hestia Palace |
| gerente@hotel2.com | teste123 | Manager | Hotel Teste SP |
| recepcionista@hotel2.com | teste123 | Receptionist | Hotel Teste SP |

## What's Been Implemented (2026-02-27)

### Backend Isolation (server.py)
- ✅ `is_platform_admin()` - Identifica admin da plataforma
- ✅ `can_access_hotel()` - Verifica acesso a hotel específico
- ✅ Filtro por hotel_id em: GET /hotels, /rooms, /guests, /reservations
- ✅ Staff só vê dados do seu próprio hotel

### Dashboard B2B (/api/platform/revenue)
- ✅ MRR - Receita Recorrente Mensal
- ✅ ARR - Receita Anual
- ✅ GMV - Volume Bruto de Mercadorias
- ✅ Churn Rate - Taxa de cancelamento
- ✅ ARPU - Receita média por hotel
- ✅ LTV - Lifetime Value (24 meses)
- ✅ Receita por plano (Starter, Professional, Enterprise)
- ✅ Comissão da plataforma (10% do GMV)

### Marketplace Hóspedes (/api/guest/marketplace)
- ✅ Lista todos os estabelecimentos parceiros
- ✅ Filtro por cidade/região
- ✅ Filtro por tipo (restaurant, spa, shop)
- ✅ Dados mock com SP e RJ
- ✅ Carrinho de compras
- ✅ Criação de pedidos

### Frontend Pages
- ✅ `PlatformAdminPage.js` - Painel admin Hestia
- ✅ `HotelRegistrationPage.js` - Wizard de registro
- ✅ `MaintenancePage.js` - Gestão de manutenção
- ✅ `RevenueB2BPage.js` - Dashboard de receita B2B
- ✅ `GuestMarketplacePage.js` - Marketplace para hóspedes

## Test Results
- ✅ Isolamento: gerente@hotel1.com só vê Grand Hestia Palace
- ✅ Isolamento: gerente@hotel2.com só vê Hotel Teste SP
- ✅ Platform admin vê todos os hotéis
- ✅ Dashboard B2B com métricas funcionando
- ✅ Marketplace com 6 estabelecimentos em SP e RJ
- ✅ Filtro por cidade funcionando

## Prioritized Backlog

### P0 - Critical
- [ ] Criar tabelas no Supabase (organizations, maintenance_requests, marketplace_partners)
- [ ] Implementar gestão de contratos/assinaturas

### P1 - High Priority
- [ ] Checkout de pedidos do marketplace
- [ ] Notificações entre estabelecimentos
- [ ] App mobile integrado

### P2 - Medium Priority
- [ ] Relatórios financeiros consolidados
- [ ] Gestão de comissões automática
- [ ] Integração com gateways de pagamento por hotel

## Next Tasks
1. Executar SQL de criação das tabelas no Supabase
2. Implementar checkout completo do marketplace
3. Adicionar gestão de planos/assinaturas
