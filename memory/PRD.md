# Hestia - Plataforma de Gestão Hoteleira Premium
## Product Requirements Document (PRD)

---

## ✅ Status Atual - 100% Funcional

### Módulos Implementados

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

---

## Produtos no Marketplace

### Atuais (4 produtos)
- Kit Toalhas Premium 500g - R$ 189,90
- Kit Amenities Luxo 5 peças - R$ 12,90
- Roupão de Banho Felpudo - R$ 129,90
- Café Premium 500g - R$ 45,90

### Novos (script pendente - /app/backend/marketplace_produtos_adicionais.sql)
**Enxoval:**
- Jogo de Lençol Percal 400 fios Casal - R$ 279,90
- Jogo de Lençol Percal 400 fios Queen - R$ 329,90
- Travesseiro Pluma de Ganso - R$ 189,90
- Edredom Pluma Sintética King - R$ 459,90
- Chinelo Descartável Spa (Par) - R$ 4,90

**Amenities:**
- Kit Amenities Premium 8 peças - R$ 24,90
- Sabonete em Barra 30g (Cx 100un) - R$ 89,90
- Shampoo Profissional 5L - R$ 79,90
- Kit Dental Hóspede (Cx 200un) - R$ 159,90

**Equipamentos:**
- Frigobar 46L Silencioso - R$ 1.289,90
- Cofre Eletrônico Compact 23L - R$ 459,90
- Secador de Cabelo Parede 1600W - R$ 189,90
- Chaleira Elétrica Inox 1L - R$ 129,90
- Smart TV 43" 4K Hotel Mode - R$ 1.899,90

**Decoração:**
- Cortina Blackout 2,80x1,80m - R$ 189,90
- Quadro Decorativo Abstrato 60x80 - R$ 149,90
- Vaso Cerâmica Decorativo 25cm - R$ 79,90

**Alimentos & Bebidas:**
- Kit Chás Premium 60 sachês - R$ 89,90
- Água Mineral 500ml (Fardo 12un) - R$ 18,90
- Mix Nuts Premium 50g (Cx 30un) - R$ 179,90
- Chocolate Belga 25g (Cx 50un) - R$ 149,90

**Serviços:**
- Serviço de Lavanderia Mensal - R$ 2.899,90
- Consultoria Revenue Management - R$ 3.500,00
- Treinamento Equipe Recepção - R$ 4.200,00

---

## Credentials

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace

### Integrações
- **Stripe**: sk_test_emergent (teste)
- **Mercado Pago**: Configurado (produção)
- **CORA**: Configurado (requer certificados mTLS)
- **Resend**: RESEND_API_KEY vazio - precisa de chave real
- **Gemini**: Configurado

---

## Pendências

### ⚠️ Ação Necessária
1. **Executar script SQL de produtos adicionais**:
   `/app/backend/marketplace_produtos_adicionais.sql`

2. **Configurar Resend para emails reais**:
   - Criar conta em https://resend.com
   - Adicionar chave em `RESEND_API_KEY` no .env
   - Verificar domínio para envio

---

## Tech Stack

- **Backend**: FastAPI + Supabase Python Client
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **AI**: Gemini 3 Flash
- **Payments**: Stripe, Mercado Pago, CORA
- **Email**: Resend (pendente configuração)
- **Charts**: Recharts

---

## Future Backlog

### P1 - Próximas Features
- Integração com OTAs (Booking, Expedia)
- Assinaturas recorrentes no Marketplace
- Programa de fidelidade

### P2 - Módulos Adicionais
- Gestão de Pessoas (RH)
- Manutenção preventiva
- Eventos e Salas
- ESG

### P3 - Visão de Longo Prazo
- App mobile para hóspedes
- App mobile para staff
- API pública
- White-label

---

*Atualizado: 19/02/2026*
