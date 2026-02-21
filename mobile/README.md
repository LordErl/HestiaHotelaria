# Hestia Mobile Apps

Este diretório contém os dois aplicativos móveis React Native para a plataforma Hestia:

## 📱 Apps Disponíveis

### 1. Hestia Guest (`/hestia-guest`)
App para hóspedes do hotel.

**Funcionalidades:**
- Login via código de reserva
- Dashboard com informações da estadia
- Serviços do hotel (Room Service, Spa, etc.)
- Chat com concierge virtual (Jarbas)
- Programa de fidelidade
- Informações do hotel (Wi-Fi, horários)

### 2. Hestia Staff (`/hestia-staff`)
App para funcionários do hotel.

**Funcionalidades:**
- Login com credenciais do sistema
- Dashboard com KPIs em tempo real
- Lista de check-ins/check-outs do dia
- Gestão de tarefas de housekeeping
- Notificações e alertas
- Visualização de quartos

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app no celular (iOS/Android)

### Hestia Guest

```bash
cd /app/mobile/hestia-guest
npm install
npx expo start
```

### Hestia Staff

```bash
cd /app/mobile/hestia-staff
npm install
npx expo start
```

### Opções de Execução

1. **Expo Go (Recomendado para desenvolvimento)**
   - Escaneie o QR code com o app Expo Go
   - iOS: Camera app
   - Android: Expo Go app

2. **Emulador Android**
   ```bash
   npx expo start --android
   ```

3. **Simulador iOS (apenas macOS)**
   ```bash
   npx expo start --ios
   ```

4. **Web Preview**
   ```bash
   npx expo start --web
   ```

---

## 🔐 Credenciais de Teste

### Hestia Guest
- **Código de Reserva:** Use qualquer código válido do sistema
- Exemplo: `RES-ABC123`

### Hestia Staff
- **Email:** `admin@hestia.com`
- **Senha:** `admin123`

---

## 📁 Estrutura dos Projetos

```
hestia-guest/
├── App.js                 # Entrada do app
├── app.json               # Configuração Expo
├── package.json           # Dependências
└── src/
    ├── context/           # Context API (Auth)
    ├── hooks/             # Custom hooks
    ├── navigation/        # React Navigation
    ├── screens/           # Telas do app
    ├── services/          # API services
    └── components/        # Componentes reutilizáveis

hestia-staff/
├── App.js
├── app.json
├── package.json
└── src/
    ├── context/
    ├── hooks/
    ├── navigation/
    ├── screens/
    ├── services/
    └── components/
```

---

## 🎨 Design System

- **Cores Principais:**
  - Background: `#0B1120` (dark blue)
  - Secondary: `#151E32`
  - Accent: `#D4AF37` (gold)
  - Text: `#F8FAFC` (white)
  - Muted: `#94A3B8` (gray)

- **Tipografia:**
  - System fonts (San Francisco / Roboto)
  - Títulos: Bold
  - Body: Regular

---

## 🔗 API Integration

Os apps se conectam à API Hestia em:
```
https://guest-app-preview.preview.emergentagent.com/api
```

Para desenvolvimento local, atualize o `apiUrl` em `app.json`.

---

## 📦 Build para Produção

### Android (APK/AAB)
```bash
npx expo build:android
# ou com EAS Build:
npx eas build --platform android
```

### iOS (IPA)
```bash
npx expo build:ios
# ou com EAS Build:
npx eas build --platform ios
```

---

## 📝 TODO / Próximas Implementações

### Hestia Guest
- [ ] Tela de check-in mobile com foto de documento
- [ ] Marketplace de produtos
- [ ] Tela de conta corrente
- [ ] Push notifications

### Hestia Staff
- [ ] Scanner de QR Code para check-in
- [ ] Tela de gestão de quartos
- [ ] Histórico de notificações
- [ ] Modo offline

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do Expo
2. Confirme que a API está acessível
3. Verifique as credenciais de teste

---

**Desenvolvido para Hestia Hotel Management Platform**
