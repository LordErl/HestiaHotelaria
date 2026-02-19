# Hestia - Plataforma de Gestão Hoteleira Premium
## Product Requirements Document (PRD)

---

## ✅ Status Atual - Dezembro 2025

### Módulos Implementados e Funcionais

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **PMS Core** | ✅ | Dashboard, Quartos, Reservas, Check-in/Out |
| **Housekeeping** | ✅ | Gestão de tarefas de limpeza |
| **Motor de Reservas** | ✅ | Booking público com pagamento integrado |
| **Portal do Hóspede** | ✅ | Acesso por código, chat com IA |
| **Pagamentos** | ✅ | Stripe, Mercado Pago PIX, CORA |
| **Revenue Management** | ✅ | KPIs, gráficos, previsão, precificação dinâmica |
| **Marketplace** | ✅ | Catálogo, carrinho, checkout, pedidos |
| **Histórico de Pedidos** | ✅ | Página de pedidos para hotéis |
| **Admin Marketplace** | ✅ | Gestão de produtos e pedidos |
| **Assistentes IA** | ✅ | Hestia (gestão) + Jarbas (hóspedes) |
| **Integração OTAs** | ✅ | Booking, Expedia, Airbnb, Decolar (configuração) |
| **Eventos & Salas** | ✅ | Espaços para eventos, agendamento |
| **Gestão de RH** | ⚠️ | Frontend pronto, schema DB precisa ajuste |

---

## URLs da Aplicação

| Rota | Descrição |
|------|-----------|
| /login | Login administrativo |
| / | Dashboard |
| /reservations | Gestão de reservas |
| /rooms | Mapa de quartos |
| /guests | Lista de hóspedes |
| /check-in-out | Check-in/Check-out |
| /housekeeping | Tarefas de limpeza |
| /revenue | Revenue Management |
| /marketplace | Marketplace Hestia |
| /orders | Histórico de Pedidos |
| /marketplace-admin | Admin do Marketplace |
| /chat | Chat com IA |
| /payment-settings | Configurações de Pagamento |
| /booking | Motor de Reservas (público) |
| /guest-portal | Portal do Hóspede |
| /ota-integration | Integração com OTAs |
| /hr | Gestão de Pessoas (RH) |
| /events | Gestão de Eventos & Salas |

---

## Novos Módulos (Dezembro 2025)

### 1. Integração OTAs (/ota-integration)
- **Status**: ✅ Funcional
- **Canais Suportados**: Booking.com, Expedia, Airbnb, Decolar
- **Funcionalidades**:
  - Visualizar e gerenciar canais OTA
  - Ativar/desativar canais
  - Configurar credenciais de API
  - Sincronização de inventário e tarifas
  - Dashboard com estatísticas de canais

### 2. Gestão de Eventos (/events)
- **Status**: ✅ Funcional
- **Funcionalidades**:
  - Cadastro de espaços (salas de reunião, auditórios, salões)
  - Capacidades por tipo de layout (teatro, banquete, coquetel)
  - Precificação (hora, meio período, dia inteiro)
  - Agendamento de eventos
  - Dados do cliente/contratante
  - Status do evento (consulta, tentativo, confirmado)
  - Dashboard com estatísticas

### 3. Gestão de RH (/hr)
- **Status**: ⚠️ Frontend pronto, Backend precisa de ajuste no schema
- **Funcionalidades Planejadas**:
  - Cadastro de funcionários
  - Controle de escalas
  - Solicitações de férias/afastamentos
  - Dashboard com estatísticas de RH
- **Pendência**: A tabela `employees` no Supabase tem schema diferente do esperado. 
  - Solução: Executar o script `/app/backend/advanced_modules_schema.sql` para criar/atualizar as tabelas

---

## Credentials de Teste

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace
- **Hotel ID**: 480f0940-81a5-4ca7-806d-77ed790c740a

### Integrações Configuradas

| Serviço | Status | Notas |
|---------|--------|-------|
| Supabase | ✅ | Banco de dados PostgreSQL |
| Stripe | ✅ | Pagamentos com cartão (teste) |
| Mercado Pago | ✅ | PIX e cartão |
| CORA | ⚠️ | PIX (requer certificados mTLS) |
| Resend | ⚠️ | Email (chave configurada, envio pendente) |
| Gemini | ✅ | IA para assistentes |

---

## Pendências e Próximos Passos

### ⚠️ Ação Necessária do Usuário

1. **Corrigir tabela employees no Supabase**:
   - A tabela `employees` existe mas com schema incompatível
   - Executar DROP TABLE e depois o script `/app/backend/advanced_modules_schema.sql`
   - Ou alterar manualmente a tabela para adicionar as colunas necessárias

2. **Popular produtos do Marketplace**:
   - Executar `/app/backend/marketplace_produtos_adicionais.sql`

### P1 - Próximas Features
- Implementar envio de emails via Resend (confirmação de reserva, pedidos)
- Integrar pagamentos ao Motor de Reservas
- Completar lógica de sincronização OTA
- Assinaturas recorrentes no Marketplace

### P2 - Módulos Futuros
- App mobile para hóspedes
- App mobile para staff
- Manutenção preventiva
- Programa de fidelidade
- ESG

---

## Tech Stack

- **Backend**: FastAPI + Supabase Python Client
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **AI**: Gemini 3 Flash
- **Payments**: Stripe, Mercado Pago, CORA
- **Email**: Resend
- **Charts**: Recharts

---

## Arquitetura de Arquivos

```
/app/
├── backend/
│   ├── server.py                       # Monólito FastAPI
│   ├── advanced_modules_schema.sql     # Schema para OTAs, RH, Eventos
│   ├── marketplace_schema.sql          # Schema Marketplace
│   ├── marketplace_produtos_adicionais.sql
│   ├── payment_schema.sql
│   ├── schema.sql
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/                      # Shadcn components
        │   ├── Layout.js
        │   └── Sidebar.js
        ├── context/
        │   └── AuthContext.js
        └── pages/
            ├── DashboardPage.js
            ├── ReservationsPage.js
            ├── RoomsPage.js
            ├── GuestsPage.js
            ├── CheckInOutPage.js
            ├── HousekeepingPage.js
            ├── ChatPage.js
            ├── BookingEnginePage.js
            ├── GuestPortalPage.js
            ├── PaymentSettingsPage.js
            ├── RevenueManagementPage.js
            ├── MarketplacePage.js
            ├── OrdersHistoryPage.js
            ├── MarketplaceAdminPage.js
            ├── OtaIntegrationPage.js    # NOVO
            ├── HrManagementPage.js       # NOVO
            └── EventsManagementPage.js   # NOVO
```

---

*Atualizado: 19/02/2026*
