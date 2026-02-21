# Hestia Guest App

App mobile React Native para hóspedes do sistema Hestia Hotel Management.

## Funcionalidades Implementadas

### 1. Login por Código
- Acesso via código de confirmação da reserva (ex: HESFC0FAA)
- Autenticação segura com SecureStore
- Persistência de sessão

### 2. Tela Inicial (Home)
- Saudação personalizada
- Informações da estadia atual (datas, quarto, progresso)
- Acesso rápido aos serviços (Room Service, Spa, Concierge, etc.)
- Card do programa de fidelidade
- Informações úteis (Wi-Fi, Recepção)
- Exploração de áreas do hotel

### 3. Serviços (Services)
- Grid de 8 serviços disponíveis:
  - Room Service
  - Spa & Bem-estar
  - Concierge
  - Transporte
  - Lavanderia
  - Manutenção
  - Arrumação
  - Minibar
- Solicitação de serviços com um toque
- Lista de solicitações com status

### 4. Chat com Concierge (Chat)
- Conversa com assistente IA (Jarbas)
- Respostas rápidas predefinidas
- Histórico de mensagens
- Indicador de digitação

### 5. Perfil e Fidelidade (Profile)
- Informações do hóspede
- Estatísticas (estadias, pontos)
- Nível do programa de fidelidade
- Resgate de recompensas:
  - Diária Grátis (2500 pts)
  - Upgrade de Quarto (1000 pts)
  - Spa 1h (800 pts)
  - Jantar para 2 (1200 pts)
  - Transfer Aeroporto (500 pts)
- Menu de configurações
- Logout

### 6. Minhas Reservas (Reservations)
- Lista de reservas próximas
- Histórico de reservas passadas
- Detalhes completos da reserva
- Status visual (pendente, confirmada, check-in, etc.)
- Informações de pagamento

### 7. Nova Reserva (NewBooking)
- Fluxo em 4 etapas:
  1. Seleção de datas
  2. Escolha do tipo de quarto
  3. Revisão e confirmação
  4. Confirmação com código
- Seleção de hóspedes (adultos/crianças)
- Cálculo automático de valores

### 8. Minha Conta (Account)
- Saldo da conta (consumos vs pagos)
- Histórico de transações
- Informações da estadia atual
- Estatísticas do hóspede
- Ações (solicitar fatura, pagamentos)

## Estrutura do Projeto

```
hestia-guest/
├── App.js
├── app.json
├── package.json
├── src/
│   ├── context/
│   │   └── AuthContext.js      # Contexto de autenticação
│   ├── navigation/
│   │   └── AppNavigator.js     # Navegação (tabs + stack)
│   ├── screens/
│   │   ├── LoginScreen.js      # Tela de login
│   │   ├── HomeScreen.js       # Tela inicial
│   │   ├── ServicesScreen.js   # Serviços do hotel
│   │   ├── ChatScreen.js       # Chat com IA
│   │   ├── ProfileScreen.js    # Perfil e fidelidade
│   │   ├── ReservationsScreen.js # Minhas reservas
│   │   ├── NewBookingScreen.js # Nova reserva
│   │   └── AccountScreen.js    # Conta corrente
│   └── services/
│       └── api.js              # Serviços de API
```

## APIs Backend Utilizadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/guest-portal/access` | POST | Login por código |
| `/api/guest-portal/reservations/{guest_id}` | GET | Listar reservas |
| `/api/guest-portal/services/{hotel_id}` | GET | Listar serviços |
| `/api/guest-portal/service-request` | POST | Solicitar serviço |
| `/api/guest-portal/requests/{guest_id}` | GET | Listar solicitações |
| `/api/guest-portal/chat` | POST | Chat com IA |
| `/api/guest-portal/loyalty/{guest_id}` | GET | Info fidelidade |
| `/api/guest-portal/account/{guest_id}` | GET | Conta corrente |
| `/api/guest-portal/booking` | POST | Criar reserva |
| `/api/public/availability` | GET | Verificar disponibilidade |

## Como Executar

```bash
# Instalar dependências
cd /app/mobile/hestia-guest
yarn install

# Iniciar Expo
yarn start

# Ou executar diretamente
yarn android  # Android
yarn ios      # iOS
yarn web      # Web
```

## Códigos de Teste

Códigos de reserva disponíveis para teste:
- `HESFC0FAA`
- `HES2E6EC3`
- `HES10F270`
- `HES6964A0`
- `HESB2CA23`

## Design

- **Tema:** Dark Mode Premium
- **Cor Principal:** #D4AF37 (Dourado)
- **Background:** #0B1120 (Azul escuro)
- **Cards:** rgba(255, 255, 255, 0.05)
- **Tipografia:** Sistema nativo

## Dependências Principais

- `expo` ~50.0.0
- `react-native` 0.73.2
- `@react-navigation/native` ^6.1.9
- `@react-navigation/bottom-tabs` ^6.5.11
- `axios` ^1.6.2
- `expo-secure-store` ~12.8.1
- `expo-linear-gradient` ~12.7.1
