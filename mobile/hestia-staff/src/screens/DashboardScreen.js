import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { dashboardService, reservationService, housekeepingService } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user, hotel, logout, hotelId } = useAuth();
  const [stats, setStats] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!hotelId) return;
    
    try {
      const [statsData, checkinsData, checkoutsData, tasksData] = await Promise.all([
        dashboardService.getStats(hotelId).catch(() => null),
        reservationService.getTodayCheckins(hotelId).catch(() => []),
        reservationService.getTodayCheckouts(hotelId).catch(() => []),
        housekeepingService.getMyTasks(user?.id, hotelId).catch(() => [])
      ]);
      
      setStats(statsData);
      setCheckins(checkinsData);
      setCheckouts(checkoutsData);
      setTasks(tasksData.filter(t => t.status !== 'completed'));
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, [hotelId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      <LinearGradient colors={['#151E32', '#0B1120']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.hotelName}>{hotel?.name || 'Hotel'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#F8FAFC" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.occupancy_rate || 0}%</Text>
            <Text style={styles.statLabel}>Ocupação</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkins.length || 0}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkouts.length || 0}</Text>
            <Text style={styles.statLabel}>Check-outs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasks.length || 0}</Text>
            <Text style={styles.statLabel}>Tarefas</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Checkins')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="enter-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Check-ins</Text>
            <Text style={styles.actionCount}>{checkins.length} pendentes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Checkouts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="exit-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionTitle}>Check-outs</Text>
            <Text style={styles.actionCount}>{checkouts.length} previstos</Text>
          </TouchableOpacity>
        </View>

        {/* My Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas Tarefas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyText}>Nenhuma tarefa pendente!</Text>
            </View>
          ) : (
            tasks.slice(0, 3).map((task, index) => (
              <TouchableOpacity key={index} style={styles.taskCard}>
                <View style={styles.taskInfo}>
                  <View style={[styles.taskPriority, { 
                    backgroundColor: task.priority === 'high' ? '#EF4444' : 
                                     task.priority === 'medium' ? '#F59E0B' : '#10B981' 
                  }]} />
                  <View>
                    <Text style={styles.taskRoom}>Quarto {task.room_number}</Text>
                    <Text style={styles.taskType}>{task.task_type}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Today's Check-ins */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Check-ins de Hoje</Text>
          </View>

          {checkins.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhum check-in hoje</Text>
            </View>
          ) : (
            checkins.slice(0, 3).map((reservation, index) => (
              <TouchableOpacity key={index} style={styles.reservationCard}>
                <View style={styles.reservationInfo}>
                  <Text style={styles.guestName}>{reservation.guest_name}</Text>
                  <Text style={styles.reservationDetails}>
                    Quarto {reservation.room_number} • {reservation.nights} noites
                  </Text>
                </View>
                <TouchableOpacity style={styles.checkinButton}>
                  <Text style={styles.checkinButtonText}>Check-in</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  hotelName: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutBtn: {
    padding: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  actionCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  seeAll: {
    fontSize: 14,
    color: '#D4AF37',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskPriority: {
    width: 4,
    height: 40,
    borderRadius: 2,
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
  reservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reservationInfo: {},
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  reservationDetails: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  checkinButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DashboardScreen;
