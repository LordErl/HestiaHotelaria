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
| **Integração OTAs** | ✅ | Booking, Expedia, Airbnb, Decolar + sync |
| **Gestão de Eventos** | ✅ | Espaços e agendamento de eventos |
| **Gestão de RH** | ✅ | Funcionários, escalas, férias |
| **Emails Transacionais** | ✅ | Confirmação de reserva e pedidos via Resend |
| **Assinaturas** | ✅ | Planos recorrentes no Marketplace |

---

## Implementações Recentes (19/02/2026)

### Assinaturas Recorrentes no Marketplace
- **Status**: ✅ Funcional
- **Página**: `/subscriptions`
- **Funcionalidades**:
  - 4 planos disponíveis com preços diferenciados
  - Ciclos: semanal, quinzenal, mensal, trimestral
  - Benefícios: frete grátis, entrega prioritária
  - Criar, pausar, reativar e cancelar assinaturas
  - Dashboard com estatísticas

### Planos de Assinatura Criados
| Plano | Preço | Ciclo | Desconto |
|-------|-------|-------|----------|
| Kit Amenities Básico | R$ 349,90 | Mensal | 22% |
| Kit Amenities Premium | R$ 899,90 | Mensal | 25% |
| Enxoval Essencial | R$ 2.499,90 | Trimestral | 22% |
| Frigobar Reposição | R$ 189,90 | Semanal | 24% |

### Sincronização OTA Melhorada
- **Status**: ✅ Funcional (simulada)
- **Funcionalidades**:
  - Sincronização manual por canal
  - Estatísticas por canal (comissão, reservas)
  - Logs de sincronização
  - Ativação/desativação de canais

**Nota**: A sincronização retorna dados simulados. Em produção, seria necessário integrar com as APIs reais das OTAs (Booking.com API, Expedia Partner API, etc.)

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
| /subscriptions | Assinaturas Recorrentes |

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

### Iteration 6 - Backend (100% - 10/10 testes)
- ✅ Login e autenticação
- ✅ GET /api/subscriptions/plans (4 planos)
- ✅ POST /api/subscriptions (criar assinatura)
- ✅ GET /api/subscriptions (listar)
- ✅ PATCH /api/subscriptions/{id}/status (pausar/cancelar)
- ✅ GET /api/ota/channels (4 canais)
- ✅ GET /api/ota/stats (estatísticas)
- ✅ POST /api/ota/channels/{id}/sync (sincronização)
- ✅ POST /api/public/reservations + email

### Frontend
- ✅ Página de Assinaturas funcional
- ✅ Página de OTAs funcional

---

## Próximos Passos

### P1 - Próximas Features
- Integrar pagamentos reais nas assinaturas (cobrança automática)
- Conectar APIs reais das OTAs para sincronização

### P2 - Módulos Futuros
- App mobile para hóspedes (React Native)
- App mobile para staff
- Programa de fidelidade
- Relatórios avançados

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
│   ├── tests/
│   │   ├── test_hestia_modules.py
│   │   └── test_subscriptions_ota.py
│   ├── advanced_modules_schema.sql
│   ├── marketplace_schema.sql
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/                      # Shadcn components
        │   └── Sidebar.js
        └── pages/
            ├── SubscriptionsPage.js     # NOVO
            ├── OtaIntegrationPage.js
            ├── HrManagementPage.js
            ├── EventsManagementPage.js
            └── ... (outras páginas)
```

---

## APIs Mockadas/Simuladas

| API | Status | Descrição |
|-----|--------|-----------|
| OTA Sync | MOCKED | Retorna dados simulados, não conecta às APIs reais |
| CORA PIX | MOCKED | Requer certificados mTLS para produção |

---

*Atualizado: 19/02/2026*
