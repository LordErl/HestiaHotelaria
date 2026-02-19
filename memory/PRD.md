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

## ✅ What's Been Implemented (100% Funcional)

### Onda 1: PMS Core & Front Desk ✅
- Dashboard com KPIs em tempo real
- Gestão de Reservas completa
- Mapa de Quartos interativo
- Check-in/Check-out digital
- Housekeeping com fila de tarefas
- Assistentes IA (Hestia gestão + Jarbas hóspedes)

### Onda 2: Motor de Reservas + Portal do Hóspede ✅
- Motor de Reservas público (/booking) com pagamento integrado
- Portal do Hóspede (/guest-portal)
- APIs públicas de disponibilidade
- Chat com Jarbas no portal

### Onda 3: Integração de Pagamentos ✅
- **3 provedores**: Stripe, Mercado Pago, CORA
- **Painel administrativo** (/payment-settings)
- **Checkout completo** no Motor de Reservas:
  - PIX Mercado Pago com QR Code em tempo real
  - Checkout Stripe para cartão internacional
  - Polling automático de status

### Onda 4: Notificações por Email ✅
- Integração com Resend API
- Email de confirmação de reserva (HTML responsivo)
- Email de confirmação de pagamento
- Templates com tema Royal Obsidian

### Onda 5: Revenue Management ✅
- Dashboard com KPIs: ADR, RevPAR, Taxa de Ocupação
- Gráficos: Receita diária, Receita por tipo de quarto
- Previsão de receita (próximos 30 dias)
- Sugestões de precificação dinâmica

### Onda 6: Marketplace Hestia ✅ (COMPLETO)
- **Catálogo completo** com 4 produtos e 6 categorias
- **Carrinho de compras** funcional
- **Checkout** com endereço de entrega
- **Sistema de pedidos** com numeração automática
- **Gestão de estoque** automática
- Badges de desconto e destaque
- Modal de detalhes do produto

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

## Credentials

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace

### Chaves de Pagamento (no .env)
- **Stripe**: sk_test_emergent (teste)
- **Mercado Pago**: APP_USR-4419048675246744-... (produção)
- **CORA**: int-5PTFg75sSxJfcIYUFgQWqe (produção)

---

## Produtos do Marketplace (Demo)

| Produto | Preço | Preço Mercado | Desconto |
|---------|-------|---------------|----------|
| Kit Toalhas Premium 500g | R$ 189,90 | R$ 249,90 | -24% |
| Kit Amenities Luxo 5 peças | R$ 12,90 | R$ 18,90 | -32% |
| Roupão de Banho Felpudo | R$ 129,90 | R$ 179,90 | -28% |
| Café Premium 500g | R$ 45,90 | R$ 59,90 | -23% |

---

## Future Backlog

### P1 - Próximas Features
- Adicionar mais produtos ao Marketplace
- Página de histórico de pedidos
- Admin: Gestão de produtos do Marketplace
- Configurar Resend para emails reais

### P2 - Módulos Adicionais
- Financeiro & Estoque expandido
- Integração com OTAs (Booking, Expedia)
- Gestão de Pessoas
- Manutenção expandida
- Eventos e Salas

### P3 - Visão de Longo Prazo
- App mobile para hóspedes
- App mobile para staff
- API pública para integrações
- White-label para redes

---

*Atualizado: 18/02/2026 - Marketplace Hestia 100% funcional*
