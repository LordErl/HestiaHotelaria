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
| **Admin Marketplace** | ✅ | Gestão de produtos e pedidos |
| **Assistentes IA** | ✅ | Hestia (gestão) + Jarbas (hóspedes) |
| **Integração OTAs** | ✅ | Booking, Expedia, Airbnb, Decolar |
| **Gestão de Eventos** | ✅ | Espaços e agendamento de eventos |
| **Gestão de RH** | ✅ | Funcionários, escalas, férias |
| **Emails Transacionais** | ✅ | Confirmação de reserva e pedidos via Resend |

---

## Implementações Recentes (19/02/2026)

### Módulos Avançados Completos
1. **OTA Integration** - Integração com canais de distribuição
   - 4 canais configurados: Booking.com, Expedia, Airbnb, Decolar
   - Ativação/desativação de canais
   - Configuração de credenciais API
   - Dashboard de estatísticas

2. **Gestão de RH** - Recursos Humanos
   - Cadastro de funcionários com dados completos
   - Controle de escalas de trabalho
   - Solicitações de férias e afastamentos
   - Dashboard com estatísticas

3. **Gestão de Eventos** - Salas e Eventos
   - Cadastro de espaços (salas de reunião, auditórios, salões)
   - Capacidades por tipo de layout
   - Precificação (hora, meio período, dia inteiro)
   - Agendamento de eventos

4. **Emails Transacionais** - Resend Integration
   - Email de confirmação de reserva automático
   - Email de confirmação de pedidos do Marketplace
   - Templates HTML responsivos

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
| Resend | ✅ | Email transacional funcionando |
| Gemini | ✅ | IA para assistentes |

---

## Testes Realizados

### Backend (100% - 13/13 testes)
- ✅ Login e autenticação
- ✅ CRUD de funcionários (RH)
- ✅ Estatísticas de RH
- ✅ Criação de espaços para eventos
- ✅ Criação de eventos
- ✅ Estatísticas de eventos
- ✅ Inicialização de canais OTA
- ✅ Listagem de canais OTA
- ✅ Disponibilidade pública de quartos
- ✅ Criação de reserva pública
- ✅ Envio de email de confirmação

---

## Próximos Passos

### P1 - Próximas Features
- Integrar pagamentos ao Motor de Reservas (checkout de quartos)
- Implementar lógica de sincronização real com OTAs
- Adicionar mais produtos ao Marketplace

### P2 - Módulos Futuros
- Assinaturas recorrentes no Marketplace
- App mobile para hóspedes
- App mobile para staff
- Programa de fidelidade

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
│   ├── tests/
│   │   └── test_hestia_modules.py      # Testes automatizados
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/                      # Shadcn components
        │   └── Sidebar.js
        └── pages/
            ├── OtaIntegrationPage.js
            ├── HrManagementPage.js
            └── EventsManagementPage.js
```

---

*Atualizado: 19/02/2026*
