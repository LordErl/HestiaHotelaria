import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithCode } = useAuth();

  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('Atenção', 'Digite o código da reserva');
      return;
    }

    setLoading(true);
    const result = await loginWithCode(code.trim().toUpperCase());
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro', result.error);
    }
  };

  return (
    <LinearGradient colors={['#0B1120', '#151E32', '#0B1120']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="bed-outline" size={48} color="#D4AF37" />
          </View>
          <Text style={styles.logoText}>Hestia</Text>
          <Text style={styles.logoSubtext}>Portal do Hóspede</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.welcomeText}>
            Digite o código da sua reserva para acessar os serviços do hotel
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={24} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código da Reserva"
              placeholderTextColor="#475569"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
          <Text style={styles.inputHint}>Ex: RES-ABC123</Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0B1120" />
          ) : (
            <>
              <Text style={styles.buttonText}>Acessar</Text>
              <Ionicons name="arrow-forward" size={20} color="#0B1120" />
            </>
          )}
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity style={styles.helpLink}>
          <Ionicons name="help-circle-outline" size={20} color="#94A3B8" />
          <Text style={styles.helpText}>Não encontrou seu código?</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Hestia Hotel Management</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  logoSubtext: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 4,
  },
  welcomeContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 18,
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    marginLeft: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    height: 56,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1120',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
  },
});

export default LoginScreen;
