# Hestia Staff App

App mobile React Native para funcionários do sistema Hestia Hotel Management.

## Funcionalidades Implementadas

### 1. Login de Funcionários
- Autenticação via email/senha
- Persistência de sessão com SecureStore
- Validação de token JWT

### 2. Dashboard (Home)
- Saudação personalizada
- Estatísticas rápidas (Ocupação, Check-ins, Check-outs, Tarefas)
- Acesso rápido a Check-ins e Check-outs do dia
- Lista de tarefas pendentes
- Lista de check-ins de hoje

### 3. Tarefas (Tasks)
- Lista de tarefas atribuídas ao funcionário
- Filtros: Todas, Pendentes, Em Andamento
- Ações: Iniciar tarefa, Concluir tarefa
- Indicador de prioridade (Alta, Média, Baixa)
- Tipo de tarefa com ícone visual

### 4. Housekeeping
- Grid visual de quartos com status
  - Disponível (verde)
  - Ocupado (azul)
  - Limpeza (amarelo)
  - Manutenção (vermelho)
- Filtro por status
- Alterar status de quartos
- Aba de tarefas de housekeeping
- Ações de iniciar/concluir tarefas

### 5. Solicitações de Hóspedes (Requests)
- Lista de solicitações dos hóspedes
- Filtros: Pendentes, Em Andamento, Todas
- Prioridade visual (Urgente, Alta, Normal, Baixa)
- Tipo de serviço com ícone
- Aceitar e concluir solicitações
- Tempo decorrido desde a solicitação

### 6. Check-ins
- Lista de chegadas do dia
- Informações do hóspede (nome, código de confirmação)
- Detalhes da reserva (quarto, noites, hóspedes)
- Pedidos especiais destacados
- Botão para realizar check-in

### 7. Check-outs
- Lista de saídas do dia
- Resumo financeiro (Total, Pago, Pendente)
- Status de pagamento visual
- Check-outs pendentes e concluídos
- Botão para realizar check-out

### 8. Perfil
- Informações do funcionário
- Função e hotel atual
- Estatísticas de tarefas
- Configurações de conta
- Opção de logout

## Estrutura do Projeto

```
hestia-staff/
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
│   │   ├── DashboardScreen.js  # Dashboard principal
│   │   ├── TasksScreen.js      # Minhas tarefas
│   │   ├── HousekeepingScreen.js # Gestão de quartos
│   │   ├── RequestsScreen.js   # Solicitações de hóspedes
│   │   ├── CheckinsScreen.js   # Check-ins do dia
│   │   ├── CheckoutsScreen.js  # Check-outs do dia
│   │   └── ProfileScreen.js    # Perfil do funcionário
│   └── services/
│       └── api.js              # Serviços de API
```

## APIs Backend Utilizadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login de funcionário |
| `/api/auth/me` | GET | Dados do usuário logado |
| `/api/dashboard/stats` | GET | Estatísticas do hotel |
| `/api/check-in-out/checkins/{hotel_id}` | GET | Check-ins do dia |
| `/api/check-in-out/checkouts/{hotel_id}` | GET | Check-outs do dia |
| `/api/check-in-out/checkin/{id}` | POST | Realizar check-in |
| `/api/check-in-out/checkout/{id}` | POST | Realizar check-out |
| `/api/rooms/{hotel_id}` | GET | Listar quartos |
| `/api/rooms/{id}/status` | PATCH | Atualizar status |
| `/api/housekeeping/tasks/{hotel_id}` | GET | Tarefas de housekeeping |
| `/api/housekeeping/tasks/{id}` | PATCH | Atualizar status tarefa |
| `/api/guest-requests/{hotel_id}` | GET | Solicitações de hóspedes |
| `/api/guest-requests/{id}` | PATCH | Atualizar solicitação |

## Como Executar

```bash
# Instalar dependências
cd /app/mobile/hestia-staff
yarn install

# Iniciar Expo
yarn start

# Ou executar diretamente
yarn android  # Android
yarn ios      # iOS
yarn web      # Web
```

## Credenciais de Teste

- **Email:** admin@hestia.com
- **Password:** admin123

## Design

- **Tema:** Dark Mode Premium
- **Cor Principal:** #D4AF37 (Dourado)
- **Background:** #0B1120 (Azul escuro)
- **Cards:** rgba(255, 255, 255, 0.05)
- **Status:**
  - Verde (#10B981): Disponível/Concluído
  - Azul (#3B82F6): Ocupado/Em andamento
  - Amarelo (#F59E0B): Pendente/Limpeza
  - Vermelho (#EF4444): Urgente/Manutenção

## Dependências Principais

- `expo` ~50.0.0
- `react-native` 0.73.2
- `@react-navigation/native` ^6.1.9
- `@react-navigation/bottom-tabs` ^6.5.11
- `axios` ^1.6.2
- `expo-secure-store` ~12.8.1
- `expo-linear-gradient` ~12.7.1
- `expo-barcode-scanner` ~12.9.2
- `expo-camera` ~14.0.1
