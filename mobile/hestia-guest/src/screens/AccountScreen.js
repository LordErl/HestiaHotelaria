import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AccountScreen = ({ navigation }) => {
  const { guest, reservation } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const response = await api.get(`/guest-portal/account/${guest?.id}`);
      setAccountData(response.data);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAccountData();
  };

  const formatCurrency = (value) => {
    return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'partial': return '#3B82F6';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'partial': return 'Parcial';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Conta</Text>
        <View style={{ width: 40 }} />
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
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet-outline" size={24} color="#D4AF37" />
              <Text style={styles.balanceTitle}>Saldo da Conta</Text>
            </View>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Total em Consumos</Text>
                <Text style={styles.balanceValue}>
                  {formatCurrency(accountData?.balance?.total_charges)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Total Pago</Text>
                <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                  {formatCurrency(accountData?.balance?.total_paid)}
                </Text>
              </View>
            </View>

            {(accountData?.balance?.pending || 0) > 0 && (
              <View style={styles.pendingAlert}>
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={styles.pendingText}>
                  Valor pendente: {formatCurrency(accountData?.balance?.pending)}
                </Text>
              </View>
            )}
          </View>

          {/* Current Stay Info */}
          {reservation && (
            <View style={styles.stayCard}>
              <Text style={styles.sectionTitle}>Estadia Atual</Text>
              <View style={styles.stayInfo}>
                <View style={styles.stayRow}>
                  <View style={styles.stayIcon}>
                    <Ionicons name="key-outline" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.stayDetail}>
                    <Text style={styles.stayLabel}>Quarto</Text>
                    <Text style={styles.stayValue}>{reservation.room_number || '---'}</Text>
                  </View>
                </View>

                <View style={styles.stayRow}>
                  <View style={styles.stayIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.stayDetail}>
                    <Text style={styles.stayLabel}>Período</Text>
                    <Text style={styles.stayValue}>
                      {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.stayRow}>
                  <View style={styles.stayIcon}>
                    <Ionicons name="receipt-outline" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.stayDetail}>
                    <Text style={styles.stayLabel}>Valor Total</Text>
                    <Text style={styles.stayValue}>
                      {formatCurrency(reservation.total_amount)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Transactions */}
          <Text style={styles.sectionTitle}>Histórico de Transações</Text>
          
          {(accountData?.transactions || []).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhuma transação</Text>
            </View>
          ) : (
            accountData?.transactions?.map((transaction, index) => (
              <View key={index} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === 'reservation' ? 'bed-outline' : 'cart-outline'}
                    size={24}
                    color="#94A3B8"
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDesc}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                </View>
                <View style={styles.transactionAmounts}>
                  <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(transaction.status)}20` }
                  ]}>
                    <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                      {getStatusText(transaction.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Guest Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Seu Histórico</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="bed-outline" size={24} color="#D4AF37" />
                <Text style={styles.statValue}>{accountData?.guest?.total_stays || 0}</Text>
                <Text style={styles.statLabel}>Estadias</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={24} color="#10B981" />
                <Text style={styles.statValue}>
                  {formatCurrency(accountData?.guest?.total_spent).replace('R$ ', '')}
                </Text>
                <Text style={styles.statLabel}>Total Gasto</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{accountData?.guest?.vip_status ? 'VIP' : 'Regular'}</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text-outline" size={22} color="#D4AF37" />
              <Text style={styles.actionText}>Solicitar Fatura</Text>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="card-outline" size={22} color="#D4AF37" />
              <Text style={styles.actionText}>Formas de Pagamento</Text>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="help-circle-outline" size={22} color="#D4AF37" />
              <Text style={styles.actionText}>Dúvidas sobre Cobrança</Text>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  stayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  stayInfo: {
    gap: 12,
  },
  stayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stayIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stayDetail: {
    flex: 1,
  },
  stayLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stayValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  actionsSection: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
  },
});

export default AccountScreen;
