# Hestia - Plataforma de Gestão Hoteleira
## Documentação de Funcionalidades para Produção

**Versão:** 2.0.0  
**Data:** 21 de Fevereiro de 2026  
**URL de Produção:** https://hestia-management.preview.emergentagent.com

---

## 📋 Índice

1. [Credenciais de Acesso](#credenciais-de-acesso)
2. [Módulos do Sistema](#módulos-do-sistema)
3. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Integrações de Terceiros](#integrações-de-terceiros)
6. [Observações para Produção](#observações-para-produção)

---

## 🔐 Credenciais de Acesso

### Usuário Administrador
| Campo | Valor |
|-------|-------|
| **Email** | `admin@hestia.com` |
| **Senha** | `admin123` |
| **Perfil** | Administrador |
| **Hotel** | Grand Hestia Palace |
| **Hotel ID** | `480f0940-81a5-4ca7-806d-77ed790c740a` |

### Motor de Reservas (Público)
- **URL:** `/booking`
- **Acesso:** Público (sem autenticação)
- **Função:** Reservas online para hóspedes

### Portal do Hóspede
- **URL:** `/guest-portal`
- **Acesso:** Via código de reserva (ex: `RES-XXXXX`)

---

## 🏨 Módulos do Sistema

### Módulos Operacionais (100%)

| # | Módulo | URL | Status | Descrição |
|---|--------|-----|--------|-----------|
| 1 | Dashboard | `/` | ✅ Operacional | Visão geral com KPIs em tempo real |
| 2 | Reservas | `/reservations` | ✅ Operacional | Gestão completa de reservas |
| 3 | Quartos | `/rooms` | ✅ Operacional | Mapa de quartos e status |
| 4 | Hóspedes | `/guests` | ✅ Operacional | Cadastro e histórico |
| 5 | Check-in/Out | `/check-in-out` | ✅ Operacional | Processo de entrada/saída |
| 6 | Housekeeping | `/housekeeping` | ✅ Operacional | Tarefas de limpeza |
| 7 | Revenue | `/revenue` | ✅ Operacional | Gestão de receitas e tarifas |
| 8 | Marketplace | `/marketplace` | ✅ Operacional | Loja para hóspedes |
| 9 | Meus Pedidos | `/orders` | ✅ Operacional | Histórico de pedidos |
| 10 | Assistente IA | `/ai-assistant` | ✅ Operacional | Chat com Gemini |
| 11 | OTAs | `/otas` | ✅ Operacional | Integração com canais |
| 12 | RH | `/hr` | ✅ Operacional | Gestão de pessoas |
| 13 | Eventos | `/events` | ✅ Operacional | Salas e eventos |
| 14 | Assinaturas | `/subscriptions` | ✅ Operacional | Planos recorrentes |
| 15 | Fidelidade | `/loyalty` | ✅ Operacional | Programa de pontos |
| 16 | Relatórios | `/reports` | ✅ Operacional | Análises avançadas |
| 17 | Motor Reservas | `/booking` | ✅ Operacional | Reservas públicas |
| 18 | Portal Hóspede | `/guest-portal` | ✅ Operacional | Autoatendimento |

---

## ⚙️ Funcionalidades por Módulo

### 1. Dashboard (`/`)
- **Tempo Real:** Atualizações via WebSocket a cada 30 segundos
- **KPIs:**
  - Taxa de ocupação (%)
  - Hóspedes na casa
  - Check-ins do dia
  - Check-outs do dia
  - Receita hoje (R$)
  - Receita do mês (R$)
- **Gráficos:**
  - Taxa de ocupação (7 dias)
  - Receita diária (7 dias)
- **Status de Conexão:** Badge indicando "Tempo Real" ou "Offline"

### 2. Sistema de Notificações
- **Ícone de Sino:** Canto superior direito
- **Badge de Não Lidas:** Contador automático
- **Centro de Notificações:**
  - Lista de notificações recentes
  - Marcar como lida
  - Ativar/desativar push notifications
- **Tipos de Notificação:**
  - Nova reserva
  - Check-in realizado
  - Check-out realizado
  - Tarefa de housekeeping
  - Alertas do sistema

### 3. Reservas (`/reservations`)
- Criar nova reserva
- Editar reserva existente
- Cancelar reserva
- Visualizar detalhes
- Filtros por status, data, hóspede
- Timeline de reservas

### 4. Quartos (`/rooms`)
- Mapa visual de quartos
- Status por cores (disponível, ocupado, limpeza, manutenção)
- Detalhes do quarto
- Histórico de ocupação
- Tipos de quarto com preços

### 5. Hóspedes (`/guests`)
- Cadastro completo
- Documentos (CPF, passaporte)
- Histórico de estadias
- Preferências
- Programa de fidelidade

### 6. Check-in/Out (`/check-in-out`)
- Lista de chegadas do dia
- Lista de saídas do dia
- Processo guiado de check-in
- Processo guiado de check-out
- Emissão de chaves
- Cobrança de extras

### 7. Housekeeping (`/housekeeping`)
- Lista de tarefas pendentes
- Atribuição por camareira
- Status: pendente, em progresso, concluído
- Prioridades
- Tipos: limpeza completa, arrumação, troca de roupa

### 8. Revenue Management (`/revenue`)
- **KPIs:**
  - RevPAR (Revenue per Available Room)
  - ADR (Average Daily Rate)
  - Ocupação
  - Receita total
- **Funcionalidades:**
  - Previsão de demanda
  - Precificação dinâmica
  - Análise de concorrência
  - Relatórios de performance

### 9. Marketplace (`/marketplace`)
- **Para Administradores:**
  - Cadastro de produtos
  - Gestão de categorias
  - Controle de estoque
  - Preços e promoções
- **Para Hóspedes:**
  - Catálogo de produtos
  - Carrinho de compras
  - Checkout com pagamento
  - Histórico de pedidos

### 10. Assistente IA (`/ai-assistant`)
- **Hestia (Gestão):** Para funcionários
  - Consultas sobre reservas
  - Relatórios rápidos
  - Sugestões operacionais
- **Jarbas (Hóspedes):** Para portal do hóspede
  - Informações do hotel
  - Recomendações locais
  - Solicitações de serviço

### 11. Integração OTAs (`/otas`)
- **Canais Suportados:**
  - Booking.com
  - Expedia
  - Airbnb
  - Decolar
- **Funcionalidades:**
  - Painel de configuração de credenciais
  - Teste de conexão
  - Sincronização de disponibilidade
  - Sincronização de tarifas
  - Logs de sincronização
  - Estatísticas por canal
- **Status:** Painel pronto, aguardando credenciais reais

### 12. Gestão de RH (`/hr`)
- Cadastro de funcionários
- Departamentos
- Escalas de trabalho
- Controle de férias
- Folha de pagamento

### 13. Gestão de Eventos (`/events`)
- Cadastro de espaços (salas, salões)
- Agendamento de eventos
- Capacidade e layout
- Serviços adicionais (A&B, equipamentos)
- Calendário de eventos

### 14. Assinaturas (`/subscriptions`)
- Planos de assinatura
- Cobrança recorrente via Stripe
- Portal de autoatendimento
- Histórico de faturas

### 15. Programa de Fidelidade (`/loyalty`)
- **4 Tiers:**
  - Bronze (1x pontos)
  - Silver (1.25x pontos)
  - Gold (1.5x pontos)
  - Platinum (2x pontos)
- **5 Recompensas:**
  - Diária Grátis (2.500 pts)
  - Upgrade de Quarto (1.000 pts)
  - Spa 1h (800 pts)
  - Jantar para 2 (1.200 pts)
  - Transfer Aeroporto (500 pts)
- **Funcionalidades:**
  - Cadastro de membros
  - Acúmulo de pontos
  - Resgate de recompensas
  - Estatísticas do programa

### 16. Relatórios Avançados (`/reports`)
- **6 KPIs com Tendência:**
  - Receita Total
  - Taxa de Ocupação
  - ADR
  - RevPAR
  - Total de Reservas
  - Estadia Média
- **4 Relatórios:**
  - Receita (gráfico de área)
  - Ocupação (gráfico de barras)
  - Hóspedes (origem, perfil)
  - Canais (performance por OTA)
- **Exportação:**
  - CSV
  - JSON
- **Filtros:**
  - Última semana
  - Último mês
  - Último trimestre
  - Último ano

### 17. Motor de Reservas (`/booking`)
- **5 Etapas:**
  1. Busca (datas, hóspedes)
  2. Seleção de quarto
  3. Dados do hóspede
  4. Pagamento
  5. Confirmação
- **3 Tipos de Quarto:**
  - Suite Deluxe Vista Mar
  - Suite Presidencial
  - Quarto Superior
- **3 Formas de Pagamento:**
  - PIX (Mercado Pago) - QR Code
  - Cartão (Mercado Pago)
  - Cartão Internacional (Stripe)
- **Funcionalidades:**
  - Calendário de disponibilidade
  - Cálculo automático de valor
  - Código de confirmação
  - Email de confirmação (Resend)

### 18. Portal do Hóspede (`/guest-portal`)
- Acesso via código de reserva
- Informações da estadia
- Chat com IA (Jarbas)
- Solicitações de serviço
- Marketplace do hotel
- Conta corrente

---

## 🔌 APIs Disponíveis

### Autenticação
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/occupancy-chart
GET /api/dashboard/revenue-chart
WebSocket /ws/dashboard/{hotel_id}
```

### Reservas
```
GET    /api/reservations/{hotel_id}
POST   /api/reservations
PUT    /api/reservations/{id}
DELETE /api/reservations/{id}
```

### Quartos
```
GET  /api/rooms/{hotel_id}
POST /api/rooms
PUT  /api/rooms/{id}
GET  /api/room-types/{hotel_id}
```

### Hóspedes
```
GET  /api/guests/{hotel_id}
POST /api/guests
PUT  /api/guests/{id}
```

### Housekeeping
```
GET   /api/housekeeping/tasks/{hotel_id}
POST  /api/housekeeping/tasks
PATCH /api/housekeeping/tasks/{id}
```

### OTAs
```
GET  /api/ota/channels/{hotel_id}
POST /api/ota/channels/{hotel_id}/init
POST /api/ota/channels/{channel_id}/test
POST /api/ota/channels/{channel_id}/sync-real
GET  /api/ota/stats/{hotel_id}
```

### Pagamentos
```
POST /api/payments/stripe/checkout
POST /api/payments/mercadopago/pix
POST /api/payments/cora/pix
```

### Notificações
```
GET   /api/push/vapid-key
POST  /api/push/subscribe
DELETE /api/push/unsubscribe
POST  /api/push/send
GET   /api/notifications/{hotel_id}
POST  /api/notifications/{hotel_id}
PATCH /api/notifications/{hotel_id}/{id}/read
```

### Relatórios
```
GET /api/reports/overview/{hotel_id}
GET /api/reports/revenue/{hotel_id}
GET /api/reports/occupancy/{hotel_id}
GET /api/reports/guests/{hotel_id}
GET /api/reports/channels/{hotel_id}
GET /api/reports/export/{hotel_id}?format=csv|json
```

### Fidelidade
```
GET  /api/loyalty/config/{hotel_id}
GET  /api/loyalty/stats/{hotel_id}
GET  /api/loyalty/members/{hotel_id}
POST /api/loyalty/points/add
POST /api/loyalty/demo-data/{hotel_id}
```

### Billing (Assinaturas)
```
GET  /api/billing/plans
POST /api/billing/plans
POST /api/billing/subscribe
GET  /api/billing/subscription/{hotel_id}
POST /api/billing/portal/{hotel_id}
POST /api/webhook/stripe-billing
```

---

## 🔗 Integrações de Terceiros

### Configuradas e Operacionais

| Integração | Status | Uso |
|------------|--------|-----|
| **Supabase** | ✅ Ativo | Banco de dados PostgreSQL |
| **Stripe** | ✅ Ativo | Pagamentos com cartão |
| **Mercado Pago** | ✅ Ativo | PIX e cartão Brasil |
| **Resend** | ✅ Ativo | Emails transacionais |
| **Google Gemini** | ✅ Ativo | Assistente IA |

### Configuradas - Aguardando Credenciais

| Integração | Status | Necessário |
|------------|--------|------------|
| **Booking.com** | ⚠️ Painel pronto | API username, password, property_id |
| **Expedia** | ⚠️ Painel pronto | API key, secret, property_id |
| **Airbnb** | ⚠️ Painel pronto | Access token, listing_id |
| **Decolar** | ⚠️ Painel pronto | API key, hotel_id |
| **CORA** | ⚠️ Painel pronto | Certificados mTLS |

---

## ⚠️ Observações para Produção

### Itens Funcionais (Prontos para Uso)
1. ✅ Autenticação JWT
2. ✅ Dashboard com KPIs
3. ✅ CRUD completo de reservas
4. ✅ Motor de reservas público
5. ✅ Pagamentos (Stripe + MP PIX)
6. ✅ Emails de confirmação
7. ✅ Programa de fidelidade
8. ✅ Relatórios com exportação
9. ✅ Notificações em tempo real

### Itens Simulados (MOCKED)
1. ⚠️ Sincronização OTA (retorna dados simulados)
2. ⚠️ Push notifications (não envia para dispositivos reais)
3. ⚠️ Dados de relatórios (parcialmente simulados)
4. ⚠️ Notificações armazenadas em memória

### Pendências para Produção Completa
1. 📋 Executar script SQL: `/app/scripts/loyalty_schema.sql`
2. 📋 Configurar chaves VAPID próprias para push
3. 📋 Obter credenciais reais das OTAs
4. 📋 Persistir notificações no banco de dados
5. 📋 Configurar domínio personalizado

### Variáveis de Ambiente Necessárias

```env
# Backend (.env)
SUPABASE_URL=sua_url
SUPABASE_KEY=sua_key
JWT_SECRET=seu_secret
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR_xxx
RESEND_API_KEY=re_xxx
GEMINI_API_KEY=xxx
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# Frontend (.env)
REACT_APP_BACKEND_URL=https://seu-dominio.com
```

---

## 📱 Próximo Passo: App React Native

O projeto React Native será desenvolvido separadamente para:
- App do Hóspede (check-in mobile, serviços, chat)
- App do Staff (tarefas, notificações, check-in/out)

---

**Documento gerado automaticamente**  
**Hestia Hotel Management Platform v2.0.0**
