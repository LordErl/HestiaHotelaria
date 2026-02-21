import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NewBookingScreen = ({ navigation }) => {
  const { guest, hotelId } = useAuth();
  const [step, setStep] = useState(1); // 1: Dates, 2: Room, 3: Review, 4: Confirmation
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  
  // Booking Data
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    if (step === 2) {
      loadAvailability();
    }
  }, [step]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/availability`, {
        params: { hotel_id: hotelId, check_in: checkIn, check_out: checkOut, adults, children }
      });
      setRoomTypes(response.data.room_types || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Erro', 'Não foi possível carregar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = selectedRoomType?.base_price || 0;
    return nights * basePrice;
  };

  const handleDateInput = (type, value) => {
    // Simple validation for YYYY-MM-DD format
    const cleaned = value.replace(/[^0-9-]/g, '');
    if (type === 'checkIn') {
      setCheckIn(cleaned);
    } else {
      setCheckOut(cleaned);
    }
  };

  const validateDates = () => {
    if (!checkIn || !checkOut) {
      Alert.alert('Atenção', 'Preencha as datas de check-in e check-out');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate < today) {
      Alert.alert('Atenção', 'A data de check-in deve ser a partir de hoje');
      return false;
    }

    if (checkOutDate <= checkInDate) {
      Alert.alert('Atenção', 'A data de check-out deve ser posterior ao check-in');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateDates()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!selectedRoomType) {
        Alert.alert('Atenção', 'Selecione um tipo de quarto');
        return;
      }
      setStep(3);
    }
  };

  const handleBooking = async () => {
    try {
      setLoading(true);
      const response = await api.post('/guest-portal/booking', {
        guest_id: guest?.id,
        hotel_id: hotelId,
        room_type_id: selectedRoomType.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children
      });

      if (response.data.success) {
        setConfirmationCode(response.data.confirmation_code);
        setStep(4);
      } else {
        Alert.alert('Erro', response.data.message || 'Erro ao criar reserva');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível criar a reserva');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Step 1: Select Dates
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Selecione as datas</Text>
        <Text style={styles.stepSubtitle}>Quando você deseja se hospedar?</Text>
      </View>

      <View style={styles.dateInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Check-in</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#475569"
              value={checkIn}
              onChangeText={(val) => handleDateInput('checkIn', val)}
              maxLength={10}
            />
          </View>
          <Text style={styles.inputHint}>Ex: 2026-03-15</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Check-out</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#475569"
              value={checkOut}
              onChangeText={(val) => handleDateInput('checkOut', val)}
              maxLength={10}
            />
          </View>
        </View>
      </View>

      {/* Guests */}
      <Text style={styles.sectionLabel}>Hóspedes</Text>
      <View style={styles.guestsRow}>
        <View style={styles.guestCounter}>
          <Text style={styles.guestLabel}>Adultos</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setAdults(Math.max(1, adults - 1))}
            >
              <Ionicons name="remove" size={20} color="#F8FAFC" />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{adults}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setAdults(adults + 1)}
            >
              <Ionicons name="add" size={20} color="#F8FAFC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.guestCounter}>
          <Text style={styles.guestLabel}>Crianças</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setChildren(Math.max(0, children - 1))}
            >
              <Ionicons name="remove" size={20} color="#F8FAFC" />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{children}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setChildren(children + 1)}
            >
              <Ionicons name="add" size={20} color="#F8FAFC" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // Step 2: Select Room
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Escolha seu quarto</Text>
        <Text style={styles.stepSubtitle}>
          {calculateNights()} noites • {adults} adulto(s){children > 0 ? `, ${children} criança(s)` : ''}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : roomTypes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bed-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>Nenhum quarto disponível para estas datas</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {roomTypes.map((roomType, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.roomCard,
                selectedRoomType?.id === roomType.id && styles.roomCardSelected
              ]}
              onPress={() => setSelectedRoomType(roomType)}
            >
              <View style={styles.roomImagePlaceholder}>
                <Ionicons name="bed-outline" size={40} color="#475569" />
              </View>
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{roomType.name}</Text>
                <Text style={styles.roomDescription}>{roomType.description || 'Conforto e elegância'}</Text>
                <View style={styles.roomFeatures}>
                  <View style={styles.featureItem}>
                    <Ionicons name="people-outline" size={14} color="#94A3B8" />
                    <Text style={styles.featureText}>Até {roomType.max_occupancy}</Text>
                  </View>
                </View>
                <Text style={styles.roomPrice}>
                  R$ {(roomType.base_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  <Text style={styles.priceNight}>/noite</Text>
                </Text>
              </View>
              {selectedRoomType?.id === roomType.id && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={20} color="#0B1120" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Step 3: Review
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Confirme sua reserva</Text>
        <Text style={styles.stepSubtitle}>Revise os detalhes antes de confirmar</Text>
      </View>

      <View style={styles.reviewCard}>
        {/* Hotel Info */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Acomodação</Text>
          <Text style={styles.reviewValue}>{selectedRoomType?.name}</Text>
        </View>

        {/* Dates */}
        <View style={styles.reviewDates}>
          <View style={styles.reviewDateBlock}>
            <Ionicons name="enter-outline" size={20} color="#10B981" />
            <Text style={styles.reviewDateLabel}>Check-in</Text>
            <Text style={styles.reviewDateValue}>{formatDateDisplay(checkIn)}</Text>
          </View>
          <View style={styles.reviewDateDivider}>
            <Ionicons name="arrow-forward" size={16} color="#D4AF37" />
            <Text style={styles.reviewNights}>{calculateNights()} noites</Text>
          </View>
          <View style={styles.reviewDateBlock}>
            <Ionicons name="exit-outline" size={20} color="#EF4444" />
            <Text style={styles.reviewDateLabel}>Check-out</Text>
            <Text style={styles.reviewDateValue}>{formatDateDisplay(checkOut)}</Text>
          </View>
        </View>

        {/* Guests */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Hóspedes</Text>
          <Text style={styles.reviewValue}>
            {adults} adulto(s){children > 0 ? `, ${children} criança(s)` : ''}
          </Text>
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              R$ {selectedRoomType?.base_price?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} x {calculateNights()} noites
            </Text>
            <Text style={styles.priceAmount}>
              R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Ao confirmar, você concorda com os termos e condições de reserva do hotel.
      </Text>
    </View>
  );

  // Step 4: Confirmation
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmationContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        <Text style={styles.confirmationTitle}>Reserva Confirmada!</Text>
        <Text style={styles.confirmationSubtitle}>Sua reserva foi criada com sucesso</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Código de Confirmação</Text>
          <Text style={styles.codeValue}>{confirmationCode}</Text>
        </View>

        <View style={styles.confirmationDetails}>
          <View style={styles.confirmationRow}>
            <Ionicons name="bed-outline" size={20} color="#94A3B8" />
            <Text style={styles.confirmationText}>{selectedRoomType?.name}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
            <Text style={styles.confirmationText}>
              {formatDateDisplay(checkIn)} - {formatDateDisplay(checkOut)}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Ionicons name="cash-outline" size={20} color="#94A3B8" />
            <Text style={styles.confirmationText}>
              R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Text style={styles.confirmationNote}>
          Um email de confirmação será enviado em breve. Você pode acompanhar sua reserva em "Minhas Reservas".
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 1 || step === 4) {
              navigation.goBack();
            } else {
              setStep(step - 1);
            }
          }}
        >
          <Ionicons name={step === 4 ? "close" : "arrow-back"} size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 4 ? 'Confirmação' : 'Nova Reserva'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      {step < 4 && (
        <View style={styles.progress}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressStep,
                s <= step && styles.progressStepActive
              ]}
            />
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Footer */}
      {step < 4 && (
        <View style={styles.footer}>
          {step === 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.buttonDisabled]}
              onPress={handleBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B1120" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#0B1120" />
                  <Text style={styles.nextButtonText}>Confirmar Reserva</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#0B1120" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 4 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.nextButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  progress: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#D4AF37',
  },
  scrollContent: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dateInputs: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#F8FAFC',
  },
  inputHint: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  guestsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  guestCounter: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  guestLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  roomCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  roomCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  roomImagePlaceholder: {
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
    padding: 16,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  roomFeatures: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  priceNight: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#94A3B8',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewSectionTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  reviewDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewDateBlock: {
    alignItems: 'center',
  },
  reviewDateLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  reviewDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  reviewDateDivider: {
    alignItems: 'center',
  },
  reviewNights: {
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 2,
  },
  priceBreakdown: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  priceAmount: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  disclaimer: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
  },
  codeBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  codeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  confirmationDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  confirmationNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  nextButton: {
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
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1120',
  },
});

export default NewBookingScreen;
