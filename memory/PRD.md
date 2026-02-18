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
- RLS policies configuradas

### Onda 3: Integração de Pagamentos ✅ (18/02/2026)
- **3 provedores implementados**: Stripe, Mercado Pago, CORA
- **Painel administrativo** para gerenciar provedores (/payment-settings)
- **Motor de Reservas com pagamento integrado**:
  - Seleção de método de pagamento (PIX, Cartão)
  - Checkout Stripe para cartão internacional
  - PIX Mercado Pago com QR Code em tempo real
  - Polling de status de pagamento
- **Webhooks** para confirmação automática

### Onda 4: Notificações por Email ✅ (18/02/2026)
- Integração com Resend API
- Email de confirmação de reserva (HTML responsivo)
- Email de confirmação de pagamento
- Templates com tema Royal Obsidian

### Onda 5: Revenue Management ✅ (18/02/2026)
- **Dashboard completo** com métricas:
  - ADR (Average Daily Rate)
  - RevPAR (Revenue per Available Room)
  - Taxa de Ocupação
  - Lead Time médio de reservas
- **Gráficos interativos**:
  - Evolução da receita diária
  - Distribuição por tipo de quarto (Pie Chart)
  - Previsão de receita (próximos 30 dias)
- **Sugestões de precificação dinâmica** baseadas em demanda
- Filtros por período (7d, 30d, 90d)

### Onda 6: Marketplace Hestia ✅ (18/02/2026) - BACKEND PRONTO
- **Modelo de dados completo** para B2B marketplace
- **APIs implementadas**:
  - Categorias de produtos
  - Catálogo de produtos com filtros
  - Carrinho de compras
  - Sistema de pedidos
  - Admin para gerenciamento
- **Frontend implementado** com:
  - Grid de produtos com imagens
  - Filtros por categoria
  - Sidebar de carrinho
  - Modal de detalhes do produto
- ⚠️ **PENDENTE**: Executar script SQL `/app/backend/marketplace_schema.sql` no Supabase

---

## Technical Stack

- **Backend**: FastAPI + Supabase Python Client
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **AI**: Gemini 3 Flash via emergentintegrations
- **Payments**: Stripe, Mercado Pago SDK, CORA API
- **Email**: Resend API
- **Charts**: Recharts
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
| /revenue | Revenue Management |
| /marketplace | Marketplace Hestia |
| /chat | Chat com IA |
| /payment-settings | Configurações de Pagamento |
| /booking | Motor de Reservas (público) |
| /guest-portal | Portal do Hóspede |

---

## API Endpoints Principais

### Pagamentos
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/payments/stripe/checkout | POST | Cria checkout Stripe |
| /api/payments/mercadopago/pix | POST | Cria PIX Mercado Pago |
| /api/payments/cora/pix | POST | Cria PIX CORA |
| /api/webhook/stripe | POST | Webhook Stripe |
| /api/webhook/mercadopago | POST | Webhook Mercado Pago |

### Revenue Management
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/revenue/analytics | GET | Métricas de receita |
| /api/revenue/forecast | GET | Previsão de receita |
| /api/revenue/pricing-suggestions | GET | Sugestões de preço |

### Marketplace
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/marketplace/categories | GET | Lista categorias |
| /api/marketplace/products | GET | Lista produtos |
| /api/marketplace/cart | GET/POST | Carrinho |
| /api/marketplace/orders | GET/POST | Pedidos |

---

## Credentials

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace
- **Supabase Project**: kcwmyhklmkaadgnqedrr

### Chaves de Pagamento (no .env)
- **Stripe**: sk_test_emergent (teste)
- **Mercado Pago**: APP_USR-4419048675246744-... (produção)
- **CORA**: int-5PTFg75sSxJfcIYUFgQWqe (produção)

---

## Pendências Imediatas (P0)

### ⚠️ AÇÃO NECESSÁRIA: Executar SQL do Marketplace
O script `/app/backend/marketplace_schema.sql` precisa ser executado no Supabase SQL Editor para criar:
- `marketplace_categories` - Categorias de produtos
- `marketplace_products` - Catálogo de produtos
- `marketplace_orders` - Pedidos
- `marketplace_order_items` - Itens dos pedidos
- `marketplace_cart` - Carrinho de compras

---

## Scripts SQL Pendentes

1. `/app/backend/marketplace_schema.sql` - Marketplace Hestia

---

## Future Backlog

- Finalização do checkout do Marketplace
- Módulo Financeiro & Estoque expandido
- Housekeeping & Manutenção expandido
- Distribuição & Vendas (OTAs)
- Gestão de Pessoas
- Segurança
- ESG
- Eventos
- Sistema de Auditoria

---

*Atualizado: 18/02/2026 - Pagamentos, Revenue Management e Marketplace implementados*
