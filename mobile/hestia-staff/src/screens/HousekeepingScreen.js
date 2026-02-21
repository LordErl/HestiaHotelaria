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
import { roomService, housekeepingService } from '../services/api';

const STATUS_CONFIG = {
  available: { color: '#10B981', label: 'Disponível', icon: 'checkmark-circle' },
  occupied: { color: '#3B82F6', label: 'Ocupado', icon: 'person' },
  cleaning: { color: '#F59E0B', label: 'Limpeza', icon: 'sparkles' },
  maintenance: { color: '#EF4444', label: 'Manutenção', icon: 'construct' },
  blocked: { color: '#6B7280', label: 'Bloqueado', icon: 'close-circle' },
};

const HousekeepingScreen = ({ navigation }) => {
  const { hotelId, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms'); // rooms, tasks
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsData, tasksData] = await Promise.all([
        roomService.getRooms(hotelId).catch(() => []),
        housekeepingService.getTasks(hotelId).catch(() => [])
      ]);
      setRooms(roomsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading housekeeping data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRoomStatusChange = async (room, newStatus) => {
    try {
      await roomService.updateRoomStatus(room.id, newStatus);
      Alert.alert('Sucesso', `Quarto ${room.number} atualizado para ${STATUS_CONFIG[newStatus].label}`);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status do quarto');
    }
  };

  const showStatusOptions = (room) => {
    const options = Object.entries(STATUS_CONFIG)
      .filter(([key]) => key !== room.status)
      .map(([key, config]) => ({
        text: config.label,
        onPress: () => handleRoomStatusChange(room, key)
      }));

    Alert.alert(
      `Quarto ${room.number}`,
      'Selecione o novo status:',
      [...options, { text: 'Cancelar', style: 'cancel' }]
    );
  };

  const handleStartTask = async (task) => {
    try {
      await housekeepingService.startTask(task.id);
      Alert.alert('Sucesso', 'Tarefa iniciada!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a tarefa');
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      await housekeepingService.completeTask(task.id);
      Alert.alert('Sucesso', 'Tarefa concluída!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível concluir a tarefa');
    }
  };

  const filteredRooms = statusFilter === 'all'
    ? rooms
    : rooms.filter(r => r.status === statusFilter);

  const stats = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');

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
        <Text style={styles.headerTitle}>Housekeeping</Text>
        <Text style={styles.headerSubtitle}>{rooms.length} quartos</Text>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsContainer}>
          {Object.entries(stats).map(([status, count]) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statCard,
                statusFilter === status && styles.statCardActive
              ]}
              onPress={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <View style={[styles.statIcon, { backgroundColor: `${STATUS_CONFIG[status].color}20` }]}>
                <Ionicons name={STATUS_CONFIG[status].icon} size={20} color={STATUS_CONFIG[status].color} />
              </View>
              <Text style={styles.statCount}>{count}</Text>
              <Text style={styles.statLabel}>{STATUS_CONFIG[status].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rooms' && styles.tabActive]}
          onPress={() => setActiveTab('rooms')}
        >
          <Ionicons name="bed-outline" size={18} color={activeTab === 'rooms' ? '#D4AF37' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>Quartos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Ionicons name="list-outline" size={18} color={activeTab === 'tasks' ? '#D4AF37' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
            Tarefas ({pendingTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'rooms' ? (
          <>
            {filteredRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bed-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>Nenhum quarto encontrado</Text>
              </View>
            ) : (
              <View style={styles.roomsGrid}>
                {filteredRooms.map((room, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.roomCard, { borderColor: `${STATUS_CONFIG[room.status]?.color}40` }]}
                    onPress={() => showStatusOptions(room)}
                  >
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomNumber}>{room.number}</Text>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[room.status]?.color }]} />
                    </View>
                    <Text style={styles.roomType}>{room.type_name || 'Standard'}</Text>
                    <Text style={[styles.roomStatus, { color: STATUS_CONFIG[room.status]?.color }]}>
                      {STATUS_CONFIG[room.status]?.label}
                    </Text>
                    {room.guest_name && (
                      <Text style={styles.guestName}>{room.guest_name}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {pendingTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                <Text style={styles.emptyText}>Todas as tarefas concluídas!</Text>
              </View>
            ) : (
              pendingTasks.map((task, index) => (
                <View key={index} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.priorityBar, {
                      backgroundColor: task.priority === 'high' ? '#EF4444' :
                                       task.priority === 'medium' ? '#F59E0B' : '#10B981'
                    }]} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskRoom}>Quarto {task.room_number}</Text>
                      <Text style={styles.taskType}>{task.task_type_label || task.task_type}</Text>
                    </View>
                    <View style={[styles.taskStatusBadge, {
                      backgroundColor: task.status === 'in_progress' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                    }]}>
                      <Text style={[styles.taskStatusText, {
                        color: task.status === 'in_progress' ? '#3B82F6' : '#F59E0B'
                      }]}>
                        {task.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  {task.notes && <Text style={styles.taskNotes}>{task.notes}</Text>}
                  <View style={styles.taskActions}>
                    {task.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => handleStartTask(task)}
                      >
                        <Ionicons name="play" size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Iniciar</Text>
                      </TouchableOpacity>
                    )}
                    {task.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleCompleteTask(task)}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Concluir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
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
  statsScroll: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 40,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCardActive: {
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tabText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  tabTextActive: {
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
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roomType: {
    fontSize: 12,
    color: '#94A3B8',
  },
  roomStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  guestName: {
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskRoom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  taskType: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  taskStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskNotes: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 12,
    marginLeft: 16,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
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

export default HousekeepingScreen;
