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

### 4. Hóspede (Portal futuro)
- Faz reservas diretas
- Comunica-se com Jarbas (mordomo digital)
- Acessa serviços do hotel

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

✅ **Design System "Royal Obsidian"**
- Paleta implementada completamente
- Componentes Shadcn customizados
- Animações suaves
- Sidebar glassmórfico

---

## Prioritized Backlog

### P0 - Crítico (Próxima Onda)
- [ ] Motor de Reservas (Booking Engine) público
- [ ] Portal do Hóspede
- [ ] Integração com pagamentos (Stripe, Mercado Pago, CORA)

### P1 - Alta Prioridade
- [ ] Revenue Management básico
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Notificações em tempo real
- [ ] Gestão de tarifas dinâmicas

### P2 - Média Prioridade
- [ ] Channel Manager (OTAs)
- [ ] Gestão de A&B (restaurante/bar)
- [ ] Pré-check-in digital
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
│   ├── server.py          # FastAPI main app
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── context/       # AuthContext
│   │   ├── components/    # UI components + Sidebar + Layout
│   │   ├── pages/         # All page components
│   │   └── App.js         # Main app with routes
│   └── .env              # Frontend env (REACT_APP_BACKEND_URL)
│
└── memory/
    └── PRD.md            # This document
```

### Stack
- **Backend**: FastAPI, Motor (async MongoDB), PyJWT, bcrypt
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Axios
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via emergentintegrations library
- **Payments (Preparado)**: Stripe, Mercado Pago, CORA

---

## Next Tasks List

1. **Onda 2: Motor de Reservas**
   - Página pública de reservas
   - Calendário de disponibilidade
   - Integração com Stripe para pagamentos
   - Confirmação por email

2. **Onda 3: Portal do Hóspede**
   - Login separado para hóspedes
   - Histórico de reservas
   - Comunicação com Jarbas
   - Solicitações de serviços

3. **Melhorias de UX**
   - Responsividade mobile completa
   - Dark/Light mode toggle
   - Internacionalização (EN/ES)

---

## Credentials & Configuration

### Test User
- **Email**: admin@hestia.com
- **Password**: admin123
- **Role**: admin

### Demo Hotel
- **Name**: Grand Hestia Palace
- **Rooms**: 25 (5 andares x 5 quartos)
- **Room Types**: Suite Deluxe, Suite Presidencial, Quarto Superior

### API Keys (Configured)
- GEMINI_API_KEY: ✅ Configured
- EMERGENT_LLM_KEY: ✅ Configured
- STRIPE_API_KEY: ✅ Test key configured
- JWT_SECRET_KEY: ✅ Configured

---

*Documento atualizado em: 10/02/2026*
