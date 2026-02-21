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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { reservationService } from '../services/api';

const CheckinsScreen = ({ navigation }) => {
  const { hotelId } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    try {
      const data = await reservationService.getTodayCheckins(hotelId);
      setCheckins(data);
    } catch (error) {
      console.error('Error loading checkins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCheckins();
  };

  const handleCheckin = async (reservation) => {
    Alert.alert(
      'Confirmar Check-in',
      `Deseja realizar o check-in de ${reservation.guest_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setProcessingId(reservation.id);
            try {
              await reservationService.performCheckin(reservation.id, reservation.room_id);
              Alert.alert('Sucesso', 'Check-in realizado com sucesso!');
              loadCheckins();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível realizar o check-in');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Check-ins Hoje</Text>
          <Text style={styles.headerSubtitle}>{checkins.length} hóspedes</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.summaryValue}>
            {checkins.filter(c => c.status === 'pending' || c.status === 'confirmed').length}
          </Text>
          <Text style={styles.summaryLabel}>Aguardando</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.summaryValue}>
            {checkins.filter(c => c.status === 'checked_in').length}
          </Text>
          <Text style={styles.summaryLabel}>Realizados</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
        showsVerticalScrollIndicator={false}
      >
        {checkins.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="enter-outline" size={64} color="#475569" />
            <Text style={styles.emptyTitle}>Nenhum check-in hoje</Text>
            <Text style={styles.emptyText}>Não há chegadas previstas para hoje</Text>
          </View>
        ) : (
          checkins.map((reservation, index) => (
            <View key={index} style={styles.checkinCard}>
              <View style={styles.cardHeader}>
                <View style={styles.guestInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {reservation.guest_name?.charAt(0)?.toUpperCase() || 'H'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.guestName}>{reservation.guest_name}</Text>
                    <Text style={styles.confirmationCode}>{reservation.confirmation_code}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(reservation.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
                    {reservation.status === 'checked_in' ? 'Check-in Feito' : 'Aguardando'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="bed-outline" size={16} color="#94A3B8" />
                  <Text style={styles.detailText}>Quarto {reservation.room_number}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="moon-outline" size={16} color="#94A3B8" />
                  <Text style={styles.detailText}>{reservation.nights} noites</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={16} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {reservation.adults || 1} adulto(s)
                  </Text>
                </View>
              </View>

              {reservation.special_requests && (
                <View style={styles.requestsContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#D4AF37" />
                  <Text style={styles.requestsText}>{reservation.special_requests}</Text>
                </View>
              )}

              {reservation.status !== 'checked_in' && (
                <TouchableOpacity
                  style={styles.checkinButton}
                  onPress={() => handleCheckin(reservation)}
                  disabled={processingId === reservation.id}
                >
                  {processingId === reservation.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="enter-outline" size={20} color="#FFF" />
                      <Text style={styles.checkinButtonText}>Realizar Check-in</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  checkinCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  confirmationCode: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  requestsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  requestsText: {
    flex: 1,
    fontSize: 13,
    color: '#D4AF37',
    lineHeight: 18,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  checkinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CheckinsScreen;
