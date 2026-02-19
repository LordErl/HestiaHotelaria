# Hestia - Plataforma de Gestão Hoteleira Premium
## Product Requirements Document (PRD)

---

## ✅ Status Atual - Fevereiro 2026

### Módulos Implementados e Funcionais (100%)

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **PMS Core** | ✅ | Dashboard, Quartos, Reservas, Check-in/Out |
| **Housekeeping** | ✅ | Gestão de tarefas de limpeza |
| **Motor de Reservas** | ✅ TESTADO | Booking público com pagamento integrado (Stripe + MP PIX) |
| **Portal do Hóspede** | ✅ | Acesso por código, chat com IA |
| **Pagamentos** | ✅ TESTADO | Stripe, Mercado Pago PIX, CORA |
| **Revenue Management** | ✅ | KPIs, gráficos, previsão, precificação dinâmica |
| **Marketplace** | ✅ | Catálogo, carrinho, checkout, pedidos |
| **Admin Marketplace** | ✅ | Gestão de produtos e pedidos |
| **Assistentes IA** | ✅ | Hestia (gestão) + Jarbas (hóspedes) |
| **Integração OTAs** | ⚠️ MOCKED | Booking, Expedia, Airbnb, Decolar (simulado) |
| **Gestão de Eventos** | ✅ | Espaços e agendamento de eventos |
| **Gestão de RH** | ✅ | Funcionários, escalas, férias |
| **Emails Transacionais** | ✅ | Confirmação de reserva e pedidos via Resend |
| **Assinaturas** | ✅ | Planos recorrentes no Marketplace |
| **Programa de Fidelidade** | ✅ TESTADO | 4 tiers, 5 recompensas, gestão de membros |
| **Relatórios Avançados** | ✅ TESTADO | 6 KPIs, 4 abas com gráficos interativos |
| **App Mobile Hóspede** | ⚠️ WEB | Dashboard web responsivo (não React Native) |
| **App Mobile Staff** | ⚠️ WEB | Dashboard web responsivo (não React Native) |

---

## Implementações Recentes (19/02/2026)

### Programa de Fidelidade (`/loyalty`)
- **4 Tiers**: Bronze (1x), Silver (1.25x), Gold (1.5x), Platinum (2x)
- **5 Recompensas**: Diária Grátis (2500pts), Upgrade (1000pts), Spa (800pts), Jantar (1200pts), Transfer (500pts)
- Gestão de membros e pontos
- Dashboard com estatísticas

### Relatórios Avançados (`/reports`)
- **KPIs**: Receita, Ocupação, ADR, RevPAR, Reservas
- **4 Relatórios**: Receita, Ocupação, Hóspedes, Canais
- Gráficos interativos com Recharts
- Filtro por período (semana, mês, trimestre, ano)
- Análise de canais de distribuição com comissões

### App Mobile Hóspede (`/mobile-guest`)
- Dashboard personalizado com informações do quarto
- Pontos de fidelidade
- 6 serviços: Room Service, Spa, Concierge, Transporte, Lavanderia, Manutenção
- Ações rápidas: Chat, Ver Conta, Late Check-out
- Sistema de solicitações

### App Mobile Staff (`/mobile-staff`)
- Dashboard com estatísticas do dia
- Check-ins e Check-outs do dia
- Lista de tarefas pendentes
- Solicitações de hóspedes
- Sistema de alertas
- Botões de ação para iniciar/concluir tarefas

---

## URLs da Aplicação (24 páginas)

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
| /loyalty | Programa de Fidelidade |
| /reports | Relatórios Avançados |
| /mobile-guest | App Mobile Hóspede |
| /mobile-staff | App Mobile Staff |

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

### Iteration 7 - Backend + Frontend
- **Backend**: 16/16 testes passaram (100%)
- **Frontend**: 4/4 novas páginas funcionando (100%)

### Features Verificadas
- Loyalty: Config, Stats, Members, Add Points, Redeem
- Reports: Overview, Revenue, Occupancy, Guests, Channels
- Mobile Guest: Dashboard, Services, Requests
- Mobile Staff: Dashboard, Tasks, Requests, Alerts

---

## Próximos Passos

### P1 - Aprimoramentos
- Integrar cobrança automática nas assinaturas (Stripe recurring)
- Conectar APIs reais das OTAs para sincronização
- PWA (Progressive Web App) para instalação no celular

### P2 - Melhorias
- Notificações push para mobile apps
- Dashboard em tempo real com WebSockets
- Exportação de relatórios para PDF/Excel

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

## APIs Mockadas/Simuladas

| API | Status | Descrição |
|-----|--------|-----------|
| OTA Sync | MOCKED | Retorna dados simulados |
| Reports Data | MOCKED | Gera dados aleatórios para demo |
| Mobile Guest | MOCKED | Dados de hóspede simulados |

---

*Atualizado: 19/02/2026*
