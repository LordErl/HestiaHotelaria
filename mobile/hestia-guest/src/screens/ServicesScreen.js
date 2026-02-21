import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { servicesService } from '../services/api';

const SERVICES = [
  {
    id: 'room_service',
    name: 'Room Service',
    description: 'Refeições e bebidas no quarto',
    icon: 'restaurant-outline',
    color: '#F59E0B',
    available: '06:00 - 23:00'
  },
  {
    id: 'spa',
    name: 'Spa & Bem-estar',
    description: 'Massagens, tratamentos e sauna',
    icon: 'sparkles-outline',
    color: '#EC4899',
    available: '09:00 - 21:00'
  },
  {
    id: 'concierge',
    name: 'Concierge',
    description: 'Reservas, tours e recomendações',
    icon: 'chatbubble-outline',
    color: '#8B5CF6',
    available: '24 horas'
  },
  {
    id: 'transport',
    name: 'Transporte',
    description: 'Táxi, transfer e aluguel',
    icon: 'car-outline',
    color: '#10B981',
    available: '24 horas'
  },
  {
    id: 'laundry',
    name: 'Lavanderia',
    description: 'Lavagem e passadoria',
    icon: 'shirt-outline',
    color: '#3B82F6',
    available: '07:00 - 20:00'
  },
  {
    id: 'maintenance',
    name: 'Manutenção',
    description: 'Reparos e solicitações técnicas',
    icon: 'construct-outline',
    color: '#EF4444',
    available: '24 horas'
  },
  {
    id: 'housekeeping',
    name: 'Arrumação',
    description: 'Limpeza e troca de roupas',
    icon: 'bed-outline',
    color: '#06B6D4',
    available: '08:00 - 18:00'
  },
  {
    id: 'minibar',
    name: 'Minibar',
    description: 'Reposição de itens',
    icon: 'wine-outline',
    color: '#A855F7',
    available: '24 horas'
  },
];

const ServicesScreen = ({ navigation }) => {
  const { reservation, hotelId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await servicesService.getServiceRequests(reservation?.guest_id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestService = async (service) => {
    Alert.alert(
      service.name,
      `Deseja solicitar ${service.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: async () => {
            setSubmitting(true);
            try {
              await servicesService.requestService({
                hotel_id: hotelId,
                guest_id: reservation?.guest_id,
                room_number: reservation?.room_number,
                service_type: service.id,
                service_name: service.name,
                notes: ''
              });
              Alert.alert('Sucesso', 'Solicitação enviada com sucesso!');
              loadRequests();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível enviar a solicitação');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Serviços</Text>
        <Text style={styles.headerSubtitle}>Quarto {reservation?.room_number}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Services Grid */}
        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => requestService(service)}
              disabled={submitting}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
              <View style={styles.serviceAvailable}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.serviceAvailableText}>{service.available}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Requests */}
        <Text style={styles.sectionTitle}>Minhas Solicitações</Text>
        
        {loading ? (
          <ActivityIndicator color="#D4AF37" style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>Nenhuma solicitação</Text>
          </View>
        ) : (
          requests.map((request, index) => (
            <View key={index} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestName}>{request.service_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {getStatusText(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestTime}>
                {new Date(request.created_at).toLocaleString('pt-BR')}
              </Text>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  serviceAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceAvailableText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default ServicesScreen;
