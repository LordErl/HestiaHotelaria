import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { guest, reservation, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getDaysRemaining = () => {
    const checkout = new Date(reservation?.check_out_date);
    const today = new Date();
    const diff = Math.ceil((checkout - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const quickActions = [
    { icon: 'restaurant-outline', label: 'Room Service', screen: 'Services', color: '#F59E0B' },
    { icon: 'sparkles-outline', label: 'Spa', screen: 'Services', color: '#EC4899' },
    { icon: 'chatbubble-outline', label: 'Concierge', screen: 'Chat', color: '#8B5CF6' },
    { icon: 'car-outline', label: 'Transporte', screen: 'Services', color: '#10B981' },
    { icon: 'shirt-outline', label: 'Lavanderia', screen: 'Services', color: '#3B82F6' },
    { icon: 'construct-outline', label: 'Manutenção', screen: 'Services', color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#151E32', '#0B1120']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {guest?.name?.split(' ')[0]}!</Text>
            <Text style={styles.roomInfo}>Quarto {reservation?.room_number || '---'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Stay Card */}
        <View style={styles.stayCard}>
          <View style={styles.stayDates}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(reservation?.check_in_date)}</Text>
            </View>
            <View style={styles.dateDivider}>
              <Ionicons name="arrow-forward" size={20} color="#D4AF37" />
              <Text style={styles.nightsText}>{reservation?.nights || 0} noites</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(reservation?.check_out_date)}</Text>
            </View>
          </View>
          
          <View style={styles.stayProgress}>
            <View style={[styles.progressBar, { width: `${100 - (getDaysRemaining() / (reservation?.nights || 1)) * 100}%` }]} />
          </View>
          <Text style={styles.daysRemaining}>
            {getDaysRemaining()} dias restantes
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Serviços Rápidos</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loyalty Points */}
        <TouchableOpacity style={styles.loyaltyCard} onPress={() => navigation.navigate('Loyalty')}>
          <View style={styles.loyaltyContent}>
            <Ionicons name="star" size={32} color="#D4AF37" />
            <View style={styles.loyaltyInfo}>
              <Text style={styles.loyaltyTitle}>Hestia Rewards</Text>
              <Text style={styles.loyaltyPoints}>0 pontos disponíveis</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </TouchableOpacity>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <TouchableOpacity style={styles.infoCard}>
            <Ionicons name="wifi" size={24} color="#10B981" />
            <Text style={styles.infoTitle}>Wi-Fi</Text>
            <Text style={styles.infoValue}>HestiaGuest</Text>
            <Text style={styles.infoSubvalue}>Senha: welcome2024</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#3B82F6" />
            <Text style={styles.infoTitle}>Recepção</Text>
            <Text style={styles.infoValue}>24 horas</Text>
            <Text style={styles.infoSubvalue}>Ramal: 0</Text>
          </TouchableOpacity>
        </View>

        {/* Explore */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exploreScroll}>
          {['Restaurante', 'Spa', 'Piscina', 'Academia', 'Bar'].map((place, index) => (
            <TouchableOpacity key={index} style={styles.exploreCard}>
              <View style={styles.explorePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#475569" />
              </View>
              <Text style={styles.exploreLabel}>{place}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  roomInfo: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  stayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stayDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  dateDivider: {
    alignItems: 'center',
  },
  nightsText: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 4,
  },
  stayProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  daysRemaining: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loyaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  loyaltyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loyaltyInfo: {},
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  loyaltyPoints: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 4,
  },
  infoSubvalue: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  exploreScroll: {
    marginBottom: 24,
  },
  exploreCard: {
    width: 140,
    marginRight: 12,
  },
  explorePlaceholder: {
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreLabel: {
    fontSize: 14,
    color: '#F8FAFC',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
