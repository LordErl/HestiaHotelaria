# Hestia - Plataforma de Gestão Hoteleira Premium
## Product Requirements Document (PRD)

---

## Original Problem Statement
Hestia é uma plataforma completa de gestão hoteleira moderna, premium e orientada a dados. Funciona como um verdadeiro sistema operacional do hotel ou grupo hoteleiro, indo muito além de um PMS tradicional.

### Pilares Fundamentais
- **Data-Driven**: Todos os módulos produzem, consomem e cruzam dados para gerar insights acionáveis
- **Hóspede no centro**: Experiências personalizadas, fluidas e elegantes
- **Operação simplificada**: Automação de tarefas e interfaces intuitivas
- **Escalabilidade**: Arquitetura modular, multi-hotel, multi-marca e API-first
- **Sustentabilidade integrada**: Ferramentas de gestão ESG
- **Confiabilidade**: Sistema pensado para uso intenso diário

---

## What's Been Implemented

### Onda 1: PMS Core & Front Desk ✅
- Dashboard com KPIs em tempo real
- Gestão de Reservas completa
- Mapa de Quartos interativo
- Check-in/Check-out digital
- Housekeeping com fila de tarefas
- Assistentes IA (Hestia gestão + Jarbas hóspedes)

### Onda 2: Motor de Reservas + Portal do Hóspede ✅
- Motor de Reservas público (/booking)
- Portal do Hóspede (/guest-portal)
- APIs públicas de disponibilidade
- Chat com Jarbas no portal

### Migração para Supabase ✅
- Backend migrado de MongoDB para Supabase PostgreSQL
- Conexão via Supabase Python Client (REST API)
- Tabelas: users, hotels, room_types, rooms, guests, reservations, chat_history
- RLS policies configuradas

### Onda 3: Integração de Pagamentos ✅ (11/02/2026)
- **Backend implementado** com endpoints para:
  - Stripe Checkout (cartão internacional)
  - Mercado Pago (PIX e cartão)
  - CORA (PIX bancário)
- **Painel administrativo** para configuração de provedores (/payment-settings)
- **Funcionalidades**:
  - Ativar/desativar provedores
  - Configurar chaves de API por hotel
  - Definir prioridade de exibição
  - Gerenciar certificados CORA (mTLS)
- **Variáveis de ambiente** atualizadas com credenciais MP e CORA

---

## Technical Stack

- **Backend**: FastAPI + Supabase Python Client
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **AI**: Gemini 3 Flash via emergentintegrations
- **Payments**: Stripe, Mercado Pago SDK, CORA API
- **Design**: Royal Obsidian (dourado #D4AF37 + navy #0B1120)

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
| /chat | Chat com IA |
| /booking | Motor de Reservas (público) |
| /guest-portal | Portal do Hóspede |
| /payment-settings | Configurações de Pagamento (admin) |

---

## API Endpoints de Pagamento

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/payment-providers/{hotel_id} | GET | Lista provedores de pagamento |
| /api/payment-providers/{hotel_id} | POST | Cria/atualiza provedor |
| /api/payment-providers/{hotel_id}/init | POST | Inicializa provedores padrão |
| /api/payment-providers/{provider_id} | PATCH | Atualiza configuração |
| /api/payment-providers/{provider_id} | DELETE | Remove provedor |
| /api/payments/stripe/checkout | POST | Cria checkout Stripe |
| /api/payments/stripe/status/{session_id} | GET | Verifica status Stripe |
| /api/payments/mercadopago/pix | POST | Cria PIX Mercado Pago |
| /api/payments/mercadopago/status/{payment_id} | GET | Verifica status MP |
| /api/payments/cora/pix | POST | Cria PIX CORA |
| /api/webhook/stripe | POST | Webhook Stripe |
| /api/webhook/mercadopago | POST | Webhook Mercado Pago |

---

## Credentials

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace
- **Supabase Project**: kcwmyhklmkaadgnqedrr

### Chaves de Pagamento (no .env)
- **Stripe**: sk_test_emergent (teste)
- **Mercado Pago**: APP_USR-4419048675246744-... (produção)
- **CORA**: int-5PTFg75sSxJfcIYUFgQWqe (produção - requer certificados mTLS)

---

## Pendências Imediatas (P0)

### ⚠️ AÇÃO NECESSÁRIA: Executar SQL no Supabase
O script `/app/backend/payment_schema.sql` precisa ser executado no Supabase SQL Editor para criar as tabelas:
- `payment_providers` - Configurações dos provedores
- `payment_transactions` - Histórico de transações

---

## Next Tasks

1. ✅ ~~Integração com Stripe/Mercado Pago/CORA~~ (implementado)
2. Executar script SQL no Supabase (ação do usuário)
3. Integrar pagamentos no fluxo de reservas do booking engine
4. Notificações por email de confirmação
5. Pré-check-in digital
6. Revenue Management

---

## Future Backlog

- Módulo Financeiro & Estoque
- Housekeeping & Manutenção expandido
- Distribuição & Vendas (OTAs)
- Revenue Management
- Gestão de Pessoas
- Segurança
- ESG
- Eventos
- Sistema de Auditoria

---

*Atualizado: 11/02/2026 - Integração de Pagamentos implementada*
