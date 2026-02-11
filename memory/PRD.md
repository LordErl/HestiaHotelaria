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

---

## Technical Stack

- **Backend**: FastAPI + Supabase Python Client
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **AI**: Gemini 3 Flash via emergentintegrations
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

---

## Credentials

- **Admin**: admin@hestia.com / admin123
- **Hotel Demo**: Grand Hestia Palace
- **Supabase Project**: kcwmyhklmkaadgnqedrr

---

## Next Tasks

1. Integração real com Stripe/Mercado Pago
2. Notificações por email
3. Pré-check-in digital
4. Revenue Management

---

*Atualizado: 11/02/2026 - Migração Supabase completa*
