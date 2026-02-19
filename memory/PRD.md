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
| **Integração OTAs** | ✅ PAINEL | Booking, Expedia, Airbnb, Decolar (painel admin pronto) |
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

### Validação Completa dos Módulos (Testado com Testing Agent)

#### Programa de Fidelidade (`/loyalty`) ✅ TESTADO
- **4 Tiers**: Bronze (1x), Silver (1.25x), Gold (1.5x), Platinum (2x)
- **5 Recompensas**: Diária Grátis (2500pts), Upgrade (1000pts), Spa (800pts), Jantar (1200pts), Transfer (500pts)
- **3 Abas**: Recompensas, Membros, Tiers
- Dashboard com 5 estatísticas (Membros, Ativos Mês, Pontos Emitidos, Resgatados Mês, Média/Membro)

#### Relatórios Avançados (`/reports`) ✅ TESTADO
- **6 KPIs** com indicadores de tendência: Receita Total, Ocupação, ADR, RevPAR, Reservas, Estadia Média
- **4 Abas**: Receita, Ocupação, Hóspedes, Canais
- Gráficos interativos: Área (receita), Barras (ocupação), Pizza (composição)
- Filtro por período: Semana, Mês, Trimestre, Ano
- Análise de canais com comissões e insights
- Botão de exportação

#### Motor de Reservas (`/booking`) ✅ TESTADO
- **5 Passos**: Busca → Seleção de Quarto → Dados do Hóspede → Pagamento → Confirmação
- 3 tipos de quarto: Suite Deluxe Vista Mar, Suite Presidencial, Quarto Superior
- **3 Formas de Pagamento**: PIX (Mercado Pago), Cartão (Mercado Pago), Cartão Internacional (Stripe)
- QR Code PIX com copia e cola
- Resumo da reserva em tempo real
- Email de confirmação automático

#### App Mobile Hóspede (`/mobile-guest`) - WEB
- Dashboard personalizado com informações do quarto
- Pontos de fidelidade
- 6 serviços: Room Service, Spa, Concierge, Transporte, Lavanderia, Manutenção
- Nota: Implementado como página web responsiva, não React Native nativo

#### App Mobile Staff (`/mobile-staff`) - WEB  
- Dashboard com estatísticas do dia
- Check-ins e Check-outs pendentes
- Lista de tarefas e solicitações
- Nota: Implementado como página web responsiva, não React Native nativo

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

### Iteration 8 - Frontend Testing (19/02/2026)
- **Frontend**: 100% (Todas as 3 páginas carregam e funcionam corretamente)
- **Páginas Testadas**: Loyalty, Reports, Booking Engine
- **Resultado**: PASSED

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

### P0 - Clarificação Necessária
- **App Mobile React Native**: O usuário solicitou "React Native" para os apps mobile, mas foram criadas páginas web responsivas. Confirmar se deseja:
  - a) Seguir com PWA (Progressive Web App) usando o código existente
  - b) Criar projeto separado em React Native nativo

### P1 - Integrações Reais
- Sincronização real com APIs de OTAs (Booking.com, Expedia) - atualmente MOCKED
- Cobrança automática recorrente nas assinaturas (Stripe Billing)
- Integração real com CORA (requer certificados mTLS)

### P2 - Melhorias
- Notificações push para mobile apps
- Dashboard em tempo real com WebSockets
- Exportação de relatórios para PDF/Excel
- Dados de demonstração para Programa de Fidelidade (atualmente 0 membros)

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
| OTA Sync | MOCKED | Retorna dados simulados de sincronização |
| Reports Data | MOCKED | Gera dados aleatórios para demonstração |
| Mobile Guest | MOCKED | Dados de hóspede simulados |
| Loyalty Stats | REAL | Retorna 0 membros (nenhum membro cadastrado ainda) |

---

*Atualizado: 19/02/2026 - Após validação com Testing Agent*
