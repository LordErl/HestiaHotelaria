import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { reservationService } from '../services/api';

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', label: 'Pendente', icon: 'time-outline' },
  confirmed: { color: '#3B82F6', label: 'Confirmada', icon: 'checkmark-circle-outline' },
  checked_in: { color: '#10B981', label: 'Check-in', icon: 'enter-outline' },
  checked_out: { color: '#6B7280', label: 'Check-out', icon: 'exit-outline' },
  cancelled: { color: '#EF4444', label: 'Cancelada', icon: 'close-circle-outline' },
};

const ReservationsScreen = ({ navigation }) => {
  const { guest, reservation: currentReservation } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await reservationService.getGuestReservations(guest?.id);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const isCurrentReservation = (res) => {
    return res.id === currentReservation?.id;
  };

  const openDetail = (res) => {
    setSelectedReservation(res);
    setShowDetail(true);
  };

  const getUpcomingReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations.filter(r => {
      const checkIn = new Date(r.check_in_date);
      return checkIn >= today && r.status !== 'cancelled' && r.status !== 'checked_out';
    }).sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));
  };

  const getPastReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations.filter(r => {
      const checkOut = new Date(r.check_out_date);
      return checkOut < today || r.status === 'checked_out' || r.status === 'cancelled';
    }).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  };

  const upcomingReservations = getUpcomingReservations();
  const pastReservations = getPastReservations();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewBooking')}>
          <Ionicons name="add" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 100 }} />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
        >
          {/* Current/Upcoming Section */}
          {upcomingReservations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Próximas</Text>
              {upcomingReservations.map((res, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reservationCard,
                    isCurrentReservation(res) && styles.currentReservationCard
                  ]}
                  onPress={() => openDetail(res)}
                >
                  {isCurrentReservation(res) && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Atual</Text>
                    </View>
                  )}
                  
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.hotelName}>{res.hotel_name || 'Hotel'}</Text>
                      <Text style={styles.confirmationCode}>{res.confirmation_code}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusConfig(res.status).color}20` }]}>
                      <Ionicons name={getStatusConfig(res.status).icon} size={14} color={getStatusConfig(res.status).color} />
                      <Text style={[styles.statusText, { color: getStatusConfig(res.status).color }]}>
                        {getStatusConfig(res.status).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDates}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLabel}>Check-in</Text>
                      <Text style={styles.dateValue}>{formatDate(res.check_in_date)}</Text>
                    </View>
                    <View style={styles.dateArrow}>
                      <Ionicons name="arrow-forward" size={16} color="#D4AF37" />
                      <Text style={styles.nightsText}>{res.nights} noites</Text>
                    </View>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLabel}>Check-out</Text>
                      <Text style={styles.dateValue}>{formatDate(res.check_out_date)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.roomInfo}>
                      <Ionicons name="bed-outline" size={16} color="#94A3B8" />
                      <Text style={styles.roomText}>{res.room_type} • Quarto {res.room_number}</Text>
                    </View>
                    <Text style={styles.totalAmount}>
                      R$ {(res.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Past Section */}
          {pastReservations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Histórico</Text>
              {pastReservations.map((res, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.reservationCard, styles.pastCard]}
                  onPress={() => openDetail(res)}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.hotelName, { color: '#94A3B8' }]}>{res.hotel_name || 'Hotel'}</Text>
                      <Text style={styles.confirmationCode}>{res.confirmation_code}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusConfig(res.status).color}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusConfig(res.status).color }]}>
                        {getStatusConfig(res.status).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDates}>
                    <Text style={styles.pastDates}>
                      {formatDate(res.check_in_date)} - {formatDate(res.check_out_date)}
                    </Text>
                    <Text style={styles.pastNights}>{res.nights} noites</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Empty State */}
          {reservations.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#475569" />
              <Text style={styles.emptyTitle}>Nenhuma reserva</Text>
              <Text style={styles.emptyText}>Faça sua primeira reserva e aproveite sua estadia!</Text>
              <TouchableOpacity style={styles.newBookingButton} onPress={() => navigation.navigate('NewBooking')}>
                <Ionicons name="add" size={20} color="#0B1120" />
                <Text style={styles.newBookingText}>Nova Reserva</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Reservation Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        {selectedReservation && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Reserva</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Confirmation Code */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Código de Confirmação</Text>
                <Text style={styles.codeValue}>{selectedReservation.confirmation_code}</Text>
              </View>

              {/* Status */}
              <View style={[styles.detailRow, { backgroundColor: `${getStatusConfig(selectedReservation.status).color}10` }]}>
                <Ionicons name={getStatusConfig(selectedReservation.status).icon} size={24} color={getStatusConfig(selectedReservation.status).color} />
                <View>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusConfig(selectedReservation.status).color }]}>
                    {getStatusConfig(selectedReservation.status).label}
                  </Text>
                </View>
              </View>

              {/* Dates */}
              <View style={styles.datesRow}>
                <View style={styles.dateDetail}>
                  <Ionicons name="enter-outline" size={20} color="#10B981" />
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedReservation.check_in_date)}</Text>
                </View>
                <View style={styles.dateDetail}>
                  <Ionicons name="exit-outline" size={20} color="#EF4444" />
                  <Text style={styles.detailLabel}>Check-out</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedReservation.check_out_date)}</Text>
                </View>
              </View>

              {/* Room Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Acomodação</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="bed-outline" size={24} color="#94A3B8" />
                  <View>
                    <Text style={styles.detailLabel}>Tipo de Quarto</Text>
                    <Text style={styles.detailValue}>{selectedReservation.room_type}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="key-outline" size={24} color="#94A3B8" />
                  <View>
                    <Text style={styles.detailLabel}>Número do Quarto</Text>
                    <Text style={styles.detailValue}>{selectedReservation.room_number}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={24} color="#94A3B8" />
                  <View>
                    <Text style={styles.detailLabel}>Hóspedes</Text>
                    <Text style={styles.detailValue}>
                      {selectedReservation.adults} adulto(s){selectedReservation.children > 0 ? `, ${selectedReservation.children} criança(s)` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Pagamento</Text>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Total</Text>
                  <Text style={styles.paymentValue}>
                    R$ {(selectedReservation.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Pago</Text>
                  <Text style={[styles.paymentValue, { color: '#10B981' }]}>
                    R$ {(selectedReservation.paid_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {(selectedReservation.total_amount - selectedReservation.paid_amount) > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Pendente</Text>
                    <Text style={[styles.paymentValue, { color: '#F59E0B' }]}>
                      R$ {((selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetail(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  addButton: {
    padding: 8,
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
    marginTop: 8,
  },
  reservationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentReservationCard: {
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  currentBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0B1120',
  },
  pastCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hotelName: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  dateArrow: {
    alignItems: 'center',
  },
  nightsText: {
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 2,
  },
  pastDates: {
    fontSize: 14,
    color: '#94A3B8',
  },
  pastNights: {
    fontSize: 12,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
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
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  newBookingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1120',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  codeContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  dateDetail: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    gap: 4,
  },
  detailSection: {
    marginTop: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
});

export default ReservationsScreen;
