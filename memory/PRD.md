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

## User Personas

### 1. Gestor/Administrador de Hotel
- Necessita visão geral do negócio (KPIs, ocupação, receita)
- Usa Hestia IA para insights estratégicos
- Acessa relatórios e analytics

### 2. Recepcionista
- Realiza check-ins e check-outs
- Gerencia reservas
- Consulta status de quartos

### 3. Equipe de Housekeeping
- Visualiza fila de tarefas de limpeza
- Atualiza status dos quartos
- Reporta manutenções

### 4. Hóspede
- Faz reservas diretas via Motor de Reservas
- Acessa Portal do Hóspede com código de confirmação
- Comunica-se com Jarbas (mordomo digital)
- Solicita serviços do hotel

---

## Core Requirements (Static)

### Funcionalidades Essenciais
1. Autenticação JWT própria
2. Dashboard com KPIs em tempo real
3. Gestão de reservas completa
4. Mapa de quartos interativo
5. Check-in/Check-out digital
6. Módulo de Housekeeping
7. Assistentes IA (Hestia e Jarbas)
8. Multi-hotel support
9. API REST completa
10. Motor de Reservas público
11. Portal do Hóspede

### Design Requirements
- Tema "Royal Obsidian": fundo azul navy escuro (#0B1120)
- Acentos dourados (#D4AF37)
- Tipografia: Playfair Display (títulos) + Manrope (corpo)
- Estética de luxo e sofisticação

---

## What's Been Implemented

### Onda 1: PMS Core & Front Desk (10/02/2026)
✅ **Backend (FastAPI + MongoDB)**
- Autenticação JWT completa (register, login, me)
- CRUD de Hotels, RoomTypes, Rooms, Guests, Reservations
- Dashboard stats e gráficos (ocupação, receita)
- Check-in/Check-out endpoints
- Chat com IA (Hestia + Jarbas via Gemini 3 Flash)
- Seed data para demonstração

✅ **Frontend (React + Tailwind + Shadcn UI)**
- Página de Login/Registro
- Dashboard com KPIs e gráficos Recharts
- Página de Reservas com criação de novas reservas
- Mapa de Quartos organizado por andar
- Página de Hóspedes com cadastro
- Check-in/Out com tabs (chegadas, na casa, saídas)
- Housekeeping com fila de tarefas
- Chat com assistentes IA

### Onda 2: Motor de Reservas + Portal do Hóspede (10/02/2026)
✅ **Motor de Reservas (/booking)**
- Página pública sem necessidade de login
- Busca de disponibilidade por datas
- Seleção de tipo de quarto com preços
- Formulário de dados do hóspede
- Seleção de método de pagamento (Stripe, Mercado Pago, PIX)
- Confirmação com código de reserva
- Design elegante com steps visuais

✅ **Portal do Hóspede (/guest-portal)**
- Login com email + código de confirmação
- Visualização da reserva atual
- Histórico de reservas
- Quick actions (Room Service, Housekeeping, etc)
- Chat integrado com Jarbas (IA)
- Informações do hotel

✅ **APIs Públicas**
- GET /api/public/hotels
- GET /api/public/availability
- POST /api/public/reservations
- POST /api/guest-portal/login
- POST /api/guest-portal/chat

---

## Prioritized Backlog

### P0 - Crítico (Próxima Onda)
- [ ] Integração real com Stripe (checkout session)
- [ ] Integração Mercado Pago (PIX QR Code)
- [ ] Notificações por email (confirmação de reserva)
- [ ] Pré-check-in digital via Portal

### P1 - Alta Prioridade
- [ ] Revenue Management básico
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Notificações em tempo real (websockets)
- [ ] Gestão de tarifas dinâmicas

### P2 - Média Prioridade
- [ ] Channel Manager (OTAs)
- [ ] Gestão de A&B (restaurante/bar)
- [ ] NFC-e e fiscal

### P3 - Baixa Prioridade
- [ ] Módulo ESG completo
- [ ] Eventos e conferências
- [ ] Gestão de pessoas e escalas
- [ ] App mobile nativo

---

## Technical Architecture

```
/app/
├── backend/
│   ├── server.py          # FastAPI main app (all routes)
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── context/       # AuthContext
│   │   ├── components/    # UI components + Sidebar + Layout
│   │   ├── pages/         # All page components (11 pages)
│   │   └── App.js         # Main app with routes
│   └── .env              # Frontend env (REACT_APP_BACKEND_URL)
│
└── memory/
    └── PRD.md            # This document
```

### Stack
- **Backend**: FastAPI, Motor (async MongoDB), PyJWT, bcrypt
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Axios, date-fns
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via emergentintegrations library
- **Payments (Preparado)**: Stripe, Mercado Pago, CORA, PIX

---

## URLs da Aplicação

| Rota | Descrição | Acesso |
|------|-----------|--------|
| /login | Login administrativo | Público |
| / | Dashboard | Admin |
| /reservations | Gestão de reservas | Admin |
| /rooms | Mapa de quartos | Admin |
| /guests | Lista de hóspedes | Admin |
| /check-in-out | Check-in/Check-out | Admin |
| /housekeeping | Tarefas de limpeza | Admin |
| /chat | Chat com IA | Admin |
| /booking | Motor de Reservas | Público |
| /guest-portal | Portal do Hóspede | Hóspede |

---

## Credentials & Configuration

### Admin Test User
- **Email**: admin@hestia.com
- **Password**: admin123
- **Role**: admin

### Demo Hotel
- **Name**: Grand Hestia Palace
- **ID**: 3fb1630b-f0b8-4340-923a-6a6217c590df
- **Rooms**: 25 (5 andares x 5 quartos)
- **Room Types**: Suite Deluxe, Suite Presidencial, Quarto Superior

### API Keys (Configured)
- GEMINI_API_KEY: ✅ Configured
- EMERGENT_LLM_KEY: ✅ Configured
- STRIPE_API_KEY: ✅ Test key configured
- JWT_SECRET_KEY: ✅ Configured

---

## Next Tasks List

1. **Onda 3: Pagamentos Reais**
   - Integração Stripe Checkout Session
   - Mercado Pago PIX QR Code real
   - Webhooks de confirmação de pagamento
   - Atualização automática de status de reserva

2. **Onda 4: Comunicação**
   - Email de confirmação de reserva
   - Notificações push
   - Lembretes de check-in

3. **Melhorias de UX**
   - Responsividade mobile completa
   - Dark/Light mode toggle
   - Internacionalização (EN/ES)

---

*Documento atualizado em: 10/02/2026 - Onda 2 completa*
