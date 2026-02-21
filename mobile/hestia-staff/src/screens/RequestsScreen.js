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
import { requestService } from '../services/api';

const PRIORITY_CONFIG = {
  urgent: { color: '#EF4444', label: 'Urgente', icon: 'alert-circle' },
  high: { color: '#F59E0B', label: 'Alta', icon: 'arrow-up-circle' },
  normal: { color: '#3B82F6', label: 'Normal', icon: 'remove-circle' },
  low: { color: '#10B981', label: 'Baixa', icon: 'arrow-down-circle' },
};

const SERVICE_ICONS = {
  room_service: 'restaurant-outline',
  spa: 'sparkles-outline',
  concierge: 'chatbubble-outline',
  transport: 'car-outline',
  laundry: 'shirt-outline',
  maintenance: 'construct-outline',
  housekeeping: 'bed-outline',
  minibar: 'wine-outline',
  default: 'help-circle-outline'
};

const RequestsScreen = ({ navigation }) => {
  const { hotelId, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, in_progress, all

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await requestService.getPendingRequests(hotelId);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      // Mock data for demo
      setRequests([
        {
          id: '1',
          room_number: '205',
          guest_name: 'João Silva',
          service_type: 'room_service',
          service_name: 'Room Service',
          notes: 'Café da manhã no quarto às 8h',
          priority: 'normal',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          room_number: '312',
          guest_name: 'Maria Santos',
          service_type: 'housekeeping',
          service_name: 'Arrumação',
          notes: 'Troca de toalhas extra',
          priority: 'high',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          room_number: '108',
          guest_name: 'Carlos Oliveira',
          service_type: 'maintenance',
          service_name: 'Manutenção',
          notes: 'Ar condicionado não está funcionando',
          priority: 'urgent',
          status: 'in_progress',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAccept = async (request) => {
    Alert.alert(
      'Aceitar Solicitação',
      `Deseja aceitar a solicitação de ${request.guest_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            try {
              await requestService.updateRequestStatus(request.id, 'in_progress');
              Alert.alert('Sucesso', 'Solicitação aceita!');
              loadRequests();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível aceitar a solicitação');
            }
          }
        }
      ]
    );
  };

  const handleComplete = async (request) => {
    Alert.alert(
      'Concluir Solicitação',
      `Deseja marcar a solicitação como concluída?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          onPress: async () => {
            try {
              await requestService.updateRequestStatus(request.id, 'completed');
              Alert.alert('Sucesso', 'Solicitação concluída!');
              loadRequests();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível concluir a solicitação');
            }
          }
        }
      ]
    );
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff}min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return `${Math.floor(diff / 1440)}d atrás`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitações</Text>
        <Text style={styles.headerSubtitle}>{requests.length} solicitações</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="hourglass-outline" size={20} color="#3B82F6" />
          <Text style={styles.statValue}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>Em Andamento</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[
          { key: 'pending', label: 'Pendentes' },
          { key: 'in_progress', label: 'Em Andamento' },
          { key: 'all', label: 'Todas' }
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyText}>Nenhuma solicitação pendente</Text>
          </View>
        ) : (
          filteredRequests.map((request, index) => {
            const priority = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.normal;
            const icon = SERVICE_ICONS[request.service_type] || SERVICE_ICONS.default;
            
            return (
              <View key={index} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.priorityBar, { backgroundColor: priority.color }]} />
                  
                  <View style={styles.serviceIcon}>
                    <Ionicons name={icon} size={24} color="#D4AF37" />
                  </View>
                  
                  <View style={styles.requestInfo}>
                    <View style={styles.requestTopRow}>
                      <Text style={styles.roomNumber}>Quarto {request.room_number}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: `${priority.color}20` }]}>
                        <Ionicons name={priority.icon} size={12} color={priority.color} />
                        <Text style={[styles.priorityText, { color: priority.color }]}>
                          {priority.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.serviceName}>{request.service_name}</Text>
                    <Text style={styles.guestName}>{request.guest_name}</Text>
                  </View>
                </View>

                {request.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>{request.notes}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color="#94A3B8" />
                    <Text style={styles.timeText}>{getTimeAgo(request.created_at)}</Text>
                  </View>

                  <View style={styles.actions}>
                    {request.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => handleAccept(request)}
                      >
                        <Ionicons name="hand-left-outline" size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Aceitar</Text>
                      </TouchableOpacity>
                    )}
                    {request.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleComplete(request)}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Concluir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  filterText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  filterTextActive: {
    color: '#D4AF37',
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityBar: {
    width: 4,
    height: '100%',
    minHeight: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 2,
  },
  guestName: {
    fontSize: 13,
    color: '#94A3B8',
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginLeft: 16,
  },
  notesText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default RequestsScreen;
