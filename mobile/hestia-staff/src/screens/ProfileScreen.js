import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, hotel, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getRoleName = (role) => {
    const roles = {
      admin: 'Administrador',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      housekeeping: 'Governança',
      maintenance: 'Manutenção',
      staff: 'Funcionário'
    };
    return roles[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#151E32', '#0B1120']} style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
              <View style={styles.statusIndicator} />
            </View>
            
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userRole}>{getRoleName(user?.role)}</Text>
            
            <View style={styles.hotelBadge}>
              <Ionicons name="business-outline" size={14} color="#D4AF37" />
              <Text style={styles.hotelName}>{hotel?.name || 'Hotel'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Tarefas Hoje</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Este Mês</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Account Section */}
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Dados Pessoais</Text>
                <Text style={styles.menuValue}>{user?.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Alterar Senha</Text>
                <Text style={styles.menuValue}>••••••••</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Work Section */}
          <Text style={styles.sectionTitle}>Trabalho</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="business-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Hotel</Text>
                <Text style={styles.menuValue}>{hotel?.name || 'Não selecionado'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="briefcase-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Função</Text>
                <Text style={styles.menuValue}>{getRoleName(user?.role)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Escala de Trabalho</Text>
                <Text style={styles.menuValue}>Ver horários</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Notificações</Text>
                <Text style={styles.menuValue}>Ativadas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="language-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Idioma</Text>
                <Text style={styles.menuValue}>Português (Brasil)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="help-circle-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Ajuda</Text>
                <Text style={styles.menuValue}>Central de suporte</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Hestia Staff App v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#0B1120',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  hotelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  hotelName: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 2,
  },
  menuValue: {
    fontSize: 13,
    color: '#94A3B8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#475569',
  },
});

export default ProfileScreen;
