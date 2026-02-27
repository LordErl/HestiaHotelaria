# Hestia B2B Multi-Tenant Platform - PRD

## Original Problem Statement
Adaptação da plataforma Hestia para modelo B2B multi-tenant:
- Admin Hestia (admin@hestia.com) vê todos os dados de todos os hotéis
- Novos usuários podem cadastrar novos hotéis (clientes B2B) com dados da pessoa jurídica
- Cada hotel tem seu admin que só vê dados do seu hotel
- Módulo de manutenção integrado
- Marketplace central com restaurantes e serviços

## User Personas
1. **Super Admin Hestia** - Gerencia toda a plataforma, vê todos hotéis, usuários, métricas globais
2. **Hotel Admin** - Gerencia seu hotel específico, não vê dados de outros hotéis
3. **Hotel Staff** - Funcionários com acesso limitado ao seu hotel
4. **Hóspede** - Cliente final usando apps mobile

## Core Requirements (Static)
- [x] Isolamento multi-tenant por hotel_id
- [x] Dashboard centralizado para Super Admin
- [x] Cadastro de hotéis com dados de pessoa jurídica (CNPJ, responsável legal, etc)
- [x] Módulo de manutenção
- [x] Marketplace central

## What's Been Implemented (2026-02-27)

### Backend (server.py)
- ✅ Função `is_platform_admin()` para identificar admin da plataforma
- ✅ Função `can_access_hotel()` para verificar acesso a hotel específico
- ✅ Filtro em `GET /api/hotels` - admins de hotel só veem seu hotel
- ✅ `POST /api/platform/register-hotel` - Registro completo de novo hotel com PJ
- ✅ `GET /api/platform/dashboard` - Dashboard da plataforma
- ✅ `GET /api/platform/hotels` - Lista todos os hotéis
- ✅ `GET /api/platform/hotels/{id}` - Detalhes de um hotel
- ✅ `GET /api/platform/users` - Lista todos os usuários
- ✅ `GET /api/platform/organizations` - Lista organizações (PJ)
- ✅ Módulo de Manutenção (CRUD completo)
- ✅ Marketplace Partners (mock data se tabela não existir)

### Frontend
- ✅ `PlatformAdminPage.js` - Painel completo do admin Hestia com abas
- ✅ `HotelRegistrationPage.js` - Wizard de 6 passos para registro de hotel
- ✅ `MaintenancePage.js` - Gestão de solicitações de manutenção
- ✅ Sidebar atualizada com link "Admin Hestia" para super admins
- ✅ AuthContext com `isPlatformAdmin` flag

### Database (Supabase)
- ✅ Schema SQL para `organizations`, `maintenance_requests`, `marketplace_partners`, `partner_products`, `partner_orders`

## Test Results
- ✅ Login admin@hestia.com funciona
- ✅ Registro de novo hotel funciona (Hotel Teste SP criado)
- ✅ Isolamento: admin do hotel só vê seu hotel
- ✅ Platform dashboard carrega com métricas
- ✅ Página de manutenção funciona

## Prioritized Backlog

### P0 - Critical
- [ ] Executar SQL de criação das novas tabelas no Supabase (organizations, maintenance_requests, etc)
- [ ] Gestão de planos/assinaturas dos hotéis

### P1 - High Priority
- [ ] App mobile Staff separado por hotel
- [ ] App mobile Hóspede com marketplace
- [ ] Notificações push entre hotéis e marketplace

### P2 - Medium Priority
- [ ] Relatórios financeiros consolidados
- [ ] Gestão de comissões do marketplace
- [ ] Integração com gateways de pagamento por hotel

## Next Tasks
1. Executar o SQL `b2b_multitenant_schema.sql` no Supabase para criar as tabelas
2. Implementar gestão de contratos/assinaturas
3. Configurar parâmetros específicos por hotel (payment providers, etc)
4. Desenvolver fluxo de marketplace completo
