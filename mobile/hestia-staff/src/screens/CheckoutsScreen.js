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

const CheckoutsScreen = ({ navigation }) => {
  const { hotelId } = useAuth();
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    try {
      const data = await reservationService.getTodayCheckouts(hotelId);
      setCheckouts(data);
    } catch (error) {
      console.error('Error loading checkouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCheckouts();
  };

  const handleCheckout = async (reservation) => {
    const pendingAmount = (reservation.total_amount || 0) - (reservation.paid_amount || 0);
    
    let message = `Deseja realizar o check-out de ${reservation.guest_name}?`;
    if (pendingAmount > 0) {
      message += `\n\nAtenção: Há R$ ${pendingAmount.toFixed(2)} pendente de pagamento.`;
    }

    Alert.alert(
      'Confirmar Check-out',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setProcessingId(reservation.id);
            try {
              await reservationService.performCheckout(reservation.id);
              Alert.alert('Sucesso', 'Check-out realizado com sucesso!');
              loadCheckouts();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível realizar o check-out');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value) => {
    return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getPaymentStatus = (reservation) => {
    const pending = (reservation.total_amount || 0) - (reservation.paid_amount || 0);
    if (pending <= 0) return { text: 'Pago', color: '#10B981' };
    if (reservation.paid_amount > 0) return { text: 'Parcial', color: '#F59E0B' };
    return { text: 'Pendente', color: '#EF4444' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const pendingCheckouts = checkouts.filter(c => c.status !== 'checked_out');
  const completedCheckouts = checkouts.filter(c => c.status === 'checked_out');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Check-outs Hoje</Text>
          <Text style={styles.headerSubtitle}>{checkouts.length} saídas previstas</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="exit-outline" size={24} color="#EF4444" />
          </View>
          <Text style={styles.summaryValue}>{pendingCheckouts.length}</Text>
          <Text style={styles.summaryLabel}>Aguardando</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.summaryValue}>{completedCheckouts.length}</Text>
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
        {checkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="exit-outline" size={64} color="#475569" />
            <Text style={styles.emptyTitle}>Nenhum check-out hoje</Text>
            <Text style={styles.emptyText}>Não há saídas previstas para hoje</Text>
          </View>
        ) : (
          <>
            {/* Pending */}
            {pendingCheckouts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Aguardando Check-out</Text>
                {pendingCheckouts.map((reservation, index) => {
                  const paymentStatus = getPaymentStatus(reservation);
                  return (
                    <View key={index} style={styles.checkoutCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.guestInfo}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {reservation.guest_name?.charAt(0)?.toUpperCase() || 'H'}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.guestName}>{reservation.guest_name}</Text>
                            <Text style={styles.roomNumber}>Quarto {reservation.room_number}</Text>
                          </View>
                        </View>
                        <View style={[styles.paymentBadge, { backgroundColor: `${paymentStatus.color}20` }]}>
                          <Text style={[styles.paymentText, { color: paymentStatus.color }]}>
                            {paymentStatus.text}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Total</Text>
                          <Text style={styles.financialValue}>{formatCurrency(reservation.total_amount)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Pago</Text>
                          <Text style={[styles.financialValue, { color: '#10B981' }]}>
                            {formatCurrency(reservation.paid_amount)}
                          </Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Pendente</Text>
                          <Text style={[styles.financialValue, { color: '#EF4444' }]}>
                            {formatCurrency((reservation.total_amount || 0) - (reservation.paid_amount || 0))}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>
                            {reservation.nights || 0} noites
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="enter-outline" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>
                            Check-in: {reservation.check_in_date?.substring(0, 10)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => handleCheckout(reservation)}
                        disabled={processingId === reservation.id}
                      >
                        {processingId === reservation.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="exit-outline" size={20} color="#FFF" />
                            <Text style={styles.checkoutButtonText}>Realizar Check-out</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}

            {/* Completed */}
            {completedCheckouts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Concluídos</Text>
                {completedCheckouts.map((reservation, index) => (
                  <View key={index} style={[styles.checkoutCard, styles.completedCard]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.guestInfo}>
                        <View style={[styles.avatar, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                          <Ionicons name="checkmark" size={20} color="#10B981" />
                        </View>
                        <View>
                          <Text style={[styles.guestName, { color: '#94A3B8' }]}>{reservation.guest_name}</Text>
                          <Text style={styles.roomNumber}>Quarto {reservation.room_number}</Text>
                        </View>
                      </View>
                      <View style={[styles.paymentBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <Text style={[styles.paymentText, { color: '#10B981' }]}>Concluído</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
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
  checkoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  completedCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  roomNumber: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
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
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CheckoutsScreen;
