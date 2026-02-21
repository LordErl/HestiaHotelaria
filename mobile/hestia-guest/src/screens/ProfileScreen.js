import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { loyaltyService } from '../services/api';

const TIER_COLORS = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
};

const ProfileScreen = ({ navigation }) => {
  const { guest, reservation, hotelId, logout } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const data = await loyaltyService.getMemberInfo(guest?.id, hotelId);
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLoyaltyData();
  };

  const handleRedeemReward = (reward) => {
    const memberPoints = loyaltyData?.member?.points || 0;
    
    if (memberPoints < reward.points_required) {
      Alert.alert('Pontos Insuficientes', `Você precisa de ${reward.points_required} pontos para resgatar esta recompensa.`);
      return;
    }

    Alert.alert(
      'Resgatar Recompensa',
      `Deseja resgatar "${reward.name}" por ${reward.points_required} pontos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resgatar',
          onPress: async () => {
            try {
              await loyaltyService.redeemReward(guest?.id, reward.id);
              Alert.alert('Sucesso', 'Recompensa resgatada com sucesso!');
              loadLoyaltyData();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível resgatar a recompensa');
            }
          }
        }
      ]
    );
  };

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

  const tierColor = TIER_COLORS[loyaltyData?.member?.tier] || TIER_COLORS.Bronze;
  const memberPoints = loyaltyData?.member?.points || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Header Profile */}
        <LinearGradient colors={['#151E32', '#0B1120']} style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {guest?.name?.charAt(0)?.toUpperCase() || 'H'}
                </Text>
              </View>
              {guest?.vip_status && (
                <View style={styles.vipBadge}>
                  <Ionicons name="star" size={12} color="#0B1120" />
                </View>
              )}
            </View>
            
            <Text style={styles.guestName}>{guest?.name || 'Hóspede'}</Text>
            <Text style={styles.guestEmail}>{guest?.email || ''}</Text>
            
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{guest?.total_stays || 0}</Text>
                <Text style={styles.statLabel}>Estadias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{memberPoints}</Text>
                <Text style={styles.statLabel}>Pontos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tierColor }]}>
                  {loyaltyData?.member?.tier || 'Bronze'}
                </Text>
                <Text style={styles.statLabel}>Nível</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Loyalty Card */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Points Card */}
              <View style={[styles.loyaltyCard, { borderColor: `${tierColor}40` }]}>
                <LinearGradient
                  colors={[`${tierColor}20`, 'transparent']}
                  style={styles.loyaltyGradient}
                >
                  <View style={styles.loyaltyHeader}>
                    <Ionicons name="star" size={28} color={tierColor} />
                    <Text style={styles.loyaltyTitle}>Hestia Rewards</Text>
                  </View>
                  
                  <Text style={styles.pointsValue}>{memberPoints}</Text>
                  <Text style={styles.pointsLabel}>pontos disponíveis</Text>
                  
                  {/* Progress to next tier */}
                  {loyaltyData?.tiers && (
                    <View style={styles.tierProgress}>
                      {loyaltyData.tiers.map((tier, index) => (
                        <View key={index} style={styles.tierDot}>
                          <View
                            style={[
                              styles.tierDotInner,
                              memberPoints >= tier.min_points && { backgroundColor: tier.color || '#D4AF37' }
                            ]}
                          />
                          <Text style={[
                            styles.tierName,
                            memberPoints >= tier.min_points && { color: tier.color || '#D4AF37' }
                          ]}>
                            {tier.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* Rewards Section */}
              <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
              
              {loyaltyData?.rewards?.map((reward, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.rewardCard,
                    memberPoints >= reward.points_required && styles.rewardCardAvailable
                  ]}
                  onPress={() => handleRedeemReward(reward)}
                >
                  <View style={styles.rewardIcon}>
                    <Ionicons
                      name={getRewardIcon(reward.name)}
                      size={24}
                      color={memberPoints >= reward.points_required ? '#D4AF37' : '#475569'}
                    />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                  <View style={styles.rewardPoints}>
                    <Text style={[
                      styles.rewardPointsValue,
                      memberPoints >= reward.points_required && { color: '#D4AF37' }
                    ]}>
                      {reward.points_required}
                    </Text>
                    <Text style={styles.rewardPointsLabel}>pts</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Menu Items */}
              <Text style={styles.sectionTitle}>Configurações</Text>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Account')}>
                <View style={styles.menuIcon}>
                  <Ionicons name="wallet-outline" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.menuText}>Minha Conta</Text>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reservations')}>
                <View style={styles.menuIcon}>
                  <Ionicons name="calendar-outline" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.menuText}>Minhas Reservas</Text>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIcon}>
                  <Ionicons name="notifications-outline" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.menuText}>Notificações</Text>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIcon}>
                  <Ionicons name="help-circle-outline" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.menuText}>Ajuda</Text>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                </View>
                <Text style={[styles.menuText, { color: '#EF4444' }]}>Sair</Text>
                <Ionicons name="chevron-forward" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const getRewardIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('diária') || lowerName.includes('noite')) return 'bed-outline';
  if (lowerName.includes('upgrade')) return 'arrow-up-circle-outline';
  if (lowerName.includes('spa')) return 'sparkles-outline';
  if (lowerName.includes('jantar') || lowerName.includes('restaurante')) return 'restaurant-outline';
  if (lowerName.includes('transfer') || lowerName.includes('aeroporto')) return 'car-outline';
  return 'gift-outline';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileInfo: {
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
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4AF37',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  guestEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  loyaltyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loyaltyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  tierProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierDot: {
    alignItems: 'center',
    flex: 1,
  },
  tierDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  tierName: {
    fontSize: 11,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
    marginTop: 8,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rewardCardAvailable: {
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rewardPoints: {
    alignItems: 'center',
  },
  rewardPointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  rewardPointsLabel: {
    fontSize: 10,
    color: '#475569',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
  },
  logoutItem: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});

export default ProfileScreen;
